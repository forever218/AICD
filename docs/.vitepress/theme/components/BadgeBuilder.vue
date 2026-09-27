<script setup lang="ts">
import { computed, ref } from 'vue'
import { STRINGS, useLocale } from '../data/i18n'
import { levelByCode, levelsFor } from '../data/levels'
import DisclosureBadge from './DisclosureBadge.vue'

const lang = useLocale()
const s = computed(() => STRINGS[lang.value])
const levelList = computed(() => levelsFor(lang.value))

const level = ref('A2')
const review = ref(true)
const tool = ref('')
const purpose = ref('')

const info = computed(() => levelByCode(level.value, lang.value))

const line = computed(() => {
  const parts = [s.value.versioned('1.0'), s.value.involvement(info.value.code, info.value.name)]
  parts.push(s.value.reviewPart(review.value))
  return parts.join(' · ')
})

/* 极简披露行：只有版本与参与程度，随上面的选择实时变化 */
const compact = computed(() => `${s.value.versioned('1.0')} ${info.value.code}`)

const json = computed(() => {
  const payload: Record<string, unknown> = {
    aicd: '1.0',
    level: info.value.code,
    review: review.value
  }
  if (tool.value.trim()) payload.tool = tool.value.trim()
  if (purpose.value.trim()) payload.purpose = purpose.value.trim()
  return JSON.stringify(payload, null, 2)
})

const copied = ref<'' | 'line' | 'compact' | 'json'>('')

async function copy(text: string, which: 'line' | 'compact' | 'json') {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = which
  window.setTimeout(() => {
    if (copied.value === which) copied.value = ''
  }, 1600)
}
</script>

<template>
  <section class="builder">
    <div class="builder__field">
      <span class="builder__label">{{ s.builderLevel }}</span>
      <div class="chips">
        <button
          v-for="l in levelList"
          :key="l.code"
          type="button"
          class="chip"
          :class="{ 'chip--on': l.code === level }"
          :aria-pressed="l.code === level"
          @click="level = l.code"
        >
          {{ l.code }}
        </button>
      </div>
    </div>

    <div class="builder__field">
      <span class="builder__label">{{ s.builderReview }}</span>
      <div class="chips">
        <button
          type="button"
          class="chip"
          :class="{ 'chip--on': review }"
          :aria-pressed="review"
          @click="review = true"
        >
          {{ s.yes }}
        </button>
        <button
          type="button"
          class="chip"
          :class="{ 'chip--on': !review }"
          :aria-pressed="!review"
          @click="review = false"
        >
          {{ s.no }}
        </button>
      </div>
    </div>

    <div class="builder__field builder__field--inputs">
      <label class="builder__input">
        <span class="builder__label">{{ s.builderTool }}<i>{{ s.builderOptional }}</i></span>
        <input v-model="tool" type="text" :placeholder="s.placeholderTool" />
      </label>
      <label class="builder__input">
        <span class="builder__label">{{ s.builderPurpose }}<i>{{ s.builderOptional }}</i></span>
        <input v-model="purpose" type="text" :placeholder="s.placeholderPurpose" />
      </label>
    </div>

    <div class="builder__out">
      <div class="builder__out-head">
        <span class="builder__label">{{ s.outputLine }}</span>
        <button type="button" class="copy" @click="copy(line, 'line')">
          {{ copied === 'line' ? s.copied : s.copy }}
        </button>
      </div>
      <div class="builder__code">
        <DisclosureBadge :level="level" :review="review" :tool="tool" :purpose="purpose" />
      </div>
    </div>

    <div class="builder__out">
      <div class="builder__out-head">
        <span class="builder__label">{{ s.outputCompact }}</span>
        <button type="button" class="copy" @click="copy(compact, 'compact')">
          {{ copied === 'compact' ? s.copied : s.copy }}
        </button>
      </div>
      <div class="builder__code">
        <p class="builder__compact">{{ compact }}</p>
      </div>
    </div>

    <div class="builder__out">
      <div class="builder__out-head">
        <span class="builder__label">{{ s.outputJson }}</span>
        <button type="button" class="copy" @click="copy(json, 'json')">
          {{ copied === 'json' ? s.copied : s.copy }}
        </button>
      </div>
      <pre class="builder__json"><code>{{ json }}</code></pre>
    </div>
  </section>
</template>

<style scoped>
.builder {
  display: grid;
  gap: 1.7rem;
  margin: 2.2rem 0 3rem;
}

.builder__field {
  display: grid;
  grid-template-columns: 9.6rem 1fr;
  align-items: center;
  gap: 1rem;
}

.builder__field--inputs {
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: 1.6rem;
}

.builder__label {
  font-family: var(--font-mono);
  font-size: 0.94rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ink);
}

.builder__label i {
  font-style: normal;
  letter-spacing: 0.04em;
  opacity: 0.78;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.chip {
  font-family: var(--font-mono);
  font-size: 0.86rem;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  background: transparent;
  border: 1px solid var(--rule-strong);
  border-radius: 2px;
  padding: 0.36rem 0.78rem;
  cursor: pointer;
  transition: color 220ms var(--ease), border-color 220ms var(--ease),
    background-color 220ms var(--ease), transform 220ms var(--ease);
}

.chip:hover {
  color: var(--ink);
  border-color: var(--ink-faint);
}

.chip:active {
  transform: translateY(1px);
}

.chip--on {
  color: var(--paper);
  background: var(--seal);
  border-color: var(--seal);
}

.builder__input {
  display: grid;
  gap: 0.55rem;
}

.builder__input input {
  font-family: var(--font-serif);
  font-size: 1.06rem;
  color: var(--ink);
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--rule-strong);
  padding: 0.3rem 0;
  transition: border-color 260ms var(--ease);
}

.builder__input input::placeholder {
  color: var(--ink-faint);
  opacity: 0.8;
}

.builder__input input:focus {
  outline: none;
  border-bottom-color: var(--seal);
}

.builder__out-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

/* 三个输出块统一用「机器可读字段」那种代码块底色 */
.builder__code {
  padding: 1.1rem 1.2rem;
  background: var(--paper-sunken);
  border: 1px solid var(--rule);
  border-radius: 3px;
  overflow-x: auto;
}

/* 极简披露行：与上面的标准披露行同一起位，但只用一根细线，保持「极简」 */
.builder__compact {
  margin: 0;
  padding: 0.1rem 0 0.1rem 1.1rem;
  border-left: 1px solid var(--rule-strong);
  font-family: var(--font-mono);
  font-size: 0.98rem;
  line-height: 1.9;
  letter-spacing: 0.01em;
  color: var(--ink);
  word-break: break-word;
}

.copy {
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

.copy:hover {
  color: var(--seal-ink);
  border-color: var(--seal);
}

.builder__json {
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

@media (max-width: 640px) {
  .builder__field,
  .builder__field--inputs {
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }
}
</style>
