<script setup lang="ts">
import { useConfiguratorStore } from '@/stores/configurator'
import { ELEMENT_LABELS, type ElementType } from '@/types'

const store = useConfiguratorStore()

const elementTypes: ElementType[] = ['geen', 'raam', 'draai-kiepraam', 'tussenpaneel']
</script>

<template>
  <div class="step-dimensions">
    <h2 class="step-title">Stap 2: Afmetingen</h2>
    <p class="step-description">
      Voer de gewenste afmetingen in en bepaal welke elementen in de dakkapel komen.
    </p>

    <div class="form-section">
      <label class="form-label">Maatvoering</label>

      <div class="dimension-inputs">
        <div class="dimension-group">
          <label class="dimension-label">Breedte (cm)</label>
          <div class="input-group">
            <input
              type="number"
              class="input-field"
              :value="store.width"
              @input="store.setWidth(Number(($event.target as HTMLInputElement).value))"
              min="150"
              max="600"
            />
            <span class="input-suffix">cm</span>
          </div>
          <input
            type="range"
            class="range-slider"
            :value="store.width"
            @input="store.setWidth(Number(($event.target as HTMLInputElement).value))"
            min="150"
            max="600"
            step="10"
          />
          <div class="range-value">
            <span>150 cm</span>
            <span>600 cm</span>
          </div>
        </div>

        <div class="dimension-group">
          <label class="dimension-label">Hoogte (cm)</label>
          <div class="input-group">
            <input
              type="number"
              class="input-field"
              :value="store.height"
              @input="store.setHeight(Number(($event.target as HTMLInputElement).value))"
              min="100"
              max="200"
            />
            <span class="input-suffix">cm</span>
          </div>
          <input
            type="range"
            class="range-slider"
            :value="store.height"
            @input="store.setHeight(Number(($event.target as HTMLInputElement).value))"
            min="100"
            max="200"
            step="5"
          />
          <div class="range-value">
            <span>100 cm</span>
            <span>200 cm</span>
          </div>
        </div>

        <div class="dimension-group">
          <label class="dimension-label">Dakhelling (graden)</label>
          <div class="input-group">
            <input
              type="number"
              class="input-field"
              :value="store.roofAngle"
              @input="store.setRoofAngle(Number(($event.target as HTMLInputElement).value))"
              min="20"
              max="60"
            />
            <span class="input-suffix">°</span>
          </div>
          <input
            type="range"
            class="range-slider"
            :value="store.roofAngle"
            @input="store.setRoofAngle(Number(($event.target as HTMLInputElement).value))"
            min="20"
            max="60"
            step="1"
          />
          <div class="range-value">
            <span>20°</span>
            <span>60°</span>
          </div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <label class="form-label">
        Elementen
        <span class="form-hint">
          Kies voor elke positie het gewenste element.
          Bij huidige breedte zijn {{ store.maxElements }} posities beschikbaar.
        </span>
      </label>

      <div class="elements-grid">
        <div
          v-for="element in store.elements"
          :key="element.position"
          class="element-slot"
        >
          <div class="element-slot-label">Positie {{ element.position + 1 }}</div>
          <select
            class="element-select"
            :value="element.type"
            @change="store.setElementType(element.position, ($event.target as HTMLSelectElement).value as ElementType)"
          >
            <option
              v-for="type in elementTypes"
              :key="type"
              :value="type"
            >
              {{ ELEMENT_LABELS[type] }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dimension-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.dimension-group {
  margin-bottom: 16px;
}

.dimension-label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-color);
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
</style>
