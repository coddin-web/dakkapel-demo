<script setup lang="ts">
import { computed } from 'vue'
import type { RoofColor, DormerModel, DormerRoofType, DormerElement } from '@/types'

const props = defineProps<{
  roofColor: RoofColor
  exteriorColor: string
  frameColor: string
  fasciaColor: string
  elements: DormerElement[]
  model: DormerModel
  dormerRoofType: DormerRoofType
  width: number
  height: number
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

// Scale dormer dimensions based on selected width/height
// Base reference: 300cm width = 180px dormer width, 150cm height = 57px dormer height
const dormerLayout = computed(() => {
  // Scale width: 150-1200cm maps to dormer width 90-220px (within 300px viewBox)
  const minW = 90, maxW = 220
  const widthRatio = (props.width - 150) / (1200 - 150)
  const dormerWidth = minW + widthRatio * (maxW - minW)

  // Scale height: 100-200cm maps to dormer body height 38-76px
  const minH = 38, maxH = 76
  const heightRatio = (props.height - 100) / (200 - 100)
  const dormerHeight = minH + heightRatio * (maxH - minH)

  // Center the dormer horizontally
  const dormerX = (300 - dormerWidth) / 2

  // House roof peak is at y=50. Dormer must be below unless nokverhoging.
  // Position dormer body to sit on house roof slope
  const bodyY = 90

  // For flat roof: simple horizontal top
  // For schuin roof: sloped roof matching house
  const isFlat = props.dormerRoofType === 'plat'
  const isNokverhoging = props.model === 'nokverhoging'

  // Roof peak Y - for nokverhoging it can go above house peak
  let roofPeakY = bodyY - (isFlat ? 8 : 30)
  if (isNokverhoging) {
    roofPeakY = 35 // Above house roof peak
  }

  return {
    width: dormerWidth,
    height: dormerHeight,
    x: dormerX,
    bodyY,
    roofPeakY,
    isFlat,
    isNokverhoging,
    bottomY: bodyY + dormerHeight
  }
})

// Calculate window positions dynamically
const windowLayout = computed(() => {
  const count = Math.max(activeElements.value.length, 1)
  const d = dormerLayout.value
  const padding = 10
  const totalWidth = d.width - padding * 2
  const gap = 6

  // Max window width ~70cm equivalent (capped at 35px in visual)
  const maxWindowWidth = 35
  const calculatedWidth = (totalWidth - (count - 1) * gap) / count
  const windowWidth = Math.min(maxWindowWidth, calculatedWidth)

  // Center windows if they don't fill the full width
  const totalWindowsWidth = count * windowWidth + (count - 1) * gap
  const startX = d.x + padding + (totalWidth - totalWindowsWidth) / 2

  // Window height scales with dormer height
  const windowHeight = Math.max(30, d.height - 15)

  return { count, windowWidth, windowHeight, gap, startX }
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

      <!-- Dormer roof - Flat type -->
      <g v-if="dormerLayout.isFlat && !dormerLayout.isNokverhoging">
        <!-- Flat roof with slight overhang -->
        <rect
          :x="dormerLayout.x - 8"
          :y="dormerLayout.bodyY - 10"
          :width="dormerLayout.width + 16"
          height="8"
          :fill="fasciaColor"
          rx="1"
        />
        <!-- Roof surface (dark) -->
        <rect
          :x="dormerLayout.x - 5"
          :y="dormerLayout.bodyY - 12"
          :width="dormerLayout.width + 10"
          height="4"
          fill="#444"
          rx="1"
        />
      </g>

      <!-- Dormer roof - Shingled type -->
      <g v-if="!dormerLayout.isFlat && !dormerLayout.isNokverhoging">
        <!-- Sloped roof with tiles -->
        <polygon
          :fill="roofHex"
          :points="`${dormerLayout.x - 5},${dormerLayout.bodyY - 3} 150,${dormerLayout.roofPeakY} ${dormerLayout.x + dormerLayout.width + 5},${dormerLayout.bodyY - 3}`"
        />
        <!-- Roof shadow -->
        <polygon
          fill="#000"
          opacity="0.15"
          :points="`${dormerLayout.x - 5},${dormerLayout.bodyY - 3} 150,${dormerLayout.roofPeakY} 150,${dormerLayout.bodyY - 3}`"
        />
        <!-- Tile lines for shingled roof -->
        <g stroke="#000" stroke-opacity="0.1" stroke-width="1">
          <line
            :x1="dormerLayout.x + 10"
            :y1="dormerLayout.bodyY - 10"
            :x2="dormerLayout.x + dormerLayout.width - 10"
            :y2="dormerLayout.bodyY - 10"
          />
          <line
            :x1="dormerLayout.x + 25"
            :y1="dormerLayout.bodyY - 18"
            :x2="dormerLayout.x + dormerLayout.width - 25"
            :y2="dormerLayout.bodyY - 18"
          />
        </g>
      </g>

      <!-- Model decorations - Nokverhoging -->
      <g v-if="dormerLayout.isNokverhoging">
        <!-- Extended roof above house peak -->
        <polygon
          :fill="roofHex"
          :points="`${dormerLayout.x - 5},${dormerLayout.bodyY - 3} 150,${dormerLayout.roofPeakY} ${dormerLayout.x + dormerLayout.width + 5},${dormerLayout.bodyY - 3}`"
        />
        <polygon
          fill="#000"
          opacity="0.15"
          :points="`${dormerLayout.x - 5},${dormerLayout.bodyY - 3} 150,${dormerLayout.roofPeakY} 150,${dormerLayout.bodyY - 3}`"
        />
        <!-- Ridge cap -->
        <line
          x1="150"
          :y1="dormerLayout.roofPeakY"
          x2="150"
          :y2="dormerLayout.roofPeakY + 15"
          stroke="#555"
          stroke-width="3"
        />
      </g>

      <!-- Model decorations - Kader -->
      <g v-if="model === 'kader'">
        <rect :x="dormerLayout.x - 5" :y="dormerLayout.bodyY - 3" width="8" :height="dormerLayout.height + 6" :fill="fasciaColor" />
        <rect :x="dormerLayout.x + dormerLayout.width - 3" :y="dormerLayout.bodyY - 3" width="8" :height="dormerLayout.height + 6" :fill="fasciaColor" />
      </g>

      <!-- Model decorations - Klassiek -->
      <g v-if="model === 'klassiek' && !dormerLayout.isFlat">
        <rect x="143" :y="dormerLayout.roofPeakY + 3" width="14" height="20" :fill="fasciaColor" />
        <polygon :points="`140,${dormerLayout.roofPeakY + 3} 150,${dormerLayout.roofPeakY - 5} 160,${dormerLayout.roofPeakY + 3}`" :fill="fasciaColor" />
      </g>

      <!-- Main dormer body -->
      <rect
        :x="dormerLayout.x"
        :y="dormerLayout.bodyY"
        :width="dormerLayout.width"
        :height="dormerLayout.height"
        fill="url(#bodyGradient)"
        rx="1"
      />

      <!-- Top fascia -->
      <rect :x="dormerLayout.x - 5" :y="dormerLayout.bodyY - 5" :width="dormerLayout.width + 10" height="6" :fill="fasciaColor" rx="1" />

      <!-- Side trims -->
      <rect :x="dormerLayout.x - 5" :y="dormerLayout.bodyY - 5" width="6" :height="dormerLayout.height + 8" :fill="fasciaColor" />
      <rect :x="dormerLayout.x + dormerLayout.width - 1" :y="dormerLayout.bodyY - 5" width="6" :height="dormerLayout.height + 8" :fill="fasciaColor" />

      <!-- Windows -->
      <g class="windows">
        <template v-for="(element, index) in activeElements" :key="element.position">
          <!-- Window frame -->
          <g v-if="element.type === 'raam' || element.type === 'draai-kiepraam'">
            <rect
              :x="getWindowX(index)"
              :y="dormerLayout.bodyY + 7"
              :width="windowLayout.windowWidth"
              :height="windowLayout.windowHeight"
              :fill="frameColor"
              rx="1"
            />
            <!-- Glass pane -->
            <rect
              :x="getWindowX(index) + 3"
              :y="dormerLayout.bodyY + 10"
              :width="windowLayout.windowWidth - 6"
              :height="windowLayout.windowHeight - 6"
              fill="url(#glassGradient)"
              rx="1"
            />
            <!-- Glass reflection -->
            <rect
              :x="getWindowX(index) + 3"
              :y="dormerLayout.bodyY + 10"
              :width="windowLayout.windowWidth - 6"
              :height="windowLayout.windowHeight - 6"
              fill="url(#skyReflection)"
              rx="1"
            />
            <!-- Draai-kiepraam handle indicator -->
            <g v-if="element.type === 'draai-kiepraam'">
              <line
                :x1="getWindowX(index) + windowLayout.windowWidth / 2"
                :y1="dormerLayout.bodyY + 10"
                :x2="getWindowX(index) + windowLayout.windowWidth / 2"
                :y2="dormerLayout.bodyY + windowLayout.windowHeight"
                :stroke="frameColor"
                stroke-width="2"
              />
              <rect
                :x="getWindowX(index) + windowLayout.windowWidth / 2 + 4"
                :y="dormerLayout.bodyY + windowLayout.windowHeight / 2"
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
              :y="dormerLayout.bodyY + 7"
              :width="windowLayout.windowWidth"
              :height="windowLayout.windowHeight"
              :fill="exteriorColor"
              stroke="#00000020"
              stroke-width="1"
              rx="1"
            />
          </g>
        </template>

        <!-- Default single window if none selected -->
        <g v-if="activeElements.length === 0">
          <rect :x="150 - 30" :y="dormerLayout.bodyY + 7" width="60" :height="windowLayout.windowHeight" :fill="frameColor" rx="1" />
          <rect :x="150 - 27" :y="dormerLayout.bodyY + 10" width="54" :height="windowLayout.windowHeight - 6" fill="url(#glassGradient)" rx="1" />
          <rect :x="150 - 27" :y="dormerLayout.bodyY + 10" width="54" :height="windowLayout.windowHeight - 6" fill="url(#skyReflection)" rx="1" />
        </g>
      </g>

      <!-- Bottom sill -->
      <rect :x="dormerLayout.x - 5" :y="dormerLayout.bodyY + dormerLayout.height - 2" :width="dormerLayout.width + 10" height="4" :fill="fasciaColor" rx="1" />
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
