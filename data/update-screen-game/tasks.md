# Tasks triển khai — Cập nhật Giao diện & Tính năng Game Cú Mèo Toán Học

- **Trạng thái:** Kế hoạch — chưa triển khai (dùng để review)
- **Ngày tạo:** 30/10/2026
- **Tài liệu gốc:** [`requirements.md`](./requirements.md) (đã chốt Q1–Q18)
- **Thiết kế:** [`designs.md`](./designs.md) (D1–D10)
- **Phạm vi:** Mầm non (grade 0), Lớp 1, Lớp 2
- **Tổng ước lượng:** ~8.4 ngày công (buffer +20% → ~10 ngày)
- **Nguyên tắc:** Làm theo dependency; mỗi task phải build pass và tự kiểm tra trước khi sang task kế tiếp.

### Chú thích trạng thái

| Ký hiệu | Nghĩa |
|---|---|
| ⬜ Todo | Chưa làm |
| 🟡 Doing | Đang làm |
| ✅ Done | Đã xong, đã kiểm tra |
| ⏸ Blocked | Đang chờ quyết định/bug khác |
| ❌ Bỏ | Không làm trong iteration này |

> Toàn bộ task dưới đây đang ở trạng thái ⬜ Todo. Tài liệu này **chưa thực hiện thay đổi code nào**.

---

## 1. Bảng tiến độ

| ID | Task | Phụ thuộc | Ước lượng | Trạng thái |
|---|---|---|---:|---|
| **T0** | Di chuyển ảnh vào `src/assets/images/` | — | 0.1 ngày | ⬜ Todo |
| **T1** | Types: Grade 0, Topic mới, legacy topic, log field | — | 0.5 ngày | ⬜ Todo |
| **T2** | Config 3 cấp + accessor + migration storage | T1 | 0.75 ngày | ⬜ Todo |
| **T3** | Engine: mapping, grade policy, quota, rule/constraint mới | T1, T2 | 1.5 ngày | ⬜ Todo |
| **T4** | Templates JSON: Mầm non, Tìm số, So sánh biểu thức | T1 | 1.0 ngày | ⬜ Todo |
| **T5** | Fallback questions theo grade/topic mới | T1, T2 | 0.5 ngày | ⬜ Todo |
| **T6** | Setup: thêm nút Mầm non + top-bar label | T1 | 0.25 ngày | ⬜ Todo |
| **T7** | Map: node mới theo lớp, bỏ addition/subtraction | T1, T3 | 0.5 ngày | ⬜ Todo |
| **T8** | Home: bỏ 2 nút export, storage note, 2 stat card | — | 0.25 ngày | ⬜ Todo |
| **T9** | Theme Practice/Challenge + 3 attempts Mầm non | T7 | 0.5 ngày | ⬜ Todo |
| **T10** | Xen bài cấp dưới (≤33%, chỉ Practice) | T3, T5 | 0.5 ngày | ⬜ Todo |
| **T11** | CSS: node mới, theme, typography Mầm non | T6, T7, T9 | 0.5 ngày | ⬜ Todo |
| **T12** | Badge mới + scale threshold theo số câu | T7 | 0.25 ngày | ⬜ Todo |
| **T13** | Vitest + test matrix + QA thủ công | T0–T12 | 1.0 ngày | ⬜ Todo |
| **T14** | README, specs, đóng gói tài liệu | T13 | 0.25 ngày | ⬜ Todo |
| | **Tổng** | | **~8.4 ngày** | |

### 1.1 Dependency graph

```text
T1 ──┬──► T2 ──┬──► T3 ──┬──► T7 ──┬──► T9 ──┐
     │         │         │         │         ├──► T11
     │         │         │         └──► T12  │
     │         │         └──► T10            │
     │         ├──► T5 ──────────────────────┤
     │         │                            │
     ├──► T4 ──┘                            │
     ├──► T6 ───────────────────────────────┤
     │                                      │
T0 ─┴───────────────────────────────────────┴──► T13 ──► T14
T8 ─────────────────────────────────────────────────┘
```

### 1.2 Có thể làm song song

| Nhóm | Task | Ghi chú |
|---|---|---|
| Nhóm A | T0, T8 | Không đụng engine/App logic, có thể PR riêng |
| Nhóm B | T1 → T2 → T3 | Chuỗi bắt buộc |
| Nhóm C | T4, T6 | Sau T1; khác vùng file với T3 |
| Nhóm D | T5, T10 | Sau T2/T3 |
| Nhóm E | T7, T12 | Sau T3; T12 có thể làm cùng T7 |
| Nhóm F | T9, T11 | Sau T7 |

> Nếu chỉ có 1 người làm: giữ đúng thứ tự T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14.

---

## 2. Guardrails — không làm trong phạm vi này

