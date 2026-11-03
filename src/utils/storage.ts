import type { AppState, Grade, HistoricalTopic, Topic } from '../types';

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

const LEGACY_TOPIC_MAP: Record<string, Topic | undefined> = {
  addition: 'add-sub',
  subtraction: 'add-sub',
};

/** Chỉ nhận 3 lớp hợp lệ; dữ liệu cũ/hỏng fallback về Lớp 1. */
export function normalizeGrade(grade: unknown): Grade {
  return grade === 0 || grade === 1 || grade === 2 ? grade : 1;
}

/** Gộp `addition` + `subtraction` cũ thành `add-sub` và cộng dồn số lượt. */
export function normalizeCompletedByTopic(
  raw: Partial<Record<string, number>> | undefined
): Partial<Record<HistoricalTopic, number>> {
  const result: Partial<Record<HistoricalTopic, number>> = {};
  if (!raw || typeof raw !== 'object') return result;

  Object.entries(raw).forEach(([key, value]) => {
    const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    const topic = (LEGACY_TOPIC_MAP[key] ?? (key as Topic)) as HistoricalTopic;
    result[topic] = (result[topic] ?? 0) + amount;
  });

  return result;
}

export function loadAppState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    const parsed = JSON.parse(raw) as Partial<AppState>;

    const profile = parsed.profile
      ? { ...parsed.profile, grade: normalizeGrade(parsed.profile.grade) }
      : undefined;

    return {
      profile,
      progress: {
        completedChallenges: parsed.progress?.completedChallenges ?? 0,
        playedSessions:
          parsed.progress?.playedSessions ?? parsed.progress?.completedChallenges ?? 0,
        completedByDifficulty: {
          easy: parsed.progress?.completedByDifficulty?.easy ?? 0,
          medium: parsed.progress?.completedByDifficulty?.medium ?? 0,
          hard: parsed.progress?.completedByDifficulty?.hard ?? 0,
        },
        completedByTopic: normalizeCompletedByTopic(parsed.progress?.completedByTopic),
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
