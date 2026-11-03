import { afterEach, describe, expect, it } from 'vitest';
import { generateQuestionBatch, setRandomSource } from '../questionTemplateEngine';
import { hasBorrow, hasCarry, numberOf, seededRng } from './helpers';

type Pattern = 'blank-right-add' | 'blank-left-add' | 'blank-right-subtract' | 'blank-left-subtract';

afterEach(() => {
  setRandomSource(null);
});

function patternOf(text: string): Pattern {
  if (/^__ \+ \d+ = \d+$/.test(text)) return 'blank-left-add';
  if (/^\d+ \+ __ = \d+$/.test(text)) return 'blank-right-add';
  if (/^\d+ - __ = \d+$/.test(text)) return 'blank-right-subtract';
  if (/^__ - \d+ = \d+$/.test(text)) return 'blank-left-subtract';
  throw new Error(`Không nhận diện được dạng Tìm số: ${text}`);
}

function carriesFor(pattern: Pattern, known: number, missing: number) {
  if (pattern === 'blank-left-subtract') return hasBorrow(missing, known);
  return pattern.includes('add') ? hasCarry(known, missing) : hasBorrow(known, missing);
}

describe('find-number — 4 dạng và gating theo độ khó', () => {
  it('Lớp 1 Dễ/Vừa chỉ có 2 dạng cộng, không nhớ', () => {
    for (const difficulty of ['easy', 'medium'] as const) {
      setRandomSource(seededRng(100 + (difficulty === 'easy' ? 1 : 2)));
      const questions = generateQuestionBatch(1, 'find-number', difficulty, 30, 'choice').questions;

      expect(questions).toHaveLength(30);
      for (const question of questions) {
        const pattern = patternOf(question.text);
        const known = numberOf(question.variables?.a);
        const missing = numberOf(question.correctAnswer);

        expect(pattern.includes('add')).toBe(true);
        expect(carriesFor(pattern, known, missing)).toBe(false);
      }
    }
  });

  it('Lớp 1 Khó có đủ 4 dạng và không nhớ/mượn', () => {
    setRandomSource(seededRng(101));
    const questions = generateQuestionBatch(1, 'find-number', 'hard', 100, 'choice').questions;
    const patterns = new Set(questions.map((question) => patternOf(question.text)));

    expect(patterns.size).toBe(4);
    for (const question of questions) {
      const pattern = patternOf(question.text);
      const known = numberOf(question.variables?.a);
      const missing = numberOf(question.correctAnswer);
      expect(carriesFor(pattern, known, missing)).toBe(false);
    }
  });

  it('Lớp 2 Khó có đủ 4 dạng và mọi câu đều nhớ/mượn', () => {
    setRandomSource(seededRng(102));
    const questions = generateQuestionBatch(2, 'find-number', 'hard', 120, 'choice').questions;
    const patterns = new Set(questions.map((question) => patternOf(question.text)));

    expect(patterns.size).toBe(4);
    for (const question of questions) {
      const pattern = patternOf(question.text);
      const known = numberOf(question.variables?.a);
      const missing = numberOf(question.correctAnswer);
      expect(carriesFor(pattern, known, missing)).toBe(true);
    }
  });

  it('chế độ nhập số trả về fill-number', () => {
    setRandomSource(seededRng(103));
    const questions = generateQuestionBatch(1, 'find-number', 'medium', 5, 'input').questions;
    expect(questions.every((question) => question.questionType === 'fill-number')).toBe(true);
  });
});
