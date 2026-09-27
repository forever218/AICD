// Verify single-screen home at several viewports.
// usage: node verify.mjs <url>
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = process.argv[2] || 'http://127.0.0.1:5199/'
const SIZES = [
  [1440, 900, 'desktop'],
  [1440, 720, 'desktop-short'],
  [1280, 800, 'laptop'],
  [768, 1024, 'tablet'],
  [430, 932, 'mobile']
]

const PORT = 9600 + Math.floor(Math.random() * 300)
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--no-default-browser-check', `--remote-debugging-port=${PORT}`,
  '--window-size=1440,900', 'about:blank'
], { stdio: 'ignore' })

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

for (const [w, h, label] of SIZES) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: w, height: h, deviceScaleFactor: 1, mobile: w < 700
  })
  await send('Page.navigate', { url: URL })
  await sleep(2600)

  const r = await send('Runtime.evaluate', {
    expression: `(() => {
      const de = document.documentElement
      const g = (s) => { const e = document.querySelector(s); if (!e) return null
        const b = e.getBoundingClientRect(); return { top: +b.top.toFixed(0), bottom: +b.bottom.toFixed(0), h: +b.height.toFixed(0) } }
      const scene = document.querySelector('.home-scene')
      const sb = scene.getBoundingClientRect()
      const hero = document.querySelector('.hero').getBoundingClientRect()
      const closing = document.querySelector('.closing').getBoundingClientRect()
      const contentTop = hero.top, contentBottom = closing.bottom
      const availTop = 70, availBottom = de.clientHeight
      return JSON.stringify({
        vp: [de.clientWidth, de.clientHeight],
        isHomeClass: de.classList.contains('is-home'),
        scroll: { docScrollHeight: de.scrollHeight, docClientHeight: de.clientHeight,
                  overflowY: getComputedStyle(de).overflowY,
                  canScroll: de.scrollHeight - de.clientHeight },
        scene: { top: +sb.top.toFixed(0), h: +sb.height.toFixed(0) },
        navBar: g('.VPNavBar'),
        hero: { top: +hero.top.toFixed(0), h: +hero.height.toFixed(0) },
        closing: { top: +closing.top.toFixed(0), bottom: +closing.bottom.toFixed(0), h: +closing.height.toFixed(0) },
        centered: {
          gapTop: +(contentTop - availTop).toFixed(0),
          gapBottom: +(availBottom - contentBottom).toFixed(0)
        },
        glyph: (() => { const e = document.querySelector('.hero__glyph'); if (!e) return null
          const cs = getComputedStyle(e); const b = e.getBoundingClientRect()
          return { display: cs.display, top: +b.top.toFixed(0), cy: +(b.top + b.height / 2).toFixed(0), h: +b.height.toFixed(0) } })(),
        footer: (() => { const e = document.querySelector('.VPFooter'); return e ? getComputedStyle(e).display : 'none' })()
      }, null, 1)
    })()`,
    returnByValue: true
  })
  console.log(`\n───── ${label} ${w}x${h} ─────`)
  console.log(r.result?.result?.value ?? JSON.stringify(r).slice(0, 1200))
}

ws.close()
chrome.kill()
