/** Nguồn random có seed để test ổn định (mulberry32). */
export function seededRng(seed = 123456789) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

export const ones = (value: number) => Math.abs(value) % 10;

export const hasCarry = (a: number, b: number) => ones(a) + ones(b) >= 10;

export const hasBorrow = (a: number, b: number) => a >= b && ones(a) < ones(b);

export const numberOf = (value: unknown) => Number(value);

type CarryQuestion = {
  templateId?: string;
  text: string;
  correctAnswer: string;
  variables?: Record<string, unknown>;
};

function variablesOf(question: CarryQuestion) {
  return {
    a: numberOf(question.variables?.a),
    b: numberOf(question.variables?.b),
    answer: numberOf(question.correctAnswer),
  };
}

/** Xác định phép tính từ templateId, fallback theo nội dung câu. */
export function questionOperator(question: CarryQuestion): '+' | '-' {
  const id = question.templateId ?? '';
  if (/subtraction|subtrahend|minuend|borrow/.test(id)) return '-';
  if (/addition|addend/.test(id)) return '+';

  const { a, b, answer } = variablesOf(question);
  if (a >= b && a - b === answer) return '-';
  return '+';
}

/** Kiểm tra phép trong đề có nhớ (cộng) hoặc mượn (trừ) hay không. */
export function questionCarries(question: CarryQuestion) {
  const { a, b } = variablesOf(question);
  return questionOperator(question) === '-' ? hasBorrow(a, b) : hasCarry(a, b);
}
