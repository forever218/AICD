import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

// ── 字体 ────────────────────────────────────────────────────────────
// 拉丁：Newsreader（可变衬线，正文字体） · 中文：Noto Serif SC · 标签：IBM Plex Mono
import '@fontsource-variable/newsreader'
import '@fontsource-variable/newsreader/wght-italic.css'
import '@fontsource/noto-serif-sc/400.css'
import '@fontsource/noto-serif-sc/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

// ── 样式 ────────────────────────────────────────────────────────────
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

// ── 主题 ────────────────────────────────────────────────────────────
import AicdLayout from './Layout.vue'
import AicdMark from './components/AicdMark.vue'
import HomeScene from './components/HomeScene.vue'
import LevelScale from './components/LevelScale.vue'
import LevelReference from './components/LevelReference.vue'
import DisclosureBadge from './components/DisclosureBadge.vue'
import BadgeBuilder from './components/BadgeBuilder.vue'
import Verifier from './components/Verifier.vue'
import LangSwitch from './components/LangSwitch.vue'
import AboutAvatars from './components/AboutAvatars.vue'

export default {
  extends: DefaultTheme,
  Layout: AicdLayout,
  enhanceApp({ app }) {
    app.component('AicdMark', AicdMark)
    app.component('HomeScene', HomeScene)
    app.component('LevelScale', LevelScale)
    app.component('LevelReference', LevelReference)
    app.component('DisclosureBadge', DisclosureBadge)
    app.component('BadgeBuilder', BadgeBuilder)
    app.component('Verifier', Verifier)
    app.component('LangSwitch', LangSwitch)
    app.component('AboutAvatars', AboutAvatars)
  }
} satisfies Theme
