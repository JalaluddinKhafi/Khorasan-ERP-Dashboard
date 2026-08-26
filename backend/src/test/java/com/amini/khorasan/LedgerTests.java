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
