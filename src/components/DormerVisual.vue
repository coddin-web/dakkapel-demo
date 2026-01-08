<script setup lang="ts">
import { computed } from 'vue'
import type { RoofColor, DormerModel, DormerElement } from '@/types'

const props = defineProps<{
  roofColor: RoofColor
  exteriorColor: string
  frameColor: string
  fasciaColor: string
  elements: DormerElement[]
  model: DormerModel
}>()

// Visual constants
const ROOF_COLORS = {
  zwart: '#2d2d2d',
  'oranje-rood': '#b84c2e'
} as const

const roofHex = computed(() => ROOF_COLORS[props.roofColor])

const activeElements = computed(() =>
  props.elements.filter(el => el.type !== 'geen')
)

// Calculate window positions dynamically
const windowLayout = computed(() => {
  const count = Math.max(activeElements.value.length, 1)
  const totalWidth = 160
  const gap = 6
  const windowWidth = Math.min(45, (totalWidth - (count - 1) * gap) / count)
  const startX = 70 + (totalWidth - (count * windowWidth + (count - 1) * gap)) / 2

  return { count, windowWidth, gap, startX }
})

function getWindowX(index: number): number {
  const { windowWidth, gap, startX } = windowLayout.value
  return startX + index * (windowWidth + gap)
}
</script>

<template>
  <svg
    class="dormer-svg"
    viewBox="0 0 300 200"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <!-- Gradients for depth -->
      <linearGradient id="roofGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :stop-color="roofHex" stop-opacity="1" />
        <stop offset="100%" :stop-color="roofHex" stop-opacity="0.85" />
      </linearGradient>

      <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :stop-color="exteriorColor" stop-opacity="1" />
        <stop offset="100%" :stop-color="exteriorColor" stop-opacity="0.9" />
      </linearGradient>

      <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a8d8ea" />
        <stop offset="50%" stop-color="#7ec8e3" />
        <stop offset="100%" stop-color="#a8d8ea" />
      </linearGradient>

      <linearGradient id="skyReflection" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.1" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0.3" />
      </linearGradient>

      <!-- Shadow filter -->
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.2"/>
      </filter>
    </defs>

    <!-- Background: House roof -->
    <polygon
      :fill="roofHex"
      points="0,170 150,50 300,170"
      opacity="0.95"
    />

    <!-- Roof tile lines -->
    <g stroke="#000" stroke-opacity="0.08" stroke-width="1">
      <line x1="20" y1="140" x2="280" y2="140" />
      <line x1="30" y1="125" x2="270" y2="125" />
      <line x1="45" y1="110" x2="255" y2="110" />
      <line x1="60" y1="95" x2="240" y2="95" />
    </g>

    <!-- Dormer structure -->
    <g filter="url(#dropShadow)">

      <!-- Dormer mini roof -->
      <polygon
        :fill="fasciaColor"
        points="55,82 150,55 245,82"
      />
      <polygon
        fill="#000"
        opacity="0.1"
        points="55,82 150,55 150,82"
      />

      <!-- Model decorations -->
      <g v-if="model === 'kader'">
        <rect x="55" y="82" width="8" height="60" :fill="fasciaColor" />
        <rect x="237" y="82" width="8" height="60" :fill="fasciaColor" />
      </g>

      <g v-if="model === 'klassiek'">
        <rect x="143" y="58" width="14" height="24" :fill="fasciaColor" />
        <polygon points="140,58 150,48 160,58" :fill="fasciaColor" />
      </g>

      <g v-if="model === 'nokverhoging'">
        <polygon :fill="roofHex" points="110,55 150,30 190,55" />
        <polygon fill="#000" opacity="0.1" points="110,55 150,30 150,55" />
      </g>

      <!-- Main dormer body -->
      <rect
        x="60"
        y="85"
        width="180"
        height="57"
        fill="url(#bodyGradient)"
        rx="1"
      />

      <!-- Top fascia -->
      <rect x="55" y="80" width="190" height="6" :fill="fasciaColor" rx="1" />

      <!-- Side trims -->
      <rect x="55" y="80" width="6" height="62" :fill="fasciaColor" />
      <rect x="239" y="80" width="6" height="62" :fill="fasciaColor" />

      <!-- Windows -->
      <g class="windows">
        <template v-for="(element, index) in activeElements" :key="element.position">
          <!-- Window frame -->
          <g v-if="element.type === 'raam' || element.type === 'draai-kiepraam'">
            <rect
              :x="getWindowX(index)"
              y="92"
              :width="windowLayout.windowWidth"
              height="42"
              :fill="frameColor"
              rx="1"
            />
            <!-- Glass pane -->
            <rect
              :x="getWindowX(index) + 3"
              y="95"
              :width="windowLayout.windowWidth - 6"
              height="36"
              fill="url(#glassGradient)"
              rx="1"
            />
            <!-- Glass reflection -->
            <rect
              :x="getWindowX(index) + 3"
              y="95"
              :width="windowLayout.windowWidth - 6"
              height="36"
              fill="url(#skyReflection)"
              rx="1"
            />
            <!-- Draai-kiepraam handle indicator -->
            <g v-if="element.type === 'draai-kiepraam'">
              <line
                :x1="getWindowX(index) + windowLayout.windowWidth / 2"
                y1="95"
                :x2="getWindowX(index) + windowLayout.windowWidth / 2"
                y2="131"
                :stroke="frameColor"
                stroke-width="2"
              />
              <rect
                :x="getWindowX(index) + windowLayout.windowWidth / 2 + 4"
                y="110"
                width="4"
                height="8"
                fill="#666"
                rx="1"
              />
            </g>
          </g>

          <!-- Panel -->
          <g v-else-if="element.type === 'tussenpaneel'">
            <rect
              :x="getWindowX(index)"
              y="92"
              :width="windowLayout.windowWidth"
              height="42"
              :fill="exteriorColor"
              stroke="#00000020"
              stroke-width="1"
              rx="1"
            />
          </g>
        </template>

        <!-- Default single window if none selected -->
        <g v-if="activeElements.length === 0">
          <rect x="120" y="92" width="60" height="42" :fill="frameColor" rx="1" />
          <rect x="123" y="95" width="54" height="36" fill="url(#glassGradient)" rx="1" />
          <rect x="123" y="95" width="54" height="36" fill="url(#skyReflection)" rx="1" />
        </g>
      </g>

      <!-- Bottom sill -->
      <rect x="55" y="140" width="190" height="4" :fill="fasciaColor" rx="1" />
    </g>
  </svg>
</template>

<style scoped>
.dormer-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
