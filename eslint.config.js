import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist/',
      'node_modules/',
      'public/',
      'src/assets/css/bulma.min.css',
      'playwright-report/',
      '.claude/',
      'functions/',
      'scripts/',
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  prettier,
  {
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        Range: 'readonly',
        Notification: 'readonly',
        process: 'readonly',
        importScripts: 'readonly',
        firebase: 'readonly',
        Event: 'readonly',
        atob: 'readonly',
        location: 'readonly',
        prompt: 'readonly',
        NodeFilter: 'readonly',
        requestAnimationFrame: 'readonly',
        IntersectionObserver: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-useless-assignment': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
    },
  },
];
