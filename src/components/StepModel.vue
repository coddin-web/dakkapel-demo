<script setup lang="ts">
import { useConfiguratorStore } from '@/stores/configurator'
import type { RoofColor, DormerModel } from '@/types'

const store = useConfiguratorStore()

const roofColors: { value: RoofColor; label: string; hex: string }[] = [
  { value: 'oranje-rood', label: 'Oranje-rood', hex: '#c45d35' },
  { value: 'zwart', label: 'Zwart', hex: '#2c2c2c' }
]

const models: { value: DormerModel; label: string; description: string; price: string }[] = [
  {
    value: 'standaard',
    label: 'Standaard model',
    description: 'Het basismodel met een strakke, moderne uitstraling. Geschikt voor de meeste woningen.',
    price: 'Inbegrepen'
  },
  {
    value: 'kader',
    label: 'Kadermodel',
    description: 'Een model met een decoratief kader rondom de dakkapel voor een meer verfijnde uitstraling.',
    price: '+ € 6.000,-'
  },
  {
    value: 'klassiek',
    label: 'Klassiek model',
    description: 'Een traditioneel ogend model dat goed past bij oudere woningen of klassieke bouwstijl.',
    price: '+ € 7.500,-'
  },
  {
    value: 'nokverhoging',
    label: 'Nokverhoging',
    description: 'Een bijzondere variant waarbij de nok van het dak wordt verhoogd voor extra ruimte.',
    price: '+ € 12.000,-'
  }
]
</script>

<template>
  <div class="step-model">
    <h2 class="step-title">Stap 1: Kies Model</h2>
    <p class="step-description">
      Selecteer de kleur van uw bestaande dak en kies het gewenste dakkapelmodel.
    </p>

    <div class="form-section">
      <label class="form-label">
        Dakkleur
        <span class="form-hint">Welke kleur heeft uw huidige dak?</span>
      </label>
      <div class="option-cards">
        <div
          v-for="color in roofColors"
          :key="color.value"
          class="option-card"
          :class="{ selected: store.roofColor === color.value }"
          @click="store.setRoofColor(color.value)"
        >
          <div
            class="color-preview"
            :style="{ backgroundColor: color.hex }"
          ></div>
          <span class="option-card-title">{{ color.label }}</span>
          <span v-if="color.value === 'oranje-rood'" class="option-card-included">Standaard</span>
        </div>
      </div>
    </div>

    <div class="form-section">
      <label class="form-label">
        Dakkapelmodel
        <span class="form-hint">Kies het model dat het beste bij uw woning past</span>
      </label>
      <div class="model-cards">
        <div
          v-for="model in models"
          :key="model.value"
          class="model-card"
          :class="{ selected: store.dormerModel === model.value }"
          @click="store.setDormerModel(model.value)"
        >
          <div class="model-card-header">
            <span class="model-card-title">{{ model.label }}</span>
            <span
              class="model-card-price"
              :class="{ included: model.value === 'standaard' }"
            >
              {{ model.price }}
            </span>
          </div>
          <p class="model-card-description">{{ model.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-preview {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 3px solid #ddd;
  margin-bottom: 8px;
}

.option-card.selected .color-preview {
  border-color: var(--primary-color);
}
</style>
