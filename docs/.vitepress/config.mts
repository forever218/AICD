import { defineConfig } from 'vitepress'

/**
 * 四语站点。
 * 默认语言是英文（VitePress 的 root locale，路径不带前缀）；
 * 简体中文在 /zh/，繁體中文在 /zh-tw/，日本語在 /ja/。
 */

const DESCRIPTION = {
  en: 'AICD 1.0 — the AI Content Disclosure Protocol. A wholly voluntary, open, non-profit principle of AI transparency: if artificial intelligence took part in creating content, creators who follow this protocol can tell their readers so.',
  zh: 'AICD 1.0 — 人工智能内容主动披露协议。一项完全自愿、开放、非营利的 AI 内容透明原则：如果人工智能参与了内容创作，愿意遵循本协议的创作者可以主动告诉读者。',
  'zh-tw':
    'AICD 1.0 — 人工智能內容主動披露協議。一項完全自願、開放、非營利的 AI 內容透明原則：如果人工智能參與了內容創作，願意遵循本協議的創作者可以主動告訴讀者。',
  ja: 'AICD 1.0 — AIコンテンツ自主開示プロトコル。完全に任意で、開かれた、非営利の AI 透明性の原則です。人工知能がコンテンツ制作に関与した場合、本プロトコルに賛同する作り手は、その事実を読者に自主的に伝えることができます。'
}

/** 各语言共用的 head：站点自身的机器可读披露示例 */
const sharedHead: any[] = [
  ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  ['meta', { name: 'theme-color', content: '#faf8f3', media: '(prefers-color-scheme: light)' }],
  ['meta', { name: 'theme-color', content: '#1c1f26', media: '(prefers-color-scheme: dark)' }],

  ['meta', { name: 'aicd-version', content: '1.0' }],
  ['meta', { name: 'aicd-spec', content: 'AI Content Disclosure Protocol' }],
  ['meta', { name: 'aicd-level', content: 'A3' }],
  ['meta', { name: 'aicd-review', content: 'yes' }],

  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { name: 'twitter:card', content: 'summary' }]
]

const OG_LOCALE: Record<'en' | 'zh' | 'zh-tw' | 'ja', string> = {
  en: 'en_US',
  zh: 'zh_CN',
  'zh-tw': 'zh_TW',
  ja: 'ja_JP'
}

const IN_LANGUAGE: Record<'en' | 'zh' | 'zh-tw' | 'ja', string> = {
  en: 'en',
  zh: 'zh-Hans',
  'zh-tw': 'zh-Hant',
  ja: 'ja'
}

const headFor = (locale: 'en' | 'zh' | 'zh-tw' | 'ja', ogTitle: string, workName: string) => [
  ['meta', { property: 'og:title', content: ogTitle }],
  ['meta', { property: 'og:description', content: DESCRIPTION[locale] }],
  ['meta', { property: 'og:locale', content: OG_LOCALE[locale] }],
  [
    'script',
    { type: 'application/ld+json' },
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: workName,
      alternateName: 'AI Content Disclosure Protocol',
      alternateName2: 'AICD',
      version: '1.0',
      datePublished: '2026',
      inLanguage: IN_LANGUAGE[locale],
      abstract: DESCRIPTION[locale],
      keywords: 'AI disclosure, 内容披露, AICD, content transparency, AI 参与程度, AI 関与'
    })
  ]
]

