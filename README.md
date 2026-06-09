# 🚀 خراسان سیستم | Khorasan System - Enterprise Management Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=white)
![RTL](https://img.shields.io/badge/RTL-Supported-green)
![Responsive](https://img.shields.io/badge/Responsive-Yes-brightgreen)

> **A complete, production-ready Frontend system for managing Sales, Inventory, Purchases, Customer Balances, and Financial transactions.** Built specifically for Persian (RTL) businesses with a modern corporate design.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Pages](#-pages)
- [Getting Started](#-getting-started)
- [Backend Integration](#-backend-integration)
- [Screenshots](#-screenshots)
- [Author](#-author)
- [License](#-license)

---

## 🎯 Overview

**Khorasan System** is a comprehensive enterprise management platform designed for official company representative offices. It includes a **customer-facing website** (SEO optimized) and a **full-featured admin dashboard** for internal management.

### Key Capabilities:
- ✅ Manage Products, Categories, Suppliers, Customers
- ✅ Create Purchase and Sales Invoices with dynamic rows
- ✅ Track Inventory with low stock alerts
- ✅ Monitor Customer Balances (complete transaction history)
- ✅ Generate Financial Reports (Daily/Monthly/Yearly)
- ✅ Export Reports to PDF and Excel
- ✅ Print Professional Invoices with Company Letterhead

---

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
