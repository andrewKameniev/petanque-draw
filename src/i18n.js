import { createI18n } from 'vue-i18n'
import languages from "@/languages";

const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: languages
})

export default i18n
