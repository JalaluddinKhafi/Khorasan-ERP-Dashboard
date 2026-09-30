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
