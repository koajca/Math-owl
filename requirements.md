# Requirements — Cộng trừ có nhớ (Lớp 2)

- **Trạng thái:** Đã triển khai — 23/10/2026
- **Ngày tạo:** 22/10/2026
- **Phạm vi:** Tính năng mới cho học sinh **Lớp 2**
- **Đã triển khai code.** Tóm tắt thay đổi và kết quả kiểm tra ở mục 16.
- **Tài liệu liên quan:** `math-game-requirement`, `specs/design.md`, `specs/system-design.md`, `specs/tasks.md`

---

## 1. Mục tiêu

Bổ sung dạng bài **cộng có nhớ / trừ có mượn** (gọi chung là "cộng trừ có nhớ") cho học sinh Lớp 2, với cách chơi tương đương chủ đề Cộng/Trừ không nhớ hiện có.

Đồng thời:

1. **Ẩn toàn bộ phần So sánh** khi người chơi chọn Lớp 2.
2. **Thay chỗ So sánh** bằng chủ đề mới **"Cộng trừ có nhớ"**.
3. Cho phép **cấu hình phạm vi** của dạng bài này, ví dụ:
   - Cộng trừ có nhớ **< 20**
   - Cộng trừ có nhớ **<= 99**
4. Giữ nguyên hành vi hiện tại của **Lớp 1**.

---

## 2. Hiện trạng liên quan

| Khu vực | Hiện tại | Ảnh hưởng bởi tính năng |
|---|---|---|
| `src/types.ts` | `Topic = addition, subtraction, comparison, mixed, tower` | Cần thêm topic `carry` |
| `src/game/gameConfig.ts` | Chỉ có `unlockRequirements`, `comparisonSigns` | Cần thêm config phạm vi/độ khó cho carry |
| `src/game/questionTemplateEngine.ts` | Sinh câu theo template + câu tương tác; chỉ có constraint `noCarry`/`noBorrow` | Cần constraint `hasCarry`/`hasBorrow` và range động |
| `src/data/questionTemplates.json` | 8 template: cộng/trừ không nhớ, so sánh, tìm số thiếu | Cần thêm template carry/borrow |
| `src/App.tsx` | Map cố định 5 node: Cộng, Trừ, So sánh, Tổng hợp, Tháp | Cần ẩn So sánh (Lớp 2), thêm node Cộng trừ có nhớ |
| `src/utils/appLogger.ts`, `sessionHistory.ts` | Log câu hỏi + lịch sử lượt chơi | Cần log thêm dấu hiệu carry/borrow và range |
| Hành vi Lớp 1 | Cộng/trừ không nhớ + So sánh | **Không đổi** |

Ghi chú kỹ thuật hiện tại:

- Template đang khai báo `grade: [1, 2]` cho hầu hết template, nên **grade chưa thực sự lọc nội dung**.
- `makeInteractiveQuestion()` chỉ gắn các dạng tương tác `sort-numbers`, `clock-hour`, `weekday-blank`, `relative-date` cho topic `comparison` hoặc `mixed`.
- `getLimit(grade, difficulty)` đang trả phạm vi cố định: Lớp 1 = 10/20/99, Lớp 2 = 40/80/99.

---

## 3. Phạm vi

### 3.1 In scope

- Dạng câu **cộng có nhớ** và **trừ có mượn** cho Lớp 2.
- Chủ đề mới **"Cộng trừ có nhớ"** thay cho "So sánh" ở Lớp 2.
- Cùng cơ chế chơi với Cộng/Trừ hiện tại: Luyện tập, Thử thách, 10 câu/lượt, timer, điểm, gợi ý, lời giải, log.
- Cấu hình phạm vi theo độ khó (ví dụ `<20` hoặc `<=99`).
- Ẩn câu hỏi So sánh ở mọi nơi với Lớp 2 (kể cả Tổng hợp/Tháp).
- Cập nhật hiển thị, tiến độ, huy hiệu, log.

### 3.2 Out of scope

- Nhân, chia, số thập phân, số có 3 chữ số.
- Thay đổi chương trình Lớp 1.
- Backend / đồng bộ nhiều thiết bị.
- Màn cài đặt dành cho phụ huynh (có thể làm sau; xem mục 12).
- Thay đổi cơ chế tính điểm, timer, mở khóa hiện có (trừ phần bổ sung topic/huy hiệu).

