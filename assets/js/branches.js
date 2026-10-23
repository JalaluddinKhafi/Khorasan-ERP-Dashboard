function renderBranches(){
    const organizations=OrgContext.organizations().filter(o=>o.id!=='center');
    destroyDataTable('branchesTable');
    document.getElementById('branchCount').textContent=organizations.length;
    document.getElementById('activeBranchCount').textContent=organizations.filter(o=>o.status==='active').length;
    document.getElementById('branchesBody').innerHTML=organizations.map(o=>`<tr><td>${escapeHTML(o.code)}</td><td>${escapeHTML(o.name)}</td><td>${escapeHTML(OrgContext.adminInfo(o.id)?.fullname || '---')}</td><td>${escapeHTML(o.phone)}</td><td><span class="badge ${o.status==='active'?'bg-success':'bg-secondary'}">${o.status==='active'?'فعال':'غیرفعال'}</span></td><td><div class="d-flex flex-wrap gap-1"><button class="btn btn-sm btn-primary" data-manage="${o.id}">مدیریت</button><button class="btn btn-sm btn-info" data-edit="${o.id}">ویرایش</button><button class="btn btn-sm btn-secondary" data-users="${o.id}">کاربران / رمز ادمین</button></div></td></tr>`).join('');
    $('#branchesTable').DataTable({language: window.PersianTableLanguage});
}
function editBranch(id){
    const branch=OrgContext.organizations().find(o=>o.id===id);
    document.getElementById('branchForm').reset();document.getElementById('branchId').value=branch?.id || '';
    for(const [field,value] of Object.entries({branchName:branch?.name||'',branchCode:branch?.code||'',branchPhone:branch?.phone||'',branchAddress:branch?.address||'',branchStatus:branch?.status||'active'}))document.getElementById(field).value=value;
    document.getElementById('branchAdminFields').hidden=Boolean(branch);
    document.querySelectorAll('#branchAdminFields input').forEach(input=>{input.disabled=Boolean(branch);});
    document.getElementById('branchError').textContent='';bootstrap.Modal.getOrCreateInstance(document.getElementById('branchModal')).show();
}
document.getElementById('addBranchBtn').onclick=()=>editBranch();
document.getElementById('branchesBody').onclick=event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.edit)editBranch(button.dataset.edit);
    else{OrgContext.selectOrg(button.dataset.manage||button.dataset.users);location.href=button.dataset.users?'users.html':'dashboard.html';}
};
document.getElementById('saveBranchBtn').onclick=async()=>{
    if(!validateForm('branchForm'))return;const button=document.getElementById('saveBranchBtn');if(button.disabled)return;button.disabled=true;
    try{await OrgContext.saveBranch({id:document.getElementById('branchId').value,name:document.getElementById('branchName').value,code:document.getElementById('branchCode').value,phone:document.getElementById('branchPhone').value,address:document.getElementById('branchAddress').value,status:document.getElementById('branchStatus').value,adminName:document.getElementById('branchAdminName').value,username:document.getElementById('branchUsername').value,password:document.getElementById('branchPassword').value});bootstrap.Modal.getInstance(document.getElementById('branchModal')).hide();renderBranches();showToast('نمایندگی با موفقیت ذخیره شد');}
    catch(error){document.getElementById('branchError').textContent=error.message;}finally{button.disabled=false;}
};
loadSidebarAndNavbar('branches');renderBranches();