- ❌ Không di chuyển `data/play-sessions.json`; không sửa `vite.config.ts`.
- ❌ Không đổi key `localStorage` (`owl_math_game_profile_v1`, `owl_math_game_sessions_v1`, `owl_math_game_question_logs_v1`).
- ❌ Không xóa hàm `exportQuestionLogs`, `exportSessionRecordsAsJson`, `clearQuestionLogs`, `clearSessionRecords`; chỉ bỏ UI.
- ❌ Không đổi công thức điểm (+10/+5, phạt -5 khi sai 3 lần liên tiếp), trừ reward theo số câu.
- ❌ Không thêm progressive difficulty, emoji minh họa, TTS, streak, pie chart.
- ❌ Không đổi `TemplateTopic`; chỉ thêm mapping ở engine.
- ❌ Không thêm dependency ngoài `vitest` (không UI library, không CSS framework).
- ❌ Không đổi `mixed`/`tower` sang logic mới; chỉ áp danh sách topic theo lớp.
- ❌ Không commit `dist/`, log tạm, `data/play-sessions.json`.
- ❌ Không sửa `README.md` ngoài nội dung liên quan (để dành T14).

---

## 3. Definition of Done chung

Mỗi task chỉ được đánh ✅ khi:

- [ ] `npm run build` pass (tsc + vite build).
- [ ] `npm test` pass (từ T13; trước đó chạy test liên quan nếu có).
- [ ] Không có lỗi/cảnh báo mới trong console khi chạy `npm run dev`.
- [ ] Luồng liên quan được kiểm tra thủ công ít nhất 1 lần.
- [ ] Không phá 3 luồng cũ: Luyện tập retry + hint, Thử thách 1 lần + reward, Đăng xuất/xóa dữ liệu.
- [ ] Không phá responsive hiện có (desktop / tablet / phone).
- [ ] `localStorage` cũ (grade 1/2, topic `addition`) vẫn load được.

### 3.1 Lệnh kiểm tra

```powershell
npm install
npm run build
npm test          # sau T13
npm run dev       # kiểm tra thủ công
```

---

## 4. Chi tiết task

### T0 — Di chuyển ảnh vào `src/assets/images/`

**Mục tiêu:** Đưa 5 ảnh bobo vào đúng thư mục asset, không ảnh hưởng build.

**Files:**
- `bobo-after-answer.png` → `src/assets/images/bobo-after-answer.png`
- `bobo-gameplay-desktop.png` → `src/assets/images/bobo-gameplay-desktop.png`
- `bobo-home-desktop.png` → `src/assets/images/bobo-home-desktop.png`
- `bobo-home-mobile.png` → `src/assets/images/bobo-home-mobile.png`
- `bobo-home-tablet.png` → `src/assets/images/bobo-home-tablet.png`
- `README.md` (chỉ nếu thêm link ảnh)

**Các bước:**
- [ ] Tạo thư mục `src/assets/images/`.
- [ ] `git mv bobo-*.png src/assets/images/` (giữ lịch sử file).
- [ ] Grep toàn repo xác nhận không còn reference đường dẫn gốc.
- [ ] Kiểm tra `npm run build` không lỗi asset.
- [ ] Ghi chú trong README vị trí ảnh mới (nếu README có nhắc ảnh).

**Không làm:**
- Không move `data/play-sessions.json`.
- Không sửa `vite.config.ts`.

**Kiểm tra:**
- [ ] `npm run build` pass.
- [ ] `npm run dev` load trang chủ bình thường.
- [ ] `git status` không còn file ảnh ở root.

---

### T1 — Types: Grade 0, Topic mới, legacy topic, log field

**Mục tiêu:** Mở rộng type an toàn, cho phép đọc dữ liệu cũ.

**Files:**
- `src/types.ts`

**Các bước:**
- [ ] `export type Grade = 0 | 1 | 2;`
- [ ] `Topic` mới:
  ```ts
  'add-sub' | 'find-number' | 'carry' | 'comparison' | 'mixed' | 'tower'
  ```
- [ ] Thêm `LegacyTopic = 'addition' | 'subtraction'`.
- [ ] Thêm `HistoricalTopic = Topic | LegacyTopic`.
- [ ] Thêm `RangeTopic = 'add-sub' | 'find-number' | 'comparison'`.
- [ ] `ProgressState.completedByTopic: Partial<Record<HistoricalTopic, number>>`.
- [ ] `PlaySessionRecord.topic: HistoricalTopic` (đọc log cũ).
- [ ] `QuestionPlayLog.topic: HistoricalTopic`.
- [ ] Thêm `questionGrade?: Grade` vào `QuestionPlayLog`.
- [ ] Giữ nguyên `TemplateTopic` (không thêm `find-number`/`add-sub`).
- [ ] Chạy `tsc` để liệt kê toàn bộ chỗ vỡ type (dự kiến: `App.tsx`, `questions.ts`, `questionTemplateEngine.ts`).

**Lưu ý:**
- `Question.topic` vẫn là `Topic` (câu mới).
- `SessionQuestionResult.topic` vẫn là `Topic`.

