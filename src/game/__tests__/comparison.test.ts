import { afterEach, describe, expect, it } from 'vitest';
import { generateQuestionBatch, setRandomSource } from '../questionTemplateEngine';
import { hasBorrow, hasCarry, numberOf, seededRng } from './helpers';

type Form = 'twoNumbers' | 'exprLeft' | 'exprRight';

afterEach(() => {
  setRandomSource(null);
});

function formOf(text: string): Form {
  if (/^\d+ __ \d+$/.test(text)) return 'twoNumbers';
  if (/^\d+ [+-] \d+ __ \d+$/.test(text)) return 'exprLeft';
  if (/^\d+ __ \d+ [+-] \d+$/.test(text)) return 'exprRight';
  throw new Error(`Không nhận diện được dạng So sánh: ${text}`);
}

function expectedSign(question: ReturnType<typeof generateQuestionBatch>['questions'][number]) {
  const form = formOf(question.text);
  if (form === 'twoNumbers') {
    const left = numberOf(question.variables?.left);
    const right = numberOf(question.variables?.right);
    return left === right ? '=' : left > right ? '>' : '<';
  }

  const a = numberOf(question.variables?.a);
  const b = numberOf(question.variables?.b);
  const c = numberOf(question.variables?.c);
  const expr = question.variables?.op === '-' ? a - b : a + b;
  if (form === 'exprLeft') return expr === c ? '=' : expr > c ? '>' : '<';
  return c === expr ? '=' : c > expr ? '>' : '<';
}

describe('comparison — dạng câu, quota và dấu đúng', () => {
  it('Mầm non chỉ có A __ B và đúng phép so sánh', () => {
    setRandomSource(seededRng(200));
    const questions = generateQuestionBatch(0, 'comparison', 'hard', 30, 'choice').questions;

    expect(questions).toHaveLength(30);
    for (const question of questions) {
      expect(formOf(question.text)).toBe('twoNumbers');
      expect(question.correctAnswer).toBe(expectedSign(question));
    }
  });

  it('Lớp 1 có quota 2/3/3 cho 8 câu', () => {
    setRandomSource(seededRng(201));
    const questions = generateQuestionBatch(1, 'comparison', 'medium', 8, 'choice').questions;
    const counts = questions.reduce<Record<Form, number>>(
      (acc, question) => {
        acc[formOf(question.text)] += 1;
        return acc;
      },
      { twoNumbers: 0, exprLeft: 0, exprRight: 0 }
    );

    expect(questions).toHaveLength(8);
    expect(counts).toEqual({ twoNumbers: 2, exprLeft: 3, exprRight: 3 });
    for (const question of questions) {
      expect(question.correctAnswer).toBe(expectedSign(question));
    }
  });

  it('Lớp 2 có quota 2/4/4 cho 10 câu và biểu thức đều có nhớ/mượn', () => {
    setRandomSource(seededRng(202));
    const questions = generateQuestionBatch(2, 'comparison', 'medium', 10, 'choice').questions;
    const counts = questions.reduce<Record<Form, number>>(
      (acc, question) => {
        acc[formOf(question.text)] += 1;
        return acc;
      },
      { twoNumbers: 0, exprLeft: 0, exprRight: 0 }
    );

    expect(questions).toHaveLength(10);
    expect(counts).toEqual({ twoNumbers: 2, exprLeft: 4, exprRight: 4 });

    for (const question of questions) {
      expect(question.correctAnswer).toBe(expectedSign(question));
      if (formOf(question.text) === 'twoNumbers') continue;

      const a = numberOf(question.variables?.a);
      const b = numberOf(question.variables?.b);
      const carries = question.variables?.op === '-' ? hasBorrow(a, b) : hasCarry(a, b);
      expect(carries).toBe(true);
    }
  });

  it('có ép xuất hiện dấu bằng qua nhiều lượt', () => {
    let equalCount = 0;
    for (let seed = 300; seed < 310; seed += 1) {
      setRandomSource(seededRng(seed));
      const questions = generateQuestionBatch(1, 'comparison', 'medium', 8, 'choice').questions;
      equalCount += questions.filter((question) => question.correctAnswer === '=').length;
    }
    expect(equalCount).toBeGreaterThan(0);
  });
});
