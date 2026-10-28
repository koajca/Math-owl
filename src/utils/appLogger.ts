import type { Difficulty, Grade, Mode, Question, QuestionPlayLog, Topic } from '../types';

const LOG_STORAGE_KEY = 'owl_math_game_question_logs_v1';
const MAX_LOGS = 800;
let logCache: QuestionPlayLog[] | null = null;

type BaseLogContext = {
  sessionId: string;
  playerName?: string;
  grade: Grade;
  mode: Mode;
  topic: Topic;
  difficulty: Difficulty;
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createSessionId = () => createId('session');

function readLogs(): QuestionPlayLog[] {
  if (logCache) return logCache;
  try {
    const raw = window.localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) {
      logCache = [];
      return logCache;
    }
    const parsed = JSON.parse(raw);
    logCache = Array.isArray(parsed) ? (parsed as QuestionPlayLog[]) : [];
    return logCache;
  } catch {
    logCache = [];
    return logCache;
  }
}

function writeLogs(logs: QuestionPlayLog[]) {
  logCache = logs.slice(-MAX_LOGS);
  window.localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logCache));
}

export function appendQuestionLog(log: Omit<QuestionPlayLog, 'eventId' | 'timestamp'>) {
  const entry: QuestionPlayLog = {
    ...log,
    eventId: createId('event'),
    timestamp: new Date().toISOString(),
  };
  const logs = [...readLogs(), entry].slice(-MAX_LOGS);
  writeLogs(logs);

  if (import.meta.env.DEV) {
    console.debug('[question-log]', entry);
  }
}

export function logQuestionGenerated(context: BaseLogContext, question: Question) {
  appendQuestionLog({
    ...context,
    eventType: 'question_generated',
    questionId: question.id,
    templateId: question.templateId,
    sourceSkillId: question.sourceSkillId,
    variables: question.variables,
    prompt: question.text,
    choices: question.choices,
    correctAnswer: question.correctAnswer,
    hint: question.hint,
    solution: question.solution,
    interactionPayload: question.interactionPayload,
  });
}

export function logQuestionAnswered(
  context: BaseLogContext,
  question: Question,
  details: {
    userAnswer: string;
    isCorrect: boolean;
    attemptCount: number;
    timeSpentSeconds: number;
    scoreDelta: number;
    hintShown: boolean;
    userInteractionState?: unknown;
    correctInteractionState?: unknown;
  }
) {
  appendQuestionLog({
    ...context,
    eventType: 'question_answered',
    questionId: question.id,
    templateId: question.templateId,
    sourceSkillId: question.sourceSkillId,
    prompt: question.text,
    correctAnswer: question.correctAnswer,
    userAnswer: details.userAnswer,
    isCorrect: details.isCorrect,
    attemptCount: details.attemptCount,
    timeSpentSeconds: details.timeSpentSeconds,
    scoreDelta: details.scoreDelta,
    hintShown: details.hintShown,
    interactionPayload: question.interactionPayload,
    userInteractionState: details.userInteractionState,
    correctInteractionState: details.correctInteractionState,
  });
}

export function logQuestionTimeout(context: BaseLogContext, question: Question, timeLimitSeconds: number) {
  appendQuestionLog({
    ...context,
    eventType: 'question_timeout',
    questionId: question.id,
    templateId: question.templateId,
    sourceSkillId: question.sourceSkillId,
    prompt: question.text,
    correctAnswer: question.correctAnswer,
    timeSpentSeconds: timeLimitSeconds,
    hintShown: false,
    interactionPayload: question.interactionPayload,
    correctInteractionState: question.interactionPayload,
  });
}

export function logTemplateIssue(
  context: BaseLogContext,
  details: {
    eventType: 'template_skipped' | 'template_validation_error';
    templateId?: string;
    sourceSkillId?: string;
    errorMessage: string;
  }
) {
  appendQuestionLog({
    ...context,
    eventType: details.eventType,
    templateId: details.templateId,
    sourceSkillId: details.sourceSkillId,
    errorMessage: details.errorMessage,
  });
}

export function getQuestionLogs() {
  return readLogs();
}

export function clearQuestionLogs() {
  writeLogs([]);
}

export function exportQuestionLogs() {
  const logs = readLogs();
  const jsonl = logs.map((log) => JSON.stringify(log)).join('\n');
  const blob = new Blob([jsonl], { type: 'application/jsonl;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `owl-math-question-log-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
