# Tasks triển khai — Responsive iPad, Đăng xuất, Trả lời lại, Focus khi chuyển câu

- **Trạng thái:** Đã triển khai T1–T8; T9 đã QA mô phỏng, còn kiểm tra iPad thật/ảnh đối chiếu
- **Ngày tạo:** 28/10/2026
- **Cập nhật gần nhất:** 29/10/2026
- **Tài liệu gốc:** `requirements-update-responsive.md`
- **Thiết kế:** `specs/design-update-responsive.md`
- **Tổng ước lượng:** ~6.5 ngày công
- **Nguyên tắc:** Làm tuần tự theo dependency; mỗi task phải build pass và tự kiểm tra trước khi chuyển task.

---

## 1. Bảng tiến độ

| ID | Task | Phụ thuộc | Ước lượng | Trạng thái |
|---|---|---|---:|---|
| T1 | Nền tảng responsive & global CSS | — | 0.5 ngày | ✅ Done |
| T2 | Top bar mới + nút Đăng xuất | T1 | 0.5 ngày | ✅ Done |
| T3 | Modal Đăng xuất + reset dữ liệu phiên | T2 | 0.5 ngày | ✅ Done |
| T4 | Layout tablet cho Setup/Home/Map/Selection/Result | T1 | 1 ngày | ✅ Done |
| T5 | Tối ưu Quiz cho iPad & phone + focus khi chuyển câu | T1, T2 | 1 ngày | ✅ Done |
| T6 | State machine trả lời lại ở Luyện tập | T1 | 1 ngày | ✅ Done |
| T7 | Thẻ gợi ý + loại bỏ gợi ý khỏi Thử thách | T6 | 0.5 ngày | ✅ Done |
| T8 | Log/history/types + cập nhật tài liệu | T6, T7 | 0.5 ngày | ✅ Done |
| T9 | QA thiết bị, sửa lỗi, build, ảnh đối chiếu | T2–T8 | 1 ngày | ⚠️ QA mô phỏng xong; còn iPad thật/ảnh |

### Dependency graph

```text
T1 ──┬──► T2 ──► T3
     │
     ├──► T4
     │
     └──► T6 ──► T7 ──► T8
                │
T2 ──► T5 ──────┘
                │
T2..T8 ─────────┴──► T9
```

**Có thể song song:**
- T4 và T6 (khác file/khác vùng CSS, nhưng cùng `App.tsx` → nên tách nhánh hoặc làm tuần tự nếu 1 người).
- T5 sau T2; T7 sau T6.

---

## 2. Guardrails — không làm trong phạm vi này

- ❌ Không sửa `src/game/questionTemplateEngine.ts`, `src/data/questionTemplates.json`, `src/data/questions.ts`.
- ❌ Không thêm dependency (không modal library, không CSS framework).
- ❌ Không dùng `window.confirm`, `window.alert`.
- ❌ Không đổi key `localStorage`.
- ❌ Không đổi công thức sinh câu, độ khó, timer, mở khoá, huy hiệu.
- ❌ Không thiết kế lại desktop ngoài phạm vi cần thiết.
- ❌ Không dùng `user-scalable=no`.
- ❌ Không commit file build/`dist`, log tạm, ảnh chụp cá nhân (trừ ảnh QA có chủ đích).

---

## 3. Chi tiết task

### T1 — Nền tảng responsive & global CSS

**Mục tiêu:** Thiết lập breakpoint mới, `dvh`, safe-area, touch/hover, scroll reset để các task sau có nền.

**Files:**
- `index.html`
- `src/styles.css`
- `src/App.tsx`

**Các bước:**
- [x] Thêm `viewport-fit=cover` vào meta viewport.
- [x] Đổi `@media (max-width: 820px)` → `@media (max-width: 899px)`.
- [x] Đổi `@media (max-width: 560px)` → `@media (max-width: 599px)`.
- [x] Thêm `@media (max-width: 359px)`.
- [x] Thêm `@media (orientation: landscape) and (max-height: 600px)`.
- [x] `body`, `#root`, `.app-shell`: `100dvh` + fallback `100vh`.
- [x] `.app-shell`: padding safe-area bằng `env(safe-area-inset-*)`.
- [x] Thêm `touch-action: manipulation`, `-webkit-tap-highlight-color` cho nút.
- [x] Bọc hover transform trong `@media (hover: hover) and (pointer: fine)`.
- [x] Thêm `@media (prefers-reduced-motion: reduce)`.
- [x] Thêm `html { -webkit-text-size-adjust: 100%; }`.
- [x] Thêm effect `window.scrollTo(0, 0)` theo `[page, currentIndex]` trong `App.tsx`.
- [x] Kiểm tra `min-width: 0` cho `.top-identity`, các grid/flex child có text dài.

