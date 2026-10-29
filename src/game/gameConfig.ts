import type { Mode } from '../types';

export interface AttemptConfig {
  maxAttempts: number;
  hintOnFirstWrong: boolean;
}

export const gameConfig = {
  attempts: {
    practice: {
      maxAttempts: 2,
      hintOnFirstWrong: true,
    },
    challenge: {
      maxAttempts: 1,
      hintOnFirstWrong: false,
    },
  },
  unlockRequirements: {
    mediumFromEasyChallenges: 0,
    hardFromMediumChallenges: 3,
    mixedFromCompletedChallenges: 8,
    towerFromCompletedChallenges: 12,
  },
  comparisonSigns: {
    greaterWeight: 0.5,
    equalWeight: 0.25,
    lessWeight: 0.25,
    minEqualToGreaterRatio: 1 / 3,
  },
  carry: {
    enabledForGrades: [2],
    // Đổi min/max tại đây để đổi phạm vi cộng trừ có nhớ.
    // easy/medium: "< 20" (1..19); hard: "<= 99" (2 chữ số).
    rangeByDifficulty: {
      easy: { min: 2, max: 19 },
      medium: { min: 2, max: 19 },
      hard: { min: 10, max: 99 },
    },
    mix: {
      addition: 0.5,
      subtraction: 0.5,
    },
  },
  comparison: {
    // Lớp 2 ẩn hoàn toàn phần so sánh.
    enabledForGrades: [1],
  },
} as const;

const fallbackAttempts: Record<Mode, AttemptConfig> = {
  practice: { maxAttempts: 2, hintOnFirstWrong: true },
  challenge: { maxAttempts: 1, hintOnFirstWrong: false },
};

/**
 * Trả về cấu hình số lượt trả lời cho từng chế độ.
 * Nếu config bị sửa sai (maxAttempts < 1 hoặc > 3), dùng giá trị mặc định an toàn.
 */
export function getAttemptConfig(mode: Mode): AttemptConfig {
  const config: AttemptConfig = gameConfig.attempts[mode];
  if (
    !config ||
    !Number.isInteger(config.maxAttempts) ||
    config.maxAttempts < 1 ||
    config.maxAttempts > 3
  ) {
    if (import.meta.env.DEV) {
      console.warn(
        `[gameConfig] attempts.${mode}.maxAttempts không hợp lệ, dùng mặc định ${fallbackAttempts[mode].maxAttempts}.`
      );
    }
    return fallbackAttempts[mode];
  }
  return config;
}
