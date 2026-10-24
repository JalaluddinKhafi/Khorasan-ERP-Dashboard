const hrLabels={AFN:'افغانی',USD:'دلار',IRR:'تومان',loan:'قرض',advance:'پیش‌پرداخت',repayment:'بازپرداخت',salary:'معاش',present:'حاضر',absent:'غایب',leave:'رخصتی'};
const hrMoney=(amount,currency)=>Number(amount).toLocaleString()+' '+(hrLabels[currency]||currency);
const value=id=>document.getElementById(id).value;
function hrTable(name,rows){destroyDataTable(name+'Table');document.getElementById(name+'Body').innerHTML=rows.join('');$('#'+name+'Table').DataTable({language: window.PersianTableLanguage,pageLength:10,order:[]});}
function renderEmployees(){
    const employees=EmployeeService.employees(),loans=EmployeeService.loans();
    document.getElementById('employeeCount').textContent=employees.filter(e=>e.status==='active').length;
    const totals={};loans.forEach(l=>{totals[l.currency]=(totals[l.currency]||0)+l.remaining;});
    document.getElementById('employeeDebtSummary').textContent=Object.entries(totals).map(([currency,amount])=>hrMoney(amount,currency)).join(' | ')||'۰';
    hrTable('employees',employees.map(e=>`<tr><td>${escapeHTML(e.code)}</td><td>${escapeHTML(e.fullname)}</td><td>${escapeHTML(e.jobTitle)}</td><td>${hrMoney(e.salary,e.currency)}</td><td>${escapeHTML(e.phone)}</td><td><span class="badge ${e.status==='active'?'bg-success':'bg-secondary'}">${e.status==='active'?'فعال':'غیرفعال'}</span></td><td><div class="d-flex flex-wrap gap-1"><button class="btn btn-sm btn-info" data-employee="${e.id}">ویرایش</button><button class="btn btn-sm btn-secondary" data-statement="${e.id}">صورت حساب</button><a class="btn btn-sm btn-primary" href="users.html?employee=${encodeURIComponent(e.id)}">حساب کاربری</a></div></td></tr>`));
    hrTable('loans',loans.map(l=>`<tr><td>${escapeHTML(l.employeeName)}</td><td>${hrLabels[l.kind]}</td><td>${escapeHTML(l.date)}</td><td>${hrMoney(l.amount,l.currency)}</td><td>${hrMoney(l.remaining,l.currency)}</td><td>${hrMoney(l.monthlyDeduction,l.currency)}</td><td>${l.remaining>0?`<button class="btn btn-sm btn-success" data-repay="${l.id}">بازپرداخت</button>`:'تسویه شده'}</td></tr>`));
    hrTable('payroll',EmployeeService.payroll().map(p=>`<tr><td>${escapeHTML(p.employeeName)}</td><td>${escapeHTML(p.month)}</td><td>${hrMoney(p.baseSalary,p.currency)}</td><td>${hrMoney(p.bonus,p.currency)}</td><td>${hrMoney(p.deduction,p.currency)}</td><td>${hrMoney(p.loanDeduction,p.currency)}</td><td>${hrMoney(p.net,p.currency)}</td><td>${escapeHTML(p.date)}</td><td><button class="btn btn-sm btn-primary" data-payslip="${p.id}">فیش معاش PDF</button></td></tr>`));
    hrTable('attendance',EmployeeService.attendance().map(a=>`<tr><td>${escapeHTML(a.employeeName)}</td><td>${escapeHTML(a.date)}</td><td>${hrLabels[a.status]}</td><td>${escapeHTML(a.notes)}</td></tr>`));
    hrTable('hrLedger',EmployeeService.ledger().map(t=>`<tr><td>${escapeHTML(employees.find(e=>e.id===t.employeeId)?.fullname || '---')}</td><td>${escapeHTML(t.date)}</td><td>${hrLabels[t.type]||escapeHTML(t.type)}</td><td>${Number(t.amount).toLocaleString()}</td><td>${hrLabels[t.currency]}</td></tr>`));
}
function openHrModal(name){document.getElementById(name+'Form').reset();document.getElementById(name+'Error').textContent='';document.querySelectorAll('#'+name+'Form input[type="date"]').forEach(input=>input.value=todayISO());bootstrap.Modal.getOrCreateInstance(document.getElementById(name+'Modal')).show();}
function populateEmployees(selectId){const select=document.getElementById(selectId);select.replaceChildren(new Option('انتخاب کارمند',''));EmployeeService.employees().filter(e=>e.status==='active').forEach(e=>select.add(new Option(e.fullname,e.id)));}
function editEmployee(id){
    openHrModal('employee');const e=EmployeeService.employees().find(x=>x.id===id);document.getElementById('employeeId').value=e?.id||'';
    if(!e){document.getElementById('employeeStart').value=todayISO();return;}
    for(const [field,key] of Object.entries({employeeCode:'code',employeeName:'fullname',employeeJob:'jobTitle',employeePhone:'phone',employeeEmail:'email',employeeSalary:'salary',employeeCurrency:'currency',employeeStart:'startDate',employeeStatus:'status',employeeNationalId:'nationalId',employeeAddress:'address',employeeEmergency:'emergencyPhone',employeeNotes:'notes'}))document.getElementById(field).value=e[key]??'';
}
function openRepay(loanId){
    openHrModal('repay');const select=document.getElementById('repayLoan');select.replaceChildren(new Option('انتخاب قرض',''));
    EmployeeService.loans().filter(l=>l.remaining>0).forEach(l=>select.add(new Option(l.employeeName+' — '+hrMoney(l.remaining,l.currency),l.id)));
    if(loanId)select.value=loanId;
}
function payPreview(){
    const e=EmployeeService.employees().find(e=>e.id===value('payEmployee'));if(!e){document.getElementById('payPreview').textContent='کارمند را انتخاب کنید.';return;}
    const net=e.salary+Number(value('payBonus'))-Number(value('payDeduction'))-Number(value('payLoanDeduction'));
    const remaining=EmployeeService.loans().filter(l=>l.employeeId===e.id).reduce((sum,l)=>sum+l.remaining,0);
    document.getElementById('payPreview').textContent='معاش پایه: '+hrMoney(e.salary,e.currency)+' | مانده قرض: '+hrMoney(remaining,e.currency)+' | خالص پرداختی: '+hrMoney(net,e.currency);
}
async function submitHr(name,callback){
    if(!validateForm(name+'Form'))return;const button=document.getElementById(name+'Save');if(button.disabled)return;button.disabled=true;
    try{callback();renderEmployees();bootstrap.Modal.getInstance(document.getElementById(name+'Modal')).hide();showToast('اطلاعات با موفقیت ثبت شد');}
    catch(error){document.getElementById(name+'Error').textContent=error.message;}finally{button.disabled=false;}
}
document.getElementById('addEmployeeBtn').onclick=()=>editEmployee();
document.getElementById('employeeSave').onclick=()=>submitHr('employee',()=>EmployeeService.saveEmployee({id:value('employeeId'),code:value('employeeCode'),fullname:value('employeeName'),jobTitle:value('employeeJob'),phone:value('employeePhone'),email:value('employeeEmail'),salary:value('employeeSalary'),currency:value('employeeCurrency'),startDate:value('employeeStart'),status:value('employeeStatus'),nationalId:value('employeeNationalId'),address:value('employeeAddress'),emergencyPhone:value('employeeEmergency'),notes:value('employeeNotes')}));
document.getElementById('addLoanBtn').onclick=()=>{openHrModal('loan');populateEmployees('loanEmployee');};
document.getElementById('loanSave').onclick=()=>submitHr('loan',()=>EmployeeService.issueLoan({employeeId:value('loanEmployee'),kind:value('loanKind'),amount:value('loanAmount'),monthlyDeduction:value('loanInstallment'),date:value('loanDate'),notes:value('loanNotes')}));
document.getElementById('addRepayBtn').onclick=()=>openRepay();
document.getElementById('repaySave').onclick=()=>submitHr('repay',()=>EmployeeService.repay({loanId:value('repayLoan'),amount:value('repayAmount'),date:value('repayDate'),notes:value('repayNotes')}));
document.getElementById('addPayBtn').onclick=()=>{openHrModal('pay');populateEmployees('payEmployee');document.getElementById('payMonth').value=todayISO().slice(0,7);payPreview();};
document.getElementById('paySave').onclick=()=>submitHr('pay',()=>EmployeeService.paySalary({employeeId:value('payEmployee'),month:value('payMonth'),date:value('payDate'),bonus:value('payBonus'),deduction:value('payDeduction'),loanDeduction:value('payLoanDeduction'),notes:value('payNotes')}));
document.getElementById('payEmployee').onchange=()=>{const loans=EmployeeService.loans().filter(l=>l.employeeId===value('payEmployee'));document.getElementById('payLoanDeduction').value=loans.reduce((sum,l)=>sum+Math.min(l.remaining,l.monthlyDeduction),0);payPreview();};
['payBonus','payDeduction','payLoanDeduction'].forEach(id=>document.getElementById(id).oninput=payPreview);
document.getElementById('addAttendanceBtn').onclick=()=>{openHrModal('att');populateEmployees('attEmployee');};
document.getElementById('attSave').onclick=()=>submitHr('att',()=>EmployeeService.recordAttendance({employeeId:value('attEmployee'),date:value('attDate'),status:value('attStatus'),notes:value('attNotes')}));
document.getElementById('exportHrExcel').onclick=()=>exportTableExcel('hrLedgerTable','employee-ledger');
function payslip(id){
    const p=EmployeeService.payroll().find(p=>p.id===id);if(!p)return;
    const card=document.createElement('div');card.className='card p-4';card.dir='rtl';
    card.innerHTML=`<h4>${escapeHTML(OrgContext.currentOrg().name)} — فیش معاش</h4><p>${escapeHTML(p.employeeName)} | ${escapeHTML(p.month)}</p><table class="table table-bordered"><tbody>${[['معاش پایه',p.baseSalary],['پاداش',p.bonus],['کسورات',p.deduction],['بازپرداخت قرض',p.loanDeduction],['خالص پرداختی',p.net]].map(([label,amount])=>`<tr><th>${label}</th><td>${hrMoney(amount,p.currency)}</td></tr>`).join('')}</tbody></table><p>تاریخ پرداخت: ${escapeHTML(p.date)}</p>`;
    exportElementPDF(card,'salary-'+p.month+'-'+p.id);
}
function statement(id){
    const s=EmployeeService.statement(id),modal=document.createElement('div');modal.className='modal fade';modal.tabIndex=-1;
    modal.innerHTML=`<div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h5>صورت حساب ${escapeHTML(s.employee.fullname)}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><p>معاش ماهانه: ${hrMoney(s.employee.salary,s.employee.currency)}</p><p>مانده قرض: ${hrMoney(s.loans.reduce((sum,l)=>sum+l.remaining,0),s.employee.currency)}</p><div class="table-responsive"><table class="table"><thead><tr><th>تاریخ</th><th>نوع</th><th>مبلغ</th></tr></thead><tbody>${s.ledger.map(t=>`<tr><td>${escapeHTML(t.date)}</td><td>${hrLabels[t.type]}</td><td>${hrMoney(t.amount,t.currency)}</td></tr>`).join('')}</tbody></table></div></div><div class="modal-footer"><button class="btn btn-primary" data-export-statement>خروجی PDF</button></div></div></div>`;
    document.body.appendChild(modal);modal.querySelector('[data-export-statement]').onclick=()=>exportElementPDF(modal.querySelector('.modal-body'),'employee-'+s.employee.code);modal.addEventListener('hidden.bs.modal',()=>modal.remove());bootstrap.Modal.getOrCreateInstance(modal).show();
}
document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.employee)editEmployee(button.dataset.employee);if(button.dataset.repay)openRepay(button.dataset.repay);if(button.dataset.payslip)payslip(button.dataset.payslip);if(button.dataset.statement)statement(button.dataset.statement);});
loadSidebarAndNavbar('employees');renderEmployees();
