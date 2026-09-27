import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://127.0.0.1:5199'
const PORT = 9811
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
await send('Page.navigate',{url:ORIGIN+'/levels'}); await sleep(2800)
console.log('at point:', await js(`(()=>{const el=document.elementFromPoint(267,35);return el? el.tagName+'.'+el.className : 'null'})()`))
console.log('chain:', await js(`(()=>{let el=document.elementFromPoint(267,35),out=[];while(el&&out.length<9){out.push(el.tagName+'.'+(typeof el.className==='string'?el.className:''));el=el.parentElement}return out.join(' < ')})()`))
await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:267,y:35,buttons:0})
await send('Input.dispatchMouseEvent',{type:'mousePressed',x:267,y:35,button:'left',buttons:1,clickCount:1})
await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:267,y:35,button:'left',buttons:0,clickCount:1})
await sleep(1800)
console.log('after mouse click:', await js('location.pathname'))
ws.close();chrome.kill()
