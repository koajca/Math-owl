import templatesJson from '../data/questionTemplates.json';
import { gameConfig } from './gameConfig';
import type {
  AnswerMode,
  ClockHourPayload,
  Difficulty,
  Grade,
  MissingEquationPayload,
  Question,
  QuestionTemplate,
  RelativeDatePayload,
  SortNumbersPayload,
  TemplateValue,
  Topic,
  WeekdayBlankPayload,
} from '../types';

type ConcreteTopic = Exclude<Topic, 'tower'>;

export interface TemplateDiagnostic {
  type: 'template_skipped' | 'template_validation_error';
  templateId?: string;
  sourceSkillId?: string;
  errorMessage: string;
}

export interface QuestionBatch {
  questions: Question[];
  diagnostics: TemplateDiagnostic[];
}

type Context = Record<string, TemplateValue>;

const templates = templatesJson as unknown as QuestionTemplate[];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const formatTwoDigits = (value: number) => value.toString().padStart(2, '0');

const asNumber = (value: TemplateValue | undefined) =>
  typeof value === 'number' ? value : Number(value);

const ones = (value: number) => Math.abs(value) % 10;

const noCarry = (a: number, b: number) => ones(a) + ones(b) < 10;

const noBorrow = (a: number, b: number) => a >= b && ones(a) >= ones(b);

const hasCarry = (a: number, b: number) => ones(a) + ones(b) >= 10;

const hasBorrow = (a: number, b: number) => a >= b && ones(a) < ones(b);

type CarryRange = { min: number; max: number };

const getCarryRange = (difficulty: Difficulty): CarryRange => {
  const configured = gameConfig.carry.rangeByDifficulty[difficulty];
  const fallback: CarryRange = { min: 2, max: 19 };

  if (
    !configured ||
    configured.min < 1 ||
    configured.max < configured.min ||
    configured.max < 11
  ) {
    if (import.meta.env.DEV) {
      console.warn('[carry-config] Phạm vi không hợp lệ, dùng mặc định 2..19.', configured);
    }
    return fallback;
  }

  return { min: configured.min, max: configured.max };
};

const isGradeEnabled = (grades: readonly Grade[], grade: Grade) => grades.includes(grade);

const matchesList = <T extends string | number>(value: T, candidate: T | T[]) =>
  Array.isArray(candidate) ? candidate.includes(value) : candidate === value;

const getLimit = (grade: Grade, difficulty: Difficulty) => {
  if (grade === 1) {
    if (difficulty === 'easy') return 10;
    if (difficulty === 'medium') return 20;
    return 99;
  }

  if (difficulty === 'easy') return 40;
  if (difficulty === 'medium') return 80;
  return 99;
};

const getTimeLimit = (template: QuestionTemplate, difficulty: Difficulty) => {
  if (difficulty === 'easy') return Math.max(template.timeLimitSeconds, 30);
  if (difficulty === 'medium') return Math.min(template.timeLimitSeconds, 25);
  return Math.min(template.timeLimitSeconds, 20);
};

const renderTemplate = (template: string, context: Context) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = context[key];
    return value === undefined ? `{{${key}}}` : String(value);
  });

const getPlaceholders = (template: string) =>
  Array.from(template.matchAll(/\{\{(\w+)\}\}/g), (match) => match[1]);

function validateTemplate(template: QuestionTemplate): string[] {
  const errors: string[] = [];
  const requiredStrings: Array<keyof QuestionTemplate> = [
    'id',
    'sourceSkillId',
    'topic',
    'questionType',
    'promptTemplate',
    'answerRule',
    'hintTemplate',
    'solutionTemplate',
  ];

  requiredStrings.forEach((field) => {
    if (!template[field]) errors.push(`Missing ${String(field)}`);
  });

  if (!template.variables || Object.keys(template.variables).length === 0) {
    errors.push('Missing variables');
  }

  Object.entries(template.variables ?? {}).forEach(([name, variable]) => {
    if (variable.type === 'integer' && variable.min > variable.max) {
      errors.push(`Invalid range for ${name}`);
    }
    if (variable.type === 'choice' && variable.values.length === 0) {
      errors.push(`Empty choices for ${name}`);
    }
  });

  const knownKeys = new Set([
    ...Object.keys(template.variables ?? {}),
    'answer',
    'leftValue',
    'rightValue',
  ]);

  [
    ...getPlaceholders(template.promptTemplate ?? ''),
    ...getPlaceholders(template.hintTemplate ?? ''),
    ...getPlaceholders(template.solutionTemplate ?? ''),
  ].forEach((key) => {
    if (!knownKeys.has(key)) errors.push(`Unknown placeholder ${key}`);
  });

  template.validationExamples?.forEach((example, index) => {
    const evaluated = evaluateAnswer(template.answerRule, example.variables);
    if (evaluated.answer === undefined || String(evaluated.answer) !== String(example.answer)) {
      errors.push(`Validation example ${index + 1} expected ${example.answer}`);
    }
  });

  return errors;
}

