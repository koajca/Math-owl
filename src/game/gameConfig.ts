import type { Difficulty, Grade, Mode, RangeTopic, Topic } from '../types';

export interface AttemptConfig {
  maxAttempts: number;
  hintOnFirstWrong: boolean;
}

export interface RangeSpec {
  min: number;
  max: number;
  /** Chỉ dùng cho Mầm non: kết quả tối đa. */
  resultMax?: number;
}

export interface GradeConstraint {
  noCarry?: boolean;
  noBorrow?: boolean;
  resultMax?: number;
  addSubCarryRatio?: number;
  requireCarry?: boolean;
  requireBorrow?: boolean;
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
  // Ghi đè số lượt trả lời theo lớp (Mầm non Practice được 3 lần).
  attemptsByGrade: {
    0: {
      practice: {
        maxAttempts: 3,
        hintOnFirstWrong: true,
      },
    },
  },
  questionsPerSession: {
    0: 5,
    1: 8,
    2: 10,
  },
  gradeRanges: {
    0: {
      'add-sub': {
        easy: { min: 1, max: 5, resultMax: 10 },
        medium: { min: 1, max: 8, resultMax: 10 },
        hard: { min: 1, max: 10, resultMax: 10 },
      },
      comparison: {
        easy: { min: 0, max: 10 },
        medium: { min: 0, max: 10 },
        hard: { min: 0, max: 10 },
      },
    },
    1: {
      'add-sub': {
        easy: { min: 1, max: 10 },
        medium: { min: 1, max: 50 },
        hard: { min: 1, max: 100 },
      },
      'find-number': {
        easy: { min: 1, max: 9 },
        medium: { min: 1, max: 19 },
        hard: { min: 1, max: 99 },
      },
      comparison: {
        easy: { min: 0, max: 10 },
        medium: { min: 0, max: 50 },
        hard: { min: 0, max: 100 },
      },
    },
    2: {
      'add-sub': {
        easy: { min: 1, max: 50 },
        medium: { min: 1, max: 80 },
        hard: { min: 1, max: 100 },
      },
      'find-number': {
        easy: { min: 1, max: 19 },
        medium: { min: 1, max: 49 },
        hard: { min: 1, max: 99 },
      },
      comparison: {
        easy: { min: 1, max: 20 },
        medium: { min: 1, max: 50 },
        hard: { min: 1, max: 100 },
      },
    },
  },
  gradeConstraints: {
    0: { noCarry: true, noBorrow: true, resultMax: 10 },
    1: { noCarry: true, noBorrow: true },
    2: { addSubCarryRatio: 0.5, requireCarry: true, requireBorrow: true },
  },
  timeLimits: {
    0: { easy: 45, medium: 35, hard: 30 },
    1: { easy: 30, medium: 25, hard: 20 },
    2: { easy: 30, medium: 25, hard: 20 },
  },
  addSub: {
    mix: {
      addition: 0.5,
      subtraction: 0.5,
    },
  },
  comparisonMix: {
    0: { twoNumbers: 1, exprLeft: 0, exprRight: 0 },
    1: { twoNumbers: 0.3, exprLeft: 0.35, exprRight: 0.35 },
    2: { twoNumbers: 0.2, exprLeft: 0.4, exprRight: 0.4 },
  },
  lowerGradeMix: {
    ratio: 0.33,
    practiceOnly: true,
    excludedTopics: ['find-number', 'carry'] as Topic[],
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
    // So sánh mở cho cả 3 lớp; Lớp 2 không cần unlock.
    enabledForGrades: [0, 1, 2],
  },
} as const;

const fallbackAttempts: Record<Mode, AttemptConfig> = {
  practice: { maxAttempts: 2, hintOnFirstWrong: true },
  challenge: { maxAttempts: 1, hintOnFirstWrong: false },
};

export function getSessionQuestionCount(grade: Grade): number {
  return gameConfig.questionsPerSession[grade] ?? gameConfig.questionsPerSession[1];
}

export function getTopicRange(grade: Grade, topic: Topic, difficulty: Difficulty): RangeSpec {
  if (topic === 'carry') {
    return gameConfig.carry.rangeByDifficulty[difficulty];
  }

  const rangeTopic: RangeTopic =
    topic === 'mixed' || topic === 'tower' ? 'add-sub' : topic;
  const byGrade = gameConfig.gradeRanges[grade] as Partial<
    Record<RangeTopic, Record<Difficulty, RangeSpec>>
  >;
  const spec = byGrade?.[rangeTopic]?.[difficulty];

  if (spec) return spec;
  return gameConfig.gradeRanges[grade]['add-sub'][difficulty];
}

export function getTimeLimit(grade: Grade, difficulty: Difficulty): number {
  return gameConfig.timeLimits[grade]?.[difficulty] ?? gameConfig.timeLimits[1][difficulty];
}

/**
 * Trả về cấu hình số lượt trả lời cho từng chế độ và lớp.
 * Nếu config bị sửa sai (maxAttempts < 1 hoặc > 3), dùng giá trị mặc định an toàn.
 */
export function getAttemptConfig(mode: Mode, grade: Grade = 1): AttemptConfig {
  const byGrade = gameConfig.attemptsByGrade as Partial<
    Record<Grade, Partial<Record<Mode, AttemptConfig>>>
  >;
  const config: AttemptConfig = byGrade[grade]?.[mode] ?? gameConfig.attempts[mode];
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
