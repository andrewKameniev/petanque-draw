import { ref, watch } from 'vue';

const STORAGE_KEY = 'petanqueDrawTheme';

const theme = ref(localStorage.getItem(STORAGE_KEY) || 'light');

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value);
}

applyTheme(theme.value);

watch(theme, (value) => {
  localStorage.setItem(STORAGE_KEY, value);
  applyTheme(value);
});

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  }

  return {
    theme,
    toggleTheme,
  };
}
