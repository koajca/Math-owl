import { buildPlans, generateQuestionBatch, type QuestionBatch } from '../game/questionTemplateEngine';
import { gameConfig, getTimeLimit, getTopicRange } from '../game/gameConfig';
import type { AnswerMode, Difficulty, Grade, Mode, Question, Topic } from '../types';

type ConcreteTopic = Exclude<Topic, 'tower'>;

const randomInt = (min: number, max: number, rng: () => number = Math.random) =>
  Math.floor(rng() * (max - min + 1)) + min;

const pickWith = <T,>(items: T[], rng: () => number = Math.random) =>
  items[Math.floor(rng() * items.length)];

const shuffleWith = <T,>(items: T[], rng: () => number = Math.random) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const ones = (value: number) => Math.abs(value) % 10;
const hasCarry = (a: number, b: number) => ones(a) + ones(b) >= 10;
const hasBorrow = (a: number, b: number) => a >= b && ones(a) < ones(b);

const effectiveMax = (range: { max: number; resultMax?: number }) =>
  range.resultMax ?? range.max;

function numericChoices(answer: number, limit: number): string[] {
  const values = new Set<number>([answer]);
  const floor = 0;
  [-10, -5, -3, -2, -1, 1, 2, 3, 5, 10, 11, -11].forEach((offset) => {
    const candidate = answer + offset;
    if (candidate >= floor && candidate <= limit) values.add(candidate);
  });
  for (let candidate = floor; values.size < 4 && candidate <= limit; candidate += 1) {
    values.add(candidate);
  }
  return Array.from(values).slice(0, 4).map(String);
}

const fallbackCarryQuestion = (
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number
): Question => {
  const range = gameConfig.carry.rangeByDifficulty[difficulty];
  const min = range.min;
  const max = range.max;

  let a = min;
  let b = min;
  let answer = min + min;
  let operator: '+' | '-' = '+';
  let found = false;

  for (let candidateA = min; candidateA <= max && !found; candidateA += 1) {
    for (let candidateB = min; candidateB <= max; candidateB += 1) {
      const sum = candidateA + candidateB;
      if (sum >= min && sum <= max && ones(candidateA) + ones(candidateB) >= 10) {
        a = candidateA;
        b = candidateB;
        answer = sum;
        operator = '+';
        found = true;
        break;
      }
    }
  }

  if (!found) {
    for (let candidateA = min; candidateA <= max && !found; candidateA += 1) {
      for (let candidateB = min; candidateB <= max; candidateB += 1) {
        const difference = candidateA - candidateB;
        if (
          difference >= min &&
          difference <= max &&
          candidateA >= candidateB &&
          ones(candidateA) < ones(candidateB)
        ) {
          a = candidateA;
          b = candidateB;
          answer = difference;
          operator = '-';
          found = true;
          break;
        }
      }
    }
  }

  const choices = numericChoices(answer, max);

  return {
    id: `fallback-carry-${Date.now()}-${index}`,
    templateId: 'fallback-carry',
    grade,
    topic,
    difficulty,
    questionType: 'multiple-choice',
    text: `${a} ${operator} ${b} = ?`,
    choices,
    correctAnswer: String(answer),
    hint:
      operator === '+'
        ? `Cộng hàng đơn vị trước. Nếu đủ 10 thì nhớ 1 sang hàng chục.`
        : `Nếu hàng đơn vị không đủ trừ, con mượn 1 chục rồi trừ.`,
    solution: `${a} ${operator} ${b} = ${answer}.`,
    variables: {
      a,
      b,
      answer,
      carryMode: operator === '+' ? 'addition-carry' : 'subtraction-borrow',
      rangeMin: min,
      rangeMax: max,
    },
    timeLimit: getTimeLimit(grade, difficulty),
  };
};

