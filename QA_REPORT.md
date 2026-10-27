# گزارش بررسی فرانت‌اند مرکز و نمایندگی

تاریخ: ۲۰۲۶/۱۰/۲۸

- ۱۲ آزمون منطق، ذخیره‌سازی، صلاحیت‌ها و حساب معاش/قرض: موفق.
- ۱۷ سناریوی قبلی مرورگر: موفق.
- ۱۱ سناریوی جدید مرکز، نمایندگی، ورود و کارمندان: موفق.
- ۳۴ صفحه در عرض‌های ۳۶۰، ۷۶۸ و ۱۴۴۰ پیکسل: ۱۰۲ بررسی موفق.
- صفحات تجاریِ نمایندگی تازه با دادهٔ خالی بررسی شدند؛ اطلاعات مرکز در آن‌ها نمایش داده نشد.
- نمایش بخش کارمندان با رکورد واقعی آزمایشی در موبایل و دسکتاپ بررسی شد.
- فیش معاش PDF، خروجی گزارش PDF/Excel، پرداخت معاش و قرض از رابط کاربری آزموده شدند.
- بررسی نهایی خطای جاوااسکریپت، فایل محلی مفقود، شناسهٔ تکراری و سرریز افقی صفحه در اندازه‌های آزموده‌شده را نشان نداد.
- زبان جدول‌ها همزمان از فایل محلی بارگذاری می‌شود تا بازسازی زودهنگام جدول به خطای initialization نرسد.
- `git diff --check`: موفق.

## سناریوهای جدید

- Central creates branch and its administrator through UI: PASS
- New branch business pages are empty and do not inherit central data: PASS
- Central can create staff in a branch and branch data persists: PASS
- Branch login has only own organization and cannot edit admin credentials: PASS
- Branch admin creates an employee login but cannot grant admin role: PASS
- Loans, payroll deductions, duplicate control and cash repayment work: PASS
- Attendance upserts one entry and salary PDF downloads: PASS
- Employee operates own business but cannot access HR, users or other branches: PASS
- Central retains all branch control and center staff remain independent: PASS
- Employee management remains usable on mobile and desktop: PASS
- No unexpected JavaScript errors during organization workflows: PASS

## محدوده و محدودیت

این‌ها آزمون‌های فرانت‌اند در Microsoft Edge با context آزمایشی جدا هستند و اطلاعات مرورگر عادی کاربر را تغییر نمی‌دهند. داده‌های مرکز حفظ شده‌اند؛ نمایندگی‌ها فضای دادهٔ مستقل دارند. کنترل نهایی نقش، رمز عبور، مالکیت نمایندگی و تراکنش مالی باید بعداً در Spring Boot پیاده‌سازی شود. مخفی‌کردن صفحات و کنترل سرویس جاوااسکریپت جایگزین امنیت سرور نیست. نقشهٔ Google به اینترنت نیاز دارد.

راهنمای نقش‌ها و کارمندان در ORGANIZATIONS.md و راهنمای اجرا در FRONTEND.md است.
