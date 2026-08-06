// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import TirAtelierTabs from '@/components/ui/TirAtelierTabs.vue';
import TirRoundTabs from '@/components/ui/TirRoundTabs.vue';
import TirScoreCircle from '@/components/ui/TirScoreCircle.vue';
import TirScoreGrid from '@/components/ui/TirScoreGrid.vue';
import TirScoreLegend from '@/components/ui/TirScoreLegend.vue';
import TrainingSession from '@/components/training/TrainingSession.vue';

const wrappers = [];
const trackedMount = (component, options = {}) => {
  const wrapper = mount(component, {
    ...options,
    global: {
      ...(options.global || {}),
      mocks: { $t: (key) => key, ...(options.global?.mocks || {}) },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
};

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
});

describe('TirScoreCircle mounted behavior', () => {
  it.each(['carreau', 'reussi', 'touche', 'manque'])('preserves the %s result state and payload', async (result) => {
    const wrapper = trackedMount(TirScoreCircle, {
      props: { result, interactive: true, active: true, ariaLabel: `Choose ${result}` },
    });
    const button = wrapper.get('button');

    expect(button.classes()).toContain(`tir-score-circle--${result}`);
    expect(button.attributes('aria-pressed')).toBe('true');
    await button.trigger('click');
    expect(wrapper.emitted('select')).toEqual([[result]]);
  });

  it('uses a named native toggle with a visible non-color selected cue', async () => {
    const wrapper = trackedMount(TirScoreCircle, {
      props: { result: 'carreau', interactive: true, active: true, ariaLabel: '6m, Carreau' },
    });
    const button = wrapper.get('button');

    expect(button.attributes()).toMatchObject({ type: 'button', 'aria-label': '6m, Carreau', 'aria-pressed': 'true' });
    expect(wrapper.get('.tir-score-circle__cue').attributes('aria-hidden')).toBe('true');
    await button.trigger('click');
    expect(wrapper.emitted('select')).toEqual([['carreau']]);
  });

  it('labels active read-only results and hides inactive decorative circles', () => {
    const active = trackedMount(TirScoreCircle, {
      props: { result: 'touche', active: true, ariaLabel: 'Atelier 1, 7m, Touché' },
    });
    const inactive = trackedMount(TirScoreCircle, { props: { result: 'manque', ariaLabel: 'Missed' } });

    expect(active.get('[role="img"]').attributes('aria-label')).toBe('Atelier 1, 7m, Touché');
    expect(active.find('.tir-score-circle__cue').exists()).toBe(true);
    expect(inactive.get('.tir-score-circle').attributes('aria-hidden')).toBe('true');
    expect(inactive.find('[role="img"]').exists()).toBe(false);
  });

  it('preserves native disabled behavior without emitting a selection', async () => {
    const wrapper = trackedMount(TirScoreCircle, {
      props: { result: 'reussi', interactive: true, disabled: true, ariaLabel: 'Choose réussi' },
    });

    expect(wrapper.get('button').attributes('disabled')).toBe('');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('select')).toBeUndefined();
  });
});

describe('TirScoreGrid mounted behavior', () => {
  it('emits the documented selection payload and reacts to controlled score updates', async () => {
    const wrapper = trackedMount(TirScoreGrid, { props: { distances: [6], scores: {} } });
    const carreau = wrapper.get('[aria-label="6m, tir.carreau"]');

    expect(carreau.attributes('type')).toBe('button');
    expect(carreau.attributes('aria-pressed')).toBe('false');
    await carreau.trigger('click');
    expect(wrapper.emitted('select')).toEqual([[{ distance: 6, result: 'carreau' }]]);

    await wrapper.setProps({ scores: { 6: 'carreau' } });
    expect(carreau.attributes('aria-pressed')).toBe('true');
    expect(carreau.find('svg').attributes('aria-hidden')).toBe('true');
  });

  it('disables every scoring control in read-only mode', () => {
    const wrapper = trackedMount(TirScoreGrid, { props: { distances: [6, 7], readOnly: true } });

    expect(wrapper.findAll('button')).toHaveLength(8);
    expect(wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined)).toBe(true);
  });

  it.each([
    ['junior', [6, 7, 8], 12],
    ['senior', [6, 7, 8, 9], 16],
  ])('renders the complete %s distance contract', (_division, distances, expectedControls) => {
    const wrapper = trackedMount(TirScoreGrid, { props: { distances } });

    expect(wrapper.findAll('button')).toHaveLength(expectedControls);
    for (const distance of distances) {
      expect(wrapper.findAll(`[aria-label^="${distance}m,"]`)).toHaveLength(4);
    }
  });
});

