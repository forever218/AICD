import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://127.0.0.1:5199'
const PORT = 9915
const url = process.argv[2]
const W = Number(process.argv[3] || 1440)
const H = Number(process.argv[4] || 900)
const out = process.argv[5]
const scheme = process.argv[6] || 'light'
const clip = process.argv[7] ? process.argv[7].split(',').map(Number) : null

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

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: W,
  height: H,
  deviceScaleFactor: 2,
  mobile: false
})
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-color-scheme', value: scheme }]
})
await send('Page.navigate', { url: ORIGIN + url })
await sleep(2800)
const shot = await send('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: !!clip,
  ...(clip ? { clip: { x: clip[0], y: clip[1], width: clip[2], height: clip[3], scale: 2 } } : {})
})
writeFileSync(out, Buffer.from(shot.result.data, 'base64'))
console.log('saved ' + out + ' [' + scheme + ']')
ws.close()
chrome.kill()
