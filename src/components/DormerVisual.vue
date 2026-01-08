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

// Color mappings for roof tiles
const ROOF_COLORS = {
  zwart: { main: '#3a3a3a', dark: '#2a2a2a', highlight: '#555' },
  'oranje-rood': { main: '#c45d35', dark: '#a04a2a', highlight: '#d87850' }
} as const

const roofPalette = computed(() => ROOF_COLORS[props.roofColor])

const activeElements = computed(() =>
  props.elements.filter(el => el.type !== 'geen')
)

// Dormer dimensions based on props
const dormerDims = computed(() => {
  // Scale width: 150-1200cm maps to visual width
  const widthRatio = (props.width - 150) / (1200 - 150)
  const w = 120 + widthRatio * 180 // 120-300 pixels wide

  // Scale height: 100-200cm
  const heightRatio = (props.height - 100) / (200 - 100)
  const h = 60 + heightRatio * 40 // 60-100 pixels tall

  const isFlat = props.dormerRoofType === 'plat'

  return { w, h, isFlat }
})

function drawVisualization() {
  if (!svgRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const viewWidth = 400
  const viewHeight = 280

  const defs = svg.append('defs')

  // Sky gradient - soft blue
  const skyGrad = defs.append('linearGradient')
    .attr('id', 'skyGradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%')
  skyGrad.append('stop').attr('offset', '0%').attr('stop-color', '#b8d4e8')
  skyGrad.append('stop').attr('offset', '100%').attr('stop-color', '#d8e8f0')

  // Sedum/green roof gradient
  const sedumGrad = defs.append('linearGradient')
    .attr('id', 'sedumGradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%')
  sedumGrad.append('stop').attr('offset', '0%').attr('stop-color', '#5a7a5a')
  sedumGrad.append('stop').attr('offset', '100%').attr('stop-color', '#4a6a4a')

  // Glass reflection gradient
  const glassGrad = defs.append('linearGradient')
    .attr('id', 'glassGradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '100%').attr('y2', '100%')
  glassGrad.append('stop').attr('offset', '0%').attr('stop-color', '#a8c8d8')
  glassGrad.append('stop').attr('offset', '30%').attr('stop-color', '#88b0c0')
  glassGrad.append('stop').attr('offset', '100%').attr('stop-color', '#6898a8')

  // Tree blur filter
  const treeBlur = defs.append('filter')
    .attr('id', 'treeBlur')
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%')
  treeBlur.append('feGaussianBlur')
    .attr('in', 'SourceGraphic')
    .attr('stdDeviation', '3')

  // Background
  svg.append('rect')
    .attr('width', viewWidth)
    .attr('height', viewHeight)
    .attr('fill', 'url(#skyGradient)')

  const dims = dormerDims.value
  const roofColor = roofPalette.value

  // Main group
  const g = svg.append('g')

  // === ROOF TILES (MAIN HOUSE ROOF) ===
  // Draw the terracotta/dark roof in perspective
  const roofStartY = 80
  const roofEndY = viewHeight + 20
  const roofLeftX = -20
  const roofRightX = viewWidth + 20

  // Main roof slope with tile texture
  const roofGroup = g.append('g')

  // Base roof color
  roofGroup.append('polygon')
    .attr('points', `${roofLeftX},${roofStartY} ${roofRightX},${roofStartY} ${roofRightX},${roofEndY} ${roofLeftX},${roofEndY}`)
    .attr('fill', roofColor.main)

  // Add roof tile lines for texture
  const tileSpacing = 12
  for (let y = roofStartY; y < roofEndY; y += tileSpacing) {
    roofGroup.append('line')
      .attr('x1', roofLeftX)
      .attr('y1', y)
      .attr('x2', roofRightX)
      .attr('y2', y)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.4)
  }

  // Vertical tile shadows (staggered)
  for (let row = 0; row < 20; row++) {
    const y = roofStartY + row * tileSpacing
    const offset = row % 2 === 0 ? 0 : 15
    for (let x = roofLeftX + offset; x < roofRightX; x += 30) {
      roofGroup.append('line')
        .attr('x1', x)
        .attr('y1', y)
        .attr('x2', x)
        .attr('y2', y + tileSpacing)
        .attr('stroke', roofColor.dark)
        .attr('stroke-width', 0.3)
        .attr('opacity', 0.3)
    }
  }

  // === DORMER ===
  const dormerWidth = dims.w
  const dormerHeight = dims.h
  const dormerX = (viewWidth - dormerWidth) / 2
  const dormerY = roofStartY + 30

  // Side cheek color
  const cheekColor = d3.color(props.exteriorColor)?.darker(0.2)?.toString() || props.exteriorColor

  // Left side cheek (angled trapezoid to show perspective)
  const cheekWidth = 25
  const leftCheekPoints = [
    [dormerX, dormerY + dormerHeight],
    [dormerX, dormerY],
    [dormerX - cheekWidth, dormerY + 15],
    [dormerX - cheekWidth, dormerY + dormerHeight + 10]
  ]
  g.append('polygon')
    .attr('points', leftCheekPoints.map(p => p.join(',')).join(' '))
    .attr('fill', cheekColor)
    .attr('stroke', '#666')
    .attr('stroke-width', 0.5)

  // Right side cheek
  const rightCheekPoints = [
    [dormerX + dormerWidth, dormerY + dormerHeight],
    [dormerX + dormerWidth, dormerY],
    [dormerX + dormerWidth + cheekWidth, dormerY + 15],
    [dormerX + dormerWidth + cheekWidth, dormerY + dormerHeight + 10]
  ]
  g.append('polygon')
    .attr('points', rightCheekPoints.map(p => p.join(',')).join(' '))
    .attr('fill', d3.color(cheekColor)?.darker(0.15)?.toString() || cheekColor)
    .attr('stroke', '#666')
    .attr('stroke-width', 0.5)

  // Main front face
  g.append('rect')
    .attr('x', dormerX)
    .attr('y', dormerY)
    .attr('width', dormerWidth)
    .attr('height', dormerHeight)
    .attr('fill', props.exteriorColor)
    .attr('stroke', '#777')
    .attr('stroke-width', 0.5)

  // === ROOF (Flat or Pitched) ===
  const fasciaHeight = 8
  const roofOverhang = 8

  if (dims.isFlat) {
    // Flat roof with sedum/green covering
    // Top surface (visible from front - thin strip)
    g.append('rect')
      .attr('x', dormerX - roofOverhang - cheekWidth)
      .attr('y', dormerY - fasciaHeight - 4)
      .attr('width', dormerWidth + (roofOverhang + cheekWidth) * 2)
      .attr('height', 5)
      .attr('fill', 'url(#sedumGradient)')
      .attr('stroke', '#4a6a4a')
      .attr('stroke-width', 0.5)

    // Front fascia (prominent white band)
    g.append('rect')
      .attr('x', dormerX - roofOverhang)
      .attr('y', dormerY - fasciaHeight)
      .attr('width', dormerWidth + roofOverhang * 2)
      .attr('height', fasciaHeight)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 0.5)

    // Left fascia side
    const leftFasciaPoints = [
      [dormerX - roofOverhang, dormerY - fasciaHeight],
      [dormerX - roofOverhang, dormerY],
      [dormerX - roofOverhang - cheekWidth, dormerY + 15],
      [dormerX - roofOverhang - cheekWidth, dormerY - fasciaHeight + 10]
    ]
    g.append('polygon')
      .attr('points', leftFasciaPoints.map(p => p.join(',')).join(' '))
      .attr('fill', d3.color(props.fasciaColor)?.darker(0.1)?.toString() || props.fasciaColor)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 0.5)

    // Right fascia side
    const rightFasciaPoints = [
      [dormerX + dormerWidth + roofOverhang, dormerY - fasciaHeight],
      [dormerX + dormerWidth + roofOverhang, dormerY],
      [dormerX + dormerWidth + roofOverhang + cheekWidth, dormerY + 15],
      [dormerX + dormerWidth + roofOverhang + cheekWidth, dormerY - fasciaHeight + 10]
    ]
    g.append('polygon')
      .attr('points', rightFasciaPoints.map(p => p.join(',')).join(' '))
      .attr('fill', d3.color(props.fasciaColor)?.darker(0.15)?.toString() || props.fasciaColor)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 0.5)
  } else {
    // Pitched/shingled dormer roof
    const roofPeakY = dormerY - 35
    const roofPeakX = dormerX + dormerWidth / 2

    // Left slope
    g.append('polygon')
      .attr('points', `
        ${dormerX - roofOverhang - cheekWidth},${dormerY + 10}
        ${roofPeakX},${roofPeakY}
        ${roofPeakX},${roofPeakY}
        ${dormerX - roofOverhang},${dormerY}
      `)
      .attr('fill', roofColor.main)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Right slope
    g.append('polygon')
      .attr('points', `
        ${dormerX + dormerWidth + roofOverhang + cheekWidth},${dormerY + 10}
        ${roofPeakX},${roofPeakY}
        ${roofPeakX},${roofPeakY}
        ${dormerX + dormerWidth + roofOverhang},${dormerY}
      `)
      .attr('fill', roofColor.dark)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Front triangular gable
    g.append('polygon')
      .attr('points', `
        ${dormerX - roofOverhang},${dormerY}
        ${dormerX + dormerWidth + roofOverhang},${dormerY}
        ${roofPeakX},${roofPeakY}
      `)
      .attr('fill', roofColor.highlight)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)
  }

  // === WINDOWS ===
  const windowCount = Math.max(activeElements.value.length, 1)
  const framePadding = 12
  const windowGap = 6
  const frameWidth = 4

  const availableWidth = dormerWidth - framePadding * 2
  const totalGaps = (windowCount - 1) * windowGap
  const windowWidth = (availableWidth - totalGaps) / windowCount
  const windowHeight = dormerHeight - 16
  const windowStartX = dormerX + framePadding
  const windowY = dormerY + 8

  for (let i = 0; i < windowCount; i++) {
    const wx = windowStartX + i * (windowWidth + windowGap)
    const element = activeElements.value[i] || { type: 'raam' }

    if (element.type === 'tussenpaneel') {
      // Solid panel instead of window
      g.append('rect')
        .attr('x', wx)
        .attr('y', windowY)
        .attr('width', windowWidth)
        .attr('height', windowHeight)
        .attr('fill', props.exteriorColor)
        .attr('stroke', '#666')
        .attr('stroke-width', 1)
    } else {
      // Window frame (outer)
      g.append('rect')
        .attr('x', wx)
        .attr('y', windowY)
        .attr('width', windowWidth)
        .attr('height', windowHeight)
        .attr('fill', props.frameColor)
        .attr('stroke', '#aaa')
        .attr('stroke-width', 0.5)
        .attr('rx', 1)

      // Glass pane
      g.append('rect')
        .attr('x', wx + frameWidth)
        .attr('y', windowY + frameWidth)
        .attr('width', windowWidth - frameWidth * 2)
        .attr('height', windowHeight - frameWidth * 2)
        .attr('fill', 'url(#glassGradient)')
        .attr('rx', 1)

      // Glass reflection highlight
      g.append('rect')
        .attr('x', wx + frameWidth + 2)
        .attr('y', windowY + frameWidth + 2)
        .attr('width', (windowWidth - frameWidth * 2) * 0.3)
        .attr('height', (windowHeight - frameWidth * 2) * 0.4)
        .attr('fill', '#fff')
        .attr('opacity', 0.2)
        .attr('rx', 1)

      // Draai-kiepraam: vertical divider
      if (element.type === 'draai-kiepraam') {
        const midX = wx + windowWidth / 2
        g.append('line')
          .attr('x1', midX)
          .attr('y1', windowY + frameWidth)
          .attr('x2', midX)
          .attr('y2', windowY + windowHeight - frameWidth)
          .attr('stroke', props.frameColor)
          .attr('stroke-width', frameWidth - 1)

        // Handle indicator
        g.append('circle')
          .attr('cx', midX - windowWidth * 0.2)
          .attr('cy', windowY + windowHeight / 2)
          .attr('r', 2)
          .attr('fill', '#888')
      }
    }
  }

  // === MODEL DECORATIONS ===
  if (props.model === 'kader') {
    // Decorative frame pillars on sides
    const pillarWidth = 6

    // Left pillar
    g.append('rect')
      .attr('x', dormerX - pillarWidth)
      .attr('y', dormerY)
      .attr('width', pillarWidth)
      .attr('height', dormerHeight)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#aaa')
      .attr('stroke-width', 0.5)

    // Right pillar
    g.append('rect')
      .attr('x', dormerX + dormerWidth)
      .attr('y', dormerY)
      .attr('width', pillarWidth)
      .attr('height', dormerHeight)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#aaa')
      .attr('stroke-width', 0.5)

    // Bottom sill
    g.append('rect')
      .attr('x', dormerX - pillarWidth)
      .attr('y', dormerY + dormerHeight)
      .attr('width', dormerWidth + pillarWidth * 2)
      .attr('height', 4)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#aaa')
      .attr('stroke-width', 0.5)
  }

  if (props.model === 'klassiek' && !dims.isFlat) {
    // Classical ornament on gable peak
    const roofPeakX = dormerX + dormerWidth / 2
    const roofPeakY = dormerY - 35

    g.append('polygon')
      .attr('points', `
        ${roofPeakX - 8},${roofPeakY + 5}
        ${roofPeakX + 8},${roofPeakY + 5}
        ${roofPeakX},${roofPeakY - 8}
      `)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#aaa')
      .attr('stroke-width', 0.5)
  }

  // === BLURRY FOREGROUND TREES ===
  const treeGroup = g.append('g')
    .attr('filter', 'url(#treeBlur)')

  // Left tree cluster
  drawTree(treeGroup, 30, viewHeight - 20, 60, '#3a6a3a')
  drawTree(treeGroup, 50, viewHeight - 10, 50, '#2d5a2d')
  drawTree(treeGroup, 10, viewHeight - 5, 40, '#4a7a4a')

  // Right tree cluster
  drawTree(treeGroup, viewWidth - 40, viewHeight - 15, 55, '#3a6a3a')
  drawTree(treeGroup, viewWidth - 20, viewHeight - 5, 45, '#2d5a2d')
  drawTree(treeGroup, viewWidth - 60, viewHeight - 10, 50, '#4a7a4a')

  // Additional scattered foliage/leaves in foreground (fixed positions)
  const foliagePositions = [
    { x: 70, y: viewHeight - 8, size: 25, r: 60, g: 110, b: 60 },
    { x: 120, y: viewHeight - 5, size: 20, r: 55, g: 100, b: 55 },
    { x: viewWidth - 80, y: viewHeight - 12, size: 28, r: 65, g: 115, b: 60 },
    { x: viewWidth - 130, y: viewHeight - 6, size: 22, r: 50, g: 105, b: 50 },
    { x: viewWidth / 2 - 60, y: viewHeight - 3, size: 18, r: 58, g: 108, b: 55 },
    { x: viewWidth / 2 + 70, y: viewHeight - 4, size: 20, r: 62, g: 112, b: 58 }
  ]

  foliagePositions.forEach(pos => {
    treeGroup.append('ellipse')
      .attr('cx', pos.x)
      .attr('cy', pos.y)
      .attr('rx', pos.size)
      .attr('ry', pos.size * 0.6)
      .attr('fill', `rgb(${pos.r}, ${pos.g}, ${pos.b})`)
      .attr('opacity', 0.7)
  })
}

