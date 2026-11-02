# Thiết kế kỹ thuật — Responsive iPad, Đăng xuất, Trả lời lại, Focus khi chuyển câu

- **Trạng thái:** Đã duyệt và triển khai (29/10/2026); QA bằng mô phỏng viewport, chưa kiểm tra iPad thật
- **Ngày tạo:** 28/10/2026
- **Tài liệu gốc:** `requirements-update-responsive.md`
- **Tài liệu liên quan:** `specs/design.md`, `specs/system-design.md`, `specs/wireframes-and-visual-design.md`, `specs/tasks-update-responsive.md`
- **Phạm vi kỹ thuật:** React 18 + TypeScript + CSS thuần, không thêm dependency, không đổi backend.

> **Giả định:** Tài liệu này áp dụng toàn bộ phương án đề xuất tại `requirements-update-responsive.md` mục 11 (Q1–Q11). Nếu có quyết định thay đổi, cập nhật bảng D1–D16 dưới đây trước khi code.

---

## 1. Quyết định thiết kế đã khoá

| # | Quyết định | Giá trị |
|---|---|---|
| D1 | Breakpoint | Phone `≤ 599px`, tablet dọc `600–899px`, tablet ngang/small laptop `900–1199px`, desktop `≥ 1200px` |
| D2 | Breakpoint phụ | Phone rất nhỏ `≤ 359px`; landscape thấp `(orientation: landscape) and (max-height: 600px)` |
| D3 | Đăng xuất giữ tiến độ? | **Có**, mặc định giữ; modal có checkbox xoá toàn bộ dữ liệu (mặc định tắt) |
| D4 | Vị trí nút Đăng xuất | Cuối top bar, nhóm cùng nút Âm thanh trong `.top-actions` |
| D5 | Số lượt trả lời Luyện tập | `2` cho **mọi** dạng câu, kể cả trắc nghiệm |
| D6 | Số lượt trả lời Thử thách | `1` |
| D7 | Gợi ý | Hiện ngay sau lần sai đầu, **chỉ Luyện tập**; reset mỗi câu |
| D8 | Hết giờ | Không cho retry ở cả 2 chế độ |
| D9 | Điểm | Đúng lần 1 `+10`, đúng lần 2 `+5`; sai 3 câu liên tiếp `−5` |
| D10 | Cấu hình | `gameConfig.attempts` là nguồn duy nhất; **không** thêm block `hint` trùng lặp |
| D11 | Owl trên tablet | Compact (hàng ngang) ở Home/Quiz/Result; ẩn trong Quiz khi landscape thấp |
| D12 | Desktop | Giữ nguyên bố cục hiện tại; chỉ tinh chỉnh nếu cần để không regression |
| D13 | Drag & drop | Giữ HTML5 drag cho desktop, đồng thời đảm bảo fallback chạm hoạt động trên iPad |
| D14 | Reset vị trí cuộn | Về đầu trang khi đổi `page` hoặc `currentIndex` |
| D15 | Thư viện mới | Không dùng; modal, hint, responsive đều bằng React + CSS hiện có |
| D16 | Focus khi chuyển câu | Blur phần tử đang focus; đưa focus về `.question-box` (`tabIndex={-1}`, `preventScroll`); không auto-focus đáp án/ô nhập |

---

## 2. Kiến trúc tổng thể

### 2.1. Luồng dữ liệu hiện tại (giữ nguyên)

```text
localStorage
  ├─ owl_math_game_profile_v1        → loadAppState() → AppState
  ├─ owl_math_game_sessions_v1       → sessionHistory
  └─ owl_math_game_question_logs_v1  → appLogger

App.tsx (state machine của màn hình + phiên chơi)
  ├─ generateQuestionSession()  → Question[]
  ├─ renderSetup/Home/Map/Selection/Quiz/Result
  ├─ evaluator + timer + scoring
  └─ saveAppState / saveSessionRecord / appendQuestionLog
```

### 2.2. Thay đổi kiến trúc

Không thay đổi kiến trúc. Chỉ mở rộng:

1. **Lớp trình bày:** thêm tầng CSS tablet, top bar mới, modal, hint card.
2. **Lớp state của App:** thêm state phục vụ retry, logout, chống bấm đúp và quản lý focus (`questionRef`).
3. **Lớp cấu hình:** thêm `gameConfig.attempts`.
4. **Lớp log:** thêm field tuỳ chọn, không phá schema cũ.

### 2.3. Trách nhiệm từng file

| File | Trách nhiệm sau thay đổi |
|---|---|
| `src/App.tsx` | Điều phối màn hình, top bar, modal, state machine trả lời, hint, logout, focus khi chuyển câu |
| `src/styles.css` | Toàn bộ breakpoint, layout tablet/phone, top bar, hint card, modal, dvh/safe-area |
| `src/game/gameConfig.ts` | `attempts.practice/challenge` |
| `src/types.ts` | Field tuỳ chọn `retried`, `hintText` |
| `src/utils/appLogger.ts` | Ghi `attemptCount`, `hintShown`, `retried` (tuỳ chọn) |
| `index.html` | `viewport-fit=cover` |
| `README.md`, `requirements*.md`, `specs/*` | Cập nhật tài liệu |

---

## 3. Hệ thống responsive

### 3.1. Breakpoint và token

| Token / tầng | Giá trị | Ghi chú |
|---|---|---|
| `--app-max` | `1120px` | Giữ nguyên |
| `--app-pad` | `20px` desktop, `16px` tablet, `12px` phone | Dùng `clamp()` hoặc media |
| `--tap-min` | `48px` | Vùng chạm tối thiểu |
| `--topbar-h` | `auto` (không cần cố định) | Quiz dùng top bar static |
| Phone | `≤ 599px` | 2 hàng top bar; stats 2 cột; map 2 cột |
| Tablet dọc | `600–899px` | 1 cột nội dung chính; stats 4 cột; map 2–3 cột |
| Tablet ngang | `900–1199px` | 2 cột như desktop; giảm padding |
| Desktop | `≥ 1200px` | Giữ nguyên |

**Quy ước:** CSS hiện tại là desktop-first. Giữ hướng này để giảm rủi ro; thay `@media (max-width: 820px)` bằng `@media (max-width: 899px)` và thay `@media (max-width: 560px)` bằng `@media (max-width: 599px)`.

### 3.2. Global CSS