function buildVariables(template: QuestionTemplate): Context {
  return Object.fromEntries(
    Object.entries(template.variables).map(([key, variable]) => {
      if (variable.type === 'integer') return [key, randomInt(variable.min, variable.max)];
      return [key, pick(variable.values)];
    })
  );
}

function pickWeightedComparisonSign(): '>' | '<' | '=' {
  const weights = gameConfig.comparisonSigns;
  const total = weights.greaterWeight + weights.equalWeight + weights.lessWeight;
  const roll = Math.random() * total;

  if (roll < weights.greaterWeight) return '>';
  if (roll < weights.greaterWeight + weights.equalWeight) return '=';
  return '<';
}

function applyComparisonPreference(
  template: QuestionTemplate,
  context: Context,
  grade: Grade,
  difficulty: Difficulty,
  preferredAnswer?: '>' | '<' | '='
) {
  if (template.answerRule !== 'compareValues') return context;

  const limit = getLimit(grade, difficulty);
  const relation = preferredAnswer ?? pickWeightedComparisonSign();

  if (relation === '=') {
    const value = randomInt(0, limit);
    return { ...context, left: value, right: value };
  }

  if (limit <= 0) return { ...context, left: 0, right: 0 };

  if (relation === '>') {
    const left = randomInt(1, limit);
    const right = randomInt(0, left - 1);
    return { ...context, left, right };
  }

  const right = randomInt(1, limit);
  const left = randomInt(0, right - 1);
  return { ...context, left, right };
}

function evaluateAnswer(rule: string, context: Context): { answer: string | number; derived: Context } {
  const a = asNumber(context.a);
  const b = asNumber(context.b);
  const c = asNumber(context.c);
  const d = asNumber(context.d);
  const left = asNumber(context.left);
  const right = asNumber(context.right);
  const result = asNumber(context.result);

  if (rule === 'sum') return { answer: a + b, derived: {} };
  if (rule === 'difference') return { answer: a - b, derived: {} };
  if (rule === 'missingAddend') return { answer: result - a, derived: {} };
  if (rule === 'missingSubtrahend') return { answer: a - result, derived: {} };

  if (rule === 'compareValues') {
    const answer = left === right ? '=' : left > right ? '>' : '<';
    return { answer, derived: {} };
  }

  if (rule === 'compareExpression') {
    const leftValue = a + b;
    const rightValue = c - d;
    const answer = leftValue === rightValue ? '=' : leftValue > rightValue ? '>' : '<';
    return { answer, derived: { leftValue, rightValue } };
  }

  return { answer: '', derived: {} };
}

