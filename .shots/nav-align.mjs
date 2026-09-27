// 测量内页：顶栏容器左右缘 vs 正文内容左右缘
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = process.argv[2] || 'http://127.0.0.1:5199'
const PORT = 9700 + Math.floor(Math.random() * 200)

const chrome = spawn(
  CHROME,
  [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', `--remote-debugging-port=${PORT}`,
    '--window-size=1440,900', 'about:blank'
  ],
  { stdio: 'ignore' }
)

async function findTarget() {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      const p = list.find((t) => t.type === 'page')
      if (p) return p
    } catch {}
    await sleep(300)
  }
  throw new Error('chrome not ready')
}

const page = await findTarget()
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
})
await new Promise((r) => ws.addEventListener('open', r))
const send = (method, params = {}) => {
  const mid = ++id
  return new Promise((res) => { pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })) })
}

await send('Page.enable')

const PROBE = `(() => {
  const R = (e) => { if (!e) return null
    const b = e.getBoundingClientRect(); return [+b.left.toFixed(1), +b.right.toFixed(1), +b.width.toFixed(1)] }
  const navC = document.querySelector('.VPNavBar .container')
  const navTitle = document.querySelector('.VPNavBarTitle')
  const navTitleA = document.querySelector('.VPNavBarTitle .title')
  const navBrand = document.querySelector('.nav-brand')
  const brandText = document.querySelector('.nav-brand__text')
  const brandBox = document.querySelector('.nav-brand__box')
  const inner = document.querySelector('.VPDoc .content-container')
  const innerAny = inner || document.querySelector('.VPDoc .content')
  const vpdoc = document.querySelector('.VPDoc')
  return JSON.stringify({
    vw: document.documentElement.clientWidth,
    home: document.documentElement.classList.contains('is-home'),
    hasAside: !!document.querySelector('.VPDoc.has-aside'),
    navBarTop: R(document.querySelector('.VPNavBar'))?.[0],
    navBarBox: (() => { const e = document.querySelector('.VPNavBar'); if (!e) return null
      const b = e.getBoundingClientRect(); return [+b.left.toFixed(1), +b.top.toFixed(1), +b.width.toFixed(1), +b.height.toFixed(1)] })(),
    brandTop: brandText ? (() => { const b = brandText.getBoundingClientRect(); return [+b.left.toFixed(1), +b.top.toFixed(1), +b.right.toFixed(1), +b.height.toFixed(1)] })() : 'NO brand',
    brandBox: R(brandBox),
    brandPE: brandText ? getComputedStyle(brandText).pointerEvents : null,
    content: R(innerAny),
    contentTop: innerAny ? +innerAny.getBoundingClientRect().top.toFixed(1) : null,
    scrollW: document.documentElement.scrollWidth
  })
})()`

async function probe(label, w, h, url) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 900 })
  await send('Page.navigate', { url: ORIGIN + url })
  await sleep(2600)
  const r = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true })
  const v = r.result?.result?.value
  console.log(`\n───── ${label} ${w}x${h} ${url} ─────`)
  console.log(v || JSON.stringify(r.result))
}

const targets = (process.argv[3] || '/levels').split(',')
const widths = [[1440, 900], [1280, 860], [1024, 800], [900, 800], [768, 800], [430, 900]]
for (const t of targets) {
  for (const [w, h] of widths) await probe(t, w, h, t)
}

ws.close()
chrome.kill()
