<script setup lang="ts">
import { computed } from 'vue'
import { useConfiguratorStore } from '@/stores/configurator'

const store = useConfiguratorStore()

// Step configuration - could be moved to constants file if needed elsewhere
const STEPS = [
  { number: 1, label: 'Model' },
  { number: 2, label: 'Formaat' },
  { number: 3, label: 'Materialen' },
  { number: 4, label: 'Kleuren' },
  { number: 5, label: 'Gegevens' }
] as const

// Computed step states for cleaner template
const stepStates = computed(() => {
  return STEPS.map(step => {
    const isCompleted = store.isStepCompleted(step.number)
    const isActive = store.currentStep === step.number
    // Hide step 5 label until step >= 3, hide completed step labels unless active
    const showLabel = (step.number !== 5 || store.currentStep >= 3) &&
                      (!isCompleted || isActive)
    return {
      ...step,
      isActive,
      isCompleted,
      isAccessible: store.isStepAccessible(step.number),
      isDisabled: !store.isStepAccessible(step.number) && store.currentStep !== step.number,
      showLabel
    }
  })
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
      <template v-for="step in stepStates" :key="step.number">
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
            <span v-if="step.showLabel" class="step-label">{{ step.label }}</span>
          </div>
        </li>
      </template>
    </ol>
  </nav>
</template>

<style scoped>
.step-nav {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.step-list {
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: nowrap;
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.step-list::-webkit-scrollbar {
  display: none;
}

.step-item {
  display: contents;
}

.step-nav-item {
  flex-shrink: 0;
  white-space: nowrap;
}

.step-nav-item:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.step-nav-item:focus:not(:focus-visible) {
  outline: none;
}

/* Mobile: Ensure horizontal scroll works */
@media (max-width: 768px) {
  .step-list {
    gap: 4px;
    margin: 0 0 4px;
    padding: 2px 4px;
  }

  .step-nav-item {
    padding: 3px 6px;
    font-size: 0.75rem;
    gap: 4px;
    border-width: 1.5px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .step-label {
    display: inline;
  }
}

@media (max-width: 400px) {
  .step-nav-item {
    padding: 4px 8px;
    font-size: 0.7rem;
  }
}
</style>