function passesConstraint(
  rule: string,
  context: Context,
  grade: Grade,
  difficulty: Difficulty,
  answerRule: string
) {
  const a = asNumber(context.a);
  const b = asNumber(context.b);
  const c = asNumber(context.c);
  const d = asNumber(context.d);
  const left = asNumber(context.left);
  const right = asNumber(context.right);
  const result = asNumber(context.result);
  const limit = getLimit(grade, difficulty);
  const carryRange = getCarryRange(difficulty);
  const inCarryRange = (value: number) =>
    value >= carryRange.min && value <= carryRange.max;

  if (rule === 'valuesWithinLimit') {
    return [a, b, c, d, left, right, result]
      .filter((value) => Number.isFinite(value))
      .every((value) => value >= 0 && value <= limit);
  }
  if (rule === 'sumWithinLimit') return a + b <= limit;
  if (rule === 'differenceWithinLimit') return a <= limit && b <= limit;
  if (rule === 'differenceNonNegative') return a >= b;
  if (rule === 'noCarry') return noCarry(a, b);
  if (rule === 'noBorrow') return noBorrow(a, b);
  if (rule === 'rightDifferenceNonNegative') return c >= d;
  if (rule === 'rightNoBorrow') return c >= d && ones(c) >= ones(d);
  if (rule === 'resultGreaterThanA') return result > a;
  if (rule === 'aGreaterThanResult') return a > result;
  if (rule === 'missingAddWithinLimit') return result <= limit;
  if (rule === 'missingAddNoCarry') return noCarry(a, result - a);
  if (rule === 'missingSubNoBorrow') return noBorrow(a, a - result);

  if (rule === 'hasCarry') return hasCarry(a, b);
  if (rule === 'hasBorrow') return hasBorrow(a, b);
  if (rule === 'withinCarryRange') {
    if (answerRule === 'difference') {
      const difference = a - b;
      return a >= b && inCarryRange(a) && inCarryRange(b) && inCarryRange(difference);
    }
    const sum = a + b;
    return inCarryRange(a) && inCarryRange(b) && inCarryRange(sum);
  }
  if (rule === 'missingAddHasCarry') {
    const missing = result - a;
    return missing >= 0 && hasCarry(a, missing);
  }
  if (rule === 'missingAddWithinCarryRange') {
    const missing = result - a;
    return missing >= 0 && inCarryRange(a) && inCarryRange(result) && inCarryRange(missing);
  }
  if (rule === 'missingSubHasBorrow') {
    const missing = a - result;
    return missing >= 0 && hasBorrow(a, missing);
  }
  if (rule === 'missingSubWithinCarryRange') {
    const missing = a - result;
    return missing >= 0 && inCarryRange(a) && inCarryRange(result) && inCarryRange(missing);
  }

  return false;
}

function createChoices(
  answer: string | number,
  rule: string | null | undefined,
  grade: Grade,
  difficulty: Difficulty,
  minOverride?: number,
  maxOverride?: number
) {
  if (rule === 'comparisonSigns') return ['>', '<', '='];

  const numericAnswer = typeof answer === 'number' ? answer : Number(answer);
  if (!Number.isFinite(numericAnswer)) return [String(answer)];

  const limit = maxOverride ?? getLimit(grade, difficulty);
  const floor = Math.min(minOverride ?? 0, limit);
  const values = new Set<number>([numericAnswer]);
  const offsets = shuffle([-10, -5, -3, -2, -1, 1, 2, 3, 5, 10, 11, -11]);

  offsets.forEach((offset) => {
    const candidate = numericAnswer + offset;
    if (candidate >= floor && candidate <= limit) values.add(candidate);
  });

  for (let fallback = floor; values.size < 4 && fallback <= limit; fallback += 1) {
    values.add(fallback);
  }

  let guard = 0;
  while (values.size < 4 && guard < 20) {
    values.add(randomInt(floor, limit));
    guard += 1;
  }

  return shuffle(Array.from(values).slice(0, 4).map(String));
}

function mapQuestionType(template: QuestionTemplate, answerMode: AnswerMode, difficulty: Difficulty): Question['questionType'] {
  if (template.questionType === 'comparison-sign') {
    return answerMode === 'input' ? 'compare' : 'multiple-choice';
  }

  if (answerMode === 'choice') return 'multiple-choice';
  if (answerMode === 'input') {
    return template.questionType === 'missing-number' ? 'fill-number' : 'input';
  }

  if (template.questionType === 'word-problem' && difficulty !== 'hard') return 'multiple-choice';
  if (template.questionType === 'missing-number' && difficulty !== 'hard') return 'multiple-choice';
  if (template.questionType === 'number-input' && difficulty !== 'hard') return 'multiple-choice';

  return template.questionType === 'missing-number' ? 'fill-number' : 'input';
}