**Acceptance:**
- Không có cuộn ngang ở 360, 390, 768, 820, 834, 1024, 1194, 1440.
- `npm run build` pass.
- Trên iPad, chiều cao không bị giật do `100vh`.
- Bật "Giảm chuyển động" → animation gần như tắt.

**Kiểm tra:**
```bash
npm run build
npm run dev
# DevTools → responsive: đo document.documentElement.scrollWidth
```

**Ước lượng:** 0.5 ngày.

---

### T2 — Top bar mới + nút Đăng xuất

**Mục tiêu:** Refactor top bar thành các vùng có class rõ ràng, thêm nút Đăng xuất, responsive 3 tầng.

**Files:**
- `src/App.tsx` (`renderTopBar`)
- `src/styles.css`

**Các bước:**
- [x] Thay markup top bar: `.top-home`, `.top-identity`, `.top-score`, `.top-challenge`, `.top-actions` (chứa Âm thanh + Đăng xuất).
- [x] Bỏ hoàn toàn rule ẩn theo `nth-child` (`.top-bar > div:nth-child(3)`).
- [x] Thêm state tạm `logoutRequested` hoặc nối `onClick={requestLogout}` (có thể làm placeholder ở task này, hoàn thiện ở T3).
- [x] Nút Đăng xuất: icon 🚪 + label "Đăng xuất"; `title`, `aria-label`.
- [x] CSS desktop: 5 cột `58px minmax(0,1fr) auto auto auto`; `.top-actions` flex.
- [x] CSS tablet 600–899: icon 48px, ẩn label Đăng xuất, ẩn span của score/challenge.
- [x] CSS phone ≤599: grid 2 hàng với `grid-template-areas`; top bar không sticky.
- [x] CSS ≤359: ẩn `.top-challenge`.
- [x] Đảm bảo `.top-actions` không bị rule `.top-bar div { display:grid }` ghi đè.
- [x] `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` cho tên dài.
- [x] Nút Trang chủ/Âm thanh có `aria-label`.

**Acceptance:**
- Top bar hiển thị đủ Trang chủ, Tên/Lớp, Điểm, Thử thách, Âm thanh, Đăng xuất ở 768/820/834/1024/1440.
- Không tràn ngang, không đè chữ ở 360/390.
- Nút Đăng xuất bấm được ở mọi màn đã đăng nhập.
- Không còn phụ thuộc `nth-child`.

**Kiểm tra:** DevTools 390, 768, 820, 834, 1024, 1440; xoay ngang/dọc.

**Ước lượng:** 0.5 ngày.

---

### T3 — Modal Đăng xuất + reset dữ liệu phiên

**Mục tiêu:** Hoàn thiện luồng đăng xuất có xác nhận, dọn state, tuỳ chọn xoá dữ liệu, quay về Setup.

**Files:**
- `src/App.tsx`
- `src/styles.css`

**Các bước:**
- [x] Thêm state: `showLogoutConfirm`, `clearDataOnLogout`.
- [x] Thêm ref: `cancelLogoutRef`.
- [x] `requestLogout()`: reset checkbox, mở modal.
- [x] `cancelLogout()`: đóng modal.
- [x] `confirmLogout()`: theo design mục 4.3.
- [x] `cleanupPendingTimeout()`, pause audio refs.
- [x] Reset toàn bộ state phiên chơi + form + owl.
- [x] Nếu `clearDataOnLogout`: `clearQuestionLogs()`, `clearSessionRecords()`, `setLogCount(0)`, `setSessionCount(0)`, `setState({ progress: defaultState.progress })`.
- [x] Nếu không: `setState(current => ({ ...current, profile: undefined }))`.
- [x] Render modal ở root `return`, sau các page.
- [x] Focus vào "Ở lại" khi mở.
- [x] `Esc` đóng; backdrop đóng; click trong card không đóng.
- [x] Khoá cuộn `body` khi modal mở, khôi phục khi đóng.
- [x] Nội dung cảnh báo thêm khi `page === 'quiz'`.
- [x] CSS modal responsive (max 440px, `max-height: 100dvh`, safe-area, actions 1 cột ở phone).
- [x] `answerLockRef.current = true` khi logout; reset trong `startSession`.

