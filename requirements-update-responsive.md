# Requirements Update — Responsive iPad, Đăng xuất, Trả lời lại, Focus khi chuyển câu

- **Trạng thái:** Đã phê duyệt và triển khai (29/10/2026) — QA bằng mô phỏng viewport, chưa kiểm tra trên iPad thật
- **Ngày tạo:** 28/10/2026
- **Cập nhật gần nhất:** 29/10/2026 — triển khai xong, cập nhật README/specs và kết quả QA mô phỏng
- **Người đề xuất:** Product/UX review dựa trên source code hiện tại
- **Phạm vi:** Cải thiện hiển thị đa thiết bị (trọng tâm iPad), thêm Đăng xuất, đổi hành vi trả lời của chế độ Luyện tập và Thử thách, bỏ focus dính đáp án khi chuyển câu.
- **Tài liệu liên quan:** `requirements.md`, `specs/design.md`, `specs/design-update-responsive.md`, `specs/tasks-update-responsive.md`, `specs/system-design.md`, `specs/tasks.md`, `specs/wireframes-and-visual-design.md`

---

## 1. Mục tiêu

1. **Responsive đúng trên iPad**: iPad dọc (portrait) và iPad ngang (landscape) phải hiển thị cân đối, không bị dồn thành một cột dài, không tràn ngang, thao tác trả lời không phải cuộn quá nhiều.
2. **Có Đăng xuất**: người chơi có thể thoát phiên hiện tại và quay về màn nhập tên, có xác nhận trước khi thoát.
3. **Luyện tập được trả lời lại 1 lần**: sai lần đầu thì được thử lại, hiện gợi ý nổi bật (có biểu tượng, chữ lớn hơn); sau lần trả lời thứ hai thì chuyển câu tiếp theo dù đúng hay sai.
4. **Thử thách giữ nguyên nhịp độ**: sai là chuyển câu ngay, **không gợi ý**, **không cho trả lời lại**.
5. **Không giữ focus sai chỗ khi chuyển câu**: sang câu mới, không để con trỏ/focus dính vào đáp án hoặc ô nhập của câu trước; focus được đưa về khung đề bài để trẻ không bấm nhầm và trình đọc màn hình đọc đúng câu mới.

Mục tiêu trải nghiệm: trẻ 6–8 tuổi dùng iPad bằng ngón tay, không cần phóng to, không bị mất ngữ cảnh khi màn hình đổi hướng, không bị focus nhảy vào đáp án cũ khi sang câu mới, và luôn nhìn thấy câu hỏi + đáp án + đồng hồ trong một khung nhìn hợp lý.

---

## 2. Hiện trạng và vấn đề

### 2.1. Responsive — các điểm đang gây lệch trên iPad

| Khu vực | Hiện tại | Vấn đề trên iPad |
|---|---|---|
| `src/styles.css:956` | `@media (max-width: 820px)` gộp toàn bộ tablet vào mobile | iPad 10.2" (810), iPad 10.9" (820), iPad mini (744) đều rơi vào nhánh mobile; iPad Pro 11" (834) lại rơi vào desktop → cùng là iPad nhưng 2 giao diện khác nhau |
| `.stats-grid` (`styles.css:338`) | 3 cột desktop, **1 cột** dưới 820px | Trang chủ có 8 thẻ thống kê → 8 hàng dọc, cuộn rất dài trên iPad dọc |
| `.map` (`styles.css:386`) | 5 cột desktop, **1 cột** dưới 820px | 5 node bản đồ xếp dọc, mỗi node 112px, mất cảm giác "bản đồ" |
| `.option-grid.three` (`styles.css:289`) | 3 cột desktop, **1 cột** dưới 820px | Màn chọn độ khó thành 3 hàng, đẩy nút Bắt đầu xuống dưới màn hình |
| `.hero-card` (`styles.css:60`) | 2 cột với cột form tối thiểu `320px` | Ở 834px, cột trái còn ~400px nhưng `h1` dùng `8vw` (~66px) → tiêu đề xuống dòng xấu |
| `.top-bar` (`styles.css:126`) | 5 cột cố định `58px 1fr auto auto 58px` | Thêm nút Đăng xuất sẽ thành 6 phần tử; các rule ẩn theo `nth-child` (`styles.css:1003`) sẽ ẩn nhầm |
| `.quiz-layout` (`styles.css:323`) | 2 cột desktop, 1 cột dưới 820px | iPad dọc: cú mèo nằm dưới đáp án; nếu nội dung dài, trẻ phải cuộn mới thấy hết đáp án |
| `html, body, #root` (`styles.css:24`) | `min-height: 100vh` | Safari iPad có thanh địa chỉ động → 100vh gây khoảng trống/giật khi cuộn |
| Hover effects (`styles.css:210`, `647`) | Luôn bật `:hover` + `translateY` | Trên cảm ứng, trạng thái hover bị "dính" sau khi chạm |
| Drag & drop (`App.tsx` sort/relative) | HTML5 `draggable` + `onDrop` | iOS Safari không hỗ trợ HTML5 drag bằng ngón tay; hiện chỉ còn fallback chạm-chọn (cần giữ và làm rõ) |
| `index.html:5` | `width=device-width, initial-scale=1.0` | Chưa có `viewport-fit=cover` → không dùng được safe-area của iPad/iPhone |
| Scroll position | Không reset khi đổi câu/đổi màn | Trẻ cuộn xuống trả lời, sang câu mới vẫn ở vị trí cũ, không thấy đề bài |

**Kết luận:** lỗi chính không phải "thiếu media query" mà là **thiếu tầng giao diện riêng cho tablet** và **breakpoint 820px chia iPad thành hai nhóm không nhất quán**. Đồng thời thanh trên cùng và màn quiz chưa được thiết kế lại cho chiều cao màn hình iPad.

### 2.2. Đăng xuất

- Ứng dụng không có khái niệm phiên đăng nhập thực sự: "đăng nhập" là nhập tên ở `renderSetup()` (`App.tsx:892`), lưu vào `localStorage` key `owl_math_game_profile_v1` (`src/utils/storage.ts:3`).
- Khi đã có `profile`, app tự vào trang chủ (`App.tsx:238–244`).
- Không có cách quay lại màn nhập tên nếu không xoá `localStorage` thủ công.
- Chưa có modal xác nhận, chưa có reset state phiên khi thoát.
- `renderTopBar()` (`App.tsx:865`) đang có 5 phần tử, chưa có nút Đăng xuất.

### 2.3. Trả lời lại và gợi ý

- `evaluateAnswer()` (`App.tsx:756`) **dùng chung logic cho cả Luyện tập và Thử thách**, không phân biệt `mode`.
- Hiện chỉ cho làm lại khi: `attemptCount === 0` **và** câu không phải `multiple-choice` (`App.tsx:829`). Trắc nghiệm sai lần đầu là chuyển câu ngay.
- Gợi ý hiện tại (`showHint`) chỉ bật khi `consecutiveMisses >= 1`, tức là **đã sai ở câu trước**, không nhất quán với "sai lần đầu của câu hiện tại". Gợi ý còn có thể "treo" sang các câu sau qua `pendingHint` (`App.tsx:651`, `App.tsx:301`).
- Gợi ý đang render bằng `.feedback` (`App.tsx:1505`) — cùng kiểu chữ với phản hồi thường, không có biểu tượng, không nổi bật.
- Thử thách hiện vẫn có thể hiện gợi ý (do dùng chung logic) → trái với yêu cầu mới.
- Khi sai lần đầu ở dạng nhập số, ô nhập **không được xoá**; trẻ dễ bấm lại đúng đáp án cũ.
- Chưa có khoá chống bấm đúp (double-tap) khi iPad nhận 2 sự kiện tap liên tiếp.

### 2.4. Focus khi chuyển câu

- Các nút đáp án được render lại với cùng cấu trúc DOM; React tái sử dụng phần tử thay vì huỷ hẳn.
- Sau khi trẻ bấm/Enter vào đáp án, trình duyệt giữ `document.activeElement` ở nút đó. Khi sang câu mới, nút cùng vị trí vẫn nhận focus → viền focus xuất hiện trên đáp án của câu mới.
- Với câu nhập số, ô input có thể giữ focus và bàn phím ảo vẫn mở dù đã sang câu khác.
- Effect khởi tạo câu hiện tại chỉ reset state, **không** blur/focus lại; chưa có `tabIndex`/ref cho khung đề.

