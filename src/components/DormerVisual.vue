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
const roofDark = computed(() => props.roofColor === 'zwart' ? '#1a1a1a' : '#8a3520')

const activeElements = computed(() =>
  props.elements.filter(el => el.type !== 'geen')
)

// 3D Perspective house layout - side view with front visible
// The dormer grows UPWARD (bottom stays anchored)
const dormerLayout = computed(() => {
  // Scale width: 150-1200cm maps to dormer front width 60-160px
  const minW = 60, maxW = 160
  const widthRatio = (props.width - 150) / (1200 - 150)
  const dormerWidth = minW + widthRatio * (maxW - minW)

  // Scale height: 100-200cm maps to dormer body height 30-60px
  const minH = 30, maxH = 60
  const heightRatio = (props.height - 100) / (200 - 100)
  const dormerHeight = minH + heightRatio * (maxH - minH)

  // Dormer sits on the roof slope - anchor point is bottom of dormer
  // Position from left edge of roof
  const dormerLeft = 70

  // The bottom of the dormer stays fixed on the roof slope
  // Top Y position moves UP as height increases
  const dormerBottom = 115
  const dormerTop = dormerBottom - dormerHeight

  // Roof type calculations
  const isFlat = props.dormerRoofType === 'plat'
  const isNokverhoging = props.model === 'nokverhoging'

  // Dormer roof height
  const roofHeight = isFlat ? 8 : (isNokverhoging ? 35 : 20)

  return {
    width: dormerWidth,
    height: dormerHeight,
    left: dormerLeft,
    top: dormerTop,
    bottom: dormerBottom,
    roofHeight,
    isFlat,
    isNokverhoging
  }
})

