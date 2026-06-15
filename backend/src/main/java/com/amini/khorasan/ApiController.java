package com.amini.khorasan;

import static com.amini.khorasan.LedgerService.*;

import java.math.*;
import java.security.Principal;
import java.time.*;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

@RestController
public class ApiController {

  final JdbcTemplate db;
  final LedgerService ledger;
  final PasswordEncoder encoder;

  ApiController(
    JdbcTemplate db,
    LedgerService ledger,
    PasswordEncoder encoder
  ) {
    this.db = db;
    this.ledger = ledger;
    this.encoder = encoder;
  }

  @GetMapping("/")
  RedirectView home() {
    return new RedirectView("/public-site/index.html");
  }

  @GetMapping("/api/csrf")
  Map<String, String> csrf(CsrfToken token) {
    return Map.of(
      "token",
      token.getToken(),
      "headerName",
      token.getHeaderName()
    );
  }

  @GetMapping("/api/me")
  Map<String, Object> me(Principal p) {
    return ledger.one(
      "SELECT id,username,name,role FROM app_users WHERE username=?",
      p.getName()
    );
  }

  @GetMapping("/api/settings")
  Map<String, Object> settings() {
    return ledger.one("SELECT * FROM settings WHERE id=1");
  }

  @PutMapping("/api/settings")
  @Transactional
  Map<String, Object> settings(@RequestBody Map<String, Object> m) {
    String header = image(m, "header_image"),
      logo = image(m, "logo_image");
    db.update(
      "UPDATE settings SET company_name=?,phone=?,address=?,brands=?,terms=?,header_image=?,logo_image=? WHERE id=1",
      required(m, "company_name", 160),
      text(m, "phone", 100),
      text(m, "address", 500),
      text(m, "brands", 500),
      text(m, "terms", 1000),
      header,
      logo
    );
    ledger.audit("SETTINGS", 1);
    return settings();
  }

  static String image(Map<String, Object> m, String key) {
    String s = text(m, key, 4000000);
    if (
      !s.isBlank() &&
      !s.matches("^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=\\r\\n]+$")
    ) throw bad("تصویر باید PNG، JPEG یا WebP باشد");
    return s;
  }

  static final Set<String> ENTITIES = Set.of(
    "products",
    "categories",
    "customers",
    "suppliers",
    "employees",
    "users",
    "currencies",
    "content"
  );

  String table(String entity) {
    if (!ENTITIES.contains(entity)) throw bad("بخش یافت نشد");
    return switch (entity) {
      case "customers", "suppliers" -> "parties";
      case "users" -> "app_users";
      default -> entity;
    };
  }

  @GetMapping(
    "/api/{entity:products|categories|customers|suppliers|employees|users|currencies|content}"
  )
  List<Map<String, Object>> list(@PathVariable String entity) {
    String t = table(entity);
    return switch (entity) {
      case "products" -> db.queryForList(
        "SELECT p.*,c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.id DESC"
      );
      case "categories" -> db.queryForList(
        "SELECT c.*,p.name AS parent_name,(SELECT COUNT(*) FROM products x WHERE x.category_id=c.id) AS product_count FROM categories c LEFT JOIN categories p ON p.id=c.parent_id ORDER BY c.name,c.id"
      );
      case "users" -> db.queryForList(
        "SELECT id,username,name,role,active FROM app_users ORDER BY id DESC"
      );
      case "customers", "suppliers" -> db.queryForList(
        "SELECT p.*,p.opening_balance+COALESCE((SELECT SUM(total_usd) FROM invoices WHERE party_id=p.id AND voided=FALSE),0)-COALESCE((SELECT SUM(amount_usd) FROM payments WHERE party_id=p.id),0) AS balance FROM parties p WHERE kind=? ORDER BY id DESC",
        entity.equals("customers") ? "CUSTOMER" : "SUPPLIER"
      );
      case "currencies" -> db.queryForList(
        "SELECT * FROM currencies ORDER BY code"
      );
      default -> db.queryForList("SELECT * FROM " + t + " ORDER BY id DESC");
    };
  }

  @PostMapping(
    "/api/{entity:products|categories|customers|suppliers|employees|users|currencies|content}"
  )
  @Transactional
  Map<String, Object> create(
    @PathVariable String entity,
    @RequestBody Map<String, Object> m
  ) {
    return save(entity, null, m);
  }

  @PutMapping(
    "/api/{entity:products|categories|customers|suppliers|employees|users|currencies|content}/{id}"
  )
  @Transactional
  Map<String, Object> update(
    @PathVariable String entity,
    @PathVariable String id,
    @RequestBody Map<String, Object> m
  ) {
    return save(entity, id, m);
  }

  Map<String, Object> save(
    String entity,
    String identifier,
    Map<String, Object> m
  ) {
    String t = table(entity),
      pk = entity.equals("currencies") ? "code" : "id";
    Object key = identifier;
    if (entity.equals("categories")) db.queryForList(
      "SELECT id FROM categories ORDER BY id FOR UPDATE"
    );
    if (identifier != null) ledger.one(
      "SELECT " + pk + " FROM " + t + " WHERE " + pk + "=? FOR UPDATE",
      identifier
    );
    var values = new LinkedHashMap<String, Object>();
    switch (entity) {
      case "categories" -> {
        values.put("name", required(m, "name", 160));
        Long parent =
          m.get("parent_id") == null || m.get("parent_id").toString().isBlank()
            ? null
            : id(m, "parent_id");
        Set<Long> visited = new HashSet<>();
        if (identifier != null) visited.add(Long.parseLong(identifier));
        Long cursor = parent;
        while (cursor != null) {
          if (!visited.add(cursor)) throw bad(
            "دسته نمی‌تواند والد خودش یا یکی از والدهای بالاتر خود باشد"
          );
          var ancestor = ledger.one(
            "SELECT parent_id FROM categories WHERE id=?",
            cursor
          );
          cursor =
            ancestor.get("parent_id") == null
              ? null
              : ((Number) ancestor.get("parent_id")).longValue();
        }
        values.put("parent_id", parent);
        values.put("description", text(m, "description", 1000));
        values.put("active", !Boolean.FALSE.equals(m.get("active")));
      }
      case "customers", "suppliers" -> {
        values.put(
          "kind",
          entity.equals("customers") ? "CUSTOMER" : "SUPPLIER"
        );
        values.put("name", required(m, "name", 160));
        values.put("phone", text(m, "phone", 60));
        values.put("address", text(m, "address", 500));
        var opening = decimal(m, "opening_balance");
        if (opening.precision() > 19) throw bad("باقی افتتاحیه نامعتبر است");
        var openingDate = m.containsKey("opening_date")
          ? date(m, "opening_date")
          : LocalDate.of(2000, 1, 1);