---

## 4. Định nghĩa

### 4.1 Cộng có nhớ

Phép cộng `a + b = c` được coi là **có nhớ** khi:

```text
ones(a) + ones(b) >= 10
```

Trong đó `ones(x) = x % 10`.

Ví dụ: `8 + 7 = 15`, `47 + 38 = 85`.

### 4.2 Trừ có mượn

Phép trừ `a - b = c` được coi là **có mượn** khi:

```text
a >= b
ones(a) < ones(b)
```

Kết quả `c >= 0`.

Ví dụ: `15 - 7 = 8`, `63 - 28 = 35`.

### 4.3 Phạm vi

- **`< 20`** (đọc là "nhỏ hơn 20"): mọi toán hạng và kết quả nằm trong `1..19`.
- **`<= 99`**: mọi toán hạng và kết quả nằm trong `1..99`.
- Có thể cấu hình thêm các mốc khác (ví dụ `<= 20`, `<= 50`) mà **không cần sửa code**.

> **Cần chốt:** `<20` có cho phép kết quả bằng `20` không? Đề xuất: **không** (dùng `1..19`). Nếu muốn `<=20` thì cấu hình `max = 20`.

---

## 5. Yêu cầu chức năng

### 5.1 Hành vi theo lớp

| Nội dung | Lớp 1 | Lớp 2 |
|---|---|---|
| Cộng/Trừ không nhớ | Giữ nguyên | Giữ nguyên (xem Q2) |
| So sánh | Giữ nguyên | **Ẩn hoàn toàn** |
| Cộng trừ có nhớ | Không hiển thị | **Hiển thị chủ đề mới** |
| Tổng hợp / Tháp | Giữ nguyên | Không sinh câu So sánh; ưu tiên/cho phép câu carry |

**Quy tắc ẩn So sánh với Lớp 2:**

- Không hiển thị node "So sánh" trên bản đồ.
- Không sinh câu `comparison-two-numbers`, `comparison-expression`.
- Không sinh câu có `questionType = 'compare'`.
- Không sinh dạng sắp xếp số (`sort-numbers`) nếu được xác định là thuộc nhóm So sánh (xem Q3).
- Không trả về câu So sánh trong `mixed` và `tower` của Lớp 2.

### 5.2 Chủ đề mới "Cộng trừ có nhớ"

- **Tên hiển thị:** `Cộng trừ có nhớ`
- **Mô tả ngắn:** `Cộng có nhớ & trừ có mượn`
- **Vị trí:** thay node "So sánh" trên bản đồ của Lớp 2.
- **Mở khóa:** mặc định mở sẵn (thay thế vị trí So sánh vốn mở sẵn).
- Trộn cả cộng có nhớ và trừ có mượn trong cùng một lượt (tỷ lệ cấu hình được, mặc định 50/50).
- Có thể chọn độ khó Dễ / Vừa / Khó như các chủ đề khác.
- Có thể chọn kiểu trả lời: Tự động / Chọn đáp án / Nhập số như các chủ đề khác.

### 5.3 Các dạng câu hỏi (gameplay parity)

Yêu cầu "tương tự phần chơi cộng, trừ không nhớ" được hiểu là dùng lại đúng bộ dạng câu và cơ chế:

| Dạng câu | Lớp 2 — Cộng trừ có nhớ | Ghi chú |
|---|---|---|
| Trắc nghiệm 3–4 đáp án | Có | Đáp án nhiễu quanh đáp án đúng, không trùng |
| Nhập đáp án | Có | So khớp số, hỗ trợ `05` = `5` |
| Điền số còn thiếu | Có | `__ + b = c`, `a + __ = c`, `a - __ = c`, `__ - b = c` |
| Bài toán lời văn | Có (tùy độ khó) | Cùng mẫu với cộng/trừ hiện tại |
| Ô trống tương tác (missing-equation) | Có | 4 lựa chọn, 1 đáp án đúng |
| So sánh dấu `> < =` | **Không** | Đã ẩn với Lớp 2 |
| Sắp xếp số | **Không** (đề xuất) | Thuộc nhóm So sánh/thứ tự |

