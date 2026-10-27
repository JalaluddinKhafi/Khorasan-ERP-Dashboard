const {chromium,baseURL,outputDir,prepareServer}=require('./browser-helper.cjs');
const fs=require('fs');
(async()=>{await prepareServer();const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'msedge'});const context=await browser.newContext();await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());const results=[];fs.mkdirSync(outputDir+'/screenshots',{recursive:true});
for(const dir of ['dashboard','public-site'])for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))){
 const page=await context.newPage(),errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());page.on('response',r=>{if(r.status()>=400 && new URL(r.url()).hostname==='127.0.0.1')missing.push(r.url());});
 await page.goto(baseURL+'/'+dir+'/'+file,{waitUntil:'domcontentloaded'});await page.waitForTimeout(100);
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await page.waitForTimeout(60);const stats=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,duplicateIds:[...document.querySelectorAll('[id]')].map(el=>el.id).filter((id,i,a)=>id && a.indexOf(id)!==i)}));results.push({page:dir+'/'+file,width,...stats,errors:[...errors],missing:[...missing]});if(file==='dashboard.html'||(file==='index.html'&&dir==='public-site'))await page.screenshot({path:outputDir+'/screenshots/'+dir+'-'+width+'.png'});}
 await page.close();
}
fs.writeFileSync(outputDir+'/responsive-results.json',JSON.stringify(results,null,2));const bad=results.filter(r=>r.errors.length||r.missing.length||r.duplicateIds.length||r.overflow);console.log(JSON.stringify({checks:results.length,issues:bad},null,2));await browser.close();})();
