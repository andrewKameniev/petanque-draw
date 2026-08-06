// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Training from '@/views/Training.vue';

const completedSession = {
  id: 'session-1',
  name: 'Precision session',
  type: 'tir_full',
  status: 'completed',
  createdAt: Date.UTC(2026, 7, 6, 12),
  updatedAt: Date.UTC(2026, 7, 6, 13),
  config: { exercises: [0], distances: [6], attempts: 1 },
  attempts: [],
};

const exercise = {
  name: 'Distance control',
  distances: [6, 7],
  length: 5,
};

function trainingHarness(data = {}) {
  return {
    ...Training,
    mounted() {},
    computed: {
      ...Training.computed,
      user: () => ({ uid: 'task-11-user' }),
      message: () => ({ show: false }),
    },
    methods: {
      ...Training.methods,
      showMessage: vi.fn(),
    },
    data() {
      return {
        ...Training.data(),
        loading: false,
        sessionsList: [completedSession],
        exercisesList: { exercise1: exercise },
        ...data,
      };
    },
  };
}

function mountTraining(data) {
  return shallowMount(trainingHarness(data), {
    global: {
      mocks: { $t: (key) => key },
      stubs: { RouterLink: true },
    },
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('Training view semantic controls', () => {
  it('opens a session through one named native card control without nesting its action buttons', async () => {
    const wrapper = mountTraining();
    const openButton = wrapper.get('.session-card__open');

    expect(openButton.attributes()).toMatchObject({
      type: 'button',
      'aria-label': 'Precision session: training.statusCompleted',
    });
    expect(wrapper.findAll('.session-card button button')).toHaveLength(0);
    expect(wrapper.findAll('button').every((button) => button.attributes('type') === 'button')).toBe(true);

    await openButton.trigger('click');

    expect(wrapper.vm.view).toBe('session');
    expect(wrapper.vm.activeSession).toStrictEqual(completedSession);
    expect(wrapper.findComponent({ name: 'TrainingSession' }).exists()).toBe(true);
  });

  it('keeps session and exercise actions independent, named, and keyboard-native', async () => {
    const sessionsWrapper = mountTraining();
    const deleteSession = sessionsWrapper.get('.session-card__delete');
    const rerunSession = sessionsWrapper.get('.session-card__rerun');

    expect(deleteSession.attributes()).toMatchObject({
      type: 'button',
      'aria-label': 'messages.removeSession',
      title: 'messages.removeSession',
    });
    expect(rerunSession.attributes()).toMatchObject({
      type: 'button',
      'aria-label': 'training.rerun',
      title: 'training.rerun',
    });

    await deleteSession.trigger('click');

    expect(sessionsWrapper.vm.confirmDeleteId).toBe(completedSession.id);
    expect(sessionsWrapper.vm.view).toBe('list');
    expect(sessionsWrapper.vm.activeSession).toBeNull();

    const exercisesWrapper = mountTraining({ tab: 'exercises' });
    const deleteExercise = exercisesWrapper.get('.exercise-item__delete');
    const editExercise = exercisesWrapper.get('.exercise-item__actions [aria-label="common.edit"]');

    expect(deleteExercise.attributes()).toMatchObject({
      type: 'button',
      'aria-label': 'messages.removeExercise',
      title: 'messages.removeExercise',
    });
    expect(editExercise.attributes()).toMatchObject({
      type: 'button',
      'aria-label': 'common.edit',
      title: 'common.edit',
    });
    expect(exercisesWrapper.findAll('button').every((button) => button.attributes('type') === 'button')).toBe(true);

    await editExercise.trigger('click');

    expect(exercisesWrapper.vm.view).toBe('edit-exercise');
    expect(exercisesWrapper.vm.editExerciseId).toBe('exercise1');
    expect(exercisesWrapper.vm.editExerciseData).toStrictEqual(exercise);
  });
});
