import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultState, loadAppState, normalizeCompletedByTopic, normalizeGrade } from '../storage';

const STORAGE_KEY = 'owl_math_game_profile_v1';

class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }
}

function stubStorage() {
  const storage = new MemoryStorage();
  vi.stubGlobal('window', { localStorage: storage });
  return storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('storage — migration dữ liệu cũ', () => {
  it('gộp addition + subtraction thành add-sub', () => {
    expect(normalizeCompletedByTopic({ addition: 2, subtraction: 3 })).toEqual({ 'add-sub': 5 });
  });

  it('grade lạ fallback về 1, giữ grade 0 hợp lệ', () => {
    expect(normalizeGrade(9)).toBe(1);
    expect(normalizeGrade('2')).toBe(1);
    expect(normalizeGrade(undefined)).toBe(1);
    expect(normalizeGrade(0)).toBe(0);
    expect(normalizeGrade(2)).toBe(2);
  });

  it('load profile cũ có grade 9 và topic cũ', () => {
    const storage = stubStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile: { name: 'An', grade: 9, soundEnabled: true, avatar: 'owl-blue' },
        progress: {
          completedChallenges: 4,
          completedByDifficulty: { easy: 3, medium: 1, hard: 0 },
          completedByTopic: { addition: 2, subtraction: 3, comparison: 1 },
          totalScore: 120,
          badges: ['perfect_run'],
        },
      })
    );

    const state = loadAppState();
    expect(state.profile?.grade).toBe(1);
    expect(state.progress.completedByTopic).toEqual({ 'add-sub': 5, comparison: 1 });
    expect(state.progress.playedSessions).toBe(4);
  });

  it('load grade 0 bình thường', () => {
    const storage = stubStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile: { name: 'Bé', grade: 0, soundEnabled: false, avatar: 'owl-pink' },
        progress: { completedChallenges: 1, completedByTopic: {} },
      })
    );

    expect(loadAppState().profile?.grade).toBe(0);
  });

  it('JSON hỏng trả về state mặc định', () => {
    const storage = stubStorage();
    storage.setItem(STORAGE_KEY, '{not-json');
    expect(loadAppState()).toEqual(defaultState);
  });

  it('chưa có dữ liệu trả về state mặc định', () => {
    stubStorage();
    expect(loadAppState()).toEqual(defaultState);
  });
});
