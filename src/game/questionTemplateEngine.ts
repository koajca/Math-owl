import templatesJson from '../data/questionTemplates.json';
import { gameConfig, getTimeLimit as getConfigTimeLimit, getTopicRange } from './gameConfig';
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
  TemplateTopic,
  TemplateValue,
  Topic,
  WeekdayBlankPayload,
} from '../types';

type ConcreteTopic = Exclude<Topic, 'tower'>;
type EffectiveTopic = 'add-sub' | 'find-number' | 'carry' | 'comparison' | 'mixed';
type ComparisonForm = 'twoNumbers' | 'exprLeft' | 'exprRight';
type CarryNeed = boolean | undefined;

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

export interface BatchPlans {
  operatorPlan?: Array<'+' | '-'>;
  carryPlan?: boolean[];
  formPlan?: ComparisonForm[];
}

export interface BatchOptions extends BatchPlans {
  rng?: () => number;
}

type Context = Record<string, TemplateValue>;

const templates = templatesJson as unknown as QuestionTemplate[];

// ---------------------------------------------------------------------------
// Random source (có hook để test)
// ---------------------------------------------------------------------------

let randomSource: () => number = Math.random;

/** Chỉ dùng cho test: thay nguồn random, truyền `null` để khôi phục Math.random. */
export function setRandomSource(fn: (() => number) | null) {
  randomSource = fn ?? Math.random;
}

const random = () => randomSource();

const randomInt = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;

const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];

const shuffleWith = <T,>(items: T[], rng: () => number) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const shuffle = <T,>(items: T[]) => shuffleWith(items, random);

const formatTwoDigits = (value: number) => value.toString().padStart(2, '0');

const asNumber = (value: TemplateValue | undefined) =>
  typeof value === 'number' ? value : Number(value);

const ones = (value: number) => Math.abs(value) % 10;

const noCarry = (a: number, b: number) => ones(a) + ones(b) < 10;

const noBorrow = (a: number, b: number) => a >= b && ones(a) >= ones(b);

const hasCarry = (a: number, b: number) => ones(a) + ones(b) >= 10;

const hasBorrow = (a: number, b: number) => a >= b && ones(a) < ones(b);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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

const effectiveMaxOf = (range: { max: number; resultMax?: number }) =>
  range.resultMax ?? range.max;

// ---------------------------------------------------------------------------
// Topic → template mapping
// ---------------------------------------------------------------------------

const TOPIC_TEMPLATE_MAP: Record<ConcreteTopic, TemplateTopic[]> = {
  'add-sub': ['addition', 'subtraction'],
  'find-number': ['missing-number'],
  carry: ['carry'],
  comparison: ['comparison'],
  mixed: ['addition', 'subtraction', 'missing-number', 'carry', 'comparison'],
};

function templateMatchesTopic(template: QuestionTemplate, topic: ConcreteTopic) {
  return TOPIC_TEMPLATE_MAP[topic].includes(template.topic);
}

function operatorOfTemplate(template: QuestionTemplate): '+' | '-' {
  if (template.answerRule === 'difference' || template.answerRule === 'missingSubtrahend' || template.answerRule === 'missingMinuend') {
    return '-';
  }
  if (template.tags.includes('subtraction')) return '-';
  if (template.tags.includes('addition')) return '+';
  return '+';
}

function comparisonFormOf(template: QuestionTemplate): ComparisonForm {
  if (template.tags.includes('expr-right')) return 'exprRight';
  if (template.tags.includes('expr-left')) return 'exprLeft';
  if (template.tags.includes('two-numbers')) return 'twoNumbers';
  if (template.answerRule === 'compareNumExpr') return 'exprRight';
  if (template.answerRule === 'compareExprNum') return 'exprLeft';
  return 'twoNumbers';
}

