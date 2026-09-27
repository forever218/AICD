/**
 * AICD · 站点文案
 *
 * 三个语言：root（English，默认）、zh（简体中文）、zh-tw（繁體中文）。
 * 组件的可见文字一律从这里取，不再散落在模板里。
 */

import { computed } from 'vue'
import { useData } from 'vitepress'

export type LocaleKey = 'root' | 'zh' | 'zh-tw'

export const LOCALE_KEYS: LocaleKey[] = ['root', 'zh', 'zh-tw']

export function asLocaleKey(value: string | undefined): LocaleKey {
  return LOCALE_KEYS.includes(value as LocaleKey) ? (value as LocaleKey) : 'root'
}

/** 当前语言；只能在 setup 中调用 */
export function useLocale() {
  const { localeIndex } = useData()
  return computed(() => asLocaleKey(localeIndex.value))
}

export interface UiStrings {
  /** 语言切换器的无障碍名称 */
  langLabel: string

  /* ── 首页 ─────────────────────────────────────────────── */
  homeLatin: string
  motto: [string, string]

  /* ── 披露行 ───────────────────────────────────────────── */
  versioned: (version: string) => string
  involvement: (code: string, name: string) => string
  reviewPart: (yes: boolean) => string
  toolPart: (tool: string) => string
  purposePart: (purpose: string) => string
  compactLevel: (code: string) => string
  yes: string
  no: string

  /* ── 生成器 ───────────────────────────────────────────── */
  builderLevel: string
  builderReview: string
  builderTool: string
  builderPurpose: string
  builderOptional: string
  placeholderTool: string
  placeholderPurpose: string
  outputLine: string
  outputCompact: string
  outputJson: string
  copy: string
  copied: string

  /* ── 验证器 ───────────────────────────────────────────── */
  verifierSource: string
  verifierPlaceholder: string
  verifierRun: string
  verifierSample: string
  verifierSampleHtml: string
  verifierEmptyInput: string
  verifierFound: string
  verifierNotFound: string
  verifierFields: string
  verifierNormalized: string
  verifierIssues: string
  verifierUnreadable: string
  verifierRawPrefix: (raw: string) => string
  fieldLabels: {
    version: string
    level: string
    review: string
    tool: string
    purpose: string
  }
  channels: {
    meta: string
    json: string
    jsonld: string
    header: string
    visible: string
    jsonInput: string
  }
  issue: {
    none: string
    unreadable: (label: string, source: string, raw: string) => string
    conflict: (label: string, values: string) => string
    noLevel: string
    noReview: string
    noVersion: string
    versionMismatch: (version: string) => string
    onlyVisible: string
    headerForm: string
    brokenJson: string
  }
}

/* ── English（默认） ───────────────────────────────────────── */

