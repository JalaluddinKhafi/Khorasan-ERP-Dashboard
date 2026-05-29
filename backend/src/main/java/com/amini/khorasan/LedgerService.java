package com.amini.khorasan;

import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LedgerService {

  final JdbcTemplate db;

  public LedgerService(JdbcTemplate db) {
    this.db = db;
  }

  static String text(Map<String, Object> m, String k, int max) {
    String s = Objects.toString(m.get(k), "").trim();
    if (s.length() > max) throw bad("متن بیش از حد طولانی است: " + k);
    return s;
  }

  static String required(Map<String, Object> m, String k, int max) {
    var s = text(m, k, max);
    if (s.isBlank()) throw bad("خانهٔ الزامی: " + k);
    return s;
  }

  static BigDecimal decimal(Map<String, Object> m, String k) {
    try {
      return new BigDecimal(Objects.toString(m.getOrDefault(k, 0))).setScale(
        4,
        RoundingMode.HALF_UP
      );
    } catch (Exception e) {
      throw bad("عدد نامعتبر: " + k);
    }
  }

  static BigDecimal nonnegative(Map<String, Object> m, String k) {
    var n = decimal(m, k);
    if (n.signum() < 0 || n.precision() > 19) throw bad(
      "مبلغ یا تعداد نامعتبر: " + k
    );
    return n;
  }

  static BigDecimal positive(Map<String, Object> m, String k) {
    var n = nonnegative(m, k);
    if (n.signum() == 0) throw bad("مقدار باید بیشتر از صفر باشد: " + k);
    return n;
  }

  static long id(Map<String, Object> m, String k) {
    try {
      return Long.parseLong(m.get(k).toString());
    } catch (Exception e) {
      throw bad("شناسهٔ نامعتبر: " + k);
    }
  }

  static LocalDate date(Map<String, Object> m, String k) {
    try {
      return LocalDate.parse(required(m, k, 10));
    } catch (Exception e) {
      throw bad("تاریخ نامعتبر است");
    }
  }

  static IllegalArgumentException bad(String s) {
    return new IllegalArgumentException(s);
  }

  Map<String, Object> one(String sql, Object... args) {
    var rows = db.queryForList(sql, args);
    if (rows.isEmpty()) throw bad("رکورد یافت نشد");
    return rows.get(0);
  }

  long inserted() {
    return db.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
  }

  String requestKey(Map<String, Object> m) {
    String key = required(m, "request_key", 36);
    try {
      UUID.fromString(key);
    } catch (Exception e) {
      throw bad("شناسهٔ درخواست نامعتبر است");
    }
    return key;
  }

  String actor() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    return auth == null ? "system" : auth.getName();
  }

  void audit(String action, long id) {
    db.update(
      "INSERT INTO audit_log(actor,action,entity_id) VALUES(?,?,?)",
      actor(),
      action,
      id
    );
  }

  BigDecimal rate(Map<String, Object> m) {
    String c = required(m, "currency", 3);
    one("SELECT code FROM currencies WHERE code=?", c);
    if (c.equals("USD")) return BigDecimal.ONE;
    try {
      var n = new BigDecimal(Objects.toString(m.get("rate")));
      if (n.signum() <= 0 || n.scale() > 8 || n.precision() > 20) throw bad(
        "نرخ نامعتبر"
      );
      return n;
    } catch (Exception e) {
      throw bad("تعداد واحد ارز فرعی در برابر یک دالر را وارد کنید");
    }
  }

  BigDecimal usd(BigDecimal amount, BigDecimal rate) {
    return amount.divide(rate, 4, RoundingMode.HALF_UP);
  }

  @SuppressWarnings("unchecked")
  public Map<String, Object> invoice(Map<String, Object> m) {
    String requestKey = requestKey(m);
    var existing = db.queryForList(
      "SELECT id FROM invoices WHERE request_key=?",
      requestKey
    );
    if (!existing.isEmpty()) return invoiceDetails(
      ((Number) existing.get(0).get("id")).longValue()
    );
    String kind = required(m, "kind", 20);
    if (!Set.of("SALE", "PURCHASE").contains(kind)) throw bad(
      "نوع فاکتور نامعتبر است"
    );
    long party = id(m, "party_id");
    var p = one(
      "SELECT * FROM parties WHERE id=? AND active=TRUE FOR UPDATE",
      party
    );
    if (
      !p.get("kind").equals(kind.equals("SALE") ? "CUSTOMER" : "SUPPLIER")
    ) throw bad("مشتری یا تهیه‌کننده با نوع فاکتور سازگار نیست");
    var day = date(m, "invoice_date");
    var rate = rate(m);
    String currency = required(m, "currency", 3);
    if (
      !(m.get("items") instanceof List<?> raw) ||
      raw.isEmpty() ||
      raw.size() > 200
    ) throw bad("حداقل یک قلم و حداکثر ۲۰۰ قلم انتخاب کنید");
    List<Map<String, Object>> items = (List<Map<String, Object>>) m.get(
      "items"
    );
    // Lock in stable order to avoid deadlocks; duplicate lines are rejected.
    var ids = items
      .stream()
      .map(i -> id(i, "product_id"))
      .sorted()
      .toList();
    if (new HashSet<>(ids).size() != ids.size()) throw bad(
      "هر جنس را تنها یک بار اضافه کنید"
    );
    Map<Long, Map<String, Object>> products = new HashMap<>();
    for (long productId : ids)
      products.put(
        productId,
        one(
          "SELECT * FROM products WHERE id=? AND active=TRUE FOR UPDATE",
          productId
        )
      );
    BigDecimal subtotal = BigDecimal.ZERO,
      cost = BigDecimal.ZERO;
    for (var i : items) {
      var product = products.get(id(i, "product_id"));
      var q = positive(i, "quantity");
      var price = nonnegative(i, "price");
      if (
        kind.equals("SALE") &&
        ((BigDecimal) product.get("stock")).compareTo(q) < 0
      ) throw bad("موجودی کافی نیست: " + product.get("name"));
      subtotal = subtotal.add(
        q.multiply(price).setScale(4, RoundingMode.HALF_UP)
      );
      cost = cost.add(q.multiply((BigDecimal) product.get("purchase_price")));
    }
    var discount = nonnegative(m, "discount");
    if (discount.compareTo(subtotal) > 0) throw bad("تخفیف بیشتر از مجموع است");
    var total = subtotal.subtract(discount);
    db.update(
      "INSERT INTO invoices(request_key,kind,party_id,invoice_date,currency,rate,subtotal,discount,total,total_usd,cost_usd,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
      requestKey,
      kind,
      party,
      day,
      currency,
      rate,
      subtotal,
      discount,
      total,
      usd(total, rate),
      cost,
      text(m, "notes", 1000),
      actor()
    );
    long invoiceId = inserted();
    for (var i : items) {
      long productId = id(i, "product_id");
      var pdt = products.get(productId);
      var q = positive(i, "quantity");
      var price = nonnegative(i, "price");
      var delta = kind.equals("SALE") ? q.negate() : q;
      db.update(
        "INSERT INTO invoice_items(invoice_id,product_id,name,unit,quantity,price,cost_price,total) VALUES(?,?,?,?,?,?,?,?)",
        invoiceId,
        productId,
        pdt.get("name"),
        pdt.get("unit"),
        q,
        price,
        pdt.get("purchase_price"),
        q.multiply(price).setScale(4, RoundingMode.HALF_UP)
      );
      if (kind.equals("PURCHASE")) {
        var oldStock = (BigDecimal) pdt.get("stock");
        var oldCost = (BigDecimal) pdt.get("purchase_price");
        var average = oldStock
          .multiply(oldCost)
          .add(
            q
              .multiply(usd(price, rate))
              .multiply(
                subtotal.signum() == 0
                  ? BigDecimal.ONE
                  : total.divide(subtotal, 12, RoundingMode.HALF_UP)
              )
          )
          .divide(oldStock.add(q), 4, RoundingMode.HALF_UP);
        db.update(
          "UPDATE products SET purchase_price=? WHERE id=?",
          average,
          productId
        );
      }
      db.update(
        "UPDATE products SET stock=stock+? WHERE id=?",
        delta,
        productId
      );
      db.update(
        "INSERT INTO stock_movements(product_id,invoice_id,movement_date,quantity,notes) VALUES(?,?,?,?,?)",
        productId,
        invoiceId,
        day,
        delta,
        kind
      );
    }
    audit("CREATE_" + kind, invoiceId);
    return invoiceDetails(invoiceId);
  }

  public Map<String, Object> invoiceDetails(long id) {
    var row = one(
      "SELECT i.*,p.name AS party_name,p.phone,p.address FROM invoices i JOIN parties p ON p.id=i.party_id WHERE i.id=?",
      id
    );
    row.put(
      "items",
      db.queryForList(
        "SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY id",
        id
      )
    );
    row.put(
      "paid_usd",
      db.queryForObject(
        "SELECT COALESCE(SUM(amount_usd),0) FROM payments WHERE invoice_id=?",
        BigDecimal.class,
        id
      )
    );
    return row;
  }

  public Map<String, Object> payment(Map<String, Object> m) {
    String requestKey = requestKey(m);
    var existing = db.queryForList(
      "SELECT * FROM payments WHERE request_key=?",
      requestKey
    );
    if (!existing.isEmpty()) return existing.get(0);
    long party = id(m, "party_id");
    one("SELECT id FROM parties WHERE id=? AND active=TRUE FOR UPDATE", party);
    var amount = positive(m, "amount");
    var rate = rate(m);
    Long invoice =
      m.get("invoice_id") == null || m.get("invoice_id").toString().isBlank()
        ? null
        : id(m, "invoice_id");
    if (invoice != null) {
      var i = one(
        "SELECT * FROM invoices WHERE id=? AND voided=FALSE FOR UPDATE",
        invoice
      );
      if (((Number) i.get("party_id")).longValue() != party) throw bad(
        "فاکتور متعلق به این حساب نیست"
      );
      var paid = db.queryForObject(
        "SELECT COALESCE(SUM(amount_usd),0) FROM payments WHERE invoice_id=?",
        BigDecimal.class,
        invoice
      );
      if (
        paid.add(usd(amount, rate)).compareTo((BigDecimal) i.get("total_usd")) >
        0
      ) throw bad("پرداخت از باقی فاکتور بیشتر است");
    }
    db.update(
      "INSERT INTO payments(request_key,party_id,invoice_id,payment_date,currency,rate,amount,amount_usd,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)",
      requestKey,
      party,
      invoice,
      date(m, "payment_date"),
      m.get("currency"),
      rate,
      amount,
      usd(amount, rate),
      text(m, "notes", 1000),
      actor()
    );
    long pid = inserted();
    audit("PAYMENT", pid);
    return one("SELECT * FROM payments WHERE id=?", pid);
  }

  public Map<String, Object> expense(Map<String, Object> m, boolean payroll) {
    String requestKey = requestKey(m);
    var existing = db.queryForList(
      "SELECT * FROM expenses WHERE request_key=?",
      requestKey
    );
    if (!existing.isEmpty()) return existing.get(0);
    var amount = positive(m, "amount");
    var rate = rate(m);
    Long employee = null;
    String month = null,
      category = required(m, "category", 100);
    if (payroll) {
      employee = id(m, "employee_id");
      one(
        "SELECT id FROM employees WHERE id=? AND active=TRUE FOR UPDATE",
        employee
      );
      month = required(m, "salary_month", 7);
      try {
        YearMonth.parse(month);
      } catch (Exception e) {
        throw bad("ماه معاش نامعتبر است");
      }
      category = "معاش";
    }
    db.update(
      "INSERT INTO expenses(request_key,expense_date,category,currency,rate,amount,amount_usd,notes,employee_id,salary_month,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      requestKey,
      date(m, "expense_date"),
      category,
      m.get("currency"),
      rate,
      amount,
      usd(amount, rate),
      text(m, "notes", 1000),
      employee,
      month,
      actor()
    );
    long eid = inserted();
    audit(payroll ? "PAYROLL" : "EXPENSE", eid);
    return one("SELECT * FROM expenses WHERE id=?", eid);
  }

  public Map<String, Object> statement(
    long party,
    LocalDate from,
    LocalDate to
  ) {
    if (from.isAfter(to)) throw bad("بازهٔ تاریخ نادرست است");
    var p = one("SELECT * FROM parties WHERE id=?", party);
    String union =
      "SELECT opening_date AS entry_date, 'OPENING' AS kind,id AS reference,CASE WHEN opening_balance>0 THEN opening_balance ELSE 0 END AS debit,CASE WHEN opening_balance<0 THEN -opening_balance ELSE 0 END AS credit,'باقی افتتاحیه' AS notes,'USD' AS currency,CAST(1 AS DECIMAL(20,8)) AS rate,opening_balance AS original_amount FROM parties WHERE id=? AND opening_balance<>0 UNION ALL SELECT invoice_date AS entry_date, 'INVOICE' AS kind,id AS reference,total_usd AS debit,CAST(0 AS DECIMAL(20,4)) AS credit,notes,currency,rate,total AS original_amount FROM invoices WHERE party_id=? AND voided=FALSE UNION ALL SELECT payment_date,'PAYMENT',id,0,amount_usd,notes,currency,rate,amount FROM payments WHERE party_id=?";
    var opening = db.queryForObject(
      "SELECT COALESCE(SUM(debit-credit),0) FROM (" +
        union +
        ") ledger WHERE entry_date<?",
      BigDecimal.class,
      party,
      party,
      party,
      from
    );
    var rows = db.queryForList(
      "SELECT * FROM (" +
        union +
        ") ledger WHERE entry_date BETWEEN ? AND ? ORDER BY entry_date,CASE kind WHEN 'OPENING' THEN 0 WHEN 'INVOICE' THEN 1 ELSE 2 END,reference",
      party,
      party,
      party,
      from,
      to
    );
    var balance = opening;
    for (var r : rows) {
      balance = balance
        .add((BigDecimal) r.get("debit"))
        .subtract((BigDecimal) r.get("credit"));
      r.put("balance", balance);
    }
    return Map.of(
      "party",
      p,
      "opening",
      opening,
      "closing",
      balance,
      "rows",
      rows,
      "from",
      from,
      "to",
      to
    );
  }

  public void voidInvoice(long id) {
    var i = one("SELECT * FROM invoices WHERE id=? FOR UPDATE", id);
    if (Boolean.TRUE.equals(i.get("voided"))) throw bad(
      "این فاکتور قبلاً لغو شده است"
    );
    if (
      db.queryForObject(
        "SELECT COUNT(*) FROM payments WHERE invoice_id=?",
        Integer.class,
        id
      ) > 0
    ) throw bad("فاکتور دارای پرداخت است؛ ابتدا با مدیر مالی تصفیه کنید");
    var items = db.queryForList(
      "SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY product_id",
      id
    );
    for (var item : items) {
      long pid = ((Number) item.get("product_id")).longValue();
      var p = one("SELECT * FROM products WHERE id=? FOR UPDATE", pid);
      var q = (BigDecimal) item.get("quantity");
      var delta = i.get("kind").equals("SALE") ? q : q.negate();
