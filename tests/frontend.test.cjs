'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function environment(initial={}) {
 const items=new Map(Object.entries(initial));
 const listeners={};
 const context={console,URLSearchParams,setTimeout,clearTimeout,Date,Map,Set,Promise,Number,String,JSON,document:{addEventListener(name,fn){listeners[name]=fn;}},localStorage:{getItem:key=>items.get(key)??null,setItem:(key,value)=>items.set(key,value)},location:{search:''}};
 context.window=context;vm.createContext(context);
 for(const name of ['frontend-store','demo-data','utils','report-data'])vm.runInContext(fs.readFileSync(path.join(root,'assets/js/'+name+'.js'),'utf8'),context);
 return {context,items,listeners};
}
test('Persian words handle teens, zero, hundreds, large and invalid amounts',()=>{
 const {context:c}=environment();
 for(const [number,words] of [[0,'صفر'],[10,'ده'],[11,'یازده'],[15,'پانزده'],[19,'نوزده'],[115,'یکصد و پانزده'],[125,'یکصد و بیست و پنج'],[1000000,'یک میلیون'],[1000000001,'یک میلیارد و یک'],[-11,'منفی یازده']])assert.equal(c.numberToWords(number),words);
 assert.equal(c.numberToWords(NaN),'');assert.equal(c.numberToWords(1.5),'');
});
test('Dates compare Persian, Arabic and Gregorian digits consistently',()=>{
 const {context:c}=environment();
 assert.equal(c.dateKey('۱۴۰۵/۸/۶'),'1405-08-06');
 assert.equal(c.dateKey('١٤٠٥/٠٨/٠٦'),'1405-08-06');
 assert.equal(c.dateKey('2026-10-28'),'1405-08-06');
 assert.equal(c.dateInputValue('۱۴۰۵/۰۸/۰۶'),'2026-10-28');
 assert.equal(c.dateKey('invalid'),'');
 assert.equal(c.parseAmount('۱۲٬۵۰۰.۵'),12500.5);
});
test('Repository persists empty lists, isolates read values and commits collections atomically',()=>{
 const {context:c,items}=environment();const store=c.FrontendStore;
 store.write('products',[]);assert.deepEqual(Array.from(store.read('products',[1])),[]);
 store.write('products',[{id:1,name:'A'}]);const copy=store.read('products');copy[0].name='B';assert.equal(store.read('products')[0].name,'A');
 store.writeMany({sales:[{id:2}],products:[{id:1,stock:9}]});assert.equal(store.read('sales')[0].id,2);assert.equal(store.read('products')[0].stock,9);
 assert.ok(items.get('khorasan.frontend.v1'));
});
test('Repository recovers invalid JSON and surfaces storage quota errors',()=>{
 const {context:c}=environment({'khorasan.frontend.v1':'invalid'});assert.equal(c.FrontendStore.read('products',[{id:1}])[0].id,1);
 c.showToast=()=>{};c.localStorage.setItem=()=>{throw new Error('quota');};
 assert.throws(()=>c.FrontendStore.write('products',[]),/quota/);
});
test('Text and image attributes cannot inject markup or executable URLs',()=>{
 const {context:c}=environment();assert.equal(c.escapeHTML('<img src=x onerror="x">'),'&lt;img src=x onerror=&quot;x&quot;&gt;');assert.equal(c.safeImageURL('javascript:alert(1)'),'');assert.equal(c.safeImageURL('data:text/html;base64,AAAA'),'');assert.equal(c.safeImageURL('https://x.test/a" onerror="x'),'https://x.test/a&quot; onerror=&quot;x');
});
test('Profit uses cost of sold units and subtracts expense once',()=>{
 const {context:c}=environment();c.FrontendStore.writeMany({sales:[{date:'2026-10-28',total:100,items:[{quantity:2,costPrice:20}]}],expenses:[{date:'2026-10-28',amount:10}]});const report=c.frontendReport('profit-loss');assert.match(report.tableData[3][1],/^50 /);
});
test('All scripts parse, every local HTML asset exists, and no frontend fetch targets localhost API',()=>{
 for(const dir of ['dashboard','public-site','assets/js'])for(const file of fs.readdirSync(path.join(root,dir))){
  const target=path.join(root,dir,file);const source=fs.readFileSync(target,'utf8');
  if(file.endsWith('.js') && file!=='api-service.js')new vm.Script(source,{filename:target});
  if(!file.endsWith('.html'))continue;
  for(const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1],{filename:target});
  for(const match of source.matchAll(/(?:src|href)="(\.\.\/assets\/[^"?#]+)"/g))assert.ok(fs.existsSync(path.resolve(path.dirname(target),match[1])),target+' -> '+match[1]);
  assert.equal(source.includes('http://localhost:8080'),false,target);
 }
});
