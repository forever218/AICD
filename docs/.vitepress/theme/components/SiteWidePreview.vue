<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { STRINGS, useLocale } from '../data/i18n'

type Mode = 'auto' | 'light' | 'dark'

const lang = useLocale()
const s = computed(() => STRINGS[lang.value])

const host = ref<HTMLElement | null>(null)
const frame = ref<HTMLIFrameElement | null>(null)
const source = ref('')
const height = ref(620)
const mode = ref<Mode>('auto')

/** 证书页自身的配色变量，仅在强制预览配色时注入覆盖 */
const SCHEME = {
  light: {
    '--paper': '#fbfaf7',
    '--ink': '#1f2229',
    '--soft': '#4b5059',
    '--rule': '#dedad2',
    '--mark': '#a63a2c'
  },
  dark: {
    '--paper': '#16181d',
    '--ink': '#edebe6',
    '--soft': '#a6aab3',
    '--rule': '#2f333b',
    '--mark': '#d4776a'
  }
} as const

/** 直接读页面上「全站声明」代码块的源码，预览与代码永远同源 */
function readSource() {
  const head = document.getElementById('sitewide')
  if (!head) return ''
  let node: Element | null = head.nextElementSibling
  while (node) {
    const pre = node.tagName === 'PRE' ? node : node.querySelector('pre')
    const code = pre?.querySelector('code')
    if (code?.textContent) return code.textContent.trim()
    node = node.nextElementSibling
  }
  return ''
}

/** 证书页正文高度 + 其自身留白，避免 min-height:100vh 撑出多余空白 */
function fit() {
  const doc = frame.value?.contentDocument
  const win = doc?.defaultView
  if (!doc || !win || !doc.body) return
  const sheet = doc.querySelector('.sheet') as HTMLElement | null
  if (!sheet) return
  const bcs = win.getComputedStyle(doc.body)
  const pad = parseFloat(bcs.paddingTop) + parseFloat(bcs.paddingBottom)
  height.value = Math.ceil(sheet.getBoundingClientRect().height + pad)
}

/** 代码里已内置 prefers-color-scheme 适配，自动模式下无需干预 */
function paint() {
  const doc = frame.value?.contentDocument
  if (!doc?.head) return
  const id = 'aicd-preview-scheme'
  if (mode.value === 'auto') {
    doc.getElementById(id)?.remove()
    return
  }
  let style = doc.getElementById(id) as HTMLStyleElement | null
  if (!style) {
    style = doc.createElement('style')
    style.id = id
    doc.head.appendChild(style)
  }
  style.textContent = `:root{${Object.entries(SCHEME[mode.value])
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`
}

function onLoad() {
  paint()
  fit()
}

function setMode(m: Mode) {
  mode.value = m
  paint()
}

let ro: ResizeObserver | undefined

onMounted(() => {
  source.value = readSource()
  if (host.value && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => fit())
    ro.observe(host.value)
  }
})

onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div ref="host" class="swp">
    <div class="swp__bar">
      <button
        type="button"
        class="swp__tab"
        :class="{ 'is-on': mode === 'light' }"
        :aria-pressed="mode === 'light'"
        @click="setMode('light')"
      >
        {{ s.previewLight }}
      </button>
      <button
        type="button"
        class="swp__tab"
        :class="{ 'is-on': mode === 'dark' }"
        :aria-pressed="mode === 'dark'"
        @click="setMode('dark')"
      >
        {{ s.previewDark }}
      </button>
      <button
        type="button"
        class="swp__tab"
        :class="{ 'is-on': mode === 'auto' }"
        :aria-pressed="mode === 'auto'"
        @click="setMode('auto')"
      >
        {{ s.previewReset }}
      </button>
    </div>

    <iframe
      ref="frame"
      class="swp__frame"
      :srcdoc="source"
      :style="{ height: height + 'px' }"
      title="AICD site-wide declaration preview"
      loading="lazy"
      @load="onLoad"
    />

    <p class="swp__hint">{{ s.previewHint }}</p>
  </div>
</template>

<style scoped>
.swp {
  margin: 1.15rem 0 0;
  border: 1px solid var(--rule);
  border-radius: 2px;
  background: var(--paper-sunken);
  overflow: hidden;
}

.swp__bar {
  display: flex;
  justify-content: flex-end;
  gap: 0.2rem;
  padding: 0.42rem 0.5rem;
  border-bottom: 1px solid var(--rule);
  background: var(--paper-raised);
}

.swp__tab {
  appearance: none;
  padding: 0.26rem 0.68rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  line-height: 1.5;
  color: var(--ink-faint);
  cursor: pointer;
  transition:
    color 220ms var(--ease),
    background-color 220ms var(--ease),
    border-color 220ms var(--ease);
}

.swp__tab:hover {
  color: var(--ink);
}

.swp__tab.is-on {
  border-color: var(--rule-strong);
  background: var(--paper);
  color: var(--ink);
}

.swp__frame {
  display: block;
  width: 100%;
  border: 0;
  background: var(--paper-sunken);
}

.swp__hint {
  margin: 0;
  padding: 0.72rem 0.85rem 0.78rem;
  border-top: 1px solid var(--rule);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  line-height: 1.65;
  color: var(--ink-faint);
}

@media (max-width: 640px) {
  .swp__hint {
    font-size: 0.68rem;
  }
}
</style>
