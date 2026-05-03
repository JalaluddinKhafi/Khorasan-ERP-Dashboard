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