```css
:root {
  --app-max: 1120px;
  --tap-min: 48px;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body,
#root {
  min-height: 100vh;      /* fallback */
  min-height: 100dvh;
}

.app-shell {
  width: min(var(--app-max), 100%);
  min-height: 100dvh;
  margin: 0 auto;
  padding:
    max(20px, env(safe-area-inset-top))
    max(20px, env(safe-area-inset-right))
    max(20px, env(safe-area-inset-bottom))
    max(20px, env(safe-area-inset-left));
}

@media (max-width: 899px) {
  .app-shell {
    padding:
      max(16px, env(safe-area-inset-top))
      max(16px, env(safe-area-inset-right))
      max(16px, env(safe-area-inset-bottom))
      max(16px, env(safe-area-inset-left));
  }
}

@media (max-width: 599px) {
  .app-shell {
    padding:
      max(12px, env(safe-area-inset-top))
      max(12px, env(safe-area-inset-right))
      max(12px, env(safe-area-inset-bottom))
      max(12px, env(safe-area-inset-left));
  }
}

button,
.number-tile,
.sort-slot {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Chỉ bật hover khi có chuột */
@media (hover: hover) and (pointer: fine) {
  .primary-button:hover,
  .secondary-button:hover,
  .option-card:hover,
  .answer-button:hover,
  .segmented button:hover,
  .map-node:hover {
    transform: translateY(-2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

Ghi chú:
- Padding `max(12px, env(...))` đơn giản và đủ an toàn; có thể dùng `calc()` nếu muốn cộng thêm.
- Không đặt `overflow-x: hidden` toàn cục để tránh che lỗi layout; xử lý bằng `min-width: 0` và grid đúng.

### 3.3. Top bar

#### 3.3.1. Cấu trúc JSX

```tsx
<div className={`top-bar ${page === 'quiz' ? 'top-bar-static' : ''}`}>
  <button
    className="icon-button top-home"
    type="button"
    onClick={() => setPage('home')}
    title="Trang chủ"
    aria-label="Trang chủ"
  >
    ⌂
  </button>

  <div className="top-identity">
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

  <div className="top-actions">
    <button className="icon-button" type="button" onClick={toggleSound} title="Âm thanh" aria-label="Bật/tắt âm thanh">
      {state.profile?.soundEnabled ?? playerSoundEnabled ? '🔊' : '🔇'}
    </button>
    <button className="logout-button" type="button" onClick={requestLogout} title="Đăng xuất" aria-label="Đăng xuất">
      <span aria-hidden="true">🚪</span>
      <span className="logout-label">Đăng xuất</span>
    </button>
  </div>
</div>
```

**Thay đổi so với hiện tại:**
- Bỏ cách ẩn theo `nth-child`.
- Gộp Âm thanh + Đăng xuất vào `.top-actions` (1 cột grid).
- Thêm class cho từng vùng.

#### 3.3.2. CSS desktop / tablet ngang

```css
.top-bar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 8px;
  box-shadow: 0 8px 0 rgba(36, 52, 71, 0.08);
  backdrop-filter: blur(6px);
}

.top-bar-static {
  position: static;
}

.top-identity {
  min-width: 0;
}

.top-identity strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.logout-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 58px;
  padding: 10px 16px;
  border-radius: 8px;
  background: #fff0ec;
  color: #b6422e;
  box-shadow: 0 5px 0 rgba(182, 66, 46, 0.18);
  cursor: pointer;
  font-weight: 850;
}
```

> `.top-bar-static` dùng cho màn Quiz để `.quiz-status` có thể sticky ở `top: 0` mà không bị top bar che.

#### 3.3.3. CSS tablet dọc (600–899)

```css
@media (max-width: 899px) {
  .top-bar {
    grid-template-columns: 48px minmax(0, 1fr) auto auto auto;
    gap: 10px;
    padding: 10px 12px;
  }

  .top-bar .icon-button {
    width: 48px;
    height: 48px;
    font-size: 1.6rem;
  }

  .logout-button {
    min-height: 48px;
    width: 48px;
    padding: 0;
  }

  .logout-label {
    display: none;
  }

  .top-score span,
  .top-challenge span {
    display: none;
  }

  .top-challenge {
    padding: 6px 10px;
  }
}
```

#### 3.3.4. CSS phone (≤ 599)

```css
@media (max-width: 599px) {
  .top-bar {
    position: static;
    grid-template-columns: 48px minmax(0, 1fr) auto;
    grid-template-areas:
      "home identity actions"
      "score challenge challenge";
    gap: 8px;
    padding: 10px;
  }

  .top-home { grid-area: home; }
  .top-identity { grid-area: identity; }
  .top-actions { grid-area: actions; }
  .top-score { grid-area: score; justify-items: start; text-align: left; }
  .top-challenge { grid-area: challenge; justify-items: end; text-align: right; }
}