---

## 3. Phạm vi

### 3.1. In scope

- Breakpoint và layout riêng cho: điện thoại, tablet dọc, tablet ngang/small laptop, desktop.
- Tối ưu 6 màn hình hiện có: Setup, Home, Map, Selection, Quiz, Result.
- Thanh trên cùng (top bar) responsive, thêm nút Đăng xuất + modal xác nhận.
- Xoá phiên đăng nhập, quay về Setup, dọn toàn bộ state tạm.
- Luyện tập: tối đa 2 lần trả lời/câu, gợi ý sau lần sai đầu, thẻ gợi ý có biểu tượng + chữ lớn hơn.
- Thử thách: 1 lần trả lời/câu, không gợi ý, chuyển câu ngay như hiện tại.
- Quản lý focus khi chuyển câu: không giữ focus ở đáp án/ô nhập câu trước; đưa focus về khung đề bài.
- Cập nhật log/history để phân biệt số lần thử và việc đã hiện gợi ý.
- Cập nhật tài liệu `README.md` và `specs/*` sau khi triển khai.

### 3.2. Out of scope

- Tài khoản thật, backend, đồng bộ nhiều thiết bị.
- Tiến độ riêng theo từng hồ sơ người chơi (xem Q1).
- PWA/offline, cài ra màn hình chính.
- Hiển thị lời giải/đáp án đúng sau khi trả lời sai.
- Thay đổi nội dung câu hỏi, công thức sinh câu, độ khó, timer, mở khoá.
- Thay đổi giao diện desktop một cách không cần thiết (desktop phải giữ gần như hiện tại).
- Hỗ trợ trình duyệt cũ (IE, Safari < 15).

---

## 4. Định nghĩa

