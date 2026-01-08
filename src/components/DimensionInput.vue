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
    <label :for="inputId" class="dimension-label">{{ label }}</label>
    <div class="input-group">
      <input
        :id="inputId"
        type="number"
        class="input-field"
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
      <span class="input-suffix" aria-hidden="true">{{ suffix }}</span>
    </div>
    <input
      type="range"
      class="range-slider"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="stepValue"
      :aria-label="`${label} slider`"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="modelValue"
      @input="handleInput"
    />
    <div class="range-value" aria-hidden="true">
      <span>{{ min }} {{ suffix }}</span>
      <span>{{ max }} {{ suffix }}</span>
    </div>
  </div>
</template>

<style scoped>
.dimension-group {
  margin-bottom: 16px;
}

.dimension-label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-color);
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-field {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary-color);
}

.input-suffix {
  color: var(--text-light);
  font-weight: 500;
}

.range-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e0e0e0;
  outline: none;
  margin: 12px 0;
}

.range-slider:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.range-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
}

.range-value {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-light);
}
</style>
