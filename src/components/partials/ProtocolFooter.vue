<template>
  <div>
    <div class="protocol-tools protocol-tools--bottom">
      <section class="protocol-tools__section protocol-tools__section--arbiters">
        <div class="protocol-tools__header">
          <div>
            <span class="protocol-tools__eyebrow">Суддівська колегія</span>
            <h3>Керування суддями</h3>
            <p>Оберіть суддів із реєстру або застосуйте готовий склад.</p>
          </div>
          <span class="protocol-tools__count">{{ arbitres.length }}</span>
        </div>
        <div class="protocol-tools__actions">
          <ProtocolArbiterControls
            :user-id="userId"
            :current-arbiters="arbitres"
            :tournament-name="tournamentName"
            @add="$emit('add-arbiter', $event)"
            @apply-selection="$emit('apply-arbiter-selection', $event)"
            @apply-preset="$emit('apply-arbiter-preset', $event)"
          />
          <a
            href="https://docs.google.com/spreadsheets/d/1yXDjYCX3nISBCt8-S-vmvIU31rb4SmhtRsWc8PbQy7Q/edit?usp=sharing"
            target="_blank"
            class="protocol-actions__btn protocol-actions__btn--outline"
          >
            <ExternalLink :size="16" /> Список суддів ФПУ
          </a>
        </div>
        <div class="protocol-tools__checkboxes">
          <label class="protocol-actions__checkbox protocol-tools__checkbox">
            <input
              :checked="showArbitrCertificate"
              type="checkbox"
              @change="$emit('update:showArbitrCertificate', $event.target.checked)"
            />
            № посвідчення суддів
          </label>
          <label class="protocol-actions__checkbox protocol-tools__checkbox">
            <input
              :checked="replaceAfpuWithSecondCategory"
              type="checkbox"
              @change="$emit('update:replaceAfpuWithSecondCategory', $event.target.checked)"
            />
            Замінити «АФПУ» на «2»
          </label>
        </div>
      </section>
    </div>
    <div class="protocol-tools protocol-tools--export">
      <section class="protocol-tools__section protocol-tools__section--export">
        <div class="protocol-tools__header">
          <div>
            <span class="protocol-tools__eyebrow">Готовий документ</span>
            <h3>Експорт протоколу</h3>
            <p>Завантажте протокол у потрібному форматі або скопіюйте його для подальшого редагування.</p>
          </div>
        </div>
        <div class="protocol-tools__actions">
          <button class="protocol-actions__btn protocol-actions__btn--primary" @click="$emit('export-pdf')">
            <FileDown :size="16" /> {{ $t('teams.exportPdf') }}
          </button>
          <button
            class="protocol-actions__btn protocol-actions__btn--primary"
            :disabled="exportingDocx"
            @click="$emit('export-docx')"
          >
            <FileText :size="16" /> {{ exportingDocx ? '...' : $t('teams.exportDocx') }}
          </button>
          <button class="protocol-actions__btn protocol-actions__btn--primary" @click="$emit('copy-protocol')">
            <Copy :size="16" /> {{ $t('teams.copyProtocol') }}
          </button>
          <button
            v-if="!hideClose"
            class="protocol-actions__btn protocol-actions__btn--outline"
            @click="$emit('close')"
          >
            {{ $t('common.close') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import ProtocolArbiterControls from '@/components/partials/ProtocolArbiterControls.vue';
import { Copy, ExternalLink, FileDown, FileText } from 'lucide-vue-next';

export default {
  name: 'ProtocolFooter',
  components: { ProtocolArbiterControls, Copy, ExternalLink, FileDown, FileText },
  props: {
    userId: { type: String, default: '' },
    arbitres: { type: Array, required: true },
    tournamentName: { type: String, required: true },
    showArbitrCertificate: { type: Boolean, default: true },
    replaceAfpuWithSecondCategory: { type: Boolean, default: false },
    exportingDocx: { type: Boolean, default: false },
    hideClose: { type: Boolean, default: false },
  },
  emits: [
    'add-arbiter',
    'apply-arbiter-selection',
    'apply-arbiter-preset',
    'update:showArbitrCertificate',
    'update:replaceAfpuWithSecondCategory',
    'export-pdf',
    'export-docx',
    'copy-protocol',
    'close',
  ],
};
</script>