**Kiểm tra:**
- [ ] `npx tsc --noEmit` báo lỗi đúng các file cần sửa, không lỗi lạ.
- [ ] Không còn chỗ nào khai báo `Grade = 1 | 2`.

---

### T2 — Config 3 cấp + accessor + migration storage

**Mục tiêu:** Gom toàn bộ phạm vi/thời gian/số câu vào `gameConfig`; migrate dữ liệu cũ.

**Files:**
- `src/game/gameConfig.ts`
- `src/utils/storage.ts`

**Các bước:**

#### T2.1 — Interfaces & config

- [ ] Thêm `RangeSpec { min; max; resultMax? }`.
- [ ] Thêm `GradeConstraint`.
- [ ] Thêm `questionsPerSession: { 0: 5, 1: 8, 2: 10 }`.
- [ ] Thêm `gradeRanges` đầy đủ cho 3 lớp (theo designs mục 4.2).
- [ ] Thêm `gradeConstraints`:
  - `0: { noCarry, noBorrow, resultMax: 10 }`
  - `1: { noCarry, noBorrow }`
  - `2: { addSubCarryRatio: 0.5, requireCarry, requireBorrow }`
- [ ] Thêm `timeLimits` 45/35/30 và 30/25/20.
- [ ] Thêm `addSub.mix = { addition: 0.5, subtraction: 0.5 }`.
- [ ] Thêm `comparisonMix` 3 lớp.
- [ ] Thêm `lowerGradeMix { ratio: 0.33, practiceOnly: true, excludedTopics: ['find-number','carry'] }`.
- [ ] Sửa `comparison.enabledForGrades = [0, 1, 2]`.
- [ ] Giữ `carry.enabledForGrades = [2]`.

#### T2.2 — Accessor

- [ ] `getSessionQuestionCount(grade)`.
- [ ] `getTopicRange(grade, topic, difficulty)`: xử lý `carry`, `mixed`, `tower`.
- [ ] `getTimeLimit(grade, difficulty)`.
- [ ] `getAttemptConfig(mode, grade?)`: grade 0 + practice → 3.

#### T2.3 — Migration storage

- [ ] `normalizeGrade()`: chỉ nhận 0/1/2, còn lại fallback 1.
- [ ] `normalizeCompletedByTopic()`: cộng dồn `addition` + `subtraction` → `add-sub`.
- [ ] Áp dụng trong `loadAppState()`.
- [ ] Giữ nguyên `defaultState` (thêm grade mặc định nếu cần).
- [ ] Không ghi lại log/session cũ.

**Kiểm tra:**
- [ ] Unit test thủ công: localStorage giả có `addition: 2, subtraction: 3` → load ra `add-sub: 5`.
- [ ] `profile.grade = 9` → fallback 1.
- [ ] `npm run build` pass.

---

### T3 — Engine: mapping, grade policy, quota, rule/constraint mới

**Mục tiêu:** Cho engine hiểu topic mới, áp phạm vi theo lớp, sinh đúng tỉ lệ.

**Files:**
- `src/game/questionTemplateEngine.ts`

> T3 là task lớn; chia thành 11 subtask. Có thể commit theo từng nhóm nhỏ.

#### T3.1 — Bỏ `getLimit`, dùng range config

- [ ] Xóa/đổi `getLimit(grade, difficulty)` → `getTopicRange(...)`.
- [ ] Cập nhật mọi nơi dùng `getLimit`: `passesConstraint`, `createChoices`, `applyComparisonPreference`.
- [ ] `clampVariables(variables, range)`: kẹp mọi biến `integer` vào `[min, max]`.

#### T3.2 — Mapping topic → template

- [ ] Thêm bảng `TOPIC_TEMPLATE_MAP`.
- [ ] Viết `resolveTemplateTopics(topic)`.
- [ ] Sửa `templateMatchesTopic` dùng mapping.
- [ ] Với `find-number`: lọc thêm tag `find-number`.
- [ ] Viết `effectiveTopicOf(template)` để grade policy biết câu thuộc nhóm nào.

#### T3.3 — Grade policy

- [ ] Viết `operationOf(rule, vars, answer)` trả `{ x, y, op, result }`.
- [ ] Viết `passesGradePolicy(...)`:
  - Grade 0: `result <= resultMax`, không âm, không nhớ/mượn.
  - Grade 1: không nhớ/không mượn.
  - Grade 2 `add-sub`: theo `carryNeed` (quota).
  - Grade 2 `find-number`/`comparison`/`carry`: bắt buộc nhớ/mượn.
- [ ] Gọi policy sau `evaluateAnswer` trong `makeQuestion`.

#### T3.4 — Quota plan

- [ ] Viết `planByWeights(count, weights, rng)` (largest remainder + shuffle).
- [ ] Viết `buildPlans(grade, topic, count, rng)`:
  - `operatorPlan` cho `add-sub`.
  - `carryPlan` cho grade 2 `add-sub`.
  - `formPlan` cho `comparison`.
