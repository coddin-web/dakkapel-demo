<script setup lang="ts">
import { useConfiguratorStore } from '@/stores/configurator'

const store = useConfiguratorStore()

const steps = [
  { number: 1, label: 'Model' },
  { number: 2, label: 'Afmetingen' },
  { number: 3, label: 'Materialen' },
  { number: 4, label: 'Kleuren' }
]

function handleStepClick(stepNumber: number) {
  if (store.isStepAccessible(stepNumber)) {
    store.goToStep(stepNumber)
  }
}

function handleKeydown(event: KeyboardEvent, stepNumber: number) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleStepClick(stepNumber)
  }
}
</script>

<template>
  <nav class="step-nav" role="navigation" aria-label="Configurator stappen">
    <ol class="step-list" role="list">
      <template v-for="(step, index) in steps" :key="step.number">
        <li class="step-item">
          <div
            class="step-nav-item"
            :class="{
              active: store.currentStep === step.number,
              completed: store.isStepCompleted(step.number),
              disabled: !store.isStepAccessible(step.number) && store.currentStep !== step.number
            }"
            role="button"
            :tabindex="store.isStepAccessible(step.number) ? 0 : -1"
            :aria-current="store.currentStep === step.number ? 'step' : undefined"
            :aria-disabled="!store.isStepAccessible(step.number) && store.currentStep !== step.number"
            :aria-label="`Stap ${step.number}: ${step.label}${store.isStepCompleted(step.number) ? ' (voltooid)' : ''}`"
            @click="handleStepClick(step.number)"
            @keydown="handleKeydown($event, step.number)"
          >
            <span class="step-number" aria-hidden="true">
              <span v-if="store.isStepCompleted(step.number)" class="checkmark">✓</span>
              <span v-else>{{ step.number }}</span>
            </span>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </li>
        <li v-if="index < steps.length - 1" class="step-connector" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </li>
      </template>
    </ol>
  </nav>
</template>

<style scoped>
.step-list {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  list-style: none;
  margin: 0 0 30px;
  padding: 0;
}

.step-item {
  display: contents;
}

.step-nav-item:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.step-nav-item:focus:not(:focus-visible) {
  outline: none;
}
</style>
