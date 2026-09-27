<script setup lang="ts">
import { computed, ref } from 'vue'
import { STRINGS, useLocale } from '../data/i18n'
import { readDisclosure, type DisclosureField, type DisclosureReport } from '../data/disclosure'
import DisclosureBadge from './DisclosureBadge.vue'

const lang = useLocale()
const s = computed(() => STRINGS[lang.value])

const input = ref('')
const report = ref<DisclosureReport | null>(null)
const error = ref('')
const copied = ref('')

/* ── 操作 ───────────────────────────────────────────────────── */

function verify() {
  if (!input.value.trim()) {
    error.value = s.value.verifierEmptyInput
    report.value = null
    return
  }
  error.value = ''
  report.value = readDisclosure(input.value, lang.value)
}

function loadSample() {
  input.value = s.value.verifierSampleHtml
  error.value = ''
  verify()
}

async function copy(text: string, which: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    document.body.removeChild(area)
  }
  copied.value = which
  window.setTimeout(() => {
    if (copied.value === which) copied.value = ''
  }, 1600)
}

/* ── 展示 ───────────────────────────────────────────────────── */

const disclosureLine = computed(() => {
  const r = report.value
  if (!r?.levelInfo) return ''
  const parts = [
    s.value.versioned(r.version || '1.0'),
    s.value.involvement(r.levelInfo.code, r.levelInfo.name)
  ]
  if (r.review !== null) parts.push(s.value.reviewPart(r.review))
  return parts.join(' · ')
})

function display(field: DisclosureField) {
  if (field.key === 'review') return field.value === 'y' ? s.value.yes : s.value.no
  if (field.key === 'level' && report.value?.levelInfo) {
    return `${field.value} — ${report.value.levelInfo.name}`
  }
  return field.value
}
</script>

<template>
  <section class="vf">
    <div class="vf__field">
      <label class="vf__label" for="vf-source">{{ s.verifierSource }}</label>
      <textarea
        id="vf-source"
        v-model="input"
        class="vf__area"
        spellcheck="false"
        :placeholder="s.verifierPlaceholder"
      />
    </div>

    <div class="vf__actions">
      <button type="button" class="vf__btn vf__btn--primary" @click="verify">
        {{ s.verifierRun }}
      </button>
      <button type="button" class="vf__btn" @click="loadSample">{{ s.verifierSample }}</button>
    </div>

    <p v-if="error" class="vf__error">{{ error }}</p>

    <div v-if="report" class="vf__result">
      <p class="vf__verdict" :class="{ 'vf__verdict--none': !report.found }">
        <i class="vf__dot" aria-hidden="true" />
        {{ report.found ? s.verifierFound : s.verifierNotFound }}
      </p>

      <p v-if="report.channels.length" class="vf__channels">
        <span v-for="c in report.channels" :key="c" class="vf__tag">{{ c }}</span>
      </p>

      <div v-if="disclosureLine" class="vf__out">
        <div class="vf__out-head">
          <span class="vf__label">{{ s.outputLine }}</span>
          <button type="button" class="vf__copy" @click="copy(disclosureLine, 'line')">
            {{ copied === 'line' ? s.copied : s.copy }}
          </button>
        </div>
        <DisclosureBadge
          :level="report.level"
          :review="report.review"
          :tool="report.tool"
          :purpose="report.purpose"
        />
      </div>

      <div v-if="report.fields.length" class="vf__out">
        <div class="vf__out-head">
          <span class="vf__label">{{ s.verifierFields }}</span>
        </div>
        <div class="vf__rows">
          <div v-for="f in report.fields" :key="f.key" class="vf__row">
            <span class="vf__row-key">{{ f.label }}</span>
            <span class="vf__row-val">
              <template v-if="f.invalid">{{ s.verifierUnreadable }}</template>
              <template v-else>{{ display(f) }}</template>
              <em v-if="f.invalid" class="vf__row-raw">{{ s.verifierRawPrefix(f.raw) }}</em>
            </span>
            <span class="vf__row-src">
              <i v-for="src in f.sources" :key="src">{{ src }}</i>
            </span>
          </div>
        </div>
      </div>

      <div v-if="report.levelInfo" class="vf__note">
        <p class="vf__note-head">
          {{ report.levelInfo.code }} — {{ report.levelInfo.name }}
        </p>
        <p class="vf__note-body">{{ report.levelInfo.definition }}</p>
      </div>

      <div v-if="report.normalized" class="vf__out">
        <div class="vf__out-head">
          <span class="vf__label">{{ s.verifierNormalized }}</span>
          <button type="button" class="vf__copy" @click="copy(report.normalized, 'json')">
            {{ copied === 'json' ? s.copied : s.copy }}
          </button>
        </div>
        <pre class="vf__json"><code>{{ report.normalized }}</code></pre>
      </div>

      <div v-if="report.issues.length" class="vf__out">
        <div class="vf__out-head">
          <span class="vf__label">{{ s.verifierIssues }}</span>
        </div>
        <ul class="vf__issues">
          <li v-for="(issue, n) in report.issues" :key="n">{{ issue }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.vf {
  display: grid;
  gap: 1.9rem;
  margin: 2.2rem 0 3rem;
}

.vf__field {
  display: grid;
  gap: 0.7rem;
}

.vf__label {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.vf__area {
  width: 100%;
  min-height: 13rem;
  resize: vertical;
  padding: 1.1rem 1.2rem;
  font-family: var(--font-mono);
  font-size: 0.88rem;
  line-height: 1.8;
  color: var(--ink-soft);
  background: var(--paper-sunken);
  border: 1px solid var(--rule);
  border-radius: 3px;
  transition: border-color 260ms var(--ease);
}

.vf__area::placeholder {
  color: var(--ink-faint);
  opacity: 0.8;
}

.vf__area:focus {
  outline: none;
  border-color: var(--seal);
}

.vf__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.vf__btn {
  font-family: var(--font-mono);
  font-size: 0.86rem;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  background: transparent;
  border: 1px solid var(--rule-strong);
  border-radius: 2px;
  padding: 0.44rem 1rem;
  cursor: pointer;
  transition: color 220ms var(--ease), border-color 220ms var(--ease),
    background-color 220ms var(--ease), transform 220ms var(--ease);
}

.vf__btn:hover {
  color: var(--ink);
  border-color: var(--ink-faint);
}

.vf__btn:active {
  transform: translateY(1px);
}

.vf__btn--primary {
  color: var(--paper);
  background: var(--seal);
  border-color: var(--seal);
}

.vf__btn--primary:hover {
  color: var(--paper);
  border-color: var(--seal-ink);
  background: var(--seal-ink);
}

.vf__error {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.86rem;
  letter-spacing: 0.04em;
  color: var(--seal-ink);
}

/* ── 结果 ───────────────────────────────────────────────────── */

.vf__result {
  display: grid;
  gap: 1.9rem;
  padding-top: 0.4rem;
}

.vf__verdict {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.86rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink);
}

.vf__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--seal);
  flex: none;
}

