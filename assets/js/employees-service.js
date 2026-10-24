/* Human-resources ledger. All writes use the currently selected organization. */
(function(){
    'use strict';
    const clone=value=>JSON.parse(JSON.stringify(value));
    const round=value=>Math.round((Number(value)+Number.EPSILON)*100)/100;
    const list=name=>FrontendStore.read(name,[]);
    const id=()=>crypto.randomUUID();
    function admin(){if(!OrgContext.isAdmin())throw new Error('صلاحیت مدیریت کارمندان ندارید');}
    function positive(value,allowZero=false){const n=Number(value);if(!Number.isFinite(n)||(allowZero?n<0:n<=0))throw new Error('مبلغ معتبر وارد کنید');return round(n);}
    function employee(employeeId){const e=list('employees').find(x=>x.id===employeeId);if(!e)throw new Error('کارمند یافت نشد');return e;}
    function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!dateKey(value))throw new Error('تاریخ معتبر انتخاب کنید');return value;}
    function outstanding(loan,repayments=list('employeeRepayments')){return round(loan.amount-repayments.filter(r=>r.loanId===loan.id).reduce((sum,r)=>sum+r.amount,0));}
    function expenseFor(e,amount,desc,date,sourceId){return {id:sourceId,date:formatDate(date+'T12:00:00'),isoDate:date,category:'معاش',desc,amount,method:'نقدی',docNo:sourceId,hrSourceId:sourceId};}
    const api={
        employees(){admin();return list('employees');},
        loans(){admin();const repayments=list('employeeRepayments');return list('employeeLoans').map(loan=>({...loan,remaining:outstanding(loan,repayments)}));},
        payroll(){admin();return list('payroll');},
        attendance(){admin();return list('attendance');},
        ledger(){admin();return list('hrTransactions');},
        saveEmployee(input){
            admin();const data=list('employees'),existing=data.find(e=>e.id===input.id);
            if(input.id && !existing)throw new Error('کارمند یافت نشد');
            if(!input.fullname?.trim() || !input.code?.trim() || !input.jobTitle?.trim())throw new Error('نام، کد و وظیفه کارمند الزامی است');
            if(data.some(e=>e.code===input.code.trim() && e.id!==input.id))throw new Error('کد کارمند تکراری است');
            if(!['AFN','USD','IRR'].includes(input.currency))throw new Error('واحد پول نامعتبر است');
            if(existing && existing.currency!==input.currency && (list('employeeLoans').some(l=>l.employeeId===existing.id)||list('payroll').some(p=>p.employeeId===existing.id)))throw new Error('واحد پول کارمند دارای سوابق مالی قابل تغییر نیست');
            const record={id:existing?.id||id(),code:input.code.trim(),fullname:input.fullname.trim(),phone:input.phone||'',email:input.email||'',jobTitle:input.jobTitle.trim(),salary:positive(input.salary,true),currency:input.currency,startDate:validDate(input.startDate),status:input.status==='inactive'?'inactive':'active',nationalId:input.nationalId||'',address:input.address||'',emergencyPhone:input.emergencyPhone||'',notes:input.notes||''};
            FrontendStore.write('employees',existing?data.map(e=>e.id===existing.id?record:e):[...data,record]);
            if(existing && existing.status!==record.status)OrgContext.syncEmployeeStatus(record.id,record.status==='active');
            return clone(record);
        },
        issueLoan(input){
            admin();const e=employee(input.employeeId);if(e.status!=='active')throw new Error('کارمند غیرفعال است');
            const amount=positive(input.amount),date=validDate(input.date),monthlyDeduction=positive(input.monthlyDeduction||0,true);
            if(monthlyDeduction>amount)throw new Error('قسط ماهانه بیشتر از مبلغ قرض است');
            const loan={id:id(),employeeId:e.id,employeeName:e.fullname,kind:input.kind==='advance'?'advance':'loan',amount,currency:e.currency,date,monthlyDeduction,notes:input.notes||''};
            const ledger={id:id(),employeeId:e.id,date,type:loan.kind,amount,currency:e.currency,ref:loan.id};
            FrontendStore.writeMany({employeeLoans:[...list('employeeLoans'),loan],hrTransactions:[...list('hrTransactions'),ledger]});return clone(loan);
        },
        repay(input){
            admin();const loan=list('employeeLoans').find(l=>l.id===input.loanId);if(!loan)throw new Error('قرض یافت نشد');
            const amount=positive(input.amount),date=validDate(input.date);
            if(amount>outstanding(loan))throw new Error('مبلغ بازپرداخت بیشتر از مانده قرض است');
            const repayment={id:id(),loanId:loan.id,employeeId:loan.employeeId,amount,date,method:'cash',notes:input.notes||''};
            FrontendStore.writeMany({employeeRepayments:[...list('employeeRepayments'),repayment],hrTransactions:[...list('hrTransactions'),{id:id(),employeeId:loan.employeeId,date,type:'repayment',amount,currency:loan.currency,ref:repayment.id}]});return clone(repayment);
        },
        paySalary(input){
            admin();const e=employee(input.employeeId);if(e.status!=='active')throw new Error('کارمند غیرفعال است');
            if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month))throw new Error('ماه معاش نامعتبر است');
            const payroll=list('payroll');if(payroll.some(p=>p.employeeId===e.id && p.month===input.month))throw new Error('معاش این ماه قبلاً ثبت شده است');
            const bonus=positive(input.bonus||0,true),deduction=positive(input.deduction||0,true),loanDeduction=positive(input.loanDeduction||0,true),date=validDate(input.date);
            const repayments=list('employeeRepayments'),loans=list('employeeLoans').filter(l=>l.employeeId===e.id && l.currency===e.currency);
            const debt=round(loans.reduce((sum,l)=>sum+outstanding(l,repayments),0));
            if(loanDeduction>debt)throw new Error('کسر قرض بیشتر از مانده قرض کارمند است');
            const net=round(e.salary+bonus-deduction-loanDeduction);if(net<0)throw new Error('مجموع کسورات بیشتر از معاش است');
            const record={id:id(),employeeId:e.id,employeeName:e.fullname,month:input.month,baseSalary:e.salary,bonus,deduction,loanDeduction,net,currency:e.currency,date,notes:input.notes||''};
            let remaining=loanDeduction;
            for(const loan of loans){const amount=Math.min(remaining,Math.max(0,outstanding(loan,repayments)));if(amount){repayments.push({id:id(),loanId:loan.id,employeeId:e.id,amount,date,method:'payroll',payrollId:record.id});remaining=round(remaining-amount);}}
            const updates={payroll:[...payroll,record],employeeRepayments:repayments,hrTransactions:[...list('hrTransactions'),{id:id(),employeeId:e.id,date,type:'salary',amount:net,currency:e.currency,ref:record.id}]};
            // The original expense ledger is denominated in toman. Never mix AFN/USD into it.
            if(e.currency==='IRR')updates.expenses=[...FrontendStore.read('expenses',DemoData.expenses),expenseFor(e,round(e.salary+bonus-deduction),'معاش '+e.fullname+' - '+input.month,date,record.id)];
            FrontendStore.writeMany(updates);return clone(record);
        },
        recordAttendance(input){
            admin();const e=employee(input.employeeId),date=validDate(input.date);
            if(e.status!=='active')throw new Error('کارمند غیرفعال است');
            if(!['present','absent','leave'].includes(input.status))throw new Error('وضعیت حضور نامعتبر است');
            const rows=list('attendance'),existing=rows.find(r=>r.employeeId===e.id && r.date===date);
            const record={id:existing?.id||id(),employeeId:e.id,employeeName:e.fullname,date,status:input.status,notes:input.notes||''};
            FrontendStore.write('attendance',existing?rows.map(r=>r.id===existing.id?record:r):[...rows,record]);return clone(record);
        },
        statement(employeeId){
            admin();const e=employee(employeeId);
            return {employee:e,loans:api.loans().filter(l=>l.employeeId===e.id),payroll:api.payroll().filter(p=>p.employeeId===e.id),repayments:list('employeeRepayments').filter(r=>r.employeeId===e.id),ledger:api.ledger().filter(t=>t.employeeId===e.id)};
        }
    };
    window.EmployeeService=Object.freeze(api);
})();
