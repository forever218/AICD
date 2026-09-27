import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9334
const URL = process.argv[2] || 'http://127.0.0.1:5199/'
const WIDTH = Number(process.argv[3] || 1440)
const HEIGHT = Number(process.argv[4] || 900)

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
await send('DOM.enable')
await send('CSS.enable')
await send('Page.navigate', { url: URL })
await sleep(4000)

// 1) list CSS rules that mention VPNavBar and padding
const ruleDump = await send('Runtime.evaluate', {
  expression: `(() => {
    const out = []
    for (const sheet of document.styleSheets) {
      let rules
      try { rules = sheet.cssRules } catch { continue }
      const walk = (list, media) => {
        for (const r of list) {
          if (r.cssRules) { walk(r.cssRules, (r.conditionText || r.media?.mediaText || media)); continue }
          const sel = r.selectorText || ''
          if (!/VPNav/i.test(sel)) continue
          if (/padding|height|position|top/i.test(r.style?.cssText || '')) {
            out.push({ media: media || '', sel, css: r.style.cssText })
          }
        }
      }
      walk(rules, '')
    }
    return JSON.stringify(out, null, 1)
  })()`,
  returnByValue: true
})
console.log('=== CSS rules touching VPNav (layout props) ===')
console.log(ruleDump.result?.result?.value)

// 2) matched styles for .VPNavBar via CSS domain
const doc = await send('DOM.getDocument', { depth: -1 })
const nodeRes = await send('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: '.VPNavBar' })
const matched = await send('CSS.getMatchedStylesForNode', { nodeId: nodeRes.result.nodeId })
const interesting = []
for (const entry of matched.result.matchedCSSRules || []) {
  const txt = entry.rule.style.cssText || ''
  if (/padding|height|top|position|margin/i.test(txt)) {
    interesting.push({
      sel: entry.rule.selectorList?.text,
      media: entry.rule.media?.map((m) => m.text).join(' && ') || '',
      props: (entry.rule.style.cssProperties || [])
        .filter((p) => /padding|height|top|position|margin|box-sizing/i.test(p.name))
        .map((p) => `${p.name}:${p.value}${p.disabled ? ' [disabled]' : ''}`)
        .join('; ')
    })
  }
}
console.log('=== matched rules for .VPNavBar (layout props) ===')
console.log(JSON.stringify(interesting, null, 1))

// 3) computed box + which node is .home
const box = await send('Runtime.evaluate', {
  expression: `(() => {
    const el = document.querySelector('.VPNavBar')
    const cs = getComputedStyle(el)
    const ids = [...document.querySelectorAll('.home')].map(n => n.tagName + '.' + n.className)
    return JSON.stringify({
      matchedHome: ids,
      boxSizing: cs.boxSizing, height: cs.height, paddingTop: cs.paddingTop,
      position: cs.position, top: cs.top, marginTop: cs.marginTop,
      navElHeight: document.querySelector('.VPNav').getBoundingClientRect().height,
      containerHeight: document.querySelector('.VPNavBar .container').getBoundingClientRect().height,
      dividerLine: document.querySelector('.divider-line')?.getBoundingClientRect().top,
      docScrollTop: document.documentElement.scrollTop
    }, null, 1)
  })()`,
  returnByValue: true
})
console.log('=== computed box ===')
console.log(box.result?.result?.value)

ws.close()
chrome.kill()
