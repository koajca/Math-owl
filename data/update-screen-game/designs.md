# Thiết kế kỹ thuật — Cập nhật Giao diện & Tính năng Game Cú Mèo Toán Học

- **Trạng thái:** Đã triển khai — 02/11/2026
- **Ngày tạo:** 30/10/2026
- **Nguồn yêu cầu:** [`requirements.md`](./requirements.md) (đã chốt Q1–Q18)
- **Phạm vi:** Mầm non (grade 0), Lớp 1, Lớp 2
- **Tài liệu liên quan:** `specs/design.md`, `specs/design-update-responsive.md`, `specs/system-design.md`

---

## Mục lục

1. [Mục tiêu & phạm vi](#1-mục-tiêu--phạm-vi)
2. [Quyết định thiết kế bổ sung](#2-quyết-định-thiết-kế-bổ-sung)
3. [Kiến trúc tổng thể](#3-kiến-trúc-tổng-thể)
4. [Data model & config](#4-data-model--config)
5. [Thiết kế Engine](#5-thiết-kế-engine)
6. [Thiết kế Template JSON](#6-thiết-kế-template-json)
7. [Thiết kế UI/UX](#7-thiết-kế-uiux)
8. [Thay đổi trong App.tsx](#8-thay-đổi-trong-apptsx)
9. [CSS & theme](#9-css--theme)
10. [Storage, migration & logging](#10-storage-migration--logging)
11. [Testing](#11-testing)
12. [Rủi ro & edge cases](#12-rủi-ro--edge-cases)
13. [Thứ tự triển khai](#13-thứ-tự-triển-khai)
14. [Ngoài phạm vi / backlog](#14-ngoài-phạm-vi--backlog)

---

## 1. Mục tiêu & phạm vi

### 1.1 Mục tiêu

1. Thêm cấp **Mầm non (0)** với nội dung, UI và thời gian phù hợp trẻ 5–6 tuổi.
2. Gộp 2 node `addition`/`subtraction` thành `add-sub` nhưng vẫn giữ khả năng sinh câu cộng/trừ riêng trong engine.
3. Thêm chủ đề `find-number` (4 dạng) cho Lớp 1–2, có ràng buộc nhớ/mượn theo lớp.
4. Thiết kế lại `comparison` cho 3 cấp: `A __ B` (Mầm non) và biểu thức vs số (Lớp 1–2).
5. Xen bài cấp dưới (≤33%) ở chế độ Luyện tập.
6. Giảm số câu/lượt theo cấp: **5 / 8 / 10**.
7. Dọn màn Home (bỏ 2 nút export + storage note) và phân biệt theme Luyện tập / Thử thách.
8. Giữ nguyên logic `mixed` và `tower`.

### 1.2 Không làm trong iteration này

- Progressive difficulty trong 1 lượt.
- Minh họa emoji trong đề bài, TTS, streak bonus, pie chart kết quả.
- Di chuyển `data/play-sessions.json`.
- Thay đổi schema `TemplateTopic`.

---

## 2. Quyết định thiết kế bổ sung

Các điểm requirements chưa mô tả đủ; đây là quyết định của bản thiết kế này.

| # | Quyết định | Lý do |
|---|---|---|
| **D1** | **Grade policy tập trung ở engine**, không nhân bản constraint trong từng template | Tránh 4 template find-number × 3 lớp × 3 độ khó; dễ test một chỗ |
| **D2** | `find-number` dùng **4 template JSON** + fallback generator hiện có | Giữ kiến trúc template-driven, dễ chỉnh hint/lời giải; fallback chống rỗng |
| **D3** | `comparison` dùng biến `op` (`+`/`-`) trong template thay vì 4 template riêng | Giảm số template, cùng một rule xử lý được cả cộng/trừ |
| **D4** | Các tỉ lệ (50% cộng/trừ, 50% carry, 30/35/35 so sánh) dùng **quota plan** theo lượt, không random thuần | AC yêu cầu tỉ lệ đo được; random thuần có thể lệch |
| **D5** | `comparison` **chỉ** sinh câu so sánh; câu thời gian/lịch/sắp xếp chỉ còn trong `mixed`/`tower` (Lớp 1–2) | Tránh "So sánh" ra câu hỏi giờ/thứ; Mầm non không gặp nội dung ngoài chương trình |
| **D6** | Mầm non dùng **cache cặp số hợp lệ** + sample không lặp | Không gian câu Dễ rất nhỏ (a,b ≤ 5), tránh vòng retry vô ích |
| **D7** | Theme + font Mầm non qua `data-mode` / `data-grade` trên `.app-shell` | Không phải truyền prop xuyên cây; CSS gọn, dễ responsive |
| **D8** | Migration chỉ chạy ở `loadAppState()`; log/lịch sử cũ **không ghi lại** | Giữ dữ liệu lịch sử nguyên bản, tránh rủi ro mất dữ liệu |
| **D9** | Thêm Vitest + hook `setRandomSource()` cho test | AC cần kiểm tra phân phối; hook rẻ hơn refactor toàn bộ RNG |
| **D10** | Log thêm `questionGrade` (lớp sinh câu) bên cạnh `grade` (lớp phiên chơi) | Câu xen từ cấp dưới cần truy vết đúng |

> Các quyết định D2, D3, D5 nên được xác nhận lại khi review design, vì requirements chỉ nêu ý tưởng chứ không chốt cách implement.

---

## 3. Kiến trúc tổng thể

### 3.1 Luồng dữ liệu

```
UI (App.tsx)
  │  grade, topic, difficulty, mode, answerMode
  ▼
questions.ts  ── generateQuestionSession()
  │   ├─ tách số câu cấp hiện tại / cấp dưới (chỉ Practice)
  │   ├─ generateQuestionBatch(grade, topic, difficulty, count, answerMode, plan)
  │   └─ fallbackQuestion() nếu thiếu câu
  ▼
questionTemplateEngine.ts
  │   ├─ lọc template (grade, difficulty, topic mapping)
  │   ├─ build variables → clamp theo config
  │   ├─ template constraints
  │   ├─ grade policy (no carry / carry / phạm vi)
  │   ├─ evaluateAnswer()
  │   └─ createChoices()
  ▼
Question[] ──► App state ──► Quiz UI
  │
  ├─ appLogger (question_generated / answered / timeout)
  └─ sessionHistory (PlaySessionRecord)
```

### 3.2 Trách nhiệm từng file

| File | Trách nhiệm sau thay đổi |
|---|---|
| `src/types.ts` | `Grade = 0\|1\|2`; `Topic` mới; `LegacyTopic`; field log `questionGrade` |
| `src/game/gameConfig.ts` | `questionsPerSession`, `gradeRanges`, `gradeConstraints`, `timeLimits`, `comparisonMix`, `lowerGradeMix`; accessor functions |
| `src/game/questionTemplateEngine.ts` | Mapping topic, grade policy, quota plan, answer rule mới, constraint mới, cache cặp số |
| `src/data/questionTemplates.json` | +4 template find-number, +2 template comparison biểu thức, mở grade 0 cho comparison-two-numbers, +template Mầm non |
| `src/data/questions.ts` | Orchestrate session, xen cấp dưới, fallback Mầm non/add-sub |
| `src/App.tsx` | Setup, map, selection, quiz, result, badge, count, theme attributes |
| `src/styles.css` | Node mới, theme, grade-0 typography |
| `src/utils/storage.ts` | Validate grade, migrate `completedByTopic` |
| `src/utils/appLogger.ts` | Ghi `questionGrade` |
| `src/utils/sessionHistory.ts` | Không đổi logic; chỉ chấp nhận record cũ |
| `vite.config.ts` | **Không đổi** |
| `package.json` | +`vitest`, script `test` |

---

## 4. Data model & config

### 4.1 Types

```ts
// src/types.ts
export type Grade = 0 | 1 | 2;

export type Topic =
  | 'add-sub'
  | 'find-number'
  | 'carry'
  | 'comparison'
  | 'mixed'
  | 'tower';

/** Chỉ dùng khi đọc dữ liệu cũ. */
export type LegacyTopic = 'addition' | 'subtraction';
export type HistoricalTopic = Topic | LegacyTopic;

export type RangeTopic = 'add-sub' | 'find-number' | 'comparison';
```

`TemplateTopic` **giữ nguyên**:

```ts
export type TemplateTopic =
  | 'addition'
  | 'subtraction'
  | 'carry'
  | 'comparison'
  | 'missing-number'
  | 'mixed';
```

`Question.topic` và `SessionQuestionResult.topic` tiếp tục là `Topic` (câu mới luôn dùng topic mới).
`PlaySessionRecord.topic` và `QuestionPlayLog.topic` khai báo `HistoricalTopic` để đọc được dữ liệu cũ; UI hiển thị qua helper có fallback.

`ProgressState.completedByTopic`:

```ts
completedByTopic: Partial<Record<HistoricalTopic, number>>;
```

### 4.2 Config

```ts
// src/game/gameConfig.ts
import type { Difficulty, Grade, Mode, RangeTopic, Topic } from '../types';

export interface RangeSpec {
  min: number;
  max: number;
  /** Chỉ dùng cho Mầm non: kết quả tối đa. */
  resultMax?: number;
}

export interface GradeConstraint {
  noCarry?: boolean;
  noBorrow?: boolean;
  resultMax?: number;
  addSubCarryRatio?: number;
  requireCarry?: boolean;
  requireBorrow?: boolean;
}

export const gameConfig = {
  attempts: {
    practice: { maxAttempts: 2, hintOnFirstWrong: true },
    challenge: { maxAttempts: 1, hintOnFirstWrong: false },
  },

  // Ghi đè attempts cho từng lớp (Q10)
  attemptsByGrade: {
    0: { practice: { maxAttempts: 3, hintOnFirstWrong: true } },
  } satisfies Partial<Record<Grade, Partial<Record<Mode, { maxAttempts: number; hintOnFirstWrong: boolean }>>>>,

  questionsPerSession: { 0: 5, 1: 8, 2: 10 } satisfies Record<Grade, number>,

  gradeRanges: {
    0: {
      'add-sub': {
        easy: { min: 1, max: 5, resultMax: 10 },
        medium: { min: 1, max: 8, resultMax: 10 },
        hard: { min: 1, max: 10, resultMax: 10 },
      },
      comparison: {
        easy: { min: 0, max: 10 },
        medium: { min: 0, max: 10 },
        hard: { min: 0, max: 10 },
      },
    },
    1: {
      'add-sub': {
        easy: { min: 1, max: 10 },
        medium: { min: 1, max: 50 },
        hard: { min: 1, max: 100 },
      },
      'find-number': {
        easy: { min: 1, max: 9 },
        medium: { min: 1, max: 19 },
        hard: { min: 1, max: 99 },
      },
      comparison: {
        easy: { min: 0, max: 10 },
        medium: { min: 0, max: 50 },
        hard: { min: 0, max: 100 },
      },
    },
    2: {
      'add-sub': {
        easy: { min: 1, max: 50 },
        medium: { min: 1, max: 80 },
        hard: { min: 1, max: 100 },
      },
      'find-number': {
        easy: { min: 1, max: 19 },
        medium: { min: 1, max: 49 },
        hard: { min: 1, max: 99 },
      },
      comparison: {
        easy: { min: 1, max: 20 },
        medium: { min: 1, max: 50 },
        hard: { min: 1, max: 100 },
      },
    },
  } satisfies Record<Grade, Partial<Record<RangeTopic, Record<Difficulty, RangeSpec>>>>,

  gradeConstraints: {
    0: { noCarry: true, noBorrow: true, resultMax: 10 },
    1: { noCarry: true, noBorrow: true },
    2: { addSubCarryRatio: 0.5, requireCarry: true, requireBorrow: true },
  } satisfies Record<Grade, GradeConstraint>,

  timeLimits: {
    0: { easy: 45, medium: 35, hard: 30 },
    1: { easy: 30, medium: 25, hard: 20 },
    2: { easy: 30, medium: 25, hard: 20 },
  } satisfies Record<Grade, Record<Difficulty, number>>,

  addSub: { mix: { addition: 0.5, subtraction: 0.5 } },

  comparisonMix: {
    0: { twoNumbers: 1, exprLeft: 0, exprRight: 0 },
    1: { twoNumbers: 0.3, exprLeft: 0.35, exprRight: 0.35 },
    2: { twoNumbers: 0.2, exprLeft: 0.4, exprRight: 0.4 },
  } satisfies Record<Grade, Record<'twoNumbers' | 'exprLeft' | 'exprRight', number>>,

  lowerGradeMix: {
    ratio: 0.33,
    practiceOnly: true,
    excludedTopics: ['find-number', 'carry'] as Topic[],
  },

  // giữ nguyên các block cũ, chỉ sửa:
  // comparison.enabledForGrades = [0, 1, 2]  (Q9)
  // carry.enabledForGrades = [2]             (không đổi)
  unlockRequirements: { /* ... */ },
  comparisonSigns: { /* ... */ },
  carry: { /* ... */ },
} as const;
```

### 4.3 Accessor functions

```ts
export function getSessionQuestionCount(grade: Grade): number;

export function getTopicRange(
  grade: Grade,
  topic: Topic,
  difficulty: Difficulty
): RangeSpec;

export function getTimeLimit(grade: Grade, difficulty: Difficulty): number;

export function getAttemptConfig(mode: Mode, grade?: Grade): AttemptConfig;
```

Quy tắc:

- `topic === 'carry'` → dùng `gameConfig.carry.rangeByDifficulty`.
- `topic === 'mixed' | 'tower'` → dùng range của `'add-sub'` khi cần clamp chung.
- `getTimeLimit` **luôn** lấy từ `timeLimits`, trừ câu tương tác nhiều bước (xem 5.8).
- `getAttemptConfig`: nếu grade 0 và mode practice → 3; còn lại theo `attempts`.

### 4.4 Ảnh hưởng type khác

| Type | Thay đổi |
|---|---|
| `Question.grade` | Giữ `Grade`, phản ánh **lớp sinh câu** (có thể thấp hơn lớp phiên) |
| `PlaySessionRecord.grade` | Lớp người chơi |
| `PlaySessionRecord.topic` | `HistoricalTopic` (đọc log cũ) |
| `QuestionPlayLog` | + `questionGrade?: Grade` |
| `ProgressState.completedByTopic` | `Partial<Record<HistoricalTopic, number>>` |

---

## 5. Thiết kế Engine

### 5.1 Pipeline sinh câu

```
pick template
  → buildVariables()
  → clampVariables(range)
  → template.constraints.every(passesConstraint)
  → evaluateAnswer()  (cần answer để kiểm tra carry)
  → passesGradePolicy()
  → answer nằm trong [range.min, range.max]
  → createChoices()
  → tạo Question
```

Thay đổi so với hiện tại:

1. `getLimit()` bị thay bằng `getTopicRange()`.
2. `passesGradePolicy()` là bước **bắt buộc** cho mọi câu.
3. Constraint và policy tách biệt: constraint = tính đúng nội tại của template; policy = yêu cầu của lớp.
4. `evaluateAnswer` nhận thêm biến `op` cho comparison.

### 5.2 Grade policy

```ts
type CarryNeed = boolean | undefined;

interface PolicyContext {
  grade: Grade;
  effectiveTopic: 'add-sub' | 'find-number' | 'carry' | 'comparison';
  difficulty: Difficulty;
  carryNeed: CarryNeed;
  op: '+' | '-';
  rule: string;
}
```

Luồng xác định phép tính thực tế:

| Answer rule | Phép tính | Toán hạng |
|---|---|---|
| `sum` | `a + b` | `a`, `b` |
| `difference` | `a - b` | `a`, `b` |
| `missingAddend` | `a + ?` | `a`, `answer` |
| `missingSubtrahend` | `a - ?` | `a`, `answer` |
| `missingMinuend` | `? - a` | `answer`, `a` |
| `compareValues` | không có phép tính | — |
| `compareExprNum` / `compareNumExpr` | `a op b` | `a`, `b` |

```ts
function operationOf(rule: string, vars, answer): {
  x: number;
  y: number;
  op: '+' | '-';
  result: number;
} | null

function passesGradePolicy(vars, answer, ctx): boolean {
  const opInfo = operationOf(ctx.rule, vars, answer);
  if (!opInfo) return true; // so sánh 2 số

  const { x, y, op, result } = opInfo;
  const constraint = gameConfig.gradeConstraints[ctx.grade];

  // Mầm non: phạm vi kết quả + không nhớ/mượn
  if (ctx.grade === 0) {
    if (op === '-' && x < y) return false;
    if (x < 0 || y < 0 || result < 0) return false;
    if (result > (constraint.resultMax ?? 10)) return false;
    return noCarry(x, y) && noBorrowOp(x, y, op);
  }

  const carries = op === '+' ? ones(x) + ones(y) >= 10 : x >= y && ones(x) < ones(y);

  // Lớp 1: luôn không nhớ/không mượn
  if (ctx.grade === 1) return !carries;

  // Lớp 2
  if (ctx.effectiveTopic === 'add-sub') {
    if (ctx.carryNeed === undefined) return true; // mixed/tower: không ép
    return ctx.carryNeed ? carries : !carries;
  }

  // find-number, comparison, carry: bắt buộc có nhớ/mượn
  return carries;
}
```

Ghi chú:

- Với `missingAddend`, phép cộng là `a + answer`; `carry` phải xét `answer`, không phải `b`.
- Với `missingMinuend`, phép trừ là `answer - a`.
- Với phép trừ, "có mượn" yêu cầu `x >= y` và `ones(x) < ones(y)`.

### 5.3 Quota plan (D4)

```ts
function planByWeights<T extends string>(
  count: number,
  weights: Record<T, number>,
  rng: () => number
): T[] {
  // 1. count * weight → phần nguyên
  // 2. phân bổ phần dư theo largest remainder
  // 3. shuffle
}
```

Áp dụng:

| Plan | Khi nào | Đầu vào |
|---|---|---|
| `operatorPlan` | `topic === 'add-sub'` | `addSub.mix` (50/50) |
| `carryPlan` | `grade === 2 && topic === 'add-sub'` | `addSubCarryRatio` (50%) |
| `formPlan` | `topic === 'comparison'` | `comparisonMix[grade]` |

Với 8 câu Lớp 1 comparison: `2.4 / 2.8 / 2.8` → largest remainder cho `2 / 3 / 3`.
Với 10 câu Lớp 2 comparison: `2 / 4 / 4`.
Với 5 câu Mầm non: `5 / 0 / 0`.

`carryPlan` cho Lớp 2 add-sub 10 câu → đúng 5 `true`, 5 `false`.

Batch generator nhận plan theo index:

```ts
generateQuestionBatch(grade, topic, difficulty, count, answerMode, options?: {
  operatorPlan?: ('+' | '-')[];
  carryPlan?: boolean[];
  formPlan?: ('twoNumbers' | 'exprLeft' | 'exprRight')[];
  rng?: () => number;
})
```

Khi `topic === 'mixed'`: không dùng plan; `carryNeed` random 50/50 cho câu add-sub.

### 5.4 `add-sub`

1. Chọn operator theo `operatorPlan`.
2. Với Lớp 2, chọn `carryNeed` theo `carryPlan`.
3. Lọc template:
   - `+` → template topic `addition`.
   - `-` → template topic `subtraction`.
   - Có thể dùng chung interactive generator (`makeMissingEquationQuestion`) để đa dạng dạng câu.
4. Grade policy đảm bảo phạm vi + carry.

`templateMatchesTopic` mới:

```ts
const TOPIC_TEMPLATE_MAP: Record<Topic, TemplateTopic[]> = {
  'add-sub': ['addition', 'subtraction'],
  'find-number': ['missing-number'],
  carry: ['carry'],
  comparison: ['comparison'],
  mixed: ['addition', 'subtraction', 'missing-number', 'carry', 'comparison'],
  tower: ['addition', 'subtraction', 'missing-number', 'carry', 'comparison'],
};
```

Riêng `find-number`, tiếp tục lọc bằng tag `find-number` để không lấy nhầm template missing-number cũ trong `mixed`.

### 5.5 `find-number`

#### 5.5.1 Bốn dạng & rule

| # | Prompt | Rule | Công thức | Difficulty |
|---|---|---|---|---|
| FN1 | `{{a}} + __ = {{result}}` | `missingAddend` | `result - a` | easy, medium, hard |
| FN2 | `__ + {{a}} = {{result}}` | `missingAddend` | `result - a` | easy, medium, hard |
| FN3 | `{{a}} - __ = {{result}}` | `missingSubtrahend` | `a - result` | hard |
| FN4 | `__ - {{a}} = {{result}}` | `missingMinuend` (mới) | `result + a` | hard |

`missingMinuend` bổ sung vào `evaluateAnswer`:

```ts
if (rule === 'missingMinuend') return { answer: result + a, derived: {} };
```

#### 5.5.2 Lọc pattern theo độ khó

```ts
function allowedFindNumberTags(difficulty: Difficulty): string[] {
  if (difficulty === 'hard') {
    return ['blank-right-add', 'blank-left-add', 'blank-right-subtract', 'blank-left-subtract'];
  }
  return ['blank-right-add', 'blank-left-add'];
}
```

Áp dụng bằng `template.tags` (mỗi template mang đúng 1 tag pattern).

#### 5.5.3 Ràng buộc

Template khai báo constraint nội tại:

- FN1: `resultGreaterThanA`
- FN3: `aGreaterThanResult`
- FN4: `answerWithinLimit` (mới)
- Tất cả: `valuesWithinLimit`

Grade policy xử lý nhớ/mượn:

- Lớp 1: không nhớ/không mượn.
- Lớp 2: bắt buộc nhớ/mượn.

#### 5.5.4 Kiểu trả lời

```ts
function mapQuestionType(template, answerMode, difficulty) {
  const isFindNumber = template.tags.includes('find-number');
  if (isFindNumber && answerMode !== 'input') return 'multiple-choice';
  // ...logic cũ
}
```

- `auto`/`choice` → trắc nghiệm 4 đáp án.
- `input` → `fill-number`.
- Hint lấy từ template (mỗi pattern một hint riêng theo mục 13.2 requirements).

#### 5.5.5 Fallback

Nếu template không sinh được câu (constraint quá chặt), gọi lại generator hiện có với range và pattern policy từ config:

```ts
makeMissingEquationQuestion(grade, 'find-number', difficulty, index, {
  range: getTopicRange(grade, 'find-number', difficulty),
  allowedTags: allowedFindNumberTags(difficulty),
});
```

Cần mở rộng signature của `makeMissingEquationQuestion`: nhận `range` và `allowedTags` thay vì tự suy ra từ difficulty. Fallback phải áp dụng cùng grade policy.

### 5.6 `comparison`

#### 5.6.1 Ba form

| Form | Prompt | Rule |
|---|---|---|
| `twoNumbers` | `{{left}} __ {{right}}` | `compareValues` |
| `exprLeft` | `{{a}} {{op}} {{b}} __ {{c}}` | `compareExprNum` (mới) |
| `exprRight` | `{{c}} __ {{a}} {{op}} {{b}}` | `compareNumExpr` (mới) |

`op` là biến `choice` với `['+', '-']`.

#### 5.6.2 Answer rule

```ts
if (rule === 'compareExprNum') {
  const expr = context.op === '-' ? a - b : a + b;
  const answer = expr === c ? '=' : expr > c ? '>' : '<';
  return { answer, derived: { exprValue: expr } };
}

if (rule === 'compareNumExpr') {
  const expr = context.op === '-' ? a - b : a + b;
  const answer = expr === c ? '=' : c > expr ? '>' : '<';
  return { answer, derived: { exprValue: expr } };
}
```

#### 5.6.3 Constraint

| Constraint | Ý nghĩa |
|---|---|
| `valuesWithinLimit` | a, b, c nằm trong range |
| `exprNonNegative` | nếu `op === '-'` thì `a >= b` |
| `answerWithinLimit` | answer nằm trong range (dùng cho FN4) |

Grade policy:

- Lớp 1: `exprLeft`/`exprRight` không nhớ/không mượn.
- Lớp 2: bắt buộc nhớ/mượn.
- Mầm non: chỉ `twoNumbers`.

#### 5.6.4 Chọn C để câu có nghĩa

Với `exprLeft`/`exprRight`:

1. Tính `exprValue` từ `a`, `op`, `b`.
2. Chọn `c` quanh `exprValue`:

```ts
const delta = Math.max(1, Math.round(range.max * 0.15));
c = clamp(exprValue + randomInt(-delta, delta), range.min, range.max);
```

3. Nếu cần dấu `=` (ép theo quota): `c = exprValue`.

Với `twoNumbers`: `left`, `right` random trong range.

#### 5.6.5 Phân phối dấu

Giữ nguyên cơ chế hiện có (`comparisonSigns: greater 0.5 / equal 0.25 / less 0.25`, `minEqualToGreaterRatio`), nhưng mở rộng cho cả 3 rule:

- Đếm `greater`, `equal`, `less` theo `correctAnswer`.
- Khi `equal < ceil(greater * minEqualToGreaterRatio)` → ép `=`.

`applyComparisonPreference` tổng quát hóa:

```ts
function applyComparisonPreference(template, vars, range, preferred?: '>' | '<' | '=') {
  if (preferred !== '=') return vars;

  if (template.answerRule === 'compareValues') {
    return { ...vars, right: vars.left };
  }
  const expr = computeExpr(vars);
  return { ...vars, c: expr };
}
```

#### 5.6.6 Loại bỏ câu không phải so sánh

`makeInteractiveQuestion` hiện thêm sort/clock/weekday/relative cho topic `comparison`. Thiết kế mới:

| Topic | Interactive được phép |
|---|---|
| `add-sub` | `makeMissingEquationQuestion` (tùy chọn) |
| `find-number` | fallback generator |
| `carry` | `makeMissingEquationQuestion({ carry: true })` |
| `comparison` | **không** (chỉ template so sánh) |
| `mixed` (grade ≥ 1) | sort, clock, weekday, relative + arithmetic |
| `mixed` (grade 0) | chỉ add-sub + comparison, **không** clock/date/sort |
| `tower` | như `mixed` |

### 5.7 Xen bài cấp dưới

Đặt ở `generateQuestionSession` (không đặt trong batch):

```ts
export function generateQuestionSession(
  grade: Grade,
  topic: Topic,
  difficulty: Difficulty,
  count: number,
  answerMode: AnswerMode = 'auto',
  options: { mode?: Mode; rng?: () => number } = {}
): QuestionBatch {
  const practice = options.mode !== 'challenge';
  const excluded = gameConfig.lowerGradeMix.excludedTopics.includes(topic);

  let lowerCount = 0;
  if (practice && grade > 0 && !excluded && topicAvailable(grade - 1, topic)) {
    const maxLower = Math.floor(count * gameConfig.lowerGradeMix.ratio);
    lowerCount = randomInt(0, maxLower, options.rng);
  }

  const currentCount = count - lowerCount;
  const current = generateForGrade(grade, topic, difficulty, currentCount, answerMode);

  const lower: Question[] = [];
  if (lowerCount > 0) {
    if (grade === 1) {
      lower.push(...generateForGrade(0, topic, difficulty, lowerCount, answerMode));
    } else {
      const fromGrade1 = randomInt(0, lowerCount, options.rng);
      lower.push(...generateForGrade(1, topic, difficulty, fromGrade1, answerMode));
      lower.push(...generateForGrade(0, topic, difficulty, lowerCount - fromGrade1, answerMode));
    }
  }

  // Nếu cấp dưới không sinh đủ, bù bằng câu cấp hiện tại
  const missing = count - current.length - lower.length;
  if (missing > 0) current.push(...generateForGrade(grade, topic, difficulty, missing, answerMode));

  return { questions: shuffle([...current, ...lower]), diagnostics: [] };
}
```

Trong đó:

```ts
function generateForGrade(grade, topic, difficulty, count, answerMode): Question[] {
  const batch = generateQuestionBatch(grade, topic, difficulty, count, answerMode, buildPlans(...));
  if (batch.questions.length >= count) return batch.questions.slice(0, count);

  const fallback = Array.from({ length: count - batch.questions.length }, (_, i) =>
    fallbackQuestion(grade, topic, difficulty, i)
  );
  return [...batch.questions, ...fallback];
}

function topicAvailable(grade: Grade, topic: Topic): boolean {
  if (grade === 0) return topic !== 'find-number' && topic !== 'carry';
  if (grade === 1) return topic !== 'carry';
  return true;
}
```

Quy tắc:

- `topicAvailable(grade, topic)`: Mầm non không có `find-number`, Lớp 1 không có `carry`; nếu không có thì `lowerCount = 0`.
- `mixed`/`tower`: cấp dưới sinh theo `mixed` (chỉ các topic cấp đó có).
- Không đệ quy xen cấp dưới.
- Mỗi `Question` giữ `grade` = lớp sinh câu.

### 5.8 Câu tương tác & time limit

- Câu số học dùng `timeLimits[grade][difficulty]` (override template).
- Câu tương tác nhiều bước giữ time limit riêng, nhưng không thấp hơn config:

```ts
timeLimit = Math.max(gameConfig.timeLimits[grade][difficulty], interactiveBase)
```

- `sort-numbers`: 60/50/40s (Lớp 1–2).
- `clock-hour`, `weekday-blank`, `relative-date`: 35/30/25s.

### 5.9 Chống trùng & không gian câu nhỏ (Mầm non)

Hiện tại batch chống trùng bằng `recentKeys` (template + text). Với Mầm non Dễ (a,b ≤ 5), số câu unique rất ít.

Thiết kế:

```ts
const pairCache = new Map<string, Array<{ a: number; b: number }>>();

function getPairs(grade, difficulty, operator, carryNeed): Array<{ a: number; b: number }> {
  const key = `${grade}|${difficulty}|${operator}|${carryNeed}`;
  // Sinh một lần toàn bộ cặp hợp lệ trong range
  // Lưu cache; sample không lặp trong session
}
```

- Cache build lazy, tối đa vài trăm cặp.
- Session dùng `usedKeys` riêng; hết cặp thì reset `usedKeys` (chấp nhận lặp lại giữa các lượt, không lặp trong cùng lượt nếu còn).
- Với Mầm non 5 câu, không gian luôn đủ.

### 5.10 Fallback

`src/data/questions.ts`:

- `fallbackQuestion` nhận `grade`, `topic`, `difficulty`, range từ config.
- Thêm nhánh:
  - `grade 0`: cộng/trừ trong ≤10.
  - `add-sub`: random cộng hoặc trừ.
  - `find-number`: sinh 1 trong 4 dạng.
  - `comparison`: sinh `A __ B` hoặc biểu thức vs số.
- Fallback **không** cần tuân thủ quota (chỉ dùng khi thiếu câu), nhưng phải đúng phạm vi.

---

## 6. Thiết kế Template JSON

### 6.1 Schema

Không đổi schema. Mỗi template vẫn gồm:

```json
{
  "id": "...",
  "sourceSkillId": "...",
  "grade": [0, 1, 2],
  "topic": "addition | subtraction | carry | comparison | missing-number",
  "difficulty": ["easy", "medium", "hard"],
  "questionType": "number-input | missing-number | comparison-sign | word-problem",
  "tags": ["..."],
  "variables": { "a": { "type": "integer", "min": 1, "max": 90 } },
  "constraints": ["..."],
  "promptTemplate": "...",
  "answerRule": "...",
  "choicesRule": "comparisonSigns | nearbyNumbers",
  "hintTemplate": "...",
  "solutionTemplate": "...",
  "timeLimitSeconds": 30,
  "validationExamples": []
}
```

`timeLimitSeconds` chỉ còn là fallback; engine override bằng config.

### 6.2 Template mới/cập nhật

| ID | Topic | Grade | Difficulty | Prompt | Rule | Tags | Ghi chú |
|---|---|---|---|---|---|---|---|
| `addition-basic-no-carry` | addition | **[0,1,2]** | easy, medium, hard | `{{a}} + {{b}} = ?` | `sum` | `calc, addition, no-carry` | Mở grade 0; policy giới hạn ≤10 |
| `subtraction-basic-no-borrow` | subtraction | **[0,1,2]** | easy, medium, hard | `{{a}} - {{b}} = ?` | `difference` | `calc, subtraction, no-borrow` | Mở grade 0 |
| `comparison-two-numbers` | comparison | **[0,1,2]** | easy, medium, hard | `{{left}} __ {{right}}` | `compareValues` | `comparison, two-numbers` | Mầm non dùng template này |
| `comparison-expr-left-add` | comparison | 1, 2 | easy, medium, hard | `{{a}} + {{b}} __ {{c}}` | `compareExprNum` | `comparison, expr-left` | Mới |
| `comparison-expr-left-sub` | comparison | 1, 2 | easy, medium, hard | `{{a}} - {{b}} __ {{c}}` | `compareExprNum` | `comparison, expr-left` | Mới, constraint `exprNonNegative` |
| `comparison-expr-right-add` | comparison | 1, 2 | easy, medium, hard | `{{c}} __ {{a}} + {{b}}` | `compareNumExpr` | `comparison, expr-right` | Mới |
| `comparison-expr-right-sub` | comparison | 1, 2 | easy, medium, hard | `{{c}} __ {{a}} - {{b}}` | `compareNumExpr` | `comparison, expr-right` | Mới |
| `find-addend-right` | missing-number | 1, 2 | easy, medium, hard | `{{a}} + __ = {{result}}` | `missingAddend` | `find-number, blank-right-add` | FN1 |
| `find-addend-left` | missing-number | 1, 2 | easy, medium, hard | `__ + {{a}} = {{result}}` | `missingAddend` | `find-number, blank-left-add` | FN2 |
| `find-subtrahend` | missing-number | 1, 2 | **hard** | `{{a}} - __ = {{result}}` | `missingSubtrahend` | `find-number, blank-right-subtract` | FN3 |
| `find-minuend` | missing-number | 1, 2 | **hard** | `__ - {{a}} = {{result}}` | `missingMinuend` | `find-number, blank-left-subtract` | FN4, rule mới |
| `find-number-word` | missing-number | 1, 2 | medium, hard | `{{name}} có {{a}} {{item}}, sau khi thêm thì có {{result}}. Hỏi đã thêm bao nhiêu?` | `missingAddend` | `find-number, word-problem` | Tùy chọn, hint riêng |

> Dùng `op` choice (`['+','-']`) sẽ gộp được 4 template comparison thành 2; bảng trên liệt kê phương án tách để prompt/hint rõ ràng hơn. Chọn **tách 4 template** (D3) vì hint tiếng Việt khác nhau cho cộng/trừ.
>
> Mỗi template tách vẫn khai báo biến `op` cố định để dùng chung answer rule:
>
> ```json
> "variables": {
>   "a": { "type": "integer", "min": 1, "max": 80 },
>   "b": { "type": "integer", "min": 1, "max": 80 },
>   "c": { "type": "integer", "min": 1, "max": 99 },
>   "op": { "type": "choice", "values": ["-"] }
> }
> ```
>
> Nhờ vậy `compareExprNum` / `compareNumExpr` chỉ cần đọc `context.op`, không cần 4 rule riêng.

### 6.3 Constraint & rule mới

Bổ sung vào `passesConstraint`:

| Constraint | Công thức |
|---|---|
| `exprNonNegative` | `op === '-' ? a >= b : true` |
| `answerWithinLimit` | `answer >= range.min && answer <= range.max` |
| `resultGreaterThanA` | đã có |
| `aGreaterThanResult` | đã có |
| `valuesWithinLimit` | đã có, đổi sang range config |

Bổ sung vào `evaluateAnswer`:

| Rule | Kết quả |
|---|---|
| `missingMinuend` | `result + a` |
| `compareExprNum` | so sánh `a op b` với `c` |
| `compareNumExpr` | so sánh `c` với `a op b` |

### 6.4 Validate template

Giữ `validateTemplate`. Thêm kiểm tra:

- `tags` phải có đúng 1 trong 4 tag pattern nếu topic `missing-number` và có tag `find-number`.
- `comparison` template bắt buộc `choicesRule === 'comparisonSigns'`.
- `grade` không được chứa 0 nếu prompt có `op` hoặc có 2 phép tính.

---

## 7. Thiết kế UI/UX

### 7.1 Luồng màn hình

```
Setup
  └─ [Mầm non] [Lớp 1] [Lớp 2] → Bắt đầu
        ▼
Home
  ├─ Luyện tập  → Map → Selection → Quiz → Result
  └─ Thử thách  → Map → Selection → Quiz → Result
```

Không đổi route, chỉ đổi nội dung theo `grade`/`mode`.

### 7.2 Theme Luyện tập / Thử thách

Thêm attribute ở root:

```tsx
<div
  className="app-shell"
  data-mode={mode}
  data-grade={state.profile?.grade ?? playerGrade}
>
```

| Mode | Accent | Cảm giác |
|---|---|---|
| `practice` | xanh lá `#58b66b` | nhẹ nhàng, khuyến khích |
| `challenge` | cam/coral `#ff8a65` | năng động, tính điểm |

Phạm vi áp dụng: từ Map → Selection → Quiz → Result. Home giữ trung tính vì có cả 2 nút.

### 7.3 Mầm non — typography & tương tác

| Thành phần | Hiện tại | Mầm non |
|---|---|---|
| Câu hỏi | `clamp(1.9rem, 4vw, 2.8rem)` (theo CSS hiện có) | tăng ~20% |
| Nút đáp án | min-height 48px | **64px** |
| Khoảng cách | 12px | 16px |
| Feedback | ngắn | câu dài hơn, nhiều emoji |

Copy phản hồi:

```ts
const feedbackCopy = {
  0: {
    correct: ['Giỏi quá! Con thật tuyệt vời! 🌟', 'Chính xác! Con giỏi lắm! 🎉'],
    retry: ['Không sao, con thử lại nhé! 💪'],
    wrong: ['Không sao đâu, mình xem đáp án nhé! 😊'],
    timeout: ['Hết giờ rồi, mình cùng xem đáp án nhé! 😊'],
  },
  default: { /* copy hiện tại */ },
};
```

### 7.4 Bản đồ chủ đề

| Grade | Nodes |
|---|---|
| 0 | `add-sub`, `comparison`, `mixed`, `tower` |
| 1 | `add-sub`, `find-number`, `comparison`, `mixed`, `tower` |
| 2 | `add-sub`, `find-number`, `carry`, `comparison`, `mixed`, `tower` |

Thứ tự render cố định theo bảng trên (không phụ thuộc config `enabledForGrades`, trừ `carry`/`comparison`).

Class CSS:

```tsx
className={`map-node ${node} ${locked ? 'locked' : ''}`}
```

`node` mới: `add-sub`, `find-number`. Bỏ `addition`, `subtraction`.

Nhãn hiển thị:

```ts
const topicName: Record<Topic, string> = {
  'add-sub': 'Cộng/Trừ',
  'find-number': 'Tìm số',
  carry: 'Cộng trừ có nhớ',
  comparison: 'So sánh',
  mixed: 'Tổng hợp',
  tower: 'Tháp Thông Thái',
};
```

### 7.5 Setup

- Thêm nút Mầm non: `[Mầm non] [Lớp 1] [Lớp 2]`.
- Subtitle:
  - grade 0: `'Luyện cộng, trừ trong phạm vi 10 qua các thử thách vui nhộn.'`
  - grade 1: giữ hiện tại.
  - grade 2: giữ hiện tại.
- `playerGrade` mặc định vẫn là 1.

### 7.6 Home

Xóa:

- Nút `Xuất log (N)`.
- Nút `Lưu lịch sử chơi (N)`.
- `<p className="storage-note">…</p>`.
- 2 stat card: "Log câu hỏi", "Lượt chơi đã lưu".

Giữ 6 stat card: Thử thách hoàn thành, Lượt đã chơi, Dễ đã xong, Vừa đã xong, Tổng điểm, Huy hiệu.

Không xóa hàm export trong utils; chỉ bỏ import/usage ở `App.tsx`.

### 7.7 Selection

- Nhãn thời gian theo `getTimeLimit(grade, difficulty)`, không hardcode 30/25/20.
- Ghi chú carry chỉ hiện với grade 2.
- Với `find-number`: thêm dòng mô tả "Con sẽ tìm số còn thiếu trong phép tính."
- Với Mầm non: ẩn lựa chọn "Nhập số/dấu"? **Không ẩn**, nhưng mặc định `choice`; nếu người lớn chọn input vẫn dùng được.

### 7.8 Quiz

- Hiển thị `Câu {index + 1}/{sessionQuestions.length}`.
- Thanh tiến độ theo tổng số câu thực tế.
- Mầm non: câu hỏi to hơn, nút đáp án cao hơn, feedback theo `feedbackCopy[0]`.
- `find-number` trắc nghiệm: prompt dạng `__ + 4 = 9`.
- Attempt: dùng `getAttemptConfig(mode, grade)` — Mầm non Practice 3 lần, còn lại giữ nguyên 2/1.
- Không đổi cơ chế timer và cách tính điểm (+10 lần đầu, +5 lần retry).

### 7.9 Result

- `{correctCount}/{total}` thay vì `/10`.
- Mầm non: câu tổng kết thân thiện, ví dụ `Con làm được 4/5 câu! Giỏi lắm! 🌟`.
- Lớp 1–2: giữ câu hiện tại.
- Không thêm pie chart (backlog).

### 7.10 Responsive & accessibility

- Giữ breakpoint hiện có (desktop / tablet / phone).
- Node map 6 nút: dùng grid auto-fit, không xuống 1 cột quá sớm.
- Nút Mầm non ở setup: 3 nút segmented, đảm bảo ≥48px.
- Theme xanh/cam phải giữ contrast chữ `--ink` trên nền sáng.
- `aria-live` cho feedback giữ nguyên.

---

## 8. Thay đổi trong App.tsx

| Vị trí | Thay đổi |
|---|---|
| `topicName` / `topicDescription` | Key mới `add-sub`, `find-number`; bỏ 2 key cũ |
| `badgeLabels` | + `add_sub_star`, + `find_number_star`; giữ label badge cũ |
| `getUnlocked` | Bỏ `addition`/`subtraction`; `find-number: true`, `comparison: true` |
| `getBadges` | Nhận `total`; `perfect_run` theo total; `add_sub_star` thay 2 badge cũ; `tower_wisdom` ≥ 80% |
| `renderTopBar` | `grade === 0 ? 'Mầm non' : 'Lớp ' + grade` |
| `renderSetup` | `[0,1,2]`; subtitle theo grade |
| `renderHome` | Bỏ 2 nút + note + 2 card |
| `renderMap` | Danh sách node theo bảng 7.4 |
| `renderSelection` | Time label từ config; note carry theo grade |
| `startSession` | `count = getSessionQuestionCount(grade)`; truyền `{ mode }`; bỏ hardcode `10` |
| `evaluateAnswer` | `getAttemptConfig(mode, grade)` để Mầm non có 3 lần thử |
| `finishSession` | Reward theo `total` và 80%; badge nhận total |
| `renderQuiz` | `Câu x/{sessionQuestions.length}` |
| `renderResult` | `{correctCount}/{sessionQuestions.length}`; copy Mầm non |
| Root return | Thêm `data-mode`, `data-grade` |
| Feedback | Helper `getFeedback(grade, kind)` |

### 8.1 Pseudo-code `startSession`

```ts
const grade = state.profile?.grade ?? playerGrade;
const count = getSessionQuestionCount(grade);
const batch = generateQuestionSession(grade, chosenTopic, difficulty, count, answerMode, { mode });
```

### 8.2 Pseudo-code `finishSession`

```ts
const total = sessionQuestions.length || getSessionQuestionCount(grade);
const perfect = finalCorrectCount === total;
const good = finalCorrectCount >= Math.ceil(total * 0.8);

if (mode === 'challenge') {
  if (perfect) { finalScore += 50; rewardText = `Hoàn thành ${total}/${total}: +50 điểm và nhận huy hiệu!`; }
  else if (good) { finalScore += 20; rewardText = `Hoàn thành từ ${Math.ceil(total * 0.8)} câu đúng: +20 điểm!`; }
}
```

### 8.3 Pseudo-code `getBadges`

```ts
function getBadges(topic: Topic, correctCount: number, total: number, completedBefore: number) {
  const badges = new Set<string>();
  const perfect = correctCount === total;
  if (completedBefore === 0) badges.add('first_challenge');
  if (perfect) badges.add('perfect_run');
  if (topic === 'add-sub' && perfect) badges.add('add_sub_star');
  if (topic === 'find-number' && perfect) badges.add('find_number_star');
  if (topic === 'carry' && perfect) badges.add('carry_master');
  if (topic === 'comparison' && perfect) badges.add('comparison_eye');
  if (topic === 'tower' && correctCount >= Math.ceil(total * 0.8)) badges.add('tower_wisdom');
  return Array.from(badges);
}
```

---

## 9. CSS & theme

### 9.1 Token mới

```css
:root {
  --practice: #58b66b;
  --practice-soft: #e8f8ec;
  --challenge: #ff8a65;
  --challenge-soft: #fff0ea;
}

.app-shell[data-mode='practice'] {
  --accent: var(--practice);
  --accent-soft: var(--practice-soft);
}

.app-shell[data-mode='challenge'] {
  --accent: var(--challenge);
  --accent-soft: var(--challenge-soft);
}
```

### 9.2 Node map

```css
.map-node.add-sub {
  background: linear-gradient(135deg, #e8f8ec, #fff4d2);
}

.map-node.find-number {
  background: #f0f4ff;
}
```

Bỏ `.map-node.addition`, `.map-node.subtraction`.

### 9.3 Theme áp dụng

```css
[data-mode] .panel,
[data-mode] .quiz-panel {
  border-color: color-mix(in srgb, var(--accent) 35%, white);
}

[data-mode] .map-node:not(.locked) {
  box-shadow: 0 6px 0 color-mix(in srgb, var(--accent) 55%, white);
}

[data-mode='challenge'] .primary-button:not(.coral) {
  background: var(--accent);
}
```

### 9.4 Mầm non

```css
.app-shell[data-grade='0'] {
  --question-size: clamp(2.3rem, 7vw, 3.6rem);
  --choice-min: 64px;
}

.app-shell[data-grade='0'] .question-box {
  font-size: var(--question-size);
}

.app-shell[data-grade='0'] .option-card,
.app-shell[data-grade='0'] .answer-options button {
  min-height: var(--choice-min);
}

.app-shell[data-grade='0'] .map-node {
  min-height: 132px;
}
```

### 9.5 Responsive

- Map: `grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))`.
- 6 node trên desktop: 3×2 hoặc 6×1 tùy width.
- Mầm non phone: node full width, font câu hỏi không vượt 8vw.

---

## 10. Storage, migration & logging

### 10.1 `loadAppState()`

```ts
const LEGACY_TOPIC_MAP: Record<string, Topic | undefined> = {
  addition: 'add-sub',
  subtraction: 'add-sub',
};

function normalizeCompletedByTopic(raw: Record<string, number>) {
  const result: Partial<Record<HistoricalTopic, number>> = {};
  for (const [key, value] of Object.entries(raw)) {
    const topic = LEGACY_TOPIC_MAP[key] ?? (key as Topic);
    result[topic] = (result[topic] ?? 0) + value;
  }
  return result;
}

function normalizeGrade(grade: unknown): Grade {
  return grade === 0 || grade === 1 || grade === 2 ? grade : 1;
}
```

- `profile.grade` invalid → 1.
- `completedByTopic` cộng dồn `addition + subtraction` → `add-sub`.
- Badge cũ giữ nguyên mảng.
- Không ghi lại session/log cũ.

### 10.2 Logging

`BaseLogContext` thêm:

```ts
questionGrade?: Grade;
```

`logQuestionGenerated`:

```ts
appendQuestionLog({
  ...context,
  questionGrade: question.grade,
  // ...
});
```

`grade` trong log = lớp phiên chơi; `questionGrade` = lớp sinh câu. Với câu xen cấp dưới, hai giá trị khác nhau.

### 10.3 Session history

- `PlaySessionRecord` không đổi cấu trúc.
- Record cũ có `topic: 'addition'` vẫn được đọc/export.
- Record mới ghi `add-sub`/`find-number`.
- `questionCount` = 5/8/10; `answeredCount` theo thực tế.

### 10.4 Export

- Giữ `exportQuestionLogs`, `exportSessionRecordsAsJson`.
- Bỏ nút UI; README cập nhật: chỉ còn auto-ghi khi `npm run dev`.

---

## 11. Testing

### 11.1 Setup

- Thêm `vitest` (devDependency).
- `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`.
- `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- Hook test:

```ts
// questionTemplateEngine.ts
let randomSource = Math.random;
export function setRandomSource(fn: (() => number) | null) {
  randomSource = fn ?? Math.random;
}
```

Dùng trong `afterEach(() => setRandomSource(null))`.

### 11.2 Test matrix

| AC | Test | Cách kiểm |
|---|---|---|
| AC1 | build | `npm run build` |
| AC2 | map grade 0 | render snapshot / smoke |
| AC3 | grade 0 easy | 10 batch × 5 câu; mọi a,b ≤5, result ≤10, result ≥0 |
| AC4 | map nodes | không còn addition/subtraction |
| AC5 | add-sub 50/50 | 100 câu: 45–55 mỗi loại |
| AC7 | find-number L1 | easy/medium chỉ 2 dạng cộng; hard đủ 4; không nhớ |
| AC8 | find-number L2 | easy/medium 2 dạng cộng, hard 4 dạng; có nhớ/mượn |
| AC9 | comparison L0 | 100% `A __ B`, ≤10 |
| AC10 | comparison L1 | đủ 3 form theo quota 2/3/3; không nhớ |
| AC11 | comparison L2 | đủ 3 form 2/4/4; có nhớ |
| AC12 | lower-grade mix | practice: ≤33%; challenge: 0% |
| AC13 | add-sub L1 | range 10/50/100; không nhớ |
| AC14 | carry L2 | carry range cũ |
| AC16 | session count | 5/8/10 |
| AC17 | carry ratio L2 add-sub | 100 câu: 45–55% carry |
| AC18 | migration | `loadAppState` với localStorage giả |
| AC19 | npm test | pass |

### 11.3 Ví dụ test

```ts
import { describe, expect, it } from 'vitest';
import { generateQuestionBatch } from '../game/questionTemplateEngine';

describe('grade 0 add-sub', () => {
  it('luôn nằm trong phạm vi 10 và không âm', () => {
    for (let i = 0; i < 10; i += 1) {
      const { questions } = generateQuestionBatch(0, 'add-sub', 'easy', 5, 'choice');
      expect(questions).toHaveLength(5);

      for (const q of questions) {
        const [a, b, result] = q.text.match(/\d+/g)!.map(Number);
        expect(a).toBeLessThanOrEqual(5);
        expect(b).toBeLessThanOrEqual(5);
        expect(result).toBeLessThanOrEqual(10);
        expect(result).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
```

> Lưu ý: batch chống trùng theo session, nên AC "sinh 50 câu" được test bằng nhiều batch 5/8/10 câu, không phải 1 batch 50 câu.

---

## 12. Rủi ro & edge cases

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| 1 | Grade 0 Dễ quá ít tổ hợp → không đủ 5 câu unique | Cache cặp + cho phép lặp giữa các session; test 10 session |
| 2 | Quota 50% carry + constraint Lớp 2 không sinh đủ | Fallback sinh câu đơn giản; nới range nếu cần |
| 3 | Ép dấu `=` xung đột no-carry Lớp 1 | Chọn `a`, `b` trước, `c = a + b` luôn hợp lệ; kiểm tra lại policy |
| 4 | `? - A = B` với Lớp 1 no-borrow nhưng `answer - a` có thể vượt range | Constraint `answerWithinLimit` + retry |
| 5 | Câu xen cấp dưới làm badge perfect khó hiểu | Vẫn tính bình thường; ghi log `questionGrade` |
| 6 | Log/session cũ có topic `addition` gây lỗi type | `HistoricalTopic` + helper fallback |
| 7 | Reward vẫn hardcode 10/8 | Thay bằng `total` và `ceil(0.8 * total)` |
| 8 | `getTimeLimit` cũ clamp 30/25/20 làm Mầm non 45s không có tác dụng | Bỏ clamp, đọc config |
| 9 | Mầm non gặp câu giờ/thứ trong `mixed` | Chặn interactive clock/date/sort cho grade 0 |
| 10 | Ảnh move làm hỏng build | Ảnh không được import ở đâu; chỉ `git mv` |
| 11 | `.gitignore` thiếu `data/` do thư mục untracked | Không đổi; chỉ commit file spec nếu cần |
| 12 | Theme xanh/cam làm giảm contrast | Giữ chữ `--ink`, chỉ đổi accent/nền nhạt |

### 12.1 Edge case hành vi

- **Timeout câu cuối:** `finishSession` dùng `sessionResultsRef` (đã đúng hiện tại), không đổi.
- **Chơi lại:** `startSession` reset toàn bộ state; count lấy lại theo grade.
- **Đổi lớp giữa chừng:** hiện không có UI đổi lớp sau setup; nếu logout rồi setup lại, profile cũ được thay.
- **`tower`:** vẫn map sang `mixed` khi sinh câu nhưng record giữ `tower`.
- **`mixed` grade 0:** chỉ add-sub + comparison; không có find-number/carry/time.

---

## 13. Thứ tự triển khai

| Phase | Task | Nội dung | Phụ thuộc |
|---|---|---|---|
| 0 | T0 | Move ảnh, sửa README | — |
| 0 | T8 | Bỏ nút Home, storage note, 2 stat card | — |
| 1 | T1 | Types: Grade, Topic, LegacyTopic, questionGrade | — |
| 1 | T2 | Config + accessor + migration storage | T1 |
| 2 | T3 | Engine: topic mapping, grade policy, quota, rules mới | T1, T2 |
| 3 | T4 | Template: grade 0, find-number, comparison | T1 |
| 3 | T5 | Fallback questions theo grade/topic | T1, T2 |
| 4 | T6 | Setup: nút Mầm non | T1 |
| 4 | T7 | Map: node mới theo lớp | T1, T3 |
| 4 | T9 | Practice/Challenge theme + 3 attempts Mầm non | T7 |
| 5 | T10 | Xen bài cấp dưới | T3 |
| 5 | T11 | CSS: node, theme, grade 0 | T6, T7 |
| 5 | T12 | Badge mới + scale threshold | T7 |
| 6 | T13 | Vitest + test matrix | T0–T12 |
| 6 | T14 | README, specs | T13 |

**Thứ tự khuyến nghị:** 0 → 1 → 2 → 3 → 4 → 5 → 6.
Không bắt đầu T9/T11 trước khi T7 xong vì class node thay đổi.

---

## 14. Ngoài phạm vi / backlog

| Item | Ghi chú |
|---|---|
| Minh họa emoji trong đề (`🍎🍎 + 🍎🍎🍎`) | Cần kiểu render câu hỏi mới |
| Text-to-speech đọc đề | Cần Web Speech API + nút bật/tắt |
| Streak bonus (3 câu đúng liên tiếp) | Cần hiệu ứng + state |
| Pie chart kết quả | Cần thư viện hoặc SVG thủ công |
| Progressive difficulty trong lượt | Xung đột với chọn độ khó + xen cấp dưới |
| Unlock riêng cho từng topic | Hiện chỉ unlock mixed/tower |
| Lưu lịch sử theo từng cấp | Hiện lịch sử dùng chung localStorage |

---

## Phụ lục A — Mapping AC → file

| AC | File chính |
|---|---|
| AC1 | `src/assets/images/`, `README.md` |
| AC2, AC4 | `src/App.tsx` (`renderMap`), `src/styles.css` |
| AC3, AC5, AC13, AC17 | `src/game/questionTemplateEngine.ts`, `src/game/gameConfig.ts` |
| AC6 | `src/App.tsx` (`renderHome`) |
| AC7, AC8 | `questionTemplates.json`, `questionTemplateEngine.ts` |
| AC9–AC11 | `questionTemplates.json`, `questionTemplateEngine.ts` |
| AC12 | `src/data/questions.ts` |
| AC14 | `gameConfig.carry`, engine |
| AC15 | `questions.ts`, engine |
| AC16 | `gameConfig`, `App.tsx` |
| AC18 | `src/utils/storage.ts` |
| AC19 | `vitest.config.ts`, `src/**/*.test.ts` |

---

## Phụ lục B — Checklist review design

- [ ] Chốt D2: find-number dùng template JSON (không chỉ generator).
- [ ] Chốt D3: tách 4 template comparison thay vì 2 template dùng `op`.
- [ ] Chốt D5: bỏ câu giờ/thứ/sắp xếp khỏi topic So sánh.
- [ ] Chốt việc giữ câu giờ/thứ/sắp xếp trong `mixed` Lớp 1–2 (không có trong mô tả 10.1).
- [ ] Chốt test AC "50 câu" chạy nhiều session thay vì 1 batch.
- [ ] Chốt copy phản hồi Mầm non.