.vf__verdict--none {
  color: var(--ink-soft);
}

.vf__verdict--none .vf__dot {
  background: var(--rule-strong);
}

.vf__channels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: -1.2rem 0 0;
}

.vf__tag {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  border: 1px solid var(--rule);
  border-radius: 2px;
  padding: 0.16rem 0.5rem;
}

.vf__out-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.vf__copy {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
  background: transparent;
  border: 1px solid var(--rule-strong);
  border-radius: 2px;
  padding: 0.3rem 0.68rem;
  cursor: pointer;
  transition: color 220ms var(--ease), border-color 220ms var(--ease);
}

.vf__copy:hover {
  color: var(--seal-ink);
  border-color: var(--seal);
}

/* 字段明细 */

.vf__rows {
  border-top: 1px solid var(--rule);
}

.vf__row {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--rule);
}

.vf__row-key {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
}

.vf__row-val {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--ink);
  word-break: break-word;
}

.vf__row-raw {
  display: block;
  font-style: normal;
  font-size: 0.84rem;
  color: var(--ink-faint);
}

.vf__row-src {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
}

.vf__row-src i {
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  letter-spacing: 0.04em;
  color: var(--ink-faint);
  white-space: nowrap;
}

/* 等级释义 */

.vf__note {
  padding-left: 1.1rem;
  border-left: 2px solid var(--seal);
}

.vf__note-head {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.92rem;
  letter-spacing: 0.04em;
  color: var(--ink);
}

.vf__note-body {
  margin: 0.3rem 0 0;
  max-width: var(--measure);
  font-size: 1.02rem;
  line-height: 1.88;
  color: var(--ink-soft);
}

/* 归一化字段 */

.vf__json {
  margin: 0;
  padding: 1.1rem 1.2rem;
  background: var(--paper-sunken);
  border: 1px solid var(--rule);
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 0.88rem;
  line-height: 1.8;
  color: var(--ink-soft);
  overflow-x: auto;
}

/* 需要留意 */

.vf__issues {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--rule);
}

.vf__issues li {
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--rule);
  font-size: 1rem;
  line-height: 1.8;
  color: var(--ink-soft);
  word-break: break-word;
}

@media (max-width: 640px) {
  .vf__row {
    grid-template-columns: 1fr;
    gap: 0.3rem;
  }

  .vf__row-src {
    justify-content: flex-start;
  }
}
</style>
