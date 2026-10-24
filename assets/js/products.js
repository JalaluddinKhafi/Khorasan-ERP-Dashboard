// داده‌های نمونه محصولات
let productsData = [];
let productsTable = null;
let currentProductId = null;
let deleteProductId = null;

// بارگذاری داده‌های نمونه
function loadProducts() {
    productsData = FrontendStore.read('products', DemoData.products);
    renderProductsTable();
}

// رندر جدول محصولات
function renderProductsTable(rows = productsData) {
    FrontendStore.write('products', productsData);
    destroyDataTable('productsTable');
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    tbody.innerHTML = rows.map(p => `
        <tr>
            <td>${escapeHTML(p.code)}</td>
            <td>
                <img src="${safeImageURL(p.image || '../assets/images/placeholders/41fb5cde7b47.svg')}"
                     width="50" height="50" style="object-fit: cover; border-radius: 8px;">
            </td>
            <td>${escapeHTML(p.name)}</td>
            <td>${escapeHTML(p.category)}</td>
            <td>${p.purchasePrice.toLocaleString()} تومان</td>
            <td class="text-primary fw-bold">${p.salePrice.toLocaleString()} تومان</td>
            <td>${escapeHTML(p.unit)}</td>
            <td class="${p.stock <= p.minStock ? 'text-danger fw-bold' : ''}">${p.stock}</td>
            <td>
                <span class="badge ${p.status === 'موجود' ? 'bg-success' : (p.status === 'در راه' ? 'bg-warning' : 'bg-danger')}">
                    ${escapeHTML(p.status)}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-info view-product" data-id="${p.id}" title="جزئیات">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary edit-product" data-id="${p.id}" title="ویرایش">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-product" data-id="${p.id}" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // راه‌اندازی DataTable

    $('#productsTable').off('draw.dt.khorasan').on('draw.dt.khorasan', attachProductEvents);
    productsTable = $('#productsTable').DataTable({
        language: window.PersianTableLanguage,
        pageLength: 10,
        searching: false,
        ordering: true,
        columnDefs: [
            { orderable: false, targets: [1, 9] }
        ]
    });

    attachProductEvents();

}

// اتصال رویدادها به دکمه‌ها
function attachProductEvents() {
    document.querySelectorAll('.view-product').forEach(btn => {
        btn.onclick = () => viewProductDetails(parseInt(btn.dataset.id));
    });
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.onclick = () => editProduct(parseInt(btn.dataset.id));
    });
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.onclick = () => showDeleteModal(parseInt(btn.dataset.id), btn.closest('tr').querySelector('td:nth-child(3)').innerText);
    });
}

// فیلترها
function setupFilters() {
    const searchInput = document.getElementById('searchProductInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const resetBtn = document.getElementById('resetFiltersBtn');

    if (searchInput) {
        searchInput.addEventListener('keyup', filterProducts);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterProducts);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (statusFilter) statusFilter.value = '';
            filterProducts();
        });
    }
}

function filterProducts() {
    const searchTerm = document.getElementById('searchProductInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';

    const filtered = productsData.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm) || p.code.toLowerCase().includes(searchTerm);
        const matchCategory = !category || p.category === category;
        const matchStatus = !status || p.status === status;
        return matchSearch && matchCategory && matchStatus;
    });
    renderProductsTable(filtered);
}

function viewProductDetails(id) {
    const product = productsData.find(p => p.id === id);
    if (!product) return;

    const profit = product.salePrice - product.purchasePrice;
    const profitPercent = ((profit / product.purchasePrice) * 100).toFixed(1);

    const detailsHtml = `
        <div class="row">
            <div class="col-md-4 text-center">
                <img src="${safeImageURL(product.image || '../assets/images/placeholders/12b0216ae8bc.svg')}"
                     class="img-fluid rounded mb-3" style="max-height: 200px;">
            </div>
            <div class="col-md-8">
                <table class="table table-bordered">
                    <tr><th style="width: 40%">کد کالا</th><td>${escapeHTML(product.code)}</td></tr>
                    <tr><th>نام کالا</th><td>${escapeHTML(product.name)}</td></tr>
                    <tr><th>دسته‌بندی</th><td>${escapeHTML(product.category)}</td></tr>
                    <tr><th>قیمت خرید</th><td>${product.purchasePrice.toLocaleString()} تومان</td></tr>
                    <tr><th>قیمت فروش</th><td class="text-primary fw-bold">${product.salePrice.toLocaleString()} تومان</td></tr>
                    <tr><th>سود هر واحد</th><td class="text-success">${profit.toLocaleString()} تومان (${profitPercent}%)</td></tr>
                    <tr><th>موجودی فعلی</th><td class="${product.stock <= product.minStock ? 'text-danger fw-bold' : ''}">${product.stock} ${escapeHTML(product.unit)}</td></tr>
                    <tr><th>حداقل موجودی هشدار</th><td>${product.minStock} ${escapeHTML(product.unit)}</td></tr>
                    <tr><th>وضعیت</th><td><span class="badge ${product.status === 'موجود' ? 'bg-success' : (product.status === 'در راه' ? 'bg-warning' : 'bg-danger')}">${escapeHTML(product.status)}</span></td></tr>
                    <tr><th>بارکد</th><td>${product.barcode || '---'}</td></tr>
                    <tr><th>توضیحات</th><td>${escapeHTML(product.description || '---')}</td></tr>
                </table>
            </div>
        </div>
    `;

    document.getElementById('detailsContent').innerHTML = detailsHtml;
    new bootstrap.Modal(document.getElementById('detailsModal')).show();
}

// ویرایش محصول
function editProduct(id) {
    const product = productsData.find(p => p.id === id);
    if (!product) return;

    currentProductId = id;
    document.getElementById('modalTitle').innerText = 'ویرایش کالا';
    document.getElementById('productId').value = product.id;
    document.getElementById('productCode').value = product.code;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('purchasePrice').value = product.purchasePrice;
    document.getElementById('salePrice').value = product.salePrice;
    document.getElementById('initialStock').value = product.stock;
    document.getElementById('minStock').value = product.minStock;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productStatus').value = product.status;
    document.getElementById('productBarcode').value = product.barcode || '';

    if (product.image) {
        document.getElementById('imagePreview').innerHTML = `<img src="${safeImageURL(product.image)}" width="100" class="img-thumbnail">`;
    } else {
        document.getElementById('imagePreview').innerHTML = '';
    }

    new bootstrap.Modal(document.getElementById('productModal')).show();
}

// ذخیره محصول (افزودن یا ویرایش)
async function saveProduct() {
    if (!validateForm('productForm')) return;
    const id = document.getElementById('productId').value;

    const product = {
        id: id ? parseInt(id) : Date.now(),
        code: document.getElementById('productCode').value,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        unit: document.getElementById('productUnit').value,
        purchasePrice: Number(document.getElementById('purchasePrice').value) || 0,
        salePrice: Number(document.getElementById('salePrice').value) || 0,
        stock: Number(document.getElementById('initialStock').value) || 0,
        minStock: Number(document.getElementById('minStock').value) || 0,
        description: document.getElementById('productDescription').value,
        status: document.getElementById('productStatus').value,
        barcode: document.getElementById('productBarcode').value,
        image: ''
    };

    // اعتبارسنجی
    if (!product.code || !product.name || !product.category || !product.purchasePrice || !product.salePrice) {
        showToast('لطفاً تمام فیلدهای الزامی را پر کنید', 'error');
        return;
    }

    if (product.salePrice < product.purchasePrice) {
        showToast('قیمت فروش نمی‌تواند از قیمت خرید کمتر باشد', 'error');
        return;
    }

    // بررسی تکراری نبودن کد محصول
    if (productsData.some(p => p.code === product.code && p.id !== Number(id))) {
        showToast('کد محصول تکراری است', 'error');
        return;
    }

    // پردازش تصویر
    const imageFile = document.getElementById('productImage').files[0];
    if (imageFile) {
        try { product.image = await readProductImage(imageFile); saveProductToArray(product,id); }
        catch { showToast('لطفاً تصویر معتبر PNG، JPG، GIF یا WebP با حجم کمتر از ۲ مگابایت انتخاب کنید','error'); }
    } else if (id) {
        const existingProduct = productsData.find(p => p.id === parseInt(id));
        product.image = existingProduct?.image || '';
        saveProductToArray(product, id);
    } else {
        saveProductToArray(product, id);
    }
}

function saveProductToArray(product, id) {
    if (id) {
        const index = productsData.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            productsData[index] = { ...productsData[index], ...product };
        }
        showToast('کالا با موفقیت ویرایش شد', 'success');
    } else {
        productsData.push(product);
        showToast('کالا با موفقیت اضافه شد', 'success');
    }

    filterProducts();
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    resetProductForm();
}

function resetProductForm() {
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').innerText = 'افزودن کالا';
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('initialStock').value = '0';
    document.getElementById('minStock').value = '5';
    currentProductId = null;
}

function showDeleteModal(id, name) {
    deleteProductId = id;
    document.getElementById('deleteProductName').innerText = name;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

function confirmDelete() {
    if (deleteProductId) {
        productsData = productsData.filter(p => p.id !== deleteProductId);
        filterProducts();
        showToast('کالا با موفقیت حذف شد', 'success');
        bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
        deleteProductId = null;
    }
}

// پیش‌نمایش تصویر
document.getElementById('productImage')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            preview.innerHTML = `<img src="${safeImageURL(ev.target.result)}" width="100" class="img-thumbnail">`;
        };
        reader.readAsDataURL(file);
    }
});

// رویدادها
document.getElementById('saveProductBtn')?.addEventListener('click', saveProduct);
document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
document.getElementById('addProductBtn')?.addEventListener('click', () => {
    resetProductForm();
});

// مقداردهی اولیه
setupFilters();
loadSidebarAndNavbar('products');
loadProducts();
