import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = process.env.ORIGIN || 'http://127.0.0.1:5199'
const PORT = 9833

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1440,900',
    'about:blank'
  ],
  { stdio: 'ignore' }
)

async function target() {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      const page = list.find((x) => x.type === 'page')
      if (page) return page
    } catch {}
    await sleep(300)
  }
  throw new Error('chrome 未就绪')
}

const page = await target()
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
})
await new Promise((r) => ws.addEventListener('open', r))
const send = (method, params = {}) => {
  const i = ++id
  return new Promise((r) => {
    pending.set(i, r)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
}
const js = async (expr) =>
  (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }))
    .result?.result?.value

async function shot(file) {
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  if (r.result?.data) writeFileSync(file, Buffer.from(r.result.data, 'base64'))
}

const viewport = async (w, h, mobile) => {
  await send('Emulation.setDeviceMetricsOverride', {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile
  })
}

const goto = async (path, wait = 2600) => {
  await send('Page.navigate', { url: ORIGIN + path })
  await sleep(wait)
}

/** 打开地球菜单并点某个语言 */
const switchTo = async (label) => {
  await js(`(()=>{document.querySelector('.lang__btn').click();return 1})()`)
  await sleep(320)
  const clicked = await js(`(()=>{
    const a=[...document.querySelectorAll('.lang__menu .lang__item')].find(x=>x.textContent.trim()===${JSON.stringify(label)})
    if(!a) return 'NO ITEM'
    if(a.tagName!=='A') return 'CURRENT'
    a.click(); return 'clicked'
  })()`)
  await sleep(2200)
  return clicked
}

const snapshot = () => js(`(()=>{
  const t=(s)=>document.querySelector(s)?.innerText?.trim() ?? null
  return JSON.stringify({
    lang: document.documentElement.lang,
    path: location.pathname,
    nav: [...document.querySelectorAll('.VPNavBarMenuLink')].map(a=>a.textContent.trim()),
    globe: !!document.querySelector('.lang__btn'),
    globeSvg: !!document.querySelector('.lang__globe'),
    builtinMenusHidden: [
      !!document.querySelector('.VPNavBarTranslations') ? getComputedStyle(document.querySelector('.VPNavBarTranslations')).display : 'none-in-dom'
    ],
    homeLatin: t('.hero__latin'),
    outlineLabel: t('.VPDocAsideOutline .outline-title') || t('.aside-curtain + * .outline-title'),
    badge: t('.dbadge__line'),
    levelName: t('.ref__name'),
    verifierButtons: [...document.querySelectorAll('.vf__btn')].map(b=>b.textContent.trim()),
    footer: t('.VPFooter .message')
  },null,1)
})()`)

await send('Page.enable')
await viewport(1440, 900, false)

/* ── 1. 默认语言 = 英文 ─────────────────────────────────── */
console.log('═════ 1. 根路径默认语言 ═════')
await goto('/')
console.log(await snapshot())
console.log('菜单展开:', await js(`(()=>{document.querySelector('.lang__btn').click();return 1})()`))
await sleep(300)
console.log(
  '下拉项:',
  await js(`[...document.querySelectorAll('.lang__menu .lang__item')].map(x=>x.textContent.trim()+(x.tagName==='A'?'→'+new URL(x.href).pathname:'(当前)')).join(' | ')`)
)
await js(`document.querySelector('.lang__btn').click()`)
await sleep(300)
await shot('E:\\AICD\\v1\\.shots\\i18n-home-en.png')

/* ── 2. 内页语言映射 ────────────────────────────────────── */
console.log('\n═════ 2. 同页语言映射 ═════')
await goto('/levels')
console.log('起点 /levels →', await switchTo('简体中文'), '| 落到', await js('location.pathname'))
console.log('→ 切繁體:', await switchTo('繁體中文'), '| 落到', await js('location.pathname'))
console.log('→ 切English:', await switchTo('English'), '| 落到', await js('location.pathname'))

