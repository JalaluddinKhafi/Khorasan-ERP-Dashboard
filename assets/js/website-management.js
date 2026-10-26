/* Editors use the template's existing Bootstrap components and labels. */
(function () {
    const settingsForm=document.getElementById('siteSettingsForm');
    const fields=[...settingsForm.querySelectorAll('input,textarea')];
    const savedSettings=FrontendStore.read('siteSettings',null);
    if(savedSettings) fields.forEach((field,index)=>{if(savedSettings[index]!==undefined)field.value=savedSettings[index];});
    settingsForm.addEventListener('submit',e=>{
        e.preventDefault(); if(!settingsForm.reportValidity())return;
        FrontendStore.write('siteSettings',fields.map(f=>f.value));
        showToast('تنظیمات با موفقیت ذخیره شد','success');
    });
    const schemas={
        pages:{table:'pagesTable',key:'cmsPages',columns:[1,2,3],labels:['عنوان صفحه','آدرس (URL)','وضعیت']},
        posts:{table:'blogTable',key:'cmsPosts',columns:[1,2,3,5],labels:['عنوان مقاله','نویسنده','دسته‌بندی','وضعیت']}
    };
    for(const [kind,schema] of Object.entries(schemas)) {
        const table=document.getElementById(schema.table);
        schema.rows=FrontendStore.read(schema.key,[...table.tBodies[0].rows].map((row,index)=>({id:index+1,values:schema.columns.map(i=>row.cells[i].textContent.trim()),date:row.cells[kind==='pages'?4:4].textContent.trim()})));
        schema.template=table.tBodies[0].rows[0].cloneNode(true);
        schema.render=()=>{
            destroyDataTable(schema.table);const body=table.tBodies[0];body.replaceChildren();
            schema.rows.forEach((data,index)=>{
                const row=schema.template.cloneNode(true);row.dataset.id=data.id;row.cells[0].textContent=index+1;
                schema.columns.forEach((col,i)=>{
                    const badge=row.cells[col].querySelector('.badge');
                    if(badge) {badge.textContent=data.values[i];badge.className='badge '+(['فعال','منتشر شده'].includes(data.values[i])?'bg-success':'bg-secondary');}
                    else row.cells[col].textContent=data.values[i];
                });
                row.cells[4].textContent=data.date;
                row.querySelector('.btn-info').onclick=()=>openEditor(kind,data);
                const other=row.querySelector(kind==='pages'?'.btn-primary':'.btn-danger');
                if(kind==='pages') other.onclick=()=>{
                    const path=data.values[1]; if(!/^\/[a-zA-Z0-9_-]+\.html$/.test(path)) {showToast('آدرس صفحه نامعتبر است','error');return;}
                    const known=['index','about','products','services','blog','gallery','contact','faq','privacy','terms'];
                    const name=path.slice(1,-5);
                    window.open(known.includes(name)?'../public-site/'+name+'.html':'../public-site/page.html?id='+encodeURIComponent(data.id),'_blank','noopener');
                };
                else other.onclick=()=>{if(confirm('آیا از حذف اطمینان دارید؟')){FrontendStore.append('cmsDeletedPosts',data.id);schema.rows=schema.rows.filter(x=>x.id!==data.id);FrontendStore.write(schema.key,schema.rows);schema.render();}};
                body.appendChild(row);
            });
            $('#'+schema.table).DataTable({language: window.PersianTableLanguage,pageLength:10});
        };
        schema.render();
    }
    // Reuse the original page modal as the visual template for missing editors.
    function openEditor(kind,record=null) {
        const schema=schemas[kind];
        const modal=document.getElementById('addPageModal');
        const form=modal.querySelector('form'); form.replaceChildren();
        const values=record?.values || schema.labels.map(()=> '');
        schema.labels.forEach((label,index)=>{
            const group=document.createElement('div');group.className='mb-3';
            const caption=document.createElement('label');caption.className='form-label';caption.textContent=label;
            let input;
            if(label==='وضعیت') {
                input=document.createElement('select');input.className='form-select';
                (kind==='pages'?['فعال','غیرفعال']:['منتشر شده','پیش‌نویس']).forEach(value=>input.add(new Option(value,value)));
            } else {input=document.createElement('input');input.type='text';input.className='form-control';input.required=true;}
            input.value=values[index] || (label==='وضعیت'?(kind==='pages'?'فعال':'پیش‌نویس'):'');
            group.append(caption,input);form.appendChild(group);
        });
        if(kind==='posts' || kind==='pages') {
            const group=document.createElement('div');group.className='mb-3';const label=document.createElement('label');label.className='form-label';label.textContent=kind==='posts'?'متن مقاله':'متن صفحه';const textarea=document.createElement('textarea');textarea.className='form-control';textarea.rows=5;textarea.value=record?.content || '';group.append(label,textarea);form.appendChild(group);
        }
        const button=modal.querySelector('.modal-footer .btn-primary');
        button.onclick=()=>{
            if(!form.reportValidity())return;
            const next=[...form.querySelectorAll('input,select')].map(i=>i.value.trim());
            if(kind==='pages' && !/^\/[a-zA-Z0-9_-]+\.html$/.test(next[1])) {showToast('آدرس صفحه نامعتبر است','error');return;}
            if(kind==='pages' && schema.rows.some(p=>p.id!==record?.id && p.values[1]===next[1])) {showToast('آدرس صفحه تکراری است','error');return;}
            const data={id:record?.id || Date.now(),edited:true,values:next,date:getTodayDate(),content:form.querySelector('textarea')?.value || ''};
            schema.rows=record?schema.rows.map(r=>r.id===record.id?data:r):[...schema.rows,data];
            FrontendStore.write(schema.key,schema.rows);schema.render();bootstrap.Modal.getOrCreateInstance(modal).hide();
        };
        bootstrap.Modal.getOrCreateInstance(modal).show();
    }
    document.querySelector('[data-bs-target="#addPageModal"]').removeAttribute('data-bs-toggle');
    document.querySelector('[data-bs-target="#addPageModal"]').onclick=()=>openEditor('pages');
    document.querySelector('[data-bs-target="#addPostModal"]').removeAttribute('data-bs-toggle');
    document.querySelector('[data-bs-target="#addPostModal"]').onclick=()=>openEditor('posts');
    const slideList=document.getElementById('sliderList');
    const slideTemplate=slideList.firstElementChild.cloneNode(true);
    let slides=FrontendStore.read('cmsSlides',[...slideList.children].map((el,index)=>({id:index+1,name:el.querySelector('h6').textContent,title:el.querySelector('p').textContent,image:el.querySelector('img').getAttribute('src')})));
    function renderSlides() {
        slideList.replaceChildren();slides.forEach(slide=>{
            const card=slideTemplate.cloneNode(true);card.querySelector('h6').textContent=slide.name;card.querySelector('p').textContent=slide.title;card.querySelector('img').src=slide.image;
            card.querySelector('.btn-danger').onclick=()=>{if(confirm('آیا از حذف اطمینان دارید؟')){slides=slides.filter(s=>s.id!==slide.id);FrontendStore.write('cmsSlides',slides);renderSlides();}};
            card.querySelector('.btn-info').onclick=()=>editSlide(slide);slideList.appendChild(card);
        });
    }
    function editSlide(slide=null) {
        const modal=document.getElementById('addPageModal');const form=modal.querySelector('form');form.replaceChildren();
        ['عنوان','متن','آدرس تصویر'].forEach((label,index)=>{const group=document.createElement('div');group.className='mb-3';const caption=document.createElement('label');caption.className='form-label';caption.textContent=label;const input=document.createElement('input');input.className='form-control';input.required=true;input.value=slide?[slide.name,slide.title,slide.image][index]:'';group.append(caption,input);form.appendChild(group);});
        modal.querySelector('.modal-footer .btn-primary').onclick=()=>{
            if(!form.reportValidity())return;
            const [name,title,image]=[...form.querySelectorAll('input')].map(i=>i.value);
            if(!safeImageURL(image)){showToast('آدرس تصویر نامعتبر است','error');return;}
            const data={id:slide?.id || Date.now(),name,title,image};slides=slide?slides.map(s=>s.id===slide.id?data:s):[...slides,data];
            FrontendStore.write('cmsSlides',slides);renderSlides();bootstrap.Modal.getOrCreateInstance(modal).hide();
        };
        bootstrap.Modal.getOrCreateInstance(modal).show();
    }
    const addSlide=document.querySelector('[data-bs-target="#addSlideModal"]');addSlide.removeAttribute('data-bs-toggle');addSlide.onclick=()=>editSlide();
    renderSlides();
    document.getElementById('previewSiteBtn').onclick=()=>window.open('../public-site/index.html','_blank','noopener');
    loadSidebarAndNavbar('website');
    if(location.hash==='#settingsTab') bootstrap.Tab.getOrCreateInstance(document.querySelector('[data-bs-target="#settingsTab"]')).show();
})();
