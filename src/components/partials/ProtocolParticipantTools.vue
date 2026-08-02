<template>
  <div class="protocol-tools">
    <section class="protocol-tools__section">
      <div class="protocol-tools__header">
        <div>
          <span class="protocol-tools__eyebrow">Підготовка протоколу</span>
          <h3>Дані учасників</h3>
          <p>Оновіть інформацію з порталу та приберіть службові позначки перед експортом.</p>
        </div>
      </div>
      <div class="protocol-tools__actions">
        <button
          class="protocol-actions__btn protocol-actions__btn--outline"
          :disabled="refreshing"
          @click="$emit('refresh')"
        >
          <RefreshCw :size="16" :class="{ spin: refreshing }" />
          {{ refreshing ? 'Оновлення...' : 'Оновити дані гравців' }}
        </button>
        <button class="protocol-actions__btn protocol-actions__btn--outline" @click="$emit('remove-markers')">
          <Eraser :size="16" /> Прибрати "ДОПИШІТЬ МЕНЕ"
        </button>
        <button class="protocol-actions__btn protocol-actions__btn--ghost" @click="$emit('reset')">
          <RotateCcw :size="16" /> Скинути зміни
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import { Eraser, RefreshCw, RotateCcw } from 'lucide-vue-next';

export default {
  name: 'ProtocolParticipantTools',
  components: { Eraser, RefreshCw, RotateCcw },
  props: {
    refreshing: { type: Boolean, default: false },
  },
  emits: ['refresh', 'remove-markers', 'reset'],
};
</script>
