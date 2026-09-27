import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://127.0.0.1:5199'
const PORT = 9877
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
const r = await js(`(()=>{
  try{
    const out=[]
    const cc=document.querySelector('.content-container')
    out.push('=== content-container children: '+[...cc.children].map(c=>c.tagName+'.'+c.className).join(' | '))
    const main=document.querySelector('main')
    out.push('=== main: '+main.className+' children: '+[...main.children].map(c=>c.tagName+'.'+c.className).join(' | '))
    const vp=document.querySelector('.vp-doc')
    out.push('=== .vp-doc exists: '+!!vp+' tag='+(vp&&vp.tagName)+' class='+(vp&&vp.className))
    if(vp){
      out.push('vp children count='+vp.children.length+' :: '+[...vp.children].map(c=>c.tagName+'.'+c.className).join(' | '))
      out.push('vp.child0 html: '+vp.children[0].outerHTML.slice(0,240))
      out.push('vp.child0 children: '+(vp.children[0].children?[...vp.children[0].children].slice(0,5).map(c=>c.tagName+'.'+c.className).join(' | '):'-'))
      out.push('vp.child0 computed: mt='+getComputedStyle(vp.children[0]).marginTop+' pt='+getComputedStyle(vp.children[0]).paddingTop+' display='+getComputedStyle(vp.children[0]).display)
      const r1=vp.children[0].getBoundingClientRect(); out.push('vp.child0 rect='+JSON.stringify([r1.left,r1.top,r1.width,r1.height]))
    }
    const h1=document.querySelector('.vp-doc h1')
    out.push('=== h1: '+!!h1)
    if(h1){const b=getComputedStyle(h1,'::before'),a=getComputedStyle(h1,'::after');const rr=h1.getBoundingClientRect();
      out.push('h1 rect='+JSON.stringify([rr.left,rr.top,rr.width,rr.height])+' mt='+getComputedStyle(h1).marginTop+' pt='+getComputedStyle(h1).paddingTop+' bt='+getComputedStyle(h1).borderTop);
      out.push('h1::before c='+b.content+' w='+b.width+' h='+b.height+' bg='+b.backgroundColor+' disp='+b.display+' pos='+b.position);
      out.push('h1::after c='+a.content+' w='+a.width+' bg='+a.backgroundColor+' disp='+a.display)}
    return out.join('\\n')
  }catch(err){return 'ERR: '+err.message+'\\n'+err.stack}
})()`)
console.log(r)
ws.close();chrome.kill()
