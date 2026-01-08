<script setup lang="ts">
import { useConfiguratorStore } from '@/stores/configurator'
import SelectionCard from '@/components/SelectionCard.vue'
import type { RoofColor, DormerModel, DormerRoofType } from '@/types'

const store = useConfiguratorStore()

const roofColors: { value: RoofColor; label: string; hex: string }[] = [
  { value: 'oranje-rood', label: 'Oranje-rood', hex: '#c45d35' },
  { value: 'zwart', label: 'Zwart', hex: '#2c2c2c' }
]

const dormerRoofTypes: { value: DormerRoofType; label: string; description: string; price: string }[] = [
  {
    value: 'plat',
    label: 'Plat dak',
    description: 'Moderne uitstraling met een plat dak op de dakkapel.',
    price: 'Inbegrepen'
  },
  {
    value: 'schuin',
    label: 'Schuin dak (pannendak)',
    description: 'Traditionele uitstraling met dakpannen die aansluiten op uw bestaande dak.',
    price: '+ € 2.500,-'
  }
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
      <div class="roof-color-cards">
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
        Dakkapel daktype
        <span class="form-hint">Kies het type dak voor uw dakkapel</span>
      </label>
      <div class="card-grid">
        <SelectionCard
          v-for="roofType in dormerRoofTypes"
          :key="roofType.value"
          :title="roofType.label"
          :description="roofType.description"
          :price="roofType.price"
          :is-included="roofType.value === 'plat'"
          :selected="store.dormerRoofType === roofType.value"
          @select="store.setDormerRoofType(roofType.value)"
        />
      </div>
    </div>

    <div class="form-section">
      <label class="form-label">
        Dakkapelmodel
        <span class="form-hint">Kies het model dat het beste bij uw woning past</span>
      </label>
      <div class="card-grid">
        <SelectionCard
          v-for="model in models"
          :key="model.value"
          :title="model.label"
          :description="model.description"
          :price="model.price"
          :is-included="model.value === 'standaard'"
          :selected="store.dormerModel === model.value"
          @select="store.setDormerModel(model.value)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.roof-color-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

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

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 600px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