function templateMatchesTopic(template: QuestionTemplate, topic: ConcreteTopic) {
  if (topic === 'mixed') return true;
  if (template.topic === topic) return true;
  if (template.topic === 'missing-number' && template.tags.includes(topic)) return true;
  return false;
}

function makeQuestion(
  template: QuestionTemplate,
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  answerMode: AnswerMode,
  index: number,
  preferredAnswer?: '>' | '<' | '='
): Question | TemplateDiagnostic {
  const validationErrors = validateTemplate(template);
  if (validationErrors.length > 0) {
    return {
      type: 'template_validation_error',
      templateId: template.id,
      sourceSkillId: template.sourceSkillId,
      errorMessage: validationErrors.join('; '),
    };
  }

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const variables = applyComparisonPreference(
      template,
      buildVariables(template),
      grade,
      difficulty,
      preferredAnswer
    );
    const constraintsPass = template.constraints.every((constraint) =>
      passesConstraint(constraint, variables, grade, difficulty, template.answerRule)
    );
    if (!constraintsPass) continue;

    const { answer, derived } = evaluateAnswer(template.answerRule, variables);
    const isCarryTemplate = template.topic === 'carry';
    const carryRange = isCarryTemplate ? getCarryRange(difficulty) : undefined;
    const context: Context = {
      ...variables,
      ...derived,
      answer,
      ...(isCarryTemplate && carryRange
        ? {
            carryMode: template.answerRule === 'difference' ? 'subtraction-borrow' : 'addition-carry',
            rangeMin: carryRange.min,
            rangeMax: carryRange.max,
          }
        : {}),
    };
    const questionType = mapQuestionType(template, answerMode, difficulty);
    const choices = questionType === 'multiple-choice'
      ? createChoices(
          answer,
          template.choicesRule,
          grade,
          difficulty,
          carryRange?.min,
          carryRange?.max
        )
      : undefined;

    return {
      id: `tpl-${template.id}-${Date.now()}-${index}-${attempt}`,
      templateId: template.id,
      sourceSkillId: template.sourceSkillId,
      grade,
      topic,
      difficulty,
      questionType,
      text: renderTemplate(template.promptTemplate, context),
      choices,
      correctAnswer: String(answer),
      hint: renderTemplate(template.hintTemplate, context),
      solution: renderTemplate(template.solutionTemplate, context),
      variables: context,
      timeLimit: getTimeLimit(template, difficulty),
    };
  }

  return {
    type: 'template_skipped',
    templateId: template.id,
    sourceSkillId: template.sourceSkillId,
    errorMessage: 'Could not generate valid variables after retry limit',
  };
}

const interactiveTimeLimit = (difficulty: Difficulty, base: number) => {
  if (difficulty === 'easy') return Math.max(base, 35);
  if (difficulty === 'medium') return Math.max(base, 30);
  return Math.max(base, 25);
};

const sortNumbersTimeLimit = (difficulty: Difficulty) => {
  if (difficulty === 'easy') return 60;
  if (difficulty === 'medium') return 50;
  return 40;
};

function uniqueNumbers(count: number, min: number, max: number) {
  const values = new Set<number>();
  while (values.size < count) values.add(randomInt(min, max));
  return Array.from(values);
}

function createMissingEquationChoices(answer: number, min: number, max: number) {
  const values = new Set<number>([answer]);
  const offsets = shuffle([-20, -10, -5, -3, -2, -1, 1, 2, 3, 5, 10, 20]);

  offsets.forEach((offset) => {
    const candidate = answer + offset;
    if (candidate >= min && candidate <= max) values.add(candidate);
  });

  let guard = 0;
  while (values.size < 4 && guard < 20) {
    values.add(randomInt(min, max));
    guard += 1;
  }

  return shuffle(Array.from(values).slice(0, 4)).map(formatTwoDigits);
}

