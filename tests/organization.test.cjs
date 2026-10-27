'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{webcrypto}=require('node:crypto');
function environment(){
 const persistent=new Map(),session=new Map();const storage=map=>({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)});
 const context={console,crypto:webcrypto,TextEncoder,URLSearchParams,Date,Map,Set,Promise,setTimeout,clearTimeout,localStorage:storage(persistent),sessionStorage:storage(session),document:{addEventListener(){},visibilityState:'visible'},location:{pathname:'/dashboard/dashboard.html',search:'',replace(){}},addEventListener(){}};context.window=context;vm.createContext(context);
 for(const file of ['frontend-store','demo-data','utils','organization','employees-service'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/'+file+'.js'),'utf8'),context);
 return {c:context,persistent,session};
}
const branchInput=(name='Kabul')=>({name,code:name,username:'admin-'+name,password:'branch12345',adminName:'Admin '+name,status:'active'});
const staffInput={fullname:'Staff',code:'EMP-1',jobTitle:'Sales',salary:1000,currency:'AFN',startDate:'2026-10-28',status:'active'};
test('Central data migrates and tenants never inherit central or another branch fixtures',async()=>{
 const {c}=environment();c.FrontendStore.write('products',[{id:1,name:'Center'}]);const a=await c.OrgContext.saveBranch(branchInput('A')),b=await c.OrgContext.saveBranch(branchInput('B'));
 c.OrgContext.selectOrg(a.id);assert.equal(c.FrontendStore.read('products',c.DemoData.products).length,0);c.FrontendStore.write('products',[{id:1,name:'A'}]);
 c.OrgContext.selectOrg(b.id);assert.equal(c.FrontendStore.read('products',c.DemoData.products).length,0);c.OrgContext.selectOrg('center');assert.equal(c.FrontendStore.read('products')[0].name,'Center');
 c.OrgContext.selectOrg(a.id);assert.equal(c.FrontendStore.read('products')[0].name,'A');
});
test('Branch admin cannot switch tenant, change admin credentials, escalate roles or edit another account',async()=>{
 const {c}=environment();const a=await c.OrgContext.saveBranch(branchInput('A'));await c.OrgContext.saveBranch(branchInput('B'));await c.OrgContext.login('admin-A','branch12345');
 assert.equal(c.OrgContext.currentOrgId(),a.id);assert.throws(()=>c.OrgContext.selectOrg('center'));
 const admin=c.OrgContext.principal();await assert.rejects(c.OrgContext.saveAccount({...admin,password:'newpassword'}),/ادمین/);
 await assert.rejects(c.OrgContext.saveAccount({username:'bad',fullname:'Bad',accessRole:'central_admin',password:'longpassword',status:'فعال'}),/نقش/);
 await assert.rejects(c.OrgContext.saveBranch(branchInput('C')));
 const staff=await c.OrgContext.saveAccount({username:'staff',fullname:'Staff',accessRole:'employee',password:'staff12345',status:'فعال'});assert.equal(staff.orgId,a.id);
 await c.OrgContext.login('staff','staff12345');assert.equal(c.OrgContext.isAdmin(),false);assert.throws(()=>c.OrgContext.accounts());assert.throws(()=>c.FrontendStore.write('employees',[]));assert.throws(()=>c.FrontendStore.read('payroll',[]));c.FrontendStore.write('customers',[{id:1,name:'Own client'}]);
});
test('Only central admin resets branch admin credentials; disabled branches cannot log in',async()=>{
 const {c}=environment();const branch=await c.OrgContext.saveBranch(branchInput());c.OrgContext.selectOrg(branch.id);const admin=c.OrgContext.accounts()[0];await c.OrgContext.saveAccount({...admin,password:'changed12345'});
 await assert.rejects(c.OrgContext.login(admin.username,'branch12345'));await c.OrgContext.login(admin.username,'changed12345');await c.OrgContext.login('admin','admin12345');await c.OrgContext.saveBranch({...branch,status:'inactive'});await assert.rejects(c.OrgContext.login(admin.username,'changed12345'));
});
test('Salary net, debt installments, overpayments, duplicates and tenant isolation are correct',async()=>{
 const {c}=environment();const branch=await c.OrgContext.saveBranch(branchInput());c.OrgContext.selectOrg(branch.id);const e=c.EmployeeService.saveEmployee(staffInput);
 const loan=c.EmployeeService.issueLoan({employeeId:e.id,amount:300,monthlyDeduction:50,date:'2026-10-28'});const salary=c.EmployeeService.paySalary({employeeId:e.id,month:'2026-10',date:'2026-10-28',bonus:100,deduction:20,loanDeduction:50});assert.equal(salary.net,1030);assert.equal(c.EmployeeService.loans()[0].remaining,250);
 assert.throws(()=>c.EmployeeService.paySalary({employeeId:e.id,month:'2026-10',date:'2026-10-28'}),/قبلاً/);assert.throws(()=>c.EmployeeService.repay({loanId:loan.id,amount:251,date:'2026-10-28'}),/بیشتر/);
 c.EmployeeService.repay({loanId:loan.id,amount:250,date:'2026-10-28'});assert.equal(c.EmployeeService.loans()[0].remaining,0);
 c.EmployeeService.recordAttendance({employeeId:e.id,date:'2026-10-28',status:'present'});c.EmployeeService.recordAttendance({employeeId:e.id,date:'2026-10-28',status:'leave'});assert.equal(c.EmployeeService.attendance().length,1);
 assert.throws(()=>c.EmployeeService.saveEmployee({...e,currency:'USD'}),/واحد پول/);
 c.OrgContext.selectOrg('center');assert.equal(c.EmployeeService.employees().length,0);assert.equal(c.EmployeeService.payroll().length,0);
});
test('Archiving employees preserves their financial history and suspends linked login',async()=>{
 const {c}=environment();const branch=await c.OrgContext.saveBranch(branchInput());c.OrgContext.selectOrg(branch.id);const e=c.EmployeeService.saveEmployee(staffInput);
 await c.OrgContext.saveAccount({fullname:e.fullname,username:'employee',password:'employee12345',accessRole:'employee',employeeId:e.id,status:'فعال'});c.EmployeeService.issueLoan({employeeId:e.id,amount:100,date:'2026-10-28'});c.EmployeeService.saveEmployee({...e,status:'inactive'});assert.equal(c.EmployeeService.loans().length,1);await assert.rejects(c.OrgContext.login('employee','employee12345'));assert.throws(()=>c.EmployeeService.issueLoan({employeeId:e.id,amount:20,date:'2026-10-28'}),/غیرفعال/);
});
