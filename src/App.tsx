import { useEffect, useMemo, useRef, useState } from 'react';
import { generateQuestionSession } from './data/questions';
import {
  createSessionId,
  exportQuestionLogs,
  getQuestionLogs,
  logQuestionAnswered,
  logQuestionGenerated,
  logQuestionTimeout,
  logTemplateIssue,
} from './utils/appLogger';
import { gameConfig } from './game/gameConfig';
import { defaultState, loadAppState, saveAppState } from './utils/storage';
import {
  exportSessionRecordsAsJson,
  getSessionRecords,
  saveSessionRecord,
} from './utils/sessionHistory';
import type {
  AnswerMode,
  AppState,
  AvatarOption,
  Difficulty,
  Grade,
  InteractionPayload,
  Mode,
  OwlMood,
  PlaySessionRecord,
  Question,
  RelativeDatePayload,
  SessionQuestionResult,
  SortNumbersPayload,
  Topic,
} from './types';

type Page = 'setup' | 'home' | 'map' | 'selection' | 'quiz' | 'result';
type SortDragSource = { source: 'pool' | 'slot'; index: number };

const avatarOptions: Array<{ id: AvatarOption; label: string; mark: string }> = [
  { id: 'owl-blue', label: 'Cú Mèo Xanh', mark: '🦉' },
  { id: 'owl-green', label: 'Cú Thông Thái', mark: '📘' },
  { id: 'owl-pink', label: 'Cú Vui Vẻ', mark: '⭐' },
];

const difficultyName: Record<Difficulty, string> = {
  easy: 'Dễ',
  medium: 'Vừa',
  hard: 'Khó',
};

const topicName: Record<Topic, string> = {
  addition: 'Cộng',
  subtraction: 'Trừ',
  carry: 'Cộng trừ có nhớ',
  comparison: 'So sánh',
  mixed: 'Tổng hợp',
  tower: 'Tháp Thông Thái',
};

const topicDescription: Record<Topic, string> = {
  addition: 'Cây Cộng Số',
  subtraction: 'Cầu Phép Trừ',
  carry: 'Cộng có nhớ & trừ có mượn',
  comparison: 'Suối So Sánh',
  mixed: 'Đỉnh Núi Tổng Hợp',
  tower: 'Thử thách nâng cao',
};

const badgeLabels: Record<string, string> = {
  first_challenge: 'Cú Con Chăm Chỉ',
  perfect_run: 'Không Sai Câu Nào',
  addition_star: 'Siêu Cộng Số',
  subtraction_master: 'Bậc Thầy Phép Trừ',
  carry_master: 'Bậc Thầy Nhớ & Mượn',
  comparison_eye: 'Mắt Cú So Sánh',
  tower_wisdom: 'Cú Mèo Thông Thái',
};

function getUnlocked(progress: AppState['progress']) {
  const easyDone = progress.completedByDifficulty.easy;
  const mediumDone = progress.completedByDifficulty.medium;
  const completedChallenges = progress.completedChallenges;
  const unlock = gameConfig.unlockRequirements;

  return {
    difficulty: {
      easy: true,
      medium: easyDone >= unlock.mediumFromEasyChallenges,
      hard: mediumDone >= unlock.hardFromMediumChallenges,
    },
    topic: {
      addition: true,
      subtraction: true,
      carry: true,
      comparison: true,
      mixed: completedChallenges >= unlock.mixedFromCompletedChallenges,
      tower: completedChallenges >= unlock.towerFromCompletedChallenges,
    },
  };
}

function getLockedReason(topicOrDifficulty: Topic | Difficulty, progress: AppState['progress']) {
  const unlock = gameConfig.unlockRequirements;

  if (topicOrDifficulty === 'medium') {
    const remaining = Math.max(0, unlock.mediumFromEasyChallenges - progress.completedByDifficulty.easy);
    return `Hoàn thành thêm ${remaining} thử thách Dễ để mở khóa.`;
  }

  if (topicOrDifficulty === 'hard') {
    const remaining = Math.max(0, unlock.hardFromMediumChallenges - progress.completedByDifficulty.medium);
    return `Hoàn thành thêm ${remaining} thử thách Vừa để mở khóa.`;
  }

  const requirement: Record<string, number> = {
    mixed: unlock.mixedFromCompletedChallenges,
    tower: unlock.towerFromCompletedChallenges,
  };
  const required = requirement[topicOrDifficulty] ?? 0;
  const remaining = Math.max(0, required - progress.completedChallenges);
  return `Hoàn thành thêm ${remaining} thử thách để mở khóa.`;
}

