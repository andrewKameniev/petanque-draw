import { createApp, h, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { createRouter, createMemoryHistory } from 'vue-router';
import Message from './src/components/Message.vue';
import Tournament from './src/components/Tournament.vue';
import Results from './src/components/partials/Results.vue';
import ua from './src/locales/ua';
import { useMainStore } from './src/stores/main';
import { createTournamentRecord } from './src/services/tournament-record';
import './src/assets/css/bulma.min.css';
import './src/assets/css/style.css';

const pinia = createPinia();
setActivePinia(pinia);
const store = useMainStore();
store.user = { uid: 'local-club-check' };
store.currentTournamentIndex = 'local';
// Local UI exercise: real portal reads, no Firebase subscriptions or writes.
for (const method of [
  '_syncPaths',
  '_syncPath',
  '_doSync',
  '_syncMatchDebounced',
  'subscribeTournament',
  'unsubscribeTournament',
  'syncTournamentMessage',
])
  store[method] = async () => {};
store.tournaments = {
  local: createTournamentRecord({ id: 'local', name: 'Клубний турнір · імпорт 691', system: 'groups' }),
};
const preview = ref(false);
const app = createApp({
  render() {
    const button = (label, onClick) =>
      h('button', { type: 'button', class: 'button is-light is-small', onClick }, label);
    return h('main', { style: 'position:relative;z-index:1;max-width:1050px;margin:1rem auto;padding:0 .75rem' }, [
      h(
        'p',
        { class: 'mb-3', style: 'font-size:12px;color:var(--color-text-muted)' },
        'Локальна перевірка: імпорт із порталу за ID. Результати зберігаються лише в пам’яті сторінки.',
      ),
      h('nav', { class: 'buttons' }, [
        button(preview.value ? 'Арбітр' : 'Глядач', () => {
          preview.value = !preview.value;
        }),
        button('Повторно відкрити дані', () => {
          store.tournaments.local = JSON.parse(JSON.stringify(store.tournaments.local));
        }),
        button('Тема', () => {
          document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        }),
      ]),
      store.message.show ? h(Message) : null,
      preview.value ? h(Results, { previewTournament: store.activeTournament }) : h(Tournament),
    ]);
  },
});
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { render: () => null } }],
});
app
  .use(pinia)
  .use(router)
  .use(createI18n({ locale: 'ua', messages: { ua } }))
  .mount('#app');
