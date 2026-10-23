/* Browser-only repository. Replace this adapter when the Spring Boot API is ready. */
(function () {
    'use strict';
    const key = 'khorasan.frontend.v1';
    function snapshot() {
        try {
            const value = JSON.parse(localStorage.getItem(key) || '{}');
            return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        } catch { return {}; }
    }
    function clone(value) { return JSON.parse(JSON.stringify(value)); }
    function scopedName(name,write=false) {
        if(!window.OrgContext)return name;
        if(write)OrgContext.assertWrite(name);else OrgContext.assertRead(name);
        const org=OrgContext.currentOrgId();
        return org==='center'?name:'org:'+org+':'+name;
    }
    window.FrontendStore = Object.freeze({
        read(name, fallback = []) {
            const data = snapshot();
            const scoped=scopedName(name);
            const empty=window.OrgContext?.isBranch() ? (Array.isArray(fallback)?[]: fallback===null ? null : typeof fallback==='object'?{}:fallback) : fallback;
            const value = Object.prototype.hasOwnProperty.call(data, scoped) ? data[scoped] : empty;
            if (Array.isArray(fallback) && !Array.isArray(value)) return clone(empty);
            return clone(value);
        },
        write(name, value) {
            const data = snapshot();
            data[scopedName(name,true)] = value;
            try { localStorage.setItem(key, JSON.stringify(data)); }
            catch (error) {
                if (typeof showToast === 'function') showToast('خطا در ذخیره‌سازی اطلاعات مرورگر', 'error');
                throw error;
            }
            return value;
        },
        writeMany(values) {
            const data = snapshot();
            for(const [name,value] of Object.entries(values))data[scopedName(name,true)]=value;
            try { localStorage.setItem(key, JSON.stringify(data)); }
            catch (error) { if (typeof showToast === 'function') showToast('خطا در ذخیره‌سازی اطلاعات مرورگر', 'error'); throw error; }
            return values;
        },
        append(name, value) {
            const data = this.read(name, []);
            data.push(value);
            this.write(name, data);
            return value;
        },
        has(name) { return Object.prototype.hasOwnProperty.call(snapshot(), scopedName(name)); }
    });
})();
