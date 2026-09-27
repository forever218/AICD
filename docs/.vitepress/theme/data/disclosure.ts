/**
 * AICD · 声明读取器
 *
 * 按「采用」页给出的四种载体读取 AICD 字段：
 *   1. HTML Metadata —— <meta name="aicd-level" content="A3" />
 *   2. JSON / JSON-LD —— { "aicd": "1.0", "level": "A3", "review": true }
 *   3. HTTP Header 形式 —— AICD: 1.0; level=A3; review=yes
 *   4. 面向读者的可见声明 —— AICD 1.0 · AI 参与：A3（AI 部分生成）· 人工审核：是
 *
 * 识别规则本身是跨语言的（中英繁的字段名都会认）；
 * 只有输出给读者看的措辞跟随 language。
 */

import { STRINGS, type LocaleKey, type UiStrings } from './i18n'
import { levelByCode, type ParticipationLevel } from './levels'

export type FieldKey = 'version' | 'level' | 'review' | 'tool' | 'purpose'

export const FIELD_ORDER: FieldKey[] = ['version', 'level', 'review', 'tool', 'purpose']

/** 内部载体标识，展示时再本地化 */
export type Channel = 'meta' | 'json' | 'jsonld' | 'header' | 'visible' | 'jsonInput'

export interface DisclosureHit {
  key: FieldKey
  /** 原文值 */
  raw: string
  channel: Channel
}

export interface DisclosureField {
  key: FieldKey
  label: string
  /** 归一化取值：A3 / 1.0 / y / n / 自由文本 */
  value: string
  /** 首个命中的原文 */
  raw: string
  /** 所有命中的原文都无法归一化 */
  invalid: boolean
  /** 去重后的载体名（已本地化） */
  sources: string[]
  /** 不同载体取值不一致时的全部取值 */
  conflict: string[] | null
  /** 某个载体里读到了字段名却读不懂取值 */
  unreadable: Array<{ source: string; raw: string }>
}

export interface DisclosureReport {
  found: boolean
  fields: DisclosureField[]
  channels: string[]
  issues: string[]
  version: string
  level: string
  review: boolean | null
  tool: string
  purpose: string
  levelInfo: ParticipationLevel | null
  /** 归一化后的机器可读字段 */
  normalized: string
}

/* ── 字段名 ─────────────────────────────────────────────────── */

/** 别名 → 规范键名。`aicd-` 前缀由 stripPrefix 处理，这里只写裸名。 */
const ALIASES: Record<string, FieldKey> = {
  version: 'version',
  ver: 'version',
  版本: 'version',
  level: 'level',
  participation: 'level',
  等级: 'level',
  等級: 'level',
  参与程度: 'level',
  參與程度: 'level',
  参与: 'level',
  參與: 'level',
  review: 'review',
  reviewed: 'review',
  审核: 'review',
  審核: 'review',
  人工审核: 'review',
  人工審核: 'review',
  tool: 'tool',
  tools: 'tool',
  model: 'tool',
  工具: 'tool',
  模型: 'tool',
  purpose: 'purpose',
  use: 'purpose',
  usage: 'purpose',
  用途: 'purpose'
}

const stripPrefix = (name: string) => name.trim().toLowerCase().replace(/^aicd[\s\-_:.]*/, '')

/** 解析字段名；无法识别返回 null */
function splitKey(raw: string): FieldKey | null {
  const name = raw.trim().toLowerCase()
  if (!name) return null
  if (name === 'aicd') return 'version'
  return ALIASES[stripPrefix(name)] ?? null
}

/** 是否带 aicd 前缀（只有带前缀的裸字段可以脱离上下文单独成立） */
function isQualified(raw: string): boolean {
  const name = raw.trim().toLowerCase()
  return name === 'aicd' || /^aicd[\s\-_:.]/.test(name) || /^aicd[a-z]/.test(name)
}

/* ── 取值归一化 ─────────────────────────────────────────────── */

const CUT_WORDS =
  /(?:用途|purpose|人工审核|人工審核|human\s*review|AI\s*参与|AI\s*參與|AI\s*involvement|AI\s*工具|AI\s*tool|AI\s*Disclosure)\s*[:：]/

/** 可见声明里的自由文本：去掉尾随标点，以及被顺带吞进来的后续标签 */
function cleanText(text: string): string {
  return text
    .replace(new RegExp(`\\s*${CUT_WORDS.source}[\\s\\S]*$`, 'i'), '')
    .replace(/[\s。.;；,，、]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalize(key: FieldKey, raw: string): string {
  const text = raw.trim()
  switch (key) {
    case 'version': {
      const m = text.match(/\d+(?:\.\d+)*/)
      return m ? m[0] : ''
    }
    case 'level': {
      const m = text.toUpperCase().match(/A\s*([0-5])(?![0-9])/)
      return m ? `A${m[1]}` : ''
    }
    case 'review': {
      const v = text.toLowerCase().replace(/[\s。.．]+/g, '')
      if (['yes', 'y', 'true', '1', '是', '有'].includes(v)) return 'y'
      if (['no', 'n', 'false', '0', '否', '无', '沒有', '没有'].includes(v)) return 'n'
      return ''
    }
    default:
      return cleanText(text)
  }
}

/* ── 载体一：HTML Metadata ──────────────────────────────────── */

function readAttrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(tag))) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
  return out
}