function getProgressMessage(progress: AppState['progress']) {
  const unlock = gameConfig.unlockRequirements;
  const completedChallenges = progress.completedChallenges;
  if (completedChallenges >= unlock.towerFromCompletedChallenges) return 'Đã mở khóa toàn bộ khu rừng.';
  if (completedChallenges >= unlock.mixedFromCompletedChallenges) return 'Đã mở Đỉnh Núi Tổng Hợp. Mục tiêu tiếp theo: Tháp Thông Thái.';
  if (progress.completedByDifficulty.medium >= unlock.hardFromMediumChallenges) return 'Đã mở độ khó Khó. Con có thể thử các câu nâng cao hơn.';
  if (progress.completedByDifficulty.easy >= unlock.mediumFromEasyChallenges) {
    return `Đã mở độ khó Vừa. Hoàn thành ${unlock.hardFromMediumChallenges} thử thách Vừa để mở độ khó Khó.`;
  }
  return `Hoàn thành ${unlock.mediumFromEasyChallenges} thử thách Dễ để mở độ khó Vừa.`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getBadges(topic: Topic, correctCount: number, completedBefore: number) {
  const badges = new Set<string>();
  if (completedBefore === 0) badges.add('first_challenge');
  if (correctCount === 10) badges.add('perfect_run');
  if (topic === 'addition' && correctCount === 10) badges.add('addition_star');
  if (topic === 'subtraction' && correctCount === 10) badges.add('subtraction_master');
  if (topic === 'carry' && correctCount === 10) badges.add('carry_master');
  if (topic === 'comparison' && correctCount === 10) badges.add('comparison_eye');
  if (topic === 'tower' && correctCount >= 8) badges.add('tower_wisdom');
  return Array.from(badges);
}

function isGradeEnabled(grades: readonly Grade[], grade: Grade) {
  return grades.includes(grade);
}

function OwlMascot({ mood, message }: { mood: OwlMood; message: string }) {
  return (
    <div className={`owl-panel owl-${mood}`} aria-live="polite">
      <div className="owl">
        <div className="owl-ear left" />
        <div className="owl-ear right" />
        <div className="owl-face">
          <span className="owl-eye">●</span>
          <span className="owl-beak">◆</span>
          <span className="owl-eye">●</span>
        </div>
        <div className="owl-belly">∑</div>
      </div>
      <p>{message}</p>
    </div>
  );
}

function App() {
  const [state, setState] = useState<AppState>(defaultState);
  const [page, setPage] = useState<Page>('setup');
  const [playerName, setPlayerName] = useState('');
  const [playerGrade, setPlayerGrade] = useState<Grade>(1);
  const [playerAvatar, setPlayerAvatar] = useState<AvatarOption>('owl-blue');
  const [playerSoundEnabled, setPlayerSoundEnabled] = useState(true);
  const [mode, setMode] = useState<Mode>('practice');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [topic, setTopic] = useState<Topic>('addition');
  const [answerMode, setAnswerMode] = useState<AnswerMode>('auto');
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [logCount, setLogCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerValue, setAnswerValue] = useState('');
  const [sortPool, setSortPool] = useState<string[]>([]);
  const [sortSlots, setSortSlots] = useState<Array<string | null>>([]);
  const [sortWrongSlots, setSortWrongSlots] = useState<number[]>([]);
  const [selectedSortIndex, setSelectedSortIndex] = useState<number | null>(null);
  const [weekdayAnswer, setWeekdayAnswer] = useState('');
  const [relativeMapping, setRelativeMapping] = useState<Record<string, string>>({});
  const [selectedRelativeValue, setSelectedRelativeValue] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [pendingHint, setPendingHint] = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');
  const [sessionReward, setSessionReward] = useState('');
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [owlMood, setOwlMood] = useState<OwlMood>('idle');
  const [owlMessage, setOwlMessage] = useState('Mình cùng luyện toán nhé!');

  const audioContextRef = useRef<AudioContext | null>(null);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);
  const dragValueRef = useRef<string>('');
  const dragSortRef = useRef<SortDragSource | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  const sessionRecordRef = useRef<PlaySessionRecord | null>(null);
  const sessionResultsRef = useRef<SessionQuestionResult[]>([]);
  const sessionScoreRef = useRef(0);

  useEffect(() => {
    const saved = loadAppState();
    const completedSessions = getSessionRecords().filter((item) => item.status === 'completed').length;
    const restored: AppState = {
      ...saved,
      progress: {
        ...saved.progress,
        playedSessions: Math.max(saved.progress.playedSessions, completedSessions),
      },
    };
    setLogCount(getQuestionLogs().length);
    setSessionCount(getSessionRecords().length);
    setState(restored);
    if (restored.profile) {
      setPlayerName(restored.profile.name);
      setPlayerGrade(restored.profile.grade);
      setPlayerAvatar(restored.profile.avatar);
      setPlayerSoundEnabled(restored.profile.soundEnabled);
      setPage('home');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    correctAudioRef.current = new Audio('/sounds/success-answer.mp3');
    wrongAudioRef.current = new Audio('/sounds/buzzer-or-wrong-answer.mp3');
    if (correctAudioRef.current) correctAudioRef.current.volume = 0.9;
    if (wrongAudioRef.current) wrongAudioRef.current.volume = 0.85;
  }, []);

  useEffect(() => {
    // Chỉ ghi sau khi đã nạp xong dữ liệu, tránh ghi đè tiến độ bằng state mặc định
    // (đặc biệt quan trọng vì React StrictMode chạy effect 2 lần khi dev).
    if (!hydrated) return;
    saveAppState(state);
  }, [state, hydrated]);

  const unlocked = useMemo(
    () => getUnlocked(state.progress),
    [state.progress]
  );

  const currentQuestion = sessionQuestions[currentIndex];

  const buildLogContext = (overrideSessionId = sessionId) => ({
    sessionId: overrideSessionId,
    playerName: state.profile?.name ?? playerName,
    grade: state.profile?.grade ?? playerGrade,
    mode,
    topic,
    difficulty,
  });

  const currentDifficultyDone = state.progress.completedByDifficulty[difficulty] ?? 0;
  const currentDifficultyTarget =
    difficulty === 'easy'
      ? gameConfig.unlockRequirements.mediumFromEasyChallenges
      : difficulty === 'medium'
      ? gameConfig.unlockRequirements.hardFromMediumChallenges
      : gameConfig.unlockRequirements.hardFromMediumChallenges;
  const currentDifficultyProgressLabel =
    difficulty === 'easy'
      ? currentDifficultyTarget === 0
        ? 'Dễ: độ khó Vừa đã mở sẵn'
        : `Dễ: ${Math.min(currentDifficultyDone, currentDifficultyTarget)}/${currentDifficultyTarget} để mở Vừa`
      : difficulty === 'medium'
      ? `Vừa: ${Math.min(currentDifficultyDone, currentDifficultyTarget)}/${currentDifficultyTarget} để mở Khó`
      : `Khó: ${currentDifficultyDone}/${currentDifficultyTarget} thử thách rèn luyện`;
  const carryRange = gameConfig.carry.rangeByDifficulty[difficulty];
  const carryRangeLabel = carryRange.max < 20 ? `<${carryRange.max + 1}` : `<=${carryRange.max}`;

  useEffect(() => {
    if (page !== 'quiz' || !currentQuestion) return;
    setTimer(currentQuestion.timeLimit);
    setAnswerValue('');
    setAttemptCount(0);
    setShowHint(pendingHint);
    setFeedback('');
    setHasAnswered(false);
    setSelectedSortIndex(null);
    setSortWrongSlots([]);
    setWeekdayAnswer('');
    setSelectedRelativeValue('');
    setRelativeMapping({});
    if (currentQuestion.interactionPayload?.kind === 'sort-numbers') {
      setSortPool(currentQuestion.interactionPayload.initialPool);
      setSortSlots(currentQuestion.interactionPayload.targetSlots);
    } else {
      setSortPool([]);
      setSortSlots([]);
    }
    setOwlMood(pendingHint ? 'thinking' : 'idle');
    setOwlMessage(pendingHint ? currentQuestion.hint : 'Con chọn đáp án đúng nhé.');
  }, [page, currentIndex, currentQuestion, pendingHint]);

  useEffect(() => {
    if (page !== 'quiz' || hasAnswered || !currentQuestion) return;
    if (timer <= 0) {
      handleTimeout();
      return;
    }

    const interval = window.setInterval(() => {
      setTimer((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [page, timer, hasAnswered, currentQuestion]);

  useEffect(() => () => cleanupPendingTimeout(), []);

  const ensureAudioContext = () => {
    if (audioContextRef.current) return audioContextRef.current;
    const AudioCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (typeof AudioCtor !== 'function') return null;
    audioContextRef.current = new AudioCtor();
    return audioContextRef.current;
  };

  const playTone = (
    frequency: number,
    duration = 0.14,
    delay = 0,
    volume = 0.08,
    type: OscillatorType = 'sine'
  ) => {
    if (!(state.profile?.soundEnabled ?? playerSoundEnabled)) return;
    const audioCtx = ensureAudioContext();
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);
    oscillator.start(audioCtx.currentTime + delay);
    oscillator.stop(audioCtx.currentTime + delay + duration);
  };

  const playAudio = (type: 'startup' | 'correct' | 'wrong' | 'timeout' | 'finish') => {
    if (!(state.profile?.soundEnabled ?? playerSoundEnabled)) return;
    if (type === 'startup') {
      playTone(523, 0.12, 0, 0.06, 'triangle');
      playTone(784, 0.16, 0.12, 0.06, 'triangle');
    }
    if (type === 'correct') {
      if (correctAudioRef.current) {
        correctAudioRef.current.currentTime = 0;
        void correctAudioRef.current.play();
        return;
      }
      playTone(523, 0.22, 0, 0.075, 'triangle');
      playTone(659, 0.24, 0.16, 0.075, 'triangle');
      playTone(784, 0.28, 0.34, 0.085, 'triangle');
      playTone(1046, 0.36, 0.58, 0.06, 'sine');
    }
    if (type === 'wrong') {
      if (wrongAudioRef.current) {
        wrongAudioRef.current.currentTime = 0;
        void wrongAudioRef.current.play();
        return;
      }
      playTone(330, 0.28, 0, 0.055, 'sine');
      playTone(247, 0.3, 0.22, 0.052, 'sine');
      playTone(196, 0.34, 0.46, 0.05, 'sine');
    }
    if (type === 'timeout') playTone(180, 0.18, 0, 0.06, 'sawtooth');
    if (type === 'finish') {
      playTone(660, 0.12, 0, 0.07, 'triangle');
      playTone(880, 0.16, 0.12, 0.07, 'triangle');
    }
  };

  const cleanupPendingTimeout = () => {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  };

  const updateProfile = () => {
    if (!playerName.trim()) {
      setErrorMessage('Vui lòng nhập tên để tiếp tục.');
      return;
    }

    setState((current) => ({
      ...current,
      profile: {
        name: playerName.trim(),
        grade: playerGrade,
        soundEnabled: playerSoundEnabled,
        avatar: playerAvatar,
      },
    }));
    setErrorMessage('');
    setPage('home');
    window.setTimeout(() => playAudio('startup'), 80);
  };

  const toggleSound = () => {
    const next = !(state.profile?.soundEnabled ?? playerSoundEnabled);
    setPlayerSoundEnabled(next);
    setState((current) => ({
      ...current,
      profile: current.profile ? { ...current.profile, soundEnabled: next } : current.profile,
    }));
  };

  const chooseTopic = (selected: Topic) => {
    if (!unlocked.topic[selected]) {
      setFeedback(getLockedReason(selected, state.progress));
      return;
    }
    setTopic(selected);
    setFeedback('');
    setPage('selection');
  };

  const selectDifficulty = (selected: Difficulty) => {
    if (!unlocked.difficulty[selected]) {
      setFeedback(getLockedReason(selected, state.progress));
      return;
    }
    setDifficulty(selected);
    setFeedback('');
  };

  const applyScoreDelta = (delta: number) => {
    sessionScoreRef.current = Math.max(0, sessionScoreRef.current + delta);
    setScore(sessionScoreRef.current);
  };

  const persistCurrentSession = (
    status: PlaySessionRecord['status'],
    extras: Partial<PlaySessionRecord> = {}
  ) => {
    const base = sessionRecordRef.current;
    if (!base) return;
    const questions = sessionResultsRef.current;
    const record: PlaySessionRecord = {
      ...base,
      ...extras,
      status,
      updatedAt: new Date().toISOString(),
      questions: [...questions],
      answeredCount: questions.length,
      correctCount: questions.filter((item) => item.isCorrect).length,
    };
    sessionRecordRef.current = record;
    saveSessionRecord(record);
    setSessionCount(getSessionRecords().length);
  };

  const recordQuestionResult = (result: SessionQuestionResult) => {
    const existingIndex = sessionResultsRef.current.findIndex((item) => item.index === result.index);
    if (existingIndex >= 0) sessionResultsRef.current[existingIndex] = result;
    else sessionResultsRef.current.push(result);
    persistCurrentSession('in-progress', { score: sessionScoreRef.current });
  };

  const startSession = () => {
    const chosenTopic = topic === 'tower' ? 'mixed' : topic;
    const nextSessionId = createSessionId();
    const batch = generateQuestionSession(
      state.profile?.grade ?? playerGrade,
      chosenTopic,
      difficulty,
      10,
      answerMode
    );
    const questions = batch.questions;
    const logContext = buildLogContext(nextSessionId);

    batch.diagnostics.forEach((diagnostic) => {
      logTemplateIssue(logContext, {
        eventType: diagnostic.type,
        templateId: diagnostic.templateId,
        sourceSkillId: diagnostic.sourceSkillId,
        errorMessage: diagnostic.errorMessage,
      });
    });
    questions.forEach((question) => logQuestionGenerated(logContext, question));

    sessionResultsRef.current = [];
    sessionScoreRef.current = 0;
    sessionRecordRef.current = {
      sessionId: nextSessionId,
      playerName: state.profile?.name ?? playerName,
      grade: state.profile?.grade ?? playerGrade,
      avatar: state.profile?.avatar ?? playerAvatar,
      mode,
      topic,
      difficulty,
      answerMode,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'in-progress',
      questionCount: questions.length,
      answeredCount: 0,
      correctCount: 0,
      score: 0,
      badges: [],
      questions: [],
    };
    saveSessionRecord(sessionRecordRef.current);
    setSessionCount(getSessionRecords().length);

    setSessionId(nextSessionId);
    setLogCount(getQuestionLogs().length);
    setSessionQuestions(questions);
    setCurrentIndex(0);
    setTimer(questions[0]?.timeLimit ?? 0);
    setScore(0);
    setCorrectCount(0);
    setConsecutiveMisses(0);
    setPendingHint(false);
    setSessionMessage('');
    setSessionReward('');
    setNewBadges([]);
    setFeedback('');
    setOwlMood('idle');
    setOwlMessage('Bắt đầu nào!');
    setPage('quiz');
  };

  const finishSession = () => {
    cleanupPendingTimeout();
    // Lấy từ kết quả đã ghi để tránh closure dùng state correctCount cũ
    // khi timeout chuyển câu được schedule trước lần render cuối.
    const finalCorrectCount = sessionResultsRef.current.filter((item) => item.isCorrect).length;
    let finalScore = sessionScoreRef.current;
    let rewardText = '';
    const completedBefore = state.progress.completedChallenges;
    const earnedBadges = mode === 'challenge' ? getBadges(topic, finalCorrectCount, completedBefore) : [];

    if (mode === 'challenge') {
      if (finalCorrectCount === 10) {
        finalScore += 50;
        rewardText = 'Hoàn thành 10/10: +50 điểm và nhận huy hiệu!';
      } else if (finalCorrectCount >= 8) {
        finalScore += 20;
        rewardText = 'Hoàn thành từ 8 câu đúng: +20 điểm!';
      }
    }

    const isChallenge = mode === 'challenge';
    setState((current) => ({
      ...current,
      progress: {
        ...current.progress,
        completedChallenges: current.progress.completedChallenges + (isChallenge ? 1 : 0),
        playedSessions: (current.progress.playedSessions ?? 0) + 1,
        completedByDifficulty: isChallenge
          ? {
              ...current.progress.completedByDifficulty,
              [difficulty]: current.progress.completedByDifficulty[difficulty] + 1,
            }
          : current.progress.completedByDifficulty,
        completedByTopic: isChallenge
          ? {
              ...current.progress.completedByTopic,
              [topic]: (current.progress.completedByTopic[topic] ?? 0) + 1,
            }
          : current.progress.completedByTopic,
        totalScore: current.progress.totalScore + (isChallenge ? Math.max(0, finalScore) : 0),
        badges: Array.from(new Set([...current.progress.badges, ...earnedBadges])),
        lastPlayedAt: todayIso(),
      },
    }));

    const clampedScore = Math.max(0, finalScore);
    sessionScoreRef.current = clampedScore;
    setScore(clampedScore);
    setSessionReward(rewardText);
    setNewBadges(earnedBadges);
    setSessionMessage(
      rewardText ||
        (mode === 'challenge'
          ? 'Đã hoàn thành thử thách. Mỗi lần chơi đều giúp khu rừng sáng hơn.'
          : 'Kết thúc lượt luyện tập.')
    );
    setOwlMood(finalCorrectCount >= 8 ? 'celebrate' : 'thinking');
    setOwlMessage(finalCorrectCount >= 8 ? 'Con làm tốt lắm!' : 'Mình luyện thêm một lượt nữa nhé.');
    playAudio('finish');

    persistCurrentSession('completed', {
      finishedAt: new Date().toISOString(),
      score: clampedScore,
      badges: earnedBadges,
      reward: rewardText || undefined,
      progressAfter: {
        completedChallenges: state.progress.completedChallenges + (mode === 'challenge' ? 1 : 0),
        playedSessions: (state.progress.playedSessions ?? 0) + 1,
        totalScore: state.progress.totalScore + (mode === 'challenge' ? clampedScore : 0),
      },
    });

    setPage('result');
  };

  const goToNextQuestion = () => {
    cleanupPendingTimeout();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= sessionQuestions.length || sessionQuestions.length === 0) {
      finishSession();
      return;
    }
    setTimer(sessionQuestions[nextIndex]?.timeLimit ?? 0);
    setCurrentIndex(nextIndex);
  };

  const handleMiss = (message: string, finishQuestion: boolean) => {
    setFeedback(message);
    setOwlMood(finishQuestion ? 'thinking' : 'timeout');

    if (!finishQuestion) return 0;

    const nextMisses = consecutiveMisses + 1;
    setConsecutiveMisses(nextMisses);
    if (nextMisses >= 2) setPendingHint(true);
    setOwlMessage('Câu sau cú có gợi ý nhỏ cho con.');

    if (nextMisses >= 3) {
      applyScoreDelta(-5);
      return -5;
    }
    return 0;
  };

  const handleTimeout = () => {
    if (!currentQuestion || hasAnswered) return;
    setHasAnswered(true);
    logQuestionTimeout(buildLogContext(), currentQuestion, currentQuestion.timeLimit);
    setLogCount(getQuestionLogs().length);
    playAudio('timeout');
    const missPenalty = handleMiss('Hết giờ! Câu này được tính sai.', true);
    recordQuestionResult({
      index: currentIndex + 1,
      questionId: currentQuestion.id,
      templateId: currentQuestion.templateId,
      sourceSkillId: currentQuestion.sourceSkillId,
      questionType: currentQuestion.questionType,
      topic,
      difficulty,
      prompt: currentQuestion.text,
      choices: currentQuestion.choices,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: false,
      timedOut: true,
      attemptCount: attemptCount + 1,
      timeSpentSeconds: currentQuestion.timeLimit,
      scoreDelta: missPenalty,
      hintShown: showHint,
      correctInteractionState: getCorrectInteractionState(currentQuestion),
    });
    timeoutIdRef.current = window.setTimeout(goToNextQuestion, 1450);
  };

  const resetInteractiveAttempt = (question: Question) => {
    if (question.interactionPayload?.kind === 'sort-numbers') {
      const wrongSlots = question.interactionPayload.correctOrder
        .map((value, index) => (sortSlots[index] !== value ? index : -1))
        .filter((index) => index >= 0);
      setSortWrongSlots(wrongSlots);
      window.setTimeout(() => {
        setSortPool(question.interactionPayload?.kind === 'sort-numbers' ? question.interactionPayload.initialPool : []);
        setSortSlots(question.interactionPayload?.kind === 'sort-numbers' ? question.interactionPayload.targetSlots : []);
        setSelectedSortIndex(null);
        setSortWrongSlots([]);
      }, 650);
    }

    if (question.interactionPayload?.kind === 'relative-date') {
      setRelativeMapping({});
      setSelectedRelativeValue('');
      dragValueRef.current = '';
    }
  };

  const getCorrectInteractionState = (question: Question) => {
    const payload = question.interactionPayload;
    if (!payload) return undefined;
    if (payload.kind === 'sort-numbers') return payload.correctOrder;
    if (payload.kind === 'relative-date') return payload.correctMapping;
    if (payload.kind === 'missing-equation') return question.correctAnswer;
    if (payload.kind === 'clock-hour') return `${payload.hour} giờ`;
    if (payload.kind === 'weekday-blank') return question.correctAnswer;
    return undefined;
  };

  const normalizeNumericAnswer = (value: string) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? String(numeric) : value.trim();
  };

  const getUserInteractionState = (question: Question, raw: string) => {
    if (question.questionType === 'sort-numbers') return { targetSlots: sortSlots, remainingPool: sortPool };
    if (question.questionType === 'relative-date') return relativeMapping;
    if (question.questionType === 'missing-equation') return normalizeNumericAnswer(raw);
    return raw;
  };

  const isAnswerCorrect = (question: Question, raw: string) => {
    if (question.questionType === 'sort-numbers') {
      const payload = question.interactionPayload as SortNumbersPayload | undefined;
      if (!payload) return false;
      return sortSlots.every((value, index) => value === payload.correctOrder[index]);
    }

    if (question.questionType === 'relative-date') {
      const payload = question.interactionPayload as RelativeDatePayload | undefined;
      if (!payload) return false;
      return ['yesterday', 'today', 'tomorrow'].every(
        (key) => relativeMapping[key] === payload.correctMapping[key as keyof typeof payload.correctMapping]
      );
    }

    if (question.questionType === 'missing-equation' || question.questionType === 'fill-number') {
      return normalizeNumericAnswer(raw) === normalizeNumericAnswer(question.correctAnswer);
    }

    return raw.trim().toLowerCase() === question.correctAnswer.toLowerCase();
  };

  const evaluateAnswer = (raw: string) => {
    if (!currentQuestion || hasAnswered) return;
    const answer = raw.trim();
    const needsRawAnswer = !['sort-numbers', 'relative-date'].includes(currentQuestion.questionType);
    if (needsRawAnswer && !answer) {
      setFeedback('Con hãy nhập đáp án trước nhé.');
      return;
    }

    const isCorrect = isAnswerCorrect(currentQuestion, answer);
    const userInteractionState = getUserInteractionState(currentQuestion, answer);
    const correctInteractionState = getCorrectInteractionState(currentQuestion);
    const submittedAnswer = needsRawAnswer ? answer : JSON.stringify(userInteractionState);

    if (isCorrect) {
      setHasAnswered(true);
      const earned = attemptCount === 0 ? 10 : 5;
      logQuestionAnswered(buildLogContext(), currentQuestion, {
        userAnswer: submittedAnswer,
        isCorrect: true,
        attemptCount: attemptCount + 1,
        timeSpentSeconds: currentQuestion.timeLimit - timer,
        scoreDelta: earned,
        hintShown: showHint,
        userInteractionState,
        correctInteractionState,
      });
      setLogCount(getQuestionLogs().length);
      applyScoreDelta(earned);
      setCorrectCount((value) => value + 1);
      setConsecutiveMisses(0);
      setPendingHint(false);
      setFeedback(attemptCount === 0 ? `Chính xác! +${earned} điểm.` : `Đúng rồi! +${earned} điểm.`);
      setOwlMood('happy');
      setOwlMessage('Giỏi lắm!');
      playAudio('correct');
      recordQuestionResult({
        index: currentIndex + 1,
        questionId: currentQuestion.id,
        templateId: currentQuestion.templateId,
        sourceSkillId: currentQuestion.sourceSkillId,
        questionType: currentQuestion.questionType,
        topic,
        difficulty,
        prompt: currentQuestion.text,
        choices: currentQuestion.choices,
        correctAnswer: currentQuestion.correctAnswer,
        userAnswer: submittedAnswer,
        isCorrect: true,
        timedOut: false,
        attemptCount: attemptCount + 1,
        timeSpentSeconds: currentQuestion.timeLimit - timer,
        scoreDelta: earned,
        hintShown: showHint,
        userInteractionState,
        correctInteractionState,
      });
      timeoutIdRef.current = window.setTimeout(goToNextQuestion, 950);
      return;
    }

    playAudio('wrong');
    logQuestionAnswered(buildLogContext(), currentQuestion, {
      userAnswer: submittedAnswer,
      isCorrect: false,
      attemptCount: attemptCount + 1,
      timeSpentSeconds: currentQuestion.timeLimit - timer,
      scoreDelta: attemptCount === 0 && currentQuestion.questionType !== 'multiple-choice' ? 0 : consecutiveMisses >= 2 ? -5 : 0,
      hintShown: showHint,
      userInteractionState,
      correctInteractionState,
    });
    setLogCount(getQuestionLogs().length);
    if (attemptCount === 0 && currentQuestion.questionType !== 'multiple-choice') {
      resetInteractiveAttempt(currentQuestion);
      setAttemptCount(1);
      setShowHint(consecutiveMisses >= 1);
      setFeedback('Chưa đúng, con thử lại một lần nữa nhé.');
      setOwlMood('thinking');
      setOwlMessage(consecutiveMisses >= 1 ? currentQuestion.hint : 'Nhìn kỹ từng hàng số nhé.');
      return;
    }

    setHasAnswered(true);
    const missPenalty = handleMiss('Chưa đúng. Mình chuyển sang câu tiếp theo nhé.', true);
    recordQuestionResult({
      index: currentIndex + 1,
      questionId: currentQuestion.id,
      templateId: currentQuestion.templateId,
      sourceSkillId: currentQuestion.sourceSkillId,
      questionType: currentQuestion.questionType,
      topic,
      difficulty,
      prompt: currentQuestion.text,
      choices: currentQuestion.choices,
      correctAnswer: currentQuestion.correctAnswer,
      userAnswer: submittedAnswer,
      isCorrect: false,
      timedOut: false,
      attemptCount: attemptCount + 1,
      timeSpentSeconds: currentQuestion.timeLimit - timer,
      scoreDelta: missPenalty,
      hintShown: showHint,
      userInteractionState,
      correctInteractionState,
    });
    timeoutIdRef.current = window.setTimeout(goToNextQuestion, 1450);
  };

  const renderTopBar = () => {
    const playedSessions = state.progress.playedSessions ?? 0;
    const completedChallenges = state.progress.completedChallenges;
    return (
      <div className="top-bar">
        <button className="icon-button" type="button" onClick={() => setPage('home')} title="Trang chủ">
          ⌂
        </button>
        <div>
          <strong>{state.profile?.name ?? (playerName || 'Bạn nhỏ')}</strong>
          <span>Lớp {state.profile?.grade ?? playerGrade}</span>
        </div>
        <div className="top-score">
          <strong>⭐ {state.progress.totalScore}</strong>
          <span>Tổng điểm</span>
        </div>
        <div className="top-challenge" title="Số thử thách và số lượt đã chơi">
          <strong>🏆 {completedChallenges} thử thách</strong>
          <span>🎮 {playedSessions} lượt đã chơi</span>
        </div>
        <button className="icon-button" type="button" onClick={toggleSound} title="Âm thanh">
          {state.profile?.soundEnabled ?? playerSoundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
    );
  };

  const renderSetup = () => (
    <main className="hero-card">
      <section>
        <p className="eyebrow">Khu Rừng Toán Học</p>
        <h1>Cú Mèo Toán Học</h1>
        <p className="subtitle">
          {playerGrade === 2
            ? 'Luyện cộng, trừ có nhớ và tư duy toán học qua các thử thách ngắn.'
            : 'Luyện cộng, trừ và so sánh số qua các thử thách ngắn.'}
        </p>
        <OwlMascot mood="idle" message="Xin chào, con nhập tên để bắt đầu nhé!" />
      </section>

      <section className="panel">
        <label>
          Tên học sinh
          <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Ví dụ: Minh Anh" />
        </label>

        <div>
          <div className="section-title">Con học lớp nào?</div>
          <div className="segmented">
            {[1, 2].map((grade) => (
              <button
                key={grade}
                type="button"
                className={playerGrade === grade ? 'active' : ''}
                onClick={() => setPlayerGrade(grade as Grade)}
              >
                Lớp {grade}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title">Chọn cú mèo</div>
          <div className="option-grid">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                className={`option-card compact ${playerAvatar === avatar.id ? 'selected' : ''}`}
                onClick={() => setPlayerAvatar(avatar.id)}
              >
                <span>{avatar.mark}</span>
                {avatar.label}
              </button>
            ))}
          </div>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={playerSoundEnabled}
            onChange={() => setPlayerSoundEnabled((value) => !value)}
          />
          Bật âm thanh
        </label>
        {errorMessage && <p className="feedback danger">{errorMessage}</p>}
        <button className="primary-button" type="button" onClick={updateProfile}>
          Bắt đầu
        </button>
      </section>
    </main>
  );

  const renderHome = () => (
    <main className="screen">
      {renderTopBar()}
      <section className="home-layout">
        <div>
          <p className="eyebrow">Nhà Cú Mèo</p>
          <h1>Cú Mèo Toán Học</h1>
          <p className="subtitle">{getProgressMessage(state.progress)}</p>
          <div className="cta-row">
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setMode('practice');
                setPage('map');
              }}
            >
              Luyện tập
            </button>
            <button
              className="primary-button coral"
              type="button"
              onClick={() => {
                setMode('challenge');
                setPage('map');
              }}
            >
              Thử thách
            </button>
            <button className="secondary-button" type="button" onClick={exportQuestionLogs}>
              Xuất log ({logCount})
            </button>
            <button className="secondary-button" type="button" onClick={exportSessionRecordsAsJson}>
              Lưu lịch sử chơi ({sessionCount})
            </button>
          </div>
        </div>
        <OwlMascot mood="happy" message="Hôm nay mình cùng thắp sáng khu rừng nhé!" />
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <strong>{state.progress.completedChallenges}</strong>
          <span>Thử thách hoàn thành</span>
        </div>
        <div className="stat-card">
          <strong>{state.progress.playedSessions ?? 0}</strong>
          <span>Lượt đã chơi</span>
        </div>
        <div className="stat-card">
          <strong>{state.progress.completedByDifficulty.easy}</strong>
          <span>Dễ đã xong</span>
        </div>
        <div className="stat-card">
          <strong>{state.progress.completedByDifficulty.medium}</strong>
          <span>Vừa đã xong</span>
        </div>
        <div className="stat-card">
          <strong>{state.progress.totalScore}</strong>
          <span>Tổng điểm</span>
        </div>
        <div className="stat-card">
          <strong>{state.progress.badges.length}</strong>
          <span>Huy hiệu</span>
        </div>
        <div className="stat-card">
          <strong>{logCount}</strong>
          <span>Log câu hỏi</span>
        </div>
        <div className="stat-card">
          <strong>{sessionCount}</strong>
          <span>Lượt chơi đã lưu</span>
        </div>
      </section>

      <p className="storage-note">
        Dữ liệu chơi được lưu tự động vào trình duyệt (localStorage) và file{' '}
        <code>data/play-sessions.json</code> khi chạy <code>npm run dev</code>.
      </p>
    </main>
  );

  const renderMap = () => {
    const grade = state.profile?.grade ?? playerGrade;
    const nodes: Topic[] = [
      'addition',
      'subtraction',
      ...(isGradeEnabled(gameConfig.carry.enabledForGrades, grade) ? (['carry'] as Topic[]) : []),
      ...(isGradeEnabled(gameConfig.comparison.enabledForGrades, grade)
        ? (['comparison'] as Topic[])
        : []),
      'mixed',
      'tower',
    ];
    return (
      <main className="screen">
        {renderTopBar()}
        <section className="panel">
          <div className="screen-heading">
            <div>
              <p className="eyebrow">{mode === 'challenge' ? 'Thử thách' : 'Luyện tập'}</p>
              <h2>Khu Rừng Toán Học</h2>
            </div>
            <button className="secondary-button" type="button" onClick={() => setPage('home')}>
              Quay lại
            </button>
          </div>
          <div className="map">
            {nodes.map((node) => {
              const locked = !unlocked.topic[node];
              return (
                <button
                  key={node}
                  type="button"
                  className={`map-node ${node} ${locked ? 'locked' : ''}`}
                  onClick={() => chooseTopic(node)}
                >
                  <span>{locked ? '🔒' : '✦'}</span>
                  <strong>{topicName[node]}</strong>
                  <small>{locked ? getLockedReason(node, state.progress) : topicDescription[node]}</small>
                </button>
              );
            })}
          </div>
          {feedback && <p className="feedback">{feedback}</p>}
        </section>
      </main>
    );
  };

  const renderSelection = () => (
    <main className="screen">
      {renderTopBar()}
      <section className="panel">
        <div className="screen-heading">
          <div>
            <p className="eyebrow">{topicDescription[topic]}</p>
            <h2>Chuẩn bị chơi</h2>
          </div>
          <button className="secondary-button" type="button" onClick={() => setPage('map')}>
            Đổi chủ đề
          </button>
        </div>

        <div className="section-title">Chọn độ khó</div>
        <div className="option-grid three">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
            <button
              key={level}
              type="button"
              className={`option-card ${difficulty === level ? 'selected' : ''} ${
                !unlocked.difficulty[level] ? 'locked' : ''
              }`}
              onClick={() => selectDifficulty(level)}
            >
              <strong>{difficultyName[level]}</strong>
              <span>{unlocked.difficulty[level] ? `${level === 'easy' ? 30 : level === 'medium' ? 25 : 20}s/câu` : getLockedReason(level, state.progress)}</span>
            </button>
          ))}
        </div>

        {topic === 'carry' && (
          <p className="storage-note">
            Phạm vi hiện tại: Cộng trừ có nhớ {carryRangeLabel} ({carryRange.min}–{carryRange.max}).
          </p>
        )}

        <div className="section-title">Kiểu trả lời</div>
        <div className="segmented wrap">
          {[
            ['auto', 'Tự động'],
            ['choice', 'Chọn đáp án'],
            ['input', 'Nhập số/dấu'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={answerMode === value ? 'active' : ''}
              onClick={() => setAnswerMode(value as AnswerMode)}
            >
              {label}
            </button>
          ))}
        </div>

        {feedback && <p className="feedback">{feedback}</p>}
        <button className="primary-button wide" type="button" onClick={startSession}>
          Bắt đầu {mode === 'challenge' ? 'thử thách' : 'luyện tập'}
        </button>
      </section>
    </main>
  );

  const placeSortTile = (source: SortDragSource, slotIndex: number) => {
    const nextPool = [...sortPool];
    const nextSlots = [...sortSlots];
    const value = source.source === 'pool' ? nextPool[source.index] : nextSlots[source.index];
    if (!value) return;

    if (source.source === 'pool') nextPool.splice(source.index, 1);
    else nextSlots[source.index] = null;

    const replacedValue = nextSlots[slotIndex];
    if (replacedValue) {
      if (source.source === 'slot') nextSlots[source.index] = replacedValue;
      else nextPool.push(replacedValue);
    }

    nextSlots[slotIndex] = value;
    setSortPool(nextPool);
    setSortSlots(nextSlots);
    setSelectedSortIndex(null);
  };

  const clearSortSlot = (slotIndex: number) => {
    const value = sortSlots[slotIndex];
    if (!value) return;
    const nextSlots = [...sortSlots];
    nextSlots[slotIndex] = null;
    setSortSlots(nextSlots);
    setSortPool((current) => [...current, value]);
  };

  const handleSortSlotClick = (slotIndex: number) => {
    if (selectedSortIndex !== null) {
      placeSortTile({ source: 'pool', index: selectedSortIndex }, slotIndex);
      return;
    }
    clearSortSlot(slotIndex);
  };

  const submitSortAnswer = () => {
    if (sortSlots.some((value) => !value)) {
      setFeedback('Con hãy kéo đủ các số vào ô trống trước nhé.');
      return;
    }
    evaluateAnswer(JSON.stringify(sortSlots));
  };

  const renderSortNumbersQuestion = () => (
    <div className="interactive-block sort-workspace">
      <div className="sort-slots" aria-label="O trong sap xep">
        {sortSlots.map((value, index) => (
          <button
            key={`slot-${index}`}
            type="button"
            draggable={Boolean(value)}
            className={`sort-slot ${value ? 'filled' : ''} ${sortWrongSlots.includes(index) ? 'wrong' : ''}`}
            onClick={() => handleSortSlotClick(index)}
            onDragStart={() => {
              if (value) dragSortRef.current = { source: 'slot', index };
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragSortRef.current) {
                placeSortTile(dragSortRef.current, index);
                dragSortRef.current = null;
              }
            }}
          >
            {value || '?'}
          </button>
        ))}
      </div>
      <div className="sort-pool" aria-label="Cac so de chon">
        {sortPool.map((value, index) => (
          <button
            key={`${value}-${index}`}
            type="button"
            draggable
            className={`number-tile ${selectedSortIndex === index ? 'selected' : ''}`}
            onClick={() => setSelectedSortIndex((current) => (current === index ? null : index))}
            onDragStart={() => {
              dragSortRef.current = { source: 'pool', index };
            }}
          >
            {value}
          </button>
        ))}
      </div>
      <button className="primary-button wide" type="button" onClick={submitSortAnswer}>
        Trả lời
      </button>
    </div>
  );
  const renderMissingEquationQuestion = () => {
    const payload = currentQuestion?.interactionPayload;
    if (!payload || payload.kind !== 'missing-equation') return null;
    const blankBox = <span className="equation-blank-choice">?</span>;

    return (
      <div className="interactive-block">
        <div className="equation-row">
          {payload.blankPosition === 'left' ? blankBox : <span>{payload.left}</span>}
          <span>{payload.operator}</span>
          {payload.blankPosition === 'right' ? blankBox : <span>{payload.right}</span>}
          <span>=</span>
          <span>{payload.result}</span>
        </div>
        <div className="choice-grid">
          {currentQuestion.choices?.map((choice) => (
            <button key={choice} className="answer-button compact-answer" type="button" onClick={() => evaluateAnswer(choice)}>
              {choice}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderClockQuestion = () => {
    const payload = currentQuestion?.interactionPayload;
    if (!payload || payload.kind !== 'clock-hour') return null;
    const hourAngle = ((payload.hour % 12) * 30 - 90) * (Math.PI / 180);
    const hourX = 50 + Math.cos(hourAngle) * 25;
    const hourY = 50 + Math.sin(hourAngle) * 25;

    return (
      <div className="interactive-block">
        <svg className="clock-face" viewBox="0 0 100 100" role="img" aria-label={`Đồng hồ chỉ ${payload.hour} giờ`}>
          <circle cx="50" cy="50" r="45" />
          {Array.from({ length: 12 }, (_, index) => {
            const value = index + 1;
            const angle = (value * 30 - 90) * (Math.PI / 180);
            return (
              <text key={value} x={50 + Math.cos(angle) * 34} y={50 + Math.sin(angle) * 34 + 3}>
                {value}
              </text>
            );
          })}
          <line className="minute-hand" x1="50" y1="50" x2="50" y2="14" />
          <line className="hour-hand" x1="50" y1="50" x2={hourX} y2={hourY} />
          <circle className="clock-center" cx="50" cy="50" r="3.5" />
        </svg>
        <div className="choice-grid">
          {currentQuestion?.choices?.map((choice) => (
            <button key={choice} className="answer-button compact-answer" type="button" onClick={() => evaluateAnswer(choice)}>
              {choice}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekdayBlankQuestion = () => {
    const payload = currentQuestion?.interactionPayload;
    if (!payload || payload.kind !== 'weekday-blank') return null;

    return (
      <div className="interactive-block">
        <div className="weekday-sequence">
          {payload.displaySequence.map((day, index) => (
            <span key={`${day}-${index}`} className={index === payload.blankIndex ? 'blank-day' : ''}>
              {index === payload.blankIndex ? weekdayAnswer || '...' : day}
            </span>
          ))}
        </div>
        <div className="choice-grid">
          {currentQuestion?.choices?.map((choice) => (
            <button
              key={choice}
              className="answer-button compact-answer"
              type="button"
              onClick={() => {
                if (choice === currentQuestion.correctAnswer) setWeekdayAnswer(choice);
                evaluateAnswer(choice);
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const assignRelativeValue = (slot: 'yesterday' | 'today' | 'tomorrow', value: string) => {
    if (!value) return;
    setRelativeMapping((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([, item]) => item !== value));
      return { ...next, [slot]: value };
    });
    setSelectedRelativeValue('');
  };

  const renderRelativeDateQuestion = () => {
    const payload = currentQuestion?.interactionPayload;
    if (!payload || payload.kind !== 'relative-date') return null;
    const labels: Array<['yesterday' | 'today' | 'tomorrow', string]> = [
      ['yesterday', 'Hôm qua'],
      ['today', 'Hôm nay'],
      ['tomorrow', 'Ngày mai'],
    ];
    const usedValues = new Set(Object.values(relativeMapping));
    const availableValues = payload.shuffledValues.filter((value) => !usedValues.has(value));
    const canSubmit = labels.every(([slot]) => relativeMapping[slot]);

    return (
      <div className="interactive-block">
        <div className="relative-targets">
          {labels.map(([slot, label]) => (
            <button
              key={slot}
              type="button"
              className={`relative-slot ${relativeMapping[slot] ? 'filled' : ''}`}
              onClick={() => assignRelativeValue(slot, selectedRelativeValue)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => assignRelativeValue(slot, dragValueRef.current)}
            >
              <span>{label}</span>
              <strong>{relativeMapping[slot] || ''}</strong>
            </button>
          ))}
        </div>
        <div className="relative-cards">
          {availableValues.map((value) => (
            <button
              key={value}
              type="button"
              draggable
              className={`date-card ${selectedRelativeValue === value ? 'selected' : ''}`}
              onClick={() => setSelectedRelativeValue(value)}
              onDragStart={() => {
                dragValueRef.current = value;
              }}
            >
              {value}
            </button>
          ))}
        </div>
        <button
          className="primary-button wide"
          type="button"
          onClick={() => {
            if (!canSubmit) {
              setFeedback('Con hãy đặt đủ 3 thẻ vào Hôm qua, Hôm nay và Ngày mai nhé.');
              return;
            }
            evaluateAnswer(JSON.stringify(relativeMapping));
          }}
        >
          Trả lời
        </button>
      </div>
    );
  };

  const renderAnswerInput = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.questionType === 'sort-numbers') return renderSortNumbersQuestion();
    if (currentQuestion.questionType === 'missing-equation') return renderMissingEquationQuestion();
    if (currentQuestion.questionType === 'clock-hour') return renderClockQuestion();
    if (currentQuestion.questionType === 'weekday-blank') return renderWeekdayBlankQuestion();
    if (currentQuestion.questionType === 'relative-date') return renderRelativeDateQuestion();

    if (currentQuestion.questionType === 'multiple-choice') {
      return (
        <div className="choice-grid">
          {currentQuestion.choices?.map((choice) => (
            <button key={choice} className="answer-button" type="button" onClick={() => evaluateAnswer(choice)}>
              {choice}
            </button>
          ))}
        </div>
      );
    }

    if (currentQuestion.questionType === 'compare') {
      return (
        <div className="choice-grid signs">
          {['>', '<', '='].map((sign) => (
            <button key={sign} className="answer-button sign" type="button" onClick={() => evaluateAnswer(sign)}>
              {sign}
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="answer-input">
        <input
          type="number"
          inputMode="numeric"
          value={answerValue}
          onChange={(event) => setAnswerValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') evaluateAnswer(answerValue);
          }}
          placeholder="Nhập đáp án"
        />
        <button className="primary-button" type="button" onClick={() => evaluateAnswer(answerValue)}>
          Trả lời
        </button>
      </div>
    );
  };

  const renderQuiz = () => {
    if (!currentQuestion) {
      return (
        <main className="screen">
          <section className="panel">
            <p>Không có câu hỏi phù hợp. Hãy chọn lại chủ đề hoặc độ khó.</p>
            <button className="primary-button" type="button" onClick={() => setPage('selection')}>
              Quay lại
            </button>
          </section>
        </main>
      );
    }

    const progress = ((currentIndex + 1) / sessionQuestions.length) * 100;
    const timeProgress = (timer / currentQuestion.timeLimit) * 100;
    const questionPrompt =
      currentQuestion.questionType === 'missing-equation'
        ? 'Chọn số đúng cho ô trống'
        : currentQuestion.text;
    const questionLengthClass =
      questionPrompt.length > 90 ? 'long-question' : questionPrompt.length > 48 ? 'medium-question' : '';

    return (
      <main className="screen">
        {renderTopBar()}
        <section className="quiz-layout">
          <div className="quiz-panel">
            <div className="quiz-meta">
              <span>Câu {currentIndex + 1}/10</span>
              <span>⭐ {score}</span>
              <span className={timer <= 5 ? 'danger-text' : ''}>{timer}s</span>
            </div>
            <div className="challenge-progress">
              <strong>Tiến độ mở khóa</strong>
              <span>{currentDifficultyProgressLabel}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="timer-track">
              <div className={timer <= 5 ? 'timer-fill danger-fill' : 'timer-fill'} style={{ width: `${timeProgress}%` }} />
            </div>
            <div className={`question-box ${questionLengthClass}`}>{questionPrompt}</div>
            {renderAnswerInput()}
            {showHint && <p className="feedback">Gợi ý: {currentQuestion.hint}</p>}
            {feedback && <p className="feedback">{feedback}</p>}
          </div>
          <OwlMascot mood={owlMood} message={owlMessage} />
        </section>
      </main>
    );
  };

  const renderResult = () => {
    const unlockedNow = getProgressMessage(state.progress);

    return (
      <main className="screen">
        {renderTopBar()}
        <section className="result-layout">
          <OwlMascot mood={owlMood} message={owlMessage} />
          <div className="panel">
            <p className="eyebrow">Kết quả</p>
            <h2>Hoàn thành lượt chơi!</h2>
            <div className="result-grid">
              <div>
                <strong>{correctCount}/10</strong>
                <span>Câu đúng</span>
              </div>
              <div>
                <strong>{score}</strong>
                <span>Điểm lượt này</span>
              </div>
              <div>
                <strong>{state.progress.completedChallenges}</strong>
                <span>Thử thách đã hoàn thành</span>
              </div>
            </div>
            <p className="feedback">{sessionMessage}</p>
            {sessionReward && <p className="feedback success">{sessionReward}</p>}
            {newBadges.length > 0 && (
              <div className="badge-row">
                {newBadges.map((badge) => (
                  <span key={badge} className="badge">
                    {badgeLabels[badge]}
                  </span>
                ))}
              </div>
            )}
            <p className="subtitle">{unlockedNow}</p>
            <div className="cta-row">
              <button className="primary-button" type="button" onClick={() => setPage('selection')}>
                Chơi lại
              </button>
              <button className="secondary-button" type="button" onClick={() => setPage('map')}>
                Về khu rừng
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  };

  return (
    <div className="app-shell">
      {page === 'setup' && renderSetup()}
      {page === 'home' && renderHome()}
      {page === 'map' && renderMap()}
      {page === 'selection' && renderSelection()}
      {page === 'quiz' && renderQuiz()}
      {page === 'result' && renderResult()}
    </div>
  );
}

export default App;

