// CDP screenshot with exact viewport + optional full page.
// usage: node shot.mjs <url> <width> <height> <outfile> [full|viewport] [mobile]
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9400 + Math.floor(Math.random() * 400)
const [, , URL, W, H, OUT, MODE = 'viewport', MOBILE = ''] = process.argv
const WIDTH = Number(W || 1440)
const HEIGHT = Number(H || 900)

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
  width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: MOBILE === 'mobile'
})
await send('Page.navigate', { url: URL })
await sleep(3500)

if (MODE === 'full') {
  const { result } = await send('Runtime.evaluate', {
    expression: `document.documentElement.scrollHeight`, returnByValue: true
  })
  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: result.value, deviceScaleFactor: 1, mobile: MOBILE === 'mobile'
  })
  await sleep(1200)
}

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'))
console.log('saved', OUT)
ws.close()
chrome.kill()
