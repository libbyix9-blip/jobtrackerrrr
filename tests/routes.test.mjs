import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {SourceTextModule,createContext} from 'node:vm';import {webcrypto} from 'node:crypto';
const routes={overview:'Your next chapter starts here',discover:'Discover',wildcards:'Wildcard',saved:'Saved',applications:'Your application journey',insights:'Make sense of your momentum',profile:'The work you want',letters:'Cover',settings:'Backend not connected'};
for(const [route,title]of Object.entries(routes))test('Pages route renders actual UI: '+route,async()=>{
 const app={innerHTML:'',addEventListener(){}},modal={open:false,addEventListener(){},close(){this.open=false;}};const context=createContext({console,URL,AbortSignal,structuredClone,crypto:webcrypto,setTimeout,clearTimeout,setInterval,clearInterval,document:{querySelector:s=>s==='#app'?app:s==='#modal'?modal:{},addEventListener(){},documentElement:{dataset:{}}},localStorage:{getItem:()=>null,setItem(){}},matchMedia:()=>({matches:false}),location:{hash:'#'+route,pathname:'/jobtrackerrrr/'},history:{pushState(){}},window:{addEventListener(){},scrollTo(){}},fetch:()=>{throw new Error('No network calls allowed in preview');}});
 const cache=new Map();const get=async path=>{if(cache.has(path))return cache.get(path);const mod=new SourceTextModule(readFileSync(path,'utf8'),{context});cache.set(path,mod);await mod.link(spec=>get(spec.replace(/^\.\//,'')));return mod;};
 const module=await get('app.mjs');await module.evaluate();assert.match(app.innerHTML,new RegExp(title));assert.doesNotMatch(app.innerHTML,/Workspace unavailable/);
});
test('static assets and navigation are project-path safe',()=>{
 const html=readFileSync('index.html','utf8');assert.doesNotMatch(html,/(?:src|href)="\/(?!\/)/);assert.match(html,/Changes last only in this tab/);
 const app=readFileSync('app.mjs','utf8');assert.doesNotMatch(app,/from '\//);assert.match(app,/location.hash/);
});
