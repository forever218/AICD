import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://127.0.0.1:5199'
const PORT = 9844
const W = Number(process.argv[2] || 1440), Hh = Number(process.argv[3] || 900)
const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run',`--remote-debugging-port=${PORT}`,`--window-size=${W},${Hh}`,'about:blank'], { stdio: 'ignore' })
async function t(){for(let i=0;i<80;i++){try{const l=await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();const p=l.find(x=>x.type==='page');if(p)return p}catch{}await sleep(300)}throw new Error('no chrome')}
const page = await t(); const ws = new WebSocket(page.webSocketDebuggerUrl)
let id=0; const pend=new Map()
ws.addEventListener('message',e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}})
await new Promise(r=>ws.addEventListener('open',r))
const send=(m,p={})=>{const i=++id;return new Promise(r=>{pend.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}))})}
const js=async(e)=>(await send('Runtime.evaluate',{expression:e,returnByValue:true})).result?.result?.value
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride',{width:W,height:Hh,deviceScaleFactor:1,mobile:false})
for (const p of process.argv[4].split(',')) {
  await send('Page.navigate',{url:ORIGIN+p}); await sleep(2400)
  const r = await js(`(()=>{
    const q=s=>document.querySelector(s)
    const R=e=>{if(!e)return null;const b=e.getBoundingClientRect();return [+b.left.toFixed(1),+b.top.toFixed(1),+b.width.toFixed(1),+b.height.toFixed(1)]}
    const cs=e=>e?getComputedStyle(e):null
    const doc=q('.VPDoc'), cc=q('.VPDoc .content-container')
    const first=[...document.querySelectorAll('.vp-doc > *')].slice(0,3)
    const sq=[...document.querySelectorAll('.vp-doc h2')].slice(0,4).map(h=>{
      const b=getComputedStyle(h,'::before'); return h.textContent.trim().slice(0,18)+' | beforeW='+b.width+' content='+b.content+' bg='+b.backgroundColor
    })
    return JSON.stringify({
      navBottom: (()=>{const n=q('.VPNavBar');return n?+n.getBoundingClientRect().bottom.toFixed(1):null})(),
      vpdoc: R(doc), vpdocPadTop: cs(doc)?.paddingTop, vpdocRectH: doc?+doc.getBoundingClientRect().height.toFixed(0):null,
      cc: R(cc), ccPadTop: cs(cc)?.paddingTop, ccMarginTop: cs(cc)?.marginTop,
      docTopHeightVar: getComputedStyle(document.documentElement).getPropertyValue('--vp-doc-top-height'),
      first3: first.map(e=>e.tagName+'.'+(typeof e.className==='string'?e.className:'')+' '+R(e)+' topMargin='+(cs(e)?.marginTop)+' padTop='+(cs(e)?.paddingTop)),
      h2Before: sq
    },null,1)})()`)
  console.log('───── '+p+' ─────'); console.log(r)
}
ws.close();chrome.kill()
