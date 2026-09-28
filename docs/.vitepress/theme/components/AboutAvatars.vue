<script setup lang="ts">
// 关于页 · 发起者头像
// 图片放在 docs/assets/ 下，通过相对路径交给 Vite 处理，
// 开发与构建产物都会得到正确的哈希化 URL。
import forever218 from '../../../assets/forever218.jpg'
import soulxyz from '../../../assets/soulxyz.jpg'

const people = [
  { name: 'forever218', href: 'https://github.com/forever218', src: forever218 },
  { name: 'soulxyz', href: 'https://github.com/soulxyz', src: soulxyz }
]
</script>

<template>
  <div class="avatars">
    <a
      v-for="p in people"
      :key="p.name"
      class="avatars__item"
      :href="p.href"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="`GitHub · ${p.name}`"
      :title="p.name"
    >
      <img class="avatars__img" :src="p.src" :alt="p.name" loading="lazy" decoding="async" />
    </a>
  </div>
</template>

<style scoped>
.avatars {
  display: flex;
  align-items: center;
  gap: 1.05rem;
  margin: 1.7rem 0 0;
}

.avatars__item {
  display: block;
  border-radius: 50%;
  line-height: 0;
  text-decoration: none;
  transition:
    transform 340ms var(--ease),
    box-shadow 340ms var(--ease);
}

.avatars__item:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px -20px oklch(0 0 0 / 0.55);
}

.avatars__item:active {
  transform: translateY(-1px);
}

.avatars__img {
  display: block;
  width: 4.5rem;
  height: 4.5rem;
  border: 1px solid var(--rule-strong);
  border-radius: 50%;
  background: var(--paper-sunken);
  object-fit: cover;
  transition: border-color 340ms var(--ease);
}

.avatars__item:hover .avatars__img {
  border-color: var(--ink-faint);
}

@media (max-width: 640px) {
  .avatars__img {
    width: 4rem;
    height: 4rem;
  }
}
</style>
