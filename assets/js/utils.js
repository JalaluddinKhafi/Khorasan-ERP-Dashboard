// ============================================
// توابع کمکی و ابزاری
// ============================================

// نمایش توست نوتیفیکیشن
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.remove();
    }, 3000);
}

// فرمت اعداد به تومان
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " تومان";
}

// فرمت تاریخ فارسی
function formatDate(date) {
    return new Date(date).toLocaleDateString('fa-IR');
}

// دریافت تاریخ امروز
function getTodayDate() {
    return new Date().toLocaleDateString('fa-IR');
}

// اعتبارسنجی فرم
function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) return true;
    
    let isValid = true;
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(function(input) {
        if (rules[input.name] && rules[input.name].required && !input.value) {
            showToast('فیلد ' + (input.placeholder || input.name) + ' الزامی است', 'error');
            isValid = false;
        }
    });
    
    return isValid;
}

// نمایش لودینگ
function showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i><p class="mt-2">در حال بارگذاری...</p></div>';
    }
}

// مخفی کردن لودینگ
function hideLoading(elementId, content) {
    const el = document.getElementById(elementId);
    if (el && content !== undefined) {
        el.innerHTML = content;
    }
}

// کپی در کلیپ‌بورد
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast('متن با موفقیت کپی شد', 'success');
}

// دریافت پارامتر از URL
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// تبدیل عدد به حروف (برای مبالغ)
function numberToWords(num) {
    if (num === 0) return "صفر";
    
    const units = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
    const tens = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
    const hundreds = ["", "یکصد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
    
    let word = "";
    
    if (num >= 1000000) {
        word += numberToWords(Math.floor(num / 1000000)) + " میلیون ";
        num %= 1000000;
    }
    if (num >= 1000) {
        word += numberToWords(Math.floor(num / 1000)) + " هزار ";
        num %= 1000;
    }
    if (num >= 100) {
        word += hundreds[Math.floor(num / 100)] + " ";
        num %= 100;
    }
    if (num >= 20) {
        word += tens[Math.floor(num / 10)] + " ";
        num %= 10;
    }
    if (num > 0 && num < 10) {
        word += units[num] + " ";
    }
    
    return word.trim();
}