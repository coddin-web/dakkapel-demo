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

// Roof color mappings - muted, realistic colors
const ROOF_COLORS = {
  zwart: { main: '#4A4A4A', dark: '#333333', light: '#5A5A5A' },
  'oranje-rood': { main: '#A67C52', dark: '#8B6342', light: '#BF9268' }
} as const

const roofPalette = computed(() => ROOF_COLORS[props.roofColor])

const activeElements = computed(() =>
  props.elements.filter(el => el.type !== 'geen')
)

// Calculate dormer dimensions based on props
const dormerDims = computed(() => {
  const scale = 0.7 + ((props.width - 150) / (1200 - 150)) * 0.6

  return {
    scale,
    frontWidth: 260 * scale,
    frontHeight: 80 * scale,
    cheekDepth: 70 * scale,  // How far the side cheek extends
    isFlat: props.dormerRoofType === 'plat'
  }
})

function drawVisualization() {
  if (!svgRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const viewWidth = 480
  const viewHeight = 320
  const dims = dormerDims.value
  const roofColor = roofPalette.value

  // Oblique projection settings - subtle depth
  const depthX = 0.5   // How much depth shifts right
  const depthY = -0.4  // How much depth shifts up (negative = up)

  const defs = svg.append('defs')

  // Glass gradient
  const glassGrad = defs.append('linearGradient')
    .attr('id', 'glassGrad')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%')
  glassGrad.append('stop').attr('offset', '0%').attr('stop-color', '#8BA4B4')
  glassGrad.append('stop').attr('offset', '100%').attr('stop-color', '#6B8494')

  // Main group
  const g = svg.append('g')
    .attr('transform', `translate(${viewWidth / 2}, ${viewHeight / 2 + 20})`)

  // Dimensions
  const W = dims.frontWidth
  const H = dims.frontHeight
  const cheekD = dims.cheekDepth
  const roofOverhang = 10
  const fasciaH = 7

  // Position dormer front face (centered)
  const frontX = -W / 2
  const frontY = -H / 2

  // === 1. MAIN HOUSE ROOF (background) ===
  // Sloped roof surface - the dormer sits on this
  const roofGroup = g.append('g').attr('class', 'main-roof')

  // Main roof extends around dormer
  const roofMargin = 50
  const roofSlopeAngle = 45 // degrees

  // Roof polygon - parallelogram showing slope
  const roofLeft = frontX - cheekD * depthX - roofMargin
  const roofRight = frontX + W + roofMargin
  const roofTop = frontY - roofMargin * 0.5
  const roofBottom = frontY + H + roofMargin * 1.5

  // The roof slopes up and back
  const roofDepthOffset = 80
  const roofPoints = [
    [roofLeft, roofBottom],
    [roofRight, roofBottom],
    [roofRight + roofDepthOffset * depthX, roofTop + roofDepthOffset * depthY],
    [roofLeft + roofDepthOffset * depthX, roofTop + roofDepthOffset * depthY]
  ]

  roofGroup.append('polygon')
    .attr('points', roofPoints.map(p => p.join(',')).join(' '))
    .attr('fill', roofColor.main)
    .attr('stroke', roofColor.dark)
    .attr('stroke-width', 1)

  // Add tile row lines
  const tileRows = 12
  for (let i = 1; i < tileRows; i++) {
    const t = i / tileRows
    const y = roofBottom - t * (roofBottom - roofTop)
    const xOffset = t * roofDepthOffset * depthX
    const yOffset = t * roofDepthOffset * depthY

    roofGroup.append('line')
      .attr('x1', roofLeft + xOffset)
      .attr('y1', y + yOffset)
      .attr('x2', roofRight + xOffset)
      .attr('y2', y + yOffset)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.4)
  }

  // === 2. DORMER ===
  const dormerGroup = g.append('g').attr('class', 'dormer')

  // --- 2a. LEFT SIDE CHEEK (trapezoid) ---
  // This is the key shape - a trapezoid where:
  // - Front edge is vertical
  // - Top edge goes back horizontally (with depth offset)
  // - Bottom edge angles down following roof slope (45°)
  const cheekColor = '#3D6B5A'
  const cheekColorDark = '#2D5A4A'

  // The bottom back corner drops down following the roof slope
  const cheekBottomDrop = cheekD * Math.tan(roofSlopeAngle * Math.PI / 180) * 0.6

  const leftCheekPoints = [
    [frontX, frontY],                                           // Top front
    [frontX, frontY + H],                                       // Bottom front
    [frontX + cheekD * depthX, frontY + H + cheekBottomDrop + cheekD * depthY],  // Bottom back
    [frontX + cheekD * depthX, frontY + cheekD * depthY]        // Top back
  ]

  dormerGroup.append('polygon')
    .attr('points', leftCheekPoints.map(p => p.join(',')).join(' '))
    .attr('fill', cheekColor)
    .attr('stroke', cheekColorDark)
    .attr('stroke-width', 1)

  // Horizontal cladding lines on cheek
  const claddingLines = 6
  for (let i = 1; i < claddingLines; i++) {
    const t = i / claddingLines
    const yFront = frontY + t * H
    const yBack = frontY + t * (H + cheekBottomDrop) + cheekD * depthY

    dormerGroup.append('line')
      .attr('x1', frontX)
      .attr('y1', yFront)
      .attr('x2', frontX + cheekD * depthX)
      .attr('y2', yBack)
      .attr('stroke', cheekColorDark)
      .attr('stroke-width', 0.7)
      .attr('opacity', 0.6)
  }

  // --- 2b. RIGHT SIDE CHEEK (partially visible, darker) ---
  const rightCheekPoints = [
    [frontX + W, frontY],
    [frontX + W, frontY + H],
    [frontX + W + cheekD * depthX * 0.3, frontY + H + cheekBottomDrop * 0.3 + cheekD * depthY * 0.3],
    [frontX + W + cheekD * depthX * 0.3, frontY + cheekD * depthY * 0.3]
  ]

  dormerGroup.append('polygon')
    .attr('points', rightCheekPoints.map(p => p.join(',')).join(' '))
    .attr('fill', cheekColorDark)
    .attr('stroke', '#2D4A3A')
    .attr('stroke-width', 1)

  // --- 2c. DORMER ROOF ---
  if (dims.isFlat) {
    // Flat roof top surface (recedes into depth)
    const roofTopPoints = [
      [frontX - roofOverhang, frontY - fasciaH],
      [frontX + W + roofOverhang, frontY - fasciaH],
      [frontX + W + roofOverhang + cheekD * depthX, frontY - fasciaH + cheekD * depthY],
      [frontX - roofOverhang + cheekD * depthX, frontY - fasciaH + cheekD * depthY]
    ]

    dormerGroup.append('polygon')
      .attr('points', roofTopPoints.map(p => p.join(',')).join(' '))
      .attr('fill', '#D5D5CD')
      .attr('stroke', '#BBBBBB')
      .attr('stroke-width', 0.5)

    // Green moss strip on roof edge
    const mossPoints = [
      [frontX - roofOverhang + 2, frontY - fasciaH + 1],
      [frontX + W + roofOverhang - 2, frontY - fasciaH + 1],
      [frontX + W + roofOverhang - 2 + 8 * depthX, frontY - fasciaH + 1 + 8 * depthY],
      [frontX - roofOverhang + 2 + 8 * depthX, frontY - fasciaH + 1 + 8 * depthY]
    ]

    dormerGroup.append('polygon')
      .attr('points', mossPoints.map(p => p.join(',')).join(' '))
      .attr('fill', '#6B8B6B')
      .attr('opacity', 0.7)

    // Front fascia (white horizontal band with overhang)
    dormerGroup.append('rect')
      .attr('x', frontX - roofOverhang)
      .attr('y', frontY - fasciaH)
      .attr('width', W + roofOverhang * 2)
      .attr('height', fasciaH)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#DDDDDD')
      .attr('stroke-width', 0.5)

    // Left fascia side
    const leftFasciaPoints = [
      [frontX - roofOverhang, frontY - fasciaH],
      [frontX - roofOverhang, frontY],
      [frontX - roofOverhang + cheekD * depthX, frontY + cheekD * depthY],
      [frontX - roofOverhang + cheekD * depthX, frontY - fasciaH + cheekD * depthY]
    ]

    dormerGroup.append('polygon')
      .attr('points', leftFasciaPoints.map(p => p.join(',')).join(' '))
      .attr('fill', d3.color(props.fasciaColor)?.darker(0.1)?.toString() || props.fasciaColor)
      .attr('stroke', '#CCCCCC')
      .attr('stroke-width', 0.5)

    // Shadow under overhang
    dormerGroup.append('rect')
      .attr('x', frontX - roofOverhang)
      .attr('y', frontY)
      .attr('width', W + roofOverhang * 2)
      .attr('height', 3)
      .attr('fill', '#888888')
      .attr('opacity', 0.2)

  } else {
    // Pitched dormer roof
    const peakH = 25
    const peakX = frontX + W / 2
    const peakY = frontY - peakH

    // Left slope
    const leftSlopePoints = [
      [frontX - roofOverhang, frontY],
      [peakX, peakY],
      [peakX + cheekD * depthX, peakY + cheekD * depthY],
      [frontX - roofOverhang + cheekD * depthX, frontY + cheekD * depthY]
    ]

    dormerGroup.append('polygon')
      .attr('points', leftSlopePoints.map(p => p.join(',')).join(' '))
      .attr('fill', roofColor.main)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Right slope (darker)
    const rightSlopePoints = [
      [frontX + W + roofOverhang, frontY],
      [peakX, peakY],
      [peakX + cheekD * depthX, peakY + cheekD * depthY],
      [frontX + W + roofOverhang + cheekD * depthX, frontY + cheekD * depthY]
    ]

    dormerGroup.append('polygon')
      .attr('points', rightSlopePoints.map(p => p.join(',')).join(' '))
      .attr('fill', roofColor.dark)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Front gable
    dormerGroup.append('polygon')
      .attr('points', `${frontX - roofOverhang},${frontY} ${frontX + W + roofOverhang},${frontY} ${peakX},${peakY}`)
      .attr('fill', roofColor.light)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)
  }

  // --- 2d. FRONT FACE (clean rectangle - NO perspective distortion) ---
  dormerGroup.append('rect')
    .attr('x', frontX)
    .attr('y', frontY)
    .attr('width', W)
    .attr('height', H)
    .attr('fill', props.exteriorColor)
    .attr('stroke', '#AAAAAA')
    .attr('stroke-width', 1)

  // --- 2e. WINDOWS (portrait orientation - taller than wide) ---
  const windowCount = Math.max(activeElements.value.length, 1)
  const frameBorder = 5
  const mullionW = 4
  const sidePadding = 10
  const topPadding = 8

  const totalMullions = (windowCount - 1) * mullionW
  const availableW = W - sidePadding * 2 - totalMullions
  const windowW = availableW / windowCount

  // Windows are portrait: height = width * 2 (or max available)
  const targetWindowH = windowW * 2
  const windowH = Math.min(targetWindowH, H - topPadding * 2)
  const windowY = frontY + (H - windowH) / 2

  for (let i = 0; i < windowCount; i++) {
    const wx = frontX + sidePadding + i * (windowW + mullionW)
    const element = activeElements.value[i] || { type: 'raam' }

    const windowGroup = dormerGroup.append('g')
      .attr('class', 'window')
      .style('cursor', 'pointer')
      .on('click', () => emit('elementClick', i))
      .on('mouseenter', function() {
        d3.select(this).select('.glass').attr('opacity', 0.7)
      })
      .on('mouseleave', function() {
        d3.select(this).select('.glass').attr('opacity', 0.9)
      })

    if (element.type === 'tussenpaneel') {
      // Solid panel
      windowGroup.append('rect')
        .attr('x', wx)
        .attr('y', windowY)
        .attr('width', windowW)
        .attr('height', windowH)
        .attr('fill', props.exteriorColor)
        .attr('stroke', '#888888')
        .attr('stroke-width', 1)
    } else {
      // Window frame
      windowGroup.append('rect')
        .attr('x', wx)
        .attr('y', windowY)
        .attr('width', windowW)
        .attr('height', windowH)
        .attr('fill', props.frameColor)
        .attr('stroke', '#CCCCCC')
        .attr('stroke-width', 0.5)

      // Glass
      windowGroup.append('rect')
        .attr('class', 'glass')
        .attr('x', wx + frameBorder)
        .attr('y', windowY + frameBorder)
        .attr('width', windowW - frameBorder * 2)
        .attr('height', windowH - frameBorder * 2)
        .attr('fill', 'url(#glassGrad)')
        .attr('opacity', 0.9)

      // Glass highlight
      windowGroup.append('rect')
        .attr('x', wx + frameBorder + 2)
        .attr('y', windowY + frameBorder + 2)
        .attr('width', (windowW - frameBorder * 2) * 0.3)
        .attr('height', (windowH - frameBorder * 2) * 0.4)
        .attr('fill', '#FFFFFF')
        .attr('opacity', 0.15)

      // Draai-kiepraam mullion
      if (element.type === 'draai-kiepraam') {
        const midX = wx + windowW / 2
        windowGroup.append('line')
          .attr('x1', midX)
          .attr('y1', windowY + frameBorder)
          .attr('x2', midX)
          .attr('y2', windowY + windowH - frameBorder)
          .attr('stroke', props.frameColor)
          .attr('stroke-width', mullionW)
      }
    }

    // Mullion between windows
    if (i < windowCount - 1) {
      dormerGroup.append('rect')
        .attr('x', wx + windowW)
        .attr('y', windowY)
        .attr('width', mullionW)
        .attr('height', windowH)
        .attr('fill', '#3A3A3A')
    }
  }

  // --- 2f. MODEL DECORATIONS ---
  if (props.model === 'kader') {
    const pillarW = 5

    dormerGroup.append('rect')
      .attr('x', frontX - pillarW)
      .attr('y', frontY)
      .attr('width', pillarW)
      .attr('height', H)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#BBBBBB')
      .attr('stroke-width', 0.5)

    dormerGroup.append('rect')
      .attr('x', frontX + W)
      .attr('y', frontY)
      .attr('width', pillarW)
      .attr('height', H)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#BBBBBB')
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
    viewBox="0 0 480 320"
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