**Acceptance (AC6–AC9):**
- Đăng xuất từ Home → Setup, form trống, reload vẫn Setup, tiến độ còn.
- Đăng xuất từ Quiz → timer dừng, không ghi thêm kết quả, không tính thử thách.
- Huỷ bằng nút/backdrop/Esc → state giữ nguyên.
- Tick xoá dữ liệu → mọi chỉ số/lịch sử/log về 0.
- Modal không bị cắt trên iPad dọc/ngang.

**Kiểm tra thủ công:** từng màn Home/Map/Selection/Quiz/Result; reload; kiểm tra `localStorage`.

**Ước lượng:** 0.5 ngày.

---

### T4 — Layout tablet cho Setup/Home/Map/Selection/Result

**Mục tiêu:** Loại bỏ cảm giác "mọi thứ dồn 1 cột" trên iPad dọc; giữ desktop ổn định.

**Files:**
- `src/styles.css`
- `src/App.tsx` (nếu cần đổi thứ tự/owl markup)

**Các bước:**
- [x] Setup: 1 cột ở <900, panel max 640px, h1 giảm, bỏ `min-height: calc(100vh - 40px)`.
- [x] Home: 1 cột; `.stats-grid` 4 cột tablet, 2 cột phone; `.cta-row` 2 cột tablet, 1 cột phone.
- [x] Owl compact: `.owl-panel` grid 2 cột (owl + message), owl ~96×110, mặt/belly/ear thu nhỏ.
- [x] Map: 3 cột tablet, 2 cột phone; `.map-node` 150/132px; bỏ cuộn ngang không cần thiết.
- [x] Selection: `.option-grid.three` 3 cột tablet, 1 cột phone.
- [x] Result: panel trước owl trên tablet (`order`); `.result-grid` 1 cột phone; CTA 1 cột phone.
- [x] Kiểm tra `.screen-heading` không bị chật; nút "Quay lại"/"Đổi chủ đề" xuống dòng hợp lý.
- [x] Kiểm tra `.storage-note`, `.challenge-progress` không tràn.

**Acceptance (AC1, AC4):**
- iPad dọc: stats ≥2 cột (mục tiêu 4), map 2–3 cột, selection 3 cột, result thấy ngay.
- Phone: 2 cột stats/map, 1 cột CTA.
- Desktop 1440: không thay đổi đáng kể so với hiện tại.

**Kiểm tra:** chụp ảnh 768×1024, 820×1180, 834×1194, 390×844, 1440×900.

**Ước lượng:** 1 ngày.

---

### T5 — Tối ưu Quiz cho iPad & phone + focus khi chuyển câu

**Mục tiêu:** Đề + đáp án + timer nằm trong khung nhìn hợp lý; không phải cuộn qua owl; nhập liệu tốt với bàn phím ảo; chuyển câu không giữ focus ở đáp án cũ.

**Files:**
- `src/App.tsx` (`renderQuiz`, effect chuyển câu)
- `src/styles.css`