describe('Tir tab primitives mounted behavior', () => {
  const atelierItems = [
    { id: 0, label: '1' },
    { id: 1, label: '2' },
  ];

  it('recovers an invalid atelier selection with one selected roving tab', () => {
    const wrapper = trackedMount(TirAtelierTabs, {
      props: {
        items: atelierItems,
        modelValue: 99,
        label: 'Scoring ateliers',
        completeLabel: 'Completed',
        panelId: 'atelier-panel',
      },
    });
    const tabs = wrapper.findAll('[role="tab"]');

    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toBe('Scoring ateliers');
    expect(tabs.filter((tab) => tab.attributes('aria-selected') === 'true')).toHaveLength(1);
    expect(tabs.filter((tab) => tab.attributes('tabindex') === '0')).toHaveLength(1);
    expect(tabs.every((tab) => tab.attributes('aria-controls') === 'atelier-panel')).toBe(true);
    expect(wrapper.emitted('update:modelValue')).toEqual([[0]]);
  });

  it('moves focus and emits the next atelier on ArrowRight', async () => {
    const wrapper = trackedMount(TirAtelierTabs, {
      attachTo: document.body,
      props: {
        items: atelierItems,
        modelValue: 0,
        label: 'Scoring ateliers',
        completeLabel: 'Completed',
        idPrefix: 'atelier-test',
      },
    });
    const first = wrapper.get('#atelier-test-0');
    first.element.focus();
    await first.trigger('keydown', { key: 'ArrowRight' });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')).toEqual([[1]]);
    expect(document.activeElement).toBe(wrapper.get('#atelier-test-1').element);
  });

  it('exposes a visible and named completion cue without relying on color', () => {
    const wrapper = trackedMount(TirAtelierTabs, {
      props: {
        items: [{ id: 0, label: '1', complete: true }],
        modelValue: 0,
        label: 'Scoring ateliers',
        completeLabel: 'Completed',
      },
    });
    const tab = wrapper.get('[role="tab"]');

    expect(tab.get('.tir-atelier-tabs__complete-icon').attributes('aria-hidden')).toBe('true');
    expect(tab.text()).toContain('Completed');
  });

  it('generates unique ids for simultaneous round-tab instances', () => {
    const host = trackedMount(
      {
        components: { TirRoundTabs },
        template: `
          <div>
            <TirRoundTabs :tabs="tabs" model-value="r1" label="First rounds" />
            <TirRoundTabs :tabs="tabs" model-value="r1" label="Second rounds" />
          </div>
        `,
        data: () => ({ tabs: [{ key: 'r1', label: 'Round 1' }] }),
      },
      {},
    );
    const ids = host.findAll('[role="tab"]').map((tab) => tab.attributes('id'));

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rejects blank and normalized duplicate identifiers', () => {
    expect(TirAtelierTabs.props.items.validator(atelierItems)).toBe(true);
    expect(TirAtelierTabs.props.items.validator([{ id: ' ', label: 'Invalid' }])).toBe(false);
    expect(
      TirRoundTabs.props.tabs.validator([
        { key: 1, label: 'One' },
        { key: '1', label: 'Duplicate' },
      ]),
    ).toBe(false);
    expect(TirRoundTabs.props.label.validator('   ')).toBe(false);
  });
});

describe('TirScoreLegend mounted behavior', () => {
  it('keeps color markers decorative and localizes the points unit', () => {
    const wrapper = trackedMount(TirScoreLegend, { props: { variant: 'badge' } });

    expect(wrapper.findAll('.tir-score-legend__marker')).toHaveLength(4);
    expect(
      wrapper.findAll('.tir-score-legend__marker').every((marker) => marker.attributes('aria-hidden') === 'true'),
    ).toBe(true);
    expect(wrapper.text()).toContain('ranking.points');
  });
});

describe('Training Tir primitive integration', () => {
  it('emits an updated session copy without mutating the input prop', async () => {
    const session = {
      name: 'Accuracy',
      status: 'draft',
      createdAt: 0,
      config: { exercises: [0], distances: [6], attempts: 1 },
      attempts: [],
    };
    const wrapper = trackedMount(TrainingSession, { props: { session } });

    await wrapper.get('button.tir-score-circle--carreau').trigger('click');

    expect(session).toEqual(expect.objectContaining({ status: 'draft', attempts: [] }));
    const updatedSession = wrapper.emitted('update')[0][0];
    expect(updatedSession).not.toBe(session);
    expect(updatedSession.status).toBe('in_progress');
    expect(updatedSession.attempts).toEqual([{ exerciseIndex: 0, distance: 6, attemptNumber: 1, score: 'carreau' }]);
  });

  it('renders completed training scores as named read-only circles', () => {
    const wrapper = trackedMount(TrainingSession, {
      props: {
        session: {
          name: 'Accuracy',
          status: 'completed',
          createdAt: 0,
          config: { exercises: [0], distances: [6], attempts: 1 },
          attempts: [{ exerciseIndex: 0, distance: 6, attemptNumber: 1, score: 'carreau' }],
        },
      },
    });
    const circles = wrapper.findAllComponents(TirScoreCircle);

    expect(circles).toHaveLength(4);
    expect(circles.filter((circle) => circle.props('interactive'))).toHaveLength(0);
    expect(wrapper.get('.tir-score-circle--carreau[role="img"]').attributes('aria-label')).toContain('6m');
    expect(wrapper.findAll('button.tir-score-circle')).toHaveLength(0);
  });
});
