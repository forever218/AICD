// 顶栏右侧内容 vs 页面各内容块 的右缘对齐测量
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = process.argv[2] || 'http://127.0.0.1:5199'
const PORT = 9700 + Math.floor(Math.random() * 200)

const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
   '--no-default-browser-check', `--remote-debugging-port=${PORT}`,
   '--window-size=1440,900', 'about:blank'],
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
  const r = (sel) => { const e = document.querySelector(sel); if (!e) return null
    const b = e.getBoundingClientRect(); return [+b.left.toFixed(1), +b.right.toFixed(1)] }
  // 顶栏里最靠右的可见元素
  const items = [...document.querySelectorAll('.VPNavBar .content-body > *')]
    .filter((e) => getComputedStyle(e).display !== 'none')
  const lastItem = items[items.length - 1]
  const inner = lastItem ? lastItem.lastElementChild || lastItem : null
  return JSON.stringify({
    vw: document.documentElement.clientWidth,
    navContainer: r('.VPNavBar .container'),
    navContainerPadR: document.querySelector('.VPNavBar .container')
      ? getComputedStyle(document.querySelector('.VPNavBar .container')).paddingRight : null,
    navContentBody: r('.VPNavBar .content-body'),
    lastItemClass: lastItem ? lastItem.className : null,
    lastItem: lastItem ? r('.' + lastItem.className.split(' ')[0]) : null,
    navRightest: inner ? r('.' + (inner.className || '').split(' ')[0]) : null,
    vpdocContainer: r('.VPDoc .container'),
    contentContainer: r('.VPDoc .content-container'),
    aside: r('.VPDoc .aside'),
    asideContainer: r('.VPDoc .aside-container'),
    outline: r('.VPDocAsideOutline'),
    outlineInner: r('.VPDocAsideOutline .outline-content') || r('.VPDocAsideOutline .root'),
    footer: r('.VPFooter .container')
  })
})()`

for (const [w, h] of [[1920, 1000], [1600, 950], [1440, 900], [1280, 860], [1180, 850], [1024, 800], [900, 800]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 900 })
  await send('Page.navigate', { url: ORIGIN + '/levels' })
  await sleep(2500)
  const res = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true })
  console.log(`\n───── ${w} ─────`)
  console.log(res.result?.result?.value)
}

ws.close()
chrome.kill()
