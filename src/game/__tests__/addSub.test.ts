import { afterEach, describe, expect, it } from 'vitest';
import { generateQuestionBatch, planByWeights, setRandomSource } from '../questionTemplateEngine';
import { numberOf, questionCarries, questionOperator, seededRng } from './helpers';

afterEach(() => {
  setRandomSource(null);
});

describe('add-sub — tỉ lệ cộng/trừ và carry', () => {
  it('Lớp 1: 100 câu có tỉ lệ cộng/trừ trong khoảng 45–55%', () => {
    setRandomSource(seededRng(11));
    const questions = generateQuestionBatch(1, 'add-sub', 'medium', 100, 'choice').questions;
    const subtraction = questions.filter((question) => questionOperator(question) === '-').length;

    expect(questions).toHaveLength(100);
    expect(subtraction).toBeGreaterThanOrEqual(45);
    expect(subtraction).toBeLessThanOrEqual(55);
  });

  it('Lớp 2: 100 câu có 45–55% câu cần nhớ/mượn', () => {
    setRandomSource(seededRng(22));
    const questions = generateQuestionBatch(2, 'add-sub', 'medium', 100, 'choice').questions;
    const carryCount = questions.filter((question) => questionCarries(question)).length;

    expect(questions).toHaveLength(100);
    expect(carryCount).toBeGreaterThanOrEqual(45);
    expect(carryCount).toBeLessThanOrEqual(55);
  });

  it('không sinh câu trừ có kết quả âm', () => {
    setRandomSource(seededRng(33));
    const questions = generateQuestionBatch(2, 'add-sub', 'hard', 100, 'choice').questions;

    for (const question of questions) {
      const a = numberOf(question.variables?.a);
      const b = numberOf(question.variables?.b);
      const answer = numberOf(question.correctAnswer);

      expect(answer).toBeGreaterThanOrEqual(0);
      if (questionOperator(question) === '-') expect(a).toBeGreaterThanOrEqual(b);
    }
  });

  it('planByWeights chia đúng số lượng và xáo trộn', () => {
    const plan = planByWeights(10, { addition: 0.5, subtraction: 0.5 }, seededRng(44));
    expect(plan).toHaveLength(10);
    expect(plan.filter((item) => item === 'addition')).toHaveLength(5);
    expect(plan.filter((item) => item === 'subtraction')).toHaveLength(5);

    const grade2Carry = planByWeights(10, { carry: 0.5, plain: 0.5 }, seededRng(45));
    expect(grade2Carry.filter((item) => item === 'carry')).toHaveLength(5);
  });
});
