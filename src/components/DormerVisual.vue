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

// Isometric projection helpers - standard 2:1 isometric
function isoProject(x: number, y: number, z: number): [number, number] {
  // Standard isometric: x goes right-down, z goes left-down, y goes up
  const isoX = (x - z) * 0.866 // cos(30°)
  const isoY = (x + z) * 0.5 - y // sin(30°) for x and z, minus y for height
  return [isoX, isoY]
}

// Create polygon path from 3D points
function createPath(points: [number, number, number][]): string {
  const projected = points.map(p => isoProject(p[0], p[1], p[2]))
  return `M ${projected.map(p => `${p[0]},${p[1]}`).join(' L ')} Z`
}

// Dormer dimensions based on props
const dormerDims = computed(() => {
  // Scale width: 150-1200cm -> 30-90 units
  const w = 30 + ((props.width - 150) / (1200 - 150)) * 60
  // Scale height: 100-200cm -> 20-40 units
  const h = 20 + ((props.height - 100) / (200 - 100)) * 20
  // Depth proportional
  const d = 25

  const isFlat = props.dormerRoofType === 'plat'
  const isNokverhoging = props.model === 'nokverhoging'
  const roofHeight = isFlat ? 4 : (isNokverhoging ? 20 : 12)

  return { w, h, d, isFlat, isNokverhoging, roofHeight }
})

