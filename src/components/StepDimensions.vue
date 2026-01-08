<script setup lang="ts">
import { ref } from 'vue'
import { useConfiguratorStore } from '@/stores/configurator'
import { ELEMENT_LABELS, type ElementType } from '@/types'
import DimensionInput from '@/components/DimensionInput.vue'

const store = useConfiguratorStore()

const showAddPopup = ref(false)
const showEditPopup = ref(false)
const editingPosition = ref<number | null>(null)
const draggedPosition = ref<number | null>(null)
const dragOverPosition = ref<number | null>(null)

const addableElementTypes: { value: ElementType; label: string; description: string }[] = [
  { value: 'raam', label: 'Raam (vast)', description: 'Een vast raam voor maximaal lichtinval' },
  { value: 'draai-kiepraam', label: 'Draai-kiepraam', description: 'Te openen voor ventilatie (+€350)' },
  { value: 'tussenpaneel', label: 'Tussenpaneel', description: 'Paneel tussen ramen (+€150)' }
]

function updateWidth(value: number) {
  store.setWidth(value)
}

function updateHeight(value: number) {
  store.setHeight(value)
}

function updateRoofAngle(value: number) {
  store.setRoofAngle(value)
}

function openAddPopup() {
  showAddPopup.value = true
}

function closeAddPopup() {
  showAddPopup.value = false
}

function handleAddElement(type: ElementType) {
  store.addElement(type)
  closeAddPopup()
}

function openEditPopup(position: number) {
  editingPosition.value = position
  showEditPopup.value = true
}

function closeEditPopup() {
  showEditPopup.value = false
  editingPosition.value = null
}

function handleChangeElementType(type: ElementType) {
  if (editingPosition.value !== null) {
    store.setElementType(editingPosition.value, type)
    closeEditPopup()
  }
}

function handleRemoveElement(position: number) {
  store.removeElement(position)
}

function moveElementUp(position: number) {
  if (position > 0) {
    store.reorderElements(position, position - 1)
  }
}

function moveElementDown(position: number) {
  if (position < store.elements.length - 1) {
    store.reorderElements(position, position + 1)
  }
}

// Drag and drop handlers
function handleDragStart(event: DragEvent, position: number) {
  draggedPosition.value = position
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', position.toString())
  }
}

function handleDragOver(event: DragEvent, position: number) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverPosition.value = position
}

function handleDragLeave() {
  dragOverPosition.value = null
}

function handleDrop(event: DragEvent, targetPosition: number) {
  event.preventDefault()
  if (draggedPosition.value !== null && draggedPosition.value !== targetPosition) {
    store.reorderElements(draggedPosition.value, targetPosition)
  }
  draggedPosition.value = null
  dragOverPosition.value = null
}

function handleDragEnd() {
  draggedPosition.value = null
  dragOverPosition.value = null
}
</script>

