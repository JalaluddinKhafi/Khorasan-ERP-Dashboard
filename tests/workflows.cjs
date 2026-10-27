const fs=require('fs'),assert=require('node:assert/strict');
const {chromium,baseURL,outputDir,prepareServer}=require('./browser-helper.cjs');
(async()=>{await prepareServer();
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'msedge'});
const ctx=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
const results=[];
async function go(name){await page.goto(baseURL+'/'+name,{waitUntil:'domcontentloaded'});await page.waitForTimeout(150);}
async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS '+name);}catch(e){results.push({name,passed:false,error:e.stack});console.log('FAIL '+name+': '+e.message);}}
await test('Product create, safe rendering, filter, reload and edit',async()=>{
 await go('dashboard/products.html');await page.locator('#addProductBtn').click();
 await page.locator('#productCode').fill('QA-001');await page.locator('#productName').fill('<img src=x onerror=alert(1)>');
 await page.locator('#productCategory').selectOption({index:1});await page.locator('#purchasePrice').fill('10');await page.locator('#salePrice').fill('15');await page.locator('#initialStock').fill('30');await page.locator('#saveProductBtn').click();await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>productsData.some(p=>p.code==='QA-001')),true);
 assert.equal(await page.locator('#productsTableBody [onerror]').count(),0);
 await page.locator('#searchProductInput').fill('QA-001');await page.locator('#searchProductInput').press('a');await page.locator('#searchProductInput').press('Backspace');await page.waitForTimeout(150);
 assert.equal(await page.locator('#productsTableBody tr').count(),1);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>productsData.some(p=>p.code==='QA-001')),true);
 await page.evaluate(()=>editProduct(productsData.find(p=>p.code==='QA-001').id));await page.locator('#productName').fill('QA Product');await page.locator('#saveProductBtn').click();await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>productsData.find(p=>p.code==='QA-001').name),'QA Product');
});
await test('Table pagination actions survive redraw',async()=>{
 await page.evaluate(()=>{for(let i=0;i<20;i++)productsData.push({...productsData[0],id:99000+i,code:'QA-PAGE-'+i,name:'Page '+i});renderProductsTable();});await page.waitForTimeout(150);
 await page.locator('#productsTable_next').click();await page.waitForTimeout(100);await page.locator('#productsTableBody .edit-product').first().click();
 await page.waitForTimeout(200);assert.equal(await page.locator('#productModal').evaluate(el=>el.classList.contains('show')),true);
 await page.locator('#productModal .btn-close').click();await page.waitForTimeout(400);
});
await test('Sales save adjusts inventory and opens correct invoice',async()=>{
 await go('dashboard/sales.html');await page.locator('[data-bs-target="#salesModal"]').click();
 await page.evaluate(()=>{document.getElementById('salesItemsBody').replaceChildren();addSaleProduct(salesProducts().find(p=>p.code==='QA-001'));});
 await page.locator('#salesItemsBody .quantity-sale').fill('2');await page.locator('#saveSaleBtn').click();await page.waitForTimeout(400);
 const data=await page.evaluate(()=>({sale:FrontendStore.read('sales',[]).at(-1),product:FrontendStore.read('products',[]).find(p=>p.code==='QA-001')}));assert.equal(data.product.stock,28);assert.equal(data.sale.total,30);
 await go('dashboard/sales-invoice.html?id='+data.sale.id);assert.equal(await page.locator('#invoiceNo').innerText(),data.sale.invoiceNo);assert.match(await page.locator('#grandTotal').innerText(),/30/);
});
await test('Sales rejects stock overselling',async()=>{
 await go('dashboard/sales.html');await page.locator('[data-bs-target="#salesModal"]').click();
 const before=await page.evaluate(()=>salesData.length);
 await page.evaluate(()=>{document.getElementById('salesItemsBody').replaceChildren();addSaleProduct(salesProducts().find(p=>p.code==='QA-001'));});await page.locator('#salesItemsBody .quantity-sale').fill('999');await page.locator('#saveSaleBtn').click();assert.equal(await page.evaluate(()=>salesData.length),before);
});
await test('Purchase create and edit update one record and stock delta',async()=>{
 await go('dashboard/purchases.html');await page.locator('[data-bs-target="#purchaseModal"]').click();
 await page.locator('#invoiceNo').fill('QA-PURCHASE');await page.locator('#invoiceDate').fill('1405/08/06');await page.locator('#supplierSelect').selectOption({index:1});
 await page.locator('#itemsBody .product-name').fill('QA Product');await page.locator('#itemsBody .quantity').fill('3');await page.locator('#itemsBody .unit-price').fill('10');await page.locator('#savePurchaseBtn').click();await page.waitForTimeout(400);
 let data=await page.evaluate(()=>({purchase:purchasesData.find(p=>p.invoiceNo==='QA-PURCHASE'),stock:FrontendStore.read('products',[]).find(p=>p.code==='QA-001').stock}));assert.equal(data.stock,31);
 await page.evaluate(id=>editPurchase(id),data.purchase.id);await page.locator('#itemsBody .quantity').fill('5');await page.locator('#savePurchaseBtn').click();await page.waitForTimeout(400);
 data=await page.evaluate(()=>({count:purchasesData.filter(p=>p.invoiceNo==='QA-PURCHASE').length,stock:FrontendStore.read('products',[]).find(p=>p.code==='QA-001').stock}));assert.equal(data.count,1);assert.equal(data.stock,33);assert.equal(await page.evaluate(()=>FrontendStore.read('suppliers',[]).find(s=>s.name==='توزیع کننده البرز').debt),56000050);
});
await test('Expense edit preserves date; data survives reload',async()=>{
 await go('dashboard/expenses.html');await page.locator('[data-bs-target="#expenseModal"]').click();await page.locator('#expenseCategory').selectOption({index:1});await page.locator('#expenseDate').fill('2026-10-28');await page.locator('#expenseDesc').fill('QA Expense');await page.locator('#expenseAmount').fill('10.5');await page.locator('#saveExpenseBtn').click();await page.waitForTimeout(400);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(150);const id=await page.evaluate(()=>expensesData.find(e=>e.desc==='QA Expense').id);await page.evaluate(id=>editExpense(id),id);assert.equal(await page.locator('#expenseDate').inputValue(),'2026-10-28');assert.equal(await page.locator('#expenseAmount').inputValue(),'10.5');
});
await test('Reports: all eight types, date filter and Excel/PDF downloads',async()=>{
 await go('dashboard/reports.html');for(const card of await page.locator('.report-card').all()){await card.click();await page.waitForTimeout(80);assert.ok(await page.locator('#reportTitle').innerText());}
 await page.locator('[data-report="daily-sales"]').click();await page.locator('#startDate').fill('2026-10-28');await page.locator('#endDate').fill('2026-10-28');await page.locator('#applyDateFilter').click();await page.waitForTimeout(150);assert.match(await page.locator('#reportTableBody').innerText(),/30/);
 let download=page.waitForEvent('download',{timeout:20000});await page.locator('#exportExcel').click();const xlsx=await download;assert.match(xlsx.suggestedFilename(),/\.xlsx$/);await xlsx.saveAs(outputDir+'/qa-report.xlsx');
 download=page.waitForEvent('download',{timeout:25000});await page.locator('#exportPDF').click();const pdf=await download;assert.match(pdf.suggestedFilename(),/\.pdf$/);await pdf.saveAs(outputDir+'/qa-report.pdf');
});
await test('Category rejects cyclic parent',async()=>{
 await go('dashboard/categories.html');const data=await page.evaluate(()=>categoriesData.slice(0,2));
 await page.evaluate(()=>editCategory(categoriesData[0].id));await page.locator('#parentCategory').selectOption(String(data[0].id));const before=await page.evaluate(()=>JSON.stringify(categoriesData));await page.locator('#saveCategoryBtn').click();assert.equal(await page.evaluate(()=>JSON.stringify(categoriesData)),before);
});
await test('CMS page, settings and persistence',async()=>{
 await go('dashboard/website-management.html');await page.locator('[data-bs-target="#addPageModal"]').click();const form=page.locator('#addPageModal form');await form.locator('input').nth(0).fill('QA Page');await form.locator('input').nth(1).fill('/qa-page.html');await form.locator('textarea').fill('QA Content');await page.locator('#addPageModal .modal-footer .btn-primary').click();await page.waitForTimeout(400);
 const pageId=await page.evaluate(()=>FrontendStore.read('cmsPages',[]).find(p=>p.values[0]==='QA Page').id);
 await go('public-site/page.html?id='+pageId);assert.equal(await page.locator('#pageContent').innerText(),'QA Content');
 await go('dashboard/website-management.html');await page.locator('[data-bs-target="#settingsTab"]').click();await page.locator('#siteSettingsForm input').nth(1).fill('QA Slogan');await page.locator('#siteSettingsForm button[type="submit"]').click();await go('public-site/index.html');assert.equal(await page.locator('.hero h1').innerText(),'QA Slogan');
});
await test('Receipts filters and form validation',async()=>{
 await go('dashboard/receipts.html');await page.locator('#searchReceipt').fill('1319');assert.equal(await page.locator('#receiptsList .receipt-card').count(),1);await page.locator('#filterStatus').selectOption('pending');assert.equal(await page.locator('#receiptsList .receipt-card').count(),0);await page.locator('#resetReceiptFilters').click();assert.equal(await page.locator('#receiptsList .receipt-card').count(),2);
});
await test('Customer and supplier CRUD persist across reload',async()=>{
 for(const entity of ['customer','supplier']) {
  await go('dashboard/'+entity+'s.html');await page.locator('[data-bs-target="#'+entity+'Modal"]').click();
  await page.locator('#'+entity+'Name').fill('QA '+entity);await page.locator('#'+entity+'Phone').fill('0700123456');
  await page.locator('#save'+entity[0].toUpperCase()+entity.slice(1)+'Btn').click();await page.waitForTimeout(350);await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(100);
  assert.equal(await page.evaluate(entity=>FrontendStore.read(entity+'s',[]).some(p=>p.name==='QA '+entity),entity),true);
 }
});
await test('User password demo stores a salted verifier, never plaintext',async()=>{
 await go('dashboard/users.html');await page.locator('[data-bs-target="#userModal"]').click();await page.locator('#username').fill('qa-user');await page.locator('#fullname').fill('QA User');await page.locator('#email').fill('qa@example.com');await page.locator('#password').fill('qa-password');await page.locator('#role').selectOption({index:1});await page.locator('#saveUserBtn').click();await page.waitForTimeout(500);
 const data=await page.evaluate(()=>OrgContext.accounts().find(u=>u.username==='qa-user'));assert.ok(data.demoVerifier.hash.length);assert.equal(JSON.stringify(data).includes('qa-password'),false);
});
await test('Purchase deletion reverses local stock movement',async()=>{
 await go('dashboard/purchases.html');const before=await page.evaluate(()=>FrontendStore.read('products',[]).find(p=>p.code==='QA-001').stock);
 await page.evaluate(()=>deletePurchase(purchasesData.find(p=>p.invoiceNo==='QA-PURCHASE').id));
 const after=await page.evaluate(()=>FrontendStore.read('products',[]).find(p=>p.code==='QA-001').stock);assert.equal(after,before-5);
});
await test('Payments persist and allocate to invoice balance',async()=>{
 await go('dashboard/payments.html');const before=await page.evaluate(()=>allPayments.length);
 const paymentPartyId=await page.locator('#customerDebtsBody .register-payment:not([data-debt="0"])').first().getAttribute('data-id');
 await page.locator('#customerDebtsBody .register-payment:not([data-debt="0"])').first().click();await page.locator('#paymentAmount').fill('1');await page.locator('#registerPaymentBtn').click();await page.waitForTimeout(350);await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>allPayments.length),before+1);
 await page.locator('#customerDebtsBody .view-payment-history[data-id="'+paymentPartyId+'"]').click();await page.locator('.modal.show table tbody tr').first().waitFor({state:'visible'});assert.ok(await page.locator('.modal.show table tbody tr').count());
});
await test('Contact and comment submissions remain in local demo queues',async()=>{
 await go('public-site/contact.html');await page.locator('#contactForm input').first().fill('QA Visitor');
 const inputs=await page.locator('#contactForm input').all();for(const input of inputs){const type=await input.getAttribute('type');await input.fill(type==='email'?'qa@example.com':'QA Visitor');}
 await page.locator('#contactForm textarea').fill('QA Message');await page.locator('#contactForm button[type="submit"]').click();assert.equal(await page.evaluate(()=>FrontendStore.read('contactMessages',[]).length),1);
 await go('public-site/blog-details.html?id=3');assert.ok(await page.locator('#articleContent h1').innerText());await page.locator('#commentForm input').fill('QA Visitor');await page.locator('#commentForm textarea').fill('QA Comment');await page.locator('#commentForm button').click();assert.equal(await page.evaluate(()=>FrontendStore.read('comments',[]).length),1);
});
await test('Mobile drawer and dark mode work and persist',async()=>{
 await page.setViewportSize({width:360,height:900});await go('dashboard/dashboard.html');await page.locator('#mobileMenuBtn').click();await page.waitForTimeout(200);assert.equal(await page.locator('.sidebar').evaluate(el=>el.classList.contains('show')),true);await page.keyboard.press('Escape');assert.equal(await page.locator('.sidebar').evaluate(el=>el.classList.contains('show')),false);
 await page.locator('#darkModeToggle').click();await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('dark-mode')),true);await page.setViewportSize({width:1440,height:1000});
});
await test('No browser JavaScript errors during workflows',async()=>assert.deepEqual(errors,[]));
fs.writeFileSync(outputDir+'/workflow-results.json',JSON.stringify(results,null,2));await browser.close();if(results.some(r=>!r.passed))process.exitCode=1;
})();
