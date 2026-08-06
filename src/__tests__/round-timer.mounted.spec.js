// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import RoundTimer from '@/components/partials/RoundTimer.vue';
import RoundTimerControls from '@/components/ui/RoundTimerControls.vue';

const translations = {
  'common.cancel': 'Cancel',
  'timer.invalidData': 'Timer data is unavailable',
  'timer.invalidMinutes': 'Enter a whole number of minutes (at least 1)',
  'timer.invalidStatus': 'The timer status is invalid',
  'timer.min': 'min',
  'timer.pause': 'Pause',
  'timer.reset': 'Reset',
  'timer.restart': 'Restart timer',
  'timer.restartMinutes': 'Custom minutes',
  'timer.resume': 'Resume',
  'timer.startCustom': 'Start custom timer',
  'timer.startTimer': 'Start timer',
  'timer.timeLimitEnded': 'Time limit ended',
};

const wrappers = [];
const trackedMount = (component, options = {}) => {
  const wrapper = mount(component, {
    ...options,
    global: {
      ...(options.global || {}),
      mocks: { $t: (key) => translations[key] || key, ...(options.global?.mocks || {}) },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
};

const runningProps = (overrides = {}) => ({
  timerStatus: 'running',
  timerStartedAt: '2099-08-06T10:00:00.000Z',
  timerEndsAt: '2099-08-06T10:10:00.000Z',
  ...overrides,
});

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  vi.useRealTimers();
});

describe('RoundTimerControls mounted behavior', () => {
  it('starts only a known not-started timer from a native non-submit button', async () => {
    const wrapper = trackedMount(RoundTimerControls, { props: { timer: { timerStatus: 'not_started' } } });
    const start = wrapper.get('button');

    expect(start.attributes('type')).toBe('button');
    expect(start.text()).toContain('Start timer');
    await start.trigger('click');
    expect(wrapper.emitted('start')).toEqual([[]]);
  });

  it('fails closed for an unknown timer status', () => {
    const wrapper = trackedMount(RoundTimerControls, { props: { timer: { timerStatus: 'unknown' } } });

    expect(wrapper.findAll('button')).toHaveLength(0);
    expect(wrapper.get('[role="alert"]').text()).toBe('The timer status is invalid');
    expect(wrapper.emitted('start')).toBeUndefined();
  });
});

describe('RoundTimer mounted behavior', () => {
  it('keeps the timer container passive and exposes separate named native controls', async () => {
    const wrapper = trackedMount(RoundTimer, { props: runningProps() });
    const root = wrapper.get('.round-timer');
    const buttons = wrapper.findAll('button');
    const visibleButtons = buttons.filter((button) => button.isVisible());

    expect(root.attributes('role')).toBeUndefined();
    expect(root.attributes('tabindex')).toBeUndefined();
    expect(visibleButtons).toHaveLength(3);
    expect(buttons.every((button) => button.attributes('type') === 'button')).toBe(true);
    expect(wrapper.get('.round-timer__restart-toggle').attributes()).toMatchObject({
      'aria-expanded': 'false',
      'aria-label': expect.stringContaining('Restart timer'),
    });
    expect(wrapper.get('[aria-label="Pause"]').find('svg').attributes('aria-hidden')).toBe('true');

    await wrapper.get('[aria-label="Pause"]').trigger('click');
    await wrapper.get('[aria-label="Reset"]').trigger('click');
    expect(wrapper.emitted('pause')).toEqual([[]]);
    expect(wrapper.emitted('reset')).toEqual([[]]);
  });

  it('renders read-only output without interactive descendants', () => {
    const wrapper = trackedMount(RoundTimer, { props: runningProps({ readOnly: true }) });

    expect(wrapper.findAll('button, input, [tabindex]')).toHaveLength(0);
    expect(wrapper.get('.round-timer__icon').attributes('aria-hidden')).toBe('true');
  });

  it('updates a read-only countdown without emitting a persistence event at expiry', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-06T10:00:00.000Z'));
    const wrapper = trackedMount(RoundTimer, {
      props: runningProps({ readOnly: true, timerEndsAt: '2026-08-06T10:00:01.000Z' }),
    });

    await vi.advanceTimersByTimeAsync(1_000);

    expect(wrapper.text()).toContain('Time limit ended');
    expect(wrapper.emitted('timer-ended')).toBeUndefined();
  });

  it('renders and emits the paused, resumed, and ended states through separate controls', async () => {
    const paused = trackedMount(RoundTimer, {
      props: { timerStatus: 'paused', remainingMs: 90_000 },
    });
    expect(paused.get('.round-timer__text').text()).toBe('1:30');
    await paused.get('[aria-label="Resume"]').trigger('click');
    expect(paused.emitted('resume')).toEqual([[]]);

    const ended = trackedMount(RoundTimer, { props: { timerStatus: 'ended' } });
    expect(ended.text()).toContain('Time limit ended');
    expect(ended.find('[aria-label="Pause"]').exists()).toBe(false);
    expect(ended.find('[aria-label="Resume"]').exists()).toBe(false);
  });

  it('normalizes preset and custom restart payloads and exposes input validation', async () => {
    const wrapper = trackedMount(RoundTimer, { props: runningProps() });
    await wrapper.get('.round-timer__restart-toggle').trigger('click');

    const panel = wrapper.get('.round-timer__restart');
    expect(wrapper.get('.round-timer__restart-toggle').attributes('aria-controls')).toBe(panel.attributes('id'));
    expect(wrapper.get('.round-timer__restart-toggle').attributes('aria-expanded')).toBe('true');
    const input = wrapper.get('input[type="number"]');
    expect(wrapper.get(`label[for="${input.attributes('id')}"]`).text()).toBe('Custom minutes');

    await input.setValue('0');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('.round-timer__restart-error').text()).toBe('Enter a whole number of minutes (at least 1)');

    await input.setValue('1.5');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('[aria-label="Start custom timer"]').attributes('disabled')).toBeDefined();
    await wrapper.get('[aria-label="Start custom timer"]').trigger('click');
    expect(wrapper.emitted('restart')).toBeUndefined();

    await input.setValue('12');
    await wrapper.get('[aria-label="Start custom timer"]').trigger('click');
    expect(wrapper.emitted('restart')).toEqual([[12]]);

    await wrapper.get('.round-timer__restart-toggle').trigger('click');
    await wrapper.findAll('.round-timer__restart-btn')[1].trigger('click');
    expect(wrapper.emitted('restart')).toEqual([[12], [10]]);
  });

  it('announces malformed running timer data instead of rendering NaN', () => {
    const wrapper = trackedMount(RoundTimer, { props: runningProps({ timerEndsAt: 'not-a-date' }) });

    expect(wrapper.get('[role="alert"]').text()).toBe('Timer data is unavailable');
    expect(wrapper.text()).not.toContain('NaN');
    expect(wrapper.findAll('button, input')).toHaveLength(0);
  });

  it('emits timer-ended once per running deadline transition and cleans up on unmount', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-06T10:00:00.000Z'));
    const wrapper = trackedMount(RoundTimer, {
      props: runningProps({ timerEndsAt: '2026-08-06T10:00:01.000Z' }),
    });

    await vi.advanceTimersByTimeAsync(1_000);
    expect(wrapper.emitted('timer-ended')).toEqual([[]]);
    await vi.advanceTimersByTimeAsync(2_000);
    await wrapper.setProps({ timerStatus: 'ended' });
    expect(wrapper.emitted('timer-ended')).toEqual([[]]);

    await wrapper.setProps({ timerStatus: 'running', timerEndsAt: '2026-08-06T10:00:04.000Z' });
    await vi.advanceTimersByTimeAsync(1_000);
    expect(wrapper.emitted('timer-ended')).toEqual([[], []]);

    await wrapper.setProps({ timerEndsAt: '2026-08-06T10:00:10.000Z' });
    expect(wrapper.vm.interval).not.toBeNull();
    wrapper.unmount();
    wrappers.splice(wrappers.indexOf(wrapper), 1);
    expect(wrapper.vm.interval).toBeNull();
  });
});
