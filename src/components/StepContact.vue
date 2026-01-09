<script setup lang="ts">
import { useConfiguratorStore } from '@/stores/configurator'

const store = useConfiguratorStore()
</script>

<template>
  <div class="step-contact">
    <h2 class="step-title">Stap 5: Uw gegevens</h2>
    <p class="step-description">
      Vul uw gegevens in om een vrijblijvende offerte te ontvangen.
    </p>

    <div class="form-section">
      <label class="form-label">Naam</label>
      <div class="name-group">
        <input
          type="text"
          class="input-field"
          placeholder="Voornaam"
          :value="store.contact.firstName"
          @input="store.setContactField('firstName', ($event.target as HTMLInputElement).value)"
        />
        <input
          type="text"
          class="input-field"
          placeholder="Achternaam"
          :value="store.contact.lastName"
          @input="store.setContactField('lastName', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div class="form-section">
      <label class="form-label">Contactgegevens</label>
      <input
        type="email"
        class="input-field"
        placeholder="E-mailadres"
        :value="store.contact.email"
        @input="store.setContactField('email', ($event.target as HTMLInputElement).value)"
      />
      <input
        type="tel"
        class="input-field"
        placeholder="Telefoonnummer"
        :value="store.contact.phone"
        @input="store.setContactField('phone', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-section">
      <label class="form-label">Adres (plaatsingslocatie)</label>
      <div class="address-row">
        <input
          type="text"
          class="input-field street"
          placeholder="Straat"
          :value="store.contact.street"
          @input="store.setContactField('street', ($event.target as HTMLInputElement).value)"
        />
        <input
          type="text"
          class="input-field house-number"
          placeholder="Nr."
          :value="store.contact.houseNumber"
          @input="store.setContactField('houseNumber', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="address-row">
        <input
          type="text"
          class="input-field postal-code"
          placeholder="Postcode"
          :value="store.contact.postalCode"
          @input="store.setContactField('postalCode', ($event.target as HTMLInputElement).value)"
        />
        <input
          type="text"
          class="input-field city"
          placeholder="Plaats"
          :value="store.contact.city"
          @input="store.setContactField('city', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div class="form-section">
      <label class="form-label">Opmerkingen (optioneel)</label>
      <textarea
        class="input-field textarea"
        placeholder="Eventuele opmerkingen of vragen..."
        rows="3"
        :value="store.contact.remarks"
        @input="store.setContactField('remarks', ($event.target as HTMLInputElement).value)"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
.name-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.input-field {
  width: 100%;
  margin-bottom: 8px;
}

.address-row {
  display: flex;
  gap: 8px;
}

.street {
  flex: 3;
}

.house-number {
  flex: 1;
  min-width: 60px;
}

.postal-code {
  flex: 1;
  min-width: 100px;
}

.city {
  flex: 2;
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

@media (max-width: 480px) {
  .name-group {
    grid-template-columns: 1fr;
  }

  .address-row {
    flex-wrap: wrap;
  }

  .street {
    flex: 1 1 100%;
  }

  .house-number {
    flex: 1;
  }

  .postal-code,
  .city {
    flex: 1;
  }
}
</style>
