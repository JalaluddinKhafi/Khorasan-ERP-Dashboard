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