- [ ] Thêm options vào `generateQuestionBatch`.
- [ ] Batch dùng plan theo index; retry giữ nguyên slot.

#### T3.5 — `add-sub`

- [ ] Chọn operator theo plan.
- [ ] Với grade 2, chọn `carryNeed` theo plan.
- [ ] Lọc template theo operator (`addition`/`subtraction`).
- [ ] Đảm bảo câu trừ không âm.
- [ ] Đảm bảo `add-sub` không lấy template `missing-number`/`comparison`.

#### T3.6 — `find-number`

- [ ] Thêm rule `missingMinuend` (`answer = result + a`).
- [ ] Map tag pattern → template.
- [ ] `allowedFindNumberTags(difficulty)`:
  - easy/medium: 2 tag cộng.
  - hard: 4 tag.
- [ ] Grade policy áp no-carry/no-borrow (L1) hoặc carry/borrow (L2).
- [ ] `mapQuestionType`: `find-number` + `auto/choice` → `multiple-choice`; `input` → `fill-number`.
- [ ] Fallback gọi `makeMissingEquationQuestion` với `range` + `allowedTags`.

#### T3.7 — `comparison`

- [ ] Thêm rule `compareExprNum`, `compareNumExpr`.
- [ ] Hỗ trợ biến `op` (`+`/`-`) trong context.
- [ ] Thêm constraint `exprNonNegative`.
- [ ] Thêm constraint `answerWithinLimit`.
- [ ] Sinh `c` quanh `exprValue` (delta ~15% range).
- [ ] Ép `=` bằng cách gán `c = exprValue` khi quota yêu cầu.
- [ ] Giữ đếm greater/equal/less và `comparisonSigns`.

#### T3.8 — Time limit

- [ ] `getTimeLimit(template, difficulty, grade)` đọc config.
- [ ] Câu số học dùng đúng config (Mầm non 45/35/30).
- [ ] Câu tương tác nhiều bước dùng `max(config, base)`.
- [ ] Không còn clamp 30/25/20 cho mọi câu.

#### T3.9 — Interactive policy

- [ ] Topic `comparison`: bỏ sort/clock/weekday/relative.
- [ ] Topic `mixed` grade ≥ 1: giữ sort/clock/weekday/relative.
- [ ] Topic `mixed` grade 0: chỉ add-sub + comparison.
- [ ] `carry`: giữ missing-equation carry.
- [ ] `find-number`: không sinh clock/date/sort.

#### T3.10 — Chống trùng & cache cặp số

- [ ] Cache cặp hợp lệ cho `add-sub` theo (grade, difficulty, operator, carryNeed).
- [ ] Sample không lặp trong session.
- [ ] Reset `usedKeys` khi hết cặp.
- [ ] Giữ `recentKeys` cho template.

#### T3.11 — Diagnostics & fallback

- [ ] `template_skipped` / `template_validation_error` vẫn hoạt động.
- [ ] Batch trả đủ `count` hoặc để `questions.ts` bù fallback.
- [ ] Không infinite loop: giới hạn retry giữ nguyên.

**Kiểm tra:**
- [ ] `npm run build` pass.
- [ ] Chạy thử: grade 0 / 1 / 2 × add-sub / comparison / find-number / carry.
- [ ] Log `template_skipped` không tăng bất thường ở grade 0 easy.
- [ ] 100 câu grade 2 add-sub cho 45–55% carry (script tạm hoặc T13).

---

### T4 — Templates JSON

**Mục tiêu:** Bổ sung/sửa template để engine có dữ liệu sinh câu.

**Files:**
- `src/data/questionTemplates.json`

#### T4.1 — Mầm non

- [ ] `addition-basic-no-carry`: `grade` thêm `0`.
- [ ] `subtraction-basic-no-borrow`: `grade` thêm `0`.
- [ ] Kiểm tra `noCarry`/`noBorrow`, `sumWithinLimit`/`differenceWithinLimit` vẫn đúng khi range = 5/8/10.

#### T4.2 — So sánh

- [ ] `comparison-two-numbers`: `grade` thêm `0`.
- [ ] Thêm `comparison-expr-left-add`.
- [ ] Thêm `comparison-expr-left-sub` (`exprNonNegative`).
- [ ] Thêm `comparison-expr-right-add`.
- [ ] Thêm `comparison-expr-right-sub` (`exprNonNegative`).
- [ ] Mỗi template có `variables.op` cố định (`['+']` hoặc `['-']`).
- [ ] `choicesRule: "comparisonSigns"`.
- [ ] `hintTemplate`/`solutionTemplate` tiếng Việt đúng cộng/trừ.

#### T4.3 — Tìm số

- [ ] `find-addend-right` (`A + ? = B`, tag `blank-right-add`).
- [ ] `find-addend-left` (`? + A = B`, tag `blank-left-add`).
- [ ] `find-subtrahend` (`A - ? = B`, tag `blank-right-subtract`, difficulty hard).
- [ ] `find-minuend` (`? - A = B`, tag `blank-left-subtract`, difficulty hard).
- [ ] Tất cả `grade: [1, 2]`, `topic: "missing-number"`, tags có `find-number`.
- [ ] Hint riêng từng pattern (theo yêu cầu 13.2).
- [ ] `validationExamples` có ít nhất 2 ví dụ/template.

