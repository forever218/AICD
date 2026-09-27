import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://127.0.0.1:5199'
const PORT = 9902
const W = Number(process.argv[2]||1440), H = Number(process.argv[3]||900)
const [url, out, clip] = [process.argv[4], process.argv[5], process.argv[6]]
const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run',`--remote-debugging-port=${PORT}`,`--window-size=${W},${H}`,'about:blank'], { stdio: 'ignore' })
async function t(){for(let i=0;i<80;i++){try{const l=await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();const p=l.find(x=>x.type==='page');if(p)return p}catch{}await sleep(300)}throw new Error('no chrome')}
const page = await t(); const ws = new WebSocket(page.webSocketDebuggerUrl)
let id=0; const pend=new Map()
ws.addEventListener('message',e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}})
await new Promise(r=>ws.addEventListener('open',r))
const send=(m,p={})=>{const i=++id;return new Promise(r=>{pend.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}))})}
const js=async(e)=>(await send('Runtime.evaluate',{expression:e,returnByValue:true})).result?.result?.value
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:2,mobile:false})
await send('Page.navigate',{url:ORIGIN+url}); await sleep(2800)
console.log(await js(`(()=>{const first=document.querySelector('.vp-doc > *');const b=first?first.getBoundingClientRect():null;const t=document.querySelector('.nav-brand__text').getBoundingClientRect();return JSON.stringify({firstContentLeft:b?+b.left.toFixed(1):null, brandLeft:+t.left.toFixed(1), diff:b?+(t.left-b.left).toFixed(1):null})})()`))
const [x,y,w,h] = clip.split(',').map(Number)
const r = await send('Page.captureScreenshot',{format:'png',clip:{x,y,width:w,height:h,scale:2}})
;await (await import('node:fs/promises')).writeFile(out, Buffer.from(r.result.data,'base64'))
ws.close();chrome.kill()
