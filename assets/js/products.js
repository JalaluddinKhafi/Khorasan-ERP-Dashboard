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