Quy tắc hiển thị theo `answerMode` và `difficulty` giữ nguyên như hiện tại (`mapQuestionType`).

### 5.4 Sinh câu hỏi & ràng buộc

Mỗi câu carry/borrow phải thỏa **tất cả**:

1. **Đúng dấu hiệu có nhớ/có mượn**:
   - Cộng: `ones(a) + ones(b) >= 10`
   - Trừ: `a >= b` và `ones(a) < ones(b)`
2. **Trong phạm vi cấu hình**:
   - Mọi toán hạng và kết quả `>= min` và `<= max` của độ khó đang chọn.
3. **Không âm**: kết quả trừ `>= 0`.
4. **Có nghiệm duy nhất** với dạng điền số.
5. **Không trùng câu quá gần** trong cùng lượt 10 câu (giữ cơ chế `recentKeys`).
6. **Đáp án nhiễu hợp lệ**: không trùng đáp án đúng, nằm trong phạm vi, không âm.

### 5.5 Cấu hình độ khó / phạm vi

Đề xuất cấu hình tập trung trong `src/game/gameConfig.ts`:

```ts
export const gameConfig = {
  // ... các config hiện có

  carry: {
    enabledForGrades: [2],
    rangeByDifficulty: {
      easy:   { min: 2, max: 19 },   // "< 20"
      medium: { min: 2, max: 19 },   // "< 20"
      hard:   { min: 10, max: 99 },  // "<= 99"
    },
    requireCarryForAddition: true,
    requireBorrowForSubtraction: true,
    mix: { addition: 0.5, subtraction: 0.5 },
  },

  comparison: {
    enabledForGrades: [1], // Lớp 2 ẩn hoàn toàn
  },
} as const;
```

Yêu cầu:

- Đổi `max` (hoặc `min`) trong config là đủ để đổi phạm vi, **không sửa template hay engine**.
- Config áp dụng cho cả câu sinh từ template và câu tương tác.
- Nếu config không hợp lệ (min > max, max < 10 với carry…), game fallback về giá trị mặc định an toàn và ghi log cảnh báo.

**Ví dụ cấu hình:**

| Mong muốn | `min` | `max` |
|---|---:|---:|
| Cộng trừ có nhớ `< 20` | 2 | 19 |
| Cộng trừ có nhớ `<= 20` | 2 | 20 |
| Cộng trừ có nhớ `<= 99` | 10 | 99 |
| Chỉ cộng/trừ 2 chữ số | 10 | 99 |

> **Cần chốt:** cấu hình bằng file (`gameConfig.ts`) là đủ, hay cần thêm màn "Cài đặt" trong game để đổi phạm vi? Đề xuất MVP: **file config**, màn cài đặt để sau.

### 5.6 Điểm, thời gian, gợi ý, lời giải

Giữ nguyên 100% cơ chế hiện tại:

- Đúng lần đầu `+10`, đúng sau 1 lần sai `+5`.
- Sai 2 lần liên tiếp hiện gợi ý; sai 3 lần liên tiếp `-5`.
- Hết giờ tính là sai 1 lần, tự chuyển câu.
- Thưởng cuối lượt: 8/10 `+20`, 10/10 `+50` + huy hiệu.
- Timer theo độ khó: Dễ 30s, Vừa 25s, Khó 20s (dạng tương tác được nới như hiện tại).
- Gợi ý/lời giải phải dùng đúng số đã random và giải thích được "nhớ/mượn":
  - Ví dụ cộng: `8 + 7`: "8 + 7 = 15, viết 5 nhớ 1 sang hàng chục."
  - Ví dụ trừ: `15 - 7`: "5 không trừ được 7, mượn 1 chục thành 15 - 7 = 8."

### 5.7 Mở khóa & tiến độ

- Node "Cộng trừ có nhớ" thay node "So sánh" nên **mở sẵn** với Lớp 2.
- Hoàn thành lượt carry được tính vào:
  - `completedChallenges` (chế độ Thử thách)
  - `playedSessions`
  - `completedByTopic['carry']`
  - `completedByDifficulty`
- `getProgressMessage()` cập nhật câu chữ phù hợp.
- Không thay đổi mốc mở khóa hiện có (Vừa/Khó/Tổng hợp/Tháp).

