import { afterEach, describe, expect, it } from 'vitest';
import { fallbackQuestion, generateQuestionSession } from '../questions';
import { getSessionQuestionCount, getTimeLimit, getTopicRange } from '../../game/gameConfig';
import { setRandomSource } from '../../game/questionTemplateEngine';
import type { Difficulty, Grade, Mode, Topic } from '../../types';
import { seededRng } from '../../game/__tests__/helpers';

afterEach(() => {
  setRandomSource(null);
});

const topicsByGrade: Record<Grade, Topic[]> = {
  0: ['add-sub', 'comparison', 'mixed', 'tower'],
  1: ['add-sub', 'find-number', 'comparison', 'mixed', 'tower'],
  2: ['add-sub', 'find-number', 'carry', 'comparison', 'mixed', 'tower'],
};

describe('fallback — luôn đủ câu và đúng phạm vi', () => {
  it('fallbackQuestion trả về câu đầy đủ trường bắt buộc', () => {
    for (const grade of [0, 1, 2] as Grade[]) {
      for (const topic of topicsByGrade[grade]) {
        for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
          const rng = seededRng(grade * 1000 + topic.length * 10 + difficulty.length);
          setRandomSource(rng);
          const question = fallbackQuestion(
            grade,
            topic === 'tower' ? 'mixed' : topic,
            difficulty,
            0,
            rng,
            'choice'
          );

          expect(question.text.length).toBeGreaterThan(0);
          expect(question.correctAnswer.length).toBeGreaterThan(0);
          expect(question.choices?.length).toBeGreaterThanOrEqual(2);
          expect(question.hint.length).toBeGreaterThan(0);
          expect(question.timeLimit).toBe(getTimeLimit(grade, difficulty));
        }
      }
    }
  });

  it('fallback Mầm non Cộng/Trừ nằm trong phạm vi và không âm', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
      const rng = seededRng(difficulty.length);
      setRandomSource(rng);
      const range = getTopicRange(0, 'add-sub', difficulty);

      for (let index = 0; index < 20; index += 1) {
        const question = fallbackQuestion(0, 'add-sub', difficulty, index, rng, 'choice');
        const a = Number(question.variables?.a);
        const b = Number(question.variables?.b);
        const answer = Number(question.correctAnswer);

        expect(a).toBeGreaterThanOrEqual(range.min);
        expect(a).toBeLessThanOrEqual(range.max);
        expect(b).toBeGreaterThanOrEqual(range.min);
        expect(b).toBeLessThanOrEqual(range.max);
        expect(answer).toBeGreaterThanOrEqual(0);
        expect(answer).toBeLessThanOrEqual(10);
        expect(question.topic).toBe('add-sub');
      }
    }
  });

  it('mọi tổ hợp lớp × topic × độ khó × chế độ đều đủ số câu', () => {
    for (const grade of [0, 1, 2] as Grade[]) {
      for (const topic of topicsByGrade[grade]) {
        for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
          for (const mode of ['practice', 'challenge'] as Mode[]) {
            const rng = seededRng(grade * 31 + topic.length * 7 + difficulty.length + (mode === 'practice' ? 0 : 1));
            setRandomSource(rng);
            const count = getSessionQuestionCount(grade);
            const batch = generateQuestionSession(grade, topic, difficulty, count, 'choice', {
              mode,
              rng,
            });

            expect(batch.questions).toHaveLength(count);
            expect(batch.questions.every((question) => question.text.length > 0)).toBe(true);
          }
        }
      }
    }
  });
});