function makeSortNumbersQuestion(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number
): Question {
  const count = difficulty === 'easy' ? 6 : difficulty === 'medium' ? randomInt(7, 8) : randomInt(9, 10);
  const max = difficulty === 'easy' ? 20 : 99;
  const direction: SortNumbersPayload['direction'] = Math.random() < 0.5 ? 'asc' : 'desc';
  const numbers = uniqueNumbers(count, 1, max).map(formatTwoDigits);
  const correctOrder = [...numbers].sort((a, b) =>
    direction === 'asc' ? Number(a) - Number(b) : Number(b) - Number(a)
  );
  let initialPool = shuffle(numbers);
  if (initialPool.join('|') === correctOrder.join('|')) initialPool = shuffle(initialPool);
  const targetSlots = Array.from({ length: count }, () => null as string | null);
  const payload: SortNumbersPayload = {
    kind: 'sort-numbers',
    direction,
    initialPool,
    targetSlots,
    correctOrder,
  };
  const directionText = direction === 'asc' ? 'từ bé đến lớn' : 'từ lớn đến bé';

  return {
    id: `interactive-sort-${Date.now()}-${index}`,
    templateId: 'interactive-sort-numbers',
    sourceSkillId: 'interactive.sort-numbers',
    grade,
    topic,
    difficulty,
    questionType: 'sort-numbers',
    text: `Hãy sắp xếp các số sau ${directionText}`,
    correctAnswer: JSON.stringify(correctOrder),
    hint: direction === 'asc'
      ? 'Tìm số nhỏ nhất trước, rồi chọn số lớn hơn tiếp theo.'
      : 'Tìm số lớn nhất trước, rồi chọn số nhỏ hơn tiếp theo.',
    solution: `Thứ tự đúng là: ${correctOrder.join(', ')}.`,
    variables: { count, direction, initialPool: initialPool.join(','), targetSlots: '', correctOrder: correctOrder.join(',') },
    interactionPayload: payload,
    timeLimit: sortNumbersTimeLimit(difficulty),
  };
}

