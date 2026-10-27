'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const baseURL=process.env.BASE_URL || 'http://127.0.0.1:8873';
const outputDir=path.join(root,'qa-results');fs.mkdirSync(outputDir,{recursive:true});
async function prepareServer(){
 if(process.env.BASE_URL)return;
 const child=spawn(process.execPath,[path.join(root,'tools/server.cjs')],{cwd:root,env:{...process.env,PORT:'8873'},stdio:'ignore',windowsHide:true});
 child.unref();
 process.on('exit',()=>child.kill());
 for(let attempt=0;attempt<50;attempt++){
  try{const response=await fetch(baseURL+'/dashboard/dashboard.html');if(response.ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 child.kill();throw new Error('The test static server did not start');
}
module.exports={chromium,baseURL,outputDir,prepareServer};