// Helper function to draw a simple tree shape
function drawTree(parent: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, baseY: number, height: number, color: string) {
  // Tree trunk
  parent.append('rect')
    .attr('x', x - 3)
    .attr('y', baseY - height * 0.3)
    .attr('width', 6)
    .attr('height', height * 0.4)
    .attr('fill', '#5a4a3a')

  // Foliage (multiple ellipses)
  const foliageColor = d3.color(color)

  parent.append('ellipse')
    .attr('cx', x)
    .attr('cy', baseY - height * 0.5)
    .attr('rx', height * 0.4)
    .attr('ry', height * 0.35)
    .attr('fill', foliageColor?.toString() || color)

  parent.append('ellipse')
    .attr('cx', x - height * 0.15)
    .attr('cy', baseY - height * 0.6)
    .attr('rx', height * 0.3)
    .attr('ry', height * 0.25)
    .attr('fill', foliageColor?.darker(0.2)?.toString() || color)

  parent.append('ellipse')
    .attr('cx', x + height * 0.15)
    .attr('cy', baseY - height * 0.65)
    .attr('rx', height * 0.25)
    .attr('ry', height * 0.2)
    .attr('fill', foliageColor?.brighter(0.1)?.toString() || color)
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
    viewBox="0 0 400 280"
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
