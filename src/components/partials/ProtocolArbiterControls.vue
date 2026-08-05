<template>
  <div class="protocol-arbiter-controls">
    <button class="protocol-actions__btn protocol-actions__btn--success" @click="openPicker">
      <Plus :size="16" /> Додати суддю
    </button>
    <button
      class="protocol-actions__btn protocol-actions__btn--outline"
      :disabled="refreshing"
      @click="refreshRegistry"
    >
      <RefreshCw :size="16" :class="{ spin: refreshing }" />
      {{ refreshing ? 'Оновлення...' : 'Оновити список суддів' }}
    </button>
    <button class="protocol-actions__btn protocol-actions__btn--outline" @click="openPresets">
      <Users :size="16" /> Пресети суддів
    </button>
  </div>

  <Modal v-if="pickerOpen" @close-modal="closePicker">
    <div class="arbiter-picker">
      <h3 class="arbiter-picker__title">Судді протоколу</h3>

      <p v-if="loading" class="arbiter-picker__status">Завантаження списку суддів...</p>
      <div v-else-if="loadError && !arbiters.length" class="arbiter-picker__error">
        <p>{{ loadError }}</p>
        <button class="button is-small" :disabled="refreshing" @click="refreshRegistry">Спробувати ще раз</button>
      </div>

      <template v-else>
        <label class="arbiter-picker__label" for="protocolArbiterSearch">Пошук за ПІП</label>
        <input
          id="protocolArbiterSearch"
          v-model.trim="arbiterSearch"
          class="input"
          type="search"
          placeholder="Почніть вводити прізвище або ім’я"
        />

        <div class="arbiter-picker__selection-actions">
          <button class="button is-small" :disabled="!filteredArbiters.length" @click="selectAllFiltered">
            Обрати всіх знайдених
          </button>
          <button class="button is-small" :disabled="!selectedArbiterIndexes.length" @click="clearSelection">
            Очистити
          </button>
          <span>Обрано: {{ selectedArbiterIndexes.length }}</span>
        </div>

        <div class="arbiter-picker__list">
          <label
            v-for="arbiter in filteredArbiters"
            :key="`${arbiter.name}-${arbiter.index}`"
            class="arbiter-picker__option"
          >
            <input v-model="selectedArbiterIndexes" type="checkbox" :value="String(arbiter.index)" />
            <span>
              <strong>{{ arbiter.name }}</strong>
              <small>{{ arbiter.category }} · {{ arbiter.region }}</small>
            </span>
          </label>
          <p v-if="!filteredArbiters.length" class="arbiter-presets__empty">Нічого не знайдено.</p>
        </div>

        <template v-if="selectedArbiters.length">
          <label class="arbiter-picker__label" for="protocolMainArbiter">Головний суддя</label>
          <div class="select is-fullwidth">
            <select id="protocolMainArbiter" v-model="mainArbiterIndex">
              <option value="">Не обрано — усі мають посаду «Суддя»</option>
              <option v-for="arbiter in selectedArbiters" :key="arbiter.index" :value="String(arbiter.index)">
                {{ arbiter.name }}
              </option>
            </select>
          </div>

          <div class="arbiter-picker__preview">
            <h4>Буде у протоколі</h4>
            <ol>
              <li v-for="arbiter in selectedArbiters" :key="`preview-${arbiter.index}`">
                <strong>{{ arbiter.name }}</strong>
                <span>{{ String(arbiter.index) === mainArbiterIndex ? 'Головний суддя' : 'Суддя' }}</span>
              </li>
            </ol>
          </div>
        </template>
      </template>

      <div class="arbiter-picker__actions">
        <button class="button" @click="closePicker">Скасувати</button>
        <button v-if="loadError && !arbiters.length" class="button" @click="addEmptyRow">Додати порожній рядок</button>
        <button v-else class="button is-primary" :disabled="loading" @click="addSelectedArbiters">
          Застосувати ({{ selectedArbiters.length }})
        </button>
      </div>
    </div>
  </Modal>

  <Modal v-if="presetsOpen" @close-modal="closePresets">
    <div class="arbiter-presets">
      <h3 class="arbiter-picker__title">Пресети суддів</h3>

      <p v-if="!userId" class="arbiter-picker__error">Увійдіть в акаунт, щоб зберігати та використовувати пресети.</p>
      <template v-else>
        <div class="arbiter-presets__save">
          <label class="arbiter-picker__label" for="arbiterPresetName">Назва пресету</label>
          <input
            id="arbiterPresetName"
            v-model.trim="presetName"
            class="input"
            type="text"
            :placeholder="tournamentName || 'Наприклад: Чемпіонат України 2026'"
          />
          <p class="arbiter-presets__count">Поточний склад: {{ currentArbiters.length }} суддів</p>
          <button
            class="button is-primary"
            :disabled="savingPreset || !presetName || !currentArbiters.length"
            @click="saveCurrentPreset"
          >
            {{ savingPreset ? 'Збереження...' : 'Зберегти поточний склад' }}
          </button>
        </div>

        <p v-if="presetsError" class="arbiter-picker__error">{{ presetsError }}</p>
        <p v-if="presetsLoading" class="arbiter-picker__status">Завантаження пресетів...</p>
        <div v-else-if="presetList.length" class="arbiter-presets__list">
          <p class="arbiter-presets__hint">Застосування пресету замінить поточний склад суддів.</p>
          <article v-for="preset in presetList" :key="preset.id" class="arbiter-presets__item">
            <div>
              <strong>{{ preset.name }}</strong>
              <span>{{ preset.arbiters.length }} суддів</span>
            </div>
            <div class="arbiter-presets__item-actions">
              <button class="button is-small is-primary" @click="applyPreset(preset)">Застосувати</button>
              <button
                class="button is-small is-danger is-outlined"
                :disabled="deletingPresetId === preset.id"
                @click="deletePreset(preset)"
              >
                Видалити
              </button>
            </div>
          </article>
        </div>
        <p v-else class="arbiter-presets__empty">Збережених пресетів ще немає.</p>
      </template>

      <div class="arbiter-picker__actions">
        <button class="button" @click="closePresets">Закрити</button>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from '@/components/Modal';