function effectiveTopicOf(template: QuestionTemplate, sessionTopic: ConcreteTopic): EffectiveTopic {
  if (template.topic === 'addition' || template.topic === 'subtraction') {
    return sessionTopic === 'add-sub' ? 'add-sub' : 'add-sub';
  }
  if (template.topic === 'carry') return sessionTopic === 'add-sub' ? 'add-sub' : 'carry';
  if (template.topic === 'comparison') return 'comparison';
  if (template.topic === 'missing-number') {
    return template.tags.includes('find-number') ? 'find-number' : 'mixed';
  }
  return 'mixed';
}

function allowedFindNumberTags(difficulty: Difficulty): string[] {
  if (difficulty === 'hard') {
    return ['blank-right-add', 'blank-left-add', 'blank-right-subtract', 'blank-left-subtract'];
  }
  return ['blank-right-add', 'blank-left-add'];
}

// ---------------------------------------------------------------------------
// Quota plans (D4)
// ---------------------------------------------------------------------------

export function planByWeights<T extends string>(
  count: number,
  weights: Record<T, number>,
  rng: () => number = random
): T[] {
  const entries = Object.entries(weights) as Array<[T, number]>;
  const total = entries.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0) || 1;
  const base = entries.map(([key, weight]) => {
    const exact = (count * Math.max(0, weight)) / total;
    return { key, exact, count: Math.floor(exact) };
  });

  let assigned = base.reduce((sum, entry) => sum + entry.count, 0);
  const remainder = count - assigned;
  const order = base
    .map((entry, index) => ({ index, fraction: entry.exact - Math.floor(entry.exact) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let step = 0; step < remainder && order.length > 0; step += 1) {
    base[order[step % order.length].index].count += 1;
    assigned += 1;
  }

  const list: T[] = [];
  base.forEach((entry) => {
    for (let index = 0; index < entry.count; index += 1) list.push(entry.key);
  });

  return shuffleWith(list, rng);
}

export function buildPlans(
  grade: Grade,
  topic: ConcreteTopic,
  count: number,
  rng: () => number = random
): BatchPlans {
  const plans: BatchPlans = {};

  if (topic === 'add-sub') {
    plans.operatorPlan = planByWeights(count, gameConfig.addSub.mix, rng).map((key) =>
      key === 'addition' ? '+' : '-'
    );
    if (grade === 2) {
      const carryRatio = gameConfig.gradeConstraints[2].addSubCarryRatio ?? 0.5;
      plans.carryPlan = planByWeights(
        count,
        { carry: carryRatio, plain: 1 - carryRatio },
        rng
      ).map((key) => key === 'carry');
    }
  }

  if (topic === 'comparison') {
    plans.formPlan = planByWeights(count, gameConfig.comparisonMix[grade], rng);
  }

  return plans;
}

// ---------------------------------------------------------------------------
// Template validation
// ---------------------------------------------------------------------------

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
    'exprValue',
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

// ---------------------------------------------------------------------------
// Variables & answer evaluation
// ---------------------------------------------------------------------------

function buildVariables(template: QuestionTemplate): Context {
  return Object.fromEntries(
    Object.entries(template.variables).map(([key, variable]) => {
      if (variable.type === 'integer') return [key, randomInt(variable.min, variable.max)];
      return [key, pick(variable.values)];
    })
  );
}

/** Kẹp mọi biến `integer` vào phạm vi của lớp/độ khó. */
function clampVariables(
  template: QuestionTemplate,
  context: Context,
  range: { min: number; max: number }
): Context {
  const next: Context = { ...context };
  Object.entries(template.variables).forEach(([key, variable]) => {
    if (variable.type !== 'integer') return;
    const value = asNumber(next[key]);
    if (Number.isFinite(value)) {
      next[key] = clamp(value, range.min, range.max);
    }
  });
  return next;
}

function pickWeightedComparisonSign(): '>' | '<' | '=' {
  const weights = gameConfig.comparisonSigns;
  const total = weights.greaterWeight + weights.equalWeight + weights.lessWeight;
  const roll = random() * total;

  if (roll < weights.greaterWeight) return '>';
  if (roll < weights.greaterWeight + weights.equalWeight) return '=';
  return '<';
}

function applyComparisonPreference(
  template: QuestionTemplate,
  context: Context,
  range: { min: number; max: number },
  preferredAnswer?: '>' | '<' | '='
): Context {
  const form = comparisonFormOf(template);
  const relation = preferredAnswer ?? pickWeightedComparisonSign();

  if (form === 'twoNumbers') {
    const { min, max } = range;
    if (relation === '=') {
      const value = randomInt(min, max);
      return { ...context, left: value, right: value };
    }

    if (max <= min) return { ...context, left: min, right: min };

    if (relation === '>') {
      const right = randomInt(min, max - 1);
      const left = randomInt(right + 1, max);
      return { ...context, left, right };
    }

    const left = randomInt(min, max - 1);
    const right = randomInt(left + 1, max);
    return { ...context, left, right };
  }

  const a = asNumber(context.a);
  const b = asNumber(context.b);
  const op = context.op === '-' ? '-' : '+';

  if (!Number.isFinite(a) || !Number.isFinite(b)) return context;
  if (op === '-' && a < b) return context;

  const expr = op === '-' ? a - b : a + b;
  const delta = Math.max(1, Math.round(range.max * 0.15));
  // Với `exprLeft` thì `expr __ c`; với `exprRight` thì `c __ expr`.
  const higherCIsLess = form === 'exprLeft';
  let c = expr;

  if (relation === '=') {
    c = expr;
  } else if (relation === '>') {
    c = higherCIsLess ? expr - randomInt(1, delta) : expr + randomInt(1, delta);
  } else if (relation === '<') {
    c = higherCIsLess ? expr + randomInt(1, delta) : expr - randomInt(1, delta);
  } else {
    c = expr + randomInt(-delta, delta);
  }

  return { ...context, c: clamp(c, range.min, range.max) };
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
  if (rule === 'missingMinuend') return { answer: result + a, derived: {} };

  if (rule === 'compareValues') {
    const answer = left === right ? '=' : left > right ? '>' : '<';
    return { answer, derived: {} };
  }

  if (rule === 'compareExprNum' || rule === 'compareNumExpr') {
    const op = context.op === '-' ? '-' : '+';
    const exprValue = op === '-' ? a - b : a + b;
    const answer =
      rule === 'compareExprNum'
        ? exprValue === c
          ? '='
          : exprValue > c
          ? '>'
          : '<'
        : c === exprValue
        ? '='
        : c > exprValue
        ? '>'
        : '<';
    return { answer, derived: { exprValue } };
  }

  // Giữ tương thích với template cũ nếu còn trong dữ liệu.
  if (rule === 'compareExpression') {
    const leftValue = a + b;
    const rightValue = c - d;
    const answer = leftValue === rightValue ? '=' : leftValue > rightValue ? '>' : '<';
    return { answer, derived: { leftValue, rightValue } };
  }

  return { answer: '', derived: {} };
}

// ---------------------------------------------------------------------------
// Constraints
// ---------------------------------------------------------------------------

function passesConstraint(
  rule: string,
  context: Context,
  answer: string | number,
  difficulty: Difficulty,
  answerRule: string,
  range: { min: number; max: number; resultMax?: number }
) {
  const a = asNumber(context.a);
  const b = asNumber(context.b);
  const c = asNumber(context.c);
  const d = asNumber(context.d);
  const left = asNumber(context.left);
  const right = asNumber(context.right);
  const result = asNumber(context.result);
  const limit = effectiveMaxOf(range);
  const carryRange = getCarryRange(difficulty);
  const inCarryRange = (value: number) =>
    value >= carryRange.min && value <= carryRange.max;

  if (rule === 'valuesWithinLimit') {
    return [a, b, c, d, left, right, result]
      .filter((value) => Number.isFinite(value))
      .every((value) => value >= range.min && value <= range.max);
  }
  if (rule === 'sumWithinLimit') return a + b <= limit;
  if (rule === 'differenceWithinLimit') return a <= limit && b <= limit;
  if (rule === 'differenceNonNegative') return a >= b;
  if (rule === 'noCarry') return noCarry(a, b);
  if (rule === 'noBorrow') return noBorrow(a, b);
  if (rule === 'rightDifferenceNonNegative') return c >= d;
  if (rule === 'rightNoBorrow') return c >= d && ones(c) >= ones(d);
  if (rule === 'exprNonNegative') return context.op === '-' ? a >= b : true;
  if (rule === 'resultGreaterThanA') return result > a;
  if (rule === 'aGreaterThanResult') return a > result;
  if (rule === 'missingAddWithinLimit') return result <= limit;
  if (rule === 'missingAddNoCarry') return noCarry(a, result - a);
  if (rule === 'missingSubNoBorrow') return noBorrow(a, a - result);
  if (rule === 'answerWithinLimit') {
    const numericAnswer = typeof answer === 'number' ? answer : Number(answer);
    return (
      Number.isFinite(numericAnswer) &&
      numericAnswer >= 0 &&
      numericAnswer <= limit
    );
  }

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

// ---------------------------------------------------------------------------
// Grade policy (D1)
// ---------------------------------------------------------------------------

interface PolicyContext {
  grade: Grade;
  effectiveTopic: EffectiveTopic;
  carryNeed: CarryNeed;
  rule: string;
}

function operationOf(
  rule: string,
  context: Context,
  answer: string | number
): { x: number; y: number; op: '+' | '-'; result: number } | null {
  const a = asNumber(context.a);
  const b = asNumber(context.b);
  const result = asNumber(context.result);
  const numericAnswer = typeof answer === 'number' ? answer : Number(answer);

  if (rule === 'sum') return { x: a, y: b, op: '+', result: a + b };
  if (rule === 'difference') return { x: a, y: b, op: '-', result: a - b };
  if (rule === 'missingAddend') {
    return { x: a, y: numericAnswer, op: '+', result: result };
  }
  if (rule === 'missingSubtrahend') {
    return { x: a, y: numericAnswer, op: '-', result: result };
  }
  if (rule === 'missingMinuend') {
    return { x: numericAnswer, y: a, op: '-', result: result };
  }
  if (rule === 'compareExprNum' || rule === 'compareNumExpr') {
    const left = asNumber(context.a);
    const right = asNumber(context.b);
    const op = context.op === '-' ? '-' : '+';
    const exprValue = op === '-' ? left - right : left + right;
    return { x: left, y: right, op, result: exprValue };
  }
  return null;
}

function passesGradePolicy(
  context: Context,
  answer: string | number,
  policy: PolicyContext
): boolean {
  const operation = operationOf(policy.rule, context, answer);
  if (!operation) return true;

  const { x, y, op, result } = operation;
  const constraint = gameConfig.gradeConstraints[policy.grade];
  const carries = op === '+' ? hasCarry(x, y) : x >= y && hasBorrow(x, y);

  if (policy.grade === 0) {
    const resultMax = 'resultMax' in constraint ? constraint.resultMax : 10;
    if (x < 0 || y < 0 || result < 0) return false;
    if (op === '-' && x < y) return false;
    if (result > resultMax) return false;
    return !carries;
  }

  if (policy.grade === 1) return !carries;

  if (policy.effectiveTopic === 'add-sub') {
    if (policy.carryNeed === undefined) return true;
    return policy.carryNeed ? carries : !carries;
  }

  // find-number, comparison, carry: yêu cầu có nhớ/mượn ở Lớp 2.
  if (policy.effectiveTopic === 'find-number' || policy.effectiveTopic === 'comparison' || policy.effectiveTopic === 'carry') {
    return carries;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Choices
// ---------------------------------------------------------------------------

function createChoices(
  answer: string | number,
  rule: string | null | undefined,
  range: { min: number; max: number; resultMax?: number },
  floorOverride?: number,
  maxOverride?: number
) {
  if (rule === 'comparisonSigns') return ['>', '<', '='];

  const numericAnswer = typeof answer === 'number' ? answer : Number(answer);
  if (!Number.isFinite(numericAnswer)) return [String(answer)];

  const limit = maxOverride ?? effectiveMaxOf(range);
  const floor = Math.min(floorOverride ?? 0, limit);
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
    values.add(randomInt(floor, Math.max(floor, limit)));
    guard += 1;
  }

  return shuffle(Array.from(values).slice(0, 4).map(String));
}

function mapQuestionType(
  template: QuestionTemplate,
  answerMode: AnswerMode,
  difficulty: Difficulty
): Question['questionType'] {
  const isFindNumber = template.tags.includes('find-number');

  if (template.questionType === 'comparison-sign') {
    return answerMode === 'input' ? 'compare' : 'multiple-choice';
  }

  if (isFindNumber) {
    return answerMode === 'input' ? 'fill-number' : 'multiple-choice';
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

// ---------------------------------------------------------------------------
// Single question generation
// ---------------------------------------------------------------------------

interface MakeQuestionOptions {
  preferredComparison?: '>' | '<' | '=';
  carryNeed?: CarryNeed;
  pair?: { a: number; b: number };
}

function makeQuestion(
  template: QuestionTemplate,
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  answerMode: AnswerMode,
  index: number,
  options: MakeQuestionOptions = {}
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

  const range = getTopicRange(grade, topic, difficulty);
  const effectiveTopic = effectiveTopicOf(template, topic);
  const isComparison = template.topic === 'comparison';

  for (let attempt = 0; attempt < 300; attempt += 1) {
    let variables = buildVariables(template);
    if (options.pair) {
      variables = { ...variables, a: options.pair.a, b: options.pair.b };
    }
    variables = clampVariables(template, variables, range);

    if (isComparison) {
      variables = applyComparisonPreference(
        template,
        variables,
        range,
        options.preferredComparison
      );
      variables = clampVariables(template, variables, range);
    }

    const { answer, derived } = evaluateAnswer(template.answerRule, variables);
    const constraintsPass = template.constraints.every((constraint) =>
      passesConstraint(constraint, variables, answer, difficulty, template.answerRule, range)
    );
    if (!constraintsPass) continue;

    const policyPass = passesGradePolicy(variables, answer, {
      grade,
      effectiveTopic,
      carryNeed: options.carryNeed,
      rule: template.answerRule,
    });
    if (!policyPass) continue;

    if (
      options.preferredComparison &&
      isComparison &&
      answer !== options.preferredComparison
    ) {
      continue;
    }

    const numericAnswer = typeof answer === 'number' ? answer : Number(answer);
    const isSignAnswer =
      template.answerRule === 'compareValues' ||
      template.answerRule === 'compareExprNum' ||
      template.answerRule === 'compareNumExpr';
    if (!isSignAnswer) {
      if (!Number.isFinite(numericAnswer) || numericAnswer < 0) continue;
      if (numericAnswer > effectiveMaxOf(range)) continue;
    }

    const isCarryTemplate = template.topic === 'carry';
    const carryRange = isCarryTemplate ? getCarryRange(difficulty) : undefined;
    const context: Context = {
      ...variables,
      ...derived,
      answer,
      ...(isCarryTemplate && carryRange
        ? {
            carryMode:
              template.answerRule === 'difference'
                ? 'subtraction-borrow'
                : 'addition-carry',
            rangeMin: carryRange.min,
            rangeMax: carryRange.max,
          }
        : {}),
    };

    const questionType = mapQuestionType(template, answerMode, difficulty);
    const choices =
      questionType === 'multiple-choice'
        ? createChoices(
            answer,
            template.choicesRule,
            range,
            undefined,
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
      timeLimit: getConfigTimeLimit(grade, difficulty),
    };
  }

  return {
    type: 'template_skipped',
    templateId: template.id,
    sourceSkillId: template.sourceSkillId,
    errorMessage: 'Could not generate valid variables after retry limit',
  };
}

// ---------------------------------------------------------------------------
// Pair cache (giới hạn không gian câu Mầm non — D6)
// ---------------------------------------------------------------------------

interface NumberPair {
  a: number;
  b: number;
}

const pairCache = new Map<string, NumberPair[]>();

function getPairs(
  grade: Grade,
  difficulty: Difficulty,
  operator: '+' | '-',
  carryNeed: boolean
): NumberPair[] {
  const key = `${grade}|${difficulty}|${operator}|${carryNeed}`;
  const cached = pairCache.get(key);
  if (cached) return cached;

  const range =
    carryNeed && grade === 2
      ? getCarryRange(difficulty)
      : getTopicRange(grade, 'add-sub', difficulty);
  const limit = effectiveMaxOf(range);
  const pairs: NumberPair[] = [];

  for (let a = Math.max(1, range.min); a <= range.max; a += 1) {
    for (let b = Math.max(1, range.min); b <= range.max; b += 1) {
      const result = operator === '+' ? a + b : a - b;
      if (result < 0 || result > limit) continue;
      const carries = operator === '+' ? hasCarry(a, b) : a >= b && hasBorrow(a, b);
      if (operator === '-' && a < b) continue;
      if (carryNeed ? !carries : carries) continue;
      pairs.push({ a, b });
    }
  }

  pairCache.set(key, pairs);
  return pairs;
}

// ---------------------------------------------------------------------------
// Interactive generators
// ---------------------------------------------------------------------------

const interactiveTimeLimit = (grade: Grade, difficulty: Difficulty, base: number) =>
  Math.max(getConfigTimeLimit(grade, difficulty), base);

const sortNumbersTimeLimit = (difficulty: Difficulty) => {
  if (difficulty === 'easy') return 60;
  if (difficulty === 'medium') return 50;
  return 40;
};

function uniqueNumbers(count: number, min: number, max: number) {
  const values = new Set<number>();
  let guard = 0;
  while (values.size < count && guard < count * 50) {
    values.add(randomInt(min, max));
    guard += 1;
  }
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
  const direction: SortNumbersPayload['direction'] = random() < 0.5 ? 'asc' : 'desc';
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

interface MissingEquationOptions {
  carry?: boolean;
  range?: { min: number; max: number };
  allowedTags?: MissingEquationPayload['pattern'][];
}

function makeMissingEquationQuestion(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number,
  options: MissingEquationOptions = {}
): Question | null {
  const carry = options.carry ?? false;
  const range =
    options.range ??
    (carry ? getCarryRange(difficulty) : getTopicRange(grade, topic, difficulty));
  const patterns: MissingEquationPayload['pattern'][] =
    options.allowedTags ??
    (difficulty === 'easy'
      ? ['blank-left-add', 'blank-right-add']
      : difficulty === 'medium'
      ? ['blank-left-add', 'blank-right-add', 'blank-right-subtract']
      : ['blank-left-add', 'blank-right-add', 'blank-right-subtract', 'blank-left-subtract']);
  const additionPatterns = patterns.filter((pattern) => pattern.includes('add'));
  const subtractionPatterns = patterns.filter((pattern) => pattern.includes('subtract'));
  const useAddition = random() < 0.5;
  const topicPatterns =
    topic === 'carry'
      ? useAddition
        ? additionPatterns
        : subtractionPatterns
      : patterns;

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
      if (result > range.max) continue;
      if (!(carry ? hasCarry(answer, known) : noCarry(answer, known))) continue;
    } else if (pattern === 'blank-right-add') {
      left = known;
      right = answer;
      result = known + answer;
      operator = '+';
      blankPosition = 'right';
      if (result > range.max) continue;
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

    const choices = createMissingEquationChoices(answer, 0, range.max);
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
    const baseTime = interactiveTimeLimit(grade, difficulty, 30);

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
        ...(carry ? { carryMode, rangeMin: range.min, rangeMax: range.max } : {}),
      },
      interactionPayload: payload,
      timeLimit: baseTime,
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
    timeLimit: interactiveTimeLimit(grade, difficulty, 25),
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
    timeLimit: interactiveTimeLimit(grade, difficulty, 25),
  };
}

function makeRelativeDateQuestion(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number
): Question {
  const calendarMode: RelativeDatePayload['calendarMode'] =
    difficulty === 'easy' ? 'weekday' : random() < 0.5 ? 'weekday' : 'monthDate';
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
    timeLimit: interactiveTimeLimit(grade, difficulty, 35),
  };
}

function makeInteractiveQuestion(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number
): Question | null {
  // Mầm non chỉ dùng template số học/so sánh.
  if (grade === 0) return null;

  if (topic === 'carry') {
    return makeMissingEquationQuestion(grade, topic, difficulty, index, { carry: true });
  }

  if (topic !== 'mixed') return null;

  const makers: Array<() => Question | null> = [
    () => makeMissingEquationQuestion(grade, topic, difficulty, index),
  ];

  if (isGradeEnabled(gameConfig.carry.enabledForGrades, grade)) {
    makers.push(() =>
      makeMissingEquationQuestion(grade, topic, difficulty, index, { carry: true })
    );
  }

  makers.push(
    () => makeSortNumbersQuestion(grade, topic, difficulty, index),
    () => makeClockHourQuestion(grade, topic, difficulty, index),
    () => makeWeekdayBlankQuestion(grade, topic, difficulty, index),
    () => makeRelativeDateQuestion(grade, topic, difficulty, index)
  );

  return pick(makers)();
}

// ---------------------------------------------------------------------------
// Batch generation
// ---------------------------------------------------------------------------

function candidatesForTopic(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty
): QuestionTemplate[] {
  return templates.filter(
    (template) =>
      matchesList(grade, template.grade) &&
      matchesList(difficulty, template.difficulty) &&
      templateMatchesTopic(template, topic)
  );
}

function addSubCandidates(
  grade: Grade,
  difficulty: Difficulty,
  operator: '+' | '-',
  carryNeed: boolean | undefined
): QuestionTemplate[] {
  return templates.filter((template) => {
    if (!matchesList(grade, template.grade)) return false;
    if (!matchesList(difficulty, template.difficulty)) return false;
    if (!['addition', 'subtraction', 'carry'].includes(template.topic)) return false;
    if (operatorOfTemplate(template) !== operator) return false;
    // Lớp 2: nửa số câu cần nhớ/mượn lấy từ template carry, nửa còn lại lấy template thường.
    if (carryNeed === true) return template.topic === 'carry';
    if (carryNeed === false) return template.topic !== 'carry';
    return true;
  });
}

function findNumberCandidates(
  grade: Grade,
  difficulty: Difficulty
): QuestionTemplate[] {
  const allowedTags = allowedFindNumberTags(difficulty);
  return templates.filter(
    (template) =>
      matchesList(grade, template.grade) &&
      matchesList(difficulty, template.difficulty) &&
      template.topic === 'missing-number' &&
      template.tags.includes('find-number') &&
      template.tags.some((tag) => allowedTags.includes(tag))
  );
}

function comparisonCandidates(
  grade: Grade,
  difficulty: Difficulty,
  form: ComparisonForm
): QuestionTemplate[] {
  return templates.filter(
    (template) =>
      matchesList(grade, template.grade) &&
      matchesList(difficulty, template.difficulty) &&
      template.topic === 'comparison' &&
      comparisonFormOf(template) === form
  );
}

export function generateQuestionBatch(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  count: number,
  answerMode: AnswerMode = 'auto',
  options: BatchOptions = {}
): QuestionBatch {
  const diagnostics: TemplateDiagnostic[] = [];
  const plans: BatchOptions = {
    ...buildPlans(grade, topic, count, options.rng ?? random),
    ...options,
  };
  const questions: Question[] = [];
  const recentKeys = new Set<string>();
  const usedPairs = new Set<string>();
  const comparisonCounts = { greater: 0, equal: 0, less: 0 };
  const maxIterations = Math.max(count * 40, 400);

  for (let iteration = 0; questions.length < count && iteration < maxIterations; iteration += 1) {
    // Slot giữ nguyên khi câu bị trùng để quota không bị lệch.
    const slot = questions.length;

    const interactiveAllowed = grade > 0 && (topic === 'mixed' || topic === 'carry');
    const shouldTryInteractive =
      interactiveAllowed &&
      (topic === 'carry' ? random() < 0.5 : iteration % 3 === 1 || random() < 0.4);

    if (shouldTryInteractive) {
      const interactiveQuestion = makeInteractiveQuestion(grade, topic, difficulty, iteration);
      if (interactiveQuestion) {
        const key = `${interactiveQuestion.templateId}:${interactiveQuestion.text}:${interactiveQuestion.correctAnswer}`;
        if (recentKeys.has(key)) continue;
        recentKeys.add(key);
        questions.push(interactiveQuestion);
        continue;
      }
    }

    const operatorPlan = plans.operatorPlan;
    const carryPlan = plans.carryPlan;
    const formPlan = plans.formPlan;
    const operator = operatorPlan?.[slot % operatorPlan.length];
    const carryNeed = carryPlan?.[slot % carryPlan.length];
    const form = formPlan?.[slot % formPlan.length];

    let candidates: QuestionTemplate[];
    if (topic === 'add-sub') {
      const chosenOperator = operator ?? (random() < 0.5 ? '+' : '-');
      candidates = addSubCandidates(grade, difficulty, chosenOperator, carryNeed);
    } else if (topic === 'find-number') {
      candidates = findNumberCandidates(grade, difficulty);
    } else if (topic === 'comparison') {
      const chosenForm = form ?? pick<ComparisonForm>(['twoNumbers', 'exprLeft', 'exprRight']);
      candidates = comparisonCandidates(grade, difficulty, chosenForm);
    } else {
      candidates = candidatesForTopic(grade, topic, difficulty);
    }

    if (candidates.length === 0) {
      const fallbackCandidates = candidatesForTopic(grade, topic, difficulty);
      if (fallbackCandidates.length === 0) break;
      candidates = fallbackCandidates;
    }

    const equalTarget = Math.ceil(
      comparisonCounts.greater * gameConfig.comparisonSigns.minEqualToGreaterRatio
    );
    const shouldForceEqual =
      topic === 'comparison' && comparisonCounts.equal < equalTarget;

    const template = pick(candidates);

    let pair: { a: number; b: number } | undefined;
    if (topic === 'add-sub') {
      const chosenOperator = operator ?? operatorOfTemplate(template);
      const needCarry = grade === 2 ? carryNeed === true : false;
      const pairs = getPairs(grade, difficulty, chosenOperator, needCarry);
      if (pairs.length > 0) {
        const available = pairs.filter((item) => !usedPairs.has(`${chosenOperator}|${item.a}|${item.b}`));
        const chosen = available.length > 0 ? pick(available) : pick(pairs);
        if (available.length === 0) usedPairs.clear();
        usedPairs.add(`${chosenOperator}|${chosen.a}|${chosen.b}`);
        pair = chosen;
      }
    }

    const question = makeQuestion(template, grade, topic, difficulty, answerMode, iteration, {
      preferredComparison: shouldForceEqual ? '=' : undefined,
      carryNeed: topic === 'add-sub' ? carryNeed : undefined,
      pair,
    });

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
