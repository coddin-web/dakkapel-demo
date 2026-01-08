<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import * as d3 from 'd3'
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

const svgRef = ref<SVGSVGElement | null>(null)

// Color mappings
const ROOF_COLORS = {
  zwart: { main: '#2d2d2d', dark: '#1a1a1a', light: '#404040' },
  'oranje-rood': { main: '#b84c2e', dark: '#8a3520', light: '#d4613f' }
} as const

const roofPalette = computed(() => ROOF_COLORS[props.roofColor])

const activeElements = computed(() =>
  props.elements.filter(el => el.type !== 'geen')
)

// Isometric projection helpers
const ISO_ANGLE = Math.PI / 6 // 30 degrees
const cos30 = Math.cos(ISO_ANGLE)
const sin30 = Math.sin(ISO_ANGLE)

// Convert 3D point to 2D isometric projection
function isoProject(x: number, y: number, z: number): [number, number] {
  const isoX = (x - z) * cos30
  const isoY = (x + z) * sin30 - y
  return [isoX, isoY]
}

// Create polygon path from 3D points
function createPath(points: [number, number, number][]): string {
  const projected = points.map(p => isoProject(p[0], p[1], p[2]))
  return `M ${projected.map(p => `${p[0]},${p[1]}`).join(' L ')} Z`
}

// Dormer dimensions based on props
const dormerDims = computed(() => {
  // Scale width: 150-1200cm -> 40-120 units
  const w = 40 + ((props.width - 150) / (1200 - 150)) * 80
  // Scale height: 100-200cm -> 25-50 units
  const h = 25 + ((props.height - 100) / (200 - 100)) * 25
  // Depth is proportional to width
  const d = w * 0.4

  const isFlat = props.dormerRoofType === 'plat'
  const isNokverhoging = props.model === 'nokverhoging'
  const roofHeight = isFlat ? 5 : (isNokverhoging ? 25 : 15)

  return { w, h, d, isFlat, isNokverhoging, roofHeight }
})

