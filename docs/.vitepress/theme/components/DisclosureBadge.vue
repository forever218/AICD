<script setup lang="ts">
import { computed } from 'vue'
import { STRINGS, useLocale } from '../data/i18n'
import { levelByCode } from '../data/levels'

const props = withDefaults(
  defineProps<{
    level: string
    review?: boolean | null
    tool?: string
    purpose?: string
    compact?: boolean
  }>(),
  { review: true, tool: '', purpose: '', compact: false }
)

const lang = useLocale()
const s = computed(() => STRINGS[lang.value])
const info = computed(() => levelByCode(props.level, lang.value))

const line = computed(() => {
  if (props.compact) return s.value.compactLevel(info.value.code)
  const parts = [s.value.versioned('1.0'), s.value.involvement(info.value.code, info.value.name)]
  if (props.review !== null) parts.push(s.value.reviewPart(!!props.review))
  return parts.join(' · ')
})

defineExpose({ line })

const toolLine = computed(() => (props.tool ? s.value.toolPart(props.tool) : ''))
const purposeLine = computed(() => (props.purpose ? s.value.purposePart(props.purpose) : ''))
</script>

<template>
  <div class="dbadge">
    <p class="dbadge__line">{{ line }}</p>
    <p v-if="toolLine || purposeLine" class="dbadge__meta">
      <span v-if="toolLine">{{ toolLine }}</span>
      <span v-if="purposeLine">{{ purposeLine }}</span>
    </p>
  </div>
</template>

<style scoped>
.dbadge {
  border-left: 2px solid var(--seal);
  padding: 0.1rem 0 0.1rem 1.1rem;
}

.dbadge__line {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.98rem;
  line-height: 1.9;
  letter-spacing: 0.01em;
  color: var(--ink);
  word-break: break-word;
}

.dbadge__meta {
  margin: 0.15rem 0 0;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  line-height: 1.8;
  color: var(--ink-soft);
  display: flex;
  flex-direction: column;
}
</style>
