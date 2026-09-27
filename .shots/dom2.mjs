import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://127.0.0.1:5199'
const PORT = 9866
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
for (const p of process.argv[2].split(',')) {
  await send('Page.navigate',{url:ORIGIN+p}); await sleep(2400)
  const r = await js(`(()=>{
    const cc=document.querySelector('.content-container')
    const main=document.querySelector('.content-container > .main')||document.querySelector('.main')
    const vp=document.querySelector('.vp-doc')
    const out=[]
    out.push('cc.children = '+[...cc.children].map(c=>c.tagName+'.'+(typeof c.className==='string'?c.className:'')).join(' | '))
    out.push('main.children = '+[...main.children].map(c=>c.tagName+'.'+(typeof c.className==='string'?c.className:'')).join(' | '))
    out.push('vp-doc tag='+vp.tagName+' class='+vp.className+' parent='+vp.parentElement.tagName+'.'+vp.parentElement.className)
    out.push('vp-doc mt='+getComputedStyle(vp).marginTop+' pt='+getComputedStyle(vp).paddingTop+' rect='+JSON.stringify(vp.getBoundingClientRect().top))
    out.push('vp-doc.child0 = '+vp.children[0].tagName+'.'+(typeof vp.children[0].className==='string'?vp.children[0].className:'')+' html='+vp.children[0].outerHTML.slice(0,160))
    out.push('vp-doc.child1 = '+vp.children[1].outerHTML.slice(0,160))
    const h1=vp.querySelector('h1');
    if(h1){const b=getComputedStyle(h1,'::before'),a=getComputedStyle(h1,'::after');const r1=h1.getBoundingClientRect();out.push('H1 rect='+JSON.stringify([r1.left,r1.top,r1.width,r1.height])+' mt='+getComputedStyle(h1).marginTop+' bt='+getComputedStyle(h1).borderTop+' pt='+getComputedStyle(h1).paddingTop+' |::before content='+b.content+' w='+b.width+' bg='+b.backgroundColor+' display='+b.display+' | ::after content='+a.content+' w='+a.width+' bg='+a.backgroundColor)}
    return out.join('\\n')})()`)
  console.log('───── '+p+' ─────'); console.log(r)
}
ws.close();chrome.kill()