#### T4.4 — Kiểm tra schema

- [ ] JSON parse hợp lệ.
- [ ] Không trùng `id`.
- [ ] `promptTemplate` chỉ dùng biến đã khai báo.
- [ ] `answerRule` thuộc danh sách rule engine hỗ trợ.
- [ ] `constraints` thuộc danh sách constraint engine hỗ trợ.

**Không làm:**
- [ ] Template word-problem cho `find-number` (optional) — **skip** trong iteration này trừ khi review yêu cầu.

**Kiểm tra:**
- [ ] `npm run build` pass.
- [ ] Sinh thử 10 câu mỗi template mới, không có diagnostic.

---

### T5 — Fallback questions

**Mục tiêu:** Luôn đủ câu kể cả khi template fail.

**Files:**
- `src/data/questions.ts`

**Các bước:**
- [ ] `generateQuestionSession` nhận `options { mode?, rng? }`.
- [ ] `fallbackQuestion` nhận range từ `getTopicRange`.
- [ ] Nhánh grade 0: cộng/trừ ≤10, không âm.
- [ ] Nhánh `add-sub`: random cộng/trừ.
- [ ] Nhánh `find-number`: 1 trong 4 dạng (theo difficulty).
- [ ] Nhánh `comparison`: `A __ B` hoặc biểu thức vs số.
- [ ] Fallback vẫn tạo `hint`, `solution`, `timeLimit` đúng.
- [ ] Giữ fallback carry hiện có.

**Kiểm tra:**
- [ ] Giả lập template rỗng (tạm thời) → vẫn đủ 5/8/10 câu.
- [ ] Câu fallback đúng phạm vi từng lớp.

---

### T6 — Setup: nút Mầm non + top-bar label

**Mục tiêu:** Cho phép chọn lớp 0 và hiển thị đúng.

**Files:**
- `src/App.tsx`

**Các bước:**
- [ ] Đổi `[1, 2].map` → `[0, 1, 2].map`.
- [ ] Label: `grade === 0 ? 'Mầm non' : 'Lớp ' + grade`.
- [ ] Subtitle riêng cho grade 0:
  `'Luyện cộng, trừ trong phạm vi 10 qua các thử thách vui nhộn.'`
- [ ] `renderTopBar`: `Mầm non` thay vì `Lớp 0`.
- [ ] Mặc định vẫn chọn Lớp 1 khi mở setup lần đầu.
- [ ] `updateProfile` lưu grade 0 bình thường.

**Kiểm tra:**
- [ ] Chọn Mầm non → vào Home → top-bar hiện "Mầm non".
- [ ] Refresh → vẫn giữ grade 0.
- [ ] Chọn Lớp 2 → subtitle và top-bar đúng.

---

### T7 — Map: node mới theo lớp

**Mục tiêu:** Bản đồ đúng cấu trúc từng cấp.

**Files:**
- `src/App.tsx`

**Các bước:**
- [ ] Xóa `addition`, `subtraction` khỏi `renderMap`.
- [ ] Danh sách node:
  - grade 0: `add-sub`, `comparison`, `mixed`, `tower`.
  - grade 1: `add-sub`, `find-number`, `comparison`, `mixed`, `tower`.
  - grade 2: `add-sub`, `find-number`, `carry`, `comparison`, `mixed`, `tower`.
- [ ] `topicName`/`topicDescription` dùng key mới.
- [ ] `getUnlocked`: bỏ 2 key cũ; `find-number`, `comparison` luôn mở.
- [ ] `getLockedReason` không nhận `addition`/`subtraction`.
- [ ] Class node dùng `add-sub`, `find-number`.
- [ ] Icon node (nếu có) giữ `✦`/`🔒`; optional `🔍` cho find-number.

**Kiểm tra:**
- [ ] 3 lớp hiện đúng số node và thứ tự.
- [ ] Node khóa `mixed`/`tower` vẫn hoạt động.
- [ ] Không còn chữ "Cộng"/"Trừ" riêng lẻ trên map.

---

### T8 — Home: dọn UI

**Mục tiêu:** Bỏ nút export và thông tin log khỏi màn Home.

**Files:**
- `src/App.tsx`

**Các bước:**
- [ ] Xóa nút `Xuất log (N)`.
- [ ] Xóa nút `Lưu lịch sử chơi (N)`.
- [ ] Xóa `<p className="storage-note">…</p>`.
- [ ] Xóa 2 stat card "Log câu hỏi", "Lượt chơi đã lưu".
- [ ] Giữ 6 stat card còn lại.
- [ ] Bỏ import `exportQuestionLogs`, `exportSessionRecordsAsJson` nếu không dùng.
- [ ] Giữ state `logCount`, `sessionCount` (dùng nội bộ).
- [ ] Không xóa hàm trong utils.

