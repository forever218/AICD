<script setup lang="ts">
/**
 * AICD 标识 —— 一枚半填充的「印」。
 * 方框代表一段内容，右半实心代表其中的人工智能参与。
 */
withDefaults(defineProps<{ size?: number | string }>(), { size: '1em' })
</script>

<template>
  <svg
    class="aicd-mark"
    :style="{ width: typeof size === 'number' ? size + 'px' : size }"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <rect
      x="1.7"
      y="1.7"
      width="20.6"
      height="20.6"
      rx="5.4"
      stroke="currentColor"
      stroke-width="1.5"
      opacity="0.55"
    />
    <path d="M12 1.7h4.3a5.4 5.4 0 0 1 5.4 5.4v9.8a5.4 5.4 0 0 1-5.4 5.4H12z" fill="currentColor" />
  </svg>
</template>

<style scoped>
.aicd-mark {
  display: block;
  aspect-ratio: 1;
  color: var(--seal);
  flex: none;
}
</style>
