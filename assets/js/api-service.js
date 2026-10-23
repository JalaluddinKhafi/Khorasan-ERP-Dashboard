// Frontend adapter. A Spring Boot adapter can replace this module later.
export async function fetchData(endpoint) {
    const name=String(endpoint).replace(/^\//,'');
    const store=window.FrontendStore;
    const seeds=window.DemoData;
    if(!store || !seeds) throw new Error('Load frontend-store.js and demo-data.js first');
    if(name==='users' && window.OrgContext)return OrgContext.accounts();
    const collections={products:'products',customers:'customers',suppliers:'suppliers',categories:'categories',sales:'sales',purchases:'purchases',expenses:'expenses',users:'users',receipts:'receipts'};
    if(collections[name]) return store.read(name,seeds[name]);
    if(name==='sales/latest') return store.read('sales',seeds.sales).slice(-5).reverse();
    if(name==='products/top') return store.read('products',seeds.products).slice(0,5);
    if(name==='dashboard' || name==='dashboard/stats') return {
        totalProducts:store.read('products',seeds.products).length,
        totalCustomers:store.read('customers',seeds.customers).length,
        totalSuppliers:store.read('suppliers',seeds.suppliers).length,
        totalPurchaseInvoices:store.read('purchases',seeds.purchases).length,
        totalSalesInvoices:store.read('sales',seeds.sales).length
    };
    throw new Error('Unknown frontend collection: '+name);
}
