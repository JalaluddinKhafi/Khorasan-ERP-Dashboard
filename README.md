# خراسان سیستم — امینی گروپ

سیستم مدیریت تجارت با نمایش دری و راست‌به‌چپ، وبسایت عمومی و داشبورد مدیر/کارمند. بک‌اند Java 17 و Spring Boot 3.5، دیتابیس MySQL 8.4 و مهاجرت‌های Flyway است. فرانت بدون نیاز به کتابخانهٔ CDN اجرا می‌شود و همراه فایل اجرایی بک‌اند بسته‌بندی شده است.

## اجرای محلی

نسخهٔ آماده در همین محیط روی http://localhost:8082 اجرا شده است.

- داشبورد: http://localhost:8082/dashboard/login.html
- وبسایت: http://localhost:8082/public-site/index.html
- نام کاربری اولیه: `admin`
- رمز اولیه: مقدار `ADMIN_PASSWORD` در فایل محلی `.env`؛ این فایل در Git قرار نمی‌گیرد.

برای اجرای دوباره در ویندوز به Java 17، Maven و Docker Desktop نیاز است:

```powershell
# فقط برای نصب جدید؛ فایل .env موجود را بازنویسی نکنید.
Copy-Item .env.example .env
# رمزهای نمونه را در .env به رمزهای اختصاصی تبدیل کنید.
.\scripts\start-local.ps1
```

اگر فایل اجرایی ساخته شده است، `-SkipBuild` را اضافه کنید. این اسکریپت فایل اجرایی را در کانتینر مستقل Docker اجرا می‌کند؛ بستن ترمینال یا پایان اجرای دستیار، برنامه را خاموش نمی‌کند. برنامه و دیتابیس دارای سیاست `restart: unless-stopped` هستند. MySQL روی `127.0.0.1:3307` و برنامه روی `127.0.0.1:8082` است. داده‌ها در volume به نام `mysql_data` نگهداری می‌شوند. برای توقف برنامه `docker compose stop app` و برای راه‌اندازی دوباره `docker compose start app` را اجرا کنید. اجرای `docker compose down` بدون `-v` داده‌ها را حذف نمی‌کند. برای بازگشت پس از روشن‌شدن کمپیوتر، Docker Desktop نیز باید فعال باشد.

اجرای همهٔ اجزا با Docker:

```powershell
docker compose up --build -d
```

اجرای Java محلی و اجرای Docker برنامه را هم‌زمان روی پورت 8080 راه‌اندازی نکنید. رمزهای دیتابیس پس از ایجاد volume با تغییر `.env` خودکار عوض نمی‌شوند؛ تغییر رمز دیتابیس باید داخل MySQL نیز انجام شود. رمز اولیهٔ مدیر فقط هنگام ساخت نخستین حساب استفاده می‌شود؛ پس از آن رمز حساب از صفحهٔ حساب‌های کاربری تغییر می‌کند.

## ✨ Features

### 🏢 Public Website (10 Pages - SEO Optimized)

| Page | Description |
|------|-------------|
| **Home** | Hero section, featured products/services, testimonials, contact |
| **About Us** | Company history, vision, mission, team members |
| **Products** | Product grid with search, category filters, details modal |
| **Services** | Service list with benefits section |
| **Blog** | Blog listing with categories, search, and tag cloud |
| **Blog Details** | Full article view with comments section |
| **Gallery** | Image gallery with lightbox and category filters |
| **Contact Us** | Contact form, Google Maps, company info |
| **FAQ** | Accordion-style frequently asked questions |
| **Privacy & Terms** | Legal pages |

### 📊 Admin Dashboard (13+ Pages)