**Các bước:**
- [x] Bọc `.quiz-meta` + 2 thanh tiến độ trong `.quiz-status`.
- [x] `.quiz-status`: `position: sticky; top: 0; z-index: 10;` nền trắng + blur nhẹ.
- [x] Top bar ở Quiz dùng class `.top-bar-static` (không sticky) để không chồng.
- [x] Tablet dọc: `.quiz-layout` 1 cột; owl compact; panel padding 18.
- [x] Giảm `.question-box` min-height (124 tablet, 110 phone); giữ class long/medium.
- [x] `.choice-grid` 2 cột tablet/phone ≥360; `.choice-grid.signs` 3 cột.
- [x] `.answer-button` min-height 78/72; font giữ clamp.
- [x] `.answer-input`: 2 cột ≥360, 1 cột <360.
- [x] `.relative-targets`: 3 cột tablet, 1 cột phone.
- [x] Landscape thấp (`max-height:600px`): ẩn owl trong quiz, giảm padding/min-height.
- [x] Thêm ref `hintRef` + effect `scrollIntoView({ block: 'nearest' })` (có thể hoàn thiện ở T7).
- [x] Thêm `questionRef` + gắn `ref`/`tabIndex={-1}` cho `.question-box`.
- [x] Thêm effect `[page, currentIndex, showLogoutConfirm]`: blur `document.activeElement` (nếu là HTMLElement, trừ `body`) rồi `questionRef.current?.focus({ preventScroll: true })`; return sớm nếu `showLogoutConfirm`.
- [x] Chỉ chạy khi `page === 'quiz'` và `showLogoutConfirm === false`; không phụ thuộc `showHint`/`attemptCount`; không cướp focus modal.
- [x] CSS `.question-box:focus { outline: none; }`; vẫn giữ `:focus-visible` cho nút.
- [x] Kiểm tra bàn phím ảo: focus input ở câu nhập số, nút "Trả lời" vẫn thấy; sang câu mới bàn phím đóng.
- [x] Đảm bảo `timer` hiển thị rõ, dùng `font-variant-numeric: tabular-nums`.

**Acceptance (AC1–AC4, AC16):**
- iPad dọc: thấy đề + 4 đáp án + timer mà không phải cuộn qua owl.
- iPad ngang: 2 cột quiz/owl, không tràn.
- Phone: 2 cột đáp án số; không tràn ngang.
- Xoay màn hình giữa câu: không reset câu/timer/đáp án.
- Modal/hint không bị sticky che.
- Sau khi chuyển câu: `document.activeElement` là `.question-box`; không đáp án/ô nhập/nút "Trả lời" nào còn focus; không có viền focus trên đáp án.
- Tab sau chuyển câu đi tới phần tử tương tác đầu tiên, không kẹt ở khung đề.

**Kiểm tra:** iPad thật nếu có; DevTools 768×1024, 1024×768, 390×844, 844×390; kiểm tra `document.activeElement.className`.

**Ước lượng:** 1 ngày.

---

### T6 — State machine trả lời lại ở Luyện tập

**Mục tiêu:** Sai lần 1 ở Luyện tập được thử lại; sai lần 2/ hết giờ mới chuyển câu; Thử thách giữ 1 lượt.

**Files:**
- `src/game/gameConfig.ts`
- `src/App.tsx`
- `src/styles.css` (class `wrong-choice`)

**Các bước:**
- [x] Thêm `gameConfig.attempts.practice/challenge` theo design 5.1.
- [x] Thêm state `wrongChoices`; refs `attemptCountRef`, `answerLockRef`.
- [x] Xoá `pendingHint` khỏi state, effect, `startSession`, `evaluateAnswer`, `handleMiss`.
- [x] Effect khởi tạo câu: reset `showHint=false`, `wrongChoices=[]`, refs; bỏ phụ thuộc `pendingHint`.
- [x] `startSession`: reset refs/wrongChoices/showHint.
- [x] Đổi `handleMiss` → `handleFinalMiss`, bỏ set gợi ý, giữ tăng `consecutiveMisses` và −5.
- [x] Viết lại nhánh sai trong `evaluateAnswer` theo design 5.3:
  - [x] `attemptCountRef` cập nhật đồng bộ.
  - [x] Nếu còn lượt: log lượt sai (`scoreDelta: 0`, `hintShown: false`), tăng attempt, bật hint nếu practice, reset UI, mở khoá, return.
  - [x] Nếu hết lượt: gọi `handleFinalMiss`, log, record result, `hasAnswered=true`, chuyển câu 1450ms.
