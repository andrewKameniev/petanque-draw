import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/', 'node_modules/', 'public/', 'src/assets/css/bulma.min.css', 'playwright-report/', '.claude/'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  prettier,
  {
    files: ['src/**/*.{js,vue}'],
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
        URL: 'readonly',
      },
    },
  },
  {
    files: [
      'scripts/**/*.{js,mjs,cjs}',
      'functions/**/*.{js,mjs,cjs}',
      '*.config.js',
      'vite.config.js',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
      },
    },
  },
  {
    files: ['e2e/**/*.{js,vue}', 'playwright*.config.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        document: 'readonly',
        window: 'readonly',
        Event: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        localStorage: 'readonly',
      },
    },
  },
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-useless-assignment': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
    },
  },
  {
    files: ['scripts/**/*.{js,mjs,cjs}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['tests/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
  },
];
