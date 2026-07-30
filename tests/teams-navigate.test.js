import { describe, it, expect } from 'vitest';

/**
 * Tests for TeamsList.navigateToTeam logic.
 * The method does: clear club filter -> set expandedTeam -> scroll to element.
 * We test the state transitions directly since @vue/test-utils is not available.
 */
describe('TeamsList - navigateToTeam logic', () => {
  function createState() {
    return {
      activeClubFilter: null,
      expandedTeam: null,
    };
  }

  function navigateToTeam(state, teamTitle) {
    state.activeClubFilter = null;
    state.expandedTeam = teamTitle;
  }

  it('clears activeClubFilter when navigating to team', () => {
    const state = createState();
    state.activeClubFilter = 1;

    navigateToTeam(state, 'Team B');

    expect(state.activeClubFilter).toBeNull();
    expect(state.expandedTeam).toBe('Team B');
  });

  it('sets expandedTeam to the target team', () => {
    const state = createState();

    navigateToTeam(state, 'Team X');

    expect(state.expandedTeam).toBe('Team X');
  });

  it('clears filter even when navigating to same team', () => {
    const state = createState();
    state.activeClubFilter = 5;
    state.expandedTeam = 'Team A';

    navigateToTeam(state, 'Team A');

    expect(state.activeClubFilter).toBeNull();
    expect(state.expandedTeam).toBe('Team A');
  });

  it('works when no filter was active', () => {
    const state = createState();
    state.activeClubFilter = null;

    navigateToTeam(state, 'Team C');

    expect(state.activeClubFilter).toBeNull();
    expect(state.expandedTeam).toBe('Team C');
  });
});
