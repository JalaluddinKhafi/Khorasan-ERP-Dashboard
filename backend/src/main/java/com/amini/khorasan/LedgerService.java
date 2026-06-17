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
