<script>
import { mapState } from 'pinia';
import { useMainStore } from '@/stores/main';
import { version } from '../../../package.json';

export default {
  name: 'Footer',
  data() {
    return { appVersion: version };
  },
  computed: mapState(useMainStore, ['user']),
};
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__desktop">
      <div class="app-footer__line">
        <div class="app-footer__links">
          <router-link to="/docs">{{ $t('common.documentation') }}</router-link>
          <a href="http://portal.petanque.org.ua/" target="_blank">{{ $t('common.portal') }}</a>
        </div>
        <p class="app-footer__credit">
          {{ $t('common.developedBy') }} <a href="mailto:ancam1987@gmail.com">Andrii Kameniev</a> &
          <a href="mailto:nemo15.alex@gmail.com">Oleksandr Rozhok</a>
          <span class="app-footer__version">ver: {{ appVersion }}</span>
        </p>
      </div>
    </div>
    <p class="app-footer__credit app-footer__mobile-credit">
      {{ $t('common.developedBy') }} <a href="mailto:ancam1987@gmail.com">Andrii Kameniev</a> &
      <a href="mailto:nemo15.alex@gmail.com">Oleksandr Rozhok</a>
    </p>
  </footer>
</template>

<style scoped>
.app-footer {
  position: relative;
  z-index: 1;
  padding: 0.75rem 1.5rem;
  background: var(--color-white);
}

.app-footer__line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
}

.app-footer__links {
  display: flex;
  align-items: center;
}

.app-footer__links a {
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  padding: 0 0.6rem;
  border-right: 1px solid var(--color-border);
  line-height: 1;
  transition: color 0.2s;
}

.app-footer__links a:first-child {
  padding-left: 0;
}

.app-footer__links a:last-child {
  border-right: none;
}

.app-footer__links a:hover {
  color: var(--color-primary);
}

.app-footer__links a.router-link-exact-active {
  color: var(--color-primary);
}

.app-footer__credit {
  color: var(--color-text-muted);
  font-size: 1rem;
  margin: 0;
  white-space: nowrap;
  align-self: flex-end;
}

.app-footer__credit a {
  color: var(--color-text-muted);
  text-decoration: underline;
  transition: color 0.2s;
}

.app-footer__credit a:hover {
  color: var(--color-primary);
}

.app-footer__version {
  color: var(--color-text-muted);
  opacity: 0.5;
  margin-left: 0.5rem;
}

.app-footer__mobile-credit {
  display: none;
}

@media (max-width: 1023px) {
  .app-footer {
    background: transparent;
    padding: 1rem;
    text-align: center;
  }

  .app-footer__desktop {
    display: none;
  }

  .app-footer__mobile-credit {
    display: block;
  }
}
</style>