- [x] `resetAnswerForRetry`: input → xoá; sort/relative → `resetInteractiveAttempt`; choice-based → không reset.
- [x] Trong 650ms reset sort: tạm khoá nút "Trả lời" để tránh submit bằng state cũ.
- [x] Thêm `wrongChoices` vào render 5 vị trí lựa chọn: `disabled` + class.
- [x] CSS `.answer-button.wrong-choice`.
- [x] `handleTimeout`: dùng `attemptCountRef`; luôn finalize; không retry; log `hintShown`.
- [x] `handleTimeout` guard `answerLockRef`/`hasAnswered`.
- [x] Đảm bảo điểm: đúng lần 1 +10, lần 2 +5; không âm.
- [x] Đảm bảo `recordQuestionResult` chỉ gọi 1 lần/câu.
- [x] Bind `disabled` cho `missing-equation`, `clock-hour`, `weekday-blank`, `multiple-choice`, `compare`.
- [x] Kiểm tra `weekdayAnswer` không bị set khi chọn sai.

**Acceptance (AC10–AC12, AC14):**
- Luyện tập: sai 1 → ở lại, hint, retry; sai 2 → chuyển câu; đúng 2 → +5.
- Trắc nghiệm cũng được retry.
- Hết giờ lần 1/lần 2 → chuyển câu ngay.
- Thử thách: sai 1 → chuyển câu, không hint.
- Bấm đúp → chỉ 1 lượt.
- Không có câu bị ghi 2 kết quả.

**Kiểm tra:** chơi ít nhất 2 lượt mỗi chế độ, mỗi dạng câu; xem `data/play-sessions.json` và log localStorage.

**Ước lượng:** 1 ngày.

---

### T7 — Thẻ gợi ý + loại bỏ gợi ý khỏi Thử thách

**Mục tiêu:** Gợi ý nổi bật, dễ đọc cho trẻ; chỉ xuất hiện ở Luyện tập sau sai lần đầu.

**Files:**
- `src/App.tsx`
- `src/styles.css`

**Các bước:**
- [x] Tạo JSX `.hint-card` với `role="status"`, `aria-live="polite"`, `ref={hintRef}`.
- [x] Vị trí: sau `.question-box`, trước `renderAnswerInput()`.
- [x] Fallback hint khi rỗng: "Con đọc lại đề và thử từng bước nhé."
- [x] CSS: nền kem, viền vàng, icon 💡 1.6em, font `clamp(1.1rem, 2.2vw, 1.3rem)`, tablet 1.3rem, line-height 1.55, weight 800.
- [x] Animation nhẹ + tôn trọng reduced motion.
- [x] `scrollIntoView({ block: 'nearest' })` khi hint xuất hiện.
- [x] Guard `mode === 'practice'` khi render.
- [x] Owl message: "Cú có gợi ý ở khung màu vàng nhé!".
- [x] Đảm bảo Thử thách không bao giờ set `showHint`.
- [x] Xoá mọi thông điệp owl dạng "Câu sau cú có gợi ý nhỏ cho con." khỏi challenge.
- [x] Kiểm tra hint không che đáp án trên iPad dọc.

**Acceptance (AC10, AC13, AC14):**
- Sau sai lần 1 ở Luyện tập: hint hiện ngay, có icon, chữ lớn hơn, không lộ đáp án.
- Sang câu mới: hint biến mất.
- Thử thách: không có `.hint-card`, `hintShown=false`.
- Luyện tập → Thử thách: không còn hint treo.

**Kiểm tra:** so sánh font hint với feedback thường; chụp ảnh 768×1024.

**Ước lượng:** 0.5 ngày.

---

### T8 — Log/history/types + cập nhật tài liệu

**Mục tiêu:** Dữ liệu đủ để kiểm tra hành vi retry/hint; tài liệu khớp thực tế.

**Files:**
- `src/types.ts`
- `src/utils/appLogger.ts`
- `src/App.tsx`
- `README.md`
- `requirements-update-responsive.md`
- `specs/design.md`, `specs/tasks.md`

