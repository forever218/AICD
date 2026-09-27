// CDP probe: dump layout geometry of the AICD homepage
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9333
const URL = process.argv[2] || 'http://127.0.0.1:5199/'
const WIDTH = Number(process.argv[3] || 1440)
const HEIGHT = Number(process.argv[4] || 900)

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`,
  `--window-size=${WIDTH},${HEIGHT}`,
  'about:blank'
], { stdio: 'ignore' })

async function targets() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const list = await r.json()
      const page = list.find((t) => t.type === 'page')
      if (page) return page
    } catch {}
    await sleep(300)
  }
  throw new Error('chrome not ready')
}

const page = await targets()
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
})
await new Promise((res) => ws.addEventListener('open', res))

function send(method, params = {}) {
  const mid = ++id
  return new Promise((res) => {
    pending.set(mid, res)
    ws.send(JSON.stringify({ id: mid, method, params }))
  })
}

await send('Page.enable')
await send('Runtime.enable')
await send('Page.navigate', { url: URL })
await sleep(4000)

const expr = `(() => {
  const m = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return { top: +r.top.toFixed(1), h: +r.height.toFixed(1), bottom: +r.bottom.toFixed(1),
             pos: cs.position, pt: cs.paddingTop, mt: cs.marginTop, display: cs.display }
  }
  const root = getComputedStyle(document.documentElement)
  return JSON.stringify({
    viewport: [innerWidth, innerHeight],
    vars: {
      navHeight: root.getPropertyValue('--vp-nav-height').trim(),
      layoutTop: root.getPropertyValue('--vp-layout-top-height').trim() || '(unset)'
    },
    layout: m('.Layout'),
    progress: m('.aicd-progress'),
    skip: m('.VPSkipLink'),
    nav: m('.VPNav'),
    navBar: m('.VPNavBar'),
    navTitle: m('.VPNavBarTitle'),
    localNav: m('.VPLocalNav'),
    content: m('.VPContent'),
    home: m('.VPHome'),
    homeContent: m('.VPHomeContent'),
    doc: m('.vp-doc'),
    scene: m('.home'),
    hero: m('.hero'),
    eyebrow: m('.hero__eyebrow'),
    bodyChildren: [...document.body.children].map(n => n.className + '|' + n.getBoundingClientRect().height.toFixed(1))
  }, null, 2)
})()`

const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true })
console.log(r.result?.result?.value ?? JSON.stringify(r, null, 2))
ws.close()
chrome.kill()
