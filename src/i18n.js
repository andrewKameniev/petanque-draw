import { createI18n } from 'vue-i18n'
import languages from "@/languages";

const i18n = createI18n({
    locale: localStorage.getItem('petanqueDrawLang') || 'ua',
    fallbackLocale: 'en',
    messages: languages
})

const loadedModules = new Set();

export async function loadLocaleModule(module) {
    if (loadedModules.has(module)) return;
    const loader = {
        stat: () => import('@/locales/stat.js'),
        help: () => import('@/locales/help.js'),
        training: () => import('@/locales/training.js'),
    };
    if (!loader[module]) return;
    const messages = await loader[module]();
    i18n.global.mergeLocaleMessage('en', messages.default.en);
    i18n.global.mergeLocaleMessage('ua', messages.default.ua);
    loadedModules.add(module);
}

export default i18n
