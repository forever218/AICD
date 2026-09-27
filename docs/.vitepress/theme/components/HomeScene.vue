<script setup lang="ts">
import { computed } from 'vue'
import { STRINGS, useLocale } from '../data/i18n'

const lang = useLocale()
const s = computed(() => STRINGS[lang.value])
</script>

<template>
  <div class="home-scene">
    <section class="hero">
      <AicdMark class="hero__glyph" size="clamp(9rem, 22vw, 17rem)" />
      <h1 class="hero__title">AICD</h1>
      <p class="hero__latin">{{ s.homeLatin }}</p>
      <p class="closing__en">
        {{ s.motto[0] }}<br />
        <em>{{ s.motto[1] }}</em>
      </p>
    </section>
  </div>
</template>
