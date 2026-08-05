<template>
  <div class="wrapper">
    <Navbar @open-menu="menuOpen = !menuOpen" />
    <Menu :active="menuOpen" @closeMenu="menuOpen = false" />
    <div class="container custom-routes">
      <h1 class="custom-routes__heading">{{ $t('common.customRoutes') }}</h1>

      <!-- Create form -->
      <div class="custom-routes__form">
        <div class="custom-routes__field">
          <label class="custom-routes__label">{{ $t('common.slugLabel') }}</label>
          <input
            v-model="newSlug"
            class="custom-routes__input"
            :placeholder="$t('common.slugPlaceholder')"
            @input="newSlug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '')"
          />
          <span v-if="newSlug && !slugValid" class="custom-routes__error">
            {{ $t('common.slugInvalid') }}
          </span>
        </div>
        <div class="custom-routes__field">
          <label class="custom-routes__label">{{ $t('common.routeTitle') }}</label>
          <input v-model="newTitle" class="custom-routes__input" :placeholder="$t('common.routeTitlePlaceholder')" />
          <p class="custom-routes__hint">
            <Info :size="15" />
            <span>{{ $t('common.routeTitleHint') }}</span>
          </p>
        </div>
        <button class="button custom-routes__btn" :disabled="!canCreate" @click="createRoute">
          <Plus :size="18" />
          {{ $t('common.createRoute') }}
        </button>
      </div>

      <!-- Routes list -->
      <div v-if="isLoading" class="custom-routes__loading">
        <div class="custom-routes__spinner"></div>
      </div>

      <div v-else-if="routes.length === 0" class="custom-routes__empty">{{ $t('common.customRoutes') }} — 0</div>

      <div v-else class="custom-routes__list">
        <div v-for="route in routes" :key="route.slug" class="custom-routes__item">
          <button
            type="button"
            class="custom-routes__item-qr"
            :data-route-qr="route.slug"
            :aria-expanded="expandedQr === route.slug"
            :aria-label="$t(expandedQr === route.slug ? 'common.qrCollapseHint' : 'common.qrExpandHint')"
            @click="expandedQr = expandedQr === route.slug ? null : route.slug"
          >
            <QrcodeVue
              :value="getFullUrl(route.slug)"
              :size="expandedQr === route.slug ? 280 : 120"
              level="M"
              :margin="4"
              render-as="svg"
            />
            <span class="custom-routes__qr-hint">
              <Minimize2 v-if="expandedQr === route.slug" :size="15" />
              <Maximize2 v-else :size="15" />
              {{ $t(expandedQr === route.slug ? 'common.qrCollapseHint' : 'common.qrExpandHint') }}
            </span>
          </button>

          <div class="custom-routes__item-body">
            <div class="custom-routes__item-header">
              <span class="custom-routes__item-title">{{ route.title }}</span>
              <code class="custom-routes__item-slug">/public/{{ route.slug }}</code>
            </div>

            <div class="custom-routes__item-link">
              <div class="select is-fullwidth">
                <select :value="route.ref || ''" @change="linkTournament(route.slug, $event.target.value)">
                  <option value="">{{ $t('common.selectTournament') }}</option>
                  <option v-for="t in tournamentOptions" :key="t.id" :value="t.ref">
                    {{ t.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="custom-routes__item-actions">
              <button class="custom-routes__action" @click="copyUrl(route.slug)" :title="$t('common.copyUrl')">
                <Copy :size="16" />
                <span>{{ $t('common.copyUrl') }}</span>
              </button>
              <button
                class="custom-routes__action"
                :disabled="exportingQrSlug === route.slug"
                @click="exportRouteQrPdf(route)"
              >
                <LoaderCircle v-if="exportingQrSlug === route.slug" :size="16" class="custom-routes__spin" />
                <FileDown v-else :size="16" />
                <span>{{ $t(exportingQrSlug === route.slug ? 'common.generatingPdf' : 'common.downloadQrPdf') }}</span>
              </button>
              <button
                class="custom-routes__action custom-routes__action--danger"
                @click="deleteRoute(route.slug)"
                :title="$t('common.deleteRoute')"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue';
import Menu from '@/components/Menu.vue';
import QrcodeVue from 'qrcode.vue';
import { mapState } from 'pinia';
import { useMainStore } from '@/stores/main';
import { customRoutesService } from '@/services/db';
import { isValidSlug, copyContent } from '@/helpers';
import appLogoUrl from '@/assets/img/logo.webp';
import { encodeTournamentRef } from '@/services/tournament-ref';
import { Plus, Copy, Trash2, Info, Maximize2, Minimize2, FileDown, LoaderCircle } from 'lucide-vue-next';

export default {
  name: 'CustomRoutes',
  components: {
    Navbar,
    Menu,
    QrcodeVue,
    Plus,
    Copy,
    Trash2,
    Info,
    Maximize2,
    Minimize2,
    FileDown,
    LoaderCircle,
  },
  data() {
    return {
      menuOpen: false,
      isLoading: true,
      routes: [],
      newSlug: '',
      expandedQr: null,
      exportingQrSlug: null,
      newTitle: '',
    };
  },
  computed: {
    ...mapState(useMainStore, ['user', 'userTournamentMap', 'tournaments']),
    slugValid() {
      return isValidSlug(this.newSlug);
    },
    canCreate() {
      return this.slugValid && this.newTitle.trim().length > 0;
    },
    tournamentOptions() {
      if (!this.userTournamentMap) return [];
      return Object.entries(this.userTournamentMap)
        .filter(([, entry]) => {
          const canLink = ['owner', 'admin', 'scorer'].includes(entry.role);
          const hasOwner = entry.role === 'owner' || !!entry.ownerUid;
          return canLink && hasOwner && entry.status !== 'archived';
        })
        .map(([id, entry]) => {
          const ownerUid = entry.role === 'owner' ? this.user.uid : entry.ownerUid;
          return {
            id,
            name: this.tournaments[id]?.name || entry.name || id,
            ref: encodeTournamentRef(ownerUid, id),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
  async mounted() {
    await this.loadRoutes();
  },
  methods: {
    async loadRoutes() {
      this.isLoading = true;
      try {
        const snapshot = await customRoutesService.getAll();
        if (snapshot.exists()) {
          const all = snapshot.val();
          this.routes = Object.entries(all)
            .filter(([, data]) => data.createdBy === this.user.uid)
            .map(([slug, data]) => ({ slug, ...data }))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } else {
          this.routes = [];
        }
      } catch {
        this.routes = [];
      }
      this.isLoading = false;
    },
    async createRoute() {
      if (!this.canCreate) return;
      const slug = this.newSlug.trim();
      const existing = await customRoutesService.get(slug);
      if (existing.exists()) {
        const store = useMainStore();
        store.showMessage({ title: this.$t('messages.error'), text: this.$t('common.slugTaken'), type: 'error' });
        return;
      }
      await customRoutesService.create(slug, {
        ref: null,
        title: this.newTitle.trim(),
        createdBy: this.user.uid,
        createdAt: Date.now(),
      });
      this.newSlug = '';
      this.newTitle = '';
      const store = useMainStore();
      store.showMessage({ title: this.$t('messages.success'), text: this.$t('common.routeCreated'), type: 'success' });
      await this.loadRoutes();
    },
    async linkTournament(slug, ref) {
      await customRoutesService.update(slug, { ref: ref || null });
      await this.loadRoutes();
    },
    async deleteRoute(slug) {
      if (!window.confirm(this.$t('common.deleteRouteConfirm'))) return;
      await customRoutesService.remove(slug);
      const store = useMainStore();
      store.showMessage({ title: this.$t('messages.success'), text: this.$t('common.routeDeleted'), type: 'success' });
      await this.loadRoutes();
    },
    getFullUrl(slug) {
      const domain = import.meta.env.PROD ? '/petanque-draw/#/' : '/#/';
      return `${window.location.origin}${domain}public/${slug}`;
    },
    copyUrl(slug) {
      copyContent(this.getFullUrl(slug));
      const store = useMainStore();
      store.showMessage({ title: this.$t('messages.success'), text: this.$t('common.urlCopied'), type: 'success' });
    },
    wrapCanvasText(context, text, maxWidth) {
      const lines = [];
      let currentLine = '';
      for (const word of String(text || '').split(/\s+/)) {
        const nextLine = currentLine ? `${currentLine} ${word}` : word;
        if (currentLine && context.measureText(nextLine).width > maxWidth) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = nextLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    },
    loadCanvasImage(source) {
      return new Promise((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = source;
      });
    },
    async createRouteQrPdfCanvas(route, qrSvg) {
      const canvas = document.createElement('canvas');
      const scale = 2;
      const pageWidth = 794;
      const pageHeight = 1123;
      canvas.width = pageWidth * scale;
      canvas.height = pageHeight * scale;
      const context = canvas.getContext('2d');
      context.scale(scale, scale);

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, pageWidth, pageHeight);
      context.textAlign = 'center';

      const logoImage = await this.loadCanvasImage(appLogoUrl);
      const logoWidth = 280;
      const logoHeight = logoWidth * (logoImage.naturalHeight / logoImage.naturalWidth);
      context.drawImage(logoImage, (pageWidth - logoWidth) / 2, 42, logoWidth, logoHeight);

      const titleText = route.title || this.$t('common.customRoutes');
      const titleSize = titleText.length > 70 ? 28 : titleText.length > 42 ? 34 : 42;
      const titleLineHeight = Math.round(titleSize * 1.18);
      context.fillStyle = '#172033';
      context.font = `800 ${titleSize}px Arial, sans-serif`;
      context.textBaseline = 'top';
      const titleLines = this.wrapCanvasText(context, titleText, 620).slice(0, 3);
      let cursorY = 172;
      titleLines.forEach((line) => {
        context.fillText(line, pageWidth / 2, cursorY);
        cursorY += titleLineHeight;
      });

      context.fillStyle = '#59647a';
      context.font = '400 18px Arial, sans-serif';
      const subtitleLines = this.wrapCanvasText(context, this.$t('common.qrPdfScanHint'), 600).slice(0, 2);
      cursorY += 14;
      subtitleLines.forEach((line) => {
        context.fillText(line, pageWidth / 2, cursorY);
        cursorY += 27;
      });

      const qrSize = 500;
      const qrPadding = 16;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = Math.max(cursorY + 30, 330);
      context.save();
      context.shadowColor = 'rgba(77, 45, 160, 0.16)';
      context.shadowBlur = 28;
      context.shadowOffsetY = 12;
      context.fillStyle = '#ffffff';
      context.strokeStyle = '#e5defb';
      context.lineWidth = 2;
      context.beginPath();
      context.roundRect(qrX - qrPadding, qrY - qrPadding, qrSize + qrPadding * 2, qrSize + qrPadding * 2, 24);
      context.fill();
      context.shadowColor = 'transparent';
      context.stroke();
      context.restore();

      const printableQr = qrSvg.cloneNode(true);
      printableQr.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      printableQr.setAttribute('width', String(qrSize));
      printableQr.setAttribute('height', String(qrSize));
      const svgBlob = new window.Blob([new window.XMLSerializer().serializeToString(printableQr)], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const svgUrl = window.URL.createObjectURL(svgBlob);
      try {
        const qrImage = await this.loadCanvasImage(svgUrl);
        context.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      } finally {
        window.URL.revokeObjectURL(svgUrl);
      }

      context.fillStyle = '#8a93a6';
      context.font = '400 12px Arial, sans-serif';
      context.textBaseline = 'middle';
      context.fillText('petanque.org.ua', pageWidth / 2, 1080);
      return canvas;
    },
    async exportRouteQrPdf(route) {
      if (this.exportingQrSlug) return;
      const routeQr = [...this.$el.querySelectorAll('[data-route-qr]')]
        .find((element) => element.dataset.routeQr === route.slug)
        ?.querySelector('svg');
      if (!routeQr) return;

      this.exportingQrSlug = route.slug;

      try {
        const [{ jsPDF }, canvas] = await Promise.all([import('jspdf'), this.createRouteQrPdfCanvas(route, routeQr)]);
        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        pdf.save(`${route.slug}-qr.pdf`);
      } catch (error) {
        console.error('QR PDF export error:', error);
        const store = useMainStore();
        store.showMessage({
          title: this.$t('messages.error'),
          text: this.$t('common.qrPdfError'),
          type: 'error',
        });
      } finally {
        this.exportingQrSlug = null;
      }
    },
  },
};
</script>

<style scoped>
.custom-routes {
  padding: 20px;
  max-width: 700px;
  margin: 0 auto;
}

.custom-routes__heading {
  color: var(--color-text);
  font-size: 1.4rem;
  margin: 0 0 24px;
}

.custom-routes__form {
  background: var(--color-surface);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-routes__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.custom-routes__label {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.custom-routes__input {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.95rem;
}

.custom-routes__input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.custom-routes__error {
  color: var(--color-danger);
  font-size: 0.8rem;
}

.custom-routes__hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  line-height: 1.45;
}

.custom-routes__hint svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--color-primary);
}

.custom-routes__btn {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.custom-routes__loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.custom-routes__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.custom-routes__empty {
  color: var(--color-text-secondary);
  text-align: center;
  padding: 40px;
}

.custom-routes__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.custom-routes__item {
  background: var(--color-surface);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.custom-routes__item-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  cursor: pointer;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px;
  background: #fff;
  color: #4e586c;
  font: inherit;
  transition: transform 0.2s;
}

.custom-routes__item-qr:hover {
  transform: scale(1.05);
}

.custom-routes__item-qr:focus-visible {
  outline: 3px solid var(--color-primary-light);
  outline-offset: 3px;
}

.custom-routes__qr-hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  font-weight: 600;
}

.custom-routes__item-body {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.custom-routes__item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.custom-routes__item-title {
  color: var(--color-text);
  font-weight: 600;
  font-size: 1.05rem;
}

.custom-routes__item-slug {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  background: var(--color-bg);
  padding: 2px 8px;
  border-radius: 4px;
  word-break: break-all;
}

.custom-routes__item-link {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-routes__item-link .select,
.custom-routes__item-link select {
  max-width: 100%;
}

.custom-routes__item-link .select:not(.is-multiple, .is-loading)::after {
  border-color: var(--color-text-secondary);
}

.custom-routes__item-link .select:not(.is-multiple, .is-loading):hover::after {
  border-color: var(--color-primary);
}

.custom-routes__item-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.custom-routes__action {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 6px 10px;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
}

.custom-routes__action:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.custom-routes__action:disabled {
  cursor: wait;
  opacity: 0.65;
}

.custom-routes__spin {
  animation: spin 0.8s linear infinite;
}

.custom-routes__action--danger:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

@media (max-width: 500px) {
  .custom-routes__item {
    flex-direction: column;
    align-items: center;
  }

  .custom-routes__item-body {
    width: 100%;
  }
}
</style>
