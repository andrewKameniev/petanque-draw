// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PageLoader from '@/components/ui/PageLoader.vue';
import RoundTimerControls from '@/components/ui/RoundTimerControls.vue';
import ScrollButtons from '@/components/ui/ScrollButtons.vue';
import TirScoreCircle from '@/components/ui/TirScoreCircle.vue';
import TournamentNav from '@/components/ui/TournamentNav.vue';

const t = (key) => key;
const mountWithI18n = (component, options = {}) =>
  mount(component, {
    ...options,
    global: {
      ...options.global,
      mocks: { $t: t, ...options.global?.mocks },
    },
  });

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('Task 11 mounted compatibility baseline', () => {
  it('renders PageLoader with the supplied accessible status text', () => {
    const wrapper = mount(PageLoader, { props: { label: 'Loading tournament' } });
    expect(wrapper.get('[role="status"]').attributes('aria-live')).toBe('polite');
    expect(wrapper.get('.visually-hidden').text()).toBe('Loading tournament');
  });

  it('drives TournamentNav selection through a real click', async () => {
    const wrapper = mount(TournamentNav, {
      props: {
        tabs: [
          { id: 'teams', label: 'Teams' },
          { id: 'games', label: 'Games' },
        ],
        modelValue: 'teams',
        label: 'Tournament sections',
        idPrefix: 'baseline-nav',
        panelId: 'baseline-panel',
      },
    });

    await wrapper.get('#baseline-nav-games').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['games']]);
    expect(wrapper.emitted('change')).toEqual([['games']]);
  });

  it('drives TournamentNav keyboard selection and focus through the DOM', async () => {
    const wrapper = mount(TournamentNav, {
      attachTo: document.body,
      props: {
        tabs: [
          { id: 'teams', label: 'Teams' },
          { id: 'games', label: 'Games' },
        ],
        modelValue: 'teams',
        label: 'Tournament sections',
        idPrefix: 'keyboard-nav',
        panelId: 'keyboard-panel',
      },
    });

    await wrapper.get('#keyboard-nav-teams').trigger('keydown', { key: 'ArrowRight' });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:modelValue')).toEqual([['games']]);
    expect(document.activeElement).toBe(wrapper.get('#keyboard-nav-games').element);
  });

  it('scrolls the explicitly configured container', async () => {
    const target = document.createElement('div');
    target.id = 'mounted-scroll-target';
    target.scrollTo = vi.fn();
    Object.defineProperty(target, 'scrollHeight', { value: 600 });
    document.body.append(target);

    const wrapper = mount(ScrollButtons, {
      attachTo: document.body,
      props: { containerSelector: '#mounted-scroll-target' },
    });
    await wrapper.findAll('button')[1].trigger('click');
    expect(target.scrollTo).toHaveBeenCalledWith({ top: 600, behavior: 'smooth' });
  });

  it('emits TirScoreCircle selection through its native button', async () => {
    const wrapper = mount(TirScoreCircle, {
      props: { result: 'carreau', interactive: true, active: false, ariaLabel: 'Choose carreau' },
    });
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('select')).toEqual([['carreau']]);
  });

  it('emits the timer start action from the rendered control', async () => {
    const wrapper = mountWithI18n(RoundTimerControls, {
      props: { timer: { timerStatus: 'not_started' } },
    });
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('start')).toHaveLength(1);
  });
});