function fallbackAddSub(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number,
  rng: () => number
): Question {
  const range = getTopicRange(grade, 'add-sub', difficulty);
  const limit = effectiveMax(range);
  const min = Math.max(1, range.min);

  for (let attempt = 0; attempt < 600; attempt += 1) {
    const operator: '+' | '-' = rng() < 0.5 ? '+' : '-';
    const a = randomInt(min, range.max, rng);
    const b = randomInt(min, range.max, rng);
    if (operator === '-' && a < b) continue;

    const answer = operator === '+' ? a + b : a - b;
    if (answer < 0 || answer > limit) continue;

    const carries = operator === '+' ? hasCarry(a, b) : hasBorrow(a, b);
    if (grade === 0 && carries) continue;
    if (grade === 1 && carries) continue;

    return {
      id: `fallback-${Date.now()}-${index}`,
      templateId: 'fallback-add-sub',
      grade,
      topic,
      difficulty,
      questionType: 'multiple-choice',
      text: `${a} ${operator} ${b} = ?`,
      choices: numericChoices(answer, limit),
      correctAnswer: String(answer),
      hint:
        operator === '+'
          ? `Bắt đầu từ ${a}, đếm thêm ${b}.`
          : `Bắt đầu từ ${a}, bớt đi ${b}.`,
      solution: `${a} ${operator} ${b} = ${answer}.`,
      variables: { a, b, answer, operator },
      timeLimit: getTimeLimit(grade, difficulty),
    };
  }

  const a = min;
  const b = min;
  return {
    id: `fallback-${Date.now()}-${index}`,
    templateId: 'fallback-add-sub',
    grade,
    topic,
    difficulty,
    questionType: 'multiple-choice',
    text: `${a} + ${b} = ?`,
    choices: numericChoices(a + b, limit),
    correctAnswer: String(a + b),
    hint: `Bắt đầu từ ${a}, đếm thêm ${b}.`,
    solution: `${a} + ${b} = ${a + b}.`,
    variables: { a, b, answer: a + b, operator: '+' },
    timeLimit: getTimeLimit(grade, difficulty),
  };
}

function fallbackFindNumber(
  grade: Grade,
  difficulty: Difficulty,
  index: number,
  rng: () => number,
  answerMode: AnswerMode
): Question {
  const range = getTopicRange(grade, 'find-number', difficulty);
  const limit = effectiveMax(range);
  const min = Math.max(1, range.min);
  const patterns =
    difficulty === 'hard'
      ? ['blank-right-add', 'blank-left-add', 'blank-right-subtract', 'blank-left-subtract']
      : ['blank-right-add', 'blank-left-add'];
  const pattern = pickWith(patterns, rng) as
    | 'blank-right-add'
    | 'blank-left-add'
    | 'blank-right-subtract'
    | 'blank-left-subtract';

  for (let attempt = 0; attempt < 800; attempt += 1) {
    const answer = randomInt(min, limit, rng);
    const known = randomInt(min, limit, rng);
    let a = known;
    let result = 0;
    let text = '';

    if (pattern === 'blank-right-add') {
      result = known + answer;
      if (result > limit) continue;
      text = `${known} + __ = ${result}`;
    } else if (pattern === 'blank-left-add') {
      result = known + answer;
      if (result > limit) continue;
      text = `__ + ${known} = ${result}`;
    } else if (pattern === 'blank-right-subtract') {
      a = known + answer;
      result = known;
      if (a > limit) continue;
      text = `${a} - __ = ${result}`;
    } else {
      a = known;
      result = known;
      const minuend = result + known;
      if (minuend > limit) continue;
      text = `__ - ${known} = ${result}`;
      // Answer của dạng này là số bị trừ.
      const carries = hasBorrow(minuend, known);
      if (grade === 1 && carries) continue;
      if (grade === 2 && !carries) continue;
      return {
        id: `fallback-find-number-${Date.now()}-${index}`,
        templateId: 'fallback-find-number',
        grade,
        topic: 'find-number',
        difficulty,
        questionType: answerMode === 'input' ? 'fill-number' : 'multiple-choice',
        text,
        choices: numericChoices(minuend, limit),
        correctAnswer: String(minuend),
        hint: `Ô trống là số đứng trước phép trừ, nên cộng ${result} với ${known}.`,
        solution: `Số cần điền là ${result} + ${known} = ${minuend}.`,
        variables: { a: known, result, answer: minuend, pattern },
        timeLimit: getTimeLimit(grade, difficulty),
      };
    }

    const carries =
      pattern.includes('add') ? hasCarry(known, answer) : hasBorrow(a, answer);
    if (grade === 1 && carries) continue;
    if (grade === 2 && !carries) continue;

    return {
      id: `fallback-find-number-${Date.now()}-${index}`,
      templateId: 'fallback-find-number',
      grade,
      topic: 'find-number',
      difficulty,
      questionType: answerMode === 'input' ? 'fill-number' : 'multiple-choice',
      text,
      choices: numericChoices(answer, limit),
      correctAnswer: String(answer),
      hint:
        pattern.includes('add')
          ? `Muốn tìm số còn thiếu, lấy ${result} - ${known}.`
          : `Muốn tìm số bị bớt đi, lấy ${a} - ${result}.`,
      solution: `Số cần điền là ${answer}.`,
      variables: { a: known, result, answer, pattern },
      timeLimit: getTimeLimit(grade, difficulty),
    };
  }

  return fallbackAddSub(grade, 'add-sub', difficulty, index, rng);
}

