<script setup lang="ts">
import { useConfiguratorStore } from '@/stores/configurator'

const store = useConfiguratorStore()

const steps = [
  { number: 1, label: 'Model' },
  { number: 2, label: 'Afmetingen' },
  { number: 3, label: 'Materialen' },
  { number: 4, label: 'Kleuren' }
]
</script>

<template>
  <nav class="step-nav">
    <template v-for="(step, index) in steps" :key="step.number">
      <div
        class="step-nav-item"
        :class="{
          active: store.currentStep === step.number,
          completed: store.isStepCompleted(step.number),
          disabled: !store.isStepAccessible(step.number) && store.currentStep !== step.number
        }"
        @click="store.isStepAccessible(step.number) && store.goToStep(step.number)"
      >
        <span class="step-number">
          <span v-if="store.isStepCompleted(step.number)" class="checkmark">✓</span>
          <span v-else>{{ step.number }}</span>
        </span>
        <span class="step-label">{{ step.label }}</span>
      </div>
      <div v-if="index < steps.length - 1" class="step-connector">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </template>
  </nav>
</template>
