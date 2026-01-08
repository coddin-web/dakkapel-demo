<script setup lang="ts">
import { computed } from 'vue'
import { useConfiguratorStore } from '@/stores/configurator'
import { RAL_COLORS } from '@/types'
import DormerVisual from '@/components/DormerVisual.vue'

const store = useConfiguratorStore()

const priceBreakdownItems = computed(() => {
  const breakdown = store.priceBreakdown
  const items = []

  items.push({ label: 'Basisprijs', value: breakdown.base })

  if (breakdown.model > 0) {
    items.push({ label: 'Modelkeuze', value: breakdown.model })
  }
  if (breakdown.width > 0) {
    items.push({ label: 'Breedte toeslag', value: breakdown.width })
  }
  if (breakdown.height > 0) {
    items.push({ label: 'Hoogte toeslag', value: breakdown.height })
  }
  if (breakdown.elements > 0) {
    items.push({ label: 'Elementen', value: breakdown.elements })
  }
  if (breakdown.panelMaterial > 0) {
    items.push({ label: 'Paneelmateriaal', value: breakdown.panelMaterial })
  }
  if (breakdown.frameMaterial > 0) {
    items.push({ label: 'Kozijnmateriaal', value: breakdown.frameMaterial })
  }
  if (breakdown.rolluiken > 0) {
    items.push({ label: 'Rolluiken', value: breakdown.rolluiken })
  }
  if (breakdown.customColors > 0) {
    items.push({ label: 'Speciale kleuren', value: breakdown.customColors })
  }

  return items
})

function getExteriorHex(): string {
  return RAL_COLORS[store.exteriorColor.type]?.hex || '#293133'
}

function getFrameHex(): string {
  return RAL_COLORS[store.frameColor.type]?.hex || '#FFFFFF'
}

function getFasciaHex(): string {
  return RAL_COLORS[store.fasciaColor.type]?.hex || '#293133'
}
</script>

<template>
  <div class="preview-card">
    <div class="preview-image">
      <DormerVisual
        :roof-color="store.roofColor"
        :exterior-color="getExteriorHex()"
        :frame-color="getFrameHex()"
        :fascia-color="getFasciaHex()"
        :elements="store.elements"
        :model="store.dormerModel"
      />
    </div>

    <div class="preview-price">
      <div class="preview-price-label">Totaalprijs</div>
      <div class="preview-price-value">
        {{ store.formatPrice(store.priceBreakdown.total) }}
      </div>
      <div class="preview-price-note">Incl. BTW en plaatsing</div>
    </div>

    <div class="preview-breakdown">
      <div class="breakdown-header" @click="($event.currentTarget as HTMLElement).parentElement?.classList.toggle('expanded')">
        <span>Prijsopbouw</span>
        <span class="breakdown-toggle">+</span>
      </div>
      <div class="breakdown-content">
        <div
          v-for="item in priceBreakdownItems"
          :key="item.label"
          class="breakdown-item"
        >
          <span>{{ item.label }}</span>
          <span>{{ store.formatPrice(item.value) }}</span>
        </div>
        <div class="breakdown-total">
          <span>Totaal</span>
          <span>{{ store.formatPrice(store.priceBreakdown.total) }}</span>
        </div>
      </div>
    </div>

    <div class="preview-actions">
      <button class="btn btn-accent btn-block">
        Vraag offerte aan
      </button>
    </div>
  </div>
</template>

<style scoped>
.preview-breakdown {
  border-bottom: 1px solid var(--border-color);
}

.breakdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.breakdown-header:hover {
  background-color: var(--secondary-color);
}

.breakdown-toggle {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--primary-color);
  transition: transform 0.2s ease;
}

.preview-breakdown.expanded .breakdown-toggle {
  transform: rotate(45deg);
}

.breakdown-content {
  display: none;
  padding: 0 24px 16px;
}

.preview-breakdown.expanded .breakdown-content {
  display: block;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 0.9rem;
  color: var(--text-light);
  border-bottom: 1px solid #f0f0f0;
}

.breakdown-total {
  display: flex;
  justify-content: space-between;
  padding: 12px 0 0;
  font-weight: 600;
  font-size: 1rem;
}
</style>
