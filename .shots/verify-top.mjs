import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://127.0.0.1:5199'
const PORT = 9888
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
  const r = await js(`(() => {
    const out = []
    const nav = document.querySelector('.VPNavBar')
    const navB = nav ? nav.getBoundingClientRect().bottom : null
    const html = document.documentElement
    const vp = document.querySelector('.vp-doc')
    const first = vp ? vp.querySelector('h1, h2, h3, p, ul, ol, article') : null
    const fr = first ? first.getBoundingClientRect() : null
    const cs = first ? getComputedStyle(first) : null
    const h2s = [...document.querySelectorAll('.vp-doc h2')].slice(0, 3)
    const marks = h2s.map((h) => {
      const b = getComputedStyle(h, '::before')
      return h.textContent.trim().slice(0, 14) + ' => ' + b.display + ' / w=' + b.width + ' / ' + b.backgroundColor
    })
    const aside = document.querySelector('.aside-container .outline-title, .aside-container .VPDocOutlineItem, .aside-container > *')
    const asideTop = aside ? aside.getBoundingClientRect().top : null
    out.push('html.no-heading-mark = ' + html.classList.contains('no-heading-mark'))
    out.push('navBottom = ' + (navB === null ? 'n/a' : navB.toFixed(1)))
    if (first) {
      out.push('first <' + first.tagName.toLowerCase() + '> top = ' + fr.top.toFixed(1) + '  (距顶栏 ' + (fr.top - navB).toFixed(1) + 'px)  mt=' + cs.marginTop + ' pt=' + cs.paddingTop + ' bt=' + cs.borderTopWidth)
      out.push('  text: "' + first.textContent.trim().slice(0, 30) + '"')
    }
    out.push('h2 ::before => ' + (marks.join('  ||  ') || '（无 h2）'))
    out.push('aside first item top = ' + (asideTop === null ? 'n/a' : asideTop.toFixed(1)))
    out.push('scrollW=' + html.scrollWidth + ' clientW=' + html.clientWidth)
    return out.join('\\n')
  })()`)
  console.log('───── ' + p + ' @' + W + ' ─────')
  console.log(r)
}

ws.close()
chrome.kill()
