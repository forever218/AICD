// Header/content alignment + home single-screen check.
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = process.argv[2] || 'http://127.0.0.1:5199'
const PORT = 9700 + Math.floor(Math.random() * 200)

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

const PROBE = `(() => {
  const de = document.documentElement
  const R = (sel) => { const e = document.querySelector(sel); if (!e) return null
    const b = e.getBoundingClientRect(); return { l: +b.left.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1), t: +b.top.toFixed(1), bo: +b.bottom.toFixed(1) } }
  const nav = document.querySelector('.VPNavBar .container')
  const menus = [...document.querySelectorAll('.VPNavBar .container .content-body > *')]
  const last = menus.filter(e => getComputedStyle(e).display !== 'none').pop()
  const navTitle = document.querySelector('.VPNavBarTitle .title')
  const home = document.querySelector('.home-scene')
  const homeInner = home ? home.getBoundingClientRect() : null
  const doc = document.querySelector('.VPDoc .content-container') || document.querySelector('.VPDoc .container')
  return JSON.stringify({
    vw: de.clientWidth, vh: de.clientHeight,
    isHome: de.classList.contains('is-home'),
    navContainer: R('.VPNavBar .container'),
    navTitleText: navTitle ? navTitle.textContent.trim() : '(none)',
    navTitleWidth: navTitle ? +navTitle.getBoundingClientRect().width.toFixed(1) : null,
    lastNavItem: last ? (last.className.split(' ')[0] + ' r=' + last.getBoundingClientRect().right.toFixed(1)) : null,
    scroll: { scrollH: de.scrollHeight, clientH: de.clientHeight, delta: de.scrollHeight - de.clientHeight,
              overflowY: getComputedStyle(de).overflowY },
    homeScene: R('.home-scene'),
    homeContentEdge: homeInner ? +(homeInner.right - 64).toFixed(1) : null,
    docContent: doc ? R(doc) : null,
    footer: (() => { const f = document.querySelector('.VPFooter'); return f ? getComputedStyle(f).display : '(none)' })()
  }, null, 1)
})()`

async function snap(url, w, h, label) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 })
  await send('Page.navigate', { url })
  await sleep(2600)
  const r = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true })
  console.log(`\n───── ${label} (${w}x${h}) ─────`)
  console.log(r.result?.result?.value ?? JSON.stringify(r).slice(0, 800))
}

await snap(`${ORIGIN}/`, 1440, 900, 'HOME desktop')
await snap(`${ORIGIN}/`, 1280, 800, 'HOME laptop')
await snap(`${ORIGIN}/`, 430, 932, 'HOME mobile')
await snap(`${ORIGIN}/initiative/`, 1440, 900, 'DOC initiative')

ws.close()
chrome.kill()