**Kiểm tra:**
- [ ] Home không còn 2 nút và note.
- [ ] Stats grid còn 6 ô.
- [ ] `npm run build` pass (không lỗi unused import nếu bật).

---

### T9 — Theme Practice/Challenge + attempts Mầm non

**Mục tiêu:** Phân biệt 2 chế độ và cho Mầm non 3 lần thử.

**Files:**
- `src/App.tsx`
- `src/styles.css` (một phần, chi tiết ở T11)

**Các bước:**
- [ ] Thêm `data-mode={mode}` và `data-grade={grade}` ở `.app-shell`.
- [ ] `getAttemptConfig(mode, grade)` — truyền grade ở `evaluateAnswer`.
- [ ] Mầm non Practice: 3 lần thử; Challenge vẫn 1.
- [ ] Feedback copy theo grade (helper `getFeedback(grade, kind)`):
  - đúng, sai/retry, timeout, hoàn thành.
- [ ] Result: copy thân thiện cho grade 0.
- [ ] Selection: nhãn thời gian theo `getTimeLimit(grade, difficulty)`.
- [ ] Note carry chỉ hiện grade 2.

**Kiểm tra:**
- [ ] Mầm non Practice sai lần 1 → còn lần 2, 3; hint hiện sau lần sai đầu.
- [ ] Mầm non Challenge sai → kết thúc câu ngay.
- [ ] Lớp 1 Practice vẫn 2 lần.
- [ ] Selection hiện 45/35/30 cho Mầm non.

---

### T10 — Xen bài cấp dưới

**Mục tiêu:** Practice có ≤33% câu cấp dưới, Challenge 0%.

**Files:**
- `src/data/questions.ts`
- `src/App.tsx` (truyền `mode`)

**Các bước:**
- [ ] `generateQuestionSession` nhận `mode`.
- [ ] `topicAvailable(grade, topic)`.
- [ ] Tính `lowerCount = randomInt(0, floor(count * 0.33))`.
- [ ] Lớp 1: lấy từ grade 0.
- [ ] Lớp 2: chia ngẫu nhiên grade 1 / grade 0.
- [ ] Bù câu nếu cấp dưới không đủ.
- [ ] Shuffle toàn bộ.
- [ ] Không áp dụng cho `find-number`, `carry`.
- [ ] `startSession` truyền `{ mode }`.
- [ ] `Question.grade` giữ lớp sinh câu.

**Kiểm tra:**
- [ ] 30 lượt Lớp 1 Practice: không lượt nào > 33% câu Mầm non.
- [ ] Challenge: 0% câu cấp dưới.
- [ ] Lớp 1 chọn Tìm số: 100% câu Lớp 1.
- [ ] Lớp 2 chọn Cộng/Trừ: có thể có câu Lớp 1/Mầm non, không vượt 3/10.

---

### T11 — CSS: node mới, theme, typography Mầm non

**Mục tiêu:** Giao diện đúng thiết kế, không phá responsive.

**Files:**
- `src/styles.css`

**Các bước:**
- [ ] Thêm token `--practice`, `--practice-soft`, `--challenge`, `--challenge-soft`.
- [ ] `[data-mode='practice'|'challenge']` set `--accent`, `--accent-soft`.
- [ ] `.map-node.add-sub`, `.map-node.find-number`.
- [ ] Xóa `.map-node.addition`, `.map-node.subtraction`.
- [ ] Theme áp cho `.panel`, `.quiz-panel`, `.map-node`, `.primary-button`.
- [ ] `[data-grade='0']`: câu hỏi lớn hơn ~20%, nút đáp án min-height 64px.
- [ ] Map grade 0: node cao hơn, chữ lớn hơn.
- [ ] Responsive: 6 node không tràn; phone 1 cột.
- [ ] Kiểm tra contrast chữ trên nền xanh/cam.
- [ ] Không đổi breakpoint hiện có.

**Kiểm tra:**
- [ ] Desktop / tablet / phone: map 4–6 node hiển thị đẹp.
- [ ] Mầm non: câu hỏi và đáp án dễ đọc, không tràn.
- [ ] Theme đổi rõ giữa Practice và Challenge.
- [ ] Không có scroll ngang trên phone.

---

### T12 — Badge mới + scale threshold

**Mục tiêu:** Badge đúng theo số câu mới.

**Files:**
- `src/App.tsx`

**Các bước:**
- [ ] `badgeLabels`: thêm `add_sub_star`, `find_number_star`.
- [ ] Giữ label `addition_star`, `subtraction_master` cho dữ liệu cũ.
- [ ] `getBadges(topic, correctCount, total, completedBefore)`.
- [ ] `perfect_run` khi `correctCount === total`.
- [ ] `add_sub_star` thay 2 badge cộng/trừ.
- [ ] `find_number_star` khi perfect.
- [ ] `carry_master`, `comparison_eye` khi perfect.
- [ ] `tower_wisdom` khi `correctCount >= ceil(total * 0.8)`.
- [ ] `finishSession` reward:
  - perfect → +50.
  - ≥80% → +20.
