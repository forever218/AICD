<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onContentUpdated, useData } from 'vitepress'

interface TocItem {
  id: string
  text: string
  level: number
}

const { theme, frontmatter } = useData()

const open = ref(false)
const compact = ref(false)
const items = ref<TocItem[]>([])
const active = ref('')

/* 文案沿用各语言的 themeConfig.outline.label（本页 / On this page / 本頁） */
const label = computed(
  () => (theme.value.outline as { label?: string } | undefined)?.label || 'On this page'
)
const topLabel = computed(() => theme.value.returnToTopLabel || 'Back to top')

/* 只在移动端、非首页、且本页确实有目录标题时出现 */
const show = computed(
  () => compact.value && frontmatter.value.layout !== 'home' && items.value.length > 0
)

let frame = 0
let scanFrame = 0
let observer: MutationObserver | null = null

/* 目录数据直接取 VitePress 已经生成好的右侧大纲 DOM（移动端只是被 CSS 藏起来），
   标题文本、层级、顺序与桌面端完全一致，也自动跟随三语内容变化。 */
function scan() {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.VPDocAsideOutline .outline-link')
  )
  const next = links
    .map((a) => {
      let depth = 0
      for (let p = a.parentElement; p; p = p.parentElement) {
        if (p.tagName === 'UL') depth++
      }
      const href = a.getAttribute('href') || ''
      let id = href.replace(/^#/, '')
      try {
        id = decodeURIComponent(id)
      } catch {
        /* 非法转义就按原文匹配 */
      }
      return { id, text: (a.textContent || '').trim(), level: depth + 1 }
    })
    .filter((i) => i.id && i.text)

  const same =
    next.length === items.value.length &&
    next.every((n, i) => {
      const o = items.value[i]
      return o.id === n.id && o.text === n.text && o.level === n.level
    })
  if (!same) items.value = next
}

/* 大纲是在正文挂载后才出现的，首次挂载时往往还是空的：
   监听 DOM 变化（新页面 / 新标题）后在下一帧重扫一次。 */
function scheduleScan() {
  if (scanFrame) return
  scanFrame = requestAnimationFrame(() => {
    scanFrame = 0
    scan()
    schedule()
  })
}

/* 当前读到哪一节：取最后一个已经越过顶栏的标题 */
function measure() {
  frame = 0
  const edge = 100
  let current = ''
  for (const it of items.value) {
    const el = document.getElementById(it.id)
    if (el && el.getBoundingClientRect().top <= edge) current = it.id
  }
  active.value = current
}

function schedule() {
  if (frame) return
  frame = requestAnimationFrame(measure)
}

function jump(event: MouseEvent, id: string) {
  const el = document.getElementById(id)
  if (!el) return
  event.preventDefault()
  open.value = false
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(history.state, '', '#' + encodeURIComponent(id))
}