import { arbiterPresetService, arbiterRegistryService } from '@/services/db';
import {
  ARBITER_SHEET_URL,
  buildArbiterSelection,
  fetchArbiterRegistryFromSheet,
  matchCurrentArbiterSelection,
  normalizeArbiterSetup,
  refreshArbitersFromRegistry,
} from '@/services/arbiter-registry';
import { mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { Plus, RefreshCw, Users } from 'lucide-vue-next';

export default {
  name: 'ProtocolArbiterControls',
  components: { Modal, Plus, RefreshCw, Users },
  props: {
    userId: {
      type: String,
      default: '',
    },
    currentArbiters: {
      type: Array,
      default: () => [],
    },
    tournamentName: {
      type: String,
      default: '',
    },
  },
  emits: ['add', 'apply-selection', 'apply-preset'],
  data() {
    return {
      arbiters: [],
      loading: false,
      refreshing: false,
      loadError: '',
      pickerOpen: false,
      arbiterSearch: '',
      selectedArbiterIndexes: [],
      mainArbiterIndex: '',
      presets: {},
      presetsOpen: false,
      presetsLoading: false,
      presetsError: '',
      presetName: '',
      savingPreset: false,
      deletingPresetId: '',
    };
  },
  computed: {
    filteredArbiters() {
      const query = this.arbiterSearch.toLocaleLowerCase('uk');
      return this.arbiters
        .map((arbiter, index) => ({ ...arbiter, index }))
        .filter((arbiter) => !query || arbiter.name.toLocaleLowerCase('uk').includes(query));
    },
    selectedArbiters() {
      return this.selectedArbiterIndexes
        .map((index) => ({ ...this.arbiters[Number(index)], index: Number(index) }))
        .filter((arbiter) => arbiter.name);
    },
    presetList() {
      return Object.entries(this.presets)
        .map(([id, preset]) => ({
          id,
          ...preset,
          arbiters: Array.isArray(preset?.arbiters) ? preset.arbiters : [],
        }))
        .sort((first, second) => (second.createdAt || 0) - (first.createdAt || 0));
    },
  },
  watch: {
    selectedArbiterIndexes(indexes) {
      if (this.mainArbiterIndex && !indexes.includes(this.mainArbiterIndex)) {
        this.mainArbiterIndex = '';
      }
    },
    currentArbiters: {
      deep: true,
      handler(arbiters) {
        if (this.pickerOpen && this.arbiters.length) this.syncSelectionFromCurrent(arbiters);
      },
    },
  },
  methods: {
    ...mapActions(useMainStore, ['showMessage']),
    async openPicker() {
      this.pickerOpen = true;
      if (!this.arbiters.length) await this.loadRegistry();
      this.syncSelectionFromCurrent();
    },
    closePicker() {
      this.pickerOpen = false;
      this.arbiterSearch = '';
      this.clearSelection();
    },
    async loadRegistry() {
      this.loading = true;
      this.loadError = '';
      try {
        if (this.userId) {
          try {
            const snapshot = await arbiterRegistryService.get(this.userId);
            const cachedArbiters = snapshot.val()?.arbiters;
            if (Array.isArray(cachedArbiters) && cachedArbiters.length) {
              this.arbiters = cachedArbiters;
              return;
            }
          } catch (error) {
            console.warn('Could not read the cached arbiter registry:', error);
          }
        }
        await this.fetchAndCacheRegistry(false);
      } catch (error) {
        console.error('Arbiter registry load error:', error);
        this.loadError = 'Не вдалося завантажити список суддів.';
      } finally {
        this.loading = false;
      }
    },
    async refreshRegistry() {
      if (this.refreshing) return;
      this.refreshing = true;
      this.loadError = '';
      try {
        await this.fetchAndCacheRegistry(false);
        const refreshed = refreshArbitersFromRegistry(this.arbiters, this.currentArbiters);
        if (this.currentArbiters.length) this.$emit('apply-selection', refreshed.arbiters);
        if (this.pickerOpen) this.syncSelectionFromCurrent(refreshed.arbiters);

        const protocolText = this.currentArbiters.length
          ? ` У протоколі синхронізовано ${refreshed.matched} суддів, змінено ${refreshed.changed}.`
          : '';
        this.showMessage({
          title: 'Оновлено',
          text: `Завантажено ${this.arbiters.length} суддів.${protocolText}`,
        });
      } catch (error) {
        console.error('Arbiter registry refresh error:', error);
        this.loadError = 'Не вдалося оновити список суддів.';
        this.showMessage({ title: 'Помилка', text: this.loadError, type: 'error' });
      } finally {
        this.refreshing = false;
      }
    },
    async fetchAndCacheRegistry(showSuccess) {
      const arbiters = await fetchArbiterRegistryFromSheet();
      if (!arbiters.length) throw new Error('The arbiter registry is empty');

      this.arbiters = arbiters;
      if (this.userId) {
        try {
          await arbiterRegistryService.save(this.userId, {
            arbiters,
            source: ARBITER_SHEET_URL,
            updatedAt: Date.now(),
          });
        } catch (error) {
          console.warn('Could not cache the arbiter registry in Firebase:', error);
        }
      }
      if (showSuccess) {
        this.showMessage({ title: 'Оновлено', text: `Завантажено ${arbiters.length} суддів` });
      }
    },
    selectAllFiltered() {
      const selected = new Set(this.selectedArbiterIndexes);
      this.filteredArbiters.forEach((arbiter) => selected.add(String(arbiter.index)));
      this.selectedArbiterIndexes = [...selected];
    },
    clearSelection() {
      this.selectedArbiterIndexes = [];
      this.mainArbiterIndex = '';
    },
    syncSelectionFromCurrent(currentArbiters = this.currentArbiters) {
      const { selectedIndexes, mainArbiterIndex } = matchCurrentArbiterSelection(this.arbiters, currentArbiters);
      this.selectedArbiterIndexes = selectedIndexes;
      this.mainArbiterIndex = mainArbiterIndex;
    },
    addSelectedArbiters() {
      this.$emit(
        'apply-selection',
        buildArbiterSelection(this.arbiters, this.selectedArbiterIndexes, this.mainArbiterIndex),
      );
      this.closePicker();
    },
    addEmptyRow() {
      this.$emit('add', {
        name: '',
        role: 'Суддя',
        category: 'АФПУ',
        certificate: '',
        region: '',
      });
      this.closePicker();
    },
    async openPresets() {
      this.presetsOpen = true;
      this.presetsError = '';
      this.presetName = this.tournamentName || '';
      if (this.userId) await this.loadPresets();
    },
    closePresets() {
      this.presetsOpen = false;
      this.presetsError = '';
    },
    async loadPresets() {
      this.presetsLoading = true;
      try {
        const snapshot = await arbiterPresetService.getAll(this.userId);
        this.presets = snapshot.val() || {};
      } catch (error) {
        console.error('Arbiter presets load error:', error);
        this.presetsError = 'Не вдалося завантажити пресети суддів.';
      } finally {
        this.presetsLoading = false;
      }
    },
    async saveCurrentPreset() {
      const arbiters = normalizeArbiterSetup(this.currentArbiters);
      if (!this.userId || !this.presetName || !arbiters.length || this.savingPreset) return;

      this.savingPreset = true;
      this.presetsError = '';
      const presetId = String(Date.now());
      const preset = {
        name: this.presetName,
        createdAt: Date.now(),
        arbiters,
      };
      try {
        await arbiterPresetService.save(this.userId, presetId, preset);
        this.presets = { ...this.presets, [presetId]: preset };
        this.showMessage({ title: 'Збережено', text: `Пресет «${preset.name}» збережено` });
      } catch (error) {
        console.error('Arbiter preset save error:', error);
        this.presetsError = 'Не вдалося зберегти пресет суддів.';
      } finally {
        this.savingPreset = false;
      }
    },
    applyPreset(preset) {
      const arbiters = normalizeArbiterSetup(preset.arbiters);
      this.$emit('apply-preset', arbiters);
      this.syncSelectionFromCurrent(arbiters);
      this.showMessage({ title: 'Застосовано', text: `Додано ${arbiters.length} суддів із пресету` });
      this.closePresets();
    },
    async deletePreset(preset) {
      if (!window.confirm(`Видалити пресет «${preset.name}»?`)) return;
      this.deletingPresetId = preset.id;
      try {
        await arbiterPresetService.remove(this.userId, preset.id);
        const presets = { ...this.presets };
        delete presets[preset.id];
        this.presets = presets;
      } catch (error) {
        console.error('Arbiter preset delete error:', error);
        this.presetsError = 'Не вдалося видалити пресет суддів.';
      } finally {
        this.deletingPresetId = '';
      }
    },
  },
};
</script>

<style scoped>
.protocol-arbiter-controls {
  display: contents;
}

.arbiter-picker__title {
  margin-bottom: 1.25rem;
  padding-right: 2rem;
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: 700;
}

.arbiter-picker__label {
  display: block;
  margin: 1rem 0 0.35rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.arbiter-picker__selection-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.arbiter-picker__selection-actions span {
  margin-left: auto;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.arbiter-picker__list {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.arbiter-picker__option {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.6rem 0.75rem;
  color: var(--color-text);
  cursor: pointer;
}

.arbiter-picker__option + .arbiter-picker__option {
  border-top: 1px solid var(--color-border);
}

.arbiter-picker__option:hover {
  background: var(--color-primary-bg);
}

.arbiter-picker__option input {
  margin-top: 0.2rem;
}

.arbiter-picker__option span,
.arbiter-picker__option strong,
.arbiter-picker__option small {
  display: block;
}

.arbiter-picker__option small {
  margin-top: 0.1rem;
  color: var(--color-text-muted);
}

.arbiter-picker__status,
.arbiter-picker__error {
  padding: 1rem;
  border-radius: 6px;
  background: var(--color-bg-input);
  color: var(--color-text-secondary);
}

.arbiter-picker__error p {
  margin-bottom: 0.75rem;
}

.arbiter-picker__preview {
  margin-top: 1.25rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-input);
}

.arbiter-picker__preview h4 {
  margin: 0 0 0.5rem;
  color: var(--color-text);
  font-weight: 700;
}

.arbiter-picker__preview ol {
  margin: 0;
  padding-left: 1.25rem;
}

.arbiter-picker__preview li {
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.arbiter-picker__preview li span {
  color: var(--color-text-muted);
}

.arbiter-picker__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.arbiter-presets__save {
  padding: 0 0 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.arbiter-presets__count {
  margin: 0.5rem 0 0.85rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.arbiter-presets__list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 1rem;
}

.arbiter-presets__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-input);
}

.arbiter-presets__item strong,
.arbiter-presets__item span {
  display: block;
}

.arbiter-presets__item strong {
  color: var(--color-text);
}

.arbiter-presets__item span,
.arbiter-presets__empty,
.arbiter-presets__hint {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.arbiter-presets__hint {
  margin-bottom: 0.2rem;
}

.arbiter-presets__item-actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.4rem;
}

.arbiter-presets__empty {
  margin-top: 1rem;
}

@media (max-width: 520px) {
  .arbiter-presets__item {
    align-items: stretch;
    flex-direction: column;
  }
}

.spin {
  animation: arbiter-refresh-spin 1s linear infinite;
}

@keyframes arbiter-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
