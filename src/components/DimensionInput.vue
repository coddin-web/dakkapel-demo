<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  modelValue: number
  min: number
  max: number
  step?: number
  suffix: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const inputId = computed(() => `dimension-${props.label.toLowerCase().replace(/\s+/g, '-')}`)
const stepValue = computed(() => props.step ?? 1)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)

  if (!Number.isNaN(value)) {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <div class="dimension-group">
    <div class="dimension-header">
      <label :for="inputId" class="dimension-label">{{ label }}</label>
      <span class="dimension-value">{{ modelValue }}{{ suffix }}</span>
    </div>
    <input
      :id="inputId"
      type="range"
      class="range-slider"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="stepValue"
      :aria-label="label"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="modelValue"
      @input="handleInput"
    />
    <div class="range-labels" aria-hidden="true">
      <span>{{ min }}{{ suffix }}</span>
      <span>{{ max }}{{ suffix }}</span>
    </div>
  </div>
</template>

<style scoped>
.dimension-group {
  margin-bottom: 8px;
}

.dimension-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dimension-label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.9rem;
}

.dimension-value {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.range-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
}

.range-slider:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.range-slider::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--gray-400);
  margin-top: 4px;
}
</style>