await goto('/zh/initiative/')
console.log('起点 /zh/initiative/ →', await switchTo('English'), '| 落到', await js('location.pathname'))
console.log('→ 切繁體:', await switchTo('繁體中文'), '| 落到', await js('location.pathname'))

await goto('/verifier')
console.log('起点 /verifier → 简体:', await switchTo('简体中文'), '| 落到', await js('location.pathname'))

/* ── 3. 各语言页面内容 ──────────────────────────────────── */
console.log('\n═════ 3. 各语言内容 ═════')
await goto('/adopt')
console.log('[en] 采用页:', await snapshot())
await goto('/zh/adopt')
console.log('[zh] 采用页:', await snapshot())
await goto('/zh-tw/adopt')
console.log('[zh-tw] 采用页:', await snapshot())

await goto('/levels')
await shot('E:\\AICD\\v1\\.shots\\i18n-levels-en.png')
await goto('/zh-tw/levels')
await shot('E:\\AICD\\v1\\.shots\\i18n-levels-zhtw.png')

/* ── 4. 繁体验证器实跑 ──────────────────────────────────── */
console.log('\n═════ 4. 繁體驗證器 ═════')
await goto('/zh-tw/verifier')
await js(`(()=>{[...document.querySelectorAll('.vf__btn')].find(b=>b.textContent.trim()==='載入範例').click();return 1})()`)
await sleep(900)
console.log(await js(`(()=>{
  const t=(s)=>document.querySelector(s)?.innerText?.trim() ?? null
  return JSON.stringify({
    結論: t('.vf__verdict'),
    載體: [...document.querySelectorAll('.vf__tag')].map(e=>e.textContent.trim()),
    標準披露行: t('.dbadge__line'),
    欄位: [...document.querySelectorAll('.vf__row')].map(r=>[...r.children].map(c=>c.innerText.replace(/\\n/g,' / ').trim()).join(' || ')),
    注意: [...document.querySelectorAll('.vf__issues li')].map(e=>e.textContent.trim())
  },null,1)
})()`))
await shot('E:\\AICD\\v1\\.shots\\i18n-verifier-zhtw.png')

await goto('/verifier')
await js(`(()=>{[...document.querySelectorAll('.vf__btn')].find(b=>b.textContent.trim()==='Load example').click();return 1})()`)
await sleep(900)
console.log('[en]', await js(`JSON.stringify({結論:document.querySelector('.vf__verdict').innerText.trim(), 行:document.querySelector('.dbadge__line').innerText.trim(), 欄位:[...document.querySelectorAll('.vf__row')].map(r=>[...r.children].map(c=>c.innerText.replace(/\\n/g,' / ').trim()).join(' || '))},null,1)`))
await shot('E:\\AICD\\v1\\.shots\\i18n-verifier-en.png')

/* ── 5. 移动端 ──────────────────────────────────────────── */
console.log('\n═════ 5. 移动端 ═════')
await viewport(430, 932, true)
await goto('/zh-tw/')
console.log(await js(`JSON.stringify({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  globe: !!document.querySelector('.lang__btn'),
  hamburger: !!document.querySelector('.VPNavBarHamburger'),
  homeLatin: document.querySelector('.hero__latin')?.textContent.trim()
})`))
await js(`(()=>{document.querySelector('.lang__btn').click();return 1})()`)
await sleep(400)
console.log('移动端下拉:', await js(`(()=>{const m=document.querySelector('.lang__menu');if(!m)return 'none';const b=m.getBoundingClientRect();return JSON.stringify({left:Math.round(b.left),right:Math.round(b.right),vw:document.documentElement.clientWidth,overflow:b.right>document.documentElement.clientWidth})})()`))
await shot('E:\\AICD\\v1\\.shots\\i18n-mobile-zhtw.png')

ws.close()
chrome.kill()
