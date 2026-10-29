export type Grade = 1 | 2;
export type Mode = 'practice' | 'challenge';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Topic = 'addition' | 'subtraction' | 'carry' | 'comparison' | 'mixed' | 'tower';
export type AnswerMode = 'auto' | 'choice' | 'input';
export type CarryMode = 'addition-carry' | 'subtraction-borrow';
export type QuestionType =
  | 'multiple-choice'
  | 'input'
  | 'fill-number'
  | 'compare'
  | 'sort-numbers'
  | 'missing-equation'
  | 'clock-hour'
  | 'weekday-blank'
  | 'relative-date';
export type OwlMood = 'idle' | 'happy' | 'thinking' | 'celebrate' | 'timeout';
export type TemplateTopic =
  | 'addition'
  | 'subtraction'
  | 'carry'
  | 'comparison'
  | 'missing-number'
  | 'mixed';

export type TemplateQuestionType =
  | 'multiple-choice'
  | 'number-input'
  | 'comparison-sign'
  | 'missing-number'
  | 'word-problem';

export type TemplateVariable =
  | {
      type: 'integer';
      min: number;
      max: number;
    }
  | {
      type: 'choice';
      values: string[];
    };

export type TemplateValue = string | number | boolean;

export interface SortNumbersPayload {
  kind: 'sort-numbers';
  direction: 'asc' | 'desc';
  initialPool: string[];
  targetSlots: Array<string | null>;
  correctOrder: string[];
}

export interface MissingEquationPayload {
  kind: 'missing-equation';
  pattern: 'blank-left-add' | 'blank-right-add' | 'blank-right-subtract' | 'blank-left-subtract';
  left?: number;
  operator: '+' | '-';
  right?: number;
  result: number;
  blankPosition: 'left' | 'right';
  choices: string[];
}

export interface ClockHourPayload {
  kind: 'clock-hour';
  hour: number;
  minuteHand: 12;
}

export interface WeekdayBlankPayload {
  kind: 'weekday-blank';
  sequence: string[];
  blankIndex: number;
  displaySequence: string[];
}

export interface RelativeDatePayload {
  kind: 'relative-date';
  calendarMode: 'weekday' | 'monthDate';
  shuffledValues: string[];
  correctMapping: {
    yesterday: string;
    today: string;
    tomorrow: string;
  };
}

export type InteractionPayload =
  | SortNumbersPayload
  | MissingEquationPayload
  | ClockHourPayload
  | WeekdayBlankPayload
  | RelativeDatePayload;

export interface QuestionTemplate {
  id: string;
  sourceSkillId: string;
  grade: Grade | Grade[];
  topic: TemplateTopic;
  difficulty: Difficulty | Difficulty[];
  questionType: TemplateQuestionType;
  tags: string[];
  variables: Record<string, TemplateVariable>;
  constraints: string[];
  promptTemplate: string;
  answerRule: string;
  choicesRule?: string | null;
  hintTemplate: string;
  solutionTemplate: string;
  timeLimitSeconds: number;
  validationExamples: Array<{
    variables: Record<string, TemplateValue>;
    answer: string | number;
  }>;
}

export interface Question {
  id: string;
  templateId?: string;
  sourceSkillId?: string;
  grade: Grade;
  topic: Exclude<Topic, 'tower'>;
  difficulty: Difficulty;
  questionType: QuestionType;
  text: string;
  choices?: string[];
  correctAnswer: string;
  hint: string;
  solution?: string;
  variables?: Record<string, TemplateValue>;
  interactionPayload?: InteractionPayload;
  timeLimit: number;
}

export type AvatarOption = 'owl-blue' | 'owl-green' | 'owl-pink';

export interface PlayerProfile {
  name: string;
  grade: Grade;
  soundEnabled: boolean;
  avatar: AvatarOption;
}

export interface ProgressState {
  completedChallenges: number;
  playedSessions: number;
  completedByDifficulty: Record<Difficulty, number>;
  completedByTopic: Partial<Record<Topic, number>>;
  totalScore: number;
  badges: string[];
  lastPlayedAt?: string;
}

export interface AppState {
  profile?: PlayerProfile;
  progress: ProgressState;
}

export interface SessionQuestionResult {
  index: number;
  questionId: string;
  templateId?: string;
  sourceSkillId?: string;
  questionType: QuestionType;
  topic: Topic;
  difficulty: Difficulty;
  prompt: string;
  choices?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect: boolean;
  timedOut: boolean;
  attemptCount: number;
  timeSpentSeconds: number;
  scoreDelta: number;
  hintShown: boolean;
  userInteractionState?: unknown;
  correctInteractionState?: unknown;
  /** Câu này đã phải trả lời lại sau lần sai đầu (chỉ Luyện tập). */
  retried?: boolean;
  /** Nội dung gợi ý đã hiển thị ở câu này, nếu có. */
  hintText?: string;
}

export interface PlaySessionRecord {
  sessionId: string;
  playerName: string;
  grade: Grade;
  avatar?: AvatarOption;
  mode: Mode;
  topic: Topic;
  difficulty: Difficulty;
  answerMode: AnswerMode;
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
  status: 'in-progress' | 'completed';
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  score: number;
  reward?: string;
  badges: string[];
  progressAfter?: {
    completedChallenges: number;
    playedSessions: number;
    totalScore: number;
  };
  questions: SessionQuestionResult[];
}

export interface PlaySessionExport {
  exportedAt: string;
  totalSessions: number;
  sessions: PlaySessionRecord[];
}

export type QuestionLogEventType =
  | 'question_generated'
  | 'question_answered'
  | 'question_timeout'
  | 'template_skipped'
  | 'template_validation_error';

export interface QuestionPlayLog {
  eventId: string;
  eventType: QuestionLogEventType;
  timestamp: string;
  sessionId: string;
  playerName?: string;
  grade: Grade;
  mode: Mode;
  topic: Topic;
  difficulty: Difficulty;
  templateId?: string;
  sourceSkillId?: string;
  questionId?: string;
  variables?: Record<string, TemplateValue>;
  prompt?: string;
  choices?: string[];
  correctAnswer?: string;
  hint?: string;
  solution?: string;
  interactionPayload?: InteractionPayload;
  userInteractionState?: unknown;
  correctInteractionState?: unknown;
  userAnswer?: string;
  isCorrect?: boolean;
  attemptCount?: number;
  timeSpentSeconds?: number;
  scoreDelta?: number;
  hintShown?: boolean;
  retried?: boolean;
  errorMessage?: string;
}
