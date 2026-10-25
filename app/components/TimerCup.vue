<script setup lang="ts">
const props = defineProps<{ progress: number, running: boolean }>()
const id = useId().replaceAll(':', '')
const level = computed(() => 157 - Math.max(0, Math.min(1, props.progress)) * 98)
// Original Pomotea silhouette and handle, retained from the Angular SVG.
const silhouette = 'M60 55 Q60 120 65 135 Q68 145 75 150 Q85 155 100 155 Q115 155 125 150 Q132 145 135 135 Q140 120 140 55 Z'
</script>

<template>
  <svg
    class="timer-cup"
    :class="{ 'is-running': running }"
    viewBox="37 12 140 158"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <clipPath :id="`${id}-interior`"><path :d="silhouette" /></clipPath>
    </defs>
    <g
      class="cup-steam"
      stroke="var(--cup-outline)"
      stroke-width="1.2"
      stroke-linecap="round"
    >
      <path d="M82 36 C74 28 88 23 81 15" />
      <path d="M101 33 C93 25 107 20 100 12" />
      <path d="M120 36 C112 28 126 23 119 15" />
    </g>
    <ellipse
      cx="109"
      cy="162"
      rx="52"
      ry="3"
      fill="var(--cup-shadow)"
    />
    <path
      fill="var(--cup-glaze)"
      stroke="var(--cup-outline)"
      stroke-width="1.6"
      d="M140 75 C140 75 142 74 144 74 C153 74 162 80 164 92 C166 104 164 116 156 124 C152 128 146 130 142 130 C140 130 140 128 140 128 L142 126 C144 126 148 125 152 121 C158 115 160 105 158 95 C156 85 150 79 144 78 C142 78 141 79 141 79 Z"
    />
    <path
      :d="silhouette"
      fill="var(--cup-glaze)"
    />
    <g :clip-path="`url(#${id}-interior)`">
      <g
        class="cup-liquid"
        :style="{ transform: `translateY(${level}px)` }"
      >
        <path
          d="M55 0 Q78 -2 100 0 T145 0 V160 H55Z"
          fill="var(--liquid)"
        />
        <ellipse
          cx="100"
          cy="0"
          rx="43"
          ry="2.5"
          fill="var(--liquid-surface)"
        />
      </g>
      <path
        d="M64 60 Q64 122 69 136"
        stroke="var(--cup-highlight)"
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <path
        d="M136 61 Q137 124 130 140"
        stroke="var(--cup-shadow)"
        stroke-width="3"
        stroke-linecap="round"
      />
    </g>
    <path
      :d="silhouette"
      stroke="var(--cup-outline)"
      stroke-width="1.6"
    />
    <ellipse
      cx="100"
      cy="55"
      rx="40"
      ry="6"
      fill="var(--cup-glaze)"
      stroke="var(--cup-outline)"
      stroke-width="1.6"
    />
    <ellipse
      cx="100"
      cy="55.8"
      rx="36"
      ry="3.3"
      fill="var(--cup-shadow)"
    />
  </svg>
</template>