function makeMissingEquationQuestion(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number,
  options?: { carry?: boolean }
): Question | null {
  const carry = options?.carry ?? false;
  const range = carry ? getCarryRange(difficulty) : { min: 1, max: difficulty === 'easy' ? 20 : 99 };
  const patterns: MissingEquationPayload['pattern'][] =
    difficulty === 'easy'
      ? ['blank-left-add', 'blank-right-add']
      : difficulty === 'medium'
      ? ['blank-left-add', 'blank-right-add', 'blank-right-subtract']
      : ['blank-left-add', 'blank-right-add', 'blank-right-subtract', 'blank-left-subtract'];
  const additionPatterns = patterns.filter((pattern) => pattern.includes('add'));
  const subtractionPatterns = patterns.filter((pattern) => pattern.includes('subtract'));

  let topicPatterns: MissingEquationPayload['pattern'][];
  if (topic === 'addition') {
    topicPatterns = additionPatterns;
  } else if (topic === 'subtraction') {
    topicPatterns = subtractionPatterns;
  } else if (topic === 'carry') {
    const useAddition = Math.random() < gameConfig.carry.mix.addition;
    const preferred = useAddition ? additionPatterns : subtractionPatterns;
    topicPatterns = preferred.length ? preferred : patterns;
  } else {
    topicPatterns = patterns;
  }

  const pattern = pick(topicPatterns.length ? topicPatterns : patterns);
  const withinRange = (value: number) => value >= range.min && value <= range.max;

  for (let attempt = 0; attempt < 400; attempt += 1) {
    const answer = randomInt(range.min, range.max);
    const known = randomInt(range.min, range.max);
    let left = 0;
    let right = 0;
    let result = 0;
    let operator: MissingEquationPayload['operator'] = '+';
    let blankPosition: MissingEquationPayload['blankPosition'] = 'left';

    if (pattern === 'blank-left-add') {
      left = answer;
      right = known;
      result = answer + known;
      operator = '+';
      blankPosition = 'left';
      if (result > range.max || (carry && !withinRange(result))) continue;
      if (!(carry ? hasCarry(answer, known) : noCarry(answer, known))) continue;
    } else if (pattern === 'blank-right-add') {
      left = known;
      right = answer;
      result = known + answer;
      operator = '+';
      blankPosition = 'right';
      if (result > range.max || (carry && !withinRange(result))) continue;
      if (!(carry ? hasCarry(known, answer) : noCarry(known, answer))) continue;
    } else if (pattern === 'blank-right-subtract') {
      left = known + answer;
      right = answer;
      result = known;
      operator = '-';
      blankPosition = 'right';
      if (left > range.max) continue;
      if (carry) {
        if (!withinRange(left) || !hasBorrow(left, answer)) continue;
      } else if (!noBorrow(left, answer)) {
        continue;
      }
    } else {
      left = answer;
      right = known;
      result = answer - known;
      operator = '-';
      blankPosition = 'left';
      if (result < 0 || left > range.max) continue;
      if (carry) {
        if (!withinRange(result) || !hasBorrow(answer, known)) continue;
      } else if (!noBorrow(answer, known)) {
        continue;
      }
    }

    const choices = createMissingEquationChoices(answer, range.min, range.max);
    const payload: MissingEquationPayload = {
      kind: 'missing-equation',
      pattern,
      left: blankPosition === 'left' ? undefined : left,
      operator,
      right: blankPosition === 'right' ? undefined : right,
      result,
      blankPosition,
      choices,
    };
    const text = `${blankPosition === 'left' ? '__' : left} ${operator} ${blankPosition === 'right' ? '__' : right} = ${result}`;
    const carryMode = operator === '+' ? 'addition-carry' : 'subtraction-borrow';

    return {
      id: `interactive-missing-equation-${Date.now()}-${index}`,
      templateId: 'interactive-missing-equation',
      sourceSkillId: 'interactive.missing-equation',
      grade,
      topic,
      difficulty,
      questionType: 'missing-equation',
      text,
      choices,
      correctAnswer: String(answer),
      hint: carry
        ? operator === '+'
          ? `Cộng hàng đơn vị trước. Nếu đủ 10 thì nhớ 1 sang hàng chục. Tìm ô trống bằng ${result} trừ số đã biết.`
          : pattern === 'blank-right-subtract'
          ? `Hàng đơn vị không đủ trừ thì mượn 1 chục. Tìm ô trống bằng ${left} - ${result}.`
          : `Ô trống là số đứng trước phép trừ. Cộng ${result} với ${right} để tìm số đó.`
        : operator === '+'
        ? `Lấy kết quả ${result} trừ số đã biết để tìm ô trống.`
        : pattern === 'blank-right-subtract'
        ? `Lấy số đầu ${left} trừ kết quả ${result} để tìm ô trống.`
        : `Ô trống là số đứng trước phép trừ, nên cộng ${result} và ${right}.`,
      solution: `${text.replace('__', String(answer))}. Vậy ô trống là ${answer}.`,
      variables: {
        pattern,
        answer,
        left,
        right,
        result,
        ...(carry
          ? { carryMode, rangeMin: range.min, rangeMax: range.max }
          : {}),
      },
      interactionPayload: payload,
      timeLimit: interactiveTimeLimit(difficulty, 30),
    };
  }

  return null;
}

function makeClockHourQuestion(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number
): Question {
  const easyHours = [3, 6, 9, 12];
  const hour = difficulty === 'easy' ? pick(easyHours) : randomInt(1, 12);
  const distractors = new Set<number>([hour]);
  const nearby = [hour - 1, hour + 1, hour - 2, hour + 2].map((value) => ((value + 11) % 12) + 1);
  shuffle(nearby).forEach((value) => {
    if (difficulty === 'hard' && distractors.size < 4) distractors.add(value);
  });
  while (distractors.size < 4) distractors.add(randomInt(1, 12));
  const choices = shuffle(Array.from(distractors)).map((value) => `${value} giờ`);
  const payload: ClockHourPayload = { kind: 'clock-hour', hour, minuteHand: 12 };

  return {
    id: `interactive-clock-${Date.now()}-${index}`,
    templateId: 'interactive-clock-hour',
    sourceSkillId: 'interactive.clock-hour',
    grade,
    topic,
    difficulty,
    questionType: 'clock-hour',
    text: 'Đồng hồ chỉ mấy giờ?',
    choices,
    correctAnswer: `${hour} giờ`,
    hint: 'Kim phút chỉ số 12, con nhìn kim giờ ngắn đang chỉ vào số nào.',
    solution: `Kim giờ chỉ số ${hour}, nên đồng hồ chỉ ${hour} giờ.`,
    variables: { hour, minuteHand: 12 },
    interactionPayload: payload,
    timeLimit: interactiveTimeLimit(difficulty, 25),
  };
}

