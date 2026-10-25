/* Report data is derived from the same local repositories as the editors. */
let reportDateRange = null;
function frontendReport(type, fallback) {
    const sales=FrontendStore.read('sales',DemoData.sales);
    const purchases=FrontendStore.read('purchases',DemoData.purchases);
    const expenses=FrontendStore.read('expenses',DemoData.expenses);
    const products=FrontendStore.read('products',DemoData.products);
    const inRange = row => !reportDateRange || (dateKey(row.isoDate || row.date)>=reportDateRange.start && dateKey(row.isoDate || row.date)<=reportDateRange.end);
    const money=n=>Number(n).toLocaleString()+' تومان';
    let report=fallback;
    if(['daily-sales','monthly-sales','yearly-sales'].includes(type) && (window.OrgContext?.isBranch() || FrontendStore.has('sales') || reportDateRange)) {
        const groups=new Map();
        const size={'daily-sales':10,'monthly-sales':7,'yearly-sales':4}[type];
        sales.filter(inRange).forEach(s=>{const key=dateKey(s.date).slice(0,size);const group=groups.get(key)||{count:0,total:0};group.count++;group.total+=s.total;groups.set(key,group);});
        report={title:fallback.title,tableHeaders: type==='daily-sales' ? fallback.tableHeaders : [type==='monthly-sales'?'ماه':'سال','تعداد فاکتور','مبلغ فروش','میانگین هر فاکتور'],tableData:[...groups].sort((a,b)=>b[0].localeCompare(a[0])).map(([key,g])=>[key,g.count,money(g.total),money(g.total/g.count)])};
    }
    if(type==='inventory' && (window.OrgContext?.isBranch() || FrontendStore.has('products'))) report={...fallback,tableData:products.map(p=>[p.name,p.code,p.stock,p.minStock,p.stock<=p.minStock?'کم موجود':'موجود'])};
    if(type==='debts' && (window.OrgContext?.isBranch() || FrontendStore.has('customers')||FrontendStore.has('suppliers'))) report={...fallback,tableData:[...FrontendStore.read('customers',DemoData.customers).map(c=>[c.name,'مشتری',money(c.debt),'---','در حال پیگیری']),...FrontendStore.read('suppliers',DemoData.suppliers).map(s=>[s.name,'تامین‌کننده',money(s.debt),'---','در حال پیگیری'])]};
    if(type==='expenses') report={title:'گزارش مصارف',tableHeaders:['تاریخ','دسته‌بندی','شرح مصرف','مبلغ','نحوه پرداخت'],tableData:expenses.filter(inRange).map(e=>[e.date,e.category,e.desc,money(e.amount),e.method])};
    if(type==='purchases') report={title:'گزارش خرید',tableHeaders:['شماره','تامین‌کننده','تاریخ','مبلغ','وضعیت'],tableData:purchases.filter(inRange).map(p=>[p.invoiceNo,p.supplier,p.date,money(p.total),p.status])};
    if(type==='profit-loss') {
        const revenue=sales.filter(inRange).reduce((s,x)=>s+x.total,0);
        const cost=sales.filter(inRange).reduce((s,x)=>s+(x.items||[]).reduce((t,i)=>t+i.quantity*(i.costPrice ?? products.find(p=>p.id===i.productId)?.purchasePrice ?? 0),0),0);
        const expense=expenses.filter(inRange).reduce((s,e)=>s+e.amount,0);
        report={title:'گزارش سود و زیان',tableHeaders:['عنوان','مبلغ'],tableData:[['کل فروش',money(revenue)],['بهای تمام شده',money(cost)],['کل مصارف',money(expense)],['سود خالص',money(revenue-cost-expense)]]};
    }
    return report;
}
