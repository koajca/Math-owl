export const gameConfig = {
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