function toTop() {
  open.value = false
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

let mq: MediaQueryList | null = null
let onMq: ((e: MediaQueryListEvent) => void) | null = null

onContentUpdated(() => {
  open.value = false
  scan()
  measure()
})

onMounted(() => {
  mq = window.matchMedia('(max-width: 959px)')
  compact.value = mq.matches
  onMq = (e) => {
    compact.value = e.matches
    if (!e.matches) open.value = false
  }
  mq.addEventListener('change', onMq)

  scan()
  measure()

  /* 挂载瞬间大纲多半还没渲染出来，交给 DOM 变化回调补扫 */
  observer = new MutationObserver(scheduleScan)
  observer.observe(document.body, { childList: true, subtree: true })

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
  if (scanFrame) cancelAnimationFrame(scanFrame)
  observer?.disconnect()
  if (mq && onMq) mq.removeEventListener('change', onMq)
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div v-if="show" class="mtoc" :class="{ 'mtoc--open': open }">
    <div v-if="open" class="mtoc__scrim" @click="open = false" />

    <Transition name="mtoc-fly">
      <nav v-if="open" class="mtoc__panel" :aria-label="label">
        <div class="mtoc__head">
          <span class="mtoc__title">{{ label }}</span>
          <button type="button" class="mtoc__top" @click="toTop">{{ topLabel }}</button>
        </div>
        <ul class="mtoc__list">
          <li
            v-for="it in items"
            :key="it.id"
            class="mtoc__item"
            :class="[`mtoc__item--h${it.level}`, { 'is-active': active === it.id }]"
          >
            <a :href="`#${it.id}`" @click="jump($event, it.id)">{{ it.text }}</a>
          </li>
        </ul>
      </nav>
    </Transition>

    <button
      type="button"
      class="mtoc__fab"
      :aria-expanded="open"
      :aria-label="label"
      @click="open = !open"
    >
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <g
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        >
          <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h7.5" />
        </g>
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* 容器只负责定位与层级：45 高于顶栏(30)，低于导航抽屉(60+) */
.mtoc {
  /* 贴底会挡住正文尾部，整体抬高约 2.5 个按钮高度（按钮 3rem） */
  --mtoc-lift: 7.5rem;
  position: fixed;
  right: max(0.9rem, env(safe-area-inset-right));
  bottom: calc(max(0.9rem, env(safe-area-inset-bottom)) + var(--mtoc-lift));
  z-index: 45;
  pointer-events: none;
}

.mtoc__scrim {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: oklch(0 0 0 / 0.14);
  pointer-events: auto;
}

/* ── 右下角按钮 ──────────────────────────────────────────────── */

.mtoc__fab {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  padding: 0;
  border: 1px solid var(--ink);
  border-radius: 999px;
  /* 明状态：黑底白字；暗状态：白底黑字（--ink/--paper 随主题互换） */
  background: var(--ink);
  color: var(--paper);
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 10px 26px -16px oklch(0 0 0 / 0.55);
  transition:
    background-color 260ms var(--ease),
    color 260ms var(--ease),
    border-color 260ms var(--ease);
}

/* 展开时反相，形成明确的开关反馈 */
.mtoc--open .mtoc__fab {
  background: var(--paper-raised);
  border-color: var(--ink);
  color: var(--ink);
}

/* ── 目录面板 ────────────────────────────────────────────────── */

.mtoc__panel {
  position: fixed;
  right: max(0.9rem, env(safe-area-inset-right));
  bottom: calc(
    max(0.9rem, env(safe-area-inset-bottom)) + var(--mtoc-lift) + 3.8rem
  );
  left: max(0.9rem, env(safe-area-inset-left));
  z-index: 1;
  display: flex;
  flex-direction: column;
  max-width: 21rem;
  max-height: min(62vh, 26rem);
  margin-left: auto;
  border: 1px solid var(--rule-strong);
  border-radius: 0.7rem;
  background: var(--paper-raised);
  box-shadow: 0 24px 60px -30px oklch(0 0 0 / 0.6);
  overflow: hidden;
  pointer-events: auto;
}

.mtoc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.15rem;
  border-bottom: 1px solid var(--rule);
}

.mtoc__title {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.mtoc__top {
  padding: 0;
  border: 0;
  background: none;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  letter-spacing: 0.04em;
  color: var(--seal-ink);
  cursor: pointer;
  transition: opacity 240ms var(--ease);
}

.mtoc__top:active {
  opacity: 0.6;
}

.mtoc__list {
  flex: 1;
  margin: 0;
  padding: 0.55rem 0;
  list-style: none;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.mtoc__item a {
  display: block;
  padding: 0.46rem 1.15rem;
  border-left: 2px solid transparent;
  font-size: 0.97rem;
  line-height: 1.5;
  color: var(--ink-soft);
  text-decoration: none;
  transition:
    color 240ms var(--ease),
    border-color 240ms var(--ease),
    background-color 240ms var(--ease);
}

.mtoc__item--h3 a {
  padding-left: 2.1rem;
  font-size: 0.9rem;
}

.mtoc__item a:active {
  background: var(--paper-sunken);
}

.mtoc__item.is-active a {
  border-left-color: var(--seal);
  color: var(--ink);
}

/* ── 浮出动效 ────────────────────────────────────────────────── */

.mtoc-fly-enter-active {
  transition:
    opacity 220ms var(--ease),
    transform 280ms var(--ease);
}

.mtoc-fly-leave-active {
  transition:
    opacity 150ms var(--ease),
    transform 180ms var(--ease);
}

.mtoc-fly-enter-from,
.mtoc-fly-leave-to {
  opacity: 0;
  transform: translateY(0.8rem) scale(0.985);
}

@media (prefers-reduced-motion: reduce) {
  .mtoc__panel,
  .mtoc__fab {
    transition: none;
  }
}
</style>
