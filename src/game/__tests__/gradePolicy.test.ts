import { afterEach, describe, expect, it } from 'vitest';
import { generateQuestionBatch, setRandomSource } from '../questionTemplateEngine';
import { getTopicRange } from '../gameConfig';
import type { Difficulty, Grade } from '../../types';
import { numberOf, questionCarries, seededRng } from './helpers';

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

afterEach(() => {
  setRandomSource(null);
});

function generate(grade: Grade, difficulty: Difficulty, count = 20) {
  setRandomSource(seededRng(grade * 100 + count + difficulties.indexOf(difficulty)));
  return generateQuestionBatch(grade, 'add-sub', difficulty, count, 'choice').questions;
}

describe('grade policy — phạm vi và nhớ/mượn', () => {
  it.each(difficulties)('Mầm non %s: a/b đúng phạm vi, kết quả ≤ 10, không nhớ/mượn', (difficulty) => {
    const range = getTopicRange(0, 'add-sub', difficulty);
    const questions = generate(0, difficulty);

    expect(questions).toHaveLength(20);
    for (const question of questions) {
      const a = numberOf(question.variables?.a);
      const b = numberOf(question.variables?.b);
      const answer = numberOf(question.correctAnswer);

      expect(a).toBeGreaterThanOrEqual(range.min);
      expect(a).toBeLessThanOrEqual(range.max);
      expect(b).toBeGreaterThanOrEqual(range.min);
      expect(b).toBeLessThanOrEqual(range.max);
      expect(answer).toBeGreaterThanOrEqual(0);
      expect(answer).toBeLessThanOrEqual(10);
      expect(questionCarries(question)).toBe(false);
    }
  });

  it('Lớp 1: cộng/trừ không nhớ, không mượn, kết quả không âm', () => {
    const range = getTopicRange(1, 'add-sub', 'medium');
    const questions = generate(1, 'medium');

    for (const question of questions) {
      const a = numberOf(question.variables?.a);
      const b = numberOf(question.variables?.b);
      const answer = numberOf(question.correctAnswer);

      expect(a).toBeLessThanOrEqual(range.max);
      expect(b).toBeLessThanOrEqual(range.max);
      expect(answer).toBeGreaterThanOrEqual(0);
      expect(questionCarries(question)).toBe(false);
    }
  });

  it('Lớp 2: câu cộng/trừ có nhớ hoặc mượn khi carryNeed bật', () => {
    setRandomSource(seededRng(2024));
    const batch = generateQuestionBatch(2, 'add-sub', 'medium', 60, 'choice', {
      carryPlan: Array.from({ length: 60 }, () => true),
      operatorPlan: Array.from({ length: 60 }, (_, index) => (index % 2 === 0 ? '+' : '-')),
    });

    expect(batch.questions).toHaveLength(60);
    for (const question of batch.questions) {
      const a = numberOf(question.variables?.a);
      const b = numberOf(question.variables?.b);
      const answer = numberOf(question.correctAnswer);
      const carries = questionCarries(question);

      expect(carries).toBe(true);
      expect(answer).toBeGreaterThanOrEqual(0);
    }
  });

  it('Mầm non So sánh chỉ dùng 2 số trong phạm vi 0..10', () => {
    setRandomSource(seededRng(99));
    const questions = generateQuestionBatch(0, 'comparison', 'hard', 20, 'choice').questions;

    expect(questions).toHaveLength(20);
    for (const question of questions) {
      const match = /^(\d+) __ (\d+)$/.exec(question.text);
      expect(match, question.text).not.toBeNull();
      expect(Number(match?.[1])).toBeGreaterThanOrEqual(0);
      expect(Number(match?.[1])).toBeLessThanOrEqual(10);
      expect(Number(match?.[2])).toBeGreaterThanOrEqual(0);
      expect(Number(match?.[2])).toBeLessThanOrEqual(10);
      expect(['>', '<', '=']).toContain(question.correctAnswer);
    }
  });
});
