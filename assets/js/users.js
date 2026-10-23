let usersData=[];
let deleteUserId=null;
function loadUsers(){usersData=OrgContext.accounts();renderUsersTable();}
function canEditUser(user){return OrgContext.isCentral() || user.accessRole==='employee';}
function renderUsersTable(){
    destroyDataTable('usersTable');
    document.getElementById('usersTableBody').innerHTML=usersData.map(u=>`<tr><td>${escapeHTML(u.id)}</td><td>${escapeHTML(u.username)}</td><td>${escapeHTML(u.fullname)}</td><td><span class="badge ${u.accessRole==='employee'?'bg-info':'bg-danger'}">${escapeHTML(u.role)}</span></td><td>${escapeHTML(u.email)}</td><td><span class="badge ${u.status==='فعال'?'bg-success':'bg-secondary'}">${escapeHTML(u.status)}</span></td><td>${escapeHTML(u.lastLogin)}</td><td>${canEditUser(u)?`<button class="btn btn-sm btn-info edit-user" data-id="${escapeHTML(u.id)}"><i class="fas fa-edit"></i></button> ${u.id!==OrgContext.principal().id?`<button class="btn btn-sm btn-danger delete-user" data-id="${escapeHTML(u.id)}"><i class="fas fa-trash"></i></button>`:''}`:'<span class="text-muted small">مدیریت توسط مرکز</span>'}</td></tr>`).join('');
    $('#usersTable').DataTable({language: window.PersianTableLanguage,pageLength:10});
}
function prepareUserForm(user=null){
    const form=document.getElementById('userForm');form.reset();document.getElementById('userError').textContent='';
    document.getElementById('userId').value=user?.id||'';
    for(const field of ['username','fullname','email','phone','status'])if(user)document.getElementById(field).value=user[field]||'';
    const role=document.getElementById('role');role.replaceChildren();
    if(OrgContext.isCentral())role.add(new Option(OrgContext.isBranch()?'مدیر نمایندگی':'مدیر سیستم',OrgContext.isBranch()?'branch_admin':'central_admin'));
    role.add(new Option('کارمند','employee'));role.value=user?.accessRole||'employee';
    const employee=document.getElementById('userEmployee');employee.replaceChildren(new Option('بدون ارتباط',''));
    FrontendStore.read('employees',[]).forEach(e=>employee.add(new Option(e.fullname,e.id)));employee.value=user?.employeeId||'';
    document.getElementById('password').required=!user;document.getElementById('password').minLength=8;
}
function editUser(id){const user=usersData.find(u=>String(u.id)===String(id));if(!user||!canEditUser(user))return;prepareUserForm(user);bootstrap.Modal.getOrCreateInstance(document.getElementById('userModal')).show();}
async function saveUser(){
    if(!validateForm('userForm'))return;const button=document.getElementById('saveUserBtn');if(button.disabled)return;button.disabled=true;
    try{await OrgContext.saveAccount({id:document.getElementById('userId').value,username:document.getElementById('username').value,fullname:document.getElementById('fullname').value,email:document.getElementById('email').value,phone:document.getElementById('phone').value,status:document.getElementById('status').value,accessRole:document.getElementById('role').value,password:document.getElementById('password').value,employeeId:document.getElementById('userEmployee').value});loadUsers();bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();showToast('کاربر با موفقیت ذخیره شد');}
    catch(error){document.getElementById('userError').textContent=error.message;}finally{button.disabled=false;}
}
function showDeleteUserModal(id){deleteUserId=id;bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteModal')).show();}
function confirmDeleteUser(){try{OrgContext.deleteAccount(deleteUserId);loadUsers();bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();showToast('کاربر با موفقیت حذف شد');}catch(error){showToast(error.message,'error');}}
document.getElementById('usersTableBody').onclick=event=>{const button=event.target.closest('button');if(button?.classList.contains('edit-user'))editUser(button.dataset.id);if(button?.classList.contains('delete-user'))showDeleteUserModal(button.dataset.id);};
document.querySelector('[data-bs-target="#userModal"]').addEventListener('click',()=>prepareUserForm());
document.getElementById('saveUserBtn').onclick=saveUser;document.getElementById('confirmDeleteUserBtn').onclick=confirmDeleteUser;
document.getElementById('userEmployee').onchange=event=>{const employee=FrontendStore.read('employees',[]).find(e=>e.id===event.target.value);if(employee){document.getElementById('fullname').value=employee.fullname;document.getElementById('phone').value=employee.phone;document.getElementById('email').value=employee.email||'';}};
loadSidebarAndNavbar('users');loadUsers();
const employeeId=getUrlParam('employee');
if(employeeId){const user=usersData.find(u=>u.employeeId===employeeId);if(user)editUser(user.id);else{prepareUserForm();document.getElementById('userEmployee').value=employeeId;document.getElementById('userEmployee').dispatchEvent(new Event('change'));bootstrap.Modal.getOrCreateInstance(document.getElementById('userModal')).show();}}
