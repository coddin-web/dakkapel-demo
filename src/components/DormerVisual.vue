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

const roofHex = computed(() => {
  return props.roofColor === 'oranje-rood' ? '#c45d35' : '#3d3d3d'
})

const activeElements = computed(() => {
  return props.elements.filter(el => el.type !== 'geen')
})

const elementWidth = computed(() => {
  const count = Math.max(activeElements.value.length, 1)
  return Math.min(50, 180 / count)
})
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
              :x="75 + index * (elementWidth + 8)"
              y="108"
              :width="elementWidth"
              height="55"
              :fill="frameColor"
              rx="2"
            />
            <!-- Glass -->
            <rect
              :x="79 + index * (elementWidth + 8)"
              y="112"
              :width="elementWidth - 8"
              height="47"
              fill="#87CEEB"
              opacity="0.7"
              rx="1"
            />
            <!-- Window divider for draai-kiepraam -->
            <g v-if="element.type === 'draai-kiepraam'">
              <line
                :x1="79 + index * (elementWidth + 8) + (elementWidth - 8) / 2"
                y1="112"
                :x2="79 + index * (elementWidth + 8) + (elementWidth - 8) / 2"
                y2="159"
                :stroke="frameColor"
                stroke-width="2"
              />
              <circle
                :cx="79 + index * (elementWidth + 8) + (elementWidth - 8) / 2 + 8"
                cy="135"
                r="2"
                fill="#666"
              />
            </g>
          </g>
          <!-- Panel -->
          <g v-else-if="element.type === 'tussenpaneel'">
            <rect
              :x="75 + index * (elementWidth + 8)"
              y="108"
              :width="elementWidth"
              height="55"
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
            y="108"
            width="80"
            height="55"
            :fill="frameColor"
            rx="2"
          />
          <rect
            x="114"
            y="112"
            width="72"
            height="47"
            fill="#87CEEB"
            opacity="0.7"
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