### 5.8 Huy hiệu

- Thêm huy hiệu cho carry, ví dụ `carry_master` — "Bậc Thầy Nhớ & Mượn".
- Điều kiện đề xuất: hoàn thành 10/10 câu trong một lượt Thử thách thuộc chủ đề carry.
- Với Lớp 2, huy hiệu `comparison_eye` ("Mắt Cú So Sánh") không còn phát sinh.

### 5.9 Log & lịch sử chơi

Bổ sung vào log hiện có (không phá schema cũ):

- `topic: 'carry'`
- `variables.carryMode: 'addition-carry' | 'subtraction-borrow'`
- `variables.rangeMin`, `variables.rangeMax`
- `correctInteractionState` vẫn log như các dạng tương tác khác.

Log phải đủ để tái hiện và kiểm tra: đề, đáp án đúng, đáp án người chơi, đúng/sai, thời gian, điểm.

---

## 6. Thiết kế kỹ thuật đề xuất

### 6.1 Types (`src/types.ts`)

```ts
export type Topic =
  | 'addition'
  | 'subtraction'
  | 'carry'        // MỚI
  | 'comparison'
  | 'mixed'
  | 'tower';

export type CarryMode = 'addition-carry' | 'subtraction-borrow';

export interface CarryRange {
  min: number;
  max: number; // inclusive
}
```

- `TemplateTopic` thêm `'carry'`.
- `Question.topic` tự động bao gồm `'carry'` (vì chỉ loại trừ `'tower'`).
- Không thêm `QuestionType` mới; dùng lại các dạng hiện có.

### 6.2 Config (`src/game/gameConfig.ts`)

Thêm khối `carry` và `comparison.enabledForGrades` như mục 5.5.

### 6.3 Templates (`src/data/questionTemplates.json`)

Thêm tối thiểu 4 template:

| ID | Dạng | `answerRule` | Ràng buộc chính |
|---|---|---|---|
| `carry-addition-basic` | number-input | `sum` | `hasCarry`, `withinCarryRange` |
| `carry-subtraction-basic` | number-input | `difference` | `hasBorrow`, `withinCarryRange` |
| `carry-addition-word` | word-problem | `sum` | `hasCarry`, `withinCarryRange` |
| `carry-subtraction-word` | word-problem | `difference` | `hasBorrow`, `withinCarryRange` |

Mỗi template có `grade: [2]`, `topic: 'carry'`, `timeLimitSeconds`, `hintTemplate`, `solutionTemplate`, `validationExamples`.

> Biến `variables` khai báo khoảng rộng (ví dụ `1..99`); **constraint** mới chịu trách nhiệm lọc theo config phạm vi.

### 6.4 Engine (`src/game/questionTemplateEngine.ts`)

Thêm constraint:

- `hasCarry`: `ones(a) + ones(b) >= 10`
- `hasBorrow`: `a >= b && ones(a) < ones(b)`
- `withinCarryRange`: mọi toán hạng & kết quả nằm trong `[config.min, config.max]`
- (tùy chọn) `carryAdditionOnly`, `carrySubtractionOnly`

Cập nhật:

- `getLimit()`: trả phạm vi từ config khi topic là `carry`.
- `templateMatchesTopic()`: nhận `carry`.
- `makeInteractiveQuestion()`:
  - Thêm generator `missing-equation` cho carry (bỏ ràng buộc no-carry/no-borrow, thay bằng has-carry/has-borrow).
  - Với Lớp 2: không gọi các generator So sánh (`sort-numbers`), trừ khi Q3 chốt khác.
- `generateQuestionBatch()`:
  - Lọc template theo `comparison.enabledForGrades`.
  - Với Lớp 2, loại câu comparison khỏi mọi topic.
  - Đảm bảo đủ 10 câu; fallback hiện tại cần tránh sinh phép không nhớ khi đang ở topic carry.

### 6.5 UI (`src/App.tsx`)

- `topicName`: thêm `carry: 'Cộng trừ có nhớ'`.
- `topicDescription`: thêm `carry: 'Cộng có nhớ & trừ có mượn'`.
- `getUnlocked()`: thêm `carry` (mặc định `true`).
- `renderMap()`: danh sách node phụ thuộc grade:
  - Lớp 1: `addition, subtraction, comparison, mixed, tower`
  - Lớp 2: `addition, subtraction, carry, mixed, tower`
