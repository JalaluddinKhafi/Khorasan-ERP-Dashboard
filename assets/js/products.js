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