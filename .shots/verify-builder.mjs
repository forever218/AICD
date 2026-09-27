import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://127.0.0.1:5199'
const PORT = 9902
const W = Number(process.argv[2] || 1440)
const H = Number(process.argv[3] || 900)

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
      const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      const p = l.find((x) => x.type === 'page')
      if (p) return p
    } catch {}
    await sleep(300)
  }
  throw new Error('no chrome')
}
const page = await target()
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pend = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) {
    pend.get(m.id)(m)
    pend.delete(m.id)
  }
})
await new Promise((r) => ws.addEventListener('open', r))
const send = (method, params = {}) => {
  const i = ++id
  return new Promise((r) => {
    pend.set(i, r)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
}
const js = async (expr) =>
  (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: W,
  height: H,
  deviceScaleFactor: 1,
  mobile: W < 800
})

for (const p of process.argv[4].split(',')) {
  await send('Page.navigate', { url: ORIGIN + p })
  await sleep(2600)

  /* 1) 点一下 A5，验证极简行是否跟着变 */
  const before = await js(`(() => {
    const outs = [...document.querySelectorAll('.builder__out')]
    const labels = [...document.querySelectorAll('.builder__label')].map((l) => {
      const cs = getComputedStyle(l)
      const r = l.getBoundingClientRect()
      return l.textContent.trim() + ' | ' + cs.fontSize + ' | ' + cs.color + ' | h=' + r.height.toFixed(0)
    })
    return JSON.stringify({
      outs: outs.map((o) => o.querySelector('.builder__label')?.textContent.trim() + ' => ' + (o.querySelector('.dbadge__line, .builder__compact')?.textContent.trim() ?? '')),
      labels,
      compactFont: (() => { const c = document.querySelector('.builder__compact'); if (!c) return null; const cs = getComputedStyle(c); return cs.fontSize + ' / ' + cs.color + ' / border=' + cs.borderLeftWidth + ' ' + cs.borderLeftColor })(),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }, null, 1)
  })()`)
  console.log('───── ' + p + ' @' + W + ' ─────')
  console.log(before)

  /* 点击最后一个等级 chip，再读一次极简行 */
  await js(`(() => { const chips = [...document.querySelectorAll('.builder__field .chip')]; chips[5]?.click(); return 1 })()`)
  await sleep(500)
  const after = await js(`(() => {
    const outs = [...document.querySelectorAll('.builder__out')]
    return outs.map((o) => o.querySelector('.builder__label')?.textContent.trim() + ' => ' + (o.querySelector('.dbadge__line, .builder__compact')?.textContent.trim() ?? '')).join('\\n')
  })()`)
  console.log('点击 A5 后：\n' + after)
}

ws.close()
chrome.kill()
