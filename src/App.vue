<script setup lang="ts">
import { useConfiguratorStore } from '@/stores/configurator'
import StepNavigation from '@/components/StepNavigation.vue'
import StepModel from '@/components/StepModel.vue'
import StepDimensions from '@/components/StepDimensions.vue'
import StepMaterials from '@/components/StepMaterials.vue'
import StepColors from '@/components/StepColors.vue'
import PreviewPanel from '@/components/PreviewPanel.vue'

const store = useConfiguratorStore()

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
      <main class="step-panel">
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