export default defineConfig({
  lang: 'en-US',
  title: 'AICD',
  titleTemplate: ':title · AICD',
  description: DESCRIPTION.en,

  cleanUrls: true,
  appearance: true,
  lastUpdated: false,
  ignoreDeadLinks: false,

  markdown: {
    theme: { light: 'vitesse-light', dark: 'vitesse-dark' },
    lineNumbers: false,
    anchor: { permalink: false }
  },

  head: sharedHead,

  /* 逐页开关：frontmatter 里写 `headingMark: false` 的页面（正文、等级）
     不要标题前的朱红方块。这里把类直接写进 head 的同步脚本，
     首屏（生产构建的静态 HTML）在绘制前就带上，不会水合前后闪一下。 */
  transformPageData(pageData) {
    if (pageData.frontmatter?.headingMark === false) {
      pageData.frontmatter.head = [
        ...(pageData.frontmatter.head || []),
        ['script', {}, "document.documentElement.classList.add('no-heading-mark')"]
      ]
    }
  },

  locales: {
    /* ── English（默认） ─────────────────────────────────── */
    root: {
      label: 'English',
      lang: 'en-US',
      title: 'AICD',
      titleTemplate: ':title · AICD',
      description: DESCRIPTION.en,
      head: headFor('en', 'AI Content Disclosure Protocol · AICD 1.0', 'AI Content Disclosure Protocol'),
      themeConfig: {
        nav: [
          { text: 'Article', link: '/protocol/' },
          { text: 'Levels', link: '/levels' },
          { text: 'Adopt', link: '/adopt' },
          { text: 'Verifier', link: '/verifier' },
          { text: 'About', link: '/about' }
        ],
        outline: { level: [2, 3], label: 'On this page' },
        docFooter: { prev: 'Previous', next: 'Next' },
        returnToTopLabel: 'Return to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Appearance',
        lightModeSwitchTitle: 'Light',
        darkModeSwitchTitle: 'Dark',
        langMenuLabel: 'Change language',
        footer: {
          message:
            'The text of this site was written by its LiSR; AICD 1.0 A2',
          copyright: 'AICD · AI Content Disclosure Protocol'
        }
      }
    },

    /* ── 简体中文 ───────────────────────────────────────── */
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: 'AICD',
      titleTemplate: ':title · AICD',
      description: DESCRIPTION.zh,
      head: headFor('zh', '人工智能内容主动披露协议 · AICD 1.0', '人工智能内容主动披露协议'),
      themeConfig: {
        nav: [
          { text: '正文', link: '/zh/protocol/' },
          { text: '等级', link: '/zh/levels' },
          { text: '采用', link: '/zh/adopt' },
          { text: '验证器', link: '/zh/verifier' },
          { text: '关于', link: '/zh/about' }
        ],
        outline: { level: [2, 3], label: '本页' },
        docFooter: { prev: '上一节', next: '下一节' },
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '目录',
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '浅色',
        darkModeSwitchTitle: '深色',
        langMenuLabel: '切换语言',
        footer: {
          message:
            '本站正文由LiSR撰写 AICD 1.0 A2',
          copyright: 'AICD · 人工智能内容主动披露协议'
        }
      }
    },

    /* ── 繁體中文 ───────────────────────────────────────── */
    'zh-tw': {
      label: '繁體中文',
      lang: 'zh-TW',
      link: '/zh-tw/',
      title: 'AICD',
      titleTemplate: ':title · AICD',
      description: DESCRIPTION['zh-tw'],
      head: headFor('zh-tw', '人工智能內容主動披露協議 · AICD 1.0', '人工智能內容主動披露協議'),
      themeConfig: {
        nav: [
          { text: '正文', link: '/zh-tw/protocol/' },
          { text: '等級', link: '/zh-tw/levels' },
          { text: '採用', link: '/zh-tw/adopt' },
          { text: '驗證器', link: '/zh-tw/verifier' },
          { text: '關於', link: '/zh-tw/about' }
        ],
        outline: { level: [2, 3], label: '本頁' },
        docFooter: { prev: '上一節', next: '下一節' },
        returnToTopLabel: '回到頂部',
        sidebarMenuLabel: '目錄',
        darkModeSwitchLabel: '外觀',
        lightModeSwitchTitle: '淺色',
        darkModeSwitchTitle: '深色',
        langMenuLabel: '切換語言',
        footer: {
          message:
            '本站正文由LiSR撰寫 AICD 1.0 A2',
          copyright: 'AICD · 人工智能內容主動披露協議'
        }
      }
    },

    /* ── 日本語 ─────────────────────────────────────────── */
    ja: {
      label: '日本語',
      lang: 'ja-JP',
      link: '/ja/',
      title: 'AICD',
      titleTemplate: ':title · AICD',
      description: DESCRIPTION.ja,
      head: headFor('ja', 'AIコンテンツ自主開示プロトコル · AICD 1.0', 'AIコンテンツ自主開示プロトコル'),
      themeConfig: {
        nav: [
          { text: '本文', link: '/ja/protocol/' },
          { text: 'レベル', link: '/ja/levels' },
          { text: '採用', link: '/ja/adopt' },
          { text: '検証', link: '/ja/verifier' },
          { text: 'AICDについて', link: '/ja/about' }
        ],
        outline: { level: [2, 3], label: 'このページ' },
        docFooter: { prev: '前へ', next: '次へ' },
        returnToTopLabel: 'トップへ戻る',
        sidebarMenuLabel: 'メニュー',
        darkModeSwitchLabel: '外観',
        lightModeSwitchTitle: 'ライト',
        darkModeSwitchTitle: 'ダーク',
        langMenuLabel: '言語を切り替える',
        footer: {
          message:
            '本サイトの本文は LiSR が執筆 AICD 1.0 A2',
          copyright: 'AICD · AIコンテンツ自主開示プロトコル'
        }
      }
    }
  },

  themeConfig: {
    // 顶栏左侧：首页留空，内页由 Layout.vue 挂上自绘的「AICD」标识
    siteTitle: false,
    logo: undefined,

    sidebar: false,
    socialLinks: []
  }
})