<template>
  <div class="step-dimensions">
    <h2 class="step-title">Stap 2: Formaat</h2>
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
          :max="1200"
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
          Voeg elementen toe aan uw dakkapel.
          Bij huidige breedte: minimaal {{ store.minElements }}, maximaal {{ store.maxElements }} elementen.
        </span>
      </label>

      <div class="elements-list" role="group" aria-labelledby="elements-label">
        <div
          v-for="element in store.elements"
          :key="element.position"
          class="element-item"
          :class="{
            'element-dragging': draggedPosition === element.position,
            'element-drag-over': dragOverPosition === element.position && draggedPosition !== element.position
          }"
          draggable="true"
          @dragstart="handleDragStart($event, element.position)"
          @dragover="handleDragOver($event, element.position)"
          @dragleave="handleDragLeave"
          @drop="handleDrop($event, element.position)"
          @dragend="handleDragEnd"
        >
          <div class="element-reorder">
            <button
              type="button"
              class="reorder-btn"
              :disabled="element.position === 0"
              aria-label="Omhoog"
              @click.stop="moveElementUp(element.position)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              class="reorder-btn"
              :disabled="element.position === store.elements.length - 1"
              aria-label="Omlaag"
              @click.stop="moveElementDown(element.position)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
          <div
            class="element-info"
            role="button"
            tabindex="0"
            @click="openEditPopup(element.position)"
            @keydown.enter="openEditPopup(element.position)"
          >
            <span class="element-number">{{ element.position + 1 }}</span>
            <span class="element-name">{{ ELEMENT_LABELS[element.type] }}</span>
            <svg class="element-edit-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <button
            type="button"
            class="element-remove-btn"
            :disabled="store.elements.length <= store.minElements"
            aria-label="Verwijder element"
            @click.stop="handleRemoveElement(element.position)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <button
          v-if="store.elements.length < store.maxElements"
          type="button"
          class="add-element-btn"
          @click="openAddPopup"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Element toevoegen
        </button>
      </div>
    </div>

    <!-- Add Element Popup -->
    <Teleport to="body">
      <div v-if="showAddPopup" class="popup-overlay" @click="closeAddPopup">
        <div class="popup-content" @click.stop>
          <div class="popup-header">
            <h3>Element toevoegen</h3>
            <button type="button" class="popup-close" @click="closeAddPopup" aria-label="Sluiten">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="popup-options">
            <button
              v-for="elementType in addableElementTypes"
              :key="elementType.value"
              type="button"
              class="popup-option"
              @click="handleAddElement(elementType.value)"
            >
              <span class="popup-option-label">{{ elementType.label }}</span>
              <span class="popup-option-desc">{{ elementType.description }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Element Popup -->
    <Teleport to="body">
      <div v-if="showEditPopup" class="popup-overlay" @click="closeEditPopup">
        <div class="popup-content" @click.stop>
          <div class="popup-header">
            <h3>Element wijzigen</h3>
            <button type="button" class="popup-close" @click="closeEditPopup" aria-label="Sluiten">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="popup-options">
            <button
              v-for="elementType in addableElementTypes"
              :key="elementType.value"
              type="button"
              class="popup-option"
              :class="{ 'popup-option-selected': store.elements.find(e => e.position === editingPosition)?.type === elementType.value }"
              @click="handleChangeElementType(elementType.value)"
            >
              <span class="popup-option-label">{{ elementType.label }}</span>
              <span class="popup-option-desc">{{ elementType.description }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.dimension-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

/* Elements List */
.elements-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.element-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  cursor: grab;
  transition: all 0.15s ease;
}

.element-item:active {
  cursor: grabbing;
}

.element-item.element-dragging {
  opacity: 0.5;
  background: var(--gray-100);
}

.element-item.element-drag-over {
  border-color: var(--primary-color);
  background: var(--secondary-color);
}

.element-reorder {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reorder-btn {
  padding: 2px;
  background: none;
  border: none;
  color: var(--gray-400);
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.15s ease;
}

.reorder-btn:hover:not(:disabled) {
  background: var(--secondary-color);
  color: var(--primary-color);
}

.reorder-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.element-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding: 4px 8px;
  margin: -4px 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s ease;
}

.element-info:hover {
  background: var(--secondary-color);
}

.element-info:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.element-info:focus:not(:focus-visible) {
  outline: none;
}

.element-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: var(--white);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.element-name {
  flex: 1;
  font-weight: 500;
}

.element-edit-icon {
  color: var(--gray-400);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.element-info:hover .element-edit-icon {
  opacity: 1;
}

.element-remove-btn {
  padding: 6px;
  background: none;
  border: none;
  color: var(--gray-400);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.element-remove-btn:hover:not(:disabled) {
  background: #fee2e2;
  color: #dc2626;
}

.element-remove-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.add-element-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  background: var(--secondary-color);
  border: 2px dashed var(--gray-300);
  border-radius: var(--radius);
  color: var(--primary-color);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-element-btn:hover {
  background: var(--white);
  border-color: var(--primary-color);
}

</style>

<!-- Non-scoped styles for teleported popup -->
<style>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.popup-content {
  background: var(--white);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.popup-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.popup-close {
  padding: 4px;
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  border-radius: var(--radius);
}

.popup-close:hover {
  color: var(--text-color);
}

.popup-options {
  display: flex;
  flex-direction: column;
}

.popup-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 16px 20px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--secondary-color);
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.popup-option:last-child {
  border-bottom: none;
}

.popup-option:hover {
  background: var(--secondary-color);
}

.popup-option-selected {
  background: var(--secondary-color);
  border-left: 3px solid var(--primary-color);
  padding-left: 17px;
}

.popup-option-label {
  font-weight: 500;
  color: var(--text-color);
}

.popup-option-desc {
  font-size: 0.85rem;
  color: var(--text-light);
}
</style>
