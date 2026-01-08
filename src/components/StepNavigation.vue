<script setup lang="ts">
import { computed } from 'vue'
import { useConfiguratorStore } from '@/stores/configurator'

const store = useConfiguratorStore()

// Step configuration - could be moved to constants file if needed elsewhere
const STEPS = [
  { number: 1, label: 'Model' },
  { number: 2, label: 'Afmetingen' },
  { number: 3, label: 'Materialen' },
  { number: 4, label: 'Kleuren' }
] as const

// Computed step states for cleaner template
const stepStates = computed(() => {
  return STEPS.map(step => ({
    ...step,
    isActive: store.currentStep === step.number,
    isCompleted: store.isStepCompleted(step.number),
    isAccessible: store.isStepAccessible(step.number),
    isDisabled: !store.isStepAccessible(step.number) && store.currentStep !== step.number
  }))
})

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
      <template v-for="(step, index) in stepStates" :key="step.number">
        <li class="step-item">
          <div
            class="step-nav-item"
            :class="{
              active: step.isActive,
              completed: step.isCompleted,
              disabled: step.isDisabled
            }"
            role="button"
            :tabindex="step.isAccessible ? 0 : -1"
            :aria-current="step.isActive ? 'step' : undefined"
            :aria-disabled="step.isDisabled"
            :aria-label="`Stap ${step.number}: ${step.label}${step.isCompleted ? ' (voltooid)' : ''}`"
            @click="handleStepClick(step.number)"
            @keydown="handleKeydown($event, step.number)"
          >
            <span class="step-number" aria-hidden="true">
              <span v-if="step.isCompleted" class="checkmark">✓</span>
              <span v-else>{{ step.number }}</span>
            </span>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </li>
        <li v-if="index < stepStates.length - 1" class="step-connector" aria-hidden="true">
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

/* Mobile: Hide connectors and show compact view */
@media (max-width: 600px) {
  .step-list {
    gap: 4px;
  }

  .step-connector {
    display: none;
  }

  .step-nav-item {
    padding: 10px 12px;
    font-size: 0.85rem;
  }

  .step-label {
    display: none;
  }

  .step-nav-item.active .step-label {
    display: inline;
  }
}
</style>
