import { generateQuestionBatch, type QuestionBatch } from '../game/questionTemplateEngine';
import { gameConfig } from '../game/gameConfig';
import type { AnswerMode, Difficulty, Grade, Question, Topic } from '../types';

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const ones = (value: number) => Math.abs(value) % 10;

const fallbackCarryQuestion = (
  grade: Grade,
  topic: Exclude<Topic, 'tower'>,
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

  const choices = new Set<number>([answer]);
  [-10, -5, -3, -2, -1, 1, 2, 3, 5, 10].forEach((offset) => {
    const candidate = answer + offset;
    if (candidate >= min && candidate <= max) choices.add(candidate);
  });
  for (let candidate = min; choices.size < 4 && candidate <= max; candidate += 1) {
    choices.add(candidate);
  }

  return {
    id: `fallback-carry-${Date.now()}-${index}`,
    templateId: 'fallback-carry',
    grade,
    topic,
    difficulty,
    questionType: 'multiple-choice',
    text: `${a} ${operator} ${b} = ?`,
    choices: Array.from(choices).slice(0, 4).map(String),
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
    timeLimit: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 25 : 20,
  };
};

const fallbackQuestion = (
  grade: Grade,
  topic: Exclude<Topic, 'tower'>,
  difficulty: Difficulty,
  index: number
): Question => {
  if (topic === 'carry') {
    return fallbackCarryQuestion(grade, topic, difficulty, index);
  }

  const max = grade === 1 ? 10 : 40;
  const a = randomInt(1, max - 1);
  const b = randomInt(1, Math.max(1, max - a));
  const answer = a + b;

  return {
    id: `fallback-${Date.now()}-${index}`,
    grade,
    topic: topic === 'mixed' ? 'addition' : topic,
    difficulty,
    questionType: 'multiple-choice',
    text: `${a} + ${b} = ?`,
    choices: [answer, answer + 1, Math.max(0, answer - 1)].map(String),
    correctAnswer: String(answer),
    hint: `Bắt đầu từ ${a}, đếm thêm ${b}.`,
    solution: `${a} + ${b} = ${answer}.`,
    variables: { a, b, answer },
    timeLimit: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 25 : 20,
  };
};

export function generateQuestionSession(
  grade: Grade,
  topic: Topic,
  difficulty: Difficulty,
  count: number,
  answerMode: AnswerMode = 'auto'
): QuestionBatch {
  const actualTopic: Exclude<Topic, 'tower'> = topic === 'tower' ? 'mixed' : topic;
  const batch = generateQuestionBatch(grade, actualTopic, difficulty, count, answerMode);

  if (batch.questions.length >= count) return batch;

  const fallbackQuestions = Array.from(
    { length: count - batch.questions.length },
    (_, index) => fallbackQuestion(grade, actualTopic, difficulty, index)
  );

  return {
    questions: [...batch.questions, ...fallbackQuestions],
    diagnostics: batch.diagnostics,
  };
}

export function generateQuestions(
  grade: Grade,
  topic: Topic,
  difficulty: Difficulty,
  count: number,
  answerMode: AnswerMode = 'auto'
): Question[] {
  return generateQuestionSession(grade, topic, difficulty, count, answerMode).questions;
}
