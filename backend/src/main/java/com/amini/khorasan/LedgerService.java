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