- [ ] Result hiển thị badge mới.

**Kiểm tra:**
- [ ] Mầm non 5/5 → perfect_run + add_sub_star (nếu topic add-sub).
- [ ] Lớp 1 7/8 → tower_wisdom (80% = 7).
- [ ] Lớp 2 8/10 → tower_wisdom.
- [ ] Badge cũ trong localStorage vẫn hiển thị.

---

### T13 — Vitest + test matrix + QA thủ công

**Mục tiêu:** Chứng minh các AC bằng test tự động và smoke test.

**Files:**
- `package.json`
- `vitest.config.ts`
- `src/game/__tests__/*.test.ts`
- `src/data/__tests__/*.test.ts`
- `src/utils/__tests__/*.test.ts`
- `src/game/questionTemplateEngine.ts` (hook RNG)

**Các bước:**

#### T13.1 — Setup

- [ ] `npm i -D vitest`.
- [ ] Thêm script `"test": "vitest run"`, `"test:watch": "vitest"`.
- [ ] Tạo `vitest.config.ts` (`environment: 'node'`).
- [ ] Thêm `setRandomSource()` (chỉ dùng test).

#### T13.2 — Test files

- [ ] `gradePolicy.test.ts`: phạm vi 3 lớp, carry/borrow.
- [ ] `addSub.test.ts`: 50/50, grade 2 50% carry, không âm.
- [ ] `findNumber.test.ts`: 4 pattern, gating theo difficulty, carry L2.
- [ ] `comparison.test.ts`: 3 form, quota, dấu `=`.
- [ ] `session.test.ts`: count 5/8/10, xen cấp dưới, practice-only.
- [ ] `storage.test.ts`: migration `completedByTopic`, grade fallback.
- [ ] `badges.test.ts`: threshold perfect/80%.
- [ ] `fallback.test.ts`: luôn đủ câu.

#### T13.3 — QA thủ công

- [ ] Ma trận 3 lớp × 6 topic × 3 độ khó × 2 mode (xem mục 5).
- [ ] Kiểm tra Home, Setup, Map, Selection, Quiz, Result.
- [ ] Kiểm tra responsive desktop/tablet/phone.
- [ ] Kiểm tra localStorage cũ (grade 1/2, topic addition).
- [ ] Kiểm tra dev server ghi `data/play-sessions.json`.
- [ ] Kiểm tra export log/history vẫn chạy (dù không còn nút).
- [ ] `npm run build` pass.

**Kiểm tra:**
- [ ] `npm test` pass toàn bộ.
- [ ] Không test nào flaky khi chạy 3 lần.
- [ ] Báo cáo QA ghi rõ case fail (nếu có).

---

### T14 — README, specs, đóng gói

**Mục tiêu:** Tài liệu khớp hành vi mới.

**Files:**
- `README.md`
- `data/update-screen-game/requirements.md` (đánh dấu trạng thái)
- `data/update-screen-game/designs.md` (nếu có điều chỉnh)
- `data/update-screen-game/tasks.md` (cập nhật trạng thái)

**Các bước:**
- [ ] README: bỏ mô tả nút "Lưu lịch sử chơi".
- [ ] README: giữ mô tả auto-ghi `data/play-sessions.json` khi dev.
- [ ] README: cập nhật cấu trúc thư mục (ảnh trong `src/assets/images/`).
- [ ] README: thêm mục 3 cấp lớp + topic mới.
- [ ] README: thêm lệnh `npm test`.
- [ ] Đánh dấu requirements: "Đã triển khai" + ngày.
- [ ] Cập nhật bảng trạng thái tasks.md.
- [ ] Ghi chú backlog còn lại.

**Kiểm tra:**
- [ ] README không còn thông tin sai.
- [ ] Link giữa requirements ↔ designs ↔ tasks hoạt động.
- [ ] Không có file tạm trong PR.

---

## 5. Ma trận QA thủ công

### 5.1 Smoke test theo lớp

| Lớp | Setup | Map | Add-sub | Find-number | Carry | Comparison | Mixed | Tower |
|---|---|---|---|---|---|---|---|---|
| Mầm non | ✅ | 4 node | Dễ/Vừa/Khó | — | — | `A __ B` | add-sub + so sánh | khóa/mở |
| Lớp 1 | ✅ | 5 node | 3 mức | 4 dạng ở Khó | — | 3 form | 3 topic | khóa/mở |
| Lớp 2 | ✅ | 6 node | 50% carry | 4 dạng ở Khó + carry | 100% carry | 3 form + carry | 4 topic | khóa/mở |

### 5.2 Case bắt buộc

