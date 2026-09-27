<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const progress = ref(0)
let frame = 0

function measure() {
  frame = 0
  const el = document.documentElement
  const max = el.scrollHeight - el.clientHeight
  progress.value = max > 8 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0
}

function schedule() {
  if (frame) return
  frame = requestAnimationFrame(measure)
}

onMounted(() => {
  measure()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
})

onUnmounted(() => {
  if (frame) cancelAnimationFrame(frame)
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
})
</script>

<template>
  <div class="aicd-progress" aria-hidden="true">
    <i :style="{ transform: `scaleX(${progress})` }" />
  </div>
</template>

<style scoped>
.aicd-progress {
  position: fixed;
  inset: 0 0 auto 0;
  height: 2px;
  z-index: 40;
  pointer-events: none;
}

.aicd-progress i {
  display: block;
  height: 100%;
  background: var(--seal);
  transform-origin: 0 50%;
  transform: scaleX(0);
  transition: transform 140ms linear;
}

@media (prefers-reduced-motion: reduce) {
  .aicd-progress {
    display: none;
  }
}
</style>