**Các bước:**
- [x] `SessionQuestionResult`: thêm `retried?`, `hintText?`.
- [x] `QuestionPlayLog`: thêm `retried?`.
- [x] `logQuestionAnswered`: nhận/ghi `retried` (tuỳ chọn).
- [x] `logQuestionTimeout`: nhận `attemptCount`, `hintShown` (optional, mặc định tương thích).
- [x] `recordQuestionResult`: set `attemptCount`, `hintShown`, `retried`, `hintText`.
- [x] Kiểm tra JSON export không lỗi với bản ghi cũ.
- [x] `README.md`: thêm mục Đăng xuất, retry Luyện tập, responsive iPad.
- [x] `requirements-update-responsive.md`: cập nhật trạng thái triển khai + kết quả kiểm tra.
- [x] `specs/design.md`: ghi chú tham chiếu design mới.
- [x] `specs/tasks.md`: thêm sprint/task đã hoàn thành.

**Acceptance:**
- Log lượt sai đầu: `attemptCount:1`, `scoreDelta:0`.
- Kết quả cuối: `attemptCount:2`, `hintShown:true` (practice).
- Challenge: `hintShown:false`.
- Export session JSON đọc được; không phá dữ liệu cũ.

**Kiểm tra:** chơi 1 lượt, mở `data/play-sessions.json` + localStorage log, đối chiếu.

**Ước lượng:** 0.5 ngày.

---

### T9 — QA thiết bị, sửa lỗi, build, ảnh đối chiếu

**Mục tiêu:** Xác nhận toàn bộ AC trên thiết bị/emulator; không regression.

**Files:** không cố định (sửa lỗi phát sinh).

**Các bước:**
- [x] `npm run build` pass.
- [x] Chạy `npm run dev`, kiểm tra console không lỗi.
- [x] Chạy ma trận viewport (mục 4) bằng iframe mô phỏng.
- [ ] Chơi đủ 8 dạng câu ở Luyện tập (nếu generator trả về) và Thử thách.
- [x] Kiểm tra logout từ Home/Quiz/Result + reload + xoá dữ liệu.
- [ ] Kiểm tra xoay iPad thật khi đang retry/modal.
- [x] Kiểm tra bấm đúp (khoá bằng `answerLockRef`/`hasAnswered`).
- [x] Kiểm tra focus khi chuyển câu: đáp án, ô nhập, modal mở ngay sau chuyển câu.
- [x] Kiểm tra reduced motion (CSS media query).
- [ ] Chụp ảnh trước/sau cho iPad dọc 820×1180 và iPad ngang 1180×820 (lưu ngoài repo hoặc trong `specs/images/` nếu được duyệt).
- [x] Sửa lỗi phát sinh; chạy lại build.
- [x] Cập nhật bảng tiến độ + trạng thái tài liệu.

**Acceptance:**
- AC1–AC16 pass.
- Không cuộn ngang ở bất kỳ viewport nào trong ma trận.
- Không lỗi console.
- Không regression desktop.

**Ước lượng:** 1 ngày.

---

## 4. Ma trận QA

| Nhóm | Viewport | Màn / thao tác | Task phụ trách |
|---|---|---|---|
| Phone nhỏ | 360×740, 390×844 | Top bar, Home, Map, Quiz, hint, modal | T1–T8 |
| Phone ngang | 844×390 | Quiz, modal, bàn phím ảo | T5 |
| iPad dọc | 744×1133, 768×1024, 810×1080, 820×1180, 834×1194 | Setup, Home, Map, Selection, Quiz, Result | T1–T5 |
| iPad ngang | 1024×768, 1180×820, 1194×834 | Quiz 2 cột, top bar, modal, result | T2, T5 |
| Desktop | 1366×768, 1440×900, 1920×1080 | Regression toàn bộ | T9 |

### Checklist thao tác

- [x] Setup → nhập tên → chọn lớp → chọn avatar → Bắt đầu.
- [x] Home → Luyện tập → Map → chọn chủ đề → chọn độ khó → chọn kiểu trả lời → bắt đầu.
- [x] Quiz: trả lời đúng lần 1; sai lần 1 rồi đúng; sai 2 lần; hết giờ.
- [ ] Quiz: mỗi dạng câu (trắc nghiệm, nhập số, điền số, so sánh, sắp xếp, đồng hồ, thứ, ngày).
- [x] Quiz: bấm đúp; cuộn xuống rồi sang câu mới.
- [x] Focus: Tab/Enter chọn đáp án → sang câu mới → kiểm tra `document.activeElement` là `.question-box`, không có viền focus trên đáp án.
- [ ] Focus: câu nhập số → sang câu mới → bàn phím ảo đóng; Tab đi vào đáp án/ô nhập đầu tiên. (Đã test focus/blur; chưa test bàn phím ảo trên thiết bị thật.)
- [x] Focus: mở modal Đăng xuất ngay sau chuyển câu → focus vẫn ở modal.
- [x] Thử thách: sai lần 1 → chuyển câu, không hint.
- [x] Luyện tập → Thử thách → không hint treo.
- [x] Đăng xuất Home; đăng xuất Quiz; đăng xuất Result; huỷ modal; xoá dữ liệu.
- [x] Reload sau đăng xuất; đăng nhập lại.
- [x] Reduced motion.

