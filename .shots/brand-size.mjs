import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://127.0.0.1:5199'
const PORT = 9901
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900)
const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run',`--remote-debugging-port=${PORT}`,`--window-size=${W},${H}`,'about:blank'], { stdio: 'ignore' })
async function t(){for(let i=0;i<80;i++){try{const l=await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();const p=l.find(x=>x.type==='page');if(p)return p}catch{}await sleep(300)}throw new Error('no chrome')}
const page = await t(); const ws = new WebSocket(page.webSocketDebuggerUrl)
let id=0; const pend=new Map()
ws.addEventListener('message',e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}})
await new Promise(r=>ws.addEventListener('open',r))
const send=(m,p={})=>{const i=++id;return new Promise(r=>{pend.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}))})}
const js=async(e)=>(await send('Runtime.evaluate',{expression:e,returnByValue:true})).result?.result?.value
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:1,mobile:false})
for (const p of process.argv[4].split(',')) {
  await send('Page.navigate',{url:ORIGIN+p}); await sleep(2500)
  console.log('───── '+p+' @'+W+' ─────')
  console.log(await js(`(()=>{
    const R=e=>{if(!e)return null;const b=e.getBoundingClientRect();return [+b.left.toFixed(1),+b.top.toFixed(1),+b.width.toFixed(1),+b.height.toFixed(1)]}
    const t=document.querySelector('.nav-brand__text')
    const nav=document.querySelector('.VPNavBar')
    const h1=document.querySelector('.vp-doc h1')
    const cs=t?getComputedStyle(t):null
    const b=t?t.getBoundingClientRect():null
    const nb=nav?nav.getBoundingClientRect():null
    return JSON.stringify({
      text: t? t.textContent.trim() : 'NONE',
      fontSize: cs?.fontSize, fontWeight: cs?.fontWeight, letterSpacing: cs?.letterSpacing,
      rect: R(t),
      navRect: R(nav),
      centeredDelta: (b&&nb)? +(((b.top+b.height/2)-(nb.top+nb.height/2)).toFixed(2)) : null,
      vpdocLeft: h1? +h1.getBoundingClientRect().left.toFixed(1) : null,
      scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth
    },null,1)})()`))
}
ws.close();chrome.kill()
