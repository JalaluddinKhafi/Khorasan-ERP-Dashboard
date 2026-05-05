let productsData = [];
let currentProductId = null;
let deleteProductId = null;
let productsTable = null;

// داده‌های نمونه
const sampleProducts = [
    { id: 1, code: "P1001", name: "لپ تاپ ایسوس", category: "الکترونیک", purchasePrice: 25000000, salePrice: 28500000, unit: "عدد", status: "موجود", stock: 45, description: "لپ تاپ گیمینگ", image: "" },
    { id: 2, code: "P1002", name: "گوشی سامسونگ", category: "الکترونیک", purchasePrice: 38000000, salePrice: 42000000, unit: "عدد", status: "موجود", stock: 28, description: "", image: "" },
    { id: 3, code: "P1003", name: "هدفون سونی", category: "الکترونیک", purchasePrice: 6500000, salePrice: 8900000, unit: "عدد", status: "موجود", stock: 112, description: "", image: "" }
];

function initProductsPage() {
    loadProducts();
    setupEventListeners();
}

function loadProducts() {
    // در حالت واقعی: fetch('/api/products')
    productsData = [...sampleProducts];
    renderProductsTable();
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = productsData.map(p => `
        <tr>
            <td>${p.code}</td>
            <td><img src="${p.image || 'https://via.placeholder.com/50'}" width="50" height="50" style="object-fit: cover; border-radius: 8px;"></td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>${p.purchasePrice.toLocaleString()}</td>
            <td>${p.salePrice.toLocaleString()}</td>
            <td>${p.unit}</td>
            <td>${p.stock}</td>
            <td><span class="badge ${p.status === 'موجود' ? 'bg-success' : 'bg-danger'}">${p.status}</span></td>
            <td>
                <button class="btn btn-sm btn-info edit-product" data-id="${p.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger delete-product" data-id="${p.id}"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    
    // راه‌اندازی DataTable
    if (productsTable) {
        productsTable.destroy();
    }
    productsTable = $('#productsTable').DataTable({
        language: { url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/fa.json" },
        pageLength: 10
    });
    
    // رویدادهای دکمه‌ها
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', () => editProduct(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', () => showDeleteModal(parseInt(btn.dataset.id)));
    });
}

function setupEventListeners() {
    document.getElementById('saveProductBtn')?.addEventListener('click', saveProduct);
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
    document.getElementById('searchInput')?.addEventListener('input', filterProducts);
    document.getElementById('categoryFilter')?.addEventListener('change', filterProducts);
    document.getElementById('productImage')?.addEventListener('change', previewImage);
}

function filterProducts() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    
    const filtered = productsData.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search);
        const matchCategory = !category || p.category === category;
        return matchSearch && matchCategory;
    });
    
    const tbody = document.getElementById('productsTableBody');
    if (tbody) {
        tbody.innerHTML = filtered.map(p => `...`).join('');
        if (productsTable) {
            productsTable.clear();
            productsTable.rows.add(filtered);
            productsTable.draw();
        }
    }
}

function saveProduct() {
    const product = {
        id: currentProductId || Date.now(),
        code: document.getElementById('productCode').value,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        purchasePrice: parseInt(document.getElementById('purchasePrice').value),
        salePrice: parseInt(document.getElementById('salePrice').value),
        unit: document.getElementById('productUnit').value,
        status: document.getElementById('productStatus').value,
        description: document.getElementById('productDescription').value,
        stock: currentProductId ? productsData.find(p => p.id === currentProductId)?.stock || 0 : 0
    };
    
    if (currentProductId) {
        const index = productsData.findIndex(p => p.id === currentProductId);
        if (index !== -1) {
            productsData[index] = { ...productsData[index], ...product };
        }
        showToast('محصول با موفقیت ویرایش شد', 'success');
    } else {
        productsData.push(product);
        showToast('محصول با موفقیت اضافه شد', 'success');
    }
    
    // آپلود تصویر (نمونه)
    const imageFile = document.getElementById('productImage').files[0];
    if (imageFile) {
        // در حالت واقعی: upload to server
        const reader = new FileReader();
        reader.onload = (e) => {
            product.image = e.target.result;
            renderProductsTable();
        };
        reader.readAsDataURL(imageFile);
    }
    
    renderProductsTable();
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    resetForm();
}

function editProduct(id) {
    const product = productsData.find(p => p.id === id);
    if (!product) return;
    
    currentProductId = id;
    document.getElementById('modalTitle').innerText = 'ویرایش کالا';
    document.getElementById('productCode').value = product.code;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('purchasePrice').value = product.purchasePrice;
    document.getElementById('salePrice').value = product.salePrice;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('productStatus').value = product.status;
    document.getElementById('productDescription').value = product.description || '';
    
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

function showDeleteModal(id) {
    deleteProductId = id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

function confirmDelete() {
    if (deleteProductId) {
        productsData = productsData.filter(p => p.id !== deleteProductId);
        renderProductsTable();
        showToast('محصول با موفقیت حذف شد', 'success');
        bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
        deleteProductId = null;
    }
}

function previewImage() {
    const file = document.getElementById('productImage').files[0];
    const preview = document.getElementById('imagePreview');
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" width="100" class="img-thumbnail">`;
        };
        reader.readAsDataURL(file);
    }
}

function resetForm() {
    currentProductId = null;
    document.getElementById('modalTitle').innerText = 'افزودن کالا';
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
}

// نمونه fetch برای ذخیره در API
async function saveProductToAPI(product) {
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (response.ok) {
            showToast('محصول ذخیره شد', 'success');
            return await response.json();
        }
    } catch (error) {
        console.error('API Error:', error);
        showToast('خطا در ارتباط با سرور', 'error');
    }
}