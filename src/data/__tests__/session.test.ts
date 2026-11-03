import { afterEach, describe, expect, it } from 'vitest';
import { generateQuestionSession } from '../questions';
import { setRandomSource } from '../../game/questionTemplateEngine';
import { getSessionQuestionCount, getTimeLimit } from '../../game/gameConfig';
import type { Difficulty, Grade, Mode, Topic } from '../../types';
import { seededRng } from '../../game/__tests__/helpers';

afterEach(() => {
  setRandomSource(null);
});

function session(
  grade: Grade,
  topic: Topic,
  difficulty: Difficulty,
  mode: Mode,
  seed: number,
  count = getSessionQuestionCount(grade)
) {
  const rng = seededRng(seed);
  setRandomSource(rng);
  return generateQuestionSession(grade, topic, difficulty, count, 'choice', { mode, rng }).questions;
}

describe('session — số câu, xen cấp dưới và phạm vi topic', () => {
  it('Mầm non / Lớp 1 / Lớp 2 lần lượt có 5 / 8 / 10 câu', () => {
    expect(session(0, 'add-sub', 'easy', 'practice', 1)).toHaveLength(5);
    expect(session(1, 'add-sub', 'easy', 'practice', 2)).toHaveLength(8);
    expect(session(2, 'add-sub', 'easy', 'practice', 3)).toHaveLength(10);
  });

  it('câu số học dùng đúng thời gian theo lớp và độ khó', () => {
    for (const grade of [0, 1, 2] as Grade[]) {
      for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
        const questions = session(grade, 'add-sub', difficulty, 'practice', 10 + grade * 3 + difficulty.length);
        for (const question of questions) {
          expect(question.timeLimit).toBe(getTimeLimit(question.grade, difficulty));
        }
      }
    }
  });

  it('Luyện tập Lớp 1 có tối đa 2/8 câu cấp dưới và có xuất hiện', () => {
    let totalLower = 0;
    for (let seed = 1; seed <= 30; seed += 1) {
      const questions = session(1, 'add-sub', 'medium', 'practice', seed);
      const lower = questions.filter((question) => question.grade === 0);
      expect(lower.length).toBeLessThanOrEqual(2);
      totalLower += lower.length;
    }
    expect(totalLower).toBeGreaterThan(0);
  });

  it('Luyện tập Lớp 2 có tối đa 3/10 câu cấp dưới và có xuất hiện', () => {
    let totalLower = 0;
    for (let seed = 1; seed <= 30; seed += 1) {
      const questions = session(2, 'comparison', 'medium', 'practice', seed);
      const lower = questions.filter((question) => question.grade < 2);
      expect(lower.length).toBeLessThanOrEqual(3);
      totalLower += lower.length;
    }
    expect(totalLower).toBeGreaterThan(0);
  });

  it('Thử thách luôn 100% câu đúng cấp', () => {
    for (const grade of [1, 2] as Grade[]) {
      const questions = session(grade, 'add-sub', 'medium', 'challenge', 40 + grade);
      expect(questions.every((question) => question.grade === grade)).toBe(true);
    }
  });

  it('Tìm số và Cộng trừ có nhớ không xen câu cấp dưới', () => {
    const findNumber = session(1, 'find-number', 'hard', 'practice', 51);
    expect(findNumber.every((question) => question.grade === 1)).toBe(true);

    const carry = session(2, 'carry', 'medium', 'practice', 52);
    expect(carry.every((question) => question.grade === 2)).toBe(true);
  });

  it('Tháp Thông Thái dùng câu thuộc topic mixed', () => {
    const questions = session(2, 'tower', 'medium', 'practice', 61);
    expect(questions).toHaveLength(10);
    expect(questions.every((question) => question.topic === 'mixed')).toBe(true);
  });
});
