package com.amini.khorasan;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CatalogTests {

  @Autowired
  ApiController controller;

  @Autowired
  LedgerService ledger;

  @Autowired
  JdbcTemplate db;

  @Autowired
  MockMvc mvc;

  Map<String, Object> category(String name, Long parent) {
    var m = new HashMap<String, Object>();
    m.put("name", name + UUID.randomUUID());
    m.put("parent_id", parent);
    m.put("description", "توضیحات دسته");
    m.put("active", true);
    return controller.create("categories", m);
  }

  long id(Map<String, Object> row) {
    return ((Number) row.get("id")).longValue();
  }

  Map<String, Object> product(long category) {
    return new HashMap<>(
      Map.of(
        "code",
        "CAT-" + UUID.randomUUID(),
        "name",
        "جنس آزمایشی",
        "unit",
        "عدد",
        "category_id",
        category,
        "purchase_price",
        5,
        "sale_price",
        8,
        "stock",
        4,
        "min_stock",
        2
      )
    );
  }

  @Test
  void storesParentDescriptionAndStatus() {
    var root = category("اصلی", null);
    var child = category("فرعی", id(root));
    assertEquals(id(root), ((Number) child.get("parent_id")).longValue());
    assertEquals("توضیحات دسته", child.get("description"));
    assertEquals(true, child.get("active"));
  }

  @Test
  void rejectsSelfParent() {
    var root = category("اصلی", null);
    var update = new HashMap<>(root);
    update.put("parent_id", id(root));
    assertThrows(IllegalArgumentException.class, () ->
      controller.update("categories", "" + id(root), update)
    );
  }

  @Test
  void rejectsCycleAcrossThreeLevels() {
    var root = category("اصلی", null);