const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

function makeWeekdayBlankQuestion(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number
): Question {
  const length = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
  const startIndex = difficulty === 'easy' ? randomInt(0, 3) : randomInt(0, weekdays.length - 1);
  const sequence = Array.from({ length }, (_, itemIndex) => weekdays[(startIndex + itemIndex) % weekdays.length]);
  const blankIndex = randomInt(1, length - 2);
  const correct = sequence[blankIndex];
  const choices = shuffle(weekdays).filter((day) => day !== correct).slice(0, 3);
  choices.push(correct);
  const shuffledChoices = shuffle(choices);
  const displaySequence = sequence.map((day, itemIndex) => (itemIndex === blankIndex ? 'Ô trống' : day));
  const payload: WeekdayBlankPayload = {
    kind: 'weekday-blank',
    sequence,
    blankIndex,
    displaySequence,
  };

  return {
    id: `interactive-weekday-${Date.now()}-${index}`,
    templateId: 'interactive-weekday-blank',
    sourceSkillId: 'interactive.weekday-blank',
    grade,
    topic,
    difficulty,
    questionType: 'weekday-blank',
    text: 'Chọn ngày trong tuần',
    choices: shuffledChoices,
    correctAnswer: correct,
    hint: 'Đọc các ngày theo thứ tự từ trái sang phải, qua Chủ nhật sẽ quay lại Thứ 2.',
    solution: `Dãy đúng là: ${sequence.join(', ')}. Ô trống là ${correct}.`,
    variables: { sequence: sequence.join(','), blankIndex, correct },
    interactionPayload: payload,
    timeLimit: interactiveTimeLimit(difficulty, 25),
  };
}

function makeRelativeDateQuestion(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number
): Question {
  const calendarMode: RelativeDatePayload['calendarMode'] =
    difficulty === 'easy' ? 'weekday' : Math.random() < 0.5 ? 'weekday' : 'monthDate';
  let correctMapping: RelativeDatePayload['correctMapping'];

  if (calendarMode === 'weekday') {
    const startIndex = difficulty === 'easy' ? randomInt(0, 4) : randomInt(0, weekdays.length - 1);
    correctMapping = {
      yesterday: weekdays[startIndex],
      today: weekdays[(startIndex + 1) % weekdays.length],
      tomorrow: weekdays[(startIndex + 2) % weekdays.length],
    };
  } else {
    const yesterday = randomInt(1, 29);
    correctMapping = {
      yesterday: formatTwoDigits(yesterday),
      today: formatTwoDigits(yesterday + 1),
      tomorrow: formatTwoDigits(yesterday + 2),
    };
  }

  const shuffledValues = shuffle(Object.values(correctMapping));
  const payload: RelativeDatePayload = {
    kind: 'relative-date',
    calendarMode,
    shuffledValues,
    correctMapping,
  };

  return {
    id: `interactive-relative-date-${Date.now()}-${index}`,
    templateId: 'interactive-relative-date',
    sourceSkillId: 'interactive.relative-date',
    grade,
    topic,
    difficulty,
    questionType: 'relative-date',
    text: 'Tìm giá trị đúng',
    correctAnswer: JSON.stringify(correctMapping),
    hint: calendarMode === 'weekday'
      ? 'Hôm qua đứng trước hôm nay, ngày mai đứng sau hôm nay.'
      : 'Ba số ngày trong tháng phải đứng liên tiếp nhau.',
    solution: `Hôm qua: ${correctMapping.yesterday}, hôm nay: ${correctMapping.today}, ngày mai: ${correctMapping.tomorrow}.`,
    variables: { calendarMode, ...correctMapping, shuffledValues: shuffledValues.join(',') },
    interactionPayload: payload,
    timeLimit: interactiveTimeLimit(difficulty, 35),
  };
}

