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
  zwart: { main: '#3D3D3D', dark: '#2A2A2A', tile: '#4A4A4A' },
  'oranje-rood': { main: '#8B5A2B', dark: '#6B4423', tile: '#9D6B3D' }
} as const

const roofPalette = computed(() => ROOF_COLORS[props.roofColor])

const activeElements = computed(() =>
  props.elements.filter(el => el.type !== 'geen')
)

// Calculate dormer dimensions based on props
const dormerDims = computed(() => {
  // Scale factor based on width (150-1200cm -> 0.5-1.5)
  const scale = 0.5 + ((props.width - 150) / (1200 - 150)) * 1.0

  // Base dimensions (in pixels)
  const frontWidth = 300 * scale
  const frontHeight = 90 * scale
  const cheekDepth = frontWidth * 0.25 // 25% of front width
  const roofOverhang = 8

  return {
    scale,
    frontWidth,
    frontHeight,
    cheekDepth,
    roofOverhang,
    isFlat: props.dormerRoofType === 'plat'
  }
})

function drawVisualization() {
  if (!svgRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const viewWidth = 500
  const viewHeight = 320
  const dims = dormerDims.value
  const roofColor = roofPalette.value

  // Projection settings for oblique view
  // Depth is shown going up-left at 45°
  const depthAngle = Math.PI / 4 // 45 degrees
  const depthScale = 0.5 // How much depth is compressed

  // Helper to project 3D point to 2D (oblique projection)
  function project(x: number, y: number, z: number): [number, number] {
    const px = x + z * Math.cos(depthAngle) * depthScale
    const py = y - z * Math.sin(depthAngle) * depthScale
    return [px, py]
  }

  // Create path from 3D points
  function pathFromPoints(points: [number, number, number][]): string {
    const projected = points.map(p => project(p[0], p[1], p[2]))
    return `M ${projected.map(p => `${p[0]},${p[1]}`).join(' L ')} Z`
  }

  // Defs for gradients
  const defs = svg.append('defs')

  // Glass gradient
  const glassGrad = defs.append('linearGradient')
    .attr('id', 'glassGrad')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '100%').attr('y2', '100%')
  glassGrad.append('stop').attr('offset', '0%').attr('stop-color', '#7A8A94').attr('stop-opacity', 0.5)
  glassGrad.append('stop').attr('offset', '100%').attr('stop-color', '#5C6670').attr('stop-opacity', 0.6)

  // Main group centered in viewport
  const g = svg.append('g')
    .attr('transform', `translate(${viewWidth / 2}, ${viewHeight / 2 + 20})`)

  // === SCENE LAYOUT ===
  // Dormer is centered, main roof extends around it
  const dormerX = -dims.frontWidth / 2
  const dormerY = -dims.frontHeight / 2

  // Main roof dimensions
  const mainRoofWidth = dims.frontWidth + dims.cheekDepth * 2 + 100
  const mainRoofHeightAbove = 50
  const mainRoofHeightBelow = 120

  // === 1. MAIN PITCHED ROOF ===
  // Draw as a parallelogram (pitched slope facing viewer)
  const roofLeft = -mainRoofWidth / 2
  const roofRight = mainRoofWidth / 2
  const roofTop = dormerY - mainRoofHeightAbove
  const roofBottom = dormerY + dims.frontHeight + mainRoofHeightBelow

  // Roof depth offset for 3D effect
  const roofDepth = 80

  // Back edge of roof (higher, further back)
  const roofGroup = g.append('g').attr('class', 'main-roof')

  // Main roof surface (front-facing slope)
  roofGroup.append('path')
    .attr('d', pathFromPoints([
      [roofLeft, roofBottom, 0],
      [roofRight, roofBottom, 0],
      [roofRight, roofTop, roofDepth],
      [roofLeft, roofTop, roofDepth]
    ]))
    .attr('fill', roofColor.main)
    .attr('stroke', roofColor.dark)
    .attr('stroke-width', 1)

  // Add horizontal tile lines
  const tileRowHeight = 15
  for (let y = roofBottom - tileRowHeight; y > roofTop; y -= tileRowHeight) {
    const progress = (roofBottom - y) / (roofBottom - roofTop)
    const z = progress * roofDepth
    const [x1, y1] = project(roofLeft, y, z)
    const [x2, y2] = project(roofRight, y, z)

    roofGroup.append('line')
      .attr('x1', x1).attr('y1', y1)
      .attr('x2', x2).attr('y2', y2)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.5)
  }

  // === 2. DORMER STRUCTURE ===
  const dormerGroup = g.append('g').attr('class', 'dormer')

  // --- 2a. Left side cheek (trapezoidal, dark green) ---
  const cheekColor = '#2D4A3E'
  const cheekColorDark = '#1F3A2E'

  // Left cheek: vertical front, 45° bottom following roof
  const leftCheekPoints: [number, number, number][] = [
    [dormerX, dormerY, 0],                                    // Top front
    [dormerX, dormerY + dims.frontHeight, 0],                 // Bottom front
    [dormerX, dormerY + dims.frontHeight + dims.cheekDepth * 0.7, dims.cheekDepth], // Bottom back (follows roof)
    [dormerX, dormerY, dims.cheekDepth]                       // Top back
  ]

  dormerGroup.append('path')
    .attr('d', pathFromPoints(leftCheekPoints))
    .attr('fill', cheekColor)
    .attr('stroke', '#1A2A22')
    .attr('stroke-width', 0.5)

  // Add horizontal cladding lines to left cheek
  for (let i = 1; i < 6; i++) {
    const y = dormerY + (dims.frontHeight / 6) * i
    const [x1, y1] = project(dormerX, y, 0)
    const [x2, y2] = project(dormerX, y + dims.cheekDepth * 0.1 * i, dims.cheekDepth)
    dormerGroup.append('line')
      .attr('x1', x1).attr('y1', y1)
      .attr('x2', x2).attr('y2', y2)
      .attr('stroke', cheekColorDark)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.6)
  }

  // --- 2b. Right side cheek (mostly hidden, just edge visible) ---
  const rightCheekPoints: [number, number, number][] = [
    [dormerX + dims.frontWidth, dormerY, 0],
    [dormerX + dims.frontWidth, dormerY + dims.frontHeight, 0],
    [dormerX + dims.frontWidth, dormerY + dims.frontHeight + dims.cheekDepth * 0.7, dims.cheekDepth],
    [dormerX + dims.frontWidth, dormerY, dims.cheekDepth]
  ]

  // Right cheek is darker (in shadow)
  dormerGroup.append('path')
    .attr('d', pathFromPoints(rightCheekPoints))
    .attr('fill', cheekColorDark)
    .attr('stroke', '#1A2A22')
    .attr('stroke-width', 0.5)

  // --- 2c. Front face (white panel with windows) ---
  dormerGroup.append('rect')
    .attr('x', dormerX)
    .attr('y', dormerY)
    .attr('width', dims.frontWidth)
    .attr('height', dims.frontHeight)
    .attr('fill', props.exteriorColor)
    .attr('stroke', '#CCCCCC')
    .attr('stroke-width', 1)

  // --- 2d. Windows ---
  const windowCount = Math.max(activeElements.value.length, 1)
  const frameThickness = 6
  const mullionWidth = 3
  const windowPadding = 10

  // Window proportions: 1:1.8 (width:height)
  const totalMullions = (windowCount - 1) * mullionWidth
  const availableWidth = dims.frontWidth - windowPadding * 2 - totalMullions
  const windowWidth = availableWidth / windowCount
  const windowHeight = Math.min(windowWidth * 1.8, dims.frontHeight - windowPadding * 2)

  const windowStartX = dormerX + windowPadding
  const windowY = dormerY + (dims.frontHeight - windowHeight) / 2

  for (let i = 0; i < windowCount; i++) {
    const wx = windowStartX + i * (windowWidth + mullionWidth)
    const element = activeElements.value[i] || { type: 'raam' }

    const windowGroup = dormerGroup.append('g')
      .attr('class', 'window')
      .style('cursor', 'pointer')
      .on('click', () => emit('elementClick', i))
      .on('mouseenter', function() {
        d3.select(this).select('.glass').attr('opacity', 0.4)
      })
      .on('mouseleave', function() {
        d3.select(this).select('.glass').attr('opacity', 0.6)
      })

    if (element.type === 'tussenpaneel') {
      // Solid panel
      windowGroup.append('rect')
        .attr('x', wx)
        .attr('y', windowY)
        .attr('width', windowWidth)
        .attr('height', windowHeight)
        .attr('fill', props.exteriorColor)
        .attr('stroke', '#AAAAAA')
        .attr('stroke-width', 1)
    } else {
      // Window frame (white)
      windowGroup.append('rect')
        .attr('x', wx)
        .attr('y', windowY)
        .attr('width', windowWidth)
        .attr('height', windowHeight)
        .attr('fill', props.frameColor)
        .attr('stroke', '#DDDDDD')
        .attr('stroke-width', 0.5)
        .attr('rx', 1)

      // Glass pane
      windowGroup.append('rect')
        .attr('class', 'glass')
        .attr('x', wx + frameThickness)
        .attr('y', windowY + frameThickness)
        .attr('width', windowWidth - frameThickness * 2)
        .attr('height', windowHeight - frameThickness * 2)
        .attr('fill', 'url(#glassGrad)')
        .attr('opacity', 0.6)
        .attr('rx', 1)

      // Draai-kiepraam: add center mullion
      if (element.type === 'draai-kiepraam') {
        const midX = wx + windowWidth / 2
        windowGroup.append('line')
          .attr('x1', midX)
          .attr('y1', windowY + frameThickness)
          .attr('x2', midX)
          .attr('y2', windowY + windowHeight - frameThickness)
          .attr('stroke', props.frameColor)
          .attr('stroke-width', mullionWidth)
      }
    }

    // Mullion between windows (dark gray separator)
    if (i < windowCount - 1) {
      dormerGroup.append('rect')
        .attr('x', wx + windowWidth)
        .attr('y', windowY)
        .attr('width', mullionWidth)
        .attr('height', windowHeight)
        .attr('fill', '#4A4A4A')
    }
  }

  // --- 2e. Flat roof ---
  if (dims.isFlat) {
    const overhang = dims.roofOverhang
    const fasciaHeight = 6

    // Roof top surface (slightly gray)
    const roofTopPoints: [number, number, number][] = [
      [dormerX - overhang, dormerY - fasciaHeight, overhang],
      [dormerX + dims.frontWidth + overhang, dormerY - fasciaHeight, overhang],
      [dormerX + dims.frontWidth + overhang, dormerY - fasciaHeight, dims.cheekDepth + overhang],
      [dormerX - overhang, dormerY - fasciaHeight, dims.cheekDepth + overhang]
    ]

    dormerGroup.append('path')
      .attr('d', pathFromPoints(roofTopPoints))
      .attr('fill', '#E8E8E0')
      .attr('stroke', '#CCCCCC')
      .attr('stroke-width', 0.5)

    // Optional green moss strip along front edge
    const mossStripPoints: [number, number, number][] = [
      [dormerX - overhang, dormerY - fasciaHeight, overhang],
      [dormerX + dims.frontWidth + overhang, dormerY - fasciaHeight, overhang],
      [dormerX + dims.frontWidth + overhang, dormerY - fasciaHeight, overhang + 6],
      [dormerX - overhang, dormerY - fasciaHeight, overhang + 6]
    ]

    dormerGroup.append('path')
      .attr('d', pathFromPoints(mossStripPoints))
      .attr('fill', '#5A7A5A')
      .attr('stroke', 'none')

    // Front fascia (white band)
    dormerGroup.append('rect')
      .attr('x', dormerX - overhang)
      .attr('y', dormerY - fasciaHeight)
      .attr('width', dims.frontWidth + overhang * 2)
      .attr('height', fasciaHeight)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#DDDDDD')
      .attr('stroke-width', 0.5)

    // Left fascia side
    const leftFasciaPoints: [number, number, number][] = [
      [dormerX - overhang, dormerY - fasciaHeight, 0],
      [dormerX - overhang, dormerY, 0],
      [dormerX - overhang, dormerY, dims.cheekDepth + overhang],
      [dormerX - overhang, dormerY - fasciaHeight, dims.cheekDepth + overhang]
    ]

    dormerGroup.append('path')
      .attr('d', pathFromPoints(leftFasciaPoints))
      .attr('fill', d3.color(props.fasciaColor)?.darker(0.1)?.toString() || props.fasciaColor)
      .attr('stroke', '#DDDDDD')
      .attr('stroke-width', 0.5)

  } else {
    // Pitched dormer roof
    const roofPeakHeight = 30
    const roofPeakY = dormerY - roofPeakHeight
    const roofPeakX = dormerX + dims.frontWidth / 2

    // Left slope
    const leftSlopePoints: [number, number, number][] = [
      [dormerX - 5, dormerY, 0],
      [roofPeakX, roofPeakY, 0],
      [roofPeakX, roofPeakY, dims.cheekDepth],
      [dormerX - 5, dormerY, dims.cheekDepth]
    ]

    dormerGroup.append('path')
      .attr('d', pathFromPoints(leftSlopePoints))
      .attr('fill', roofColor.main)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Right slope
    const rightSlopePoints: [number, number, number][] = [
      [dormerX + dims.frontWidth + 5, dormerY, 0],
      [roofPeakX, roofPeakY, 0],
      [roofPeakX, roofPeakY, dims.cheekDepth],
      [dormerX + dims.frontWidth + 5, dormerY, dims.cheekDepth]
    ]

    dormerGroup.append('path')
      .attr('d', pathFromPoints(rightSlopePoints))
      .attr('fill', roofColor.dark)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Front gable triangle
    dormerGroup.append('polygon')
      .attr('points', `
        ${dormerX - 5},${dormerY}
        ${dormerX + dims.frontWidth + 5},${dormerY}
        ${roofPeakX},${roofPeakY}
      `)
      .attr('fill', roofColor.tile)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)
  }

  // === 3. MODEL-SPECIFIC DECORATIONS ===
  if (props.model === 'kader') {
    // Decorative vertical frames on sides
    const pillarWidth = 5

    dormerGroup.append('rect')
      .attr('x', dormerX - pillarWidth)
      .attr('y', dormerY)
      .attr('width', pillarWidth)
      .attr('height', dims.frontHeight)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#CCC')
      .attr('stroke-width', 0.5)

    dormerGroup.append('rect')
      .attr('x', dormerX + dims.frontWidth)
      .attr('y', dormerY)
      .attr('width', pillarWidth)
      .attr('height', dims.frontHeight)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#CCC')
      .attr('stroke-width', 0.5)
  }

  if (props.model === 'klassiek' && !dims.isFlat) {
    // Classic gable ornament
    const peakX = dormerX + dims.frontWidth / 2
    const peakY = dormerY - 30

    dormerGroup.append('polygon')
      .attr('points', `
        ${peakX - 10},${peakY + 8}
        ${peakX + 10},${peakY + 8}
        ${peakX},${peakY - 5}
      `)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#CCC')
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
    viewBox="0 0 500 320"
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