@media (max-width: 359px) {
  .top-bar {
    grid-template-areas:
      "home identity actions"
      "score score score";
  }

  .top-challenge {
    display: none;
  }
}
```

- Ở phone, top bar không sticky để tiết kiệm chiều cao.
- Nút Đăng xuất chỉ còn icon nhưng vẫn có `aria-label`.

### 3.4. Layout từng màn

#### 3.4.1. Setup

**Hiện tại:** 2 cột (`1.1fr` + `minmax(320px, 0.8fr)`), `min-height: calc(100vh - 40px)`.

**Thiết kế:**

```css
@media (max-width: 899px) {
  .hero-card {
    grid-template-columns: 1fr;
    min-height: auto;
    gap: 18px;
  }

  .hero-card > section:last-child {
    width: min(100%, 640px);
    margin: 0 auto;
  }

  h1 {
    font-size: clamp(2.2rem, 6vw, 3.4rem);
  }
}
```

- Nội dung giới thiệu + owl hiển thị trước, form sau (đúng DOM hiện tại).
- Không còn khoảng trống do `100vh`.

#### 3.4.2. Home

```css
@media (max-width: 899px) {
  .home-layout {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .cta-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .owl-panel {
    grid-template-columns: auto minmax(0, 1fr);
    justify-items: start;
    align-items: center;
    text-align: left;
    min-height: auto;
    padding: 16px;
  }

  .owl {
    width: 96px;
    height: 110px;
    gap: 6px;
  }

  .owl-face {
    width: 76px;
    height: 44px;
    gap: 8px;
  }

  .owl-belly {
    width: 48px;
    height: 38px;
    font-size: 1.2rem;
  }

  .owl-ear {
    width: 28px;
    height: 28px;
    top: -8px;
  }

  .owl-ear.left { left: 16px; }
  .owl-ear.right { right: 16px; }
}

@media (max-width: 599px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cta-row {
    grid-template-columns: 1fr;
  }
}
```

#### 3.4.3. Map

```css
@media (max-width: 899px) {
  .map {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow-x: visible;
    min-height: auto;
    padding: 14px;
  }

  .map-node {
    min-height: 150px;
  }
}

@media (max-width: 599px) {
  .map {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .map-node {
    min-height: 132px;
    padding: 12px;
  }

  .map-node span {
    font-size: 1.5rem;
  }
}
```

- 5 node trên tablet dọc sẽ thành 3 + 2; chấp nhận được, không cuộn ngang.
- Nếu design muốn cân đối hơn, có thể dùng 2 cột ở tablet dọc; chốt với QA sau khi xem ảnh thật.

#### 3.4.4. Selection

```css
@media (max-width: 899px) {
  .option-grid.three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .option-grid,
  .option-grid.three {
    grid-template-columns: 1fr;
  }
}
```

#### 3.4.5. Quiz

**Cấu trúc mới trong `.quiz-panel`:**

```tsx
<div className="quiz-status">
  <div className="quiz-meta">
    <span>Câu {currentIndex + 1}/10</span>
    <span>⭐ {score}</span>
    <span className={timer <= 5 ? 'danger-text' : ''}>{timer}s</span>
  </div>
  <div className="progress-track">...</div>
  <div className="timer-track">...</div>
</div>

<div className="challenge-progress">...</div>
<div
  className={`question-box ...`}
  ref={questionRef}
  tabIndex={-1}
>
  {questionPrompt}
</div>
{showHint && ...}
{renderAnswerInput()}
{feedback && ...}
```

**CSS:**

```css
.quiz-status {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  gap: 10px;
  padding: 8px 0 10px;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(4px);
}

@media (max-width: 899px) {
  .quiz-layout {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .quiz-panel {
    padding: 18px;
  }

  .question-box {
    min-height: 124px;
  }

  .choice-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .answer-button {
    min-height: 78px;
  }
}

@media (max-width: 599px) {
  .quiz-panel {
    padding: 14px;
    gap: 14px;
  }

  .question-box {
    min-height: 110px;
  }

  .question-box.long-question {
    min-height: 104px;
  }

  .choice-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .choice-grid.signs {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .relative-targets {
    grid-template-columns: 1fr;
  }

  .answer-button {
    min-height: 72px;
    padding: 12px;
  }

  .answer-input {
    grid-template-columns: 1fr auto;
  }
}

@media (max-width: 359px) {
  .choice-grid,
  .relative-targets {
    grid-template-columns: 1fr;
  }

  .answer-input {
    grid-template-columns: 1fr;
  }
}

@media (orientation: landscape) and (max-height: 600px) {
  .quiz-layout .owl-panel {
    display: none;
  }

  .quiz-panel,
  .panel {
    padding: 12px;
  }

  .question-box {
    min-height: 88px;
  }

  .quiz-status {
    gap: 6px;
    padding: 4px 0 8px;
  }
}
```

**Ghi chú quan trọng:**
- `.quiz-status` sticky ở `top: 0`; vì vậy trong Quiz, top bar dùng `.top-bar-static`.
- Không sticky toàn bộ `.quiz-panel` để tránh chiếm chiều cao.
- Trên tablet dọc, owl nằm sau quiz panel; compact nên không đẩy nội dung quá dài.
- Bàn phím ảo: input + nút Trả lời nằm trong luồng tài liệu, không dùng `position: fixed`; đảm bảo khi focus vẫn nhìn thấy nút.

#### 3.4.6. Result

```css
@media (max-width: 899px) {
  .result-layout {
    grid-template-columns: 1fr;
  }

  .result-layout .panel {
    order: 1;
  }

  .result-layout .owl-panel {
    order: 2;
  }
}

@media (max-width: 599px) {
  .result-grid {
    grid-template-columns: 1fr;
  }

  .result-layout .cta-row {
    grid-template-columns: 1fr;
  }
}
```

### 3.5. Hành vi cuộn và focus khi chuyển câu

Thêm effect trong `App.tsx`:

```ts
useEffect(() => {
  window.scrollTo(0, 0);
}, [page, currentIndex]);
```

- Khi sang câu mới hoặc đổi màn → luôn thấy phần đầu.
- Khi hint xuất hiện, **không** scroll lên đầu; dùng ref của hint:

```ts
const hintRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  if (showHint) hintRef.current?.scrollIntoView({ block: 'nearest' });
}, [showHint]);
```

#### 3.5.1. Focus khi chuyển câu

**Vấn đề:** React dùng lại DOM của các nút đáp án giữa các câu. Nếu trẻ vừa bấm/Enter vào đáp án thứ 2, khi câu mới render, trình duyệt vẫn giữ `document.activeElement` ở nút thứ 2 → viền focus xuất hiện trên đáp án của câu mới dù trẻ chưa chọn. Với câu nhập số, focus và bàn phím ảo có thể còn nguyên.

**Giải pháp:**

```tsx
const questionRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  if (page !== 'quiz' || showLogoutConfirm) return;

  // Bỏ focus khỏi đáp án/ô nhập/nút của câu cũ.
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body) {
    active.blur();
  }

  // Đưa focus về đề bài để trình đọc màn hình đọc câu mới.
  questionRef.current?.focus({ preventScroll: true });
}, [page, currentIndex, showLogoutConfirm]);
```

```tsx
<div className="question-box" ref={questionRef} tabIndex={-1}>
  {questionPrompt}
