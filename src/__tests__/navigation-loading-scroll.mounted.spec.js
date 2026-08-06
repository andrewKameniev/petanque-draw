// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PageLoader from '@/components/ui/PageLoader.vue';
import ScrollButtons from '@/components/ui/ScrollButtons.vue';
import TournamentNav from '@/components/ui/TournamentNav.vue';
import en from '@/locales/en';
import es from '@/locales/es';
import fr from '@/locales/fr';
import ua from '@/locales/ua';

const tabs = [
  { id: 'teams', label: 'Teams' },
  { id: 'games', label: 'Games' },
  { id: 'results', label: 'Results' },
];

const navProps = (overrides = {}) => ({
  tabs,
  modelValue: 'teams',
  label: 'Tournament sections',
  panelId: 'test-panel',
  idPrefix: 'test-tab',
  ...overrides,
});

const scrollProps = (overrides = {}) => ({
  target: 'container',
  containerSelector: '#scroll-target',
  topLabel: 'Scroll to top',
  bottomLabel: 'Scroll to bottom',
  ...overrides,
});

const wrappers = [];
const trackedMount = (component, options) => {
  const wrapper = mount(component, options);
  wrappers.push(wrapper);
  return wrapper;
};

const setReducedMotion = (matches) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
};

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('TournamentNav mounted behavior', () => {
  it('renders one localized, linked, keyboard-reachable selected tab', () => {
    const wrapper = trackedMount(TournamentNav, { props: navProps() });
    const tablist = wrapper.get('[role="tablist"]');
    const renderedTabs = wrapper.findAll('[role="tab"]');

    expect(tablist.attributes('aria-label')).toBe('Tournament sections');
    expect(renderedTabs).toHaveLength(3);
    expect(renderedTabs.every((tab) => tab.attributes('type') === 'button')).toBe(true);
    expect(renderedTabs.every((tab) => tab.attributes('aria-controls') === 'test-panel')).toBe(true);
    expect(renderedTabs.filter((tab) => tab.attributes('aria-selected') === 'true')).toHaveLength(1);
    expect(renderedTabs.filter((tab) => tab.attributes('tabindex') === '0')).toHaveLength(1);
    expect(wrapper.get('#test-tab-teams').classes()).toContain('tournament-nav__btn--active');
  });

  it('uses native buttons and emits the documented payloads once per native click', async () => {
    const wrapper = trackedMount(TournamentNav, { props: navProps() });

    await wrapper.get('#test-tab-games').trigger('click');

    expect(wrapper.get('#test-tab-games').attributes('type')).toBe('button');
    expect(wrapper.emitted('update:modelValue')).toEqual([['games']]);
    expect(wrapper.emitted('change')).toEqual([['games']]);
  });

  it.each([
    ['ArrowRight', 'results', 'teams'],
    ['ArrowLeft', 'teams', 'results'],
    ['Home', 'results', 'teams'],
    ['End', 'teams', 'results'],
  ])('moves focus and auto-activates with %s', async (key, startId, expectedId) => {
    const wrapper = trackedMount(TournamentNav, {
      attachTo: document.body,
      props: navProps({ modelValue: startId, idPrefix: `key-${key.toLowerCase()}` }),
    });
    const start = wrapper.get(`#key-${key.toLowerCase()}-${startId}`);
    start.element.focus();

    await start.trigger('keydown', { key });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')).toEqual([[expectedId]]);
    expect(wrapper.emitted('change')).toEqual([[expectedId]]);
    expect(document.activeElement).toBe(wrapper.get(`#key-${key.toLowerCase()}-${expectedId}`).element);
  });

  it('recovers an invalid model and a dynamically removed active tab exactly once per invalid state', async () => {
    const wrapper = trackedMount(TournamentNav, {
      props: navProps({ modelValue: 'missing' }),
    });

    expect(wrapper.findAll('[aria-selected="true"]')).toHaveLength(1);
    expect(wrapper.findAll('[tabindex="0"]')).toHaveLength(1);
    expect(wrapper.get('#test-tab-teams').attributes('aria-selected')).toBe('true');
    expect(wrapper.emitted('update:modelValue')).toEqual([['teams']]);
    expect(wrapper.emitted('change')).toBeUndefined();

    await wrapper.setProps({ modelValue: 'teams' });
    await wrapper.setProps({ tabs: tabs.slice(1) });

    expect(wrapper.findAll('[aria-selected="true"]')).toHaveLength(1);
    expect(wrapper.findAll('[tabindex="0"]')).toHaveLength(1);
    expect(wrapper.get('#test-tab-games').attributes('aria-selected')).toBe('true');
    expect(wrapper.emitted('update:modelValue')).toEqual([['teams'], ['games']]);

    await wrapper.setProps({ tabs: tabs.slice(1) });
    expect(wrapper.emitted('update:modelValue')).toEqual([['teams'], ['games']]);
  });

  it('keeps simultaneous instances on explicitly separate id namespaces', () => {
    const first = trackedMount(TournamentNav, { attachTo: document.body, props: navProps({ idPrefix: 'first-tab' }) });
    const second = trackedMount(TournamentNav, {
      attachTo: document.body,
      props: navProps({ idPrefix: 'second-tab', panelId: 'second-panel' }),
    });
    const ids = [...first.findAll('[role="tab"]'), ...second.findAll('[role="tab"]')].map((tab) =>
      tab.attributes('id'),
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rejects empty and duplicate tab ids and empty accessible contract values', () => {
    expect(TournamentNav.props.tabs.validator(tabs)).toBe(true);
    expect(TournamentNav.props.tabs.validator([{ id: '', label: 'Empty' }])).toBe(false);
    expect(
      TournamentNav.props.tabs.validator([
        { id: 'same', label: 'First' },
        { id: 'same', label: 'Second' },
      ]),
    ).toBe(false);
    expect(TournamentNav.props.label.validator('  ')).toBe(false);
    expect(TournamentNav.props.panelId.validator('')).toBe(false);
    expect(TournamentNav.props.idPrefix.validator('tabs')).toBe(true);
  });
});

describe('PageLoader mounted behavior', () => {
  it.each([
    ['en', en],
    ['ua', ua],
    ['fr', fr],
    ['es', es],
  ])('renders one live status message for the %s locale', (_locale, messages) => {
    const wrapper = trackedMount(PageLoader, { props: { label: messages.common.loading } });
    const status = wrapper.get('[role="status"]');

    expect(status.attributes('aria-live')).toBe('polite');
    expect(status.attributes('aria-atomic')).toBe('true');
    expect(status.attributes('aria-label')).toBeUndefined();
    const label = wrapper.get('.visually-hidden');
    expect(status.attributes('aria-labelledby')).toBe(label.attributes('id'));
    expect(label.text()).toBe(messages.common.loading);
    expect(wrapper.get('.page-loader__visual').attributes('aria-hidden')).toBe('true');
    expect(wrapper.findAll('button, a, input, select, textarea, [tabindex]')).toHaveLength(0);
  });

  it('requires a non-empty label', () => {
    expect(PageLoader.props.label.required).toBe(true);
    expect(PageLoader.props.label.validator('Loading tournament')).toBe(true);
    expect(PageLoader.props.label.validator('   ')).toBe(false);
  });

  it('uses a unique label id for each simultaneous loader instance', () => {
    const host = trackedMount(
      {
        components: { PageLoader },
        template: `
          <div>
            <PageLoader label="Loading first tournament" />
            <PageLoader label="Loading second tournament" />
          </div>
        `,
      },
      {},
    );
    const [first, second] = host.findAllComponents(PageLoader);

    expect(first.get('[role="status"]').attributes('aria-labelledby')).not.toBe(
      second.get('[role="status"]').attributes('aria-labelledby'),
    );
  });
});

describe('ScrollButtons mounted behavior', () => {
  it('names native non-submit controls and hides their decorative icons', () => {
    const target = document.createElement('div');
    target.id = 'scroll-target';
    target.scrollTo = vi.fn();
    document.body.append(target);
    const form = document.createElement('form');
    document.body.append(form);
    const onSubmit = vi.fn((event) => event.preventDefault());
    form.addEventListener('submit', onSubmit);

    const wrapper = trackedMount(ScrollButtons, { attachTo: form, props: scrollProps() });
    const [top, bottom] = wrapper.findAll('button');

    expect(top.attributes()).toMatchObject({ type: 'button', 'aria-label': 'Scroll to top', title: 'Scroll to top' });
    expect(bottom.attributes()).toMatchObject({
      type: 'button',
      'aria-label': 'Scroll to bottom',
      title: 'Scroll to bottom',
    });
    expect(wrapper.findAll('svg').every((icon) => icon.attributes('aria-hidden') === 'true')).toBe(true);

    top.element.click();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('scrolls only the configured container to its exact top and bottom', async () => {
    setReducedMotion(false);
    const target = document.createElement('div');
    target.id = 'scroll-target';
    target.scrollTo = vi.fn();
    Object.defineProperty(target, 'scrollHeight', { configurable: true, value: 640 });
    document.body.append(target);
    const windowScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const wrapper = trackedMount(ScrollButtons, { props: scrollProps() });

    await wrapper.findAll('button')[0].trigger('click');
    await wrapper.findAll('button')[1].trigger('click');

    expect(target.scrollTo).toHaveBeenNthCalledWith(1, { top: 0, behavior: 'smooth' });
    expect(target.scrollTo).toHaveBeenNthCalledWith(2, { top: 640, behavior: 'smooth' });
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it('uses intentional window mode and the full document height', async () => {
    setReducedMotion(false);
    const windowScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const wrapper = trackedMount(ScrollButtons, {
      props: scrollProps({ target: 'window', containerSelector: null }),
    });
    vi.spyOn(wrapper.vm, 'getDocumentHeight').mockReturnValue(900);

    await wrapper.findAll('button')[0].trigger('click');
    await wrapper.findAll('button')[1].trigger('click');

    expect(windowScroll).toHaveBeenNthCalledWith(1, { top: 0, behavior: 'smooth' });
    expect(windowScroll).toHaveBeenNthCalledWith(2, { top: 900, behavior: 'smooth' });
  });

  it('uses instant scrolling when reduced motion is requested', async () => {
    setReducedMotion(true);
    const target = document.createElement('div');
    target.id = 'scroll-target';
    target.scrollTo = vi.fn();
    document.body.append(target);
    const wrapper = trackedMount(ScrollButtons, { props: scrollProps() });

    await wrapper.findAll('button')[0].trigger('click');

    expect(target.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it.each(['#missing-target', '['])('warns and no-ops for unavailable selector %s', async (selector) => {
    setReducedMotion(false);
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const windowScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const wrapper = trackedMount(ScrollButtons, {
      props: scrollProps({ containerSelector: selector }),
    });

    await wrapper.findAll('button')[0].trigger('click');

    expect(warning).toHaveBeenCalledOnce();
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it('validates the explicit target and localized labels', () => {
    expect(ScrollButtons.props.target.validator('window')).toBe(true);
    expect(ScrollButtons.props.target.validator('container')).toBe(true);
    expect(ScrollButtons.props.target.validator('auto')).toBe(false);
    expect(ScrollButtons.props.topLabel.validator('Scroll to top')).toBe(true);
    expect(ScrollButtons.props.topLabel.validator('')).toBe(false);
    expect(ScrollButtons.props.bottomLabel.validator('   ')).toBe(false);
  });
});

describe('localized primitive contracts', () => {
  it.each([
    ['en', en],
    ['ua', ua],
    ['fr', fr],
    ['es', es],
  ])('defines loading, navigation, and scroll labels in %s', (_locale, messages) => {
    for (const key of ['loading', 'tournamentSections', 'scrollToTop', 'scrollToBottom']) {
      expect(messages.common[key]?.trim()).toBeTruthy();
    }
  });
});