function readMeta(html: string, hits: DisclosureHit[]) {
  const tags = html.match(/<meta\b[^>]*>/gi)
  if (!tags) return
  for (const tag of tags) {
    const attrs = readAttrs(tag)
    const name = attrs.name ?? attrs.property ?? attrs.itemprop ?? ''
    const content = (attrs.content ?? '').trim()
    if (!content) continue

    // <meta http-equiv="AICD" content="1.0; level=A3; review=yes" />
    if (/^aicd$/i.test(name) || /^aicd$/i.test(attrs['http-equiv'] ?? '')) {
      readHeaderForm(content, 'header', hits)
      continue
    }

    if (!isQualified(name)) continue
    const key = splitKey(name)
    if (key) hits.push({ key, raw: content, channel: 'meta' })
  }
}

/* ── 载体二：HTTP Header 形式 ───────────────────────────────── */

function readHeaderForm(text: string, channel: Channel, hits: DisclosureHit[]) {
  // 源码里以注释或纯文本写出的响应头，如 <!-- AICD: 1.0; level=A3; review=yes -->
  const re = /\bAICD\s*:\s*([^\r\n<"]+)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const body = m[1]
      .replace(/-{2,}>\s*$/, '')
      .replace(/\|[\s\S]*$/, '')
      .trim()
    for (const segment of body.split(';')) {
      const piece = segment.trim()
      if (!piece) continue
      const eq = Math.max(piece.indexOf('='), piece.indexOf('：'), piece.indexOf(':'))
      if (eq < 0) {
        if (/^\d+(?:\.\d+)*$/.test(piece)) hits.push({ key: 'version', raw: piece, channel })
        continue
      }
      const key = splitKey(piece.slice(0, eq))
      const value = piece.slice(eq + 1).trim()
      if (key && value) hits.push({ key, raw: value, channel })
    }
  }
}

/* ── 载体三：JSON / JSON-LD ─────────────────────────────────── */

/**
 * 递归找 AICD 字段块。
 * 裸字段（level / review / tool …）只有在同一对象里出现 aicd 前缀字段，
 * 或 @type 指向 AICD 时才认；否则页面自身的普通 version 字段会被误读成声明。
 */
function walkJson(node: unknown, channel: Channel, hits: DisclosureHit[], depth = 0) {
  if (!node || typeof node !== 'object' || depth > 5) return
  if (Array.isArray(node)) {
    for (const item of node) walkJson(item, channel, hits, depth + 1)
    return
  }
  const record = node as Record<string, unknown>
  const keys = Object.keys(record)
  const isBlock =
    keys.some((k) => isQualified(k)) ||
    keys.some(
      (k) =>
        /^@?type$/i.test(k) && typeof record[k] === 'string' && /aicd/i.test(record[k] as string)
    )

  for (const k of keys) {
    const v = record[k]
    if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') continue
    const key = splitKey(k)
    if (!key) continue
    if (!isQualified(k) && !isBlock) continue
    hits.push({ key, raw: String(v), channel })
  }

  for (const k of keys) walkJson(record[k], channel, hits, depth + 1)
}

interface ReadFlags {
  brokenJson: boolean
}

function readScripts(text: string, hits: DisclosureHit[], flags: ReadFlags) {
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const type = (readAttrs(m[1]).type ?? '').trim().toLowerCase()
    if (!/^(?:application|text)\/(?:ld\+json|json)$/.test(type)) continue
    const channel: Channel = type.includes('ld+json') ? 'jsonld' : 'json'
    try {
      walkJson(JSON.parse(m[2].trim()), channel, hits)
    } catch {
      flags.brokenJson = true
    }
  }
}

/* ── 载体四：面向读者的可见声明 ─────────────────────────────── */

/* 三个语种的写法都要认 */
const VISIBLE_LEVEL = [
  /AI\s*(?:参与|參與|involvement)\s*[:：]\s*(A\s*[0-5])/i,
  /AI\s*Disclosure\s*[:：]\s*(A\s*[0-5])/i
]
const VISIBLE_VERSION = /AICD\s+(\d+(?:\.\d+)*)/i
const VISIBLE_REVIEW =
  /(?:人工审核|人工審核|human\s*review)\s*[:：]\s*(是|否|yes|no|true|false|没有|沒有)/i
const VISIBLE_TOOL = /AI\s*(?:工具|tool)\s*[:：]\s*([^\r\n<>·|]{1,120})/i
const VISIBLE_PURPOSE = /(?:^|[\s>·|])(?:用途|purpose)\s*[:：]\s*([^\r\n<>·|]{1,120})/i