- `getBadges()`: thêm badge carry; không cấp `comparison_eye` cho Lớp 2.
- `startSession()`: `topic === 'tower' ? 'mixed' : topic` — giữ nguyên; carry truyền trực tiếp.
- Hiển thị mô tả phạm vi ở màn chọn độ khó, ví dụ: `Cộng trừ có nhớ <20` / `Cộng trừ có nhớ <=99` lấy từ config.

### 6.6 Logger / lịch sử

- Không đổi schema bắt buộc.
- Thêm field tùy chọn `carryMode`, `rangeMin`, `rangeMax` trong `variables`.
- Trang chủ có thể hiển thị phạm vi hiện tại của carry để dễ kiểm tra.

---

## 7. Quy tắc kiểm tra đáp án

- Trắc nghiệm: so khớp chuỗi đã chọn với `correctAnswer`.
- Nhập số / điền số: chuẩn hóa số (`05` = `5`) rồi so sánh.
- Ô trống tương tác: chọn 1 trong 4 đáp án, so khớp số.
- Không chấp nhận đáp án rỗng khi cần nhập.
- Sai lần đầu ở dạng không phải trắc nghiệm: cho làm lại 1 lần (giữ hành vi hiện tại).

---

## 8. Edge cases

1. Config `max < 10` nhưng bật carry → không thể sinh câu; phải fallback/log lỗi rõ ràng.
2. Config `min > max` → dùng mặc định an toàn.
3. Phạm vi quá hẹp (ví dụ `< 12`) → số biến thể ít, dễ trùng câu; cần cơ chế chống trùng và fallback.
4. Lớp 2 nhưng `profile.grade` thay đổi giữa lượt → dùng grade tại thời điểm bắt đầu lượt.
5. Người chơi Lớp 1 không bao giờ thấy carry; người chơi Lớp 2 không bao giờ thấy comparison.
6. Câu carry sinh ra nhưng vô tình không có nhớ/mượn do random → constraint phải chặn trước khi trả về.
7. Trừ có mượn nhưng kết quả âm → loại.
8. Câu điền số có nhiều nghiệm → loại.
9. Đáp án nhiễu trùng nhau hoặc trùng đáp án đúng → loại.
10. Log không được lộ đáp án trên màn chơi.

---

## 9. Acceptance Criteria

### AC1 — Bản đồ theo lớp

- **Given** người chơi chọn Lớp 1
- **When** vào bản đồ
- **Then** thấy `Cộng, Trừ, So sánh, Tổng hợp, Tháp` như hiện tại.

- **Given** người chơi chọn Lớp 2
- **When** vào bản đồ
- **Then** **không** thấy `So sánh`, và thấy `Cộng trừ có nhớ` ở vị trí tương ứng.

### AC2 — Không còn câu So sánh ở Lớp 2

- **Given** Lớp 2
- **When** chơi bất kỳ chủ đề nào (kể cả Tổng hợp/Tháp) trong 20 lượt
- **Then** không có câu `compare`, không có template comparison, không có `sort-numbers`.

### AC3 — Cộng có nhớ

- **Given** chủ đề `Cộng trừ có nhớ`, phạm vi `<20`
- **When** sinh 100 câu cộng
- **Then** mọi câu có `ones(a) + ones(b) >= 10`, mọi toán hạng và kết quả trong `1..19`.

### AC4 — Trừ có mượn

- **Given** chủ đề `Cộng trừ có nhớ`, phạm vi `<20`
- **When** sinh 100 câu trừ
- **Then** mọi câu có `a >= b`, `ones(a) < ones(b)`, kết quả `>= 0` và trong `1..19`.

### AC5 — Đổi phạm vi bằng config

- **Given** đổi `rangeByDifficulty.hard.max` từ `99` thành `50`
- **When** chơi độ khó Khó
- **Then** mọi câu có toán hạng/kết quả `<= 50`, không cần sửa code.

### AC6 — Parity với cộng/trừ không nhớ

