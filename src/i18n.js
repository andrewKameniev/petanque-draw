import { createI18n } from 'vue-i18n';
import en from '@/locales/en';
import ua from '@/locales/ua';
import fr from '@/locales/fr';
import es from '@/locales/es';

const i18n = createI18n({
    locale: localStorage.getItem('petanqueDrawLang') || 'ua',
    fallbackLocale: 'en',
    messages: { en, ua, fr, es },
});

const loadedModules = new Set();

export async function loadLocaleModule(module) {
    if (loadedModules.has(module)) return;
    const loader = {
        stat: () => import('@/locales/stat.js'),
        help: () => import('@/locales/help.js'),
        training: () => import('@/locales/training.js'),
        docs: () => import('@/locales/docs.js'),
    };
    if (!loader[module]) return;
    const messages = await loader[module]();
    i18n.global.mergeLocaleMessage('en', messages.default.en);
    i18n.global.mergeLocaleMessage('ua', messages.default.ua);
    if (messages.default.fr) i18n.global.mergeLocaleMessage('fr', messages.default.fr);
    if (messages.default.es) i18n.global.mergeLocaleMessage('es', messages.default.es);
    loadedModules.add(module);
}

export default i18n;
