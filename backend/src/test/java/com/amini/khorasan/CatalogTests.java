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
    var child = category("فرعی", id(root));
    var leaf = category("نهایی", id(child));
    var update = new HashMap<>(root);
    update.put("parent_id", id(leaf));
    assertThrows(IllegalArgumentException.class, () ->
      controller.update("categories", "" + id(root), update)
    );
  }

  @Test
  void countsProductsAndExposesParentName() {
    var root = category("اصلی", null);
    var child = category("فرعی", id(root));
    controller.create("products", product(id(child)));
    var listed = controller
      .list("categories")
      .stream()
      .filter(c -> id(c) == id(child))
      .findFirst()
      .orElseThrow();
    assertEquals(1, ((Number) listed.get("product_count")).intValue());
    assertEquals(root.get("name"), listed.get("parent_name"));
  }

  @Test
  void persistsProductImageBarcodeDescriptionAndCategory() throws Exception {
    var root = category("اصلی", null);
    var m = product(id(root));
    String img =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
    m.put("image", img);
    m.put("barcode", "1234567890123");
    m.put("description", "توضیحات کامل جنس");
    var p = controller.create("products", m);
    var details = controller.productDetails(id(p));
    assertEquals(img, details.get("image"));
    assertEquals("1234567890123", details.get("barcode"));
    assertEquals("توضیحات کامل جنس", details.get("description"));
    assertEquals(root.get("name"), details.get("category_name"));
    mvc
      .perform(get("/api/products/" + id(p)).with(user("admin").roles("ADMIN")))
      .andExpect(status().isOk())
      .andExpect(jsonPath("barcode").value("1234567890123"));
  }

  @Test
  void rejectsNewProductInInactiveCategory() {
    var root = category("اصلی", null);
    var update = new HashMap<>(root);
    update.put("active", false);
    controller.update("categories", "" + id(root), update);
    assertThrows(IllegalArgumentException.class, () ->
      controller.create("products", product(id(root)))
    );
  }

  @Test
  void rejectsNonRasterProductImages() {
    var root = category("اصلی", null);
    var p = product(id(root));
    p.put("image", "data:image/svg+xml;base64,PHN2Zy8+");