- [ ] Mầm non Dễ: 5 câu, a/b ≤ 5, kết quả ≤ 10, không âm.
- [ ] Mầm non Vừa: a/b ≤ 8.
- [ ] Mầm non Khó: a/b ≤ 10.
- [ ] Mầm non So sánh: 100% `A __ B`, ≤ 10.
- [ ] Lớp 1 Cộng/Trừ Vừa: ≤ 50, không nhớ.
- [ ] Lớp 1 Tìm số Dễ: 2 dạng cộng, < 10, không nhớ.
- [ ] Lớp 1 Tìm số Khó: đủ 4 dạng, < 100, không nhớ.
- [ ] Lớp 2 Cộng/Trừ: 50% có nhớ.
- [ ] Lớp 2 Tìm số: có nhớ/mượn.
- [ ] Lớp 2 So sánh: biểu thức có nhớ.
- [ ] Practice Lớp 1: có câu Mầm non, ≤ 33%.
- [ ] Challenge: không có câu cấp dưới.
- [ ] Home: 6 stat card, không nút log.
- [ ] Refresh: giữ profile + progress.
- [ ] Logout + xóa dữ liệu: reset đúng.
- [ ] Dev: `data/play-sessions.json` được ghi.

### 5.3 Responsive

- [ ] Desktop ≥ 1024px.
- [ ] Tablet 600–899px.
- [ ] Phone ≤ 599px.
- [ ] Landscape phone (max-height 600px).
- [ ] Không scroll ngang; tap target ≥ 48px.

---

## 6. Traceability AC → Task

| AC | Task chính |
|---|---|
| AC1 Cấu trúc thư mục | T0 |
| AC2 Mầm non hiển thị | T1, T6, T7, T11 |
| AC3 Phạm vi add-sub Mầm non | T2, T3 |
| AC4 Ghép Cộng/Trừ | T1, T7 |
| AC5 Add-sub sinh 2 dạng | T3, T4 |
| AC6 Bỏ nút log | T8 |
| AC7 Tìm số Lớp 1 | T3, T4 |
| AC8 Tìm số Lớp 2 | T3, T4 |
| AC9 So sánh Mầm non | T3, T4 |
| AC10 So sánh Lớp 1 | T3, T4 |
| AC11 So sánh Lớp 2 | T3, T4 |
| AC12 Xen cấp dưới | T10 |
| AC13 Lớp 1 giữ phạm vi | T2, T3 |
| AC14 Lớp 2 giữ carry | T2, T3 |
| AC15 Tổng hợp & Thông thái | T3, T7 |
| AC16 Số câu/lượt | T2, T9, T13 |
| AC17 Lớp 2 add-sub 50% carry | T2, T3, T13 |
| AC18 Migration topic | T2, T13 |
| AC19 Test tự động | T13 |

---

## 7. Checklist review kế hoạch

- [ ] Đồng ý chia T3 thành 11 subtask như trên.
- [ ] Đồng ý bỏ template word-problem cho `find-number` (T4).
- [ ] Đồng ý test AC "50 câu" bằng nhiều session 5/8/10 câu.
- [ ] Đồng ý thêm `vitest` và script `test`.
- [ ] Đồng ý giữ câu giờ/thứ/sắp xếp trong `mixed` Lớp 1–2 (D5).
- [ ] Đồng ý không đổi `vite.config.ts` / không move `play-sessions.json`.
- [ ] Đồng ý PR strategy:
  - PR1: T0 + T8 (độc lập, rủi ro thấp).
  - PR2: T1 + T2 + T3 + T4 + T5 (engine/data).
  - PR3: T6 + T7 + T9 + T10 + T11 + T12 (UI).
  - PR4: T13 + T14 (test/docs).

---

## 8. Rủi ro cần theo dõi

| Rủi ro | Task | Cách xử lý |
|---|---|---|
| Grade 0 Dễ thiếu câu unique | T3.10 | Cache cặp + cho phép lặp giữa session |
| Quota carry không sinh đủ | T3.4 | Fallback + nới range |
| Ép `=` xung đột no-carry | T3.7 | Chọn `c = exprValue` sau khi có `a`, `b` |
| Type vỡ lan rộng | T1 | Sửa theo danh sách `tsc` báo |
| Migration sai dữ liệu | T2 | Test với localStorage giả, không ghi đè |
| Theme làm giảm contrast | T11 | Chỉ đổi accent, giữ `--ink` |
| Test flaky do random | T13 | Hook RNG + assert khoảng tin cậy |
| Quên cập nhật badge | T12 | Test 5/5, 7/8, 8/10 |

---

## 9. Ghi chú triển khai

- Mọi thay đổi hành vi phải có test hoặc case QA tương ứng.
- Không sửa trực tiếp dữ liệu thật trong `data/play-sessions.json`.
- Khi test migration: dùng localStorage giả hoặc profile mới, không xóa dữ liệu người chơi thật.
- Nếu phát hiện requirement mâu thuẫn trong lúc code: dừng, cập nhật `requirements.md` + `designs.md` trước khi tiếp tục.
