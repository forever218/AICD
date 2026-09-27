// 顶部右侧放大裁切，用于肉眼确认对齐关系
// usage: node crop.mjs <url> <x> <y> <w> <h> <out> [scale]
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9300 + Math.floor(Math.random() * 400)
const [, , URL, X, Y, W, H, OUT, SCALE = '2'] = process.argv

const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
   '--no-default-browser-check', `--remote-debugging-port=${PORT}`,
   '--window-size=1600,1000', 'about:blank'],
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
const VW = Number(process.env.VW || 1440)
const VH = Number(process.env.VH || 900)
await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 2, mobile: false })
await send('Page.navigate', { url: URL })
await sleep(3200)

const shot = await send('Page.captureScreenshot', {
  format: 'png',
  clip: { x: Number(X), y: Number(Y), width: Number(W), height: Number(H), scale: Number(SCALE) },
  captureBeyondViewport: false
})
writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'))
console.log('saved', OUT, `${W}x${H} @${SCALE}x`)

ws.close()
chrome.kill()