</div>
```

```css
.question-box:focus {
  outline: none; /* vùng đọc, không phải nút bấm */
}
```

**Quy tắc:**

1. Chỉ chạy khi `page === 'quiz'`; không chạy khi hiện hint hoặc đổi state retry.
2. Phụ thuộc `[page, currentIndex, showLogoutConfirm]`, **không** phụ thuộc `showHint`/`attemptCount` để tránh cướp focus giữa lượt.
3. Tạm dừng khi `showLogoutConfirm === true` để modal giữ focus, kể cả khi timer làm `currentIndex` đổi trong lúc modal mở.
4. Blur trước, focus sau; `preventScroll: true` để không đánh nhau với effect scroll-to-top.
5. Không auto-focus đáp án đầu tiên hoặc ô nhập.
6. Không đổi `key` của đáp án chỉ để xử lý focus.
7. Khi đóng modal và vẫn ở Quiz, effect chạy lại và trả focus về khung đề (an toàn vì nút trong modal đã bị loại bỏ khỏi DOM).
8. Với câu nhập số, blur input làm bàn phím ảo đóng trước khi focus khung đề.

**Kiểm tra nhanh trong console:**

```js
document.activeElement?.className; // phải là "question-box ..."
```

### 3.6. iPad / iOS Safari

| Vấn đề | Cách xử lý |
|---|---|
| Thanh địa chỉ động | `100dvh` + fallback `100vh` |
| Safe area | `env(safe-area-inset-*)`, `viewport-fit=cover` |
| Hover dính | Chỉ bật hover trong `(hover: hover) and (pointer: fine)` |
| HTML5 drag không chạy bằng ngón tay | Giữ fallback chạm: chọn thẻ → chạm ô; thêm style `.selected` rõ ràng |
| Double-tap | `touch-action: manipulation` + `answerLockRef` |
| Xoay màn hình | Không reset state; layout dùng grid/flex tự co giãn |
| Bàn phím ảo | Không dùng `position: fixed` cho input/button; giảm padding khi focus nếu cần |
| Zoom | Không đặt `user-scalable=no`; input giữ `font-size ≥ 16px` |

### 3.7. Wireframe tham khảo

**Home — iPad dọc (820×1180)**

```text
┌────────────────────────────────────────────────────┐
│ ⌂   Minh Anh / Lớp 2   ⭐ 30   🏆 12   🔊   🚪      │
├────────────────────────────────────────────────────┤
│ Nhà Cú Mèo                                         │
│ Cú Mèo Toán Học                                    │
│ Hôm nay mình cùng thắp sáng khu rừng nhé!          │
│ [ Luyện tập ]  [ Thử thách ]                       │
│ [ Xuất log ]   [ Lưu lịch sử chơi ]                │
│                                                    │
│ ┌──────┬──────────────────────────────────┐        │
│ │  🦉  │ Hôm nay mình cùng thắp sáng...    │        │
│ └──────┴──────────────────────────────────┘        │
│                                                    │
│ [ Thử thách ] [ Lượt chơi ] [ Dễ ] [ Vừa ]         │
│ [ Tổng điểm ] [ Huy hiệu ] [ Log ] [ Đã lưu ]      │
└────────────────────────────────────────────────────┘
```

**Map — iPad dọc (3 + 2)**

```text
[ Cộng ]       [ Trừ ]        [ Cộng trừ có nhớ ]
[ Tổng hợp ]   [ Tháp Thông Thái ]
```

**Quiz — iPad dọc (820×1180)**

```text
┌────────────────────────────────────────────────────┐
│ ⌂   Minh Anh / Lớp 2   ⭐ 30   🏆 12   🔊   🚪      │
├────────────────────────────────────────────────────┤
│ Câu 4/10              ⭐ 30              22s        │  ← sticky
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░   │
│                                                    │
│                 47 + 38 = ?                         │
│                                                    │
│ 💡 Gợi ý: Cộng hàng đơn vị trước...                │  ← chữ lớn hơn
│                                                    │
│ [    75    ]                [    85    ]           │
│ [    95    ]                [    84    ]           │
│                                                    │
│ ┌──────┬──────────────────────────────────┐        │
│ │  🦉  │ Cú có gợi ý ở khung màu vàng nhé! │        │
│ └──────┴──────────────────────────────────┘        │
└────────────────────────────────────────────────────┘
```

**Quiz — iPad ngang / desktop**

```text
┌──────────────────────────────────────────────────────────────┐
│ ⌂  Minh Anh / Lớp 2     ⭐ 30    🏆 12    🔊   Đăng xuất     │
├───────────────────────────────────────┬──────────────────────┤
│ Câu 4/10   ⭐ 30   22s                │                      │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░   │        🦉            │
│ 47 + 38 = ?                           │                      │
│ 💡 Gợi ý: ...                          │  Cú có gợi ý ở       │
│ [ 75 ] [ 85 ]                         │  khung màu vàng...   │
│ [ 95 ] [ 84 ]                         │                      │
└───────────────────────────────────────┴──────────────────────┘
```

> Wireframe chỉ khoá bố cục và thứ tự ưu tiên; màu sắc/bo góc/icon cuối cùng do bước design mỹ thuật chốt.

---

## 4. Đăng xuất

### 4.1. State và luồng

**State mới:**

```ts
const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
const [clearDataOnLogout, setClearDataOnLogout] = useState(false);
const cancelLogoutRef = useRef<HTMLButtonElement | null>(null);
```

**Luồng:**

```text
[Bấm Đăng xuất]
      │
      ▼
Mở modal (clearDataOnLogout = false)
      │
      ├── Bấm "Ở lại" / backdrop / Esc ──► Đóng modal, giữ nguyên state
      │
      └── Bấm "Đăng xuất"
              │
              ├─ cleanupPendingTimeout()
              ├─ pause audio
              ├─ reset state phiên chơi
              ├─ clearDataOnLogout ?
              │     ├─ có  → clear logs + sessions + progress
              │     └─ không → chỉ bỏ profile
              ├─ setPage('setup')
              └─ đóng modal
```

### 4.2. Modal

```tsx
{showLogoutConfirm && (
  <div className="modal-backdrop" onMouseDown={cancelLogout} role="presentation">
    <div
      className="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
      aria-describedby="logout-desc"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="modal-icon" aria-hidden="true">🚪</div>
      <h3 id="logout-title">Đăng xuất?</h3>
      <p id="logout-desc">
        Con có chắc muốn đăng xuất không?
        {page === 'quiz' && ' Lượt chơi đang dở sẽ không được tính là hoàn thành.'}
      </p>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={clearDataOnLogout}
          onChange={(event) => setClearDataOnLogout(event.target.checked)}
        />
        Xoá cả tiến độ và lịch sử trên thiết bị
      </label>

      <div className="modal-actions">
        <button ref={cancelLogoutRef} className="secondary-button" type="button" onClick={cancelLogout}>
          Ở lại
        </button>
        <button className="primary-button coral" type="button" onClick={confirmLogout}>
          Đăng xuất
        </button>
      </div>
    </div>
  </div>
)}
```

**CSS:**

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding:
    max(16px, env(safe-area-inset-top))
    max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-left));
  background: rgba(20, 36, 52, 0.48);
  backdrop-filter: blur(3px);
}

.modal-card {
  width: min(440px, 100%);
  max-height: calc(100dvh - 32px);
  overflow: auto;
  padding: clamp(20px, 4vw, 28px);
  background: var(--card);
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(15, 32, 48, 0.28);
  text-align: left;
}

.modal-icon {
  font-size: 2rem;
  line-height: 1;
  margin-bottom: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

@media (max-width: 599px) {
  .modal-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}
```

**Hành vi:**
- Mở modal: focus vào nút "Ở lại".
- `Esc`: đóng.
- Khoá cuộn nền khi modal mở (`body.style.overflow = 'hidden'`), khôi phục khi đóng.
- Click backdrop: đóng; click trong card: không đóng.
- Không dùng `window.confirm`.
- Khi modal mở, effect focus câu hỏi return sớm (`showLogoutConfirm`); nếu timer làm chuyển câu trong lúc modal mở, focus vẫn ở modal.

### 4.3. Hàm đăng xuất

