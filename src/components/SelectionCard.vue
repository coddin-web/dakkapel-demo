<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  price?: string
  isIncluded?: boolean
  selected?: boolean
}>()

defineEmits<{
  select: []
}>()
</script>

<template>
  <div
    class="selection-card"
    :class="{ selected }"
    role="button"
    tabindex="0"
    @click="$emit('select')"
    @keydown.enter="$emit('select')"
    @keydown.space.prevent="$emit('select')"
  >
    <div class="selection-card-header">
      <span class="selection-card-title">{{ title }}</span>
      <span
        v-if="price"
        class="selection-card-price"
        :class="{ included: isIncluded }"
      >
        {{ price }}
      </span>
    </div>
    <p v-if="description" class="selection-card-description">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.selection-card {
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--white);
}

.selection-card:hover {
  border-color: var(--primary-color);
}

.selection-card:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.selection-card:focus:not(:focus-visible) {
  outline: none;
}

.selection-card.selected {
  border-color: var(--primary-color);
  background: rgba(26, 95, 74, 0.05);
}

.selection-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.selection-card-title {
  font-weight: 600;
  color: var(--text-color);
  font-size: 1rem;
}

.selection-card-price {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-color);
  white-space: nowrap;
}

.selection-card-price.included {
  color: var(--success-color);
}

.selection-card-description {
  font-size: 0.85rem;
  color: var(--text-light);
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 480px) {
  .selection-card {
    padding: 12px;
  }

  .selection-card-title {
    font-size: 0.9rem;
  }

  .selection-card-price {
    font-size: 0.8rem;
  }

  .selection-card-description {
    font-size: 0.8rem;
  }
}
</style>