| Thuật ngữ | Định nghĩa |
|---|---|
| **Lượt trả lời (attempt)** | Một lần người chơi gửi đáp án cho câu hiện tại. Lần đầu là attempt 1, sau khi sai được thử lại là attempt 2. |
| **Câu hoàn tất** | Câu đã có kết quả cuối cùng: đúng, sai sau lần cuối, hoặc hết giờ. Chỉ câu hoàn tất mới ghi vào `SessionQuestionResult`. |
| **Focus** | Phần tử đang là `document.activeElement`; trên iPad có thể kèm bàn phím ảo nếu là ô nhập. |
| **Gợi ý** | Nội dung `question.hint` (đã có sẵn trong mọi câu), hiển thị trong thẻ gợi ý nổi bật. |
| **Tablet dọc** | Chiều rộng viewport 600–899px (iPad mini 744, iPad 768/810/820, iPad Pro 11" 834). |
| **Tablet ngang / small laptop** | 900–1199px (iPad landscape 1024–1194, laptop nhỏ). |
| **Desktop** | ≥ 1200px; nội dung tối đa 1120px như hiện tại. |
| **Đăng xuất** | Xoá hồ sơ người chơi khỏi phiên và quay về màn Setup. |

---

## 5. Yêu cầu chức năng

### 5.1. Responsive

#### 5.1.1. Hệ breakpoint

Thay 2 breakpoint hiện tại (820 / 560) bằng 3 mốc có chủ đích:

| Tầng | Viewport | Thiết bị đại diện | Nguyên tắc |
|---|---|---|---|
| Phone | `≤ 599px` | iPhone 390×844, Android 360×800 | Ưu tiên dọc, nút lớn, hạn chế cuộn ngang |
| Tablet dọc | `600–899px` | iPad mini/10.2"/10.9"/11" portrait | **2–3 cột vừa phải**, không dồn 1 cột; giữ được đề + đáp án trong khung nhìn |
| Tablet ngang / small laptop | `900–1199px` | iPad landscape 1024–1194 | Dùng layout 2 cột như desktop nhưng giảm padding, owl gọn hơn |
| Desktop | `≥ 1200px` | Laptop/desktop | Giữ nguyên bố cục hiện tại, `app-shell` max 1120px |

Yêu cầu bắt buộc: **không có cuộn ngang** (`document.documentElement.scrollWidth <= window.innerWidth`) ở tất cả viewport từ 320px đến 1440px.

#### 5.1.2. Quy tắc chung toàn app

1. Dùng `min-height: 100dvh` (fallback `100vh`) cho `body`/`#root`; không dùng `100vh` đơn thuần cho `.hero-card`.
2. Thêm `viewport-fit=cover` vào `index.html` và padding an toàn bằng `env(safe-area-inset-*)` cho `.app-shell` (đặc biệt đáy và hai bên khi iPad ngang).
3. `touch-action: manipulation` cho mọi nút; bỏ highlight xanh khi chạm (`-webkit-tap-highlight-color: transparent`).
4. Chỉ bật hiệu ứng hover/nâng nút trong `@media (hover: hover) and (pointer: fine)`.
5. Mọi vùng chạm tối thiểu **48×48px**; icon-button tối thiểu 48px.
6. `min-width: 0` cho các phần tử trong grid/flex để chữ dài không đẩy tràn; tên học sinh dài được cắt bằng ellipsis hoặc xuống dòng có kiểm soát.
7. Reset vị trí cuộn về đầu trang khi đổi `page` hoặc `currentIndex` (sang câu mới phải thấy đề ngay).
8. Tôn trọng `prefers-reduced-motion`: tắt animation owl/bounce nếu người dùng chọn giảm chuyển động.
9. Thanh top bar **sticky** ở đầu trang khi cuộn (tablet/desktop); trên phone có thể không sticky nếu làm giảm chiều cao hữu ích, nhưng phải đảm bảo nút Đăng xuất luôn tìm thấy ở đầu trang.
10. Không khoá zoom (`user-scalable=no` là **không** được dùng) để đảm bảo khả năng truy cập.

#### 5.1.3. Top bar (áp dụng cho Home, Map, Selection, Quiz, Result)

Cơ cấu mới (6 phần tử): `Trang chủ | Tên + Lớp | Tổng điểm | Thử thách/Lượt chơi | Âm thanh | Đăng xuất`.

- Bỏ hoàn toàn cách ẩn theo `nth-child`; dùng class rõ ràng: `.top-identity`, `.top-score`, `.top-challenge`, `.top-actions`, `.top-logout`.
- **Tablet dọc:** hiển thị đủ 6 phần tử trên 1 hàng khi đủ chỗ; `.top-challenge` dạng gọn (`🏆 12` + tooltip). Nếu thiếu chỗ, ẩn `.top-score` trước, nhưng **không được ẩn nút Đăng xuất và Âm thanh**.
- **Phone:** 2 hàng — hàng 1: Trang chủ + Tên/Lớp + Đăng xuất; hàng 2 (hoặc gộp): Điểm + Thử thách gọn + Âm thanh. Không để chữ tràn.
- Nút Đăng xuất luôn có `aria-label="Đăng xuất"`, `title="Đăng xuất"`; trên desktop hiện chữ "Đăng xuất", trên tablet/phone có thể chỉ hiện icon nhưng vẫn có nhãn ẩn.
- Nút Trang chủ và Âm thanh giữ nguyên chức năng, bổ sung `aria-label` đầy đủ.

#### 5.1.4. Hành vi từng màn

**Setup (`renderSetup`)**

- Tablet dọc: 1 cột, panel form rộng tối đa ~640px, canh giữa; không dùng 2 cột với cột form 320px.
- `h1` giảm còn khoảng `clamp(2.2rem, 6vw, 3.4rem)` ở tablet dọc để không xuống 3 dòng.
- `.hero-card` bỏ `min-height: calc(100vh - 40px)`; dùng `min-height: auto` + padding theo `dvh`.
- Phone: giữ 1 cột, form và nút Bắt đầu nằm trong 1–1.5 màn hình đầu.

**Home (`renderHome`)**

- Tablet dọc: 1 cột; khối giới thiệu + CTA trước, owl dạng **compact** (hàng ngang, owl ~96×110px) thay vì panel cao.
- `.stats-grid`: tablet dọc **4 cột × 2 hàng** (hoặc 2 cột nếu nội dung chật); phone **2 cột**; desktop giữ 3 cột.
- `.cta-row`: tablet dọc 2 nút/hàng; phone 1 nút/hàng (full width), các nút phụ nhỏ hơn.

**Map (`renderMap`)**

- Tablet dọc: **2 hoặc 3 cột**, không cuộn ngang; node cao ~150px, chữ đủ lớn.
- Phone: 2 cột (khuyến nghị) hoặc 1 cột nếu tên chủ đề dài; node cao ~132px.
- Tablet ngang/desktop: 5 cột; nếu thiếu chỗ thì giảm `minmax(130px, 1fr)` xuống 110px trước khi cho cuộn ngang.
- Bỏ cảm giác "danh sách dọc" trên iPad; node giữ tỷ lệ gần vuông để dễ chạm.

**Selection (`renderSelection`)**

- Tablet dọc: `.option-grid.three` giữ **3 cột** (mỗi nút ~200px), không rơi về 1 cột.
- `.segmented.wrap` cho kiểu trả lời: 3 lựa chọn trên 1 hàng ở tablet; phone cho phép 2 hàng.
- Nút "Bắt đầu" luôn nhìn thấy sau khi chọn độ khó mà không phải cuộn quá xa.

**Quiz (`renderQuiz`) — ưu tiên cao nhất**

- Tablet dọc: 1 cột, nhưng thứ tự là **Quiz panel trước, owl compact sau**; owl không chiếm panel cao 300px.
- Tablet ngang/desktop: 2 cột như hiện tại; owl bên phải.
- `.choice-grid` giữ **2 cột** cho đáp án số trên tablet và phone ≥ 360px; chỉ về 1 cột khi viewport < 360px hoặc đáp án là câu chữ dài (xử lý ở design).
- `.choice-grid.signs` giữ 3 cột ở mọi tầng (dấu `> < =` ngắn).
- Khối meta (Câu x/10, điểm, giây) + thanh tiến độ + thanh thời gian: **sticky** ở đầu quiz panel trên tablet để trẻ luôn thấy đồng hồ.
- Chiều cao câu hỏi: giảm `min-height` trên tablet dọc (khoảng 120–140px) để 4 đáp án nằm trong khung nhìn 1024px chiều cao.
- Phone: giữ 2 cột đáp án số; câu hỏi `min-height` ~110px; owl thu gọn hoặc ẩn trong quiz để tiết kiệm chiều cao (vẫn giữ phản hồi bằng feedback/hint).
- Landscape phone hoặc màn hình thấp (`max-height: 600px`): giảm padding, ẩn owl trong quiz, thanh meta gọn.
- Khi bàn phím ảo mở trên iPad/iPhone ở câu nhập số, input và nút "Trả lời" phải còn nhìn thấy (dùng layout co giãn, tránh `position: fixed`).

**Result (`renderResult`)**

- Tablet dọc: panel kết quả **trước**, owl compact sau (hoặc bên cạnh nếu đủ chỗ); không để kết quả bị đẩy xuống dưới màn hình.
- `.result-grid` giữ 3 cột trên tablet; phone 1–3 cột tùy độ rộng (khuyến nghị 3 cột gọn hoặc 1 cột).
- Nút "Chơi lại" / "Về khu rừng" xếp 2 cột ở tablet, 1 cột ở phone.

#### 5.1.5. Yêu cầu riêng cho iPad / iOS Safari

1. **Đổi hướng màn hình** giữa câu hỏi: không reset câu, không reset timer, không mất đáp án đang nhập; layout tự thích ứng.
2. **Không phụ thuộc drag & drop**: các câu `sort-numbers` và `relative-date` phải thao tác được hoàn toàn bằng chạm (chọn thẻ → chạm ô). Giữ fallback hiện có và làm nổi bật trạng thái đã chọn.
3. **Không phụ thuộc hover** để biết nút nào bấm được.
4. **Safe-area** trên iPad ngang (camera/rounded corner) và home indicator.
5. **Thanh địa chỉ động**: dùng `dvh`, tránh giật layout khi vuốt.
6. **Chống bấm đúp**: một lần chạm chỉ tạo một lượt trả lời (đặc biệt quan trọng khi thêm cơ chế trả lời lại).
7. Font hệ thống phải render tiếng Việt đúng trên iPadOS (giữ font stack hiện tại, không thêm font ngoài).

#### 5.1.6. Khả năng truy cập

- Mọi nút icon có `aria-label`; modal có `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- Focus ring rõ ràng (`:focus-visible`) trên nền sáng cho phần tử tương tác; `.question-box` là vùng đọc nên không hiển thị outline khi được focus bằng code.
- Chuyển câu: focus về khung đề (không auto-focus đáp án/ô nhập) để trẻ không bấm nhầm và trình đọc màn hình đọc câu mới.
- Không truyền đạt đúng/sai chỉ bằng màu: kèm icon/chữ ("Chính xác", "Chưa đúng").
- Gợi ý dùng `role="status"` / `aria-live="polite"` để trình đọc màn hình thông báo, không cướp focus.

---

### 5.2. Đăng xuất

#### 5.2.1. Vị trí và hiển thị

- Nút **Đăng xuất** nằm cuối top bar, sau nút Âm thanh.
- Hiển thị trên tất cả màn hình đã đăng nhập: Home, Map, Selection, Quiz, Result.
- Không hiển thị ở Setup (vì chưa đăng nhập).
- Kiểu dáng: nút phụ (cream/neutral) để không cạnh tranh với CTA chính; trên desktop có nhãn "Đăng xuất"; tablet/phone có thể icon + nhãn ẩn.

#### 5.2.2. Luồng

1. Người dùng bấm **Đăng xuất**.
2. Hiện modal xác nhận:
   - Tiêu đề: "Đăng xuất?"
   - Nội dung: "Con có chắc muốn đăng xuất không?"
   - Nếu đang trong lượt chơi: thêm "Lượt chơi đang dở sẽ không được tính là hoàn thành."
   - Nút phụ: "Ở lại" (mặc định focus).
   - Nút chính/danger: "Đăng xuất".
3. Bấm "Ở lại", bấm ra ngoài modal, hoặc nhấn `Esc` → đóng modal, giữ nguyên mọi thứ.
4. Bấm "Đăng xuất" → thực hiện đăng xuất, đóng modal, chuyển về Setup.

#### 5.2.3. Dữ liệu sau đăng xuất

- **Mặc định (đề xuất):** chỉ xoá hồ sơ phiên (`profile`: tên, lớp, avatar, âm thanh); **giữ tiến độ, điểm, huy hiệu và lịch sử** trên thiết bị để trẻ không mất thành tích.
- Trong modal có tuỳ chọn (checkbox, mặc định **tắt**): "Xoá cả tiến độ và lịch sử trên thiết bị". Nếu chọn:
  - Xoá `owl_math_game_profile_v1`, `owl_math_game_sessions_v1`, `owl_math_game_question_logs_v1`.
  - Reset `progress` về `defaultState.progress`.
- Đăng xuất phải xoá sạch state phiên trong bộ nhớ: câu hỏi, đáp án đang nhập, timer, highlight, feedback, gợi ý, điểm lượt, cờ `hasAnswered`, timeout đang chờ.
- Nếu đang ở giữa lượt chơi: dọn timeout, không ghi thêm câu trả lời; bản ghi lượt chơi đã lưu ở trạng thái `in-progress` (không tính vào `completedChallenges`).
- Sau đăng xuất, tải lại trang vẫn ở Setup (không tự vào Home).
- Đăng nhập lại bằng tên mới: không còn dữ liệu tên/lớp/avatar cũ trong form; điểm/tiến độ hiển thị theo dữ liệu còn giữ (mặc định).

#### 5.2.4. Không được xảy ra

- Không dùng `window.confirm()` mặc định của trình duyệt (không đồng bộ ngôn ngữ/thiết kế, khó dùng cho trẻ).
- Không để modal bị cắt trên iPad dọc/ngang; modal rộng tối đa ~440px, có padding an toàn.
- Không đăng xuất khi bấm nhầm ra ngoài modal.
- Không để timer/âm thanh tiếp tục chạy sau khi đã đăng xuất.

---

### 5.3. Luyện tập — trả lời lại 1 lần và gợi ý

#### 5.3.1. Quy tắc cốt lõi

- Mỗi câu trong **Luyện tập** có tối đa **2 lượt trả lời**.
- **Sai lần 1:** không chuyển câu. Hiện gợi ý nổi bật, cho phép trả lời lại.
- **Sai lần 2:** câu kết thúc, ghi nhận sai, chuyển câu tiếp theo (sau ~1.45s như hiện tại).
- **Đúng lần 1:** +10 điểm, chuyển câu (như hiện tại).
- **Đúng lần 2:** +5 điểm, chuyển câu (giữ quy tắc hiện có).
- **Hết giờ:** câu kết thúc ngay, tính sai, **không cho trả lời lại**; chuyển câu sau ~1.45s (giữ hiện tại).
- Áp dụng cho **mọi dạng câu**: trắc nghiệm, nhập số, điền số, so sánh dấu, sắp xếp số, đồng hồ, thứ trong tuần, ngày tương đối.
- Chỉ áp dụng khi `mode === 'practice'`. Không ảnh hưởng Thử thách.

#### 5.3.2. Hành vi UI sau lần sai đầu

| Dạng câu | Sau lần sai đầu |
|---|---|
| Trắc nghiệm / điền số có lựa chọn / so sánh dấu / đồng hồ / thứ trong tuần | Đánh dấu đáp án vừa chọn là sai (viền đỏ + giảm nhẹ độ nổi bật) và **tạm khoá đáp án đó**; các đáp án còn lại vẫn bấm được |
| Nhập số | Xoá nội dung ô nhập (hoặc giữ và bôi đen để nhập đè), focus lại ô nhập; không tự điền đáp án |
| Sắp xếp số | Giữ cơ chế hiện tại: đánh dấu ô sai, sau ~650ms trả các thẻ về vị trí ban đầu, cho xếp lại |
| Ngày tương đối | Reset mapping về trạng thái ban đầu, cho ghép lại |
| Tất cả | Hiện thẻ gợi ý; giữ nguyên đề bài; timer **tiếp tục chạy**; không chuyển câu |

Ghi chú: việc khoá đáp án sai giúp trẻ không bấm lặp lại cùng một đáp án; không được khoá toàn bộ lưới đáp án.

#### 5.3.3. Thẻ gợi ý (Hint card)

- Vị trí: ngay dưới khung đề bài, phía trên khu vực trả lời.
- Nội dung: `💡 Gợi ý: {question.hint}`.
- Có biểu tượng bóng đèn rõ ràng ở đầu thẻ (kích thước ~1.5–1.8em, không chỉ là emoji trong câu chữ).
- Font **lớn hơn feedback thường một chút**:
  - Phone: `1.1–1.15rem`.
  - Tablet dọc: `1.25–1.35rem`.
  - Desktop/tablet ngang: `1.15–1.3rem`.
  - `line-height` 1.5–1.6, weight 800.
- Nền kem/vàng nhạt (`--cream`/`#fff8e7`), viền vàng `--sun`, bo góc 8px, không dùng màu đỏ (tránh cảm giác "báo lỗi").
- Có animation xuất hiện nhẹ; tôn trọng `prefers-reduced-motion`.
- Gợi ý **không** được chứa đáp án đúng dưới dạng "đáp án là X" (nội dung hint hiện có đã đạt yêu cầu).
- Thông điệp owl: "Cú có gợi ý ở khung màu vàng nhé!" (không lặp lại toàn bộ gợi ý để tránh rối).
- Khi sang câu mới, thẻ gợi ý biến mất; không mang gợi ý sang câu sau.
- Gợi ý phải hiện ngay sau lần sai đầu, **không phụ thuộc** số câu sai trước đó.

#### 5.3.4. Điểm và chuỗi sai

- Sai lần 1 không trừ điểm, không tăng `consecutiveMisses` (vì câu chưa kết thúc).
- Sai lần 2 kết thúc câu → tăng `consecutiveMisses` 1 lần.
- Giữ quy tắc "sai 3 câu liên tiếp −5 điểm" (tính theo câu đã kết thúc, không theo lượt bấm).
- Đúng lần 2 chỉ +5; không cộng thêm thưởng cuối lượt khác so với hiện tại.
- Điểm không âm (giữ nguyên `Math.max(0, ...)`).

#### 5.3.5. Ghi log

- Mỗi lượt bấm vẫn ghi một event `question_answered` (như hiện tại) với `attemptCount` = 1 rồi 2.
- Lượt sai đầu ghi `scoreDelta: 0`.
- Kết quả cuối trong `SessionQuestionResult`:
  - `attemptCount`: 1 hoặc 2.
  - `hintShown`: `true` nếu đã hiện gợi ý ở câu đó.
  - Bổ sung tùy chọn (không phá schema): `retried?: boolean`, `hintText?: string`.
- Không ghi trùng một câu thành 2 kết quả trong lịch sử lượt chơi.

---

### 5.4. Thử thách — không gợi ý, không trả lời lại

- Mỗi câu chỉ có **1 lượt trả lời**.
- Sai → kết thúc câu ngay, ghi nhận sai, chuyển câu sau ~1.45s (giữ hành vi hiện tại).
- **Không** hiển thị thẻ gợi ý, **không** hiện nút/khung gợi ý, **không** đổi thông điệp owl thành gợi ý.
- Không áp dụng `pendingHint`; cờ gợi ý luôn `false` trong suốt lượt Thử thách.
- Đúng lần đầu +10; không có trường hợp +5.
- Giữ nguyên timer, thưởng 8/10 (+20), 10/10 (+50), huy hiệu, mở khoá, log.
- `hintShown` trong log/kết quả luôn `false`.
- Nếu người chơi vừa chơi Luyện tập (đã bật gợi ý) rồi vào Thử thách, mọi trạng thái gợi ý phải được reset khi bắt đầu lượt mới.

---

### 5.5. Quản lý focus khi chuyển câu

**Hiện tượng hiện tại:** React tái sử dụng DOM của các nút đáp án giữa các câu. Sau khi bấm/Enter vào một đáp án, khi câu tiếp theo render, trình duyệt vẫn giữ `document.activeElement` ở nút cùng vị trí → viền focus xuất hiện trên đáp án của câu mới, dù trẻ chưa chọn. Với câu nhập số, ô nhập và bàn phím ảo có thể vẫn giữ focus.

**Yêu cầu:**

1. Khi chuyển sang câu hỏi mới (do trả lời đúng/sai hoặc hết giờ), **không giữ focus** ở bất kỳ đáp án, nút chọn, thẻ số, ô nhập hay nút "Trả lời" của câu trước.
2. Trước khi render/ngay sau khi câu mới xuất hiện, gọi `blur()` trên `document.activeElement` nếu đó là phần tử tương tác.
3. Đưa focus về **khung đề bài** (`.question-box`) với `tabIndex={-1}` và `focus({ preventScroll: true })`:
   - Giúp trình đọc màn hình đọc câu mới.
   - Không tự focus vào đáp án đầu tiên.
   - Không tự focus vào ô nhập (tránh bàn phím ảo bật lên ngoài ý muốn trên iPad).
4. Không hiển thị viền focus trên khung đề bài (đây là vùng đọc, không phải nút bấm); vẫn giữ `:focus-visible` cho các nút để hỗ trợ điều hướng bàn phím.
5. Áp dụng cho cả câu đầu tiên khi bắt đầu lượt chơi và mọi lần chuyển câu; **tạm dừng khi modal Đăng xuất đang mở** (`showLogoutConfirm === true`) để không cướp focus; sau khi đóng modal, có thể trả focus về khung đề.
6. Không thay đổi thứ tự DOM, `key` của đáp án hay logic chấm điểm chỉ để xử lý focus.

**Ngoài phạm vi:** không cần trap focus trong toàn màn Quiz, không cần tự động chuyển focus vào đáp án đầu tiên, không thay đổi hành vi bàn phím hiện có (Tab/Shift+Tab vẫn hoạt động bình thường sau khi focus khung đề).

---

## 6. Thiết kế kỹ thuật đề xuất

### 6.1. Config mới (`src/game/gameConfig.ts`)

```ts
export const gameConfig = {
  // ... giữ nguyên các config hiện có

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

- `maxAttempts` là nguồn duy nhất quyết định số lần trả lời; `hintOnFirstWrong` là nguồn duy nhất quyết định có gợi ý hay không (không cần thêm block `hint` riêng).
- Nếu config không hợp lệ (`maxAttempts < 1` hoặc > 3), fallback: practice = 2, challenge = 1 và log cảnh báo ở dev.
- Không thêm dependency.

### 6.2. State machine trả lời (đề xuất)

```
Vào câu mới:
  attemptCount = 0
  showHint = false
  hasAnswered = false
  wrongChoices = []
  blur phần tử cũ, focus .question-box

Người chơi gửi đáp án:
  nếu hasAnswered hoặc đang khoá chống double-tap -> bỏ qua

  nếu đúng:
    earned = attemptCount === 0 ? 10 : 5
    ghi log + kết quả
    hasAnswered = true
    chuyển câu sau 950ms

  nếu sai:
    nextAttempt = attemptCount + 1
    nếu nextAttempt < modeConfig.maxAttempts:   // còn lượt
      ghi log lượt sai (scoreDelta 0)
      attemptCount = nextAttempt
      showHint = modeConfig.hintOnFirstWrong
      reset UI theo dạng câu
      KHÔNG chuyển câu
    ngược lại:                                  // hết lượt
      ghi log + kết quả sai
      handleMiss()  // tăng consecutiveMisses, có thể -5
      hasAnswered = true
      chuyển câu sau 1450ms

Hết giờ:
  luôn kết thúc câu, không cho retry
  ghi timeout + kết quả
  hasAnswered = true
  chuyển câu sau 1450ms
```

Yêu cầu triển khai:

- Bỏ điều kiện `attemptCount === 0 && currentQuestion.questionType !== 'multiple-choice'` (`App.tsx:829`).
- Thay bằng logic dựa trên `mode` + `gameConfig.attempts`.
- Thêm ref khoá đồng bộ (`answerLockRef`) để chặn 2 lần tap trong cùng một khung hình; mở khoá khi sang câu mới hoặc khi chuyển sang trạng thái retry.
- Bỏ `pendingHint` và các chỗ set (`App.tsx:301`, `651`, `787`, `835`) để gợi ý không "treo" sang câu sau.
- Hàm `resetInteractiveAttempt()` chỉ gọi ở nhánh retry; bổ sung reset cho ô nhập và danh sách đáp án sai.

### 6.3. State/UI mới trong `App.tsx`

| State | Mục đích |
|---|---|
| `wrongChoices: string[]` | Các đáp án đã chọn sai ở câu hiện tại; disable + style sai |
| `showLogoutConfirm: boolean` | Mở/đóng modal đăng xuất |
| `clearDataOnLogout: boolean` | Tuỳ chọn xoá toàn bộ dữ liệu, mặc định `false` |
| `answerLockRef` | Chống bấm đúp (ref) |
| `questionRef` | Trỏ tới `.question-box` để đưa focus về đề bài khi chuyển câu |

**Focus khi chuyển câu:**

```tsx
const questionRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  if (page !== 'quiz' || showLogoutConfirm) return;

  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body) {
    active.blur();
  }

  questionRef.current?.focus({ preventScroll: true });
}, [page, currentIndex, showLogoutConfirm]);