```ts
const requestLogout = () => {
  setClearDataOnLogout(false);
  setShowLogoutConfirm(true);
};

const cancelLogout = () => {
  setShowLogoutConfirm(false);
};

const confirmLogout = () => {
  cleanupPendingTimeout();
  correctAudioRef.current?.pause();
  wrongAudioRef.current?.pause();
  answerLockRef.current = true;

  // State phiên chơi
  sessionRecordRef.current = null;
  sessionResultsRef.current = [];
  sessionScoreRef.current = 0;
  setSessionQuestions([]);
  setSessionId('');
  setCurrentIndex(0);
  setTimer(0);
  setAnswerValue('');
  setFeedback('');
  setShowHint(false);
  setHasAnswered(false);
  setAttemptCount(0);
  attemptCountRef.current = 0;
  setConsecutiveMisses(0);
  setScore(0);
  setCorrectCount(0);
  setWrongChoices([]);
  setSortPool([]);
  setSortSlots([]);
  setSortWrongSlots([]);
  setSelectedSortIndex(null);
  setWeekdayAnswer('');
  setRelativeMapping({});
  setSelectedRelativeValue('');
  setErrorMessage('');
  setSessionMessage('');
  setSessionReward('');
  setNewBadges([]);
  setOwlMood('idle');
  setOwlMessage('Mình cùng luyện toán nhé!');

  // Form
  setPlayerName('');
  setPlayerGrade(1);
  setPlayerAvatar('owl-blue');
  setPlayerSoundEnabled(true);
  setMode('practice');
  setTopic('addition');
  setDifficulty('easy');
  setAnswerMode('auto');

  // Dữ liệu
  if (clearDataOnLogout) {
    clearQuestionLogs();
    clearSessionRecords();
    setLogCount(0);
    setSessionCount(0);
    setState({ progress: defaultState.progress });
  } else {
    setState((current) => ({ ...current, profile: undefined }));
  }

  setShowLogoutConfirm(false);
  setPage('setup');
};
```

**Ghi chú:**
- `saveAppState` effect sẽ ghi đè state không có `profile`; lần tải sau `loadAppState()` trả `profile: undefined`.
- Khi `clearDataOnLogout`, không cần xoá key thủ công vì state mặc định sẽ được ghi lại; `clearQuestionLogs`/`clearSessionRecords` xử lý 2 key còn lại.
- Không gọi `finishSession()` khi đăng xuất giữa lượt.
- `answerLockRef` được reset trong `startSession()` và effect khởi tạo câu.

### 4.4. Vị trí render modal

Đặt trong `return` gốc, **sau** các page:

```tsx
return (
  <div className="app-shell">
    {page === 'setup' && renderSetup()}
    ...
    {page === 'result' && renderResult()}
    {showLogoutConfirm && renderLogoutModal()}
  </div>
);
```

Lý do: modal phủ toàn màn hình, không bị giới hạn bởi layout từng page.

---

## 5. Gameplay — Luyện tập và Thử thách

### 5.1. Config

`src/game/gameConfig.ts`:

```ts
export const gameConfig = {
  // ... giữ nguyên

  attempts: {
    practice: {
      maxAttempts: 2,
      hintOnFirstWrong: true,
    },
    challenge: {
      maxAttempts: 1,
      hintOnFirstWrong: false,
    },
  },
} as const;
```

- `hint.*` trong requirements là đề xuất; **không triển khai** để tránh 2 nguồn cấu hình.
- Fallback nếu config sai: `practice = { maxAttempts: 2, hintOnFirstWrong: true }`, `challenge = { maxAttempts: 1, hintOnFirstWrong: false }`; log cảnh báo ở `import.meta.env.DEV`.

### 5.2. State / ref mới

| Tên | Kiểu | Mục đích | Reset khi |
|---|---|---|---|
| `wrongChoices` | `string[]` | Đáp án đã chọn sai ở câu hiện tại | Vào câu mới, bắt đầu lượt |
| `attemptCountRef` | `useRef<number>` | Đọc/ghi số lượt đồng bộ, tránh stale state | Vào câu mới, bắt đầu lượt, logout |
| `answerLockRef` | `useRef<boolean>` | Chặn bấm đúp / xử lý 2 lần | `false` khi vào câu mới hoặc nhánh retry; `true` khi final |
| `hintRef` | `useRef<HTMLDivElement>` | Scroll hint vào khung nhìn | — |
| `questionRef` | `useRef<HTMLDivElement>` | Focus khung đề khi chuyển câu | — |
| `showLogoutConfirm` | `boolean` | Modal | — |
| `clearDataOnLogout` | `boolean` | Tuỳ chọn xoá dữ liệu | Mở modal |

**Loại bỏ:**
- `pendingHint` và mọi `setPendingHint(...)`.
- `showHint` vẫn giữ, nhưng chỉ được bật ở nhánh retry của Luyện tập.

### 5.3. State machine

```text
┌───────────────────────────────┐
│ Vào câu mới                    │
│ attemptCount=0, showHint=false │
│ wrongChoices=[], lock=false    │
│ focus → .question-box          │
└───────────────┬───────────────┘
                │
                ▼
        ┌───────────────┐
        │ Người chơi bấm │
        └───────┬───────┘
                │
      ┌─────────┴──────────┐
      │                    │
   ĐÚNG                  SAI
      │                    │
      ▼                    ▼
 +10 / +5           còn lượt? ─── không ──► kết thúc câu
 ghi kết quả           │                     ghi kết quả
 chuyển câu            │ có                  handleMiss()
                       ▼                     chuyển câu 1450ms
              attemptCount++
              showHint = hintOnFirstWrong
              reset UI theo dạng câu
              KHÔNG chuyển câu
```

**Pseudocode `evaluateAnswer`:**

```ts
const evaluateAnswer = (raw: string) => {
  if (!currentQuestion || hasAnswered || answerLockRef.current) return;

  const answer = raw.trim();
  const needsRawAnswer = !['sort-numbers', 'relative-date'].includes(currentQuestion.questionType);
  if (needsRawAnswer && !answer) {
    setFeedback('Con hãy nhập đáp án trước nhé.');
    return;
  }

  answerLockRef.current = true;
  const attempt = attemptCountRef.current;
  const isCorrect = isAnswerCorrect(currentQuestion, answer);
  const userInteractionState = getUserInteractionState(currentQuestion, answer);
  const correctInteractionState = getCorrectInteractionState(currentQuestion);
  const submittedAnswer = needsRawAnswer ? answer : JSON.stringify(userInteractionState);
  const modeConfig = gameConfig.attempts[mode];

  if (isCorrect) {
    const earned = attempt === 0 ? 10 : 5;
    // log, score, correctCount, feedback, owl, record result
    // hasAnswered = true; chuyển câu sau 950ms
    return;
  }

  const nextAttempt = attempt + 1;

  if (nextAttempt < modeConfig.maxAttempts) {
    // Lượt sai đầu (hoặc giữa, nếu config > 2)
    logQuestionAnswered(..., {
      userAnswer: submittedAnswer,
      isCorrect: false,
      attemptCount: nextAttempt,
      scoreDelta: 0,
      hintShown: false,
      ...
    });

    attemptCountRef.current = nextAttempt;
    setAttemptCount(nextAttempt);

    if (modeConfig.hintOnFirstWrong) setShowHint(true);

    const choiceBased = ['multiple-choice', 'missing-equation', 'clock-hour', 'weekday-blank', 'compare']
      .includes(currentQuestion.questionType);
    if (choiceBased) {
      setWrongChoices((current) =>
        current.includes(answer) ? current : [...current, answer]
      );
    }

    resetAnswerForRetry(currentQuestion);

    setFeedback('Chưa đúng, con thử lại một lần nữa nhé.');
    setOwlMood('thinking');
    setOwlMessage(
      modeConfig.hintOnFirstWrong
        ? 'Cú có gợi ý ở khung màu vàng nhé!'
        : 'Con nhìn kỹ rồi thử lại nhé.'
    );

    answerLockRef.current = false; // ref đã cập nhật → an toàn
    return;
  }

  // Hết lượt → kết thúc câu
  const missPenalty = handleFinalMiss('Chưa đúng. Mình chuyển sang câu tiếp theo nhé.');
  logQuestionAnswered(..., {
    attemptCount: nextAttempt,
    scoreDelta: missPenalty,
    hintShown: showHint,
    ...
  });
  recordQuestionResult(...);
  setHasAnswered(true);
  timeoutIdRef.current = window.setTimeout(goToNextQuestion, 1450);
};
```

