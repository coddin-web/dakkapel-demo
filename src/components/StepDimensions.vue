<script setup lang="ts">
import { useConfiguratorStore } from '@/stores/configurator'
import { ELEMENT_LABELS, type ElementType } from '@/types'
import DimensionInput from '@/components/DimensionInput.vue'

const store = useConfiguratorStore()

const elementTypes: ElementType[] = ['geen', 'raam', 'draai-kiepraam', 'tussenpaneel']

function updateWidth(value: number) {
  store.setWidth(value)
}

function updateHeight(value: number) {
  store.setHeight(value)
}

function updateRoofAngle(value: number) {
  store.setRoofAngle(value)
}
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
        <DimensionInput
          label="Breedte (cm)"
          :model-value="store.width"
          :min="150"
          :max="600"
          :step="10"
          suffix="cm"
          @update:model-value="updateWidth"
        />

        <DimensionInput
          label="Hoogte (cm)"
          :model-value="store.height"
          :min="100"
          :max="200"
          :step="5"
          suffix="cm"
          @update:model-value="updateHeight"
        />

        <DimensionInput
          label="Dakhelling (graden)"
          :model-value="store.roofAngle"
          :min="20"
          :max="60"
          :step="1"
          suffix="°"
          @update:model-value="updateRoofAngle"
        />
      </div>
    </div>

    <div class="form-section">
      <label id="elements-label" class="form-label">
        Elementen
        <span class="form-hint">
          Kies voor elke positie het gewenste element.
          Bij huidige breedte zijn {{ store.maxElements }} posities beschikbaar.
        </span>
      </label>

      <div class="elements-grid" role="group" aria-labelledby="elements-label">
        <div
          v-for="element in store.elements"
          :key="element.position"
          class="element-slot"
        >
          <label :for="`element-${element.position}`" class="element-slot-label">
            Positie {{ element.position + 1 }}
          </label>
          <select
            :id="`element-${element.position}`"
            class="element-select"
            :value="element.type"
            :aria-label="`Element type voor positie ${element.position + 1}`"
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
</style>
