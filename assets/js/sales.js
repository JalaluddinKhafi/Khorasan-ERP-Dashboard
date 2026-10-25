let salesData = FrontendStore.read('sales', DemoData.sales);
const salesProducts = () => FrontendStore.read('products', DemoData.products);
function loadSales() {
    destroyDataTable('salesTable');
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = salesData.map(s => `<tr><td>${escapeHTML(s.invoiceNo)}</td><td>${escapeHTML(s.customer)}</td><td>${escapeHTML(s.date)}</td><td>${s.total.toLocaleString()} تومان</td><td><span class="badge ${s.status === 'پرداخت شده' ? 'bg-success' : 'bg-warning'}">${escapeHTML(s.status)}</span></td><td><button class="btn btn-sm btn-print" data-id="${s.id}"><i class="fas fa-print"></i></button></td></tr>`).join('');
    $('#salesTable').DataTable({language: window.PersianTableLanguage});
    tbody.querySelectorAll('.btn-print').forEach(btn => btn.onclick=()=>{location.href='sales-invoice.html?id='+encodeURIComponent(btn.dataset.id);});
}
function calculateSale() {
    let total=0;
    document.querySelectorAll('#salesItemsBody tr').forEach(row=>{
        const qty=Number(row.querySelector('.quantity-sale').value);
        const price=Number(row.querySelector('.price-sale').value);
        const amount=Math.max(0,qty*price);
        row.querySelector('.row-total-sale').textContent=amount.toLocaleString();
        total+=amount;
    });
    document.getElementById('salesGrandTotal').textContent=total.toLocaleString();
    return total;
}
function attachSaleRows() {
    document.querySelectorAll('#salesItemsBody input').forEach(input=>input.oninput=calculateSale);
    document.querySelectorAll('.remove-sale-row').forEach(btn=>{
        btn.type='button';
        btn.onclick=()=>{btn.closest('tr').remove();calculateSale();};
    });
}
function addSaleProduct(product) {
    const existing=[...document.querySelectorAll('#salesItemsBody tr')].find(row=>row.querySelector('input').value===product.name);
    if(existing) existing.querySelector('.quantity-sale').value=Number(existing.querySelector('.quantity-sale').value)+1;
    else document.getElementById('salesItemsBody').insertAdjacentHTML('beforeend',`<tr data-product-id="${product.id}"><td><input type="text" class="form-control" value="${escapeHTML(product.name)}" required></td><td><input type="number" class="form-control quantity-sale" value="1" min="1" required></td><td><input type="number" class="form-control price-sale" value="${product.salePrice}" min="0" step="any" required></td><td class="row-total-sale"></td><td><button type="button" class="btn btn-danger btn-sm remove-sale-row"><i class="fas fa-trash"></i></button></td></tr>`);
    document.getElementById('productSearchResults').replaceChildren();
    document.getElementById('productSearch').value='';
    attachSaleRows();calculateSale();
}
function saveSale() {
    const form=document.querySelector('#salesModal form');
    if(!form.reportValidity()) return;
    const products=salesProducts();
    const items=[];
    const quantities=new Map();
    for(const row of document.querySelectorAll('#salesItemsBody tr')) {
        const name=row.querySelector('input').value.trim();
        const product=products.find(p=>p.name===name);
        const quantity=Number(row.querySelector('.quantity-sale').value);
        const price=Number(row.querySelector('.price-sale').value);
        if(!product || !Number.isFinite(quantity) || quantity<=0 || !Number.isFinite(price) || price<0) {showToast('لطفاً اطلاعات کالا را صحیح وارد کنید','error');return;}
        const requested=(quantities.get(product.id)||0)+quantity;
        if(requested>product.stock){showToast('موجودی کالا کافی نیست','error');return;}
        quantities.set(product.id,requested);
        items.push({costPrice:product.purchasePrice,productId:product.id,code:product.code,name,quantity,unit:product.unit,price,discount:0,total:quantity*price});
    }
    if(!items.length){showToast('لطفاً کالا را انتخاب کنید','error');return;}
    const date=document.querySelector('#salesModal input[type="date"]').value;
    const customer=document.getElementById('customerSelect').value;
    const id=Date.now();
    const sale={id,invoiceNo:'S-'+id,customer,date,total:items.reduce((s,i)=>s+i.total,0),status:'در انتظار پرداخت',paid:0,remaining:items.reduce((s,i)=>s+i.total,0),items,taxRate:0};
    products.forEach(p=>{p.stock-=(quantities.get(p.id)||0);});
    const transactions=FrontendStore.read('stockTransactions',[]);
    items.forEach(item=>transactions.push({date,type:'خروج',product:item.name,quantity:item.quantity,ref:sale.invoiceNo,user:'admin'}));
    const customers=FrontendStore.read('customers',DemoData.customers);
    const party=customers.find(c=>c.name===customer);
    if(party){party.debt+=sale.total;party.totalPurchases+=1;}
    FrontendStore.writeMany({sales:[...salesData,sale],products,stockTransactions:transactions,customers});
    salesData=FrontendStore.read('sales',[]);
    loadSales();
    showToast('فاکتور فروش با موفقیت ثبت شد','success');
    bootstrap.Modal.getInstance(document.getElementById('salesModal')).hide();
}
document.getElementById('productSearch').addEventListener('input',e=>{
    const term=e.target.value.trim().toLowerCase();
    const results=document.getElementById('productSearchResults');results.replaceChildren();
    if(!term)return;
    salesProducts().filter(p=>p.name.toLowerCase().includes(term)||p.code.toLowerCase().includes(term)).forEach(p=>{
        const btn=document.createElement('button');btn.type='button';btn.className='list-group-item list-group-item-action';btn.textContent=p.name;btn.onclick=()=>addSaleProduct(p);results.appendChild(btn);
    });
});
document.getElementById('salesModal').addEventListener('show.bs.modal',()=>{
    document.querySelector('#salesModal input[type="date"]').value=todayISO();
    const select=document.getElementById('customerSelect');
    if(OrgContext.isBranch() || FrontendStore.has('customers')) {select.replaceChildren();FrontendStore.read('customers',[]).forEach(c=>select.add(new Option(c.name,c.name)));}
    if(OrgContext.isBranch() && !document.querySelector('#salesItemsBody tr[data-product-id]'))document.getElementById('salesItemsBody').replaceChildren();
    const first=salesProducts()[0];
    if(first && !document.querySelector('#salesItemsBody tr')) addSaleProduct(first);
    attachSaleRows();calculateSale();
});
document.getElementById('salesModal').addEventListener('hidden.bs.modal',()=>{
    document.getElementById('salesItemsBody').replaceChildren();
    document.getElementById('productSearchResults').replaceChildren();
});
document.getElementById('saveSaleBtn').addEventListener('click',saveSale);
loadSidebarAndNavbar('sales');loadSales();attachSaleRows();calculateSale();