**`resetAnswerForRetry`:**

```ts
const resetAnswerForRetry = (question: Question) => {
  if (question.questionType === 'sort-numbers' || question.questionType === 'relative-date') {
    resetInteractiveAttempt(question);
    return;
  }
  if (question.questionType === 'input' || question.questionType === 'fill-number') {
    setAnswerValue('');
  }
};
```

> Lưu ý: `compare` dùng nút dấu nên không cần reset input; `missing-equation` dùng lựa chọn nên khoá đáp án sai là đủ.

### 5.4. Hành vi sau lần sai đầu theo dạng câu

| Dạng câu | Xử lý UI | State |
|---|---|---|
| `multiple-choice` | Khoá đáp án vừa chọn, viền đỏ, mờ nhẹ | `wrongChoices` |
| `missing-equation` | Khoá lựa chọn vừa chọn | `wrongChoices` |
| `clock-hour` | Khoá lựa chọn vừa chọn | `wrongChoices` |
| `weekday-blank` | Khoá lựa chọn vừa chọn; ô trống giữ nguyên | `wrongChoices` |
| `compare` | Khoá dấu vừa chọn | `wrongChoices` |
| `input` / `fill-number` | Xoá ô nhập, focus lại | `answerValue=''` |
| `sort-numbers` | Đánh dấu ô sai, sau 650ms reset; tạm khoá nút Trả lời trong thời gian reset | `resetInteractiveAttempt` |
| `relative-date` | Reset mapping | `resetInteractiveAttempt` |

**Render lựa chọn:**

```tsx
const isWrongChoice = (choice: string) => wrongChoices.includes(choice);

<button
  key={choice}
  className={`answer-button ${isWrongChoice(choice) ? 'wrong-choice' : ''}`}
  type="button"
  disabled={isWrongChoice(choice)}
  onClick={() => evaluateAnswer(choice)}
>
  {choice}
</button>
```

Áp dụng cho 5 vị trí render hiện có:
1. `renderMissingEquationQuestion`
2. `renderClockQuestion`
3. `renderWeekdayBlankQuestion`
4. nhánh `multiple-choice` trong `renderAnswerInput`
5. nhánh `compare` trong `renderAnswerInput`

**CSS:**

```css
.answer-button.wrong-choice {
  border-color: var(--danger);
  background: #fff0ec;
  color: #b6422e;
  opacity: 0.72;
  cursor: not-allowed;
  box-shadow: none;
}

.answer-button.wrong-choice:hover {
  transform: none;
}
```

### 5.5. Thẻ gợi ý

**Vị trí:** sau `.question-box`, trước `renderAnswerInput()`.

```tsx
{showHint && mode === 'practice' && currentQuestion && (
  <div
    className="hint-card"
    role="status"
    aria-live="polite"
    ref={hintRef}
  >
    <span className="hint-icon" aria-hidden="true">💡</span>
    <p>
      <strong>Gợi ý:</strong>{' '}
      {currentQuestion.hint || 'Con đọc lại đề và thử từng bước nhé.'}
    </p>
  </div>
)}
```

**CSS:**

```css
.hint-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 16px;
  border: 2px solid var(--sun);
  border-radius: 8px;
  background: #fff8e7;
  color: #6b4d12;
  font-size: clamp(1.1rem, 2.2vw, 1.3rem);
  font-weight: 800;
  line-height: 1.55;
  animation: feedback-in 160ms ease-out;
}

.hint-card p {
  margin: 0;
}

.hint-icon {
  flex: none;
  font-size: 1.6em;
  line-height: 1;
}

@media (min-width: 600px) and (max-width: 899px) {
  .hint-card {
    font-size: 1.3rem;
  }
}
```

- Font lớn hơn `.feedback` hiện tại (mặc định ~1rem) khoảng 10–30%.
- Icon là phần tử riêng, không chỉ nằm trong câu chữ.
- Không dùng màu đỏ để tránh cảm giác "phạt".
- `scrollIntoView({ block: 'nearest' })` khi `showHint` chuyển từ `false` → `true`.

### 5.6. Thử thách

- `modeConfig = gameConfig.attempts.challenge` → `nextAttempt (1) < 1` luôn sai → kết thúc câu ngay.
- Không set `showHint`.
- `renderQuiz` có guard `mode === 'practice'` để chắc chắn không render hint nếu state cũ còn sót.
- Trong `startSession()`: `setShowHint(false)`, `setWrongChoices([])`, `setPendingHint` đã bị xoá.
- Không đổi luồng chấm điểm/penalty hiện tại.

### 5.7. Bảng điểm

| Tình huống | Điểm | `attemptCount` ghi nhận | `hintShown` |
|---|---:|---:|---|
| Đúng lần 1 | +10 | 1 | false |
| Sai lần 1 → đúng lần 2 (Luyện tập) | +5 | 2 | true |
| Sai lần 1 → sai lần 2 (Luyện tập) | 0 hoặc −5* | 2 | true |
| Sai lần 1 (Thử thách) | 0 hoặc −5* | 1 | false |
| Hết giờ lần 1 | 0 hoặc −5* | 1 | false |
| Hết giờ khi đang retry | 0 hoặc −5* | 2 | true |

\* `−5` khi số câu sai liên tiếp đã kết thúc đạt 3.

### 5.8. Ghi log và lịch sử

| Event | Khi nào | Field chính |
|---|---|---|
| `question_answered` | Mỗi lượt bấm | `attemptCount` 1/2, `isCorrect`, `scoreDelta`, `hintShown` |
| `question_timeout` | Hết giờ | `attemptCount` (bổ sung), `hintShown` (bổ sung) |
| `SessionQuestionResult` | Chỉ khi câu kết thúc | `attemptCount`, `hintShown`, `retried?`, `hintText?` |

**Types:**

```ts
export interface SessionQuestionResult {
  // ...
  retried?: boolean;
  hintText?: string;
}

export interface QuestionPlayLog {
  // ...
  retried?: boolean;
}
```

