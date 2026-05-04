// ============================================
// کامپوننت‌های مشترک (سایدبار، هدر، و غیره)
// ============================================

function loadSidebarAndNavbar(activePage) {
    const sidebar = document.getElementById('sidebar');
    const navbar = document.querySelector('.top-navbar');
    
    if (!sidebar || !navbar) {
        console.error('Sidebar or Navbar element not found');
        return;
    }
    
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // مسیر لوگو
    const logoSrc = '../assets/images/logo2.png';
    
    // ========== سایدبار ==========
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="d-flex align-items-center justify-content-center w-100">
                <img src="${logoSrc}" alt="لوگو" class="sidebar-logo" 
                     style="width: 160px; height: auto; object-fit: contain; border-radius: 0;">
            </div>
            <button class="toggle-sidebar btn btn-sm btn-light d-md-none" onclick="toggleSidebar()">
                <i class="fas fa-bars"></i>
            </button>
        </div>
        <ul class="sidebar-nav">
            <li><a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}"><i class="fas fa-tachometer-alt"></i> <span>داشبورد</span></a></li>
            <li><a href="products.html" class="${activePage === 'products' ? 'active' : ''}"><i class="fas fa-boxes"></i> <span>مدیریت کالاها</span></a></li>
            <li><a href="categories.html" class="${activePage === 'categories' ? 'active' : ''}"><i class="fas fa-tags"></i> <span>دسته‌بندی</span></a></li>
            <li><a href="suppliers.html" class="${activePage === 'suppliers' ? 'active' : ''}"><i class="fas fa-truck"></i> <span>تامین‌کنندگان</span></a></li>
            <li><a href="customers.html" class="${activePage === 'customers' ? 'active' : ''}"><i class="fas fa-users"></i> <span>مشتریان</span></a></li>
            <li><a href="purchases.html" class="${activePage === 'purchases' ? 'active' : ''}"><i class="fas fa-shopping-cart"></i> <span>خرید</span></a></li>
            <li><a href="sales.html" class="${activePage === 'sales' ? 'active' : ''}"><i class="fas fa-chart-simple"></i> <span>فروش</span></a></li>
            <li><a href="inventory.html" class="${activePage === 'inventory' ? 'active' : ''}"><i class="fas fa-warehouse"></i> <span>انبار</span></a></li>
            <li><a href="payments.html" class="${activePage === 'payments' ? 'active' : ''}"><i class="fas fa-credit-card"></i> <span>پرداخت‌ها</span></a></li>
            <li><a href="expenses.html" class="${activePage === 'expenses' ? 'active' : ''}"><i class="fas fa-file-invoice-dollar"></i> <span>مصارف</span></a></li>
            <li><a href="financial-transactions.html" class="${activePage === 'financial' ? 'active' : ''}"><i class="fas fa-chart-pie"></i> <span>مالی</span></a></li>
            <li><a href="reports.html" class="${activePage === 'reports' ? 'active' : ''}"><i class="fas fa-chart-bar"></i> <span>گزارشات</span></a></li>
            <li><a href="users.html" class="${activePage === 'users' ? 'active' : ''}"><i class="fas fa-user-shield"></i> <span>کاربران</span></a></li>
            <li><a href="customer-balance.html" class="${activePage === 'balance' ? 'active' : ''}"><i class="fas fa-chart-line"></i> <span>بیلانس مشتری</span></a></li>
            <li><a href="receipts.html" class="${activePage === 'receipts' ? 'active' : ''}"><i class="fas fa-receipt"></i> <span>رسیدها</span></a></li>
            <li><a href="price-list.html" class="${activePage === 'price' ? 'active' : ''}"><i class="fas fa-list"></i> <span>لیست قیمت</span></a></li>
            <li class="mt-3"><hr class="mx-3 my-2" style="border-color: rgba(0,0,0,0.1);"></li>
            <li><a href="website-management.html" class="${activePage === 'website' ? 'active' : ''}"><i class="fas fa-globe"></i> <span>مدیریت وبسایت</span></a></li>
        </ul>
    `;
    
    // ========== هدر ==========
    navbar.innerHTML = `
        <div class="nav-right">
            <img src="${logoSrc}" alt="لوگو" class="navbar-logo" 
                 style="width: 40px; height: auto; object-fit: contain; border-radius: 0;">
            <button id="sidebarCollapse" class="btn btn-light hide-on-mobile" onclick="toggleSidebar()">
                <i class="fas fa-align-right"></i>
            </button>
            <button id="mobileMenuBtn" class="btn btn-light show-on-mobile" onclick="openSidebarOnMobile()">
                <i class="fas fa-bars"></i>
            </button>
            <div class="breadcrumb-custom" id="breadcrumb"></div>
        </div>
        <div class="nav-left">
            <button id="darkModeToggle" class="btn btn-light mode-toggle">
                <i class="fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>
            </button>
            <div class="dropdown">
                <button class="btn btn-light dropdown-toggle" data-bs-toggle="dropdown">
                    <i class="fas fa-bell"></i>
                    <span class="badge bg-danger">3</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#">📄 فاکتور جدید فروش ثبت شد</a></li>
                    <li><a class="dropdown-item" href="#">⚠️ کالای کم موجودی: لپ تاپ</a></li>
                    <li><a class="dropdown-item" href="#">💰 پرداخت جدید واریز شد</a></li>
                </ul>
            </div>
            <div class="dropdown">
                <button class="btn btn-light dropdown-toggle" data-bs-toggle="dropdown">
                    <i class="fas fa-user-circle"></i>
                    <span class="hide-on-mobile"> ادمین</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#"><i class="fas fa-user"></i> پروفایل</a></li>
                    <li><a class="dropdown-item" href="#"><i class="fas fa-cog"></i> تنظیمات</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#"><i class="fas fa-sign-out-alt"></i> خروج</a></li>
                </ul>
            </div>
        </div>
    `;
    
    // تنظیم breadcrumb
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        const pageNames = {
            'dashboard': 'داشبورد', 'products': 'مدیریت کالاها', 'categories': 'دسته‌بندی',
            'suppliers': 'تامین‌کنندگان', 'customers': 'مشتریان', 'purchases': 'خرید',
            'sales': 'فروش', 'inventory': 'انبار', 'payments': 'پرداخت‌ها',
            'expenses': 'مصارف', 'financial': 'مالی', 'reports': 'گزارشات',
            'users': 'کاربران', 'balance': 'بیلانس مشتری', 'receipts': 'رسیدها',
            'price': 'لیست قیمت', 'website': 'مدیریت وبسایت'
        };
        breadcrumb.innerHTML = '<span>' + (pageNames[activePage] || 'داشبورد') + '</span>';
    }
    
    // رویداد دارک‌مود
    const darkModeBtn = document.getElementById('darkModeToggle');
    if (darkModeBtn) {
        const newBtn = darkModeBtn.cloneNode(true);
        darkModeBtn.parentNode.replaceChild(newBtn, darkModeBtn);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleDarkMode();
        });
    }
    
    // بستن سایدبار در موبایل بعد از کلیک روی لینک
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 992) {
                closeSidebarOnMobile();
            }
        });
    });
    
    // اعمال تم
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateLogoForDarkMode(true);
    } else {
        document.body.classList.remove('dark-mode');
        updateLogoForDarkMode(false);
    }
}

function updateLogoForDarkMode(isDark) {
    const sidebarLogo = document.querySelector('.sidebar-logo');
    const navbarLogo = document.querySelector('.navbar-logo');
    
    if (sidebarLogo) {
        if (isDark) {
            sidebarLogo.style.filter = 'brightness(0) invert(1)';
        } else {
            sidebarLogo.style.filter = 'none';
        }
    }
    if (navbarLogo) {
        if (isDark) {
            navbarLogo.style.filter = 'brightness(0) invert(1)';
        } else {
            navbarLogo.style.filter = 'none';
        }
    }
}

function toggleDarkMode() {
    const isDark = !document.body.classList.contains('dark-mode');
    
    if (isDark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
    
    const darkBtn = document.getElementById('darkModeToggle');
    if (darkBtn) {
        darkBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
    
    updateLogoForDarkMode(isDark);
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        
        // تنظیم سایز لوگو در حالت جمع شده
        const sidebarLogo = document.querySelector('.sidebar-logo');
        if (sidebarLogo) {
            if (sidebar.classList.contains('collapsed')) {
                sidebarLogo.style.width = '50px';
                sidebarLogo.style.height = 'auto';
            } else {
                sidebarLogo.style.width = '160px';
                sidebarLogo.style.height = 'auto';
            }
        }
    }
}

function setBreadcrumb(items) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        if (typeof items === 'string') {
            breadcrumb.innerHTML = '<span>' + items + '</span>';
        } else {
            let html = '';
            for (let i = 0; i < items.length; i++) {
                if (i === items.length - 1) {
                    html += '<span>' + items[i] + '</span>';
                } else {
                    html += '<a href="' + items[i].link + '" class="text-muted">' + items[i].name + '</a> <i class="fas fa-chevron-left mx-1"></i> ';
                }
            }
            breadcrumb.innerHTML = html;
        }
    }
}

function openSidebarOnMobile() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.add('show');
    }
}

function closeSidebarOnMobile() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.remove('show');
    }
}