function fallbackComparison(
  grade: Grade,
  difficulty: Difficulty,
  index: number,
  rng: () => number
): Question {
  const range = getTopicRange(grade, 'comparison', difficulty);
  const min = range.min;
  const max = range.max;

  if (grade === 0) {
    const left = randomInt(min, max, rng);
    const right = randomInt(min, max, rng);
    const answer = left === right ? '=' : left > right ? '>' : '<';
    return {
      id: `fallback-comparison-${Date.now()}-${index}`,
      templateId: 'fallback-comparison',
      grade,
      topic: 'comparison',
      difficulty,
      questionType: 'multiple-choice',
      text: `${left} __ ${right}`,
      choices: ['>', '<', '='],
      correctAnswer: answer,
      hint: `So sánh ${left} và ${right}. Số lớn hơn nằm về phía dấu mở rộng.`,
      solution: `${left} ${answer} ${right}.`,
      variables: { left, right, answer },
      timeLimit: getTimeLimit(grade, difficulty),
    };
  }

  const useExpression = rng() < 0.5;
  const a = randomInt(Math.max(1, min), Math.max(1, max), rng);
  const b = randomInt(Math.max(1, min), Math.max(1, a), rng);
  const op: '+' | '-' = rng() < 0.5 ? '+' : '-';
  const exprValue = op === '-' ? a - b : a + b;
  const c = randomInt(min, max, rng);

  if (!useExpression) {
    const left = randomInt(min, max, rng);
    const right = randomInt(min, max, rng);
    const answer = left === right ? '=' : left > right ? '>' : '<';
    return {
      id: `fallback-comparison-${Date.now()}-${index}`,
      templateId: 'fallback-comparison',
      grade,
      topic: 'comparison',
      difficulty,
      questionType: 'multiple-choice',
      text: `${left} __ ${right}`,
      choices: ['>', '<', '='],
      correctAnswer: answer,
      hint: `So sánh ${left} và ${right}. Số lớn hơn nằm về phía dấu mở rộng.`,
      solution: `${left} ${answer} ${right}.`,
      variables: { left, right, answer },
      timeLimit: getTimeLimit(grade, difficulty),
    };
  }

  const opposite = op === '-' ? '+' : '-';
  const answer = exprValue === c ? '=' : exprValue > c ? '>' : '<';
  return {
    id: `fallback-comparison-${Date.now()}-${index}`,
    templateId: 'fallback-comparison',
    grade,
    topic: 'comparison',
    difficulty,
    questionType: 'multiple-choice',
    text: `${a} ${op} ${b} __ ${c}`,
    choices: ['>', '<', '='],
    correctAnswer: answer,
    hint: `Tính ${a} ${op} ${b} trước (hoặc dùng ${opposite}), rồi so sánh với ${c}.`,
    solution: `${a} ${op} ${b} = ${exprValue}. Vì vậy ${exprValue} ${answer} ${c}.`,
    variables: { a, b, c, op, exprValue, answer },
    timeLimit: getTimeLimit(grade, difficulty),
  };
}

export const fallbackQuestion = (
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  index: number,
  rng: () => number = Math.random,
  answerMode: AnswerMode = 'auto'
): Question => {
  if (topic === 'carry') {
    return fallbackCarryQuestion(grade, topic, difficulty, index);
  }

  if (grade === 0) {
    if (topic === 'comparison') return fallbackComparison(grade, difficulty, index, rng);
    return fallbackAddSub(grade, topic === 'mixed' ? 'add-sub' : topic, difficulty, index, rng);
  }

  if (topic === 'find-number') {
    return fallbackFindNumber(grade, difficulty, index, rng, answerMode);
  }

  if (topic === 'comparison') {
    return fallbackComparison(grade, difficulty, index, rng);
  }

  if (topic === 'mixed') {
    const choice = pickWith(['add-sub', 'find-number', 'comparison'] as const, rng);
    if (choice === 'find-number') return fallbackFindNumber(grade, difficulty, index, rng, answerMode);
    if (choice === 'comparison') return fallbackComparison(grade, difficulty, index, rng);
    return fallbackAddSub(grade, 'add-sub', difficulty, index, rng);
  }

  return fallbackAddSub(grade, topic, difficulty, index, rng);
};