| Module | Features |
|--------|----------|
| **Dashboard** | Statistics cards (12 metrics), 4 interactive charts (ApexCharts), top products, recent invoices, low stock alerts, activity timeline |
| **Products** | CRUD operations, image upload, search/filter, stock management |
| **Categories** | Tree structure with parent-child relationships |
| **Suppliers** | Complete profiles with transaction history |
| **Customers** | Full profiles, purchase history, payment history, balance tracking |
| **Purchases** | Create/edit invoices, dynamic product rows, auto-calculation, payment status |
| **Sales** | Product search, dynamic rows, stock validation, invoice printing |
| **Inventory** | Current stock, transaction history, low stock warnings |
| **Payments** | Customer/supplier payments, payment history |
| **Expenses** | Categorized expenses (rent, salary, electricity, transport, etc.) with charts |
| **Financial** | Cash flow, profit/loss statements, transaction history |
| **Reports** | 9 different report types with date filters and export options |
| **Users** | User management with roles (Admin/Employee) |
| **Website Management** | Pages, blog posts, slider, site settings |
| **Customer Balance** | Complete transaction history (debit/credit) with print/PDF/Excel export |

### 🎨 Design Features

- ✅ Modern Corporate Design
- ✅ Dark/Light Mode Toggle (persists via localStorage)
- ✅ Fully Responsive (Mobile, Tablet, Desktop)
- ✅ Persian (RTL) Support
- ✅ Professional Typography (Inter Font)
- ✅ Beautiful Cards and Tables
- ✅ Toast Notifications
- ✅ Confirmation Dialogs
- ✅ Loading and Empty States
- ✅ Form Validation

---

## 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| **HTML5** | Semantic structure |
| **CSS3** | Custom styling with CSS variables |
| **JavaScript (Vanilla)** | Modular logic, DOM manipulation, fetch API |
| **Bootstrap 5 (RTL)** | Responsive layout components |
| **Font Awesome 6** | Professional icons |
| **DataTables** | Advanced tables with search, sort, pagination |
| **ApexCharts** | Interactive and responsive charts |
| **SheetJS (XLSX)** | Excel export functionality |
| **html2pdf.js** | PDF generation |

---

## 📁 Project Structure
<img width="1672" height="941" alt="NoteGPT_Image_20260609170023" src="https://github.com/user-attachments/assets/81f2d55c-2c85-4414-9ec3-d8ecf0285f2c" />

---

## 📄 Pages

### Public Website (accessible to customers)

| File | Purpose |
|------|---------|
| `index.html` | Homepage with hero, products, services, testimonials |
| `about.html` | Company information and team |
| `products.html` | Product catalog with filters |
| `services.html` | Services offered |
| `blog.html` | Articles and news |
| `blog-details.html` | Single article view |
| `gallery.html` | Image gallery |
| `contact.html` | Contact form and map |
| `faq.html` | Frequently asked questions |
| `privacy.html` | Privacy policy |
| `terms.html` | Terms and conditions |

### Admin Dashboard (restricted access)

| File | Purpose |
|------|---------|
| `dashboard.html` | Main dashboard with stats and charts |
| `products.html` | Product management |
| `categories.html` | Category tree management |
| `suppliers.html` | Supplier management |
| `customers.html` | Customer management with balance |
| `purchases.html` | Purchase invoice management |
| `sales.html` | Sales invoice management |
| `inventory.html` | Stock and inventory tracking |
| `payments.html` | Payment tracking |
| `expenses.html` | Expense management |
| `financial-transactions.html` | Financial reports |
| `reports.html` | Various business reports |
| `users.html` | User management |
| `customer-balance.html` | Detailed customer balance statement |
| `receipts.html` | Payment receipts |
| `price-list.html` | Product price list |
| `website-management.html` | CMS for public site |

---

## 🚀 Getting Started

### Prerequisites

- Any modern web browser (Chrome, Firefox, Edge, Safari)
- Local server (recommended: VS Code Live Server)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JalaluddinKhafi/Khorasan-ERP-Dashboard

2. **Open with Live Server**

Using VS Code: Install "Live Server" extension

Right-click on dashboard/dashboard.html → "Open with Live Server"

Or use any HTTP server (Python, http-server, etc.)

3. **No build step required** - Pure HTML/CSS/JS!

### File Paths
Dashboard entry: dashboard/dashboard.html

Public site entry: public-site/index.html

CSS: assets/css/style.css

JavaScript modules: assets/js/