---

## 5. Truy vết Acceptance Criteria → Task

| AC | Nội dung | Task chính |
|---|---|---|
| AC1 | iPad dọc không tràn, bố cục hợp lý | T1, T4, T5 |
| AC2 | iPad ngang 2 cột | T2, T5 |
| AC3 | Xoay màn hình giữ state | T1, T5 |
| AC4 | Phone/desktop không regression | T1, T4, T5, T9 |
| AC5 | Chạm thay kéo | T5, T9 |
| AC6 | Đăng xuất từ Home | T2, T3 |
| AC7 | Đăng xuất từ Quiz | T3 |
| AC8 | Huỷ đăng xuất | T3 |
| AC9 | Xoá dữ liệu khi đăng xuất | T3 |
| AC10 | Luyện tập sai lần 1 | T6, T7 |
| AC11 | Luyện tập lần 2 | T6 |
| AC12 | Luyện tập hết giờ | T6 |
| AC13 | Thử thách không hint/retry | T6, T7 |
| AC14 | Không lẫn trạng thái 2 chế độ | T6, T7 |
| AC15 | Build & chất lượng | T9 |
| AC16 | Không giữ focus ở đáp án/ô nhập câu trước | T5, T9 |

---

## 6. Lệnh và quy trình

```bash
# Cài đặt (nếu chưa)
npm install

# Phát triển
npm run dev

# Kiểm tra TypeScript + build
npm run build

# Xem bản build
npm run preview
```

**Trước khi bắt đầu task:**
```bash
git status --short
git checkout -b feature/responsive-logout-practice-retry
```

**Sau mỗi task:**
```bash
npm run build
git diff --stat
```

**Khi kết thúc:**
```bash
npm run build
# kiểm tra ma trận QA
# cập nhật tài liệu + trạng thái
```

---

## 7. Definition of Done toàn tính năng

- [x] T1–T8 hoàn thành, checkbox được đánh dấu; T9 QA mô phỏng hoàn tất.
- [x] AC1–AC16 pass trên mô phỏng viewport (trừ mục cần iPad thật).
- [x] `npm run build` pass, không lỗi TypeScript.
- [x] Không có cuộn ngang ở 360–1440px (mô phỏng).
- [x] Luyện tập retry đúng các dạng đã test (chọn, nhập số); Thử thách không hint/retry.
- [x] Chuyển câu không giữ focus ở đáp án/ô nhập cũ; focus về `.question-box`.
- [x] Đăng xuất từ Home/Quiz/Result, có xác nhận, reload vẫn Setup.
- [x] Không thêm dependency; không đổi engine/template.
- [x] README + requirements + specs cập nhật.
- [ ] Có ảnh chụp iPad dọc/ngang trước–sau.
- [x] Không còn `pendingHint` trong code.
- [x] Không còn `nth-child` dùng để ẩn top bar.
- [x] Không còn `window.confirm`.

---

## 8. Ghi chú bàn giao

- Line number trong tài liệu design là **tham khảo**, có thể lệch sau các task trước; ưu tiên tên hàm/selector.
- Task T3 và T6 đều sửa `App.tsx`; nếu làm song song, cần merge cẩn thận phần state/ref.
- Không sửa `data/play-sessions.json` bằng tay khi test; dùng `npm run dev` và xoá dữ liệu test sau khi xong (giữ dữ liệu thật nếu có).
- Nếu phát hiện hành vi khác với requirements, dừng lại và cập nhật tài liệu trước khi code tiếp.
