import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const PORT = 9555
const W = Number(process.argv[2] || 430)
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--remote-debugging-port=${PORT}`, `--window-size=${W},932`, 'about:blank'
], { stdio: 'ignore' })

async function t() {
  for (let i = 0; i < 60; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      const p = l.find((x) => x.type === 'page')
      if (p) return p
    } catch {}
    await sleep(300)
  }
  throw new Error('no chrome')
}

const page = await t()
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pend = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) }
})
await new Promise((r) => ws.addEventListener('open', r))
const send = (m, p = {}) => {
  const i = ++id
  return new Promise((r) => { pend.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })) })
}

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: W, height: 932, deviceScaleFactor: 1, mobile: true })
await send('Page.navigate', { url: 'http://127.0.0.1:5199/' })
await sleep(4000)

const r = await send('Runtime.evaluate', {
  expression: `(() => {
    const mq = matchMedia('(max-width: 900px)').matches
    const g = document.querySelector('.hero__glyph')
    const cs = g ? getComputedStyle(g) : null
    const b = g ? g.getBoundingClientRect() : null
    return JSON.stringify({
      innerWidth, mq900: mq, glyphTag: g && g.tagName,
      glyphClass: g && g.getAttribute('class'),
      glyphInlineStyle: g && g.getAttribute('style'),
      display: cs && cs.display, opacity: cs && cs.opacity,
      rect: b ? [b.left.toFixed(0), b.top.toFixed(0), b.width.toFixed(0), b.height.toFixed(0)] : null
    }, null, 1)
  })()`,
  returnByValue: true
})
console.log(r.result?.result?.value)
ws.close()
chrome.kill()
