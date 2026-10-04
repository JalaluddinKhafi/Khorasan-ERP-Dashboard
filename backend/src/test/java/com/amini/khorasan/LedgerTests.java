package com.amini.khorasan;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class LedgerTests {

  @Autowired
  LedgerService ledger;

  @Autowired
  JdbcTemplate db;

  @Autowired
  MockMvc mvc;

  long customer, supplier, product, employee;

  @BeforeEach
  void setup() {
    db.update("DELETE FROM app_users WHERE username<>'admin'");
    db.update(
      "INSERT INTO app_users(username,password,name,role) VALUES('worker','test-hash','Worker','EMPLOYEE')"
    );
    for (String table : List.of(
      "stock_movements",
      "payments",
      "invoice_items",
      "invoices",
      "expenses",
      "employees",
      "products",
      "parties",
      "audit_log"
    ))
      db.update("DELETE FROM " + table);
    db.update("DELETE FROM currencies WHERE code<>'USD'");
    db.update("INSERT INTO currencies VALUES('AFN','افغانی',70)");
    db.update(
      "INSERT INTO parties(kind,name) VALUES('CUSTOMER','مشتری آزمایشی')"
    );
    customer = ledger.inserted();
    db.update(
      "INSERT INTO parties(kind,name) VALUES('SUPPLIER','تهیه‌کننده آزمایشی')"
    );
    supplier = ledger.inserted();
    db.update(
      "INSERT INTO products(code,name,unit,purchase_price,sale_price,stock,min_stock) VALUES('TEST','پروفیل','شاخه',5,10,10,2)"
    );
    product = ledger.inserted();
    db.update("INSERT INTO employees(name,salary) VALUES('کارمند',100)");
    employee = ledger.inserted();
  }

  Map<String, Object> invoice(
    String kind,
    int qty,
    String currency,
    String rate,
    String price
  ) {
    return new HashMap<>(
      Map.of(
        "request_key",
        UUID.randomUUID().toString(),
        "kind",
        kind,
        "party_id",
        kind.equals("SALE") ? customer : supplier,
        "invoice_date",
        "2026-10-26",
        "currency",
        currency,
        "rate",
        rate,
        "discount",
        0,
        "items",
        List.of(Map.of("product_id", product, "quantity", qty, "price", price))
      )
    );
  }

  Map<String, Object> payment(long party, String amount) {
    return new HashMap<>(
      Map.of(
        "request_key",
        UUID.randomUUID().toString(),
        "party_id",
        party,
        "payment_date",
        "2026-10-26",
        "currency",
        "AFN",
        "rate",
        70,
        "amount",
        amount
      )
    );
  }

  BigDecimal stock() {
    return db.queryForObject(
      "SELECT stock FROM products WHERE id=?",
      BigDecimal.class,
      product
    );
  }

  @Test
  void saleAndPaymentUseSnapshotRate() {
    var i = ledger.invoice(invoice("SALE", 2, "AFN", "70", "700"));
    assertEquals(
      0,
      new BigDecimal("20").compareTo((BigDecimal) i.get("total_usd"))
    );
    assertEquals(0, new BigDecimal("8").compareTo(stock()));
    var p = payment(customer, "700");
    p.put("invoice_id", i.get("id"));
    ledger.payment(p);
    db.update("UPDATE currencies SET rate=80 WHERE code='AFN'");
    var s = ledger.statement(
      customer,
      java.time.LocalDate.of(2026, 1, 1),
      java.time.LocalDate.of(2026, 12, 31)
    );
    assertEquals(
      0,
      new BigDecimal("10").compareTo((BigDecimal) s.get("closing"))
    );
  }

  @Test
  void insufficientStockRollsBack() {
    assertThrows(IllegalArgumentException.class, () ->
      ledger.invoice(invoice("SALE", 11, "USD", "1", "10"))
    );
    assertEquals(0, new BigDecimal("10").compareTo(stock()));
    assertEquals(
      0,
      db.queryForObject("SELECT COUNT(*) FROM invoices", Integer.class)
    );
  }

  @Test
  void duplicateItemsAreRejected() {
    var m = invoice("SALE", 1, "USD", "1", "10");
    m.put(
      "items",
      Collections.nCopies(
        2,
        Map.of("product_id", product, "quantity", 1, "price", 10)
      )
    );
    assertThrows(IllegalArgumentException.class, () -> ledger.invoice(m));
  }

  @Test
  void purchaseRecalculatesWeightedCost() {
    ledger.invoice(invoice("PURCHASE", 10, "AFN", "70", "700"));
    assertEquals(0, new BigDecimal("20").compareTo(stock()));
    assertEquals(
      0,
      new BigDecimal("7.5").compareTo(
        db.queryForObject(
          "SELECT purchase_price FROM products WHERE id=?",
          BigDecimal.class,
          product
        )
      )
    );
  }

  @Test
  void invoiceOverpaymentIsRejected() {
    var i = ledger.invoice(invoice("SALE", 1, "USD", "1", "10"));
    var p = payment(customer, "701");
    p.put("invoice_id", i.get("id"));
    assertThrows(IllegalArgumentException.class, () -> ledger.payment(p));
  }

  @Test
  void cannotPayAnotherPartyInvoice() {
    var i = ledger.invoice(invoice("SALE", 1, "USD", "1", "10"));
    var p = payment(supplier, "700");
    p.put("invoice_id", i.get("id"));
    assertThrows(IllegalArgumentException.class, () -> ledger.payment(p));
  }

  @Test
  void usdRateAlwaysOne() {
    var i = ledger.invoice(invoice("SALE", 1, "USD", "999", "10"));
    assertEquals(0, BigDecimal.ONE.compareTo((BigDecimal) i.get("rate")));
  }

  @Test
  void invalidDiscountAndNegativeQuantityAreRejected() {
    var i = invoice("SALE", 1, "USD", "1", "10");
    i.put("discount", 11);
    assertThrows(IllegalArgumentException.class, () -> ledger.invoice(i));
    assertThrows(IllegalArgumentException.class, () ->
      ledger.invoice(invoice("SALE", -1, "USD", "1", "10"))
    );
  }

  @Test
  void zeroRateIsRejected() {
    assertThrows(IllegalArgumentException.class, () ->
      ledger.invoice(invoice("SALE", 1, "AFN", "0", "700"))
    );
  }

  @Test
  void voidSaleRestoresStock() {
    var i = ledger.invoice(invoice("SALE", 2, "USD", "1", "10"));
    ledger.voidInvoice(((Number) i.get("id")).longValue());
    assertEquals(0, new BigDecimal("10").compareTo(stock()));
    assertThrows(IllegalArgumentException.class, () ->
      ledger.voidInvoice(((Number) i.get("id")).longValue())
    );
  }

  @Test
  void paidInvoiceCannotBeVoided() {
    var i = ledger.invoice(invoice("SALE", 1, "USD", "1", "10"));
    var p = payment(customer, "700");
    p.put("invoice_id", i.get("id"));
    ledger.payment(p);
    assertThrows(IllegalArgumentException.class, () ->
      ledger.voidInvoice(((Number) i.get("id")).longValue())
    );
  }

  @Test
  void cannotVoidPurchaseAfterLaterMovement() {
    var i = ledger.invoice(invoice("PURCHASE", 2, "USD", "1", "10"));
    ledger.invoice(invoice("SALE", 1, "USD", "1", "10"));
    assertThrows(IllegalArgumentException.class, () ->
      ledger.voidInvoice(((Number) i.get("id")).longValue())
    );
  }

  @Test
  void payrollDuplicateIsRejected() {
    var p = new HashMap<String, Object>(
      Map.of(
        "request_key",
        UUID.randomUUID().toString(),
        "employee_id",
        employee,
        "salary_month",
        "2026-10",
        "expense_date",
        "2026-10-26",
        "currency",
        "USD",
        "amount",
        100,
        "category",
        "معاش"
      )
    );
    ledger.expense(p, true);
    p.put("request_key", UUID.randomUUID().toString());
    assertThrows(
      org.springframework.dao.DataIntegrityViolationException.class,
      () -> ledger.expense(p, true)
    );
    assertEquals(
      1,
      db.queryForObject("SELECT COUNT(*) FROM expenses", Integer.class)
    );
  }

  @Test
  void statementOpeningAndPrepayment() {
    ledger.payment(payment(customer, "700"));
    var s = ledger.statement(
      customer,
      java.time.LocalDate.of(2026, 11, 1),
      java.time.LocalDate.of(2026, 12, 31)
    );
    assertEquals(
      0,
      new BigDecimal("-10").compareTo((BigDecimal) s.get("opening"))
    );
  }

  @Test
  void anonymousCannotAccessPrivateData() throws Exception {
    mvc.perform(get("/api/products")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/public/products")).andExpect(status().isOk());
  }

  @Test
  void employeeCannotManageUsersOrPayroll() throws Exception {
    mvc
      .perform(get("/api/users").with(user("worker").roles("EMPLOYEE")))
      .andExpect(status().isForbidden());
    mvc
      .perform(
        post("/api/expenses/payroll")
          .with(user("worker").roles("EMPLOYEE"))
          .with(csrf())
          .contentType("application/json")
          .content("{}")
      )
      .andExpect(status().isForbidden());
  }

  @Test
  void retryInvoiceDoesNotDuplicateStockMovement() {
    var request = invoice("SALE", 2, "USD", "1", "10");
    var a = ledger.invoice(request);
    var b = ledger.invoice(request);
    assertEquals(a.get("id"), b.get("id"));
    assertEquals(0, new BigDecimal("8").compareTo(stock()));
  }

  @Test
  void openingBalanceAppearsInStatement() {
    db.update(
      "UPDATE parties SET opening_balance=123,opening_date='2026-01-01' WHERE id=?",
      customer
    );
    var s = ledger.statement(
      customer,
      java.time.LocalDate.of(2026, 2, 1),
      java.time.LocalDate.of(2026, 12, 31)
    );
    assertEquals(
      0,
      new BigDecimal("123").compareTo((BigDecimal) s.get("opening"))
    );
  }

  @Test
  void disabledUserSessionIsRevoked() throws Exception {
    var session = new org.springframework.mock.web.MockHttpSession();
    mvc
      .perform(
        get("/api/products")
          .session(session)
          .with(user("worker").roles("EMPLOYEE"))
      )
      .andExpect(status().isOk());
    db.update("UPDATE app_users SET active=FALSE WHERE username='worker'");
    mvc
      .perform(
        get("/api/products")
          .session(session)
          .with(user("worker").roles("EMPLOYEE"))
      )
      .andExpect(status().isUnauthorized());
  }

  @Test
  void writesRequireCsrf() throws Exception {
    mvc
      .perform(
        post("/api/products")
          .with(user("admin").roles("ADMIN"))
          .contentType("application/json")
          .content("{}")
      )
      .andExpect(status().isForbidden());
  }

  @Test
  void concurrentSalesCannotOversell() throws Exception {
    var pool = Executors.newFixedThreadPool(2);
    try {
      var tasks = List.<Callable<Boolean>>of(
        () -> {
          try {
            ledger.invoice(invoice("SALE", 8, "USD", "1", "10"));
            return true;
          } catch (IllegalArgumentException e) {
            return false;
          }
        },
        () -> {
          try {
            ledger.invoice(invoice("SALE", 8, "USD", "1", "10"));
            return true;
          } catch (IllegalArgumentException e) {
            return false;
          }
        }
      );
      var results = pool.invokeAll(tasks);
      assertEquals(
        1,
        results
          .stream()
          .filter(f -> {
            try {
              return f.get();
            } catch (Exception e) {
              throw new RuntimeException(e);
            }
          })
          .count()
      );
      assertEquals(0, new BigDecimal("2").compareTo(stock()));
    } finally {
      pool.shutdownNow();
    }
  }
}
