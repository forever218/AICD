// 点击「AICD」标识是否跳回首页（真实鼠标点击 + 新标签页语义检查）
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
const evalJs = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true })
  return r.result?.result?.value
}

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

// 1. 从内页点击标识
await send('Page.navigate', { url: ORIGIN + '/levels' })
await sleep(2800)
const box = await evalJs(`(() => {
  const e = document.querySelector('.nav-brand__text')
  if (!e) return null
  const b = e.getBoundingClientRect()
  return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2,
    href: document.querySelector('.VPNavBarTitle .title')?.getAttribute('href'),
    text: document.querySelector('.VPNavBarTitle .title')?.textContent.trim(),
    tag: document.querySelector('.VPNavBarTitle .title')?.tagName })
})()`)
console.log('标识与承载链接:', box)

if (box) {
  const { x, y } = JSON.parse(box)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  await sleep(1800)
  console.log('点击后 URL:', await evalJs('location.pathname'))
  console.log('点击后 is-home:', await evalJs("document.documentElement.classList.contains('is-home')"))
  console.log('点击后 h1:', await evalJs("document.querySelector('.hero__title')?.textContent.trim().slice(0,20) || '(无)'"))
  console.log('点击后仍有标识:', await evalJs("!!document.querySelector('.nav-brand__text')"))
  // 单屏校验
  console.log('首页可滚动:', await evalJs('document.documentElement.scrollHeight > document.documentElement.clientHeight + 1'))
}

// 2. 顶栏空白处点击不应跳转（pointer-events 覆盖层检查）
await send('Page.navigate', { url: ORIGIN + '/adopt' })
await sleep(2500)
const empty = await evalJs(`JSON.stringify({
  pe: getComputedStyle(document.querySelector('.nav-brand__box')).pointerEvents,
  textPE: getComputedStyle(document.querySelector('.nav-brand__text')).pointerEvents,
  boxLeft: document.querySelector('.nav-brand__box').getBoundingClientRect().left
})`)
console.log('\n覆盖层 pointer-events:', empty)
const bx = JSON.parse(empty)
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bx.boxLeft + 24, y: 35, button: 'left', clickCount: 1 })
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bx.boxLeft + 24, y: 35, button: 'left', clickCount: 1 })
await sleep(1200)
console.log('点击顶栏空白处后 URL:', await evalJs('location.pathname'), '（应仍为 /adopt）')

ws.close()
chrome.kill()