// JSX
<div className="question-box" ref={questionRef} tabIndex={-1}>
  {questionPrompt}
</div>
```

- Chạy sau khi câu mới đã render; không chạy khi chỉ hiện gợi ý hoặc khi modal đang mở; đóng modal khi vẫn ở Quiz sẽ trả focus về đề.
- Không auto-focus đáp án/ô nhập.
- CSS: `.question-box:focus { outline: none; }` vì đây là vùng đọc, không phải nút bấm.

Thẻ gợi ý:

```tsx
{showHint && mode === 'practice' && currentQuestion && (
  <div className="hint-card" role="status" aria-live="polite">
    <span className="hint-icon" aria-hidden="true">💡</span>
    <p>
      <strong>Gợi ý:</strong> {currentQuestion.hint}
    </p>
  </div>
)}
```

- Đặt trong `.quiz-panel`, ngay sau `.question-box` và trước `renderAnswerInput()`.
- Khi hiện gợi ý, có thể gọi `scrollIntoView({ block: 'nearest' })` để đảm bảo thẻ nằm trong khung nhìn trên iPad.

Modal đăng xuất:

```tsx
{showLogoutConfirm && (
  <div className="modal-backdrop" role="presentation" onClick={cancelLogout}>
    <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="logout-title" onClick={stopPropagation}>
      <h3 id="logout-title">Đăng xuất?</h3>
      <p>Con có chắc muốn đăng xuất không?</p>
      {/* cảnh báo nếu đang trong quiz */}
      <label className="checkbox-row">
        <input type="checkbox" checked={clearDataOnLogout} onChange={...} />
        Xoá cả tiến độ và lịch sử trên thiết bị
      </label>
      <div className="modal-actions">
        <button className="secondary-button" onClick={cancelLogout}>Ở lại</button>
        <button className="primary-button coral" onClick={confirmLogout}>Đăng xuất</button>
      </div>
    </div>
  </div>
)}
```

- Focus vào "Ở lại" khi mở; `Esc` đóng; khoá cuộn nền (`body` overflow) khi modal mở.
- Không thêm thư viện modal.

### 6.4. Hàm đăng xuất (đề xuất)

```ts
const confirmLogout = () => {
  cleanupPendingTimeout();
  answerLockRef.current = true;

  // Reset state phiên trong bộ nhớ
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
  setConsecutiveMisses(0);
  setScore(0);
  setCorrectCount(0);
  setSortPool([]);
  setSortSlots([]);
  setSortWrongSlots([]);
  setWeekdayAnswer('');
  setRelativeMapping({});
  setSelectedRelativeValue('');
  setErrorMessage('');
  setSessionMessage('');
  setSessionReward('');
  setNewBadges([]);

  // Reset form
  setPlayerName('');
  setPlayerGrade(1);
  setPlayerAvatar('owl-blue');
  setPlayerSoundEnabled(true);
  setMode('practice');
  setTopic('addition');
  setDifficulty('easy');
  setAnswerMode('auto');

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

Ghi chú:
- `saveAppState` effect sẽ ghi lại state không có `profile`; lần tải sau `loadAppState()` trả `profile: undefined` → Setup.
- Không xoá `localStorage` key tiến độ nếu người dùng không chọn xoá dữ liệu.
- `clearQuestionLogs` và `clearSessionRecords` đã có sẵn trong `src/utils/appLogger.ts` và `src/utils/sessionHistory.ts`.

### 6.5. CSS: cấu trúc media query đề xuất

Giữ cách tiếp cận desktop-first hiện tại để giảm rủi ro, nhưng thay mốc:

```css
/* Desktop mặc định: ≥ 900px, giữ gần như hiện tại */

@media (max-width: 899px) {
  /* Tablet dọc + phone: layout nền tảng */
}

@media (max-width: 599px) {
  /* Phone */
}

@media (max-width: 359px) {
  /* Phone rất nhỏ */
}

@media (orientation: landscape) and (max-height: 600px) {
  /* Phone ngang / màn hình thấp */
}
```

Các nhóm rule cần có:

| Nhóm | Thay đổi chính |
|---|---|
| Global | `100dvh`, safe-area, `touch-action`, hover trong `(hover: hover)`, `prefers-reduced-motion`, sticky top bar |
| Top bar | Grid areas/class rõ ràng, 6 phần tử, không dùng `nth-child`, nút 48px |
| Setup | 1 cột, panel max 640px, h1 nhỏ hơn, bỏ min-height 100vh |
| Home | Stats 4→2 cột, CTA wrap, owl compact |
| Map | 2–3 cột tablet, 2 cột phone, node thấp hơn, bỏ cuộn ngang không cần thiết |
| Selection | `.option-grid.three` 3 cột tablet, 1 cột phone |
| Quiz | 1 cột tablet dọc, meta sticky, owl compact, choice 2 cột, question min-height giảm |
| Result | Panel trước owl, grid 3 cột tablet |
| Hint | `.hint-card`, `.hint-icon`, font lớn hơn, nền kem, viền vàng |
| Modal | `.modal-backdrop`, `.modal-card`, `.modal-actions` responsive |

### 6.6. Các file dự kiến thay đổi

| File | Thay đổi |
|---|---|
| `index.html` | `viewport-fit=cover` |
| `src/App.tsx` | Top bar + nút/modal đăng xuất; state machine retry; thẻ gợi ý; reset state; scroll-to-top; quản lý focus khi chuyển câu (`questionRef`); wrongChoices; bỏ `pendingHint` |
| `src/styles.css` | Breakpoints mới, layout tablet/phone, top bar, hint card, modal, dvh/safe-area/hover/reduced-motion, `.question-box:focus` |
| `src/game/gameConfig.ts` | `attempts` |
| `src/types.ts` | (tuỳ chọn) `retried?`, `hintText?` trong `SessionQuestionResult`/log |
| `src/utils/appLogger.ts` | (tuỳ chọn) log thêm `retried`/`hintText` |
| `src/utils/storage.ts` | (tuỳ chọn) hàm `clearAppState()` nếu muốn xoá key thay vì ghi đè |
| `README.md` | Mô tả đăng xuất, retry, responsive, focus khi chuyển câu |
| `specs/design.md`, `specs/tasks.md`, `requirements.md` | Cập nhật sau triển khai |

---

## 7. Edge cases

1. **Bấm đúp rất nhanh** vào đáp án: chỉ tính 1 lượt; lần sai đầu không bị nhảy thành "hết lượt".
2. **Hết giờ đúng lúc đang xem gợi ý**: tính timeout, không cho retry, chuyển câu; không hiện thêm gợi ý mới.
3. **Đổi hướng iPad** khi đang retry: giữ nguyên `attemptCount`, gợi ý, đáp án đã nhập; layout đổi, timer không reset.
4. **Đổi tab/ẩn trình duyệt** rồi quay lại: timer tiếp tục theo thời gian thực (giữ hành vi hiện tại), không crash.
5. **Câu hỏi không có `hint`** (dữ liệu lỗi): hiện gợi ý mặc định "Con đọc lại đề và thử từng bước nhé." thay vì thẻ trống.
6. **Câu `multiple-choice` sai lần đầu** ở Luyện tập: đáp án sai bị khoá, các đáp án khác vẫn chọn được; không lộ đáp án đúng.
7. **Câu sắp xếp số** sai lần đầu: các ô sai được đánh dấu rồi reset; trẻ xếp lại từ đầu; gợi ý vẫn hiện.
8. **Đăng xuất khi đang ở Quiz**: dọn timeout, không ghi thêm kết quả; lượt chơi ở trạng thái `in-progress`; không tính thử thách.
9. **Đăng xuất rồi đăng nhập lại**: form trống; tiến độ giữ nguyên (mặc định); nếu chọn xoá dữ liệu thì mọi chỉ số về 0.
10. **Đăng xuất ở Result**: modal không hiện cảnh báo "lượt đang dở"; các state kết quả được dọn.
11. **Modal đăng xuất trên iPad ngang**: không bị tràn, không bị bàn phím ảo che (không có input trong modal).
12. **Xoay ngang iPad khi modal mở**: modal vẫn canh giữa, nút bấm được.
13. **Tên học sinh dài** (> 20 ký tự): top bar không tràn; cắt bằng ellipsis hoặc xuống dòng.
14. **Trình duyệt chặn localStorage**: app vẫn chạy trong phiên; đăng xuất không crash.
15. **Nhiều tab cùng mở**: tab còn lại không tự cập nhật; hành vi hiện tại được giữ, không bắt buộc đồng bộ.
16. **Người dùng giảm chuyển động**: không có animation bounce/shake/hint.
17. **Chuyển câu khi đang focus ở đáp án/ô nhập**: focus không dính sang đáp án cùng vị trí ở câu mới; không có viền focus trên đáp án; bàn phím ảo đóng lại; focus về khung đề.
18. **Mở modal Đăng xuất ngay sau khi chuyển câu**: focus của modal không bị effect chuyển câu cướp; đóng modal vẫn thao tác được.

---

## 8. Acceptance Criteria

### AC1 — iPad dọc: không tràn ngang, bố cục hợp lý

- **Given** viewport 768×1024, 820×1180 và 834×1194 (iPad dọc)
- **When** mở lần lượt Setup, Home, Map, Selection, Quiz, Result
- **Then** không có cuộn ngang; Home hiển thị thống kê tối thiểu 2 cột; Map hiển thị 2–3 cột; màn chọn độ khó hiển thị 3 cột; Quiz hiển thị đề + 4 đáp án trong khung nhìn đầu tiên mà không phải cuộn qua owl.

### AC2 — iPad ngang: tận dụng chiều rộng

- **Given** viewport 1024×768 và 1194×834
- **When** vào Quiz
- **Then** quiz panel và owl nằm 2 cột; meta + timer + đề + đáp án đều thấy được; không tràn ngang; nút Đăng xuất hiển thị.

### AC3 — Đổi hướng màn hình

- **Given** đang ở câu 4, đã nhập một phần đáp án
- **When** xoay iPad từ dọc sang ngang và ngược lại
- **Then** vẫn ở câu 4, timer tiếp tục, nội dung đã nhập/đã chọn không mất, layout thích ứng, không có lỗi console.

### AC4 — Phone và desktop không bị regression

- **Given** viewport 390×844 và 1440×900
- **When** chơi một lượt Luyện tập
- **Then** phone không tràn ngang, nút bấm ≥ 48px, đáp án số xếp 2 cột; desktop giữ bố cục và khoảng cách tương đương hiện tại (sai lệch chỉ ở mức chấp nhận được).

### AC5 — Chạm thay vì kéo

- **Given** câu sắp xếp số hoặc ngày tương đối trên iPad
- **When** chỉ dùng thao tác chạm (không kéo)
- **Then** vẫn hoàn thành và trả lời được; trạng thái thẻ đã chọn được làm nổi bật.

### AC6 — Đăng xuất từ Home

- **Given** đã đăng nhập ở Home
- **When** bấm Đăng xuất → xác nhận
- **Then** quay về Setup, form trống, không còn tên cũ; tải lại trang vẫn ở Setup; điểm/tiến độ vẫn còn (mặc định).

### AC7 — Đăng xuất từ Quiz

- **Given** đang chơi dở câu 5
- **When** bấm Đăng xuất → xác nhận
- **Then** timer dừng, không có âm thanh/timeout nào chạy tiếp, không ghi thêm kết quả; lượt chơi không được tính vào `completedChallenges`.

### AC8 — Huỷ đăng xuất

- **Given** modal đăng xuất đang mở
- **When** bấm "Ở lại", bấm nền, hoặc nhấn Esc
- **Then** modal đóng, vẫn ở màn hiện tại, mọi state (câu, điểm, timer) giữ nguyên.

### AC9 — Xoá dữ liệu khi đăng xuất (tuỳ chọn)

- **Given** modal đăng xuất
- **When** tick "Xoá cả tiến độ và lịch sử" rồi xác nhận
- **Then** điểm, huy hiệu, thử thách, lịch sử, log đều về 0; tải lại vẫn ở Setup.

### AC10 — Luyện tập: sai lần 1

- **Given** chế độ Luyện tập, câu hỏi bất kỳ
- **When** trả lời sai lần đầu
- **Then** không chuyển câu; thẻ gợi ý có 💡 và chữ lớn hơn hiện ra; đáp án sai bị đánh dấu (nếu là dạng chọn); trẻ có thể trả lời lại; timer tiếp tục.

### AC11 — Luyện tập: lần 2

- **Given** đã sai lần đầu và đang ở lần trả lời thứ hai
- **When** trả lời đúng
- **Then** nhận +5 điểm, ghi `attemptCount: 2`, `hintShown: true`, chuyển câu sau ~950ms.
- **When** trả lời sai
- **Then** ghi nhận sai, tăng chuỗi sai 1 lần, chuyển câu sau ~1.45s; không có lần thứ ba.

### AC12 — Luyện tập: hết giờ

- **Given** đang ở lần trả lời thứ nhất hoặc thứ hai
- **When** hết giờ
- **Then** câu kết thúc ngay, tính sai, không cho retry, chuyển câu; log `timedOut: true`.

### AC13 — Thử thách: không gợi ý, không retry

- **Given** chế độ Thử thách
- **When** trả lời sai lần đầu
- **Then** chuyển câu sau ~1.45s; **không** có thẻ gợi ý, không có nút gợi ý, owl không nhắc gợi ý; `hintShown: false` trong log.

### AC14 — Không lẫn trạng thái giữa 2 chế độ

- **Given** vừa chơi Luyện tập và đã hiện gợi ý
- **When** bắt đầu lượt Thử thách mới
- **Then** không còn gợi ý/flash nào từ lượt trước; câu đầu tiên sạch trạng thái.

### AC15 — Build và chất lượng

- **Given** mã nguồn sau thay đổi
- **When** chạy `npm run build`
- **Then** TypeScript + Vite build pass; không lỗi console khi chơi thử; không thêm dependency mới.

### AC16 — Không giữ focus ở đáp án câu trước

- **Given** đang ở câu N và vừa bấm/Enter vào một đáp án hoặc đang focus ô nhập
- **When** câu N+1 được hiển thị (do đúng, sai lần 2, hoặc hết giờ)
- **Then** không đáp án/ô nhập/nút "Trả lời" nào của câu cũ còn focus; không có viền focus trên đáp án mới; focus nằm ở `.question-box` (tabIndex `-1`) và trình đọc màn hình đọc được đề mới; bàn phím ảo đã đóng.
- **Given** đang ở câu N+1
- **When** nhấn Tab
- **Then** focus đi tới phần tử tương tác đầu tiên theo DOM (không bị kẹt ở khung đề).

---

## 9. Kế hoạch kiểm thử

### 9.1. Ma trận thiết bị / viewport

| Nhóm | Viewport | Nội dung kiểm tra |
|---|---|---|
| Phone nhỏ | 360×740, 390×844 | Setup, Home, Map, Quiz, modal, hint |
| Phone ngang | 844×390 | Quiz, modal, bàn phím ảo |
| iPad dọc | 744×1133, 768×1024, 810×1080, 820×1180, 834×1194 | Tất cả màn, đặc biệt Map/Home stats/Quiz |
| iPad ngang | 1024×768, 1180×820, 1194×834 | Quiz 2 cột, top bar, modal |
| Desktop | 1366×768, 1440×900, 1920×1080 | Không regression |

Trình duyệt: Safari iPadOS (bắt buộc, thiết bị thật nếu có), Chrome/Edge desktop, Chrome DevTools device emulation.

### 9.2. Kịch bản thủ công

1. Mỗi viewport: mở 6 màn, kiểm tra `scrollWidth` và chụp ảnh đối chiếu.
2. iPad dọc: chơi hết 1 lượt Luyện tập gồm đủ 8 dạng câu (nếu sinh được) để kiểm tra retry từng dạng.
3. Trắc nghiệm: sai lần 1 → thấy gợi ý, đáp án sai bị khoá → chọn đáp án khác → đúng +5.
4. Nhập số: sai lần 1 → ô nhập được reset, gợi ý hiện → nhập lại.
5. Sắp xếp số: sai lần 1 → ô sai nhấp nháy/đánh dấu, thẻ về chỗ cũ, gợi ý hiện → xếp lại.
6. Sai lần 2 ở tất cả dạng: chuyển câu sau ~1.45s, không có lần 3.
7. Hết giờ ở lần 1 và lần 2: chuyển câu ngay, không retry.
8. Thử thách: sai lần 1 → chuyển câu; xác nhận không có `div.hint-card`, log `hintShown=false`.
9. Chuyển từ Luyện tập sang Thử thách: không còn gợi ý treo.
10. Đăng xuất ở từng màn; kiểm tra localStorage; reload; đăng nhập lại.
11. Đăng xuất khi đang có timeout chờ chuyển câu; đảm bảo không có setState sau khi unmount trang.
12. Xoay iPad khi đang ở câu hỏi và khi modal mở.
13. Bấm đúp liên tục vào đáp án: chỉ 1 lượt.
14. Bật "Giảm chuyển động" trên iPadOS: không animation.
15. Focus: dùng phím Tab/Enter chọn đáp án, chờ sang câu mới → kiểm tra `document.activeElement` là `.question-box`, không phải nút đáp án; thử với câu nhập số để chắc bàn phím ảo đóng.
16. Focus: mở modal Đăng xuất ngay khi vừa chuyển câu → focus vẫn ở modal, không bị kéo về đề.

### 9.3. Kiểm tra tự động / có thể script

- Unit test (nếu bổ sung test runner): hàm quyết định `canRetry(mode, attemptCount)` và `earnedPoints(attemptCount)`.
- Smoke test bằng script kiểm tra build và render các màn ở 3 viewport (Playwright nếu được thêm; nếu không, kiểm tra thủ công).
- `npm run build` là điều kiện bắt buộc.

---

## 10. Migration / tương thích ngược

- Không đổi key `localStorage`; dữ liệu tiến độ/huy hiệu/lịch sử hiện có giữ nguyên.
- Không đổi schema bắt buộc của `PlaySessionRecord`; chỉ thêm field tuỳ chọn.
- Người dùng đang có profile: sau khi cập nhật vẫn vào Home như cũ; chỉ khi bấm Đăng xuất mới về Setup.
- Lượt chơi cũ trong lịch sử không bị ảnh hưởng; các bản ghi cũ không có `retried` vẫn đọc bình thường.
- Hành vi Thử thách giữ nguyên; chỉ khác là gợi ý bị loại bỏ (đúng yêu cầu).
- Desktop giữ giao diện hiện tại; thay đổi chủ yếu ở breakpoint ≤ 899px.

---

## 11. Câu hỏi cần chốt trước khi thiết kế/triển khai

| # | Câu hỏi | Đề xuất |
|---|---|---|
| Q1 | Đăng xuất có giữ tiến độ trên thiết bị không? | **Giữ** (mặc định), kèm checkbox "Xoá cả tiến độ và lịch sử" trong modal |
| Q2 | Nút Đăng xuất đặt ở đâu? | **Cuối top bar**, hiện trên mọi màn đã đăng nhập |
| Q3 | Có cho trả lời lại với câu trắc nghiệm không? | **Có**, áp dụng mọi dạng câu ở Luyện tập |
| Q4 | Gợi ý hiện ngay sau lần sai đầu hay theo chuỗi sai? | **Ngay sau lần sai đầu**, chỉ ở Luyện tập |
| Q5 | Hết giờ có được trả lời lại không? | **Không**, kết thúc câu ngay |
| Q6 | Điểm khi đúng lần 2? | **+5** như hiện tại |
| Q7 | Có giữ hình phạt −5 khi sai 3 câu liên tiếp? | **Giữ**, tính theo câu đã kết thúc |
| Q8 | Owl trên tablet dọc ở màn Quiz/Result? | **Thu gọn**, không ẩn hoàn toàn; ẩn trên màn hình rất thấp (landscape phone) |
| Q9 | Breakpoint chốt? | **599 / 899 / 1199** (phone / tablet dọc / tablet ngang) |
| Q10 | Có cần nút "Xem gợi ý" chủ động trước khi sai không? | **Không** cho MVP; gợi ý chỉ xuất hiện sau lần sai đầu |
| Q11 | Khi chuyển câu, đưa focus về đâu? | **Khung đề bài** (`.question-box`, `tabIndex=-1`) sau khi blur phần tử cũ; không auto-focus đáp án/ô nhập |

> Nếu chọn phương án khác, chỉ cần sửa mục 5.2–5.5 và AC tương ứng trước khi code.

---

## 12. Task breakdown đề xuất (sau khi approve)

| Task | Nội dung | Phụ thuộc | Ước lượng |
|---|---|---|---|
| T1 | Nền tảng CSS: breakpoint 599/899/1199, `dvh`, safe-area, hover/touch, scroll reset, sticky | — | 0.5 ngày |
| T2 | Refactor top bar + nút Đăng xuất responsive (class thay `nth-child`) | T1 | 0.5 ngày |
| T3 | Modal xác nhận đăng xuất + dọn state + tuỳ chọn xoá dữ liệu | T2 | 0.5 ngày |
| T4 | Layout tablet dọc/ngang cho Setup, Home, Map, Selection, Result | T1 | 1 ngày |
| T5 | Tối ưu Quiz iPad: meta sticky, owl compact, answer grid, bàn phím ảo, landscape thấp, focus về đề khi chuyển câu | T1, T2 | 1 ngày |
| T6 | State machine trả lời lại ở Luyện tập + chống double-tap + reset UI từng dạng câu | T1 | 1 ngày |
| T7 | Thẻ gợi ý (icon + font lớn) + loại bỏ gợi ý khỏi Thử thách + config `attempts` | T6 | 0.5 ngày |
| T8 | Log/history (`attemptCount`, `hintShown`, field tuỳ chọn) + cập nhật README/specs | T6, T7 | 0.5 ngày |
| T9 | QA thiết bị thật/emulator, sửa lỗi, `npm run build`, chụp ảnh đối chiếu | T2–T8 | 1 ngày |

**Tổng:** khoảng **6.5 ngày công** (có thể song song T2–T5 với T6–T7 để rút ngắn).

Thứ tự triển khai khuyến nghị:

1. T1 → T2 → T3 (đăng xuất chạy được sớm, dễ test độc lập).
2. T4 → T5 (responsive hoàn chỉnh).
3. T6 → T7 → T8 (gameplay + log).
4. T9 (QA toàn bộ, đặc biệt iPad thật).

---

## 13. Checklist phê duyệt

Đã chốt toàn bộ Q1–Q11 và task breakdown ngày 29/10/2026.

- [x] Chốt Q1–Q11 (mục 11)
- [x] Chốt breakpoint 599 / 899 / 1199
- [x] Chốt mặc định giữ tiến độ khi đăng xuất
- [x] Chốt gợi ý hiện ngay sau lần sai đầu ở Luyện tập
- [x] Chốt Thử thách không gợi ý, không retry
- [x] Chốt vị trí nút Đăng xuất trên top bar
- [x] Chốt phạm vi responsive tablet (2–3 cột Map/Stats)
- [x] Chốt focus về khung đề khi chuyển câu, không auto-focus đáp án
- [x] Đồng ý task breakdown mục 12

---

## 14. Phụ lục — Đối chiếu hành vi hiện tại và mong muốn

### 14.1. Bảng hành vi trả lời

| Tình huống | Luyện tập hiện tại | Luyện tập sau cập nhật | Thử thách hiện tại | Thử thách sau cập nhật |
|---|---|---|---|---|
| Đúng lần 1 | +10, câu tiếp | +10, câu tiếp | +10, câu tiếp | +10, câu tiếp |
| Sai lần 1 — trắc nghiệm | Chuyển câu | **Ở lại, hiện gợi ý, cho chọn lại** | Chuyển câu | Chuyển câu (không gợi ý) |
| Sai lần 1 — nhập số | Cho làm lại (không gợi ý nếu chưa sai câu trước) | **Ở lại, hiện gợi ý** | Chuyển câu | Chuyển câu |
| Sai lần 2 | Chuyển câu | Chuyển câu | Không có | Không có |
| Đúng lần 2 | +5 | +5 | Không có | Không có |
| Hết giờ | Chuyển câu | Chuyển câu | Chuyển câu | Chuyển câu |
| Gợi ý | Sau 2 câu sai liên tiếp, có thể treo sang câu sau | **Ngay sau lần sai đầu, reset mỗi câu** | Có thể hiện (không mong muốn) | **Không bao giờ** |

### 14.2. Wireframe logic thẻ gợi ý

```
┌──────────────────────────────────────────┐
│  Câu 4/10          ⭐ 30          22s    │
│  Tiến độ mở khóa ...                     │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░   │
├──────────────────────────────────────────┤
│                                          │
│              47 + 38 = ?                 │
│                                          │
├──────────────────────────────────────────┤
│ 💡 Gợi ý: Cộng hàng đơn vị trước...      │  ← chữ lớn hơn feedback thường
├──────────────────────────────────────────┤
│   [ 75 ]        [ 85 ]                   │
│   [ 95 ]        [ 84 ]                   │
└──────────────────────────────────────────┘
```

### 14.3. Wireframe top bar tablet dọc

```
┌──────┬──────────────────┬────────┬─────────┬──────┬────────────┐
│  ⌂   │ Minh Anh         │ ⭐ 30  │ 🏆 12   │  🔊  │ Đăng xuất  │
│      │ Lớp 2            │        │ 8 lượt  │      │            │
└──────┴──────────────────┴────────┴─────────┴──────┴────────────┘
```

> Chi tiết mỹ thuật (màu, bo góc, icon chính xác) sẽ chốt ở bước design; tài liệu này khoá hành vi và bố cục.

### 14.4. Focus khi chuyển câu

```
Câu N:  [75] [85] [95] [84]
             ↑ focus sau khi bấm

        (chuyển câu)

Câu N+1: ┌─────────────────────┐
         │  56 + 27 = ?        │  ← focus ở khung đề, không viền
         └─────────────────────┘
         [83] [73] [93] [82]      ← không nút nào bị focus
```

- `document.activeElement` sau chuyển câu phải là `.question-box`.
- Tab tiếp theo đi vào đáp án đầu tiên (theo DOM), không bị kẹt.
- Với câu nhập số, bàn phím ảo đóng trước khi focus khung đề.

---

## 15. Trạng thái triển khai và kết quả QA

### 15.1. Đã triển khai

- `index.html`: `viewport-fit=cover`.
- `src/game/gameConfig.ts`: `attempts` + `getAttemptConfig()`.
- `src/App.tsx`: top bar mới, Đăng xuất + modal, retry Luyện tập, thẻ gợi ý, khoá đáp án sai, reset sort, focus/scroll khi chuyển câu.
- `src/styles.css`: breakpoint 599/899/1199, layout phone/tablet, top bar, sticky quiz status, hint card, modal, dvh/safe-area, hover/reduced-motion.
- `src/types.ts`, `src/utils/appLogger.ts`: `attemptCount`, `hintShown`, `retried`, `hintText`.
- `README.md` và các file trong `specs/`: cập nhật tài liệu.

### 15.2. Kết quả QA (mô phỏng viewport bằng iframe)

| Hạng mục | Kết quả |
|---|---|
| Build `npm run build` | Pass |
| Tràn ngang 390/768/820/834/1024/1194/1440 | Không |
| Phone 390: Home/Map/Selection/Quiz | Đúng cột; nút Bắt đầu luyện tập nằm trong khung nhìn đầu |
| Tablet dọc: stats 4 cột, map 3 cột, selection 3 cột | Đạt |
| Quiz 390: đề + 4 đáp án + meta trong khung nhìn đầu | Đạt; hint không tràn |
| Quiz tablet: `.quiz-status` sticky, owl compact | Đạt |
| Retry Luyện tập (chọn/nhập số) | Sai 1 → hint + khoá đáp án + giữ câu; sai 2 → chuyển câu; đúng 2 → +5 |
| Timeout | Kết thúc ngay, không retry, log `attemptCount:1`, chuyển câu |
| Thử thách | 1 lượt, không hint, `retried:false`, chuyển câu |
| Đăng xuất mặc định | Về Setup, giữ progress, dừng timer |
| Đăng xuất + xoá dữ liệu | Log/lịch sử/progress về 0 |
| Modal | Focus "Ở lại", Esc/backdrop/nút đóng; giữ focus khi timer chuyển câu |
| Focus sau chuyển câu | `document.activeElement` là `.question-box` |
| Reduced motion | CSS tắt animation/transition |

### 15.3. Còn lại

- Kiểm tra trên iPad thật (Safari, bàn phím ảo, xoay ngang/dọc) và chụp ảnh đối chiếu nếu cần.
- Chơi đủ 8 dạng câu để xác nhận retry cho sắp xếp/ngày tương đối trên thiết bị thật.
