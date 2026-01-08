<script setup lang="ts">
import { useConfiguratorStore } from '@/stores/configurator'
import type { PanelMaterial, FrameMaterial } from '@/types'

const store = useConfiguratorStore()

const panelMaterials: { value: PanelMaterial; label: string; description: string; price: string }[] = [
  {
    value: 'gladde-plaat',
    label: 'Gladde plaat',
    description: 'Strakke, gladde afwerking voor een moderne uitstraling.',
    price: 'Inbegrepen'
  },
  {
    value: 'keraliet',
    label: 'Keraliet',
    description: 'Duurzaam plaatmateriaal met een licht gestructureerd oppervlak.',
    price: '+ € 800,-'
  },
  {
    value: 'zink',
    label: 'Zink met felsbanen',
    description: 'Hoogwaardige afwerking met zichtbare felsnaden voor een ambachtelijke uitstraling.',
    price: '+ € 2.500,-'
  },
  {
    value: 'hout',
    label: 'Hout',
    description: 'Warme, natuurlijke uitstraling. Vereist periodiek onderhoud.',
    price: '+ € 1.200,-'
  }
]

const frameMaterials: { value: FrameMaterial; label: string; description: string; price: string }[] = [
  {
    value: 'kunststof',
    label: 'Kunststof',
    description: 'Onderhoudsarm en duurzaam. De meest gekozen optie.',
    price: 'Inbegrepen'
  },
  {
    value: 'hout',
    label: 'Hout',
    description: 'Klassieke uitstraling maar vereist meer onderhoud.',
    price: '+ € 3.500,-'
  }
]
</script>

<template>
  <div class="step-materials">
    <h2 class="step-title">Stap 3: Materialen</h2>
    <p class="step-description">
      Kies de materialen voor de verschillende onderdelen van de dakkapel.
    </p>

    <div class="form-section">
      <label class="form-label">
        Tussenpanelen en zijkanten
        <span class="form-hint">Het materiaal voor de zijkanten en eventuele tussenpanelen</span>
      </label>
      <div class="model-cards">
        <div
          v-for="material in panelMaterials"
          :key="material.value"
          class="model-card"
          :class="{ selected: store.panelMaterial === material.value }"
          @click="store.setPanelMaterial(material.value)"
        >
          <div class="model-card-header">
            <span class="model-card-title">{{ material.label }}</span>
            <span
              class="model-card-price"
              :class="{ included: material.value === 'gladde-plaat' }"
            >
              {{ material.price }}
            </span>
          </div>
          <p class="model-card-description">{{ material.description }}</p>
        </div>
      </div>
    </div>

    <div class="form-section">
      <label class="form-label">
        Kozijnen
        <span class="form-hint">Het materiaal voor de raamkozijnen</span>
      </label>
      <div class="option-cards" style="grid-template-columns: repeat(2, 1fr);">
        <div
          v-for="material in frameMaterials"
          :key="material.value"
          class="option-card frame-card"
          :class="{ selected: store.frameMaterial === material.value }"
          @click="store.setFrameMaterial(material.value)"
        >
          <span class="option-card-title">{{ material.label }}</span>
          <p class="frame-description">{{ material.description }}</p>
          <span
            class="option-card-price"
            :class="{ 'option-card-included': material.value === 'kunststof' }"
          >
            {{ material.price }}
          </span>
        </div>
      </div>
    </div>

    <div class="form-section">
      <label class="form-label">
        Rolluiken
        <span class="form-hint">
          Wilt u rolluiken bij de ramen? ({{ store.windowCount }} {{ store.windowCount === 1 ? 'raam' : 'ramen' }})
        </span>
      </label>
      <div class="toggle-group">
        <div
          class="toggle-option"
          :class="{ selected: !store.hasRolluiken }"
          @click="store.setHasRolluiken(false)"
        >
          <strong>Nee</strong>
          <p class="toggle-description">Geen rolluiken</p>
          <span class="toggle-price included">Inbegrepen</span>
        </div>
        <div
          class="toggle-option"
          :class="{ selected: store.hasRolluiken }"
          @click="store.setHasRolluiken(true)"
        >
          <strong>Ja</strong>
          <p class="toggle-description">Rolluiken bij alle ramen</p>
          <span class="toggle-price">
            + {{ store.formatPrice(store.windowCount * 650) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
</style>
