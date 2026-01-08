<script setup lang="ts">
import { computed } from 'vue'
import { useConfiguratorStore, PRICING, DEFAULTS } from '@/stores/configurator'
import type { PanelMaterial, FrameMaterial } from '@/types'

const store = useConfiguratorStore()

interface MaterialOption<T> {
  value: T
  label: string
  description: string
}

const panelMaterials: MaterialOption<PanelMaterial>[] = [
  {
    value: 'gladde-plaat',
    label: 'Gladde plaat',
    description: 'Strakke, gladde afwerking voor een moderne uitstraling.'
  },
  {
    value: 'keraliet',
    label: 'Keraliet',
    description: 'Duurzaam plaatmateriaal met een licht gestructureerd oppervlak.'
  },
  {
    value: 'zink',
    label: 'Zink met felsbanen',
    description: 'Hoogwaardige afwerking met zichtbare felsnaden voor een ambachtelijke uitstraling.'
  },
  {
    value: 'hout',
    label: 'Hout',
    description: 'Warme, natuurlijke uitstraling. Vereist periodiek onderhoud.'
  }
]

const frameMaterials: MaterialOption<FrameMaterial>[] = [
  {
    value: 'kunststof',
    label: 'Kunststof',
    description: 'Onderhoudsarm en duurzaam. De meest gekozen optie.'
  },
  {
    value: 'hout',
    label: 'Hout',
    description: 'Klassieke uitstraling maar vereist meer onderhoud.'
  }
]

function getPanelPrice(value: PanelMaterial): string {
  const price = PRICING.PANEL_MATERIALS[value]
  return price === 0 ? 'Inbegrepen' : `+ ${store.formatPrice(price)}`
}

function getFramePrice(value: FrameMaterial): string {
  const price = PRICING.FRAME_MATERIALS[value]
  return price === 0 ? 'Inbegrepen' : `+ ${store.formatPrice(price)}`
}

function isDefaultPanelMaterial(value: PanelMaterial): boolean {
  return value === DEFAULTS.PANEL_MATERIAL
}

function isDefaultFrameMaterial(value: FrameMaterial): boolean {
  return value === DEFAULTS.FRAME_MATERIAL
}

const rolluikenPrice = computed(() => {
  return store.windowCount * PRICING.ROLLUIK_PRICE_PER_WINDOW
})

function handleKeydown(event: KeyboardEvent, callback: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    callback()
  }
}
</script>

<template>
  <div class="step-materials">
    <h2 class="step-title">Stap 3: Materialen</h2>
    <p class="step-description">
      Kies de materialen voor de verschillende onderdelen van de dakkapel.
    </p>

    <div class="form-section">
      <label id="panel-material-label" class="form-label">
        Tussenpanelen en zijkanten
        <span class="form-hint">Het materiaal voor de zijkanten en eventuele tussenpanelen</span>
      </label>
      <div class="model-cards" role="radiogroup" aria-labelledby="panel-material-label">
        <div
          v-for="material in panelMaterials"
          :key="material.value"
          class="model-card"
          :class="{ selected: store.panelMaterial === material.value }"
          role="radio"
          :aria-checked="store.panelMaterial === material.value"
          :aria-label="`${material.label}: ${material.description} - ${getPanelPrice(material.value)}`"
          tabindex="0"
          @click="store.setPanelMaterial(material.value)"
          @keydown="handleKeydown($event, () => store.setPanelMaterial(material.value))"
        >
          <div class="model-card-header">
            <span class="model-card-title">{{ material.label }}</span>
            <span
              class="model-card-price"
              :class="{ included: isDefaultPanelMaterial(material.value) }"
            >
              {{ getPanelPrice(material.value) }}
            </span>
          </div>
          <p class="model-card-description">{{ material.description }}</p>
        </div>
      </div>
    </div>

    <div class="form-section">
      <label id="frame-material-label" class="form-label">
        Kozijnen
        <span class="form-hint">Het materiaal voor de raamkozijnen</span>
      </label>
      <div class="option-cards frame-cards-grid" role="radiogroup" aria-labelledby="frame-material-label">
        <div
          v-for="material in frameMaterials"
          :key="material.value"
          class="option-card frame-card"
          :class="{ selected: store.frameMaterial === material.value }"
          role="radio"
          :aria-checked="store.frameMaterial === material.value"
          :aria-label="`${material.label}: ${material.description} - ${getFramePrice(material.value)}`"
          tabindex="0"
          @click="store.setFrameMaterial(material.value)"
          @keydown="handleKeydown($event, () => store.setFrameMaterial(material.value))"
        >
          <span class="option-card-title">{{ material.label }}</span>
          <p class="frame-description">{{ material.description }}</p>
          <span
            class="option-card-price"
            :class="{ 'option-card-included': isDefaultFrameMaterial(material.value) }"
          >
            {{ getFramePrice(material.value) }}
          </span>
        </div>
      </div>
    </div>

    <div class="form-section">
      <label id="rolluiken-label" class="form-label">
        Rolluiken
        <span class="form-hint">
          Wilt u rolluiken bij de ramen? ({{ store.windowCount }} {{ store.windowCount === 1 ? 'raam' : 'ramen' }})
        </span>
      </label>
      <div class="toggle-group" role="radiogroup" aria-labelledby="rolluiken-label">
        <div
          class="toggle-option"
          :class="{ selected: !store.hasRolluiken }"
          role="radio"
          :aria-checked="!store.hasRolluiken"
          aria-label="Geen rolluiken - Inbegrepen"
          tabindex="0"
          @click="store.setHasRolluiken(false)"
          @keydown="handleKeydown($event, () => store.setHasRolluiken(false))"
        >
          <strong>Nee</strong>
          <p class="toggle-description">Geen rolluiken</p>
          <span class="toggle-price included">Inbegrepen</span>
        </div>
        <div
          class="toggle-option"
          :class="{ selected: store.hasRolluiken }"
          role="radio"
          :aria-checked="store.hasRolluiken"
          :aria-label="`Rolluiken bij alle ramen - ${store.formatPrice(rolluikenPrice)}`"
          tabindex="0"
          @click="store.setHasRolluiken(true)"
          @keydown="handleKeydown($event, () => store.setHasRolluiken(true))"
        >
          <strong>Ja</strong>
          <p class="toggle-description">Rolluiken bij alle ramen</p>
          <span class="toggle-price">
            + {{ store.formatPrice(rolluikenPrice) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.frame-cards-grid {
  grid-template-columns: repeat(2, 1fr);
}

.frame-card {
  padding: 20px;
  text-align: left;
  align-items: flex-start;
}

.frame-description {
  font-size: 0.85rem;
  color: var(--text-light);
  margin: 8px 0;
}

.toggle-description {
  font-size: 0.85rem;
  color: var(--text-light);
  margin: 4px 0;
}

.toggle-price {
  font-weight: 600;
  color: var(--accent-color);
  margin-top: 8px;
}

.toggle-price.included {
  color: var(--success-color);
}

.model-card:focus,
.option-card:focus,
.toggle-option:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.model-card:focus:not(:focus-visible),
.option-card:focus:not(:focus-visible),
.toggle-option:focus:not(:focus-visible) {
  outline: none;
}

@media (max-width: 480px) {
  .frame-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
