<script setup lang="ts">
import { computed } from 'vue'
import type { RoofColor, DormerModel, DormerElement } from '@/types'

// Visual constants
const ROOF_COLORS = {
  zwart: '#2c2c2c',
  'oranje-rood': '#c45d35'
} as const

const ELEMENT_MAX_WIDTH = 50
const ELEMENT_CONTAINER_WIDTH = 180
const ELEMENT_GAP = 8
const ELEMENT_START_X = 75
const ELEMENT_Y = 108
const ELEMENT_HEIGHT = 55
const GLASS_PADDING = 4
const GLASS_COLOR = '#87CEEB'
const GLASS_OPACITY = 0.7

const props = defineProps<{
  roofColor: RoofColor
  exteriorColor: string
  frameColor: string
  fasciaColor: string
  elements: DormerElement[]
  model: DormerModel
}>()

const roofHex = computed(() => {
  return ROOF_COLORS[props.roofColor]
})

const activeElements = computed(() => {
  return props.elements.filter(el => el.type !== 'geen')
})

const elementWidth = computed(() => {
  const count = Math.max(activeElements.value.length, 1)
  return Math.min(ELEMENT_MAX_WIDTH, ELEMENT_CONTAINER_WIDTH / count)
})

function getElementX(index: number): number {
  return ELEMENT_START_X + index * (elementWidth.value + ELEMENT_GAP)
}

function getGlassX(index: number): number {
  return getElementX(index) + GLASS_PADDING
}

function getGlassWidth(): number {
  return elementWidth.value - GLASS_PADDING * 2
}
</script>

<template>
  <svg
    class="dormer-svg"
    viewBox="0 0 300 220"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- House roof background -->
    <polygon
      class="house-roof"
      :fill="roofHex"
      points="0,180 150,40 300,180"
    />

    <!-- Roof tiles pattern -->
    <g class="roof-pattern" :fill="roofHex" opacity="0.3">
      <line v-for="i in 8" :key="'h'+i" :x1="0" :y1="80 + i * 14" :x2="300" :y2="80 + i * 14" stroke="#000" stroke-opacity="0.15" />
    </g>

    <!-- Dormer body -->
    <g class="dormer">
      <!-- Dormer roof -->
      <polygon
        class="dormer-roof-top"
        :fill="fasciaColor"
        points="50,95 150,60 250,95"
      />

      <!-- Model-specific decoration -->
      <g v-if="model === 'kader'">
        <!-- Frame decoration -->
        <rect x="52" y="95" width="196" height="8" :fill="fasciaColor" />
        <rect x="52" y="95" width="8" height="75" :fill="fasciaColor" />
        <rect x="240" y="95" width="8" height="75" :fill="fasciaColor" />
      </g>

      <g v-if="model === 'klassiek'">
        <!-- Classical decoration -->
        <rect x="140" y="65" width="20" height="30" :fill="fasciaColor" />
        <polygon points="135,65 150,50 165,65" :fill="fasciaColor" />
      </g>

      <g v-if="model === 'nokverhoging'">
        <!-- Extended roof -->
        <polygon
          :fill="roofHex"
          points="100,60 150,30 200,60"
        />
      </g>

      <!-- Main body -->
      <rect
        class="dormer-body"
        x="60"
        y="100"
        width="180"
        height="70"
        :fill="exteriorColor"
      />

      <!-- Fascia board -->
      <rect
        class="dormer-fascia"
        x="55"
        y="95"
        width="190"
        height="8"
        :fill="fasciaColor"
      />

      <!-- Windows/Elements -->
      <g class="dormer-elements">
        <template v-for="(element, index) in activeElements" :key="element.position">
          <!-- Window frame -->
          <g v-if="element.type === 'raam' || element.type === 'draai-kiepraam'">
            <rect
              :x="getElementX(index)"
              :y="ELEMENT_Y"
              :width="elementWidth"
              :height="ELEMENT_HEIGHT"
              :fill="frameColor"
              rx="2"
            />
            <!-- Glass -->
            <rect
              :x="getGlassX(index)"
              :y="ELEMENT_Y + GLASS_PADDING"
              :width="getGlassWidth()"
              :height="ELEMENT_HEIGHT - GLASS_PADDING * 2"
              :fill="GLASS_COLOR"
              :opacity="GLASS_OPACITY"
              rx="1"
            />
            <!-- Window divider for draai-kiepraam -->
            <g v-if="element.type === 'draai-kiepraam'">
              <line
                :x1="getGlassX(index) + getGlassWidth() / 2"
                :y1="ELEMENT_Y + GLASS_PADDING"
                :x2="getGlassX(index) + getGlassWidth() / 2"
                :y2="ELEMENT_Y + ELEMENT_HEIGHT - GLASS_PADDING"
                :stroke="frameColor"
                stroke-width="2"
              />
              <circle
                :cx="getGlassX(index) + getGlassWidth() / 2 + 8"
                :cy="ELEMENT_Y + ELEMENT_HEIGHT / 2"
                r="2"
                fill="#666"
              />
            </g>
          </g>
          <!-- Panel -->
          <g v-else-if="element.type === 'tussenpaneel'">
            <rect
              :x="getElementX(index)"
              :y="ELEMENT_Y"
              :width="elementWidth"
              :height="ELEMENT_HEIGHT"
              :fill="exteriorColor"
              stroke="#555"
              stroke-width="1"
              rx="2"
            />
          </g>
        </template>

        <!-- Default window if no elements selected -->
        <g v-if="activeElements.length === 0">
          <rect
            x="110"
            :y="ELEMENT_Y"
            width="80"
            :height="ELEMENT_HEIGHT"
            :fill="frameColor"
            rx="2"
          />
          <rect
            x="114"
            :y="ELEMENT_Y + GLASS_PADDING"
            width="72"
            :height="ELEMENT_HEIGHT - GLASS_PADDING * 2"
            :fill="GLASS_COLOR"
            :opacity="GLASS_OPACITY"
            rx="1"
          />
        </g>
      </g>

      <!-- Bottom edge / sill -->
      <rect
        x="55"
        y="167"
        width="190"
        height="5"
        :fill="fasciaColor"
      />
    </g>

    <!-- Shadow under dormer -->
    <ellipse
      cx="150"
      cy="175"
      rx="90"
      ry="8"
      fill="#000"
      opacity="0.1"
    />
  </svg>
</template>

<style scoped>
.dormer-svg {
  width: 100%;
  height: 100%;
  max-width: 300px;
}

.house-roof {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.dormer {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.dormer-body,
.dormer-fascia,
.dormer-roof-top {
  transition: fill 0.3s ease;
}
</style>
