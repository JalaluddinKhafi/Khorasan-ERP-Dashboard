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