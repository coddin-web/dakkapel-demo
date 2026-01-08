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
  'oranje-rood': { main: '#A85D3B', dark: '#8B4A2F', tile: '#C06B42' }
} as const

const roofPalette = computed(() => ROOF_COLORS[props.roofColor])

const activeElements = computed(() =>
  props.elements.filter(el => el.type !== 'geen')
)

// Calculate dormer dimensions based on props
const dormerDims = computed(() => {
  // Scale factor based on width (150-1200cm -> 0.6-1.4)
  const scale = 0.6 + ((props.width - 150) / (1200 - 150)) * 0.8

  // Base dimensions
  const frontWidth = 280 * scale
  const frontHeight = 85 * scale
  const depth = frontWidth * 0.35 // 35% depth for visible side cheeks

  return {
    scale,
    frontWidth,
    frontHeight,
    depth,
    isFlat: props.dormerRoofType === 'plat'
  }
})

function drawVisualization() {
  if (!svgRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const viewWidth = 500
  const viewHeight = 340
  const dims = dormerDims.value
  const roofColor = roofPalette.value

  // Isometric projection settings
  // Viewing from below-right, looking up at the dormer
  const angleX = 30 * (Math.PI / 180)  // 30° for isometric

  // Isometric projection function
  // x = left-right, y = up-down (height), z = depth (into screen)
  function iso(x: number, y: number, z: number): [number, number] {
    const screenX = (x - z) * Math.cos(angleX)
    const screenY = -y + (x + z) * Math.sin(angleX) * 0.5
    return [screenX, screenY]
  }

  // Create path from 3D quad points
  function quadPath(p1: [number, number, number], p2: [number, number, number],
                    p3: [number, number, number], p4: [number, number, number]): string {
    const pts = [p1, p2, p3, p4].map(p => iso(p[0], p[1], p[2]))
    return `M ${pts[0][0]},${pts[0][1]} L ${pts[1][0]},${pts[1][1]} L ${pts[2][0]},${pts[2][1]} L ${pts[3][0]},${pts[3][1]} Z`
  }

  // Defs for gradients and filters
  const defs = svg.append('defs')

  // Glass gradient with reflection
  const glassGrad = defs.append('linearGradient')
    .attr('id', 'glassGrad')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '100%').attr('y2', '100%')
  glassGrad.append('stop').attr('offset', '0%').attr('stop-color', '#9CB8C8').attr('stop-opacity', 0.7)
  glassGrad.append('stop').attr('offset', '40%').attr('stop-color', '#6A8A9A').attr('stop-opacity', 0.8)
  glassGrad.append('stop').attr('offset', '100%').attr('stop-color', '#4A6A7A').attr('stop-opacity', 0.85)

  // Shadow filter for depth
  const shadow = defs.append('filter')
    .attr('id', 'dropShadow')
    .attr('x', '-20%').attr('y', '-20%')
    .attr('width', '140%').attr('height', '140%')
  shadow.append('feDropShadow')
    .attr('dx', 2).attr('dy', 3)
    .attr('stdDeviation', 3)
    .attr('flood-color', '#000')
    .attr('flood-opacity', 0.2)

  // Main group - centered and positioned
  const g = svg.append('g')
    .attr('transform', `translate(${viewWidth / 2 + 20}, ${viewHeight / 2 + 60})`)

  // === DORMER 3D COORDINATES ===
  // Origin at front-bottom-left of dormer
  const W = dims.frontWidth      // width (x-axis)
  const H = dims.frontHeight     // height (y-axis)
  const D = dims.depth           // depth (z-axis)
  const roofOverhang = 12
  const fasciaH = 8

  // Roof slope for cheeks (45° pitch on main house roof)
  const cheekBottomDrop = D * 0.6

  // === 1. MAIN HOUSE ROOF (background) ===
  const roofGroup = g.append('g').attr('class', 'main-roof')

  // Main roof - sloped surface behind dormer
  const roofExtend = 60
  const roofHeightAbove = 40
  const roofHeightBelow = 100
  const roofDepthBack = 120

  // Draw roof as sloped parallelogram
  roofGroup.append('path')
    .attr('d', quadPath(
      [-roofExtend, -roofHeightBelow, -D/2],
      [W + roofExtend, -roofHeightBelow, -D/2],
      [W + roofExtend + roofDepthBack * 0.5, H + roofHeightAbove, roofDepthBack],
      [-roofExtend + roofDepthBack * 0.5, H + roofHeightAbove, roofDepthBack]
    ))
    .attr('fill', roofColor.main)
    .attr('stroke', roofColor.dark)
    .attr('stroke-width', 1)

  // Add tile lines
  for (let i = 1; i < 15; i++) {
    const t = i / 15
    const y1 = -roofHeightBelow + t * (H + roofHeightAbove + roofHeightBelow)
    const z1 = -D/2 + t * (roofDepthBack + D/2)
    const [x1s, y1s] = iso(-roofExtend + t * roofDepthBack * 0.5, y1, z1)
    const [x2s, y2s] = iso(W + roofExtend + t * roofDepthBack * 0.5, y1, z1)

    roofGroup.append('line')
      .attr('x1', x1s).attr('y1', y1s)
      .attr('x2', x2s).attr('y2', y2s)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.6)
      .attr('opacity', 0.4)
  }

  // === 2. DORMER STRUCTURE ===
  const dormerGroup = g.append('g')
    .attr('class', 'dormer')
    .attr('filter', 'url(#dropShadow)')

  // --- 2a. LEFT SIDE CHEEK (green, trapezoidal) ---
  // This is the most visible side from our viewing angle
  const cheekColor = '#2D5A45'
  const cheekColorDark = '#1E4435'

  // Left cheek - trapezoid shape following roof pitch
  const leftCheek: [number, number, number][] = [
    [0, 0, 0],                           // Front top
    [0, H, 0],                           // Front bottom
    [0, H + cheekBottomDrop, D],         // Back bottom (follows roof slope)
    [0, 0, D]                            // Back top
  ]

  dormerGroup.append('path')
    .attr('d', quadPath(...leftCheek as [[number,number,number],[number,number,number],[number,number,number],[number,number,number]]))
    .attr('fill', cheekColor)
    .attr('stroke', '#1A3A2A')
    .attr('stroke-width', 1)

  // Horizontal cladding lines (rabatdelen)
  const claddingCount = 7
  for (let i = 1; i < claddingCount; i++) {
    const t = i / claddingCount
    const yFront = t * H
    const yBack = t * (H + cheekBottomDrop)
    const [x1, y1] = iso(0, yFront, 0)
    const [x2, y2] = iso(0, yBack, D)

    dormerGroup.append('line')
      .attr('x1', x1).attr('y1', y1)
      .attr('x2', x2).attr('y2', y2)
      .attr('stroke', cheekColorDark)
      .attr('stroke-width', 0.8)
      .attr('opacity', 0.7)
  }

  // --- 2b. RIGHT SIDE CHEEK (darker, less visible) ---
  const rightCheek: [number, number, number][] = [
    [W, 0, 0],
    [W, H, 0],
    [W, H + cheekBottomDrop, D],
    [W, 0, D]
  ]

  dormerGroup.append('path')
    .attr('d', quadPath(...rightCheek as [[number,number,number],[number,number,number],[number,number,number],[number,number,number]]))
    .attr('fill', cheekColorDark)
    .attr('stroke', '#1A3A2A')
    .attr('stroke-width', 1)

  // --- 2c. FRONT FACE (with windows) ---
  const frontFace: [number, number, number][] = [
    [0, 0, 0],
    [W, 0, 0],
    [W, H, 0],
    [0, H, 0]
  ]

  dormerGroup.append('path')
    .attr('d', quadPath(...frontFace as [[number,number,number],[number,number,number],[number,number,number],[number,number,number]]))
    .attr('fill', props.exteriorColor)
    .attr('stroke', '#BBBBBB')
    .attr('stroke-width', 1)

  // --- 2d. FLAT ROOF STRUCTURE ---
  if (dims.isFlat) {
    // Roof top surface (gray, extends forward)
    const roofTop: [number, number, number][] = [
      [-roofOverhang, H + fasciaH, -roofOverhang],
      [W + roofOverhang, H + fasciaH, -roofOverhang],
      [W + roofOverhang, H + fasciaH, D + roofOverhang],
      [-roofOverhang, H + fasciaH, D + roofOverhang]
    ]

    dormerGroup.append('path')
      .attr('d', quadPath(...roofTop as [[number,number,number],[number,number,number],[number,number,number],[number,number,number]]))
      .attr('fill', '#D8D8D0')
      .attr('stroke', '#AAAAAA')
      .attr('stroke-width', 0.5)

    // Green moss/sedum strip on top
    const mossStrip: [number, number, number][] = [
      [-roofOverhang + 3, H + fasciaH + 0.5, -roofOverhang + 3],
      [W + roofOverhang - 3, H + fasciaH + 0.5, -roofOverhang + 3],
      [W + roofOverhang - 3, H + fasciaH + 0.5, -roofOverhang + 12],
      [-roofOverhang + 3, H + fasciaH + 0.5, -roofOverhang + 12]
    ]

    dormerGroup.append('path')
      .attr('d', quadPath(...mossStrip as [[number,number,number],[number,number,number],[number,number,number],[number,number,number]]))
      .attr('fill', '#5A7A5A')
      .attr('stroke', 'none')

    // Front fascia (white horizontal band)
    const frontFascia: [number, number, number][] = [
      [-roofOverhang, H, -roofOverhang],
      [W + roofOverhang, H, -roofOverhang],
      [W + roofOverhang, H + fasciaH, -roofOverhang],
      [-roofOverhang, H + fasciaH, -roofOverhang]
    ]

    dormerGroup.append('path')
      .attr('d', quadPath(...frontFascia as [[number,number,number],[number,number,number],[number,number,number],[number,number,number]]))
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#CCCCCC')
      .attr('stroke-width', 0.5)

    // Left fascia side (slightly darker)
    const leftFascia: [number, number, number][] = [
      [-roofOverhang, H, -roofOverhang],
      [-roofOverhang, H + fasciaH, -roofOverhang],
      [-roofOverhang, H + fasciaH, D + roofOverhang],
      [-roofOverhang, H, D + roofOverhang]
    ]

    dormerGroup.append('path')
      .attr('d', quadPath(...leftFascia as [[number,number,number],[number,number,number],[number,number,number],[number,number,number]]))
      .attr('fill', d3.color(props.fasciaColor)?.darker(0.15)?.toString() || props.fasciaColor)
      .attr('stroke', '#CCCCCC')
      .attr('stroke-width', 0.5)

    // Roof underside (shadow area under overhang)
    const roofUnderside: [number, number, number][] = [
      [-roofOverhang, H, -roofOverhang],
      [W + roofOverhang, H, -roofOverhang],
      [W, H, 0],
      [0, H, 0]
    ]

    dormerGroup.append('path')
      .attr('d', quadPath(...roofUnderside as [[number,number,number],[number,number,number],[number,number,number],[number,number,number]]))
      .attr('fill', '#AAAAAA')
      .attr('stroke', 'none')
      .attr('opacity', 0.4)

  } else {
    // Pitched dormer roof
    const peakHeight = 28
    const peakY = H + peakHeight
    const peakX = W / 2

    // Left slope
    const leftSlope: [number, number, number][] = [
      [-roofOverhang, H, -roofOverhang],
      [peakX, peakY, D/2],
      [peakX, peakY, D + roofOverhang],
      [-roofOverhang, H, D + roofOverhang]
    ]

    dormerGroup.append('path')
      .attr('d', quadPath(...leftSlope as [[number,number,number],[number,number,number],[number,number,number],[number,number,number]]))
      .attr('fill', roofColor.main)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Right slope (darker)
    const rightSlope: [number, number, number][] = [
      [W + roofOverhang, H, -roofOverhang],
      [peakX, peakY, D/2],
      [peakX, peakY, D + roofOverhang],
      [W + roofOverhang, H, D + roofOverhang]
    ]

    dormerGroup.append('path')
      .attr('d', quadPath(...rightSlope as [[number,number,number],[number,number,number],[number,number,number],[number,number,number]]))
      .attr('fill', roofColor.dark)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)

    // Front gable triangle
    const [p1x, p1y] = iso(-roofOverhang, H, -roofOverhang)
    const [p2x, p2y] = iso(W + roofOverhang, H, -roofOverhang)
    const [p3x, p3y] = iso(peakX, peakY, -roofOverhang)

    dormerGroup.append('polygon')
      .attr('points', `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`)
      .attr('fill', roofColor.tile)
      .attr('stroke', roofColor.dark)
      .attr('stroke-width', 0.5)
  }

  // --- 2e. WINDOWS ---
  const windowCount = Math.max(activeElements.value.length, 1)
  const frameBorder = 6
  const mullionW = 4
  const windowPadding = 8

  const totalMullions = (windowCount - 1) * mullionW
  const availableW = W - windowPadding * 2 - totalMullions
  const windowW = availableW / windowCount
  const windowH = Math.min(windowW * 1.8, H - windowPadding * 2)
  const windowY = (H - windowH) / 2

  for (let i = 0; i < windowCount; i++) {
    const wx = windowPadding + i * (windowW + mullionW)
    const element = activeElements.value[i] || { type: 'raam' }

    // Calculate window corners in 3D
    const [tlX, tlY] = iso(wx, windowY + windowH, 0)
    const [trX, trY] = iso(wx + windowW, windowY + windowH, 0)
    const [brX, brY] = iso(wx + windowW, windowY, 0)
    const [blX, blY] = iso(wx, windowY, 0)

    const windowGroup = dormerGroup.append('g')
      .attr('class', 'window')
      .style('cursor', 'pointer')
      .on('click', () => emit('elementClick', i))
      .on('mouseenter', function() {
        d3.select(this).select('.glass').attr('opacity', 0.5)
      })
      .on('mouseleave', function() {
        d3.select(this).select('.glass').attr('opacity', 0.8)
      })

    if (element.type === 'tussenpaneel') {
      // Solid panel
      windowGroup.append('polygon')
        .attr('points', `${tlX},${tlY} ${trX},${trY} ${brX},${brY} ${blX},${blY}`)
        .attr('fill', props.exteriorColor)
        .attr('stroke', '#999999')
        .attr('stroke-width', 1)
    } else {
      // Window frame
      windowGroup.append('polygon')
        .attr('points', `${tlX},${tlY} ${trX},${trY} ${brX},${brY} ${blX},${blY}`)
        .attr('fill', props.frameColor)
        .attr('stroke', '#DDDDDD')
        .attr('stroke-width', 0.5)

      // Glass pane (inset)
      const gx = wx + frameBorder
      const gy = windowY + frameBorder
      const gw = windowW - frameBorder * 2
      const gh = windowH - frameBorder * 2

      const [gtlX, gtlY] = iso(gx, gy + gh, -0.5)
      const [gtrX, gtrY] = iso(gx + gw, gy + gh, -0.5)
      const [gbrX, gbrY] = iso(gx + gw, gy, -0.5)
      const [gblX, gblY] = iso(gx, gy, -0.5)

      windowGroup.append('polygon')
        .attr('class', 'glass')
        .attr('points', `${gtlX},${gtlY} ${gtrX},${gtrY} ${gbrX},${gbrY} ${gblX},${gblY}`)
        .attr('fill', 'url(#glassGrad)')
        .attr('opacity', 0.8)

      // Glass reflection highlight
      const [hlX, hlY] = iso(gx + 2, gy + gh - 2, -1)
      const [hrX, hrY] = iso(gx + gw * 0.35, gy + gh - 2, -1)
      const [hbrX, hbrY] = iso(gx + gw * 0.35, gy + gh * 0.5, -1)
      const [hblX, hblY] = iso(gx + 2, gy + gh * 0.5, -1)

      windowGroup.append('polygon')
        .attr('points', `${hlX},${hlY} ${hrX},${hrY} ${hbrX},${hbrY} ${hblX},${hblY}`)
        .attr('fill', '#FFFFFF')
        .attr('opacity', 0.15)

      // Draai-kiepraam mullion
      if (element.type === 'draai-kiepraam') {
        const midX = gx + gw / 2
        const [m1x, m1y] = iso(midX, gy + gh, -0.5)
        const [m2x, m2y] = iso(midX, gy, -0.5)

        windowGroup.append('line')
          .attr('x1', m1x).attr('y1', m1y)
          .attr('x2', m2x).attr('y2', m2y)
          .attr('stroke', props.frameColor)
          .attr('stroke-width', mullionW)
      }
    }

    // Mullion between windows
    if (i < windowCount - 1) {
      const mx = wx + windowW
      const [mtlX, mtlY] = iso(mx, windowY + windowH, 0)
      const [mtrX, mtrY] = iso(mx + mullionW, windowY + windowH, 0)
      const [mbrX, mbrY] = iso(mx + mullionW, windowY, 0)
      const [mblX, mblY] = iso(mx, windowY, 0)

      dormerGroup.append('polygon')
        .attr('points', `${mtlX},${mtlY} ${mtrX},${mtrY} ${mbrX},${mbrY} ${mblX},${mblY}`)
        .attr('fill', '#3A3A3A')
    }
  }

  // --- 2f. MODEL DECORATIONS ---
  if (props.model === 'kader') {
    const pillarW = 5

    // Left pillar
    const [lp1x, lp1y] = iso(-pillarW, H, 0)
    const [lp2x, lp2y] = iso(0, H, 0)
    const [lp3x, lp3y] = iso(0, 0, 0)
    const [lp4x, lp4y] = iso(-pillarW, 0, 0)

    dormerGroup.append('polygon')
      .attr('points', `${lp1x},${lp1y} ${lp2x},${lp2y} ${lp3x},${lp3y} ${lp4x},${lp4y}`)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#CCCCCC')
      .attr('stroke-width', 0.5)

    // Right pillar
    const [rp1x, rp1y] = iso(W, H, 0)
    const [rp2x, rp2y] = iso(W + pillarW, H, 0)
    const [rp3x, rp3y] = iso(W + pillarW, 0, 0)
    const [rp4x, rp4y] = iso(W, 0, 0)

    dormerGroup.append('polygon')
      .attr('points', `${rp1x},${rp1y} ${rp2x},${rp2y} ${rp3x},${rp3y} ${rp4x},${rp4y}`)
      .attr('fill', props.fasciaColor)
      .attr('stroke', '#CCCCCC')
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
    viewBox="0 0 500 340"
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
