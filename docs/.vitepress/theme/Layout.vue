<script setup lang="ts">
import { computed, nextTick, onMounted, watch, watchEffect } from 'vue'
import { inBrowser, useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import LangSwitch from './components/LangSwitch.vue'
import MobileToc from './components/MobileToc.vue'

const { Layout } = DefaultTheme
const route = useRoute()
const { frontmatter } = useData()

/* 首页只保留单屏主视觉，顶栏左侧留空；内页才挂上「AICD」标识。
   frontmatter 在 SSR 与客户端一致，因此 v-if 不会造成水合错位。 */
const isHome = computed(() => frontmatter.value.layout === 'home')

/* 首页（layout: home）锁成单屏：CSS 依据 html.is-home 关闭滚动、隐藏页脚。 */
watchEffect(() => {
  if (!inBrowser) return
  document.documentElement.classList.toggle(
    'is-home',
    frontmatter.value.layout === 'home'
  )
  /* 正文 / 等级页不要标题前的朱红方块，由 frontmatter 逐页关闭。 */
  document.documentElement.classList.toggle(
    'no-heading-mark',
    frontmatter.value.headingMark === false
  )
})

const calm = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

let timer = 0

function enter() {
  const root = document.documentElement
  root.classList.remove('route-enter')
  void root.offsetWidth
  requestAnimationFrame(() => {
    root.classList.add('route-enter')
    window.clearTimeout(timer)
    timer = window.setTimeout(() => root.classList.remove('route-enter'), 1800)
  })
}

onMounted(() => {
  if (calm()) return
  // 首屏：onMounted 早于首次绘制，直接上类不闪
  document.documentElement.classList.add('route-enter')
  timer = window.setTimeout(
    () => document.documentElement.classList.remove('route-enter'),
    1800
  )
})

watch(
  () => route.path,
  () => {
    if (calm()) return
    nextTick(enter)
  }
)
</script>

<template>
  <Layout>
    <template #layout-top>
      <!-- 移动端：右下角目录按钮（顶部那条目录已由 CSS 撤掉） -->
      <MobileToc />
    </template>

    <!-- 顶栏最右：语言切换器（地球网格）。主题自带的下拉已用 CSS 隐藏。 -->
    <template #nav-bar-content-after>
      <LangSwitch />
    </template>

    <!-- 内页顶栏左侧的「AICD」标识。
         slot 渲染在 VPNavBarTitle 的 <a class="title" href="/"> 内部，
         所以这里不套 <a>（嵌套链接非法），点击 / 中键 / 右键「新标签页打开」
         都由外层这个指向首页的链接原生承接。 -->
    <template #nav-bar-title-before>
      <span v-if="!isHome" class="nav-brand">
        <span class="nav-brand__box">
          <span class="nav-brand__col">
            <span class="nav-brand__cell">
              <span class="nav-brand__text">AICD</span>
            </span>
          </span>
          <span class="nav-brand__aside" aria-hidden="true" />
        </span>
      </span>
    </template>
  </Layout>
</template>
