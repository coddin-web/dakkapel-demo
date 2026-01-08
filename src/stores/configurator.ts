import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  RoofColor,
  DormerModel,
  ElementType,
  PanelMaterial,
  FrameMaterial,
  DormerElement,
  CustomColor,
  PriceBreakdown
} from '@/types'

// Pricing constants - exported for use in components
export const PRICING = {
  BASE_PRICE: 16380,
  MODEL_SURCHARGE: 9000,
  WIDTH_PRICE_PER_CM: 46,
  HEIGHT_PRICE_PER_CM: 30,
  DRAAI_KIEPRAAM_SURCHARGE: 350,
  TUSSENPANEEL_SURCHARGE: 150,
  PANEL_MATERIALS: {
    'gladde-plaat': 0,
    'keraliet': 800,
    'zink': 2500,
    'hout': 1200
  },
  FRAME_MATERIALS: {
    'kunststof': 0,
    'hout': 3500
  },
  ROLLUIK_PRICE_PER_WINDOW: 650,
  CUSTOM_COLOR_SURCHARGE: 450
} as const

// Default values
export const DEFAULTS = {
  PANEL_MATERIAL: 'gladde-plaat' as const,
  FRAME_MATERIAL: 'kunststof' as const
}

export const useConfiguratorStore = defineStore('configurator', () => {
  // Current step
  const currentStep = ref(1)
  const completedSteps = ref<number[]>([])

  // Step 1: Model
  const roofColor = ref<RoofColor>('zwart')
  const dormerModel = ref<DormerModel>('standaard')

  // Step 2: Dimensions
  const width = ref(300)
  const height = ref(150)
  const roofAngle = ref(45)
  const elements = ref<DormerElement[]>([
    { position: 0, type: 'raam' },
    { position: 1, type: 'geen' },
    { position: 2, type: 'geen' },
    { position: 3, type: 'geen' },
    { position: 4, type: 'geen' }
  ])

  // Step 3: Materials
  const panelMaterial = ref<PanelMaterial>('gladde-plaat')
  const frameMaterial = ref<FrameMaterial>('kunststof')
  const hasRolluiken = ref(false)

  // Step 4: Colors
  const frameColor = ref<CustomColor>({ type: 'wit' })
  const exteriorColor = ref<CustomColor>({ type: 'antraciet' })
  const fasciaColor = ref<CustomColor>({ type: 'antraciet' })

  // Computed: Maximum number of elements based on width
  const maxElements = computed(() => {
    if (width.value < 200) return 2
    if (width.value < 300) return 3
    if (width.value < 400) return 5
    if (width.value < 500) return 6
    return 7
  })

  // Count windows for rolluik pricing
  const windowCount = computed(() => {
    return elements.value.filter(
      el => el.type === 'raam' || el.type === 'draai-kiepraam'
    ).length
  })

  // Computed: Price breakdown
  const priceBreakdown = computed<PriceBreakdown>(() => {
    // Base price
    const base = PRICING.BASE_PRICE

    // Model surcharge
    const model = dormerModel.value !== 'standaard' ? PRICING.MODEL_SURCHARGE : 0

    // Width surcharge
    const widthSurcharge = width.value > 200 ? (width.value - 200) * PRICING.WIDTH_PRICE_PER_CM : 0

    // Height surcharge
    const heightSurcharge = height.value > 120 ? (height.value - 120) * PRICING.HEIGHT_PRICE_PER_CM : 0

    // Elements surcharge
    let elementsSurcharge = 0
    elements.value.forEach(el => {
      if (el.type === 'draai-kiepraam') {
        elementsSurcharge += PRICING.DRAAI_KIEPRAAM_SURCHARGE
      } else if (el.type === 'tussenpaneel') {
        elementsSurcharge += PRICING.TUSSENPANEEL_SURCHARGE
      }
    })

    // Panel material surcharge
    const panelSurcharge = PRICING.PANEL_MATERIALS[panelMaterial.value]

    // Frame material surcharge
    const frameSurcharge = PRICING.FRAME_MATERIALS[frameMaterial.value]

    // Rolluiken
    const rolluikenSurcharge = hasRolluiken.value ? windowCount.value * PRICING.ROLLUIK_PRICE_PER_WINDOW : 0

    // Custom colors surcharge
    let colorSurcharge = 0
    if (frameColor.value.type === 'anders') colorSurcharge += PRICING.CUSTOM_COLOR_SURCHARGE
    if (exteriorColor.value.type === 'anders') colorSurcharge += PRICING.CUSTOM_COLOR_SURCHARGE
    if (fasciaColor.value.type === 'anders') colorSurcharge += PRICING.CUSTOM_COLOR_SURCHARGE

    const total =
      base +
      model +
      widthSurcharge +
      heightSurcharge +
      elementsSurcharge +
      panelSurcharge +
      frameSurcharge +
      rolluikenSurcharge +
      colorSurcharge

    return {
      base,
      model,
      width: widthSurcharge,
      height: heightSurcharge,
      elements: elementsSurcharge,
      panelMaterial: panelSurcharge,
      frameMaterial: frameSurcharge,
      rolluiken: rolluikenSurcharge,
      customColors: colorSurcharge,
      total
    }
  })

  // Actions
  function setRoofColor(color: RoofColor) {
    roofColor.value = color
  }

  function setDormerModel(model: DormerModel) {
    dormerModel.value = model
  }

  function setWidth(value: number) {
    width.value = Math.max(150, Math.min(600, value))
    // Adjust elements array when width changes
    updateElementsForWidth()
  }

  function setHeight(value: number) {
    height.value = Math.max(100, Math.min(200, value))
  }

  function setRoofAngle(value: number) {
    roofAngle.value = Math.max(20, Math.min(60, value))
  }

  function updateElementsForWidth() {
    const max = maxElements.value
    if (elements.value.length < max) {
      // Add more element slots
      while (elements.value.length < max) {
        elements.value.push({ position: elements.value.length, type: 'geen' })
      }
    } else if (elements.value.length > max) {
      // Remove excess elements
      elements.value = elements.value.slice(0, max)
    }
  }

  function setElementType(position: number, type: ElementType) {
    const element = elements.value.find(el => el.position === position)
    if (element) {
      element.type = type
    }
  }

  function setPanelMaterial(material: PanelMaterial) {
    panelMaterial.value = material
  }

  function setFrameMaterial(material: FrameMaterial) {
    frameMaterial.value = material
  }

  function setHasRolluiken(value: boolean) {
    hasRolluiken.value = value
  }

  function setFrameColor(color: CustomColor) {
    frameColor.value = color
  }

  function setExteriorColor(color: CustomColor) {
    exteriorColor.value = color
  }

  function setFasciaColor(color: CustomColor) {
    fasciaColor.value = color
  }

  function goToStep(step: number) {
    if (step >= 1 && step <= 4) {
      // Mark current step as completed if moving forward
      if (step > currentStep.value && !completedSteps.value.includes(currentStep.value)) {
        completedSteps.value.push(currentStep.value)
      }
      currentStep.value = step
    }
  }

  function nextStep() {
    if (currentStep.value < 4) {
      if (!completedSteps.value.includes(currentStep.value)) {
        completedSteps.value.push(currentStep.value)
      }
      currentStep.value++
    }
  }

  function previousStep() {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  function isStepCompleted(step: number): boolean {
    return completedSteps.value.includes(step)
  }

  function isStepAccessible(step: number): boolean {
    if (step === 1) return true
    // Can access step if all previous steps are completed
    for (let i = 1; i < step; i++) {
      if (!completedSteps.value.includes(i)) return false
    }
    return true
  }

  function formatPrice(amount: number): string {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return {
    // State
    currentStep,
    completedSteps,
    roofColor,
    dormerModel,
    width,
    height,
    roofAngle,
    elements,
    panelMaterial,
    frameMaterial,
    hasRolluiken,
    frameColor,
    exteriorColor,
    fasciaColor,

    // Computed
    maxElements,
    windowCount,
    priceBreakdown,

    // Actions
    setRoofColor,
    setDormerModel,
    setWidth,
    setHeight,
    setRoofAngle,
    setElementType,
    setPanelMaterial,
    setFrameMaterial,
    setHasRolluiken,
    setFrameColor,
    setExteriorColor,
    setFasciaColor,
    goToStep,
    nextStep,
    previousStep,
    isStepCompleted,
    isStepAccessible,
    formatPrice
  }
})