function drawVisualization() {
  if (!svgRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const viewWidth = 300
  const viewHeight = 200

  // Add defs for gradients
  const defs = svg.append('defs')

  // Sky gradient
  const skyGrad = defs.append('linearGradient')
    .attr('id', 'skyGradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%')
  skyGrad.append('stop').attr('offset', '0%').attr('stop-color', '#dbeef5')
  skyGrad.append('stop').attr('offset', '100%').attr('stop-color', '#c5e0ed')

  // Background
  svg.append('rect')
    .attr('width', viewWidth)
    .attr('height', viewHeight)
    .attr('fill', 'url(#skyGradient)')

  const dims = dormerDims.value
  const roofColor = roofPalette.value

  // House dimensions - centered at origin
  const houseW = 100
  const houseD = 60
  const houseH = 45
  const roofH = 30

  // Calculate center point of the scene to center in viewport
  // The dormer should be roughly centered
  const sceneCenterX = 0
  const sceneCenterY = houseH + roofH / 2
  const sceneCenterZ = 0

  const [projCenterX, projCenterY] = isoProject(sceneCenterX, sceneCenterY, sceneCenterZ)
  const offsetX = viewWidth / 2 - projCenterX
  const offsetY = viewHeight / 2 - projCenterY + 15

  // Create main group centered on the dormer
  const g = svg.append('g')
    .attr('transform', `translate(${offsetX}, ${offsetY})`)

  // House base position
  const hx = -houseW / 2
  const hz = -houseD / 2

  // Draw house - back to front for proper layering

  // Left wall (back, partially visible)
  g.append('path')
    .attr('d', createPath([
      [hx, 0, hz],
      [hx, 0, hz + houseD],
      [hx, houseH, hz + houseD],
      [hx, houseH, hz]
    ]))
    .attr('fill', '#e8e3dd')
    .attr('stroke', '#bbb')
    .attr('stroke-width', 0.5)

  // Front wall
  g.append('path')
    .attr('d', createPath([
      [hx, 0, hz + houseD],
      [hx + houseW, 0, hz + houseD],
      [hx + houseW, houseH, hz + houseD],
      [hx, houseH, hz + houseD]
    ]))
    .attr('fill', '#f5f0ea')
    .attr('stroke', '#bbb')
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
    .attr('stroke', '#bbb')
    .attr('stroke-width', 0.5)

  // Roof ridge line (center of house width)
  const ridgeX = hx + houseW / 2
  const ridgeY = houseH + roofH

  // House roof - left slope (where dormer sits)
  g.append('path')
    .attr('d', createPath([
      [hx - 5, houseH, hz - 5],
      [hx - 5, houseH, hz + houseD + 5],
      [ridgeX, ridgeY, hz + houseD + 5],
      [ridgeX, ridgeY, hz - 5]
    ]))
    .attr('fill', roofColor.main)
    .attr('stroke', roofColor.dark)
    .attr('stroke-width', 0.5)

  // House roof - right slope
  g.append('path')
    .attr('d', createPath([
      [hx + houseW + 5, houseH, hz - 5],
      [hx + houseW + 5, houseH, hz + houseD + 5],
      [ridgeX, ridgeY, hz + houseD + 5],
      [ridgeX, ridgeY, hz - 5]
    ]))
    .attr('fill', roofColor.dark)
    .attr('stroke', roofColor.dark)
    .attr('stroke-width', 0.5)

  // Roof front gable (triangle)
  g.append('path')
    .attr('d', createPath([
      [hx - 5, houseH, hz + houseD + 5],
      [hx + houseW + 5, houseH, hz + houseD + 5],
      [ridgeX, ridgeY, hz + houseD + 5]
    ]))
    .attr('fill', roofColor.light)
    .attr('stroke', roofColor.dark)
    .attr('stroke-width', 0.5)

  // === DORMER ===
  // Place dormer on LEFT roof slope, centered
  // The dormer sits at a point along the slope

  // Dormer center X position (on the left half of roof)
  const dormerCenterX = hx + houseW * 0.25 // 1/4 from left edge
  const dormerX = dormerCenterX - dims.w / 2

  // Dormer Z position (centered front-to-back on roof)
  const dormerCenterZ = hz + houseD * 0.5
  const dormerZ = dormerCenterZ - dims.d / 2

  // Calculate Y at this X position on the roof slope
  // Left slope goes from hx (at houseH) to ridgeX (at ridgeY)
  const slopeProgress = (dormerCenterX - hx) / (ridgeX - hx)
  const roofYAtDormer = houseH + slopeProgress * roofH

  // Dormer base sits on roof
  const dormerBaseY = roofYAtDormer - 2

  // Dormer left wall (side, visible from this angle)
  g.append('path')
    .attr('d', createPath([
      [dormerX, dormerBaseY, dormerZ],
      [dormerX, dormerBaseY, dormerZ + dims.d],
      [dormerX, dormerBaseY + dims.h, dormerZ + dims.d],
      [dormerX, dormerBaseY + dims.h, dormerZ]
    ]))
    .attr('fill', d3.color(props.exteriorColor)?.darker(0.2)?.toString() || props.exteriorColor)
    .attr('stroke', '#777')
    .attr('stroke-width', 0.5)

  // Dormer front wall
  g.append('path')
    .attr('d', createPath([
      [dormerX, dormerBaseY, dormerZ + dims.d],
      [dormerX + dims.w, dormerBaseY, dormerZ + dims.d],
      [dormerX + dims.w, dormerBaseY + dims.h, dormerZ + dims.d],
      [dormerX, dormerBaseY + dims.h, dormerZ + dims.d]
    ]))
    .attr('fill', props.exteriorColor)
    .attr('stroke', '#777')
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
    .attr('stroke', '#777')
    .attr('stroke-width', 0.5)

  // Dormer roof
  const dormerRoofOverhang = 3
  if (dims.isFlat) {
    // Flat roof - top surface
    g.append('path')
      .attr('d', createPath([
        [dormerX - dormerRoofOverhang, dormerBaseY + dims.h + 3, dormerZ - dormerRoofOverhang],
        [dormerX - dormerRoofOverhang, dormerBaseY + dims.h + 3, dormerZ + dims.d + dormerRoofOverhang],
        [dormerX + dims.w + dormerRoofOverhang, dormerBaseY + dims.h + 3, dormerZ + dims.d + dormerRoofOverhang],
        [dormerX + dims.w + dormerRoofOverhang, dormerBaseY + dims.h + 3, dormerZ - dormerRoofOverhang]
      ]))
      .attr('fill', '#3a3a3a')
      .attr('stroke', '#222')
      .attr('stroke-width', 0.5)

    // Flat roof - front fascia
    g.append('path')
      .attr('d', createPath([
        [dormerX - dormerRoofOverhang, dormerBaseY + dims.h, dormerZ + dims.d + dormerRoofOverhang],
        [dormerX + dims.w + dormerRoofOverhang, dormerBaseY + dims.h, dormerZ + dims.d + dormerRoofOverhang],
        [dormerX + dims.w + dormerRoofOverhang, dormerBaseY + dims.h + 3, dormerZ + dims.d + dormerRoofOverhang],
        [dormerX - dormerRoofOverhang, dormerBaseY + dims.h + 3, dormerZ + dims.d + dormerRoofOverhang]
      ]))
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#555')
      .attr('stroke-width', 0.5)
  } else {
    // Pitched dormer roof
    const dormerRidgeX = dormerX + dims.w / 2
    const dormerRidgeY = dormerBaseY + dims.h + dims.roofHeight

    // Left slope
    g.append('path')
      .attr('d', createPath([
        [dormerX - dormerRoofOverhang, dormerBaseY + dims.h, dormerZ - dormerRoofOverhang],
        [dormerX - dormerRoofOverhang, dormerBaseY + dims.h, dormerZ + dims.d + dormerRoofOverhang],
        [dormerRidgeX, dormerRidgeY, dormerZ + dims.d + dormerRoofOverhang],
        [dormerRidgeX, dormerRidgeY, dormerZ - dormerRoofOverhang]
      ]))
      .attr('fill', roofColor.main)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Right slope
    g.append('path')
      .attr('d', createPath([
        [dormerX + dims.w + dormerRoofOverhang, dormerBaseY + dims.h, dormerZ - dormerRoofOverhang],
        [dormerX + dims.w + dormerRoofOverhang, dormerBaseY + dims.h, dormerZ + dims.d + dormerRoofOverhang],
        [dormerRidgeX, dormerRidgeY, dormerZ + dims.d + dormerRoofOverhang],
        [dormerRidgeX, dormerRidgeY, dormerZ - dormerRoofOverhang]
      ]))
      .attr('fill', roofColor.dark)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Front gable
    g.append('path')
      .attr('d', createPath([
        [dormerX - dormerRoofOverhang, dormerBaseY + dims.h, dormerZ + dims.d + dormerRoofOverhang],
        [dormerX + dims.w + dormerRoofOverhang, dormerBaseY + dims.h, dormerZ + dims.d + dormerRoofOverhang],
        [dormerRidgeX, dormerRidgeY, dormerZ + dims.d + dormerRoofOverhang]
      ]))
      .attr('fill', roofColor.light)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)
  }

  // Windows on front face
  const windowCount = Math.max(activeElements.value.length, 1)
  const windowPadding = 4
  const windowGap = 2
  const availableWidth = dims.w - windowPadding * 2
  const windowW = Math.min(12, (availableWidth - (windowCount - 1) * windowGap) / windowCount)
  const windowH = dims.h - 8
  const totalWindowsW = windowCount * windowW + (windowCount - 1) * windowGap
  const windowStartX = dormerX + windowPadding + (availableWidth - totalWindowsW) / 2
  const windowY = dormerBaseY + 4
  const windowZ = dormerZ + dims.d + 0.5

  for (let i = 0; i < windowCount; i++) {
    const wx = windowStartX + i * (windowW + windowGap)
    const element = activeElements.value[i] || { type: 'raam' }

    if (element.type === 'tussenpaneel') {
      g.append('path')
        .attr('d', createPath([
          [wx, windowY, windowZ],
          [wx + windowW, windowY, windowZ],
          [wx + windowW, windowY + windowH, windowZ],
          [wx, windowY + windowH, windowZ]
        ]))
        .attr('fill', props.exteriorColor)
        .attr('stroke', '#666')
        .attr('stroke-width', 0.5)
    } else {
      // Frame
      g.append('path')
        .attr('d', createPath([
          [wx, windowY, windowZ],
          [wx + windowW, windowY, windowZ],
          [wx + windowW, windowY + windowH, windowZ],
          [wx, windowY + windowH, windowZ]
        ]))
        .attr('fill', props.frameColor)
        .attr('stroke', '#555')
        .attr('stroke-width', 0.5)

      // Glass
      g.append('path')
        .attr('d', createPath([
          [wx + 1, windowY + 1, windowZ + 0.5],
          [wx + windowW - 1, windowY + 1, windowZ + 0.5],
          [wx + windowW - 1, windowY + windowH - 1, windowZ + 0.5],
          [wx + 1, windowY + windowH - 1, windowZ + 0.5]
        ]))
        .attr('fill', '#87ceeb')
        .attr('fill-opacity', 0.75)

      // Glass highlight
      g.append('path')
        .attr('d', createPath([
          [wx + 1.5, windowY + 1.5, windowZ + 1],
          [wx + windowW * 0.4, windowY + 1.5, windowZ + 1],
          [wx + windowW * 0.4, windowY + windowH * 0.5, windowZ + 1],
          [wx + 1.5, windowY + windowH * 0.5, windowZ + 1]
        ]))
        .attr('fill', '#fff')
        .attr('fill-opacity', 0.25)

      // Draai-kiepraam center divider
      if (element.type === 'draai-kiepraam') {
        const midX = wx + windowW / 2
        const [p1x, p1y] = isoProject(midX, windowY + 1, windowZ + 0.5)
        const [p2x, p2y] = isoProject(midX, windowY + windowH - 1, windowZ + 0.5)
        g.append('line')
          .attr('x1', p1x).attr('y1', p1y)
          .attr('x2', p2x).attr('y2', p2y)
          .attr('stroke', props.frameColor)
          .attr('stroke-width', 1)
      }
    }
  }

  // Model decorations
  if (props.model === 'kader') {
    // Vertical pillars on sides
    const pillarW = 3
    g.append('path')
      .attr('d', createPath([
        [dormerX - pillarW, dormerBaseY - 1, dormerZ + dims.d + 0.5],
        [dormerX, dormerBaseY - 1, dormerZ + dims.d + 0.5],
        [dormerX, dormerBaseY + dims.h + 1, dormerZ + dims.d + 0.5],
        [dormerX - pillarW, dormerBaseY + dims.h + 1, dormerZ + dims.d + 0.5]
      ]))
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#555')
      .attr('stroke-width', 0.5)

    g.append('path')
      .attr('d', createPath([
        [dormerX + dims.w, dormerBaseY - 1, dormerZ + dims.d + 0.5],
        [dormerX + dims.w + pillarW, dormerBaseY - 1, dormerZ + dims.d + 0.5],
        [dormerX + dims.w + pillarW, dormerBaseY + dims.h + 1, dormerZ + dims.d + 0.5],
        [dormerX + dims.w, dormerBaseY + dims.h + 1, dormerZ + dims.d + 0.5]
      ]))
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#555')
      .attr('stroke-width', 0.5)
  }

  if (props.model === 'klassiek' && !dims.isFlat) {
    const dormerRidgeX = dormerX + dims.w / 2
    const dormerRidgeY = dormerBaseY + dims.h + dims.roofHeight

    g.append('path')
      .attr('d', createPath([
        [dormerRidgeX - 4, dormerRidgeY - 8, dormerZ + dims.d + dormerRoofOverhang + 1],
        [dormerRidgeX + 4, dormerRidgeY - 8, dormerZ + dims.d + dormerRoofOverhang + 1],
        [dormerRidgeX, dormerRidgeY - 2, dormerZ + dims.d + dormerRoofOverhang + 1]
      ]))
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#555')
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