- `retried = attempt > 0`.
- `hintText = showHint ? currentQuestion.hint : undefined`.
- Không đổi key localStorage, không đổi schema bắt buộc.
- Lượt sai đầu **không** tạo `SessionQuestionResult`; chỉ log event.

### 5.9. Xử lý stale state / bấm đúp

Vấn đề: React state `attemptCount` có thể chưa cập nhật giữa 2 lần tap liên tiếp; nếu chỉ dựa vào state, lần tap thứ 2 có thể được xử lý như "lần đầu" và bỏ qua retry.

Giải pháp:
1. `attemptCountRef` cập nhật đồng bộ ngay trước khi mở khoá.
2. `answerLockRef` chặn mọi lần gọi khi đang xử lý.
3. Luôn reset cả 2 ref trong effect khởi tạo câu:
   ```ts
   attemptCountRef.current = 0;
   answerLockRef.current = false;
   ```
4. Khi kết thúc câu (đúng/sai/timeout), giữ `answerLockRef = true` cho đến khi sang câu mới.

### 5.10. Timer và timeout

- Timer chạy liên tục trong cả lần trả lời đầu và lần retry; không dừng khi hiện gợi ý.
- `handleTimeout()` dùng `attemptCountRef.current`, luôn kết thúc câu, không cho retry.
- `handleTimeout()` phải chặn nếu `hasAnswered` hoặc `answerLockRef.current` (tránh double-finalize).
- Cập nhật `logQuestionTimeout` để nhận `hintShown` và `attemptCount` tuỳ chọn; mặc định giữ tương thích.
- Khi logout, `cleanupPendingTimeout()` phải chạy trước khi reset state.

---

## 6. Chi tiết thay đổi code

### 6.1. `src/game/gameConfig.ts`

Thêm `attempts` (mục 5.1). Không đổi các config khác.

### 6.2. `src/types.ts`

- `SessionQuestionResult`: thêm `retried?: boolean`, `hintText?: string`.
- `QuestionPlayLog`: thêm `retried?: boolean`.
- Không đổi `Question`, `PlaySessionRecord`, `ProgressState`.

### 6.3. `src/App.tsx`

| Vị trí | Thay đổi |
|---|---|
| Import | Thêm `clearQuestionLogs` từ `appLogger`, `clearSessionRecords` từ `sessionHistory`, `defaultState` đã có |
| State | Thêm `wrongChoices`, `showLogoutConfirm`, `clearDataOnLogout`; bỏ `pendingHint` |
| Ref | Thêm `attemptCountRef`, `answerLockRef`, `hintRef`, `questionRef`, `cancelLogoutRef` |
| Effect hydrate | Giữ nguyên; sau logout state không có profile nên reload vào Setup |
| Effect khởi tạo câu | Bỏ `pendingHint`; reset `showHint=false`, `wrongChoices=[]`, refs |
| Effect timer | Giữ nguyên; thêm guard `answerLockRef` nếu cần |
| Effect scroll | Thêm `[page, currentIndex]` → `scrollTo(0,0)` |
| Effect focus | Thêm `[page, currentIndex, showLogoutConfirm]`: blur active element + `questionRef.current?.focus({ preventScroll: true })`; return nếu modal mở |
| Effect modal | Focus, Esc, khoá cuộn nền |
| `startSession` | Reset `showHint`, `wrongChoices`, `attemptCountRef`, `answerLockRef`; bỏ `setPendingHint` |
| `handleMiss` | Đổi thành `handleFinalMiss`; bỏ `setPendingHint`, bỏ logic gợi ý theo chuỗi |
| `evaluateAnswer` | State machine mới (mục 5.3) |
| `handleTimeout` | Dùng ref; log `hintShown`; luôn finalize |
| `renderTopBar` | Markup mới + nút Đăng xuất |
| `renderQuiz` | Bọc meta/progress/timer trong `.quiz-status`; hint card mới; guard mode; gắn `ref`/`tabIndex={-1}` cho `.question-box` |
| `requestLogout` / `cancelLogout` / `confirmLogout` | Thêm mới |
| `renderLogoutModal` | Thêm mới; render ở root |
| Các hàm render lựa chọn | Thêm `disabled` + class `wrong-choice` |
| `renderAnswerInput` | Không đổi logic, chỉ nhận state `wrongChoices` |

**Không thay đổi:**
- `generateQuestionSession`, engine sinh câu, template.
- `finishSession`, `getBadges`, `getUnlocked`, `getProgressMessage`.
- Cấu trúc `PlaySessionRecord`.

### 6.4. `src/styles.css`

Thứ tự thêm:

1. Global: `dvh`, safe-area, `touch-action`, hover wrapper, reduced motion.
2. Top bar mới + `.top-actions` + `.logout-button`.
3. `.hint-card`, `.hint-icon`, `.wrong-choice`.
4. `.modal-backdrop`, `.modal-card`, `.modal-actions`.
5. `.quiz-status`.
6. `.question-box:focus` (outline none).
6. Thay `@media (max-width: 820px)` bằng `@media (max-width: 899px)`, cập nhật nội dung.
7. Thay `@media (max-width: 560px)` bằng `@media (max-width: 599px)`, cập nhật nội dung.
8. Thêm `@media (max-width: 359px)` và `@media (orientation: landscape) and (max-height: 600px)`.

**Lưu ý:** kiểm tra lại `.top-bar div { display: grid; }` hiện tại vì nó áp dụng cho `.top-actions`; phải override thành `display: flex`.

### 6.5. `index.html`

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### 6.6. Tài liệu

- `README.md`: mô tả Đăng xuất, retry, responsive, focus khi chuyển câu.
- `requirements-update-responsive.md`: đổi trạng thái sang "Đã triển khai" + ghi chú kết quả.
- `specs/design.md`, `specs/tasks.md`: thêm mục tham chiếu tính năng.

---

## 7. Khả năng truy cập

- Top bar: mọi nút icon có `aria-label` + `title`.
- Modal: `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`; focus vào "Ở lại"; Esc đóng.
- Hint: `role="status"` + `aria-live="polite"`; không cướp focus.
- Đáp án sai bị khoá: dùng `disabled` (trình đọc màn hình đọc là unavailable), vẫn giữ text.
- Không truyền đạt đúng/sai chỉ bằng màu: feedback có chữ.
- Focus ring: `:focus-visible` rõ ràng cho nút; riêng `.question-box` (vùng đọc) không hiển thị outline khi được focus bằng code.
- Chuyển câu: blur đáp án/ô nhập cũ, focus `.question-box` để trình đọc màn hình đọc đề mới; không auto-focus đáp án.
- Zoom: không khoá; input font-size ≥ 16px.

---

## 8. Rủi ro và biện pháp