- **Given** chủ đề carry
- **When** chơi Luyện tập và Thử thách
- **Then** có đủ 10 câu, timer, điểm, gợi ý sau 2 lần sai, lời giải, màn kết quả, huy hiệu và log giống chủ đề cộng/trừ hiện tại.

### AC7 — Lớp 1 không đổi

- **Given** Lớp 1
- **When** chơi tất cả chủ đề
- **Then** hành vi, nội dung, điểm, thời gian, log giữ nguyên như trước tính năng.

### AC8 — Log

- **Given** một câu carry được sinh
- **When** mở file log / lịch sử
- **Then** thấy `topic: 'carry'`, `carryMode`, `rangeMin`, `rangeMax`, đề, đáp án đúng, câu trả lời, đúng/sai.

---

## 10. Kế hoạch kiểm thử (khi develop)

1. **Unit test** cho `hasCarry`, `hasBorrow`, `withinCarryRange`.
2. **Unit test** cho `createChoices` với carry (không trùng, trong phạm vi).
3. **Smoke test** sinh 10 câu cho mọi tổ hợp:
   - Lớp 2 × {easy, medium, hard} × {carry, mixed, tower}
   - Kiểm tra không có comparison.
4. **Smoke test** Lớp 1 × tất cả topic → không regression.
5. **E2E**: chọn lớp 2 → map → carry → chơi hết 10 câu → kết quả → kiểm tra log/lịch sử.
6. **Test config**: đổi `max` trong `gameConfig` → chạy lại generator → đúng phạm vi.
7. **Test fallback**: config xấu → game vẫn chạy, log cảnh báo.

---

## 11. Migration / tương thích ngược

- Không đổi key `localStorage` hiện có.
- `ProgressState.completedByTopic` thêm key `carry` một cách tự nhiên (đang là `Partial<Record<Topic, number>>`).
- Người chơi Lớp 1 không bị ảnh hưởng.
- Người chơi Lớp 2 đã có tiến độ: giữ nguyên `completedChallenges`, điểm, huy hiệu cũ; chỉ ẩn comparison và thêm carry.
- Template cũ giữ nguyên; template comparison có thể chuyển `grade` thành `[1]` hoặc để engine lọc theo `comparison.enabledForGrades`.

---

## 12. Câu hỏi cần chốt trước khi develop

| # | Câu hỏi | Đề xuất |
|---|---|---|
| Q1 | Tính năng chỉ cho Lớp 2 hay cả Lớp 1? | **Chỉ Lớp 2** |
| Q2 | Node `Cộng` và `Trừ` của Lớp 2 có chuyển sang carry luôn không? | **Không** — giữ không nhớ; carry là chủ đề riêng |
| Q3 | Có giữ `sort-numbers` (sắp xếp số) cho Lớp 2 không? | **Bỏ** vì thuộc nhóm so sánh/thứ tự |
| Q4 | Có giữ `clock-hour`, `weekday-blank`, `relative-date` cho Lớp 2 không? | **Giữ** (không phải so sánh) |
| Q5 | `<20` có bao gồm `20` không? | **Không** — dùng `1..19` |
| Q6 | `<=99` có cho phép số 1 chữ số không? | **Có** với cộng; trừ cần `a >= b` |
| Q7 | Cấu hình bằng file hay cần màn cài đặt trong game? | **File `gameConfig.ts`** cho MVP |
| Q8 | Có cần bài toán lời văn cho carry không? | **Có**, tùy độ khó |
| Q9 | Huy hiệu carry tên/điều kiện? | `carry_master` khi 10/10 câu carry |
| Q10 | Mốc mở khóa carry? | **Mở sẵn** với Lớp 2 |

---

## 13. Checklist phê duyệt

- [x] Chốt Q1–Q10 ở mục 12
- [x] Chốt phạm vi mặc định theo độ khó (mục 5.5)
- [x] Chốt có/không giữ các dạng tương tác thời gian cho Lớp 2
- [x] Chốt tên chủ đề và huy hiệu
- [x] Chốt việc ẩn comparison khỏi `mixed`/`tower` của Lớp 2
- [x] Đồng ý chia task như mục 14

---

## 14. Task breakdown (đã triển khai)

