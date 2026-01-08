<script setup lang="ts">
import { useConfiguratorStore } from '@/stores/configurator'
import { RAL_COLORS, type ColorOption } from '@/types'

const store = useConfiguratorStore()

const frameColors: ColorOption[] = ['wit', 'cremewit', 'antraciet', 'zwart', 'groen', 'anders']
const exteriorColors: ColorOption[] = ['antraciet', 'cremewit', 'zwart', 'wit', 'groen', 'anders']
const fasciaColors: ColorOption[] = ['antraciet', 'cremewit', 'zwart', 'wit', 'groen', 'zink', 'anders']

function getColorHex(type: ColorOption): string {
  return RAL_COLORS[type].hex
}

function getColorName(type: ColorOption): string {
  return RAL_COLORS[type].name
}

function getColorCode(type: ColorOption): string | undefined {
  return RAL_COLORS[type].code
}
</script>

<template>
  <div class="step-colors">
    <h2 class="step-title">Stap 4: Kleuren</h2>
    <p class="step-description">
      Bepaal de kleuren voor de verschillende onderdelen van de dakkapel.
    </p>

    <div class="form-section">
      <label class="form-label">
        Kozijnkleur
        <span class="form-hint">Standaard: wit (RAL 9010)</span>
      </label>
      <div class="color-options">
        <div
          v-for="color in frameColors"
          :key="color"
          class="color-option"
          :class="{ selected: store.frameColor.type === color }"
          @click="store.setFrameColor({ type: color })"
        >
          <div
            class="color-preview"
            :style="{ backgroundColor: getColorHex(color) }"
          ></div>
          <span class="color-name">{{ getColorName(color) }}</span>
          <span v-if="getColorCode(color)" class="color-code">{{ getColorCode(color) }}</span>
          <span v-if="color === 'anders'" class="color-price">+ € 450,-</span>
        </div>
      </div>
      <div v-if="store.frameColor.type === 'anders'" class="ral-input-group">
        <label>RAL-code:</label>
        <input
          type="text"
          class="ral-input"
          placeholder="bv. RAL 5010"
          :value="store.frameColor.ralCode"
          @input="store.setFrameColor({ type: 'anders', ralCode: ($event.target as HTMLInputElement).value })"
        />
      </div>
    </div>

    <div class="form-section">
      <label class="form-label">
        Buitenzijde
        <span class="form-hint">De kleur van de zijkanten en het front. Standaard: antraciet</span>
      </label>
      <div class="color-options">
        <div
          v-for="color in exteriorColors"
          :key="color"
          class="color-option"
          :class="{ selected: store.exteriorColor.type === color }"
          @click="store.setExteriorColor({ type: color })"
        >
          <div
            class="color-preview"
            :style="{ backgroundColor: getColorHex(color) }"
          ></div>
          <span class="color-name">{{ getColorName(color) }}</span>
          <span v-if="getColorCode(color)" class="color-code">{{ getColorCode(color) }}</span>
          <span v-if="color === 'anders'" class="color-price">+ € 450,-</span>
        </div>
      </div>
      <div v-if="store.exteriorColor.type === 'anders'" class="ral-input-group">
        <label>RAL-code:</label>
        <input
          type="text"
          class="ral-input"
          placeholder="bv. RAL 5010"
          :value="store.exteriorColor.ralCode"
          @input="store.setExteriorColor({ type: 'anders', ralCode: ($event.target as HTMLInputElement).value })"
        />
      </div>
    </div>

    <div class="form-section">
      <label class="form-label">
        Boeiboord
        <span class="form-hint">De afwerkingsrand van de dakkapel. Standaard: antraciet</span>
      </label>
      <div class="color-options">
        <div
          v-for="color in fasciaColors"
          :key="color"
          class="color-option"
          :class="{ selected: store.fasciaColor.type === color }"
          @click="store.setFasciaColor({ type: color })"
        >
          <div
            class="color-preview"
            :style="{ backgroundColor: getColorHex(color) }"
          ></div>
          <span class="color-name">{{ getColorName(color) }}</span>
          <span v-if="getColorCode(color)" class="color-code">{{ getColorCode(color) }}</span>
          <span v-if="color === 'anders'" class="color-price">+ € 450,-</span>
        </div>
      </div>
      <div v-if="store.fasciaColor.type === 'anders'" class="ral-input-group">
        <label>RAL-code:</label>
        <input
          type="text"
          class="ral-input"
          placeholder="bv. RAL 5010"
          :value="store.fasciaColor.ralCode"
          @input="store.setFasciaColor({ type: 'anders', ralCode: ($event.target as HTMLInputElement).value })"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: var(--secondary-color);
  border: 2px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.color-option:hover {
  border-color: var(--primary-color);
}

.color-option.selected {
  border-color: var(--primary-color);
  background: rgba(26, 95, 74, 0.05);
}

.color-preview {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  border: 2px solid #ddd;
}

.color-option.selected .color-preview {
  border-color: var(--primary-color);
}

.color-name {
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
}

.color-code {
  font-size: 0.75rem;
  color: var(--text-light);
}

.color-price {
  font-size: 0.8rem;
  color: var(--accent-color);
  font-weight: 500;
}
</style>
