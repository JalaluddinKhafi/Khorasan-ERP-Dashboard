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