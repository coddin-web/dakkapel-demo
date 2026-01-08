<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useConfiguratorStore } from '@/stores/configurator'
import StepNavigation from '@/components/StepNavigation.vue'
import StepModel from '@/components/StepModel.vue'
import StepDimensions from '@/components/StepDimensions.vue'
import StepMaterials from '@/components/StepMaterials.vue'
import StepColors from '@/components/StepColors.vue'
import PreviewPanel from '@/components/PreviewPanel.vue'

const store = useConfiguratorStore()

const stepPanelRef = ref<HTMLElement | null>(null)
const hasScrolledToBottom = ref(true)

function checkScrollPosition() {
  const panel = stepPanelRef.value
  if (!panel) return

  const threshold = 20 // pixels from bottom
  const isAtBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < threshold
  const hasNoScroll = panel.scrollHeight <= panel.clientHeight

  hasScrolledToBottom.value = isAtBottom || hasNoScroll
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

function requestQuote() {
  window.alert('Offerte aanvragen functionaliteit - Hier komt het offerteformulier')
}
</script>

<template>
  <div class="configurator">
    <header class="configurator-header">
      <h1>Wiko Dakkapel Configurator</h1>
      <p>Stel uw ideale dakkapel samen in vier eenvoudige stappen</p>
    </header>

    <StepNavigation />

    <div class="configurator-content">
      <main ref="stepPanelRef" class="step-panel" @scroll="checkScrollPosition">
        <StepModel v-if="store.currentStep === 1" />
        <StepDimensions v-if="store.currentStep === 2" />
        <StepMaterials v-if="store.currentStep === 3" />
        <StepColors v-if="store.currentStep === 4" />
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
        v-if="store.currentStep < 4"
        class="btn btn-primary"
        :disabled="!hasScrolledToBottom"
        @click="store.nextStep()"
      >
        Volgende
      </button>
      <button
        v-if="store.currentStep === 4"
        class="btn btn-accent"
        @click="requestQuote"
      >
        Vraag offerte aan
      </button>
    </div>
  </div>
</template>
