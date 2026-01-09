<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useConfiguratorStore } from '@/stores/configurator'
import StepNavigation from '@/components/StepNavigation.vue'
import StepModel from '@/components/StepModel.vue'
import StepDimensions from '@/components/StepDimensions.vue'
import StepMaterials from '@/components/StepMaterials.vue'
import StepColors from '@/components/StepColors.vue'
import StepContact from '@/components/StepContact.vue'
import PreviewPanel from '@/components/PreviewPanel.vue'

const store = useConfiguratorStore()

const stepPanelRef = ref<HTMLElement | null>(null)
const hasScrolledToBottom = ref(true)

function checkScrollPosition() {
  // Once scrolled to bottom, stay active - don't re-disable
  if (hasScrolledToBottom.value) return

  const panel = stepPanelRef.value
  if (!panel) return

  const threshold = 20 // pixels from bottom
  const isAtBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < threshold
  const hasNoScroll = panel.scrollHeight <= panel.clientHeight

  if (isAtBottom || hasNoScroll) {
    hasScrolledToBottom.value = true
  }
}

function resetAndCheckScroll() {
  hasScrolledToBottom.value = false
  nextTick(() => {
    const panel = stepPanelRef.value
    if (panel) {
      panel.scrollTop = 0
      checkScrollPosition()
    }
  })
}

// Reset scroll state when step changes
watch(() => store.currentStep, (newStep, oldStep) => {
  resetAndCheckScroll()

  // Push history state when step changes (but not on initial load or popstate)
  if (oldStep !== undefined && !isPopstateNavigation) {
    history.pushState({ step: newStep }, '', `#stap-${newStep}`)
  }
  isPopstateNavigation = false
})

// Track if navigation is from browser back/forward
let isPopstateNavigation = false

function handlePopState(event: PopStateEvent) {
  if (event.state?.step) {
    isPopstateNavigation = true
    store.goToStep(event.state.step)
  }
}

onMounted(() => {
  checkScrollPosition()

  // Set initial history state
  const initialStep = store.currentStep
  history.replaceState({ step: initialStep }, '', `#stap-${initialStep}`)

  // Listen for back/forward navigation
  window.addEventListener('popstate', handlePopState)
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
})

const showSubmitResult = ref(false)
const submittedData = ref('')

function getSubmitData() {
  return {
    contact: { ...store.contact },
    configuration: {
      model: store.dormerModel,
      roofColor: store.roofColor,
      dimensions: {
        width: store.width,
        height: store.height,
        roofAngle: store.roofAngle
      },
      elements: store.elements,
      materials: {
        panel: store.panelMaterial,
        frame: store.frameMaterial,
        hasRolluiken: store.hasRolluiken
      },
      colors: {
        frame: store.frameColor,
        exterior: store.exteriorColor,
        fascia: store.fasciaColor
      }
    },
    pricing: store.priceBreakdown
  }
}

function submitQuote() {
  const data = getSubmitData()
  submittedData.value = JSON.stringify(data, null, 2)
  showSubmitResult.value = true
}

function closeResult() {
  showSubmitResult.value = false
}
</script>

<template>
  <div class="configurator">
    <StepNavigation />

    <div class="configurator-content">
      <main ref="stepPanelRef" class="step-panel" @scroll="checkScrollPosition">
        <StepModel v-if="store.currentStep === 1" />
        <StepDimensions v-if="store.currentStep === 2" />
        <StepMaterials v-if="store.currentStep === 3" />
        <StepColors v-if="store.currentStep === 4" />
        <StepContact v-if="store.currentStep === 5" />
      </main>

      <aside class="preview-panel">
        <PreviewPanel />
      </aside>
    </div>

    <div class="btn-group">
      <button
        v-if="store.currentStep > 1"
        class="btn btn-secondary"
        @click="store.previousStep()"
      >
        Vorige
      </button>
      <button
        v-if="store.currentStep < store.TOTAL_STEPS"
        class="btn btn-primary"
        :disabled="!hasScrolledToBottom"
        @click="store.nextStep()"
      >
        Volgende
      </button>
      <button
        v-if="store.currentStep === store.TOTAL_STEPS"
        class="btn btn-accent"
        @click="submitQuote"
      >
        Verstuur aanvraag
      </button>
    </div>

    <!-- Submit Result Modal -->
    <div v-if="showSubmitResult" class="modal-overlay" @click="closeResult">
      <div class="modal-content" @click.stop>
        <h3>Gegevens die verzonden worden:</h3>
        <pre class="json-output">{{ submittedData }}</pre>
        <button class="btn btn-primary" @click="closeResult">Sluiten</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: auto;
}

.modal-content h3 {
  margin-bottom: 16px;
  color: var(--primary-color);
}

.json-output {
  background: var(--secondary-color);
  padding: 16px;
  border-radius: var(--radius);
  font-size: 0.75rem;
  overflow-x: auto;
  margin-bottom: 16px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
