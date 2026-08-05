import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import en from '@/locales/en';
import es from '@/locales/es';
import fr from '@/locales/fr';
import ua from '@/locales/ua';

const source = readFileSync(new URL('../views/CustomRoutes.vue', import.meta.url), 'utf8');

describe('custom route QR PDF', () => {
  it('makes QR enlargement discoverable and accessible', () => {
    expect(source).toContain("$t('common.routeTitleHint')");
    expect(source).toContain("'common.qrExpandHint'");
    expect(source).toContain("'common.qrCollapseHint'");
    expect(source).toContain(':aria-expanded="expandedQr === route.slug"');
  });

  it('exports a one-page A4 PDF with the app logo and no URL or decorative line', () => {
    expect(source).toContain('@click="exportRouteQrPdf(route)"');
    expect(source).toContain("import('jspdf')");
    expect(source).toContain("import appLogoUrl from '@/assets/img/logo.webp'");
    expect(source).not.toContain("'PETANQUE • LIVE RESULTS'");
    expect(source).not.toContain('context.roundRect(370, 140, 54, 4, 2)');
    expect(source).not.toContain('const urlLines');
    expect(source).toContain("format: 'a4', orientation: 'portrait', compress: true");
    expect(source).toContain("pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297");
  });

  it('provides the guidance in every supported language', () => {
    for (const locale of [en, es, fr, ua]) {
      expect(locale.common.routeTitleHint).toBeTruthy();
      expect(locale.common.qrExpandHint).toBeTruthy();
      expect(locale.common.qrCollapseHint).toBeTruthy();
      expect(locale.common.downloadQrPdf).toBeTruthy();
      expect(locale.common.qrPdfScanHint).toBeTruthy();
    }
  });
});
