<script setup lang="ts">
/**
 * 顶栏语言切换器：地球网格图标 + 三语下拉。
 *
 * 路径映射沿用 VitePress 的 i18n 规则：把当前页的相对路径从当前语言前缀下取出，
 * 再拼到目标语言前缀后面，因此切换语言会停留在「同一篇」而不是回首页。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import { STRINGS, useLocale } from '../data/i18n'

const { site, page, hash, localeIndex } = useData()
const lang = useLocale()
const s = computed(() => STRINGS[lang.value])

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const ensureSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`)

/** 当前语言的根链接，如 root → '/'，zh → '/zh/' */
const currentBase = computed(() => {
  const index = localeIndex.value
  return site.value.locales[index]?.link || (index === 'root' ? '/' : `/${index}/`)
})

/** 本篇内容在该语言下的相对路径，如 'levels'、''（首页） */
const relative = computed(() => {
  const prefix = Math.max(currentBase.value.length - 1, 0)
  return page.value.relativePath
    .slice(prefix)
    .replace(/(^|\/)index\.md$/, '$1')
    .replace(/\.md$/, '')
})

const locales = computed(() =>
  Object.entries(site.value.locales).map(([key, value]) => {
    const base =
      (value as { link?: string }).link?.replace(/\/$/, '') ?? (key === 'root' ? '' : `/${key}`)
    return {
      key,
      label: (value as { label?: string }).label ?? key,
      isCurrent: key === localeIndex.value,
      link: base + ensureSlash(relative.value) + hash.value
    }
  })
)

function close() {
  open.value = false
}

function onDocumentClick(event: MouseEvent) {
  if (!open.value) return
  if (root.value && !root.value.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="lang">
    <button
      type="button"
      class="lang__btn"
      :class="{ 'lang__btn--open': open }"
      :aria-label="s.langLabel"
      :title="s.langLabel"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg
        class="lang__globe"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.25"
        stroke-linecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="8.6" />
        <ellipse cx="12" cy="12" rx="4" ry="8.6" />
        <path d="M3.6 8.9h16.8M3.6 15.1h16.8" />
      </svg>
    </button>

    <ul v-if="open" class="lang__menu" role="menu">
      <li v-for="item in locales" :key="item.key" role="none">
        <span v-if="item.isCurrent" class="lang__item lang__item--on" role="menuitem">
          {{ item.label }}
        </span>
        <a v-else class="lang__item" role="menuitem" :href="item.link" @click="close">
          {{ item.label }}
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lang {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--vp-nav-height);
}

/* 与「外观」开关之间的竖线，和主题自身的分隔线同款 */
.lang::before {
  content: '';
  width: 1px;
  height: 24px;
  margin: 0 0.75rem 0 0.25rem;
  background: var(--vp-c-divider);
}

.lang__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: var(--ink-soft);
  background: transparent;
  border: 0;
  border-radius: 2px;
  cursor: pointer;
  transition: color 240ms var(--ease), background-color 240ms var(--ease);
}

.lang__btn:hover,
.lang__btn--open {
  color: var(--ink);
}

.lang__globe {
  width: 18px;
  height: 18px;
}

.lang__menu {
  position: absolute;
  top: calc(var(--vp-nav-height) - 10px);
  right: 0;
  z-index: 40;
  min-width: 9.5rem;
  margin: 0;
  padding: 0.3rem;
  list-style: none;
  background: var(--paper-raised);
  border: 1px solid var(--rule);
  border-radius: 3px;
  box-shadow: 0 12px 28px -18px oklch(0.2 0.02 268 / 0.55);
}

.lang__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.42rem 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
  text-decoration: none;
  border-radius: 2px;
  transition: color 200ms var(--ease), background-color 200ms var(--ease);
}

.lang__item:hover {
  color: var(--ink);
  background: var(--paper-sunken);
}

.lang__item--on {
  color: var(--seal-ink);
  cursor: default;
}

.lang__item--on::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--seal);
  flex: none;
}

@media (max-width: 767px) {
  .lang::before {
    margin: 0 0.5rem 0 0;
  }
}
</style>
