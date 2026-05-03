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