| Task | Nội dung | Ước lượng |
|---|---|---|
| T1 | Thêm types + config `carry` | 0.5 ngày |
| T2 | Thêm 4 template carry vào JSON | 0.5 ngày |
| T3 | Thêm constraint `hasCarry`/`hasBorrow`/`withinCarryRange` + cập nhật engine | 1 ngày |
| T4 | Cập nhật UI map/topic/badge theo grade | 0.5 ngày |
| T5 | Cập nhật logger + lịch sử | 0.25 ngày |
| T6 | Test unit/smoke/E2E | 1 ngày |
| T7 | Cập nhật README/specs | 0.25 ngày |

---

## 15. Phụ lục — Ví dụ câu hỏi

**Cộng có nhớ `<20`**

```text
8 + 7 = ?
```

```text
__ + 9 = 16
```

**Trừ có mượn `<20`**

```text
15 - 7 = ?
```

```text
14 - __ = 8
```

**Cộng có nhớ `<=99`**

```text
47 + 38 = ?
```

**Trừ có mượn `<=99`**

```text
63 - 28 = ?
```

**Bài toán lời văn**

```text
Lan có 8 viên bi. Bạn cho thêm 7 viên bi. Hỏi Lan có tất cả bao nhiêu viên bi?
```

**Gợi ý mẫu**

- Cộng: "8 + 7 = 15. 5 viết ở hàng đơn vị, nhớ 1 sang hàng chục."
- Trừ: "5 không trừ được 7, mượn 1 chục: 15 - 7 = 8."

---

## 16. Trạng thái triển khai (23/10/2026)

### Đã làm

| File | Thay đổi |
|---|---|
| `src/types.ts` | Thêm `Topic = 'carry'`, `TemplateTopic = 'carry'`, `CarryMode` |
| `src/game/gameConfig.ts` | Thêm `carry.rangeByDifficulty` (easy/medium `2..19`, hard `10..99`), `carry.mix`, `comparison.enabledForGrades` |
| `src/game/questionTemplateEngine.ts` | Thêm `hasCarry`, `hasBorrow`, `withinCarryRange`, constraint cho câu điền số; sinh câu tương tác carry; lọc comparison theo grade; choices theo phạm vi carry |
| `src/data/questionTemplates.json` | Thêm 6 template carry: cộng/trừ cơ bản, bài toán lời văn, điền số còn thiếu |
| `src/data/questions.ts` | Fallback riêng cho topic carry (không sinh câu không nhớ) |
| `src/App.tsx` | Map Lớp 2 có `Cộng trừ có nhớ`, không có `So sánh`; hiển thị phạm vi ở màn chọn độ khó; badge `carry_master`; sửa lỗi chấm điểm cuối lượt dùng state cũ |
| `src/styles.css` | Màu node `carry` |
| `README.md` | Cập nhật mô tả chủ đề và config |
| `requirements.md` | Cập nhật trạng thái triển khai |

### Kết quả kiểm tra

- `npm run build`: **pass** (`tsc && vite build`).
- Lớp 2, carry Dễ/Vừa: 10/10 câu có nhớ hoặc mượn, mọi toán hạng/kết quả trong `2..19`, không có câu comparison.
- Lớp 2, carry Khó: mọi toán hạng/kết quả trong `10..99`, có nhớ/mượn.
- Lớp 2, Tổng hợp: không sinh `compare`, không sinh `sort-numbers`; vẫn có carry và các dạng thời gian.
- Lớp 1: bản đồ vẫn có `So sánh`, không có `Cộng trừ có nhớ`; lượt So sánh chạy bình thường.
- Thử thách carry 10/10: `150` điểm, nhận `first_challenge`, `perfect_run`, `carry_master`.
- Dữ liệu kiểm thử đã được xóa khỏi `data/play-sessions.json`; giữ lại 3 lượt thật của `quang hai`.

### Ghi chú

- Dev server đã dừng sau khi kiểm tra. Chạy `npm run dev` để dùng lại tính năng ghi file JSON.
- Lượt chơi comparison cũ của Lớp 2 vẫn còn trong lịch sử (dữ liệu lịch sử, không phải câu mới sinh).
- Nếu config carry không hợp lệ, engine dùng phạm vi an toàn `2..19` và ghi cảnh báo ở môi trường dev.
