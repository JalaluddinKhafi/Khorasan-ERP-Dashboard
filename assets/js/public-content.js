/* Apply only explicit CMS edits; the template's initial copy stays intact. */
function frontendPosts(original) {
    const deleted=FrontendStore.read('cmsDeletedPosts',[]);
    const edited=FrontendStore.read('cmsPosts',[]).filter(p=>p.edited);
    const posts=original.filter(p=>!deleted.includes(p.id) && !edited.some(e=>e.id===p.id));
    edited.filter(p=>p.values[3]==='منتشر شده').forEach(p=>posts.push({id:p.id,title:p.values[0],author:p.values[1],category:({'مدیریت فروش':'management','انبارداری':'technology','حسابداری':'finance'})[p.values[2]] || 'management',date:p.date,image:'../assets/images/placeholder.svg',excerpt:p.content || '',content:p.content || '',tags:[]}));
    return posts;
}
document.addEventListener('DOMContentLoaded',()=>{
    const settings=FrontendStore.read('siteSettings',null);
    if(settings) {
        const [name,slogan,email,phone,address,logo,favicon]=settings;
        if(slogan && document.querySelector('.hero h1'))document.querySelector('.hero h1').textContent=slogan;
        const brand=document.querySelector('.navbar-brand img');if(brand && name)brand.alt=name;
        if(brand && logo && safeImageURL(logo))brand.src=logo;
        document.querySelectorAll('a[href^="mailto:"]').forEach(el=>{el.textContent=email;el.href='mailto:'+email;});
        document.querySelectorAll('a[href^="tel:"]').forEach(el=>{el.textContent=phone;el.href='tel:'+phone;});
        const cards=[...document.querySelectorAll('.contact-info-card')];
        cards.forEach(card=>{
            const heading=card.querySelector('h5')?.textContent;
            const field=card.querySelector('p');if(!field)return;
            if(heading==='آدرس')field.textContent=address;
            if(heading?.includes('ایمیل'))field.textContent=email;
            if(heading?.includes('تماس'))field.textContent=phone;
        });
        if(favicon && /^(?:https?:\/\/|\/?assets\/|\.\.\/assets\/)/.test(favicon)){let link=document.querySelector('link[rel="icon"]');if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link);}link.href=favicon;}
    }
    const file=location.pathname.split('/').pop();
    const page=FrontendStore.read('cmsPages',[]).find(p=>p.edited && p.values[1]==='/'+file);
    if(page && page.values[2]==='فعال') {
        document.title=page.values[0];
        const heading=document.querySelector('.page-header h1');if(heading)heading.textContent=page.values[0];
    }
    if(file==='page.html') {
        const record=FrontendStore.read('cmsPages',[]).find(p=>String(p.id)===getUrlParam('id') && p.values[2]==='فعال');
        if(record) {document.title=record.values[0];document.querySelector('h1').textContent=record.values[0];document.getElementById('pageContent').textContent=record.content || '';}
    }
});
