import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = process.env.ORIGIN || 'http://127.0.0.1:5199'
const PORT = 9822
const W = Number(process.env.VW || 1440)
const H = Number(process.env.VH || 900)

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    `--remote-debugging-port=${PORT}`,
    `--window-size=${W},${H}`,
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
  else console.log('截图失败:', JSON.stringify(r).slice(0, 200))
}

const paste = (text) =>
  js(`(()=>{
    const ta=document.querySelector('.vf__area')
    const setter=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set
    setter.call(ta,${JSON.stringify(text)})
    ta.dispatchEvent(new Event('input',{bubbles:true}))
    return 1
  })()`)

const runVerify = () => js(`(()=>{document.querySelector('.vf__btn').click();return 1})()`)

const readReport = () =>
  js(`(()=>{
    const t=(s)=>document.querySelector(s)?.innerText?.trim() ?? null
    if(!document.querySelector('.vf__result')) return JSON.stringify({提示:t('.vf__error'),结果:null})
    return JSON.stringify({
      结论: t('.vf__verdict'),
      载体: [...document.querySelectorAll('.vf__tag')].map(e=>e.textContent.trim()),
      标准行: t('.dbadge__line'),
      附注: t('.dbadge__meta'),
      字段: [...document.querySelectorAll('.vf__row')].map(r=>[...r.children].map(c=>c.innerText.replace(/\\n/g,' / ').trim()).join('  ||  ')),
      释义: t('.vf__note-head'),
      归一化: t('.vf__json'),
      留意: [...document.querySelectorAll('.vf__issues li')].map(e=>e.textContent.trim())
    },null,1)
  })()`)

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: W,
  height: H,
  deviceScaleFactor: 1,
  mobile: W < 700
})

/* ── 1. 顶栏入口 ─────────────────────────────────────────── */
await send('Page.navigate', { url: `${ORIGIN}/levels` })
await sleep(3000)
console.log('导航菜单:', await js(`(()=>[...document.querySelectorAll('.VPNavBarMenuLink')].map(a=>a.textContent.trim()+' → '+new URL(a.href).pathname).join(' | '))()`))
console.log('点击:', await js(`(()=>{const a=[...document.querySelectorAll('.VPNavBarMenuLink')].find(x=>x.textContent.trim()==='验证器');if(!a)return 'NO LINK';a.click();return 'clicked'})()`))
await sleep(2200)
console.log('跳转后 path:', await js('location.pathname'))

/* ── 2. 载入示例 ─────────────────────────────────────────── */
console.log('按钮:', await js(`[...document.querySelectorAll('.vf__btn')].map(b=>b.textContent.trim()).join(' | ')`))
await js(`(()=>{[...document.querySelectorAll('.vf__btn')].find(b=>b.textContent.trim()==='载入示例').click();return 1})()`)
await sleep(900)
console.log('字符数:', await js(`document.querySelector('.vf__area').value.length`))
console.log(await readReport())
await shot('E:\\AICD\\v1\\.shots\\verifier-desktop.png')

/* ── 3. 边界用例 ─────────────────────────────────────────── */
const cases = [
  ['空输入', ''],
  ['无任何声明', '<html><head><title>普通页面</title></head><body><p>正文</p></body></html>'],
  ['非法等级 A9（Meta）＋合法 A2（可见）', '<meta name="aicd-level" content="A9" /><p>AI 参与：A2</p>'],
  ['跨载体冲突 A3 / A2', '<meta name="aicd-version" content="1.0" /><meta name="aicd-level" content="A3" /><meta name="aicd-review" content="yes" /><p>AI 参与：A2 — AI 编辑</p><p>人工审核：否</p>'],
  ['只有可见声明', '<p>AICD 1.0 · AI 参与：A4 — AI 主要生成 · 人工审核：是</p>'],
  ['直接粘贴 JSON', '{ "aicd": "1.0", "level": "A1", "review": false }'],
  ['页面自带 version 字段不应误读', '<script type="application/ld+json">{"@type":"CreativeWork","version":"9.9","level":"B7"}</script>'],
  ['坏 JSON-LD', '<script type="application/ld+json">{ aicd: 1.0, }</script>']
]

for (const [name, source] of cases) {
  await send('Page.navigate', { url: `${ORIGIN}/verifier` })
  await sleep(1800)
  if (source) await paste(source)
  await sleep(300)
  await runVerify()
  await sleep(500)
  console.log(`\n───── ${name} ─────`)
  console.log(await readReport())
}

/* ── 4. 移动端 ───────────────────────────────────────────── */
await send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 1, mobile: true })
await send('Page.navigate', { url: `${ORIGIN}/verifier` })
await sleep(2200)
await js(`(()=>{[...document.querySelectorAll('.vf__btn')].find(b=>b.textContent.trim()==='载入示例').click();return 1})()`)
await sleep(900)
console.log('\n移动端横向溢出:', await js(`JSON.stringify({scrollW:document.documentElement.scrollWidth, clientW:document.documentElement.clientWidth, 行数:document.querySelectorAll('.vf__row').length})`))
console.log('移动端顶栏入口:', await js(`document.querySelector('.VPNavBarHamburger') ? '汉堡菜单' : '无'`))
await shot(process.env.SHOT || 'E:\\AICD\\v1\\.shots\\verifier-mobile.png')

ws.close()
chrome.kill()
