<script setup lang="ts">
import { levels } from '../data/levels'
</script>

<template>
  <ol class="scale" aria-label="AI 参与程度 A0 – A5">
    <li v-for="(l, i) in levels" :key="l.code" class="scale__row">
      <a class="scale__link" :href="`/levels#${l.slug}`">
        <span class="scale__code">{{ l.code }}</span>
        <span class="scale__name">{{ l.name }}</span>
        <span class="scale__rail">
          <i :style="{ '--w': l.pct + '%', '--d': 120 + i * 70 + 'ms' }" />
        </span>
      </a>
    </li>
  </ol>
</template>

<style scoped>
.scale {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0;
  border-top: 1px solid var(--rule);
}

.scale__row {
  border-bottom: 1px solid var(--rule);
}

.scale__link {
  display: grid;
  grid-template-columns: 3.2rem minmax(6rem, 11rem) 1fr;
  align-items: center;
  gap: 1.2rem;
  padding: 0.95rem 0.25rem;
  text-decoration: none !important;
  color: var(--ink);
  transition: background-color 320ms var(--ease), padding-left 320ms var(--ease);
}

.scale__link:hover {
  background: var(--paper-sunken);
  padding-left: 0.75rem;
}

.scale__code {
  font-family: var(--font-mono);
  font-size: 0.92rem;
  letter-spacing: 0.08em;
  color: var(--seal-ink);
}

.scale__name {
  font-size: 1.08rem;
  letter-spacing: 0.01em;
  color: var(--ink);
}

.scale__rail {
  position: relative;
  height: 2px;
  background: var(--rule);
  overflow: hidden;
}

.scale__rail i {
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--w);
  background: var(--seal);
  transform-origin: 0 50%;
  animation: scale-in 900ms var(--ease) var(--d) both;
}

@keyframes scale-in {
  from {
    transform: scaleX(0);
  }
}

@media (max-width: 560px) {
  .scale__link {
    grid-template-columns: 2.6rem 1fr;
    gap: 0.9rem;
  }

  .scale__rail {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scale__rail i {
    animation: none;
  }
}
</style>
