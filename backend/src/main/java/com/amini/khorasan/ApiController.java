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
