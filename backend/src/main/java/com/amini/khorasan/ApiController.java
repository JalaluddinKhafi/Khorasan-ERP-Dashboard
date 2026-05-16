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
        if (identifier == null) {
          values.put("opening_balance", opening);
          values.put("opening_date", openingDate);
        } else if (m.containsKey("opening_balance")) {
          var old = ledger.one(
            "SELECT opening_balance,opening_date FROM parties WHERE id=?",
            identifier
          );
          if (
            ((BigDecimal) old.get("opening_balance")).compareTo(opening) != 0 ||
            !old.get("opening_date").toString().equals(openingDate.toString())
          ) throw bad("باقی افتتاحیه پس از ثبت قابل تغییر نیست");
        }
        values.put("active", !Boolean.FALSE.equals(m.get("active")));
      }
      case "products" -> {
        values.put("code", required(m, "code", 60));
        values.put("name", required(m, "name", 180));
        values.put("unit", required(m, "unit", 40));
        values.put(
          "category_id",
          m.get("category_id") == null ||
            m.get("category_id").toString().isBlank()
            ? null
            : id(m, "category_id")
        );
        if (values.get("category_id") != null) {
          var category = ledger.one(
            "SELECT active FROM categories WHERE id=?",
            values.get("category_id")
          );
          boolean unchanged =
            identifier != null &&
            Objects.equals(
              ledger
                .one("SELECT category_id FROM products WHERE id=?", identifier)
                .get("category_id"),
              values.get("category_id")
            );
          if (
            !Boolean.TRUE.equals(category.get("active")) && !unchanged
          ) throw bad("دسته‌بندی انتخاب‌شده غیرفعال است");
        }
        values.put("image", image(m, "image"));
        values.put("barcode", text(m, "barcode", 100));
        values.put("description", text(m, "description", 2000));
        values.put("sale_price", nonnegative(m, "sale_price"));
        values.put("min_stock", nonnegative(m, "min_stock"));
        values.put("active", !Boolean.FALSE.equals(m.get("active")));
        if (identifier == null) {
          values.put("purchase_price", nonnegative(m, "purchase_price"));
          values.put("stock", nonnegative(m, "stock"));
        }
      }
      case "employees" -> {
        values.put("name", required(m, "name", 160));
        values.put("phone", text(m, "phone", 60));
        values.put("position", text(m, "position", 100));
        values.put("salary", nonnegative(m, "salary"));
        values.put("active", !Boolean.FALSE.equals(m.get("active")));
      }
      case "users" -> {
        String username = required(m, "username", 80);
        if (!username.matches("[A-Za-z0-9_.-]{3,80}")) throw bad(
          "نام کاربری حداقل سه حرف لاتین باشد"
        );
        values.put("username", username);
        values.put("name", required(m, "name", 160));
        var role = required(m, "role", 20);
        if (!Set.of("ADMIN", "EMPLOYEE").contains(role)) throw bad(
          "نقش نامعتبر است"
        );
        values.put("role", role);
        values.put("active", !Boolean.FALSE.equals(m.get("active")));
        if (identifier != null) {
          var old = ledger.one(
            "SELECT * FROM app_users WHERE id=?",
            identifier
          );
          if (
            old.get("username").equals(ledger.actor()) &&
            ((!role.equals("ADMIN") && old.get("role").equals("ADMIN")) ||
              Boolean.FALSE.equals(values.get("active")))
          ) throw bad("نقش و وضعیت حساب جاری را تغییر داده نمی‌توانید");
        }
        String pass = text(m, "password", 72);
        if (identifier == null || !pass.isBlank()) {
          if (pass.length() < 12) throw bad("رمز عبور حداقل ۱۲ حرف باشد");
          values.put("password", encoder.encode(pass));
        }
      }
      case "currencies" -> {
        String code = required(m, "code", 3).toUpperCase(Locale.ROOT);
        if (!code.matches("[A-Z]{3}")) throw bad("کد ارز سه حرف لاتین باشد");
        if (identifier != null && !identifier.equals(code)) throw bad(
          "کد ارز قابل تغییر نیست"
        );
        values.put("code", code);
        values.put("name", required(m, "name", 100));
        BigDecimal r;
        try {
          r = new BigDecimal(Objects.toString(m.get("rate")));
        } catch (Exception e) {
          throw bad("نرخ نامعتبر است");
        }
        if (
          r.signum() <= 0 ||
          r.scale() > 8 ||
          r.precision() > 20 ||
          (code.equals("USD") && r.compareTo(BigDecimal.ONE) != 0)
        ) throw bad("نرخ دالر همیشه یک است؛ نرخ فرعی باید مثبت باشد");
        values.put("rate", r);
        key = code;
      }
      case "content" -> {
        String kind = required(m, "kind", 30);
        if (
          !Set.of(
            "page",
            "blog",
            "gallery",
            "service",
            "faq",
            "slider"
          ).contains(kind)
        ) throw bad("نوع محتوا نامعتبر است");
        values.put("kind", kind);
        values.put("title", required(m, "title", 180));
        values.put("body", text(m, "body", 20000));
        values.put("image", image(m, "image"));
        values.put("published", Boolean.TRUE.equals(m.get("published")));
      }
    }
    if (identifier == null) {
      String cols = String.join(",", values.keySet());
      String marks = String.join(",", Collections.nCopies(values.size(), "?"));
      db.update(
        "INSERT INTO " + t + "(" + cols + ") VALUES(" + marks + ")",
        values.values().toArray()
      );
      if (!entity.equals("currencies")) key = ledger.inserted();
      if (
        entity.equals("products") &&
        ((BigDecimal) values.get("stock")).signum() > 0
      ) db.update(
        "INSERT INTO stock_movements(product_id,movement_date,quantity,notes) VALUES(?,?,?,?)",
        key,
        LocalDate.now(ZoneId.of("Asia/Kabul")),
        values.get("stock"),
        "موجودی افتتاحیه"
      );
    } else {
      var args = new ArrayList<>(values.values());
      args.add(identifier);
      db.update(
        "UPDATE " +
          t +
          " SET " +
          String.join(
            ",",
            values
              .keySet()
              .stream()
              .map(k -> k + "=?")
              .toList()
          ) +
          " WHERE " +
          pk +
          "=?",
        args.toArray()
      );
    }
    ledger.audit(
      (identifier == null ? "CREATE_" : "UPDATE_") + entity,
      entity.equals("currencies") ? 0 : Long.parseLong(key.toString())
    );
    var result = ledger.one("SELECT * FROM " + t + " WHERE " + pk + "=?", key);
    result.remove("password");
    return result;
  }

  @DeleteMapping(
    "/api/{entity:products|categories|customers|suppliers|employees|users|content}/{id}"
  )
  @Transactional
  Map<String, Boolean> delete(
    @PathVariable String entity,
    @PathVariable long id
  ) {
    String t = table(entity);
    var row = ledger.one("SELECT * FROM " + t + " WHERE id=? FOR UPDATE", id);
    if (
      entity.equals("users") && row.get("username").equals(ledger.actor())
    ) throw bad("حساب جاری حذف نمی‌شود");
    db.update("DELETE FROM " + t + " WHERE id=?", id);
    ledger.audit("DELETE_" + entity, id);
    return Map.of("ok", true);
  }

  @GetMapping("/api/invoices")
  List<Map<String, Object>> invoices(
    @RequestParam(defaultValue = "SALE") String kind
  ) {
    return db.queryForList(
      "SELECT i.*,p.name AS party_name,COALESCE((SELECT SUM(amount_usd) FROM payments WHERE invoice_id=i.id),0) AS paid_usd FROM invoices i JOIN parties p ON p.id=i.party_id WHERE i.kind=? ORDER BY i.id DESC",
      kind
    );
  }

  @GetMapping("/api/invoices/{id}")
  Map<String, Object> invoice(@PathVariable long id) {
    return ledger.invoiceDetails(id);
  }

  @PostMapping("/api/invoices")
  Map<String, Object> invoice(@RequestBody Map<String, Object> m) {
    return ledger.invoice(m);
  }

  @DeleteMapping("/api/invoices/{id}")
  Map<String, Boolean> voidInvoice(@PathVariable long id) {
    ledger.voidInvoice(id);
    return Map.of("ok", true);
  }

  @GetMapping("/api/payments")
  List<Map<String, Object>> payments() {
    return db.queryForList(
      "SELECT x.*,p.name AS party_name,p.kind FROM payments x JOIN parties p ON p.id=x.party_id ORDER BY x.id DESC"
    );
  }

  @PostMapping("/api/payments")
  Map<String, Object> payment(@RequestBody Map<String, Object> m) {
    return ledger.payment(m);
  }

  @GetMapping("/api/expenses")
  List<Map<String, Object>> expenses() {
    return db.queryForList(
      "SELECT x.*,e.name AS employee_name FROM expenses x LEFT JOIN employees e ON e.id=x.employee_id ORDER BY x.id DESC"
    );
  }

  @PostMapping("/api/expenses")
  Map<String, Object> expense(@RequestBody Map<String, Object> m) {
    return ledger.expense(m, false);
  }

  @PostMapping("/api/expenses/payroll")
  Map<String, Object> payroll(@RequestBody Map<String, Object> m) {
    return ledger.expense(m, true);
  }

  @GetMapping("/api/statement/{id}")
  Map<String, Object> statement(
    @PathVariable long id,
    @RequestParam(defaultValue = "2000-01-01") LocalDate from,
    @RequestParam(defaultValue = "2100-01-01") LocalDate to
  ) {
    return ledger.statement(id, from, to);
  }

  @GetMapping("/api/inventory/movements")
  List<Map<String, Object>> movements() {
    return db.queryForList(
      "SELECT s.*,p.name FROM stock_movements s JOIN products p ON p.id=s.product_id ORDER BY s.id DESC"
    );
  }

  @GetMapping("/api/messages")
  List<Map<String, Object>> messages() {
    return db.queryForList("SELECT * FROM messages ORDER BY id DESC");
  }

  @GetMapping("/api/audit")
  List<Map<String, Object>> audit() {
    return db.queryForList(
      "SELECT * FROM audit_log ORDER BY id DESC LIMIT 500"
    );
  }

  @GetMapping("/api/reports")
  Map<String, Object> reports(
    @RequestParam(defaultValue = "2000-01-01") LocalDate from,
    @RequestParam(defaultValue = "2100-01-01") LocalDate to
  ) {
    if (from.isAfter(to)) throw bad("بازهٔ تاریخ نادرست است");
    var sales = db.queryForObject(
      "SELECT COALESCE(SUM(total_usd),0) FROM invoices WHERE kind='SALE' AND voided=FALSE AND invoice_date BETWEEN ? AND ?",
      BigDecimal.class,
      from,
      to
    );
    var cost = db.queryForObject(
      "SELECT COALESCE(SUM(cost_usd),0) FROM invoices WHERE kind='SALE' AND voided=FALSE AND invoice_date BETWEEN ? AND ?",
      BigDecimal.class,
      from,
      to
    );