// Calculate window positions
const windowLayout = computed(() => {
  const count = Math.max(activeElements.value.length, 1)
  const d = dormerLayout.value
  const padding = 8
  const totalWidth = d.width - padding * 2
  const gap = 4

  const maxWindowWidth = 30
  const calculatedWidth = (totalWidth - (count - 1) * gap) / count
  const windowWidth = Math.min(maxWindowWidth, calculatedWidth)

  const totalWindowsWidth = count * windowWidth + (count - 1) * gap
  const startX = d.left + padding + (totalWidth - totalWindowsWidth) / 2

  const windowHeight = Math.max(20, d.height - 12)

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
      <!-- Gradients for 3D depth -->
      <linearGradient id="roofTop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :stop-color="roofHex" />
        <stop offset="100%" :stop-color="roofDark" />
      </linearGradient>

      <linearGradient id="roofSide" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" :stop-color="roofDark" />
        <stop offset="100%" :stop-color="roofHex" stop-opacity="0.7" />
      </linearGradient>

      <linearGradient id="wallFront" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f5f0e8" />
        <stop offset="100%" stop-color="#e8e0d5" />
      </linearGradient>

      <linearGradient id="wallSide" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#d8d0c5" />
        <stop offset="100%" stop-color="#c8c0b5" />
      </linearGradient>

      <linearGradient id="dormerBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :stop-color="exteriorColor" />
        <stop offset="100%" :stop-color="exteriorColor" stop-opacity="0.85" />
      </linearGradient>

      <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a8d8ea" />
        <stop offset="50%" stop-color="#7ec8e3" />
        <stop offset="100%" stop-color="#a8d8ea" />
      </linearGradient>

      <linearGradient id="glassReflect" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0" />
        <stop offset="50%" stop-color="#fff" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0" />
      </linearGradient>

      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="3" stdDeviation="3" flood-opacity="0.25"/>
      </filter>
    </defs>

    <!-- Sky background -->
    <rect x="0" y="0" width="300" height="200" fill="#e8f4f8" />

    <!-- House - 3D perspective view -->
    <!-- Front wall of house (left side, visible) -->
    <polygon
      fill="url(#wallFront)"
      points="20,180 20,100 70,70 70,150"
    />
    <!-- Front wall outline -->
    <polygon
      fill="none"
      stroke="#ccc"
      stroke-width="1"
      points="20,180 20,100 70,70 70,150"
    />

    <!-- Side wall (going back to the right) -->
    <polygon
      fill="url(#wallSide)"
      points="70,150 70,70 280,110 280,180"
    />

    <!-- Main roof - top surface (sloping away) -->
    <polygon
      fill="url(#roofTop)"
      :points="`15,98 70,65 285,105 230,138`"
    />

    <!-- Main roof - front edge (visible triangle on left) -->
    <polygon
      :fill="roofHex"
      points="15,98 70,65 70,70 20,100"
    />

    <!-- Roof tile lines for texture -->
    <g stroke="#000" stroke-opacity="0.08" stroke-width="1">
      <line x1="40" y1="85" x2="260" y2="120" />
      <line x1="55" y1="78" x2="272" y2="112" />
    </g>

    <!-- Dormer structure with 3D effect -->
    <g filter="url(#shadow)">
      <!-- Dormer side wall (right side, perspective) -->
      <polygon
        :fill="exteriorColor"
        fill-opacity="0.7"
        :points="`
          ${dormerLayout.left + dormerLayout.width},${dormerLayout.top + 5}
          ${dormerLayout.left + dormerLayout.width + 25},${dormerLayout.top + 15}
          ${dormerLayout.left + dormerLayout.width + 25},${dormerLayout.bottom + 8}
          ${dormerLayout.left + dormerLayout.width},${dormerLayout.bottom}
        `"
      />

      <!-- Dormer roof -->
      <g v-if="dormerLayout.isFlat && !dormerLayout.isNokverhoging">
        <!-- Flat roof top surface -->
        <polygon
          fill="#444"
          :points="`
            ${dormerLayout.left - 5},${dormerLayout.top - 3}
            ${dormerLayout.left + dormerLayout.width + 5},${dormerLayout.top - 3}
            ${dormerLayout.left + dormerLayout.width + 30},${dormerLayout.top + 7}
            ${dormerLayout.left + 20},${dormerLayout.top + 7}
          `"
        />
        <!-- Flat roof front fascia -->
        <rect
          :x="dormerLayout.left - 5"
          :y="dormerLayout.top - 3"
          :width="dormerLayout.width + 10"
          height="6"
          :fill="fasciaColor"
        />
      </g>

      <g v-else-if="!dormerLayout.isNokverhoging">
        <!-- Sloped dormer roof - front face -->
        <polygon
          :fill="roofHex"
          :points="`
            ${dormerLayout.left - 5},${dormerLayout.top}
            ${dormerLayout.left + dormerLayout.width / 2},${dormerLayout.top - dormerLayout.roofHeight}
            ${dormerLayout.left + dormerLayout.width + 5},${dormerLayout.top}
          `"
        />
        <!-- Sloped dormer roof - side face (perspective) -->
        <polygon
          :fill="roofDark"
          :points="`
            ${dormerLayout.left + dormerLayout.width + 5},${dormerLayout.top}
            ${dormerLayout.left + dormerLayout.width / 2},${dormerLayout.top - dormerLayout.roofHeight}
            ${dormerLayout.left + dormerLayout.width / 2 + 25},${dormerLayout.top - dormerLayout.roofHeight + 10}
            ${dormerLayout.left + dormerLayout.width + 30},${dormerLayout.top + 10}
          `"
        />
      </g>

      <g v-else>
        <!-- Nokverhoging - extended roof -->
        <polygon
          :fill="roofHex"
          :points="`
            ${dormerLayout.left - 5},${dormerLayout.top}
            ${dormerLayout.left + dormerLayout.width / 2},${dormerLayout.top - dormerLayout.roofHeight}
            ${dormerLayout.left + dormerLayout.width + 5},${dormerLayout.top}
          `"
        />
        <polygon
          :fill="roofDark"
          :points="`
            ${dormerLayout.left + dormerLayout.width + 5},${dormerLayout.top}
            ${dormerLayout.left + dormerLayout.width / 2},${dormerLayout.top - dormerLayout.roofHeight}
            ${dormerLayout.left + dormerLayout.width / 2 + 25},${dormerLayout.top - dormerLayout.roofHeight + 10}
            ${dormerLayout.left + dormerLayout.width + 30},${dormerLayout.top + 10}
          `"
        />
        <!-- Ridge line -->
        <line
          :x1="dormerLayout.left + dormerLayout.width / 2"
          :y1="dormerLayout.top - dormerLayout.roofHeight"
          :x2="dormerLayout.left + dormerLayout.width / 2 + 25"
          :y2="dormerLayout.top - dormerLayout.roofHeight + 10"
          stroke="#555"
          stroke-width="2"
        />
      </g>

      <!-- Dormer front body -->
      <rect
        :x="dormerLayout.left"
        :y="dormerLayout.top"
        :width="dormerLayout.width"
        :height="dormerLayout.height"
        fill="url(#dormerBody)"
      />

      <!-- Top fascia -->
      <rect
        :x="dormerLayout.left - 3"
        :y="dormerLayout.top - 2"
        :width="dormerLayout.width + 6"
        height="4"
        :fill="fasciaColor"
      />

      <!-- Side trims -->
      <rect
        :x="dormerLayout.left - 3"
        :y="dormerLayout.top - 2"
        width="4"
        :height="dormerLayout.height + 4"
        :fill="fasciaColor"
      />
      <rect
        :x="dormerLayout.left + dormerLayout.width - 1"
        :y="dormerLayout.top - 2"
        width="4"
        :height="dormerLayout.height + 4"
        :fill="fasciaColor"
      />

      <!-- Kader model decorations -->
      <g v-if="model === 'kader'">
        <rect
          :x="dormerLayout.left - 6"
          :y="dormerLayout.top - 4"
          width="8"
          :height="dormerLayout.height + 8"
          :fill="fasciaColor"
        />
        <rect
          :x="dormerLayout.left + dormerLayout.width - 2"
          :y="dormerLayout.top - 4"
          width="8"
          :height="dormerLayout.height + 8"
          :fill="fasciaColor"
        />
      </g>

      <!-- Klassiek model gable decoration -->
      <g v-if="model === 'klassiek' && !dormerLayout.isFlat">
        <rect
          :x="dormerLayout.left + dormerLayout.width / 2 - 6"
          :y="dormerLayout.top - dormerLayout.roofHeight + 5"
          width="12"
          height="15"
          :fill="fasciaColor"
        />
        <polygon
          :fill="fasciaColor"
          :points="`
            ${dormerLayout.left + dormerLayout.width / 2 - 8},${dormerLayout.top - dormerLayout.roofHeight + 5}
            ${dormerLayout.left + dormerLayout.width / 2},${dormerLayout.top - dormerLayout.roofHeight - 5}
            ${dormerLayout.left + dormerLayout.width / 2 + 8},${dormerLayout.top - dormerLayout.roofHeight + 5}
          `"
        />
      </g>

      <!-- Windows -->
      <g class="windows">
        <template v-for="(element, index) in activeElements" :key="element.position">
          <g v-if="element.type === 'raam' || element.type === 'draai-kiepraam'">
            <!-- Window frame -->
            <rect
              :x="getWindowX(index)"
              :y="dormerLayout.top + 6"
              :width="windowLayout.windowWidth"
              :height="windowLayout.windowHeight"
              :fill="frameColor"
              rx="1"
            />
            <!-- Glass -->
            <rect
              :x="getWindowX(index) + 2"
              :y="dormerLayout.top + 8"
              :width="windowLayout.windowWidth - 4"
              :height="windowLayout.windowHeight - 4"
              fill="url(#glass)"
              rx="1"
            />
            <!-- Reflection -->
            <rect
              :x="getWindowX(index) + 2"
              :y="dormerLayout.top + 8"
              :width="windowLayout.windowWidth - 4"
              :height="windowLayout.windowHeight - 4"
              fill="url(#glassReflect)"
              rx="1"
            />
            <!-- Draai-kiepraam handle -->
            <g v-if="element.type === 'draai-kiepraam'">
              <line
                :x1="getWindowX(index) + windowLayout.windowWidth / 2"
                :y1="dormerLayout.top + 8"
                :x2="getWindowX(index) + windowLayout.windowWidth / 2"
                :y2="dormerLayout.top + windowLayout.windowHeight + 4"
                :stroke="frameColor"
                stroke-width="1.5"
              />
              <rect
                :x="getWindowX(index) + windowLayout.windowWidth / 2 + 3"
                :y="dormerLayout.top + windowLayout.windowHeight / 2 + 2"
                width="3"
                height="6"
                fill="#666"
                rx="1"
              />
            </g>
          </g>

          <!-- Panel -->
          <g v-else-if="element.type === 'tussenpaneel'">
            <rect
              :x="getWindowX(index)"
              :y="dormerLayout.top + 6"
              :width="windowLayout.windowWidth"
              :height="windowLayout.windowHeight"
              :fill="exteriorColor"
              stroke="#00000015"
              stroke-width="1"
              rx="1"
            />
          </g>
        </template>

        <!-- Default window if none -->
        <g v-if="activeElements.length === 0">
          <rect
            :x="dormerLayout.left + dormerLayout.width / 2 - 15"
            :y="dormerLayout.top + 6"
            width="30"
            :height="windowLayout.windowHeight"
            :fill="frameColor"
            rx="1"
          />
          <rect
            :x="dormerLayout.left + dormerLayout.width / 2 - 13"
            :y="dormerLayout.top + 8"
            width="26"
            :height="windowLayout.windowHeight - 4"
            fill="url(#glass)"
            rx="1"
          />
        </g>
      </g>

      <!-- Bottom sill -->
      <rect
        :x="dormerLayout.left - 3"
        :y="dormerLayout.bottom - 2"
        :width="dormerLayout.width + 6"
        height="3"
        :fill="fasciaColor"
      />
    </g>

    <!-- Ground/horizon line -->
    <line x1="0" y1="180" x2="300" y2="180" stroke="#ccc" stroke-width="1" />
  </svg>
</template>

<style scoped>
.dormer-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
