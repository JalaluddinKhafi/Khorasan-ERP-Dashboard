'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,baseURL,outputDir,prepareServer}=require('./browser-helper.cjs');
(async()=>{
 await prepareServer();const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'}),ctx=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 await ctx.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL).origin?route.continue():route.abort());
 const page=await ctx.newPage(),errors=[],results=[];page.on('pageerror',e=>{if(!/دسترسی به این صفحه|ورود به سیستم|ابتدا وارد/.test(e.message))errors.push(e.message);});
 async function go(path){await page.goto(baseURL+'/dashboard/'+path,{waitUntil:'domcontentloaded'});await page.waitForTimeout(100);}
 async function check(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS '+name);}catch(error){results.push({name,passed:false,error:error.stack});console.log('FAIL '+name+': '+error.message);}}
 let branchId,employeeId,loanId;
 await check('Central creates branch and its administrator through UI',async()=>{
  await go('branches.html');await page.locator('#addBranchBtn').click();for(const [id,text] of Object.entries({branchName:'نمایندگی کابل',branchCode:'KBL',branchAdminName:'مدیر کابل',branchUsername:'kabul-admin',branchPassword:'branch12345'}))await page.locator('#'+id).fill(text);await page.locator('#saveBranchBtn').click();await page.locator('#branchModal').waitFor({state:'hidden'});branchId=await page.evaluate(()=>OrgContext.organizations().find(o=>o.code==='KBL').id);assert.ok(branchId);
  await page.locator('[data-manage="'+branchId+'"]').click();await page.waitForURL('**/dashboard/dashboard.html');assert.equal(await page.locator('#organizationSelector').inputValue(),branchId);
 });
 await check('New branch business pages are empty and do not inherit central data',async()=>{
  for(const path of ['products.html','customers.html','suppliers.html','purchases.html','sales.html','inventory.html','receipts.html','payments.html','reports.html','price-list.html','customer-balance.html','financial-transactions.html']){
   await go(path);assert.equal(await page.evaluate(()=>FrontendStore.read('products',DemoData.products).length),0);const text=await page.locator('main').innerText();assert.equal(text.includes('آرمان پوراحمد'),false,path);assert.equal(text.includes('شرکت تدبیر'),false,path);
  }
 });
 await check('Central can create staff in a branch and branch data persists',async()=>{
  await go('employees.html');await page.locator('#addEmployeeBtn').click();for(const [id,text] of Object.entries({employeeCode:'EMP-KBL-1',employeeName:'کارمند کابل',employeeJob:'فروشنده',employeeSalary:'1000',employeeStart:'2026-10-28'}))await page.locator('#'+id).fill(text);await page.locator('#employeeSave').click();await page.locator('#employeeModal').waitFor({state:'hidden'});employeeId=await page.evaluate(()=>EmployeeService.employees()[0].id);await page.reload({waitUntil:'domcontentloaded'});assert.match(await page.locator('#employeesBody').innerText(),/کارمند کابل/);
 });
 await check('Branch login has only own organization and cannot edit admin credentials',async()=>{
  await page.evaluate(()=>OrgContext.logout());await go('login.html');await page.locator('#loginUsername').fill('kabul-admin');await page.locator('#loginPassword').fill('branch12345');await page.locator('#loginBtn').click();await page.waitForURL('**/dashboard/dashboard.html');assert.equal(await page.locator('#organizationSelector').count(),0);assert.equal(await page.locator('.sidebar a[href="branches.html"]').count(),0);await go('users.html');assert.equal(await page.locator('.edit-user').count(),0);
  const result=await page.evaluate(async()=>{try{await OrgContext.saveAccount({...OrgContext.principal(),password:'changed12345'});return false;}catch{return true;}});assert.equal(result,true);await go('branches.html');await page.waitForURL('**/dashboard/dashboard.html');
 });
 await check('Branch admin creates an employee login but cannot grant admin role',async()=>{
  await go('users.html?employee='+employeeId);await page.locator('#username').fill('kabul-staff');await page.locator('#email').fill('staff@example.com');await page.locator('#password').fill('staff12345');assert.equal(await page.locator('#role option').count(),1);await page.locator('#saveUserBtn').click();await page.locator('#userModal').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>OrgContext.accounts().some(a=>a.username==='kabul-staff' && a.accessRole==='employee')),true);
 });
 await check('Loans, payroll deductions, duplicate control and cash repayment work',async()=>{
  await go('employees.html');await page.locator('[data-bs-target="#loansTab"]').click();await page.locator('#addLoanBtn').click();await page.locator('#loanEmployee').selectOption(employeeId);await page.locator('#loanAmount').fill('300');await page.locator('#loanInstallment').fill('50');await page.locator('#loanSave').click();await page.locator('#loanModal').waitFor({state:'hidden'});loanId=await page.evaluate(()=>EmployeeService.loans()[0].id);
  await page.locator('[data-bs-target="#payrollTab"]').click();await page.locator('#addPayBtn').click();await page.locator('#payEmployee').selectOption(employeeId);await page.locator('#payMonth').fill('2026-10');await page.locator('#payBonus').fill('100');await page.locator('#payDeduction').fill('20');assert.equal(await page.locator('#payLoanDeduction').inputValue(),'50');await page.locator('#paySave').click();await page.locator('#payModal').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>EmployeeService.payroll()[0].net),1030);assert.equal(await page.evaluate(()=>EmployeeService.loans()[0].remaining),250);
  await page.locator('#addPayBtn').click();await page.locator('#payEmployee').selectOption(employeeId);await page.locator('#payMonth').fill('2026-10');await page.locator('#paySave').click();assert.match(await page.locator('#payError').innerText(),/قبلاً/);await page.locator('#payModal .btn-close').click();await page.locator('#payModal').waitFor({state:'hidden'});
  await page.locator('[data-bs-target="#loansTab"]').click();await page.locator('[data-repay="'+loanId+'"]').click();await page.locator('#repayAmount').fill('250');await page.locator('#repaySave').click();await page.locator('#repayModal').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>EmployeeService.loans()[0].remaining),0);
 });
 await check('Attendance upserts one entry and salary PDF downloads',async()=>{
  await page.locator('[data-bs-target="#attendanceTab"]').click();await page.locator('#addAttendanceBtn').click();await page.locator('#attEmployee').selectOption(employeeId);await page.locator('#attSave').click();await page.locator('#attModal').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>EmployeeService.attendance().length),1);
  await page.locator('[data-bs-target="#payrollTab"]').click();const download=page.waitForEvent('download');await page.locator('[data-payslip]').first().click();const file=await download;assert.match(file.suggestedFilename(),/\.pdf$/);await file.saveAs(outputDir+'/salary-slip.pdf');
 });
 await check('Employee operates own business but cannot access HR, users or other branches',async()=>{
  await page.evaluate(()=>OrgContext.logout());await go('login.html');await page.locator('#loginUsername').fill('kabul-staff');await page.locator('#loginPassword').fill('staff12345');await page.locator('#loginBtn').click();await page.waitForURL('**/dashboard/dashboard.html');assert.equal(await page.locator('.sidebar a[href="employees.html"]').count(),0);
  await go('products.html');assert.equal(await page.locator('#addProductBtn').count(),1);await go('employees.html');await page.waitForURL('**/dashboard/dashboard.html');assert.equal(await page.evaluate(()=>{try{FrontendStore.write('payroll',[]);return false;}catch{return true;}}),true);
 });
 await check('Central retains all branch control and center staff remain independent',async()=>{
  await page.evaluate(()=>OrgContext.logout());await go('login.html');await page.locator('#loginUsername').fill('admin');await page.locator('#loginPassword').fill('admin12345');await page.locator('#loginBtn').click();await page.waitForURL('**/dashboard/dashboard.html');await go('employees.html');assert.equal(await page.evaluate(()=>EmployeeService.employees().length),0);await page.locator('#organizationSelector').selectOption(branchId);await page.waitForLoadState('domcontentloaded');await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>EmployeeService.employees().length),1);
 });
 await check('Employee management remains usable on mobile and desktop',async()=>{
  for(const width of [360,1440]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(550);await page.screenshot({path:outputDir+'/employees-'+width+'.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
 });
 await check('No unexpected JavaScript errors during organization workflows',async()=>assert.deepEqual(errors,[]));
 fs.writeFileSync(outputDir+'/organization-workflows.json',JSON.stringify(results,null,2));await browser.close();if(results.some(r=>!r.passed))process.exitCode=1;
})();