function drawVisualization() {
  if (!svgRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const width = 300
  const height = 200
  const centerX = width / 2
  const centerY = height / 2 + 20

  // Create main group with translation to center
  const g = svg.append('g')
    .attr('transform', `translate(${centerX}, ${centerY})`)

  // Add defs for gradients
  const defs = svg.append('defs')

  // Sky gradient
  const skyGrad = defs.append('linearGradient')
    .attr('id', 'skyGradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%')
  skyGrad.append('stop').attr('offset', '0%').attr('stop-color', '#e8f4f8')
  skyGrad.append('stop').attr('offset', '100%').attr('stop-color', '#d0e8f0')

  // Background
  svg.insert('rect', ':first-child')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'url(#skyGradient)')

  const dims = dormerDims.value
  const roofColor = roofPalette.value

  // House dimensions
  const houseW = 140
  const houseD = 80
  const houseH = 60
  const roofH = 40

  // House base position (bottom-back corner at origin)
  const hx = -houseW / 2
  const hz = -houseD / 2

  // Draw house walls
  // Front wall
  g.append('path')
    .attr('d', createPath([
      [hx, 0, hz + houseD],
      [hx + houseW, 0, hz + houseD],
      [hx + houseW, houseH, hz + houseD],
      [hx, houseH, hz + houseD]
    ]))
    .attr('fill', '#f0ebe5')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 0.5)

  // Right wall
  g.append('path')
    .attr('d', createPath([
      [hx + houseW, 0, hz + houseD],
      [hx + houseW, 0, hz],
      [hx + houseW, houseH, hz],
      [hx + houseW, houseH, hz + houseD]
    ]))
    .attr('fill', '#e0dbd5')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 0.5)

  // House roof - left slope
  g.append('path')
    .attr('d', createPath([
      [hx, houseH, hz + houseD],
      [hx + houseW / 2, houseH + roofH, hz + houseD],
      [hx + houseW / 2, houseH + roofH, hz],
      [hx, houseH, hz]
    ]))
    .attr('fill', roofColor.main)
    .attr('stroke', roofColor.dark)
    .attr('stroke-width', 0.5)

  // House roof - right slope
  g.append('path')
    .attr('d', createPath([
      [hx + houseW, houseH, hz + houseD],
      [hx + houseW / 2, houseH + roofH, hz + houseD],
      [hx + houseW / 2, houseH + roofH, hz],
      [hx + houseW, houseH, hz]
    ]))
    .attr('fill', roofColor.dark)
    .attr('stroke', roofColor.dark)
    .attr('stroke-width', 0.5)

  // Roof front gable
  g.append('path')
    .attr('d', createPath([
      [hx, houseH, hz + houseD],
      [hx + houseW, houseH, hz + houseD],
      [hx + houseW / 2, houseH + roofH, hz + houseD]
    ]))
    .attr('fill', roofColor.light)
    .attr('stroke', roofColor.dark)
    .attr('stroke-width', 0.5)

  // Dormer position on roof
  const dormerX = hx + houseW / 2 - dims.w / 2
  const dormerZ = hz + houseD * 0.3
  // Calculate Y position on roof slope
  const roofSlopeRatio = roofH / (houseW / 2)
  const distFromCenter = Math.abs(dormerX + dims.w / 2 - (hx + houseW / 2))
  const dormerBaseY = houseH + roofH - distFromCenter * roofSlopeRatio - 5

  // Dormer front wall
  g.append('path')
    .attr('d', createPath([
      [dormerX, dormerBaseY, dormerZ + dims.d],
      [dormerX + dims.w, dormerBaseY, dormerZ + dims.d],
      [dormerX + dims.w, dormerBaseY + dims.h, dormerZ + dims.d],
      [dormerX, dormerBaseY + dims.h, dormerZ + dims.d]
    ]))
    .attr('fill', props.exteriorColor)
    .attr('stroke', '#888')
    .attr('stroke-width', 0.5)

  // Dormer right wall
  g.append('path')
    .attr('d', createPath([
      [dormerX + dims.w, dormerBaseY, dormerZ + dims.d],
      [dormerX + dims.w, dormerBaseY, dormerZ],
      [dormerX + dims.w, dormerBaseY + dims.h, dormerZ],
      [dormerX + dims.w, dormerBaseY + dims.h, dormerZ + dims.d]
    ]))
    .attr('fill', d3.color(props.exteriorColor)?.darker(0.3)?.toString() || props.exteriorColor)
    .attr('stroke', '#888')
    .attr('stroke-width', 0.5)

  // Dormer roof
  if (dims.isFlat) {
    // Flat roof top
    g.append('path')
      .attr('d', createPath([
        [dormerX - 3, dormerBaseY + dims.h, dormerZ + dims.d + 3],
        [dormerX + dims.w + 3, dormerBaseY + dims.h, dormerZ + dims.d + 3],
        [dormerX + dims.w + 3, dormerBaseY + dims.h, dormerZ - 3],
        [dormerX - 3, dormerBaseY + dims.h, dormerZ - 3]
      ]))
      .attr('fill', '#444')
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5)

    // Flat roof fascia front
    g.append('path')
      .attr('d', createPath([
        [dormerX - 3, dormerBaseY + dims.h - 3, dormerZ + dims.d + 3],
        [dormerX + dims.w + 3, dormerBaseY + dims.h - 3, dormerZ + dims.d + 3],
        [dormerX + dims.w + 3, dormerBaseY + dims.h, dormerZ + dims.d + 3],
        [dormerX - 3, dormerBaseY + dims.h, dormerZ + dims.d + 3]
      ]))
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#666')
      .attr('stroke-width', 0.5)
  } else {
    // Pitched roof
    const roofPeakY = dormerBaseY + dims.h + dims.roofHeight
    const roofPeakX = dormerX + dims.w / 2

    // Dormer roof - left slope
    g.append('path')
      .attr('d', createPath([
        [dormerX - 5, dormerBaseY + dims.h, dormerZ + dims.d + 5],
        [roofPeakX, roofPeakY, dormerZ + dims.d + 5],
        [roofPeakX, roofPeakY, dormerZ - 5],
        [dormerX - 5, dormerBaseY + dims.h, dormerZ - 5]
      ]))
      .attr('fill', roofColor.main)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Dormer roof - right slope
    g.append('path')
      .attr('d', createPath([
        [dormerX + dims.w + 5, dormerBaseY + dims.h, dormerZ + dims.d + 5],
        [roofPeakX, roofPeakY, dormerZ + dims.d + 5],
        [roofPeakX, roofPeakY, dormerZ - 5],
        [dormerX + dims.w + 5, dormerBaseY + dims.h, dormerZ - 5]
      ]))
      .attr('fill', roofColor.dark)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Dormer roof front gable
    g.append('path')
      .attr('d', createPath([
        [dormerX - 5, dormerBaseY + dims.h, dormerZ + dims.d + 5],
        [dormerX + dims.w + 5, dormerBaseY + dims.h, dormerZ + dims.d + 5],
        [roofPeakX, roofPeakY, dormerZ + dims.d + 5]
      ]))
      .attr('fill', roofColor.light)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)
  }

  // Draw windows
  const windowCount = Math.max(activeElements.value.length, 1)
  const padding = 5
  const gap = 3
  const totalWindowSpace = dims.w - padding * 2
  const windowW = Math.min(15, (totalWindowSpace - (windowCount - 1) * gap) / windowCount)
  const windowH = dims.h - 10
  const totalWindowsW = windowCount * windowW + (windowCount - 1) * gap
  const windowStartX = dormerX + padding + (totalWindowSpace - totalWindowsW) / 2

  for (let i = 0; i < windowCount; i++) {
    const wx = windowStartX + i * (windowW + gap)
    const element = activeElements.value[i] || { type: 'raam' }

    if (element.type === 'tussenpaneel') {
      // Panel
      g.append('path')
        .attr('d', createPath([
          [wx, dormerBaseY + 5, dormerZ + dims.d + 0.5],
          [wx + windowW, dormerBaseY + 5, dormerZ + dims.d + 0.5],
          [wx + windowW, dormerBaseY + 5 + windowH, dormerZ + dims.d + 0.5],
          [wx, dormerBaseY + 5 + windowH, dormerZ + dims.d + 0.5]
        ]))
        .attr('fill', props.exteriorColor)
        .attr('stroke', '#666')
        .attr('stroke-width', 0.5)
    } else {
      // Window frame
      g.append('path')
        .attr('d', createPath([
          [wx, dormerBaseY + 5, dormerZ + dims.d + 0.5],
          [wx + windowW, dormerBaseY + 5, dormerZ + dims.d + 0.5],
          [wx + windowW, dormerBaseY + 5 + windowH, dormerZ + dims.d + 0.5],
          [wx, dormerBaseY + 5 + windowH, dormerZ + dims.d + 0.5]
        ]))
        .attr('fill', props.frameColor)
        .attr('stroke', '#666')
        .attr('stroke-width', 0.5)

      // Glass
      g.append('path')
        .attr('d', createPath([
          [wx + 1.5, dormerBaseY + 6.5, dormerZ + dims.d + 1],
          [wx + windowW - 1.5, dormerBaseY + 6.5, dormerZ + dims.d + 1],
          [wx + windowW - 1.5, dormerBaseY + 3.5 + windowH, dormerZ + dims.d + 1],
          [wx + 1.5, dormerBaseY + 3.5 + windowH, dormerZ + dims.d + 1]
        ]))
        .attr('fill', '#87ceeb')
        .attr('fill-opacity', 0.7)
        .attr('stroke', 'none')

      // Glass reflection
      g.append('path')
        .attr('d', createPath([
          [wx + 2, dormerBaseY + 7, dormerZ + dims.d + 1.5],
          [wx + windowW / 2 - 1, dormerBaseY + 7, dormerZ + dims.d + 1.5],
          [wx + windowW / 2 - 1, dormerBaseY + windowH / 2, dormerZ + dims.d + 1.5],
          [wx + 2, dormerBaseY + windowH / 2, dormerZ + dims.d + 1.5]
        ]))
        .attr('fill', '#fff')
        .attr('fill-opacity', 0.3)
        .attr('stroke', 'none')

      // Draai-kiepraam divider
      if (element.type === 'draai-kiepraam') {
        const midX = wx + windowW / 2
        const [p1x, p1y] = isoProject(midX, dormerBaseY + 6.5, dormerZ + dims.d + 1)
        const [p2x, p2y] = isoProject(midX, dormerBaseY + 3.5 + windowH, dormerZ + dims.d + 1)
        g.append('line')
          .attr('x1', p1x).attr('y1', p1y)
          .attr('x2', p2x).attr('y2', p2y)
          .attr('stroke', props.frameColor)
          .attr('stroke-width', 1.5)
      }
    }
  }

  // Add model-specific decorations
  if (props.model === 'kader') {
    // Side pillars
    g.append('path')
      .attr('d', createPath([
        [dormerX - 4, dormerBaseY - 2, dormerZ + dims.d + 1],
        [dormerX, dormerBaseY - 2, dormerZ + dims.d + 1],
        [dormerX, dormerBaseY + dims.h + 2, dormerZ + dims.d + 1],
        [dormerX - 4, dormerBaseY + dims.h + 2, dormerZ + dims.d + 1]
      ]))
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#666')
      .attr('stroke-width', 0.5)

    g.append('path')
      .attr('d', createPath([
        [dormerX + dims.w, dormerBaseY - 2, dormerZ + dims.d + 1],
        [dormerX + dims.w + 4, dormerBaseY - 2, dormerZ + dims.d + 1],
        [dormerX + dims.w + 4, dormerBaseY + dims.h + 2, dormerZ + dims.d + 1],
        [dormerX + dims.w, dormerBaseY + dims.h + 2, dormerZ + dims.d + 1]
      ]))
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#666')
      .attr('stroke-width', 0.5)
  }

  if (props.model === 'klassiek' && !dims.isFlat) {
    // Gable decoration
    const roofPeakY = dormerBaseY + dims.h + dims.roofHeight
    const roofPeakX = dormerX + dims.w / 2

    g.append('path')
      .attr('d', createPath([
        [roofPeakX - 5, roofPeakY - 10, dormerZ + dims.d + 6],
        [roofPeakX + 5, roofPeakY - 10, dormerZ + dims.d + 6],
        [roofPeakX, roofPeakY - 3, dormerZ + dims.d + 6]
      ]))
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#666')
      .attr('stroke-width', 0.5)
  }
}

onMounted(() => {
  drawVisualization()
})

watch(
  () => [
    props.roofColor,
    props.exteriorColor,
    props.frameColor,
    props.fasciaColor,
    props.elements,
    props.model,
    props.dormerRoofType,
    props.width,
    props.height
  ],
  () => {
    drawVisualization()
  },
  { deep: true }
)
</script>

<template>
  <svg
    ref="svgRef"
    class="dormer-svg"
    viewBox="0 0 300 200"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  />
</template>

<style scoped>
.dormer-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
