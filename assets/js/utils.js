// Shared browser utilities; no backend is required.
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function safeImageURL(value) {
    const url = String(value || '');
    return /^(?:https?:|data:image\/(?:png|jpeg|gif|webp);base64,|\.?\.?\/|[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|gif|webp|svg)$)/i.test(url) ? escapeHTML(url) : '';
}
function showToast(message, type = 'success') {
    document.querySelector('.toast-notification')?.remove();
    const toast = document.createElement('div');
    toast.className = `toast-notification ${['success','error','info'].includes(type) ? type : 'info'}`;
    const icon = document.createElement('i');
    icon.className = `fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`;
    const span = document.createElement('span');
    span.textContent = message;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.append(icon, span);
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
function normalizeDigits(value) {
    return String(value ?? '').replace(/[۰-۹]/g, c => String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g, c => String(c.charCodeAt(0)-1632));
}
function parseAmount(value) {
    return Number(normalizeDigits(value).replace(/[,٬\s]/g, ''));
}
function formatPrice(price) { return (Number(price) || 0).toLocaleString() + ' تومان'; }
function formatDate(date) { return new Date(date).toLocaleDateString('fa-IR'); }
function getTodayDate() { return new Date().toLocaleDateString('fa-IR'); }
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dateKey(value) {
    const s = normalizeDigits(value).replace(/\//g, '-');
    const parts = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!parts || +parts[2]<1 || +parts[2]>12 || +parts[3]<1 || +parts[3]>31) return '';
    if (+parts[1] > 1700) {
        const d = new Date(`${parts[1]}-${parts[2].padStart(2,'0')}-${parts[3].padStart(2,'0')}T12:00:00`);
        if (!Number.isFinite(+d)) return '';
        return normalizeDigits(d.toLocaleDateString('fa-IR', {year:'numeric',month:'2-digit',day:'2-digit'})).replace(/\//g, '-');
    }
    return `${parts[1]}-${parts[2].padStart(2,'0')}-${parts[3].padStart(2,'0')}`;
}
function dateInputValue(value) {
    const target = dateKey(value);
    if (!target) return '';
    const year = Number(target.slice(0,4)) + 621;
    const start = new Date(year, 0, 1, 12);
    for (let i=0; i<735; i++) {
        const d = new Date(start); d.setDate(d.getDate()+i);
        if (dateKey(d.toISOString().slice(0,10)) === target) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    return '';
}
function validateForm(formId, rules = {}) {
    const form = document.getElementById(formId);
    if (!form) return false;
    for (const input of form.querySelectorAll('input, select, textarea')) {
        if ((input.required || rules[input.name]?.required) && !input.value.trim()) { input.setCustomValidity('لطفاً این فیلد را تکمیل کنید'); input.reportValidity(); input.addEventListener('input',()=>input.setCustomValidity(''),{once:true}); return false; }
    }
    return form.reportValidity();
}
function showLoading(id) { const el=document.getElementById(id); if(el) el.innerHTML='<div class="text-center p-4"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i><p class="mt-2">در حال بارگذاری...</p></div>'; }
function hideLoading(id, content) { const el=document.getElementById(id); if(el && content !== undefined) el.innerHTML=content; }
async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); showToast('متن با موفقیت کپی شد','success'); }
    catch { showToast('خطا در کپی متن','error'); }
}
function getUrlParam(param) { return new URLSearchParams(location.search).get(param); }
function numberToWords(value) {
    let num = Number(value);
    if (!Number.isSafeInteger(num)) return '';
    if (num === 0) return 'صفر';
    if (num < 0) return 'منفی ' + numberToWords(-num);
    const units=['','یک','دو','سه','چهار','پنج','شش','هفت','هشت','نه','ده','یازده','دوازده','سیزده','چهارده','پانزده','شانزده','هفده','هجده','نوزده'];
    const tens=['','','بیست','سی','چهل','پنجاه','شصت','هفتاد','هشتاد','نود'];
    const hundreds=['','یکصد','دویست','سیصد','چهارصد','پانصد','ششصد','هفتصد','هشتصد','نهصد'];
    const scales=['','هزار','میلیون','میلیارد','تریلیون','کوادریلیون'];
    function group(n) {
        const parts=[];
        if(n>=100) { parts.push(hundreds[Math.floor(n/100)]); n%=100; }
        if(n>=20) { parts.push(tens[Math.floor(n/10)]); n%=10; }
        if(n) parts.push(units[n]);
        return parts.join(' و ');
    }
    const parts=[];
    for(let i=0;num;i++,num=Math.floor(num/1000)) {
        if(num%1000) parts.unshift(group(num%1000)+(scales[i] ? ' '+scales[i] : ''));
    }
    return parts.join(' و ');
}
function destroyDataTable(id) {
    if (window.jQuery?.fn.dataTable?.isDataTable('#'+id)) jQuery('#'+id).DataTable().destroy();
}
const libraryLoads = {};
function loadLibrary(name, url) {
    if (window[name]) return Promise.resolve(window[name]);
    if (!libraryLoads[name]) libraryLoads[name] = new Promise((resolve,reject) => {
        const script=document.createElement('script'); script.src=url;
        script.onload=()=>resolve(window[name]);
        script.onerror=()=>{ delete libraryLoads[name]; script.remove(); reject(new Error('Library unavailable')); };
        document.head.appendChild(script);
    });
    return libraryLoads[name];
}
async function exportTableExcel(id, filename) {
    try {
        const XLSX=await loadLibrary('XLSX','../assets/vendor/xlsx.full.min.js');
        const table=document.getElementById(id).cloneNode(true);
        if(window.jQuery?.fn.dataTable?.isDataTable('#'+id)) {
            const body=table.querySelector('tbody'); body.replaceChildren();
            jQuery('#'+id).DataTable().rows({search:'applied',order:'applied'}).nodes().toArray().forEach(row=>body.appendChild(row.cloneNode(true)));
        }
        // Keep user-supplied cell contents as text, never spreadsheet formulas.
        const rows=[...table.rows].map(row=>[...row.cells].map(cell=>cell.textContent.trim()));
        const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Report');
        XLSX.writeFile(wb,filename+'.xlsx');
    } catch { showToast('خطا در آماده‌سازی فایل Excel','error'); }
}
function exportTablePDF(id, title, filename) {
    const source=document.getElementById(id);
    if(!source)return;
    const card=document.createElement('div');card.className='card';card.dir='rtl';
    const header=document.createElement('h5');header.textContent=title;
    const table=source.cloneNode(true);table.removeAttribute('id');table.style.width='100%';
    if(window.jQuery?.fn.dataTable?.isDataTable('#'+id)) {
        const body=table.querySelector('tbody');body.replaceChildren();
        jQuery('#'+id).DataTable().rows({search:'applied',order:'applied'}).nodes().toArray().forEach(row=>body.appendChild(row.cloneNode(true)));
    }
    card.append(header,table);
    return exportElementPDF(card,filename);
}
async function exportElementPDF(element, filename) {
    if(!element) return;
    try {
        await document.fonts.ready;
        const html2pdf=await loadLibrary('html2pdf','../assets/vendor/html2pdf.bundle.min.js');
        await html2pdf().set({filename:filename+'.pdf',margin:8,html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy']}}).from(element).save();
    } catch { showToast('خطا در آماده‌سازی فایل PDF','error'); }
}
function readProductImage(file) {
    if(!['image/png','image/jpeg','image/gif','image/webp'].includes(file.type) || file.size>2*1024*1024) return Promise.reject(new Error('invalid-image'));
    return new Promise((resolve,reject)=>{
        const reader=new FileReader();reader.onerror=()=>reject(reader.error);
        reader.onload=()=>{const img=new Image();img.onload=()=>resolve(reader.result);img.onerror=()=>reject(new Error('invalid-image'));img.src=reader.result;};
        reader.readAsDataURL(file);
    });
}
function queueOrder(product) {
    const orders=FrontendStore.read('orders',[]);
    if(!orders.some(x=>x.productId===product.id && x.status==='pending')) {
        orders.push({id:Date.now(),productId:product.id,name:product.name,date:todayISO(),status:'pending'});
        FrontendStore.write('orders',orders);
    }
    alert('سفارش ثبت شد');
}
function saveLocalForm(form, collection, extra={}) {
    if(!form.reportValidity()) return false;
    const data={};
    [...form.querySelectorAll('input,select,textarea')].forEach((el,i)=>{ if(el.type!=='submit') data[el.name||el.id||('field'+i)]=el.value; });
    FrontendStore.append(collection,{...data,...extra,id:Date.now(),createdAt:new Date().toISOString()});
    return true;
}
    document.addEventListener('error',event=>{
        const image=event.target;
        if(image.tagName!=='IMG' || image.dataset.fallback) return;
        image.dataset.fallback='true'; image.src='../assets/images/placeholder.svg';
    },true);

document.addEventListener('DOMContentLoaded', () => {
    const navbar=document.getElementById('shared-navbar');
    if(navbar) {
navbar.innerHTML = `
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-custom fixed-top">
        <div class="container">
            <a class="navbar-brand fw-bold" href="index.html">
                <img src="../assets/images/logo.png" alt="خراسان سیستم" class="img-logo me-2" style="height: 40px;">
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                    <li class="nav-item"><a class="nav-link" href="index.html">صفحه نخست</a></li>
                    <li class="nav-item"><a class="nav-link" href="about.html">درباره ما</a></li>
                    <li class="nav-item"><a class="nav-link" href="products.html">محصولات</a></li>
                    <li class="nav-item"><a class="nav-link" href="services.html">خدمات</a></li>
                    <li class="nav-item"><a class="nav-link" href="blog.html">وبلاگ</a></li>
                    <li class="nav-item"><a class="nav-link" href="gallery.html">گالری</a></li>
                    <li class="nav-item"><a class="nav-link" href="contact.html">تماس با ما</a></li>
                </ul>
            </div>
        </div>
    </nav>
`;

    }
    document.addEventListener('submit',event=>{
        const modal=event.target.closest('.modal'); if(!modal)return;
        event.preventDefault();modal.querySelector('.modal-footer .btn-primary')?.click();
    });
    function appendOptions(id, values) {
        const select=document.getElementById(id);if(!select)return;
        const existing=new Set([...select.options].map(option=>option.value));
        values.forEach(value=>{if(value && !existing.has(value)){select.add(new Option(value,value));existing.add(value);}});
    }
    if(location.pathname.includes('/dashboard/') && (!window.OrgContext || OrgContext.principal())) {
        if(FrontendStore.has('categories')) {
            const categories=FrontendStore.read('categories',[]).filter(c=>c.status==='active').map(c=>c.name);
            appendOptions('productCategory',categories);appendOptions('categoryFilter',categories);
        }
        if(FrontendStore.has('products')) appendOptions('categoryFilter',[...new Set(FrontendStore.read('products',[]).map(p=>p.category))]);
        if(window.OrgContext?.isBranch() && document.getElementById('supplierSelect'))document.getElementById('supplierSelect').replaceChildren(new Option('انتخاب کنید',''));
        if(FrontendStore.has('suppliers')) appendOptions('supplierSelect',FrontendStore.read('suppliers',[]).map(p=>p.name));
    }
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('hidden.bs.modal', () => {
            modal.querySelector('form')?.reset();
            modal.querySelectorAll('input[type="hidden"]').forEach(el=>{el.value='';});
            // Editors with explicit ids keep their original create-mode defaults.
            const reset={productModal:'resetProductForm',customerModal:'resetCustomerForm',supplierModal:'resetSupplierForm',categoryModal:'resetCategoryForm'}[modal.id];
            if(reset && typeof window[reset]==='function') window[reset]();
            modal.querySelectorAll('[id$="Id"]').forEach(el=>{if(el.tagName==='INPUT') el.value='';});
        });
    });
});
