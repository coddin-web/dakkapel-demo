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

const emit = defineEmits<{
  elementClick: [index: number]
}>()

const svgRef = ref<SVGSVGElement | null>(null)

// Roof color mappings
const ROOF_COLORS = {
  zwart: { main: '#4A4A4A', dark: '#333333' },
  'oranje-rood': { main: '#A67C52', dark: '#8B6342' }
} as const

const roofPalette = computed(() => ROOF_COLORS[props.roofColor])

const activeElements = computed(() =>
  props.elements.filter(el => el.type !== 'geen')
)

// Dormer dimensions based on props - width and height scale independently
const dormerDims = computed(() => {
  // Width scales from 150cm to 1200cm -> 120px to 320px
  const w = 120 + ((props.width - 150) / (1200 - 150)) * 200

  // Height scales from 100cm to 200cm -> 70px to 110px
  const h = 70 + ((props.height - 100) / (200 - 100)) * 40

  return {
    width: w,
    height: h,
    isFlat: props.dormerRoofType === 'plat'
  }
})

function drawVisualization() {
  if (!svgRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const viewWidth = 400
  const viewHeight = 200
  const dims = dormerDims.value
  const roofColor = roofPalette.value

  const defs = svg.append('defs')

  // Glass gradient
  const glassGrad = defs.append('linearGradient')
    .attr('id', 'glass2d')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%')
  glassGrad.append('stop').attr('offset', '0%').attr('stop-color', '#9ABED0')
  glassGrad.append('stop').attr('offset', '100%').attr('stop-color', '#7A9EB0')

  const g = svg.append('g')
    .attr('transform', `translate(${viewWidth / 2}, ${viewHeight / 2 + 15})`)

  const W = dims.width
  const H = dims.height
  const fasciaH = 8
  const roofPeakH = 20

  // Position
  const x = -W / 2
  const y = -H / 2

  // === MAIN ROOF (background) ===
  const roofMargin = 40
  const roofH = 60

  // Simple roof trapezoid
  svg.append('polygon')
    .attr('points', `
      ${viewWidth/2 - W/2 - roofMargin},${viewHeight/2 + H/2 + 15 + roofH}
      ${viewWidth/2 + W/2 + roofMargin},${viewHeight/2 + H/2 + 15 + roofH}
      ${viewWidth/2 + W/2 + roofMargin - 20},${viewHeight/2 - H/2 + 15 - 30}
      ${viewWidth/2 - W/2 - roofMargin + 20},${viewHeight/2 - H/2 + 15 - 30}
    `)
    .attr('fill', roofColor.main)
    .lower()

  // Roof tile lines
  for (let i = 1; i < 8; i++) {
    const t = i / 8
    const yLine = viewHeight/2 + H/2 + 15 + roofH - t * (roofH + H + 30)
    const shrink = t * 20
    svg.append('line')
      .attr('x1', viewWidth/2 - W/2 - roofMargin + shrink)
      .attr('y1', yLine)
      .attr('x2', viewWidth/2 + W/2 + roofMargin - shrink)
      .attr('y2', yLine)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.4)
      .lower()
  }

  // === DORMER ===
  const dormerGroup = g.append('g').attr('class', 'dormer')

  // Side cheeks (simple rectangles in 2D, slight trapezoid shape)
  const cheekW = 12
  const cheekColor = '#4D7A6A'

  // Left cheek
  dormerGroup.append('polygon')
    .attr('points', `
      ${x - cheekW},${y}
      ${x},${y}
      ${x},${y + H}
      ${x - cheekW},${y + H + 10}
    `)
    .attr('fill', cheekColor)
    .attr('stroke', '#3D6A5A')
    .attr('stroke-width', 1)

  // Right cheek
  dormerGroup.append('polygon')
    .attr('points', `
      ${x + W},${y}
      ${x + W + cheekW},${y}
      ${x + W + cheekW},${y + H + 10}
      ${x + W},${y + H}
    `)
    .attr('fill', cheekColor)
    .attr('stroke', '#3D6A5A')
    .attr('stroke-width', 1)

  // Dormer roof
  if (dims.isFlat) {
    // Flat roof fascia
    dormerGroup.append('rect')
      .attr('x', x - cheekW - 4)
      .attr('y', y - fasciaH)
      .attr('width', W + cheekW * 2 + 8)
      .attr('height', fasciaH)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#CCCCCC')
      .attr('stroke-width', 0.5)

    // Roof top (thin line)
    dormerGroup.append('rect')
      .attr('x', x - cheekW - 4)
      .attr('y', y - fasciaH - 3)
      .attr('width', W + cheekW * 2 + 8)
      .attr('height', 3)
      .attr('fill', '#BBBBBB')
  } else {
    // Pitched roof
    dormerGroup.append('polygon')
      .attr('points', `
        ${x - cheekW - 4},${y}
        ${x + W + cheekW + 4},${y}
        ${x + W/2},${y - roofPeakH}
      `)
      .attr('fill', roofColor.main)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 1)
  }

  // Front face
  dormerGroup.append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', W)
    .attr('height', H)
    .attr('fill', props.exteriorColor)
    .attr('stroke', '#999999')
    .attr('stroke-width', 1)

  // === WINDOWS ===
  const windowCount = Math.max(activeElements.value.length, 1)
  const frameBorder = 4
  const mullionW = 3
  const sidePad = 8
  const topPad = 6

  const totalMullions = (windowCount - 1) * mullionW
  const availableW = W - sidePad * 2 - totalMullions
  const windowW = availableW / windowCount
  const windowH = Math.min(windowW * 1.8, H - topPad * 2)
  const windowY = y + (H - windowH) / 2

  for (let i = 0; i < windowCount; i++) {
    const wx = x + sidePad + i * (windowW + mullionW)
    const element = activeElements.value[i] || { type: 'raam' }

    const windowGroup = dormerGroup.append('g')
      .attr('class', 'window')
      .style('cursor', 'pointer')
      .on('click', () => emit('elementClick', i))

    if (element.type === 'tussenpaneel') {
      windowGroup.append('rect')
        .attr('x', wx)
        .attr('y', windowY)
        .attr('width', windowW)
        .attr('height', windowH)
        .attr('fill', props.exteriorColor)
        .attr('stroke', '#777777')
        .attr('stroke-width', 1)
    } else {
      // Frame
      windowGroup.append('rect')
        .attr('x', wx)
        .attr('y', windowY)
        .attr('width', windowW)
        .attr('height', windowH)
        .attr('fill', props.frameColor)
        .attr('stroke', '#BBBBBB')
        .attr('stroke-width', 0.5)

      // Glass
      windowGroup.append('rect')
        .attr('x', wx + frameBorder)
        .attr('y', windowY + frameBorder)
        .attr('width', windowW - frameBorder * 2)
        .attr('height', windowH - frameBorder * 2)
        .attr('fill', 'url(#glass2d)')

      // Draai-kiepraam mullion
      if (element.type === 'draai-kiepraam') {
        windowGroup.append('line')
          .attr('x1', wx + windowW / 2)
          .attr('y1', windowY + frameBorder)
          .attr('x2', wx + windowW / 2)
          .attr('y2', windowY + windowH - frameBorder)
          .attr('stroke', props.frameColor)
          .attr('stroke-width', 3)
      }
    }

    // Mullion between windows
    if (i < windowCount - 1) {
      dormerGroup.append('rect')
        .attr('x', wx + windowW)
        .attr('y', windowY)
        .attr('width', mullionW)
        .attr('height', windowH)
        .attr('fill', '#333333')
    }
  }

  // Model decorations
  if (props.model === 'kader') {
    const pillarW = 4
    dormerGroup.append('rect')
      .attr('x', x - pillarW)
      .attr('y', y)
      .attr('width', pillarW)
      .attr('height', H)
      .attr('fill', props.fasciaColor)

    dormerGroup.append('rect')
      .attr('x', x + W)
      .attr('y', y)
      .attr('width', pillarW)
      .attr('height', H)
      .attr('fill', props.fasciaColor)
  }
}

onMounted(() => drawVisualization())

watch(
  () => [props.roofColor, props.exteriorColor, props.frameColor, props.fasciaColor,
         props.elements, props.model, props.dormerRoofType, props.width, props.height],
  () => drawVisualization(),
  { deep: true }
)
</script>

<template>
  <svg
    ref="svgRef"
    class="dormer-svg"
    viewBox="0 0 400 200"
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