function topicAvailable(grade: Grade, topic: ConcreteTopic): boolean {
  if (grade === 0) return topic !== 'find-number' && topic !== 'carry';
  if (grade === 1) return topic !== 'carry';
  return true;
}

function generateForGrade(
  grade: Grade,
  topic: ConcreteTopic,
  difficulty: Difficulty,
  count: number,
  answerMode: AnswerMode,
  rng: () => number
): QuestionBatch {
  if (count <= 0) return { questions: [], diagnostics: [] };

  const plans = buildPlans(grade, topic, count, rng);
  const batch = generateQuestionBatch(grade, topic, difficulty, count, answerMode, {
    ...plans,
    rng,
  });

  if (batch.questions.length >= count) {
    return { questions: batch.questions.slice(0, count), diagnostics: batch.diagnostics };
  }

  const fallback = Array.from(
    { length: count - batch.questions.length },
    (_, index) =>
      fallbackQuestion(grade, topic, difficulty, index, rng, answerMode)
  );

  return {
    questions: [...batch.questions, ...fallback],
    diagnostics: batch.diagnostics,
  };
}

export interface GenerateSessionOptions {
  mode?: Mode;
  rng?: () => number;
}

export function generateQuestionSession(
  grade: Grade,
  topic: Topic,
  difficulty: Difficulty,
  count: number,
  answerMode: AnswerMode = 'auto',
  options: GenerateSessionOptions = {}
): QuestionBatch {
  const actualTopic: ConcreteTopic = topic === 'tower' ? 'mixed' : topic;
  const rng = options.rng ?? Math.random;
  const isPractice = options.mode !== 'challenge';
  const excluded = gameConfig.lowerGradeMix.excludedTopics.includes(topic);
  const canMixLower =
    isPractice &&
    grade > 0 &&
    !excluded &&
    topicAvailable((grade - 1) as Grade, actualTopic);

  const maxLower = Math.floor(count * gameConfig.lowerGradeMix.ratio);
  const lowerCount = canMixLower && maxLower > 0 ? randomInt(0, maxLower, rng) : 0;

  const currentCount = count - lowerCount;
  const currentBatch = generateForGrade(grade, actualTopic, difficulty, currentCount, answerMode, rng);
  const current = [...currentBatch.questions];
  const diagnostics = [...currentBatch.diagnostics];

  const lower: Question[] = [];
  if (lowerCount > 0) {
    if (grade === 1) {
      const lowerBatch = generateForGrade(0, actualTopic, difficulty, lowerCount, answerMode, rng);
      lower.push(...lowerBatch.questions);
      diagnostics.push(...lowerBatch.diagnostics);
    } else {
      const fromGrade1 = randomInt(0, lowerCount, rng);
      const grade1Batch = generateForGrade(1, actualTopic, difficulty, fromGrade1, answerMode, rng);
      const grade0Batch = generateForGrade(0, actualTopic, difficulty, lowerCount - fromGrade1, answerMode, rng);
      lower.push(...grade1Batch.questions, ...grade0Batch.questions);
      diagnostics.push(...grade1Batch.diagnostics, ...grade0Batch.diagnostics);
    }
  }

  const missing = count - current.length - lower.length;
  if (missing > 0) {
    const supplement = generateForGrade(grade, actualTopic, difficulty, missing, answerMode, rng);
    current.push(...supplement.questions);
    diagnostics.push(...supplement.diagnostics);
  }

  const questions = shuffleWith([...current, ...lower], rng);

  return { questions, diagnostics };
}

export function generateQuestions(
  grade: Grade,
  topic: Topic,
  difficulty: Difficulty,
  count: number,
  answerMode: AnswerMode = 'auto',
  options: GenerateSessionOptions = {}
): Question[] {
  return generateQuestionSession(grade, topic, difficulty, count, answerMode, options).questions;
}
