/* Frontend-only identity and organization model. Spring Security must enforce this on the server later. */
(function () {
    'use strict';
    const registryKey='khorasan.organizations.v1';
    const sessionKey='khorasan.session.v1';
    const selectedKey='khorasan.selected-org.v1';
    const copy=value=>JSON.parse(JSON.stringify(value));
    const initialVerifier={"salt": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], "hash": [119, 227, 58, 139, 242, 48, 168, 17, 71, 39, 226, 240, 44, 67, 196, 66, 103, 118, 163, 138, 70, 186, 147, 208, 1, 236, 91, 111, 255, 61, 157, 88]};
    function registry() {
        const saved=localStorage.getItem(registryKey);
        if(saved) {const data=JSON.parse(saved);if(!Array.isArray(data.organizations)||!Array.isArray(data.accounts))throw new Error('اطلاعات سازمان نامعتبر است');return data;}
        // Preserve the original central users while introducing explicit organization roles.
        const legacy=FrontendStore.read('users',window.DemoData?.users || []);
        const accounts=legacy.map((user,index)=>({...user,id:String(user.id),orgId:'center',accessRole:index===0?'central_admin':'employee',demoVerifier:index===0 ? (user.demoVerifier || initialVerifier) : user.demoVerifier}));
        if(!accounts.length)accounts.push({id:'1',username:'admin',fullname:'ادمین مرکزی',orgId:'center',accessRole:'central_admin',status:'فعال',demoVerifier:initialVerifier});
        const data={organizations:[{id:'center',name:'مرکز',code:'CENTER',status:'active',address:'',phone:''}],accounts};
        localStorage.setItem(registryKey,JSON.stringify(data));
        return data;
    }
    function saveRegistry(data){localStorage.setItem(registryKey,JSON.stringify(data));}
    function principal() {
        const data=registry();
        const raw=sessionStorage.getItem(sessionKey);
        if(raw==='logged-out')return null;
        // Retain the existing frontend's central demo session on first visit.
        const id=raw ? JSON.parse(raw).accountId : null;
        const account=data.accounts.find(a=>a.id===id && a.status==='فعال');
        if(!account || !data.organizations.some(o=>o.id===account.orgId && o.status==='active'))return null;
        return copy(account);
    }
    function currentOrgId() {
        const user=principal();if(!user)return 'unauthenticated';
        if(user.accessRole!=='central_admin')return user.orgId;
        const selected=sessionStorage.getItem(selectedKey)||'center';
        return registry().organizations.some(o=>o.id===selected)?selected:'center';
    }
    function requireAdmin(){const user=principal();if(!user || !['central_admin','branch_admin'].includes(user.accessRole))throw new Error('صلاحیت مدیریت ندارید');return user;}
    function requireCentral(){const user=principal();if(user?.accessRole!=='central_admin')throw new Error('این عملیات تنها برای ادمین مرکزی مجاز است');return user;}
    async function verifier(password) {
        const salt=crypto.getRandomValues(new Uint8Array(16));
        const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
        const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'},key,256);
        return {salt:Array.from(salt),hash:Array.from(new Uint8Array(bits))};
    }
    async function matches(password,stored) {
        if(!stored)return false;
        const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
        const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new Uint8Array(stored.salt),iterations:120000,hash:'SHA-256'},key,256);
        return Array.from(new Uint8Array(bits)).every((n,i)=>n===stored.hash[i]);
    }
    const api={
        principal,currentOrgId,
        isCentral:()=>principal()?.accessRole==='central_admin',
        isAdmin:()=>['central_admin','branch_admin'].includes(principal()?.accessRole),
        isBranch:()=>currentOrgId()!=='center',
        currentOrg:()=>copy(registry().organizations.find(o=>o.id===currentOrgId()) || {name:'بدون دسترسی'}),
        organizations(){const user=principal();return copy(registry().organizations.filter(o=>user?.accessRole==='central_admin'||o.id===user?.orgId));},
        selectOrg(id){requireCentral();if(!registry().organizations.some(o=>o.id===id))throw new Error('نمایندگی یافت نشد');sessionStorage.setItem(selectedKey,id);},
        adminInfo(orgId){requireCentral();const account=registry().accounts.find(a=>a.orgId===orgId && a.accessRole==='branch_admin');return account?{fullname:account.fullname,username:account.username}:null;},
        syncEmployeeStatus(employeeId,active){requireAdmin();const data=registry();data.accounts.forEach(a=>{if(a.orgId===currentOrgId() && a.employeeId===employeeId && a.accessRole==='employee')a.status=active?'فعال':'غیرفعال';});saveRegistry(data);},
        accounts(){requireAdmin();return copy(registry().accounts.filter(a=>a.orgId===currentOrgId()));},
        async login(username,password){
            const account=registry().accounts.find(a=>a.username===username.trim() && a.status==='فعال');
            if(!account || !await matches(password,account.demoVerifier) || !registry().organizations.some(o=>o.id===account.orgId && o.status==='active'))throw new Error('نام کاربری یا رمز عبور نادرست است یا حساب غیرفعال است');
            const latest=registry(),current=latest.accounts.find(a=>a.id===account.id && a.status==='فعال');
            if(!current || JSON.stringify(current.demoVerifier)!==JSON.stringify(account.demoVerifier) || !latest.organizations.some(o=>o.id===current.orgId && o.status==='active'))throw new Error('حساب تغییر کرده است؛ دوباره وارد شوید');
            current.lastLogin=new Date().toLocaleString('fa-IR');saveRegistry(latest);
            sessionStorage.setItem(sessionKey,JSON.stringify({accountId:current.id}));sessionStorage.setItem(selectedKey,current.orgId);
        },
        logout(){sessionStorage.setItem(sessionKey,'logged-out');sessionStorage.removeItem(selectedKey);},
        async saveBranch(input){
            requireCentral();const data=registry();const existing=data.organizations.find(o=>o.id===input.id);
            if(existing?.id==='center')throw new Error('مرکز قابل تغییر به نمایندگی نیست');
            if(!input.name?.trim() || !input.code?.trim())throw new Error('نام و کد نمایندگی الزامی است');
            if(data.organizations.some(o=>o.code===input.code.trim() && o.id!==input.id))throw new Error('کد نمایندگی تکراری است');
            const organization={id:existing?.id || 'branch-'+crypto.randomUUID(),name:input.name.trim(),code:input.code.trim(),address:input.address || '',phone:input.phone || '',status:input.status==='inactive'?'inactive':'active'};
            let admin;
            if(!existing){
                if(!input.username?.trim() || !input.password || input.password.length<8)throw new Error('نام کاربری و رمز حداقل ۸ حرف برای ادمین نمایندگی الزامی است');
                if(data.accounts.some(a=>a.username===input.username.trim()))throw new Error('نام کاربری تکراری است');
                const demoVerifier=await verifier(input.password);
                admin={id:crypto.randomUUID(),username:input.username.trim(),fullname:input.adminName || input.name,phone:input.phone || '',email:input.email || '',status:'فعال',orgId:organization.id,accessRole:'branch_admin',role:'مدیر نمایندگی',lastLogin:'---',demoVerifier};
            }
            // Recheck authorization after asynchronous hashing.
            requireCentral();
            const latest=registry();
            if(!existing && latest.accounts.some(a=>a.username===admin.username))throw new Error('نام کاربری تکراری است');
            latest.organizations=existing?latest.organizations.map(o=>o.id===existing.id?organization:o):[...latest.organizations,organization];
            if(admin)latest.accounts.push(admin);saveRegistry(latest);return copy(organization);
        },
        async saveAccount(input){
            const actor=requireAdmin(),orgId=currentOrgId();const data=registry();
            const existing=data.accounts.find(a=>a.id===String(input.id));
            if(input.id && (!existing || existing.orgId!==orgId))throw new Error('کاربر در این نمایندگی نیست');
            if(actor.accessRole==='branch_admin' && existing?.accessRole!=='employee' && existing)throw new Error('ادمین نمایندگی نمی‌تواند حساب یا رمز ادمین را تغییر دهد');
            const role=input.accessRole || existing?.accessRole || 'employee';
            if(!['employee','central_admin','branch_admin'].includes(role) || (actor.accessRole!=='central_admin' && role!=='employee') || (role==='central_admin' && orgId!=='center') || (role==='branch_admin' && orgId==='center'))throw new Error('نقش انتخاب‌شده مجاز نیست');
            if(existing?.id===actor.id && (input.status!=='فعال' || role!==existing.accessRole))throw new Error('حساب فعال خود را نمی‌توانید غیرفعال کنید یا نقش آن را تغییر دهید');
            if(existing && existing.accessRole!=='employee' && (role!==existing.accessRole || input.status!=='فعال') && data.accounts.filter(a=>a.orgId===existing.orgId && a.accessRole===existing.accessRole && a.status==='فعال' && a.id!==existing.id).length===0)throw new Error('آخرین ادمین فعال را نمی‌توانید غیرفعال کنید');
            const username=input.username?.trim();if(!username || !input.fullname?.trim())throw new Error('نام و نام کاربری الزامی است');
            if(data.accounts.some(a=>a.username===username && a.id!==existing?.id))throw new Error('نام کاربری تکراری است');
            if(!existing && !input.password)throw new Error('رمز عبور برای کاربر جدید الزامی است');
            if(input.password && input.password.length<8)throw new Error('رمز عبور باید حداقل ۸ حرف باشد');
            if(input.employeeId){const staff=FrontendStore.read('employees',[]).find(e=>e.id===input.employeeId);if(!staff || staff.status!=='active')throw new Error('کارمند مرتبط باید فعال و متعلق به همین بخش باشد');if(data.accounts.some(a=>a.employeeId===input.employeeId && a.orgId===orgId && a.id!==existing?.id))throw new Error('این کارمند قبلاً حساب کاربری دارد');}
            const hash=input.password ? await verifier(input.password) : existing?.demoVerifier;
            const current=requireAdmin();if(current.id!==actor.id || currentOrgId()!==orgId)throw new Error('نشست تغییر کرده است؛ دوباره تلاش کنید');
            const latest=registry();if(latest.accounts.some(a=>a.username===username && a.id!==existing?.id))throw new Error('نام کاربری تکراری است');
            const account={...existing,id:existing?.id || crypto.randomUUID(),orgId,username,fullname:input.fullname.trim(),email:input.email || '',phone:input.phone || '',status:input.status || 'فعال',accessRole:role,role:role==='employee'?'کارمند':role==='central_admin'?'مدیر سیستم':'مدیر نمایندگی',lastLogin:existing?.lastLogin || '---',employeeId:input.employeeId || existing?.employeeId || '',demoVerifier:hash};
            latest.accounts=existing?latest.accounts.map(a=>a.id===existing.id?account:a):[...latest.accounts,account];saveRegistry(latest);return copy(account);
        },
        deleteAccount(id){
            const actor=requireAdmin(),data=registry();const target=data.accounts.find(a=>a.id===String(id) && a.orgId===currentOrgId());
            if(!target || target.id===actor.id || (actor.accessRole!=='central_admin' && target.accessRole!=='employee'))throw new Error('حذف این حساب مجاز نیست');
            if(target.accessRole!=='employee' && target.status==='فعال' && data.accounts.filter(a=>a.orgId===target.orgId && a.accessRole===target.accessRole && a.status==='فعال').length<=1)throw new Error('آخرین ادمین را نمی‌توانید حذف کنید');
            data.accounts=data.accounts.filter(a=>a.id!==target.id);saveRegistry(data);
        },
        assertWrite(collection){
            const user=principal();if(!user)throw new Error('ابتدا وارد سیستم شوید');
            const organization=registry().organizations.find(o=>o.id===currentOrgId());
            if(!organization || (organization.status!=='active' && !api.isCentral()))throw new Error('نمایندگی غیرفعال است');
            const protectedCollections=['employees','employeeLoans','employeeRepayments','payroll','attendance','hrTransactions','users'];
            if(protectedCollections.includes(collection) && !api.isAdmin())throw new Error('کارمند صلاحیت مدیریت کارمندان و کاربران را ندارد');
            if(['siteSettings','cmsPages','cmsPosts','cmsSlides','cmsDeletedPosts'].includes(collection) && !api.isCentral())throw new Error('مدیریت وبسایت تنها برای ادمین مرکزی است');
        },
        assertRead(collection){if(!principal())throw new Error('ابتدا وارد سیستم شوید');if(['employees','employeeLoans','employeeRepayments','payroll','attendance','hrTransactions','users'].includes(collection) && !api.isAdmin())throw new Error('دسترسی به اطلاعات کارمندان مجاز نیست');},
        guard(){
            const file=location.pathname.split('/').pop();if(file==='login.html')return;
            if(file==='website-management.html' && api.isCentral())api.selectOrg('center');
            if(!principal()){location.replace('login.html');throw new Error('ورود به سیستم لازم است');}
            if((file==='branches.html' || file==='website-management.html') && !api.isCentral() || ['users.html','employees.html'].includes(file) && !api.isAdmin()) {location.replace('dashboard.html');throw new Error('دسترسی به این صفحه مجاز نیست');}
        }
    };
    const initialRegistry=registry();
    if(sessionStorage.getItem(sessionKey)===null)sessionStorage.setItem(sessionKey,JSON.stringify({accountId:initialRegistry.accounts.find(a=>a.accessRole==='central_admin')?.id}));
    window.OrgContext=Object.freeze(api);
    if(location.pathname.includes('/dashboard/'))api.guard();
    window.addEventListener('storage',event=>{
        if(event.key!==registryKey || !location.pathname.includes('/dashboard/'))return;
        if(!principal()){api.logout();location.replace('login.html');}else api.guard();
    });
})();
