import type { AppState } from '../types';

const STORAGE_KEY = 'owl_math_game_profile_v1';

export const defaultState: AppState = {
  progress: {
    completedChallenges: 0,
    playedSessions: 0,
    completedByDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
    completedByTopic: {},
    totalScore: 0,
    badges: [],
  },
};

export function loadAppState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    const parsed = JSON.parse(raw) as Partial<AppState>;

    return {
      profile: parsed.profile,
      progress: {
        completedChallenges: parsed.progress?.completedChallenges ?? 0,
        playedSessions:
          parsed.progress?.playedSessions ?? parsed.progress?.completedChallenges ?? 0,
        completedByDifficulty: {
          easy: parsed.progress?.completedByDifficulty?.easy ?? 0,
          medium: parsed.progress?.completedByDifficulty?.medium ?? 0,
          hard: parsed.progress?.completedByDifficulty?.hard ?? 0,
        },
        completedByTopic: parsed.progress?.completedByTopic ?? {},
        totalScore: parsed.progress?.totalScore ?? 0,
        badges: parsed.progress?.badges ?? [],
        lastPlayedAt: parsed.progress?.lastPlayedAt,
      },
    };
  } catch {
    return defaultState;
  }
}

export function saveAppState(state: AppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
