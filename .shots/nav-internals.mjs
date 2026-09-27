// 顶栏内部几何：确认「AICD」与右侧菜单的垂直居中线是否一致
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
  const B = (sel) => { const e = document.querySelector(sel); if (!e) return null
    const b = e.getBoundingClientRect()
    return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), h: +b.height.toFixed(1),
             cy: +((b.top + b.bottom) / 2).toFixed(1), left: +b.left.toFixed(1) } }
  const cs = (sel, p) => { const e = document.querySelector(sel); return e ? getComputedStyle(e)[p] : null }
  const brand = document.querySelector('.nav-brand__text')
  const bb = brand?.getBoundingClientRect()
  return JSON.stringify({
    navHeightVar: getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height').trim(),
    bar: B('.VPNavBar'),
    barHeight: cs('.VPNavBar', 'height'),
    barPadding: cs('.VPNavBar', 'paddingTop') + ' / ' + cs('.VPNavBar', 'paddingBottom'),
    wrapper: B('.VPNavBar .wrapper'),
    container: B('.VPNavBar .container'),
    divider: B('.VPNavBar .divider'),
    contentBody: B('.VPNavBar .content-body'),
    menuLink: B('.VPNavBarMenuLink'),
    appearance: B('.VPSwitchAppearance'),
    brandText: bb ? { top: +bb.top.toFixed(1), bottom: +bb.bottom.toFixed(1), h: +bb.height.toFixed(1),
                      cy: +((bb.top + bb.bottom) / 2).toFixed(1), left: +bb.left.toFixed(1) } : null,
    brandLineHeight: cs('.nav-brand__text', 'lineHeight')
  }, null, 1)
})()`

for (const [w, h] of [[1440, 900], [1024, 800], [430, 900]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 900 })
  await send('Page.navigate', { url: ORIGIN + '/levels' })
  await sleep(2600)
  const r = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true })
  console.log(`\n───── ${w}x${h} ─────`)
  console.log(r.result?.result?.value || JSON.stringify(r.result))
}

ws.close()
chrome.kill()
