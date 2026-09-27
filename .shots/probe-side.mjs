import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://127.0.0.1:5199'
const PORT = 9899
const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run',`--remote-debugging-port=${PORT}`,'--window-size=1440,900','about:blank'], { stdio: 'ignore' })
async function t(){for(let i=0;i<80;i++){try{const l=await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();const p=l.find(x=>x.type==='page');if(p)return p}catch{}await sleep(300)}throw new Error('no chrome')}
const page = await t(); const ws = new WebSocket(page.webSocketDebuggerUrl)
let id=0; const pend=new Map()
ws.addEventListener('message',e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}})
await new Promise(r=>ws.addEventListener('open',r))
const send=(m,p={})=>{const i=++id;return new Promise(r=>{pend.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}))})}
const js=async(e)=>(await send('Runtime.evaluate',{expression:e,returnByValue:true})).result?.result?.value
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
await send('Page.navigate',{url:ORIGIN+'/initiative/'}); await sleep(2600)
console.log(await js(`(()=>{try{
 const out=[]
 const vp=document.querySelector('.VPDoc')
 out.push('#app exists='+!!document.querySelector('#app')+' | VPDoc ancestors: '+(()=>{const a=[];let e=vp.parentElement;while(e&&a.length<6){a.push(e.tagName+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className?'.'+e.className.split(' ').join('.'):''));e=e.parentElement}return a.join(' < ')})())
 out.push('VPDoc computed padding = '+getComputedStyle(vp).padding)
 out.push('VPDoc var --doc-pad-top = '+getComputedStyle(vp).getPropertyValue('--doc-pad-top'))
 const ac=document.querySelector('.aside-container')
 out.push('aside-container padding-top='+getComputedStyle(ac).paddingTop+' rect.top='+ac.getBoundingClientRect().top.toFixed(1))
 const ac2=document.querySelector('.aside-content')
 out.push('aside-content rect.top='+ac2.getBoundingClientRect().top.toFixed(1)+' mt='+getComputedStyle(ac2).marginTop)
 const ot=document.querySelector('.VPDocOutlineItem, .outline-title, .aside-container nav, .aside-container > * > *')
 out.push('first outline node = '+(ot?ot.tagName+'.'+ot.className+' top='+ot.getBoundingClientRect().top.toFixed(1):'n/a'))
 const nav=document.querySelector('.VPNavBar'); out.push('navBottom='+nav.getBoundingClientRect().bottom.toFixed(1)+' navH='+getComputedStyle(nav).height)
 out.push('--vp-nav-height='+getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')+' --vp-layout-top-height='+getComputedStyle(document.documentElement).getPropertyValue('--vp-layout-top-height'))
 const vp2=document.querySelector('.content-container'); out.push('content-container top='+vp2.getBoundingClientRect().top.toFixed(1))
 return out.join('\\n')}catch(e){return 'ERR '+e.message}})()`))
ws.close();chrome.kill()