function makeInteractiveQuestion(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number
): Question | null {
  // Ẩn phần So sánh với lớp không được cấu hình.
  if (topic === 'comparison' && !isGradeEnabled(gameConfig.comparison.enabledForGrades, grade)) {
    return null;
  }

  if (topic === 'carry') {
    return makeMissingEquationQuestion(grade, topic, difficulty, index, { carry: true });
  }

  const makers: Array<() => Question | null> = [];

  if (topic === 'addition' || topic === 'subtraction' || topic === 'mixed') {
    makers.push(() => makeMissingEquationQuestion(grade, topic, difficulty, index));
    if (isGradeEnabled(gameConfig.carry.enabledForGrades, grade) && topic === 'mixed') {
      makers.push(() => makeMissingEquationQuestion(grade, topic, difficulty, index, { carry: true }));
    }
  }

  if (topic === 'comparison' || topic === 'mixed') {
    if (isGradeEnabled(gameConfig.comparison.enabledForGrades, grade)) {
      makers.push(() => makeSortNumbersQuestion(grade, topic, difficulty, index));
    }
    makers.push(
      () => makeClockHourQuestion(grade, topic, difficulty, index),
      () => makeWeekdayBlankQuestion(grade, topic, difficulty, index),
      () => makeRelativeDateQuestion(grade, topic, difficulty, index)
    );
  }

  if (makers.length === 0) return null;
  return pick(makers)();
}

export function generateQuestionBatch(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  count: number,
  answerMode: AnswerMode = 'auto'
): QuestionBatch {
  const diagnostics: TemplateDiagnostic[] = [];
  const matchingTemplates = templates.filter(
    (template) =>
      matchesList(grade, template.grade) &&
      matchesList(difficulty, template.difficulty) &&
      templateMatchesTopic(template, topic) &&
      !(
        template.topic === 'comparison' &&
        !isGradeEnabled(gameConfig.comparison.enabledForGrades, grade)
      )
  );

  const questions: Question[] = [];
  const recentKeys = new Set<string>();
  const comparisonCounts = { greater: 0, equal: 0, less: 0 };

  for (let index = 0; questions.length < count && index < count * 20; index += 1) {
    const shouldTryInteractive =
      index % 3 === 1 || (topic === 'mixed' && Math.random() < 0.45) || Math.random() < 0.25;
    const interactiveQuestion = shouldTryInteractive
      ? makeInteractiveQuestion(grade, topic, difficulty, index)
      : null;

    if (interactiveQuestion) {
      const key = `${interactiveQuestion.templateId}:${interactiveQuestion.text}:${interactiveQuestion.correctAnswer}`;
      if (recentKeys.has(key)) continue;
      recentKeys.add(key);
      questions.push(interactiveQuestion);
      continue;
    }

    if (matchingTemplates.length === 0) {
      const fallbackInteractive = makeInteractiveQuestion(grade, topic, difficulty, index);
      if (fallbackInteractive) questions.push(fallbackInteractive);
      break;
    }

    const equalTarget = Math.ceil(
      comparisonCounts.greater * gameConfig.comparisonSigns.minEqualToGreaterRatio
    );
    const shouldForceEqual =
      (topic === 'comparison' || topic === 'mixed') && comparisonCounts.equal < equalTarget;
    const comparisonValueTemplates = matchingTemplates.filter(
      (template) => template.answerRule === 'compareValues'
    );
    const template = shouldForceEqual && comparisonValueTemplates.length > 0
      ? pick(comparisonValueTemplates)
      : pick(matchingTemplates);
    const question = makeQuestion(
      template,
      grade,
      topic,
      difficulty,
      answerMode,
      index,
      shouldForceEqual ? '=' : undefined
    );

    if ('type' in question) {
      diagnostics.push(question);
      continue;
    }

    const key = `${question.templateId}:${question.text}`;
    if (recentKeys.has(key)) continue;
    recentKeys.add(key);
    if (question.correctAnswer === '>' || question.correctAnswer === '=' || question.correctAnswer === '<') {
      if (question.correctAnswer === '>') comparisonCounts.greater += 1;
      if (question.correctAnswer === '=') comparisonCounts.equal += 1;
      if (question.correctAnswer === '<') comparisonCounts.less += 1;
    }
    questions.push(question);
  }

  return { questions, diagnostics };
}
