import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9335
const URL = process.argv[2] || 'http://127.0.0.1:5199/'
const WIDTH = Number(process.argv[3] || 430)
const HEIGHT = Number(process.argv[4] || 932)

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--no-default-browser-check', `--remote-debugging-port=${PORT}`,
  `--window-size=${WIDTH},${HEIGHT}`, 'about:blank'
], { stdio: 'ignore' })

async function findTarget() {
  for (let i = 0; i < 60; i++) {
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
await send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: true
})
await send('Page.navigate', { url: URL })
await sleep(4000)

const r = await send('Runtime.evaluate', {
  expression: `(() => {
    const de = document.documentElement
    const vw = de.clientWidth
    const over = [...document.querySelectorAll('body *')].filter(el => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && (r.right > vw + 1 || r.left < -1)
    }).slice(0, 14).map(el => {
      const r = el.getBoundingClientRect()
      return el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').slice(0,3).join('.')
        + ' [' + r.left.toFixed(0) + '→' + r.right.toFixed(0) + ' w' + r.width.toFixed(0) + ']'
    })
    return JSON.stringify({
      innerWidth, clientWidth: vw, scrollWidth: de.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      overflowing: over
    }, null, 1)
  })()`,
  returnByValue: true
})
console.log(r.result?.result?.value)
ws.close()
chrome.kill()