| Rủi ro | Mức | Biện pháp |
|---|---|---|
| Stale state khi bấm nhanh | Cao | `attemptCountRef` + `answerLockRef`, reset theo câu |
| Hint bị "treo" sang câu sau | Trung bình | Bỏ `pendingHint`; reset `showHint` trong effect câu mới |
| iPad dọc vẫn cuộn nhiều | Trung bình | Sticky quiz-status, owl compact, giảm min-height, stats 4 cột |
| Top bar 6 phần tử tràn | Trung bình | Nhóm actions, ẩn label ở tablet, 2 hàng ở phone |
| Modal che/không đóng được | Thấp | Backdrop + Esc + nút "Ở lại"; test xoay màn hình |
| Logout giữa lượt gây setState sau khi rời trang | Trung bình | `cleanupPendingTimeout`, reset refs, guard `hasAnswered` |
| Thay đổi desktop ngoài ý muốn | Trung bình | Chỉ đụng trong breakpoint ≤ 899; QA 1440/1920 |
| HTML5 drag không chạy trên iPad | Cao | Giữ fallback chạm, test trên Safari thật |
| Focus dính đáp án câu trước | Trung bình | Blur active element + focus `.question-box` theo `[page, currentIndex, showLogoutConfirm]` |
| Focus effect cướp focus modal/hint | Thấp | Chỉ chạy khi `page === 'quiz'`, `currentIndex` đổi và `showLogoutConfirm === false`; không phụ thuộc `showHint` |
| `100dvh` không hỗ trợ | Thấp | Fallback `100vh` |

---

## 9. Truy vết Acceptance Criteria

| AC | Thiết kế tương ứng | Cách kiểm |
|---|---|---|
| AC1 iPad dọc | 3.1–3.4 | DevTools + iPad thật, đo `scrollWidth` |
| AC2 iPad ngang | 3.3.2, 3.4.5 | iPad landscape 1024/1194 |
| AC3 Xoay màn hình | 3.6 | Xoay khi đang nhập/đang retry |
| AC4 Phone/desktop | 3.1, 3.4 | 390×844, 1440×900 |
| AC5 Chạm thay kéo | 3.6 | Safari iPad, sort/relative |
| AC6 Đăng xuất Home | 4.1–4.4 | Thao tác + reload |
| AC7 Đăng xuất Quiz | 4.3 | Kiểm timer/âm thanh/record |
| AC8 Huỷ đăng xuất | 4.2 | Nút, backdrop, Esc |
| AC9 Xoá dữ liệu | 4.3 | Tick checkbox + reload |
| AC10 Sai lần 1 | 5.3–5.5 | Tất cả dạng câu |
| AC11 Lần 2 | 5.3, 5.7 | Đúng +5, sai chuyển câu |
| AC12 Hết giờ | 5.10 | Timeout lần 1 và lần 2 |
| AC13 Thử thách | 5.6 | Không hint, không retry |
| AC14 Không lẫn trạng thái | 5.6, 6.3 | Luyện tập → Thử thách |
| AC15 Build | 10 | `npm run build` |
| AC16 Focus khi chuyển câu | 3.5.1, 6.3 | Kiểm `document.activeElement`, Tab, câu nhập số |

---

## 10. Kiểm thử

### 10.1. Tự động / command

```bash
npm run build   # tsc + vite build, bắt buộc pass
npm run dev     # kiểm tra thủ công, dev server ghi play-sessions
```

Không thêm test runner trong phạm vi này. Nếu muốn, có thể thêm Vitest sau (ngoài scope).

### 10.2. Ma trận thủ công

> Ghi chú triển khai 29/10/2026: đã chạy ma trận này bằng iframe mô phỏng viewport trong trình duyệt desktop (390×844, 768×1024, 820×1180, 834×1194, 1024×768, 1194×834, 844×390, 1440×900). Chưa kiểm tra trên iPad/Safari thật.

| Viewport | Màn | Trọng tâm |
|---|---|---|
| 360×740, 390×844 | Tất cả | Top bar 2 hàng, map 2 cột, stats 2 cột, quiz 2 cột đáp án |
| 744×1133, 768×1024, 810×1080, 820×1180, 834×1194 | Tất cả | Không tràn ngang, map 2–3 cột, selection 3 cột, quiz thấy đáp án |
| 1024×768, 1180×820, 1194×834 | Home, Map, Quiz, Result | 2 cột, owl, modal |
| 1366×768, 1440×900, 1920×1080 | Tất cả | Không regression desktop |

### 10.3. Kịch bản gameplay

1. Luyện tập — trắc nghiệm: sai 1 → hint + khoá đáp án sai; chọn đáp án khác → +5.
2. Luyện tập — nhập số: sai 1 → ô trống + hint; nhập lại.
3. Luyện tập — điền số/đồng hồ/thứ: sai 1 → khoá lựa chọn sai.
4. Luyện tập — sắp xếp/ngày: sai 1 → reset + hint.
5. Luyện tập — sai 2 → chuyển câu, không có lần 3.
6. Hết giờ lần 1/lần 2 → chuyển câu ngay.
7. Thử thách — sai 1 → chuyển câu, không hint.
8. Luyện tập → Thử thách → không hint treo.
9. Bấm đúp đáp án → chỉ 1 lượt.
10. Đăng xuất từ Home/Quiz/Result → đúng hành vi, reload.
11. Xoay iPad khi đang retry/mở modal.
12. Bật giảm chuyển động → không animation.
13. Focus: Tab/Enter chọn đáp án → sang câu mới → `document.activeElement.className` chứa `question-box`; không có viền focus trên đáp án.
14. Focus: câu nhập số → sang câu mới → bàn phím ảo đóng; Tab đi vào đáp án/ô nhập đầu tiên.
15. Focus: mở modal Đăng xuất ngay sau chuyển câu → focus vẫn ở modal, Esc đóng bình thường.

---

## 11. Migration / tương thích

- Không đổi key `localStorage`.
- `profile` bị bỏ khi đăng xuất; progress/history giữ nguyên (mặc định).
- Bản ghi lịch sử cũ không có `retried`/`hintText` vẫn đọc bình thường.
- Người dùng đang có profile: sau cập nhật vẫn vào Home.
- Desktop giữ nguyên; thay đổi chính ở ≤ 899px.

---

## 12. Definition of Done

- [x] Tất cả AC1–AC16 pass trên mô phỏng viewport (mục cần iPad thật được ghi chú riêng).
- [x] `npm run build` pass, không lỗi TypeScript.
- [x] Không có cuộn ngang ở 360/390/768/820/834/1024/1194/1440.
- [x] Luyện tập retry đúng các dạng đã test (chọn, nhập số); Thử thách không hint/không retry.
- [x] Chuyển câu không giữ focus ở đáp án/ô nhập cũ; focus về `.question-box`.
- [x] Đăng xuất hoạt động từ Home/Quiz/Result, có xác nhận, reload vẫn ở Setup.
- [x] Không thêm dependency; không đổi engine/template.
- [x] README + requirements + specs được cập nhật.
- [ ] Có ảnh chụp iPad dọc/ngang trước–sau để đối chiếu.