const en: UiStrings = {
  langLabel: 'Change language',

  homeLatin: 'AI Content Disclosure Initiative',
  motto: ['Create freely', 'Disclose voluntarily'],

  versioned: (version) => `AICD ${version}`,
  involvement: (code, name) => `AI involvement: ${code} (${name})`,
  reviewPart: (yes) => `Human review: ${yes ? 'Yes' : 'No'}`,
  toolPart: (tool) => `AI tool: ${tool}`,
  purposePart: (purpose) => `Purpose: ${purpose}`,
  compactLevel: (code) => `AI Disclosure: ${code}`,
  yes: 'Yes',
  no: 'No',

  builderLevel: 'AI involvement',
  builderReview: 'Human review',
  builderTool: 'AI tool',
  builderPurpose: 'Purpose',
  builderOptional: '(optional)',
  placeholderTool: 'e.g. a generative AI model',
  placeholderPurpose: 'e.g. language polishing and restructuring',
  outputLine: 'Standard disclosure line',
  outputCompact: 'Minimal line',
  outputJson: 'Machine-readable fields',
  copy: 'Copy',
  copied: 'Copied',

  verifierSource: 'Source',
  verifierPlaceholder: 'Paste HTML source containing an AICD statement',
  verifierRun: 'Verify',
  verifierSample: 'Load example',
  verifierSampleHtml: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>An article</title>

    <!-- AICD: 1.0; level=A3; review=yes -->

    <meta name="aicd-version" content="1.0" />
    <meta name="aicd-level" content="A3" />
    <meta name="aicd-review" content="yes" />

    <script type="application/ld+json">
      {
        "aicd": "1.0",
        "level": "A3",
        "review": true,
        "tool": "a generative AI model",
        "purpose": "language polishing and restructuring"
      }
    <\/script>
  </head>
  <body>
    <article>
      <h1>An article</h1>
      <p>Body text…</p>

      <p>AICD 1.0 · AI involvement: A3 (Partially AI-generated) · Human review: Yes</p>
      <p>AI tool: a generative AI model</p>
      <p>Purpose: language polishing and restructuring</p>
    </article>
  </body>
</html>
`,
  verifierEmptyInput: 'Paste some source first.',
  verifierFound: 'AICD statement found',
  verifierNotFound: 'No AICD statement found',
  verifierFields: 'Fields',
  verifierNormalized: 'Normalized fields',
  verifierIssues: 'Worth checking',
  verifierUnreadable: 'Not readable',
  verifierRawPrefix: (raw) => `raw: ${raw}`,
  fieldLabels: {
    version: 'Version',
    level: 'AI involvement',
    review: 'Human review',
    tool: 'AI tool',
    purpose: 'Purpose'
  },
  channels: {
    meta: 'HTML Meta',
    json: 'JSON',
    jsonld: 'JSON-LD',
    header: 'HTTP header form',
    visible: 'Visible statement',
    jsonInput: 'JSON input'
  },
  issue: {
    none: 'No AICD field was found in the source.',
    unreadable: (label, source, raw) =>
      `“${label}” in ${source} could not be read: “${raw}”.`,
    conflict: (label, values) =>
      `“${label}” differs between carriers: ${values}.`,
    noLevel: 'AI involvement (aicd-level) is not declared.',
    noReview: 'Whether the content was human-reviewed (aicd-review) is not declared.',
    noVersion: 'The AICD version (aicd-version) is not declared.',
    versionMismatch: (version) =>
      `Version “${version}” does not match the released 1.0.`,
    onlyVisible: 'Only a reader-facing statement was found; machine-readable fields are missing.',
    headerForm:
      'A header-style statement appears in the source, but only the source text can be read here; check the actual response header with curl -I.',
    brokenJson: 'An application/ld+json block was found, but its content is not valid JSON.'
  }
}

/* ── 简体中文 ─────────────────────────────────────────────── */

const zh: UiStrings = {
  langLabel: '切换语言',

  homeLatin: '人工智能内容主动披露倡议',
  motto: ['Create freely', 'Disclose voluntarily'],

  versioned: (version) => `AICD ${version}`,
  involvement: (code, name) => `AI 参与：${code}（${name}）`,
  reviewPart: (yes) => `人工审核：${yes ? '是' : '否'}`,
  toolPart: (tool) => `AI 工具：${tool}`,
  purposePart: (purpose) => `用途：${purpose}`,
  compactLevel: (code) => `AI Disclosure: ${code}`,
  yes: '是',
  no: '否',

  builderLevel: 'AI 参与',
  builderReview: '人工审核',
  builderTool: 'AI 工具',
  builderPurpose: '用途',
  builderOptional: '（可选）',
  placeholderTool: '例如：某生成式 AI 模型',
  placeholderPurpose: '例如：语言润色与结构调整',
  outputLine: '标准披露行',
  outputCompact: '极简披露行',
  outputJson: '机器可读字段',
  copy: '复制',
  copied: '已复制',

  verifierSource: '源码',
  verifierPlaceholder: '粘贴包含 AICD 声明的 HTML 源码',
  verifierRun: '验证声明',
  verifierSample: '载入示例',
  verifierSampleHtml: `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>某篇文章</title>

    <!-- AICD: 1.0; level=A3; review=yes -->

    <meta name="aicd-version" content="1.0" />
    <meta name="aicd-level" content="A3" />
    <meta name="aicd-review" content="yes" />

    <script type="application/ld+json">
      {
        "aicd": "1.0",
        "level": "A3",
        "review": true,
        "tool": "某生成式 AI 模型",
        "purpose": "语言润色与结构调整"
      }
    <\/script>
  </head>
  <body>
    <article>
      <h1>某篇文章</h1>
      <p>正文内容……</p>

      <p>AICD 1.0 · AI 参与：A3（AI 部分生成）· 人工审核：是</p>
      <p>AI 工具：某生成式 AI 模型</p>
      <p>用途：语言润色与结构调整</p>
    </article>
  </body>
</html>
`,
  verifierEmptyInput: '请先粘贴需要验证的源码。',
  verifierFound: '已发现 AICD 声明',
  verifierNotFound: '未发现 AICD 声明',
  verifierFields: '字段明细',
  verifierNormalized: '归一化字段',
  verifierIssues: '需要留意',
  verifierUnreadable: '无法识别',
  verifierRawPrefix: (raw) => `原文：${raw}`,
  fieldLabels: {
    version: '版本',
    level: 'AI 参与程度',
    review: '人工审核',
    tool: 'AI 工具',
    purpose: '用途'
  },
  channels: {
    meta: 'HTML Meta',
    json: 'JSON',
    jsonld: 'JSON-LD',
    header: 'HTTP Header 形式',
    visible: '可见声明',
    jsonInput: 'JSON 输入'
  },
  issue: {
    none: '源码中没有找到任何 AICD 声明字段。',
    unreadable: (label, source, raw) => `「${label}」在 ${source} 中的取值无法识别：「${raw}」。`,
    conflict: (label, values) => `「${label}」在不同载体中取值不一致：${values}。`,
    noLevel: '没有声明 AI 参与程度（aicd-level）。',
    noReview: '没有声明是否经过人工审核（aicd-review）。',
    noVersion: '没有声明 AICD 版本（aicd-version）。',
    versionMismatch: (version) => `版本「${version}」与当前发布的 1.0 不一致。`,
    onlyVisible: '只有面向读者的可见声明，缺少机器可读字段。',
    headerForm:
      '源码中出现了响应头写法的声明，但此处只能读到源码文本；实际响应头请用 curl -I 之类的方式核对。',
    brokenJson: '发现 application/ld+json 区块，但内容不是合法 JSON。'
  }
}

/* ── 繁體中文 ─────────────────────────────────────────────── */

const zhTw: UiStrings = {
  langLabel: '切換語言',

  homeLatin: '人工智能內容主動披露倡議',
  motto: ['Create freely', 'Disclose voluntarily'],

  versioned: (version) => `AICD ${version}`,
  involvement: (code, name) => `AI 參與：${code}（${name}）`,
  reviewPart: (yes) => `人工審核：${yes ? '是' : '否'}`,
  toolPart: (tool) => `AI 工具：${tool}`,
  purposePart: (purpose) => `用途：${purpose}`,
  compactLevel: (code) => `AI Disclosure: ${code}`,
  yes: '是',
  no: '否',

  builderLevel: 'AI 參與',
  builderReview: '人工審核',
  builderTool: 'AI 工具',
  builderPurpose: '用途',
  builderOptional: '（可選）',
  placeholderTool: '例如：某生成式 AI 模型',
  placeholderPurpose: '例如：語言潤飾與結構調整',
  outputLine: '標準披露行',
  outputCompact: '極簡披露行',
  outputJson: '機器可讀欄位',
  copy: '複製',
  copied: '已複製',

  verifierSource: '原始碼',
  verifierPlaceholder: '貼上包含 AICD 宣告的 HTML 原始碼',
  verifierRun: '驗證宣告',
  verifierSample: '載入範例',
  verifierSampleHtml: `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <title>某篇文章</title>

    <!-- AICD: 1.0; level=A3; review=yes -->

    <meta name="aicd-version" content="1.0" />
    <meta name="aicd-level" content="A3" />
    <meta name="aicd-review" content="yes" />

    <script type="application/ld+json">
      {
        "aicd": "1.0",
        "level": "A3",
        "review": true,
        "tool": "某生成式 AI 模型",
        "purpose": "語言潤飾與結構調整"
      }
    <\/script>
  </head>
  <body>
    <article>
      <h1>某篇文章</h1>
      <p>正文內容……</p>

      <p>AICD 1.0 · AI 參與：A3（AI 部分生成）· 人工審核：是</p>
      <p>AI 工具：某生成式 AI 模型</p>
      <p>用途：語言潤飾與結構調整</p>
    </article>
  </body>
</html>
`,
  verifierEmptyInput: '請先貼上需要驗證的原始碼。',
  verifierFound: '已發現 AICD 宣告',
  verifierNotFound: '未發現 AICD 宣告',
  verifierFields: '欄位明細',
  verifierNormalized: '正規化欄位',
  verifierIssues: '需要留意',
  verifierUnreadable: '無法辨識',
  verifierRawPrefix: (raw) => `原文：${raw}`,
  fieldLabels: {
    version: '版本',
    level: 'AI 參與程度',
    review: '人工審核',
    tool: 'AI 工具',
    purpose: '用途'
  },
  channels: {
    meta: 'HTML Meta',
    json: 'JSON',
    jsonld: 'JSON-LD',
    header: 'HTTP Header 形式',
    visible: '可見宣告',
    jsonInput: 'JSON 輸入'
  },
  issue: {
    none: '原始碼中沒有找到任何 AICD 宣告欄位。',
    unreadable: (label, source, raw) => `「${label}」在 ${source} 中的取值無法辨識：「${raw}」。`,
    conflict: (label, values) => `「${label}」在不同載體中取值不一致：${values}。`,
    noLevel: '沒有宣告 AI 參與程度（aicd-level）。',
    noReview: '沒有宣告是否經過人工審核（aicd-review）。',
    noVersion: '沒有宣告 AICD 版本（aicd-version）。',
    versionMismatch: (version) => `版本「${version}」與目前發布的 1.0 不一致。`,
    onlyVisible: '只有面向讀者的可見宣告，缺少機器可讀欄位。',
    headerForm:
      '原始碼中出現了回應標頭寫法的宣告，但此處只能讀到原始碼文字；實際回應標頭請用 curl -I 之類的方式核對。',
    brokenJson: '發現 application/ld+json 區塊，但內容不是合法 JSON。'
  }
}

export const STRINGS: Record<LocaleKey, UiStrings> = {
  root: en,
  zh,
  'zh-tw': zhTw
}
