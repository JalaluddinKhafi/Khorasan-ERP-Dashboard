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
