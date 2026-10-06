# Implementation and verification

## Structure

- `dashboard/*.html`: dashboard routes and login, rendered by shared `assets/js/app.js`.
- `public-site/*.html`: public routes, rendered by `assets/js/public.js`.
- `assets/css/app.css`, `assets/js/theme.js`: design tokens, responsive layout, print styles and persisted theme.
- `assets/js/api-service.js`: same-origin API, CSRF, errors, formatting and CSV export. Failed requests never become fake success/data.
- `backend/src/main/java/com/amini/khorasan`: Spring Boot, Spring Security, JDBC, transactional ledger and validated API.
- `backend/src/main/resources/db/migration`: versioned MySQL schema; no production sample transactions.
- `scripts/e2e.cjs`: repeatable browser/integration workflow against a separate running QA instance.

## API

All request/response JSON uses database-style snake_case. Protected endpoints return 401 without authentication and 403 for insufficient permissions. Get `/api/csrf` before writes and include its returned `headerName`/`token` as a request header. Login is form-encoded `username`/`password` to `POST /api/login`; logout is `POST /api/logout`. Successful logout has no JSON body. Session cookies remain same-origin; no wildcard CORS is configured.

| Endpoint | Operations |
| --- | --- |
| `/api/me` | Current user, role and display name |
| `/api/dashboard` | Live counts, current-month sales/profit, low-stock and latest sales |
| `/api/products`, `/categories`, `/customers`, `/suppliers`, `/employees`, `/users`, `/content` | GET list, POST create, PUT `/{id}`, DELETE `/{id}` (admin; referenced records cannot be deleted) |
| `/api/currencies` | GET list, POST create, PUT `/{code}`; USD rate always 1 |
| `/api/invoices?kind=SALE` or `PURCHASE` | List invoices with linked payment total |
| `/api/invoices/{id}` | GET details/items; DELETE performs an audited reversal, not physical deletion |
| `/api/invoices` | POST: `request_key` UUID, `kind`, `party_id`, `invoice_date` ISO, `currency`, `rate`, `discount`, `notes`, `items:[{product_id,quantity,price}]` |
| `/api/payments` | GET list; POST UUID `request_key`, `party_id`, optional `invoice_id`, `payment_date`, `currency`, `rate`, `amount`, `notes` |
| `/api/expenses` | Admin GET list; POST UUID `request_key`, `expense_date`, `category`, `currency`, `rate`, `amount`, `notes` |
| `/api/expenses/payroll` | Admin POST expense fields plus `employee_id` and `salary_month` (`YYYY-MM`); duplicate employee/month rejected |
| `/api/statement/{partyId}?from=YYYY-MM-DD&to=YYYY-MM-DD` | Party, opening/closing USD balances, original currency/rate/amount and running balance rows |
| `/api/inventory/movements` | Auditable opening/purchase/sale/reversal movements |
| `/api/reports?from=...&to=...` | Admin sales, purchases, COGS, expenses, profit and received/paid cash |
| `/api/settings` | Admin GET/PUT company, contact, brands, terms, header/logo images as data URLs |
| `/api/messages`, `/api/audit` | Admin contact inbox and latest 500 audited operations |
| `/api/public/settings`, `/products`, `/content` | Public company details, active selling prices and published content only |
| `/api/public/contact` | Public POST contact form; still requires CSRF |

Customer/supplier create fields include `name`, `phone`, `address`, `active`, `opening_balance` (signed USD) and `opening_date`. Opening values cannot be changed after creation. Products store prices in USD and accept opening stock/cost only at creation. Inactive products/parties are excluded from new transactions.

## Verification performed

- 21 Spring integration tests: USD and AFN conversion, fixed historical rate, invoice/payment/statement, insufficient stock and rollback, concurrent overselling, duplicate invoice items, invoice retry idempotency, weighted purchase cost, invalid discount/quantity/rate, overpayment and party mismatch, invoice reversal safeguards, duplicate monthly payroll, prepayment and opening balances, anonymous access, employee restrictions, CSRF and disabled-user session revocation.
- Real MySQL 8.4 + Edge: create categories/products/parties/employees/users, purchase, AFN sale, linked AFN payment, payroll and expense, verify stock/cost/profit/statement, reject overpayment/overselling, upload header, invoice/print/statement layout, publish CMS article, submit contact and verify worker access restrictions.
- Every dashboard navigation route and all public routes loaded without JavaScript page errors; light/dark theme and mobile navigation inspected.
- Print media and uploaded company header inspected visually. CSV exports use a UTF-8 BOM and escape formula-leading cells.

QA data is isolated in `khorasan_qa`; operational `khorasan` remains free of test transactions. Original reference PDFs are unchanged. No production deployment or automatic import of historical balances was performed.

## Operational notes

Keep a backup of MySQL and `.env`. Do not use `docker compose down -v` on a database you need. The initial admin password must have at least 12 characters. When exposing the application through a server, configure HTTPS at the reverse proxy, enable secure session cookies and set `SERVER_ADDRESS` for that deployment. The Docker application listens within its container and publishes only to localhost by default.

## Dashboard and catalog update

Migration V3 adds product image/barcode/description and hierarchical category parent/description/status without replacing existing records. `/api/products/{id}` returns current details and category name; product lists include category names and category lists include parent names and direct product counts. The interface calculates branch totals including descendants. Cyclic parent relationships are rejected while holding category locks. Referenced categories cannot be deleted.

Dashboard now returns `latestPurchases` alongside the existing latest sales, and shows a welcome banner with a clock explicitly formatted for Asia/Kabul. Four quick actions open the corresponding forms or report page. Product filtering includes descendant categories, status, stock, text/barcode and ordering. Product details use a separate accessible dialog. Raster uploads are stored in MySQL and preserved by product editing.

Validation: 30 backend integration tests passed (21 ledger/security + 9 catalog). The catalog browser test passed on isolated MySQL, covering hierarchy and branch counts, cyclic parent rejection, image/barcode upload, product editing/details after search, combined filters, category deletion, live clock/shortcuts/three dashboard tables, and light/dark/mobile layouts. The full purchase/sale/payment/payroll/CMS browser workflow also passed after the shared editor refresh change. Test data is isolated in `khorasan_catalog_qa`. Production record counts are compared before/after the migration.

Run `npm run test:catalog` only against the disposable QA instance on port 8081. Live application URL remains http://localhost:8082/dashboard/dashboard.html.