function readVisible(text: string, hits: DisclosureHit[]) {
  // 只保留“真正看得见”的文字：剔除 script / style / 注释 / 标签
  const plain = text
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&(?:middot|#183|#xB7);/gi, '·')
    .replace(/&amp;/gi, '&')

  let level: RegExpExecArray | null = null
  for (const re of VISIBLE_LEVEL) {
    level = re.exec(plain)
    if (level) break
  }
  if (level) {
    hits.push({ key: 'level', raw: level[1], channel: 'visible' })
    const version = VISIBLE_VERSION.exec(plain)
    if (version) hits.push({ key: 'version', raw: version[1], channel: 'visible' })
  }

  const review = VISIBLE_REVIEW.exec(plain)
  if (review) hits.push({ key: 'review', raw: review[1], channel: 'visible' })

  const tool = VISIBLE_TOOL.exec(plain)
  if (tool) hits.push({ key: 'tool', raw: tool[1], channel: 'visible' })

  const purpose = VISIBLE_PURPOSE.exec(plain)
  if (purpose) hits.push({ key: 'purpose', raw: purpose[1], channel: 'visible' })
}

/* ── 主流程 ─────────────────────────────────────────────────── */

export function readDisclosure(source: string, lang: LocaleKey = 'root'): DisclosureReport {
  const s: UiStrings = STRINGS[lang] ?? STRINGS.root
  const hits: DisclosureHit[] = []
  const issues: string[] = []
  const flags: ReadFlags = { brokenJson: false }

  readMeta(source, hits)
  readScripts(source, hits, flags)
  readHeaderForm(source, 'header', hits)
  readVisible(source, hits)

  // 允许直接粘贴一段 JSON
  const trimmed = source.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      walkJson(JSON.parse(trimmed), 'jsonInput', hits)
    } catch {
      /* 不是完整 JSON，忽略 */
    }
  }

  // 同一载体、同一原文只计一次
  const seen = new Set<string>()
  const unique = hits.filter((h) => {
    const id = `${h.key}\u0000${h.raw.trim()}\u0000${h.channel}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })

  const byKey = new Map<FieldKey, DisclosureHit[]>()
  for (const h of unique) {
    const list = byKey.get(h.key) ?? []
    list.push(h)
    byKey.set(h.key, list)
  }

  const name = (channel: Channel) => s.channels[channel]

  const pick = (key: FieldKey) => {
    for (const h of byKey.get(key) ?? []) {
      const value = normalize(key, h.raw)
      if (value) return value
    }
    return ''
  }

  const version = pick('version')
  const level = pick('level')
  const reviewText = pick('review')
  const review = reviewText === 'y' ? true : reviewText === 'n' ? false : null
  const tool = pick('tool')
  const purpose = pick('purpose')

  const fields: DisclosureField[] = []
  for (const key of FIELD_ORDER) {
    const own = byKey.get(key)
    if (!own?.length) continue
    const values = own.map((h) => normalize(key, h.raw)).filter(Boolean)
    const distinct = [...new Set(values)]
    fields.push({
      key,
      label: s.fieldLabels[key],
      value: distinct[0] ?? '',
      raw: own[0].raw.trim(),
      invalid: distinct.length === 0,
      sources: [...new Set(own.map((h) => name(h.channel)))],
      conflict: distinct.length > 1 ? distinct : null,
      unreadable: own
        .filter((h) => !normalize(key, h.raw))
        .map((h) => ({ source: name(h.channel), raw: h.raw.trim() }))
    })
  }

  const channels = [...new Set(unique.map((h) => name(h.channel)))]
  const channelIds = [...new Set(unique.map((h) => h.channel))]
  const found = fields.length > 0

  if (!found) {
    issues.push(s.issue.none)
  } else {
    for (const f of fields) {
      for (const u of f.unreadable) {
        issues.push(s.issue.unreadable(f.label, u.source, u.raw))
      }
      if (f.conflict) {
        issues.push(s.issue.conflict(f.label, f.conflict.join(' / ')))
      }
    }

    if (!byKey.has('level')) issues.push(s.issue.noLevel)
    if (!byKey.has('review')) issues.push(s.issue.noReview)
    if (!byKey.has('version')) {
      issues.push(s.issue.noVersion)
    } else if (version && version !== '1.0') {
      issues.push(s.issue.versionMismatch(version))
    }

    if (channelIds.length === 1 && channelIds[0] === 'visible') {
      issues.push(s.issue.onlyVisible)
    }
    if (channelIds.includes('header')) {
      issues.push(s.issue.headerForm)
    }
  }

  if (flags.brokenJson) issues.push(s.issue.brokenJson)

  const payload: Record<string, unknown> = {}
  if (version) payload.aicd = version
  if (level) payload.level = level
  if (review !== null) payload.review = review
  if (tool) payload.tool = tool
  if (purpose) payload.purpose = purpose

  return {
    found,
    fields,
    channels,
    issues,
    version,
    level,
    review,
    tool,
    purpose,
    levelInfo: level ? levelByCode(level, lang) : null,
    normalized: Object.keys(payload).length ? JSON.stringify(payload, null, 2) : ''
  }
}
