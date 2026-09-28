<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../data/i18n'
import { levelsFor } from '../data/levels'

const lang = useLocale()
const items = computed(() => levelsFor(lang.value))
</script>

<template>
  <div class="ref">
    <article v-for="l in items" :id="l.slug" :key="l.code" class="ref__item">
      <header class="ref__head">
        <span class="ref__code">{{ l.code }}</span>
        <h2 class="ref__name">{{ l.name }}</h2>
        <span class="ref__scene">{{ l.scene }}</span>
      </header>
      <p class="ref__def">{{ l.definition }}</p>
    </article>
  </div>
</template>

<style scoped>
.ref {
  border-top: 1px solid var(--rule);
}

.ref__item {
  padding: 1.9rem 0 1.7rem;
  border-bottom: 1px solid var(--rule);
}

.ref__head {
  display: flex;
  align-items: baseline;
  gap: 1.15rem;
  margin-bottom: 0.85rem;
}

.ref__code {
  font-family: var(--font-mono);
  font-size: clamp(1.85rem, 1.3rem + 2.2vw, 2.7rem);
  font-weight: 500;
  line-height: 1.12;
  letter-spacing: 0.02em;
  color: var(--seal-ink);
  min-width: 3.5rem;
}

.ref__name {
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  font-size: 1.32rem !important;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.4;
}

.ref__scene {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
  text-align: right;
}

.ref__def {
  margin: 0;
  max-width: var(--measure);
  color: var(--ink-soft);
  font-size: 1.04rem;
  line-height: 1.88;
}

@media (max-width: 640px) {
  .ref__head {
    flex-wrap: wrap;
    gap: 0.4rem 0.9rem;
  }

  .ref__scene {
    margin-left: 0;
    width: 100%;
    text-align: left;
  }
}
</style>
