# Requirements — Cập nhật Giao diện & Tính năng Game Cú Mèo Toán Học

- **Trạng thái:** Đã triển khai — 02/11/2026
- **Ngày tạo:** 29/10/2026
- **Ngày chốt quyết định:** 29/10/2026 (xem [mục 0](#0-quyết-định-đã-chốt-29102026))
- **Phạm vi:** Tái cấu trúc hệ thống lớp, giao diện, và thiết kế độ khó cho 3 cấp: **Mầm non**, **Lớp 1**, **Lớp 2**
- **Tài liệu liên quan:** `requirements.md` (carry), `specs/design.md`, `specs/system-design.md`

---

## Mục lục

0. [Quyết định đã chốt](#0-quyết-định-đã-chốt-29102026)
1. [Tổng quan thay đổi](#1-tổng-quan-thay-đổi)
2. [Tái cấu trúc thư mục & file](#2-tái-cấu-trúc-thư-mục--file)
3. [Bổ sung cấp "Mầm non"](#3-bổ-sung-cấp-mầm-non)
4. [Ghép nút Cộng + Trừ → Cộng/Trừ](#4-ghép-nút-cộng--trừ--cộngtrừ)
5. [Thiết kế lại bản đồ chủ đề theo lớp](#5-thiết-kế-lại-bản-đồ-chủ-đề-theo-lớp)
6. [Thiết kế độ khó theo lứa tuổi](#6-thiết-kế-độ-khó-theo-lứa-tuổi)
7. [Nút "Tìm số" cho Lớp 1 & Lớp 2](#7-nút-tìm-số-cho-lớp-1--lớp-2)
8. [Thiết kế lại màn So sánh cho 3 cấp](#8-thiết-kế-lại-màn-so-sánh-cho-3-cấp)
9. [Cơ chế random xen lẫn bài giữa các cấp](#9-cơ-chế-random-xen-lẫn-bài-giữa-các-cấp)
10. [Giữ nguyên Tổng hợp & Thông thái](#10-giữ-nguyên-tổng-hợp--thông-thái)
11. [Cập nhật giao diện: Bỏ nút Xuất log & Lưu lịch sử](#11-cập-nhật-giao-diện-bỏ-nút-xuất-log--lưu-lịch-sử)
12. [Thiết kế lại màn Luyện tập & Thử thách](#12-thiết-kế-lại-màn-luyện-tập--thử-thách)
13. [Gợi ý thiết kế từ chuyên gia](#13-gợi-ý-thiết-kế-từ-chuyên-gia)
14. [Hiện trạng source code & ảnh hưởng](#14-hiện-trạng-source-code--ảnh-hưởng)
15. [Acceptance Criteria](#15-acceptance-criteria)
16. [Task breakdown](#16-task-breakdown)
17. [Edge cases](#17-edge-cases)

---

## 0. Quyết định đã chốt (29/10/2026)

Các quyết định dưới đây thay thế mọi nội dung mâu thuẫn trong tài liệu. Chi tiết triển khai nằm ở mục tương ứng.

| # | Quyết định | Ảnh hưởng |
|---|---|---|
| Q1 | Số câu/lượt: Mầm non **5**, Lớp 1 **8**, Lớp 2 **10** | Mục 6.4, 12, 15, 16 |
| Q2 | **Không** làm progressive difficulty trong 1 lượt (đưa vào backlog) | Mục 13.4, 17.7 |
| Q3 | Giữ `TemplateTopic` cũ, thêm lớp mapping `Topic → TemplateTopic[]`; `find-number` = `missing-number` + tag | Mục 4.2 |
| Q4 | Lớp 2 `add-sub`: **50% có nhớ, 50% không nhớ**; node `carry` riêng vẫn 100% có nhớ | Mục 6.1, 6.4 |
| Q5 | Migration: `add-sub = addition + subtraction` (cộng dồn); badge cũ giữ nguyên; type legacy cho log | Mục 17.6 |
| Q6 | `? - A = B` có ở **cả Lớp 1 và Lớp 2**, nhưng chỉ ở mức Khó | Mục 7.2, 7.5 |
| Q7 | `gameConfig` là source of truth, override `variables.min/max` và `timeLimitSeconds` của template | Mục 6.4, 6.5 |
| Q8 | Xen bài cấp dưới chỉ ở **Luyện tập**; bỏ qua `find-number`, `carry`; random 0–33% | Mục 9 |
| Q9 | So sánh Lớp 2 bật lại, không cần unlock; tỉ lệ dạng câu là xác suất; giữ ép dấu `=`; giữ dạng `A __ B` | Mục 3.5, 8.4 |
| Q10 | Mầm non ở Luyện tập: **3 lần thử** | Mục 12.2 |
| Q11 | Emoji minh họa, TTS, streak, pie chart → **backlog** | Mục 13 |
| Q12 | Theme xanh/cam áp dụng từ bản đồ → kết quả, chỉ thêm class modifier | Mục 12.2 |
| Q13 | `find-number` mặc định trắc nghiệm, cho phép nhập số; hint riêng từng pattern | Mục 7.4 |
| Q14 | **Giữ `data/play-sessions.json`**, không move vào `src/` | Mục 2.2 |
| Q15 | Chỉ ẩn nút log; giữ hàm export + auto-ghi file khi chạy dev | Mục 11 |
| Q16 | `perfect_run` = đúng toàn bộ lượt; thay 2 badge cộng/trừ bằng `add_sub_star`; `tower_wisdom` = 80% | Mục 7.6, 17.8 |
| Q17 | Giữ nguyên ngưỡng unlock; `find-number`/`comparison` mở ngay | Mục 5 |
| Q18 | Thêm Vitest + test generator cho các AC sinh câu | Mục 16 |

---

## 1. Tổng quan thay đổi

### 1.1 Tóm tắt

| # | Thay đổi | Mức ảnh hưởng |
|---|---|---|
| A | Di chuyển ảnh vào `src/assets/images/`; giữ nguyên `data/play-sessions.json` | Cấu trúc project |
| B | Thêm cấp **Mầm non** (grade = 0) | Types, Config, UI, Engine |
| C | Ghép **Cộng** + **Trừ** → **Cộng/Trừ** cho tất cả các lớp | UI, Engine |
| D | Bỏ nút "Xuất log" và "Lưu lịch sử chơi" ở màn Home | UI |
| E | Thiết kế lại màn Luyện tập & Thử thách | UI |
| F | Thiết kế lại độ khó phù hợp từng lứa tuổi | Config, Engine |
| G | Nút **"Tìm số"** cho Lớp 1 (không nhớ) & Lớp 2 (có nhớ) | Engine, UI |
| H | Thiết kế lại **So sánh** cho 3 cấp: biểu thức vs số | Engine, Templates |
| I | Random xen lẫn bài cấp dưới (≤33%) | Engine |
| J | Giữ nguyên **Tổng hợp** & **Thông thái** | Không đổi logic |

---

## 2. Tái cấu trúc thư mục & file

### 2.1 Di chuyển hình ảnh

**Hiện tại:** Các file ảnh nằm ở thư mục gốc:
```
math-owl/
├── bobo-after-answer.png
├── bobo-gameplay-desktop.png
├── bobo-home-desktop.png
├── bobo-home-mobile.png
├── bobo-home-tablet.png
```

**Sau khi chuyển:**
```
math-owl/
└── src/
    └── assets/
        └── images/
            ├── bobo-after-answer.png
            ├── bobo-gameplay-desktop.png
            ├── bobo-home-desktop.png
            ├── bobo-home-mobile.png
            └── bobo-home-tablet.png
```

**Tác động:**
- Không có file code nào (kể cả `README.md`) đang reference 5 ảnh này → chỉ cần `git mv`, không phải sửa import.
- Cập nhật `README.md` nếu sau này thêm ảnh minh họa.

### 2.2 Giữ nguyên `data/play-sessions.json` (đã chốt — Q14)

**Quyết định:** **Không** di chuyển file. Giữ nguyên `data/play-sessions.json` và `SESSIONS_FILE` trong `vite.config.ts`.

**Lý do:**
- File hiện không nằm trong repo (đã có trong `.gitignore`), dev server tự tạo khi chạy `npm run dev`.
- Nếu đặt trong `src/`, dev server sẽ ghi file vào thư mục source → Vite watcher phát hiện thay đổi liên tục, dễ HMR loop và lẫn file runtime với code.
- File này không được import ở đâu nên không có lợi ích gì khi move.

**Việc cần làm:** không sửa code; chỉ cập nhật README/specs nếu cần.

---

## 3. Bổ sung cấp "Mầm non"

### 3.1 Định nghĩa

| Thuộc tính | Giá trị |
|---|---|
| Grade code | `0` |
| Tên hiển thị | `Mầm non` |
| Đối tượng | Trẻ 5–6 tuổi (lớp Lá / chuẩn bị vào lớp 1) |
| Phạm vi toán | Cộng, trừ trong phạm vi ≤ 10 |
| Nút chủ đề | **Cộng/Trừ**, **So sánh**, **Tổng hợp** (mở khóa), **Thông thái** (mở khóa) |

### 3.2 Thay đổi Types (`src/types.ts`)

```ts
// TRƯỚC:
export type Grade = 1 | 2;

// SAU:
export type Grade = 0 | 1 | 2;
```

### 3.3 Thay đổi UI — Màn đăng nhập (`src/App.tsx`)

Thêm nút "Mầm non" bên cạnh "Lớp 1", "Lớp 2" trong `renderSetup()`:

```
[Mầm non]  [Lớp 1]  [Lớp 2]
```

**Mặc định khi chọn Mầm non:**
- `playerGrade = 0`
- Subtitle: `'Luyện cộng, trừ trong phạm vi 10 qua các thử thách vui nhộn.'`

### 3.4 Thay đổi top-bar

Hiện tại: `Lớp {grade}`. Cần xử lý `grade === 0`:

```tsx
<span>{grade === 0 ? 'Mầm non' : `Lớp ${grade}`}</span>
```

### 3.5 Thay đổi Config (`src/game/gameConfig.ts`)

```ts
carry: {
  enabledForGrades: [2],  // Mầm non và Lớp 1 không có carry
  // ...
},
comparison: {
  enabledForGrades: [0, 1, 2], // 3 cấp đều có So sánh (thiết kế mới)
},
```

### 3.6 Chủ đề khả dụng theo lớp

| Chủ đề | Mầm non (0) | Lớp 1 | Lớp 2 |
|---|:---:|:---:|:---:|
| **Cộng/Trừ** | ✅ | ✅ | ✅ |
| **Tìm số** | ❌ | ✅ | ✅ |
| **So sánh** | ✅ (đơn giản) | ✅ (biểu thức) | ✅ (có nhớ) |
| **Cộng trừ có nhớ** | ❌ | ❌ | ✅ |
| **Tổng hợp** | ✅ (khi mở khóa) | ✅ (khi mở khóa) | ✅ (khi mở khóa) |
| **Thông thái** | ✅ (khi mở khóa) | ✅ (khi mở khóa) | ✅ (khi mở khóa) |

---

## 4. Ghép nút Cộng + Trừ → Cộng/Trừ

### 4.1 Mô tả

Hiện tại bản đồ hiển thị 2 node riêng biệt: **"Cộng"** (`addition`) và **"Trừ"** (`subtraction`).

**Yêu cầu:** Ghép thành 1 node duy nhất **"Cộng/Trừ"** cho **tất cả các lớp** (Mầm non, Lớp 1, Lớp 2).

### 4.2 Thay đổi Topic type

```ts
// TRƯỚC:
export type Topic = 'addition' | 'subtraction' | 'carry' | 'comparison' | 'mixed' | 'tower';

// SAU:
export type Topic = 'add-sub' | 'find-number' | 'carry' | 'comparison' | 'mixed' | 'tower';
```

> **Lưu ý:** `addition` và `subtraction` riêng lẻ bị loại bỏ khỏi UI, thay bằng `add-sub`. Tuy nhiên, trong engine nội bộ (template, generator), vẫn cần phân biệt để sinh câu cộng vs trừ.

**Ánh xạ engine (đã chốt — Q3):**

| Topic UI | Template topic dùng để lọc | Ghi chú |
|---|---|---|
| `add-sub` | `addition` + `subtraction` | Engine pick template trong cả 2 nhóm theo `addSub.mix` |
| `find-number` | `missing-number` + tag `find-number` | Tận dụng `makeMissingEquationQuestion()` |
| `carry` | `carry` | Không đổi |
| `comparison` | `comparison` | Thêm template biểu thức |

- Không đổi schema `TemplateTopic` trong `src/types.ts`; chỉ thêm lớp mapping `Topic → TemplateTopic[]` ở engine.
- Log/session cũ có thể chứa `addition`/`subtraction` → khai báo type legacy riêng ở tầng đọc log, không đổi `Topic` chính.

### 4.3 Cách sinh câu khi chọn "Cộng/Trừ"

Khi user chọn **Cộng/Trừ**:
- Random 50% câu dạng **A + B = ?**
- Random 50% câu dạng **A - B = ?**
- Tỷ lệ có thể cấu hình trong `gameConfig`:
  ```ts
  addSub: {
    mix: { addition: 0.5, subtraction: 0.5 },
  },
  ```

### 4.4 Thay đổi UI hiển thị

```ts
const topicName: Record<Topic, string> = {
  'add-sub': 'Cộng/Trừ',
  'find-number': 'Tìm số',
  carry: 'Cộng trừ có nhớ',
  comparison: 'So sánh',
  mixed: 'Tổng hợp',
  tower: 'Tháp Thông Thái',
};

const topicDescription: Record<Topic, string> = {
  'add-sub': 'Phép cộng và phép trừ',
  'find-number': 'Tìm số còn thiếu',
  carry: 'Cộng có nhớ & trừ có mượn',
  comparison: 'So sánh số và biểu thức',
  mixed: 'Đỉnh Núi Tổng Hợp',
  tower: 'Thử thách nâng cao',
};
```

### 4.5 Styling node map mới

```css
.map-node.add-sub {
  background: linear-gradient(135deg, #e8f8ec, #fff4d2);
}

.map-node.find-number {
  background: #f0f4ff;
}
```

---

## 5. Thiết kế lại bản đồ chủ đề theo lớp

### 5.1 Bản đồ cho từng cấp

**Mầm non (grade = 0):**
```
[Cộng/Trừ]  [So sánh]  [Tổng hợp]  [Thông thái]
```

**Lớp 1 (grade = 1):**
```
[Cộng/Trừ]  [Tìm số]  [So sánh]  [Tổng hợp]  [Thông thái]
```

**Lớp 2 (grade = 2):**
```
[Cộng/Trừ]  [Tìm số]  [Cộng trừ có nhớ]  [So sánh]  [Tổng hợp]  [Thông thái]
```

### 5.2 Logic renderMap

```tsx
const renderMap = () => {
  const grade = state.profile?.grade ?? playerGrade;
  const nodes: Topic[] = [
    'add-sub',
    ...(grade >= 1 ? ['find-number' as Topic] : []),
    ...(grade === 2 ? ['carry' as Topic] : []),
    'comparison',
    'mixed',
    'tower',
  ];
  // ...
};
```

---

## 6. Thiết kế độ khó theo lứa tuổi

### 6.1 Bảng phạm vi — Cộng/Trừ

| Cấp | Dễ | Vừa | Khó | Đặc điểm |
|---|---|---|---|---|
| **Mầm non** | A, B ≤ 5, kết quả ≤ 10 | A, B ≤ 8, kết quả ≤ 10 | A, B ≤ 10, kết quả ≤ 10 | Cộng trừ đơn giản, kết quả ≤ 10 |
| **Lớp 1** | A, B ≤ 10 | A, B ≤ 50, không nhớ | A, B ≤ 100, không nhớ | Cộng trừ không nhớ |
| **Lớp 2** | A, B ≤ 50, 50% có nhớ | A, B ≤ 80, 50% có nhớ | A, B ≤ 100, 50% có nhớ | 50% câu có nhớ, 50% không nhớ (Q4) |

> **Đã chốt (Q4):** Lớp 2 `add-sub` trộn **50% có nhớ / 50% không nhớ**. Node `carry` ("Cộng trừ có nhớ") vẫn là 100% có nhớ — hai node không trùng nhau. Tỉ lệ 50% áp dụng trên phần câu của Lớp 2, không tính câu cấp dưới xen vào.

### 6.2 Bảng phạm vi — Tìm số (4 dạng)

| Cấp | Dễ | Vừa | Khó | Đặc điểm |
|---|---|---|---|---|
| **Lớp 1** | A, B < 10 | A, B < 20 | A, B < 100 | Phép tính không nhớ |
| **Lớp 2** | A, B < 20, có nhớ | A, B < 50, có nhớ | A, B < 100, có nhớ | Phép tính có nhớ |

### 6.3 Bảng phạm vi — So sánh

| Cấp | Dễ | Vừa | Khó | Đặc điểm |
|---|---|---|---|---|
| **Mầm non** | So sánh 2 số ≤ 10 | So sánh 2 số ≤ 10 | So sánh 2 số ≤ 10 | Chỉ `A __ B` |
| **Lớp 1** | `A+B __ C` hoặc `C __ A-B`, A,B,C ≤ 10 | A,B,C ≤ 50, không nhớ | A,B,C ≤ 100, không nhớ | Biểu thức vs số |
| **Lớp 2** | `A+B __ C` hoặc `C __ A-B`, A,B,C ≤ 20, có nhớ | A,B,C ≤ 50, có nhớ | A,B,C ≤ 100, có nhớ | Biểu thức có nhớ |

> **Lưu ý:** So sánh Lớp 2 luôn dùng phép **có nhớ/mượn** (100%), khác với `add-sub` Lớp 2 (50% có nhớ) — theo Q4/Q9.

### 6.4 Cấu hình trong gameConfig

```ts
export const gameConfig = {
  // ... existing configs

  gradeRanges: {
    0: { // Mầm non
      'add-sub': {
        easy:   { min: 1, max: 5, resultMax: 10 },
        medium: { min: 1, max: 8, resultMax: 10 },
        hard:   { min: 1, max: 10, resultMax: 10 },
      },
      comparison: {
        easy:   { min: 0, max: 10 },
        medium: { min: 0, max: 10 },
        hard:   { min: 0, max: 10 },
      },
    },
    1: { // Lớp 1
      'add-sub': {
        easy:   { min: 1, max: 10 },
        medium: { min: 1, max: 50 },
        hard:   { min: 1, max: 100 },
      },
      'find-number': {
        easy:   { min: 1, max: 9 },   // A, B < 10
        medium: { min: 1, max: 19 },  // A, B < 20
        hard:   { min: 1, max: 99 },  // A, B < 100
      },
      comparison: {
        easy:   { min: 0, max: 10 },
        medium: { min: 0, max: 50 },
        hard:   { min: 0, max: 100 },
      },
    },
    2: { // Lớp 2
      'add-sub': {
        easy:   { min: 1, max: 50 },
        medium: { min: 1, max: 80 },
        hard:   { min: 1, max: 100 },
      },
      'find-number': {
        easy:   { min: 1, max: 19 },
        medium: { min: 1, max: 49 },
        hard:   { min: 1, max: 99 },
      },
      comparison: {
        easy:   { min: 1, max: 20 },
        medium: { min: 1, max: 50 },
        hard:   { min: 1, max: 100 },
      },
    },
  },

  // Số câu mỗi lượt theo grade (Q1)
  questionsPerSession: {
    0: 5,
    1: 8,
    2: 10,
  },

  // Ràng buộc phép tính theo grade
  gradeConstraints: {
    0: { requireNoCarry: true, resultMax: 10, subtractNonNegative: true },
    1: { requireNoCarry: true, subtractNonNegative: true },
    // Lớp 2: 50% có nhớ, 50% không nhớ (Q4)
    2: { requireCarry: false, carryRatio: 0.5, subtractNonNegative: true },
  },
};
```

> **Đã chốt (Q7):** `gameConfig` là source of truth — các range trong `gradeRanges` **override** `variables.min/max` trong template; timer override `timeLimitSeconds`.

### 6.5 Time limit theo cấp

| Cấp | Dễ | Vừa | Khó |
|---|---|---|---|
| Mầm non | 45s | 35s | 30s |
| Lớp 1 | 30s | 25s | 20s |
| Lớp 2 | 30s | 25s | 20s |

> **Gợi ý:** Mầm non cần nhiều thời gian hơn vì trẻ đang tập đọc số và hiểu khái niệm.
>
> **Đã chốt (Q7):** thời gian mỗi câu lấy từ config theo (grade, difficulty) và **override** `timeLimitSeconds` trong template.

---

## 7. Nút "Tìm số" cho Lớp 1 & Lớp 2

### 7.1 Mô tả

Thêm chủ đề mới **"Tìm số"** (`find-number`) với các dạng:

| Pattern | Ví dụ | Cách giải |
|---|---|---|
| `A + ? = B` | `3 + ? = 8` | `B - A = 5` |
| `? + A = B` | `? + 4 = 9` | `B - A = 5` |
| `A - ? = B` | `7 - ? = 3` | `A - B = 4` |
| `? - A = B` | `? - 2 = 5` | `B + A = 7` |

### 7.2 Phạm vi theo lớp & độ khó

**Lớp 1 (không nhớ):**

| Độ khó | Phạm vi | Ràng buộc |
|---|---|---|
| Dễ | A, B < 10 | `noCarry`, `noBorrow` |
| Vừa | A, B < 20 | `noCarry`, `noBorrow` |
| Khó | A, B < 100 | `noCarry`, `noBorrow` |

**Lớp 2 (có nhớ):**

| Độ khó | Phạm vi | Ràng buộc |
|---|---|---|
| Dễ | A, B < 20 | `hasCarry`, `hasBorrow` |
| Vừa | A, B < 50 | `hasCarry`, `hasBorrow` |
| Khó | A, B < 100 | `hasCarry`, `hasBorrow` |

> **Đã chốt (Q6):** pattern `? - A = B` xuất hiện ở **cả Lớp 1 và Lớp 2**, nhưng chỉ ở mức **Khó**. Mức Dễ/Vừa chỉ dùng 2 dạng cộng (`A + ? = B`, `? + A = B`); 2 dạng trừ (`A - ? = B`, `? - A = B`) chỉ có ở mức Khó.

### 7.3 Thay đổi Types

```ts
// Thêm vào Topic:
export type Topic = 'add-sub' | 'find-number' | 'carry' | 'comparison' | 'mixed' | 'tower';
```

### 7.4 UI — Node trên bản đồ

```ts
{
  id: 'find-number',
  label: 'Tìm số',
  description: 'Tìm số còn thiếu trong phép tính',
  icon: '🔍', // hoặc '❓'
}
```

**Đã chốt (Q13):** `find-number` mặc định dùng **trắc nghiệm** (4 lựa chọn), vẫn cho phép người chơi chọn kiểu **nhập số**; mỗi pattern có hint riêng theo mục 13.2.

### 7.5 Engine — Generator

Tận dụng lại logic `makeMissingEquationQuestion()` hiện có trong `questionTemplateEngine.ts`, nhưng:
- Thêm constraint `noCarry`/`noBorrow` cho Lớp 1
- Thêm constraint `hasCarry`/`hasBorrow` cho Lớp 2
- `blank-left-subtract` (`? - A = B`) dùng cho **cả Lớp 1 và Lớp 2**, chỉ ở mức **Khó** (Q6)
- Phân bổ pattern theo độ khó: Dễ/Vừa chỉ 2 dạng cộng; Khó đủ 4 pattern
- Phạm vi lấy từ `gameConfig.gradeRanges[grade]['find-number'][difficulty]`

### 7.6 Badge

```ts
find_number_star: 'Thám Tử Số Học', // đúng toàn bộ câu Tìm số trong 1 lượt Thử thách
add_sub_star: 'Siêu Cộng Trừ',      // đúng toàn bộ câu Cộng/Trừ trong 1 lượt Thử thách (Q16)
```

---

## 8. Thiết kế lại màn So sánh cho 3 cấp

### 8.1 Dạng câu theo cấp

**Mầm non — So sánh 2 số đơn giản:**
```
A __ B
Ví dụ: 3 __ 7  →  <
       5 __ 5  →  =
       9 __ 2  →  >
```
- A, B ≤ 10
- Chỉ so sánh trực tiếp 2 số

**Lớp 1 — So sánh biểu thức vs số (không nhớ):**
```
A + B __ C      hoặc      C __ A + B
A - B __ C      hoặc      C __ A - B
```
Ví dụ:
```
3 + 5 __ 9   →  <
12 __ 7 + 4  →  >
8 - 3 __ 6   →  <
```
- Phép cộng/trừ không nhớ
- Phạm vi theo độ khó (dễ: ≤10, vừa: ≤50, khó: ≤100)

**Lớp 2 — So sánh biểu thức vs số (có nhớ):**
```
A + B __ C      hoặc      C __ A + B
A - B __ C      hoặc      C __ A - B
```
Ví dụ:
```
17 + 8 __ 26  →  <
30 __ 43 - 15 →  >
```
- Phép cộng/trừ có nhớ/mượn
- Phạm vi theo độ khó

### 8.2 Cấu trúc template mới

Thêm template `comparison-expr-vs-number`:
```json
{
  "id": "comparison-expr-num-add",
  "topic": "comparison",
  "grade": [1, 2],
  "questionType": "comparison-sign",
  "promptTemplate": "{{a}} + {{b}} __ {{c}}",
  "answerRule": "compareExprNum",
  "constraints": ["valuesWithinLimit", "noCarryForGrade1"]
}
```

Thêm template `comparison-num-vs-expr`:
```json
{
  "id": "comparison-num-expr-sub",
  "topic": "comparison",
  "grade": [1, 2],
  "questionType": "comparison-sign",
  "promptTemplate": "{{c}} __ {{a}} - {{b}}",
  "answerRule": "compareNumExpr",
  "constraints": ["valuesWithinLimit", "noBorrowForGrade1", "differenceNonNegative"]
}
```

### 8.3 Engine — Answer rules mới

```ts
if (rule === 'compareExprNum') {
  const exprValue = a + b; // hoặc a - b tuỳ operator
  const answer = exprValue === c ? '=' : exprValue > c ? '>' : '<';
  return { answer, derived: { exprValue } };
}

if (rule === 'compareNumExpr') {
  const exprValue = a - b; // hoặc a + b tuỳ operator
  const answer = c === exprValue ? '=' : c > exprValue ? '>' : '<';
  return { answer, derived: { exprValue } };
}
```

### 8.4 Random dạng so sánh

Khi chọn chủ đề "So sánh":
- **Mầm non:** 100% dạng `A __ B` (2 số đơn giản)
- **Lớp 1:** 30% dạng `A __ B`, 35% dạng `A±B __ C`, 35% dạng `C __ A±B`
- **Lớp 2:** 20% dạng `A __ B`, 40% dạng `A±B __ C`, 40% dạng `C __ A±B`

---

## 9. Cơ chế random xen lẫn bài giữa các cấp

### 9.1 Quy tắc

| Cấp đang chơi | Bài của cấp nào? | Tỉ lệ bài cấp dưới |
|---|---|---|
| **Mầm non** | 100% bài Mầm non | 0% |
| **Lớp 1** | Bài Lớp 1 + random bài Mầm non | ≤ 33% bài Mầm non |
| **Lớp 2** | Bài Lớp 2 + random bài Lớp 1 và Mầm non | ≤ 33% bài Lớp 1 hoặc Mầm non |

> **Đã chốt (Q8):** cơ chế xen bài cấp dưới **chỉ áp dụng ở chế độ Luyện tập**. Thử thách luôn 100% bài đúng cấp. Không áp dụng cho topic `find-number` và `carry`.

### 9.2 Cách tính

Với mỗi lượt (5/8/10 câu tuỳ cấp):
- **Lớp 1 (8 câu):** tối đa 2/8 câu có thể là bài Mầm non (random, không bắt buộc)
- **Lớp 2 (10 câu):** tối đa 3/10 câu có thể là bài Lớp 1 hoặc Mầm non (random)
- Số câu cấp dưới là random trong khoảng `0..floor(count * 0.33)`, không cố định đúng 33%.

### 9.3 Engine — generateQuestionBatch sửa đổi

```ts
function generateQuestionBatch(grade, topic, difficulty, count, answerMode) {
  const lowerEnabled = mode === 'practice' && topic !== 'find-number' && topic !== 'carry';
  const maxLowerGrade = Math.floor(count * 0.33); // Lớp 1 (8 câu): tối đa 2; Lớp 2 (10 câu): tối đa 3
  const lowerGradeCount = !lowerEnabled || grade === 0 ? 0 : randomInt(0, maxLowerGrade);
  const currentGradeCount = count - lowerGradeCount;

  // Sinh câu cho cấp hiện tại
  const currentQuestions = generateForGrade(grade, topic, difficulty, currentGradeCount, answerMode);

  // Sinh câu cho cấp dưới
  const lowerQuestions = [];
  if (grade === 1 && lowerGradeCount > 0) {
    lowerQuestions.push(...generateForGrade(0, topic, difficulty, lowerGradeCount, answerMode));
  }
  if (grade === 2 && lowerGradeCount > 0) {
    // Random từ Lớp 1 hoặc Mầm non
    const fromGrade1 = randomInt(0, lowerGradeCount);
    const fromGrade0 = lowerGradeCount - fromGrade1;
    lowerQuestions.push(...generateForGrade(1, topic, difficulty, fromGrade1, answerMode));
    lowerQuestions.push(...generateForGrade(0, topic, difficulty, fromGrade0, answerMode));
  }

  // Trộn đều
  return shuffle([...currentQuestions, ...lowerQuestions]);
}
```

### 9.4 Lưu ý

- Bài cấp dưới phải phù hợp với chủ đề đang chọn. Ví dụ: Lớp 1 chọn "Tìm số" → bài Mầm non không có "Tìm số" → không xen bài cấp dưới, sinh 100% bài Lớp 1.
- Khi topic ở cấp dưới không tồn tại → bỏ qua, sinh đủ bài cấp hiện tại.
- Áp dụng cho `add-sub`, `comparison`, `mixed`, `tower`. Riêng `mixed`/`tower` chỉ xen câu thuộc topic mà cấp dưới có.
- Câu cấp dưới vẫn tính điểm và badge bình thường.

---

## 10. Giữ nguyên Tổng hợp & Thông thái

### 10.1 Tổng hợp (`mixed`)

- Giữ nguyên logic: trộn tất cả chủ đề khả dụng theo lớp.
- **Mầm non:** trộn Cộng/Trừ + So sánh (đơn giản).
- **Lớp 1:** trộn Cộng/Trừ + Tìm số + So sánh.
- **Lớp 2:** trộn Cộng/Trừ + Tìm số + Cộng trừ có nhớ + So sánh.

### 10.2 Thông thái (`tower`)

- Giữ nguyên logic: thử thách nâng cao, trộn tất cả + câu tương tác.
- Vẫn áp dụng cơ chế mở khóa hiện tại.

---

## 11. Cập nhật giao diện: Bỏ nút Xuất log & Lưu lịch sử

### 11.1 Mô tả

Tại màn hình Home (sau khi đăng nhập), bỏ hoàn toàn 2 nút:
- **"Xuất log ({logCount})"**
- **"Lưu lịch sử chơi ({sessionCount})"**

### 11.2 Code cần xóa trong `renderHome()`

```tsx
// XÓA:
<button className="secondary-button" type="button" onClick={exportQuestionLogs}>
  Xuất log ({logCount})
</button>
<button className="secondary-button" type="button" onClick={exportSessionRecordsAsJson}>
  Lưu lịch sử chơi ({sessionCount})
</button>
```

### 11.3 State/import — đã chốt (Q15)

- Chỉ **ẩn UI**; giữ nguyên `exportQuestionLogs`, `exportSessionRecordsAsJson` và cơ chế auto-ghi `data/play-sessions.json` khi chạy dev để debug.
- Giữ `logCount`, `sessionCount` state (dùng cho stats grid nếu còn).
- Cập nhật README: bỏ mô tả nút "Lưu lịch sử chơi", giữ mô tả auto-ghi file khi dev.
- Bỏ storage note:
```tsx
// XÓA:
<p className="storage-note">
  Dữ liệu chơi được lưu tự động vào trình duyệt (localStorage) và file...
</p>
```

### 11.4 Stats grid đơn giản hóa

Giữ lại stats grid nhưng bỏ 2 ô "Log câu hỏi" và "Lượt chơi đã lưu":

```tsx
// GIỮ: Thử thách hoàn thành, Lượt đã chơi, Dễ đã xong, Vừa đã xong, Tổng điểm, Huy hiệu
// BỎ: Log câu hỏi, Lượt chơi đã lưu
```

---

## 12. Thiết kế lại màn Luyện tập & Thử thách

### 12.1 Hiện trạng

Hiện tại, cả 2 chế độ "Luyện tập" và "Thử thách" dùng chung giao diện:
1. Chọn chế độ → Bản đồ topic → Chọn độ khó & kiểu trả lời → Chơi 5/8/10 câu (tuỳ cấp) → Kết quả.

### 12.2 Thiết kế mới — Phân biệt rõ hơn

**Luyện tập (Practice):**
- Mục đích: Rèn luyện, không áp lực
- Giao diện: Tông màu **xanh lá** nhẹ nhàng
- Cho phép 2 lần thử (giữ nguyên); riêng **Mầm non: 3 lần thử** (Q10)
- Hiện gợi ý khi sai lần đầu (giữ nguyên)
- Không yêu cầu mở khóa chủ đề
- **Mầm non:** Timer dài hơn, khuyến khích bằng lời khen ngay cả khi sai

**Thử thách (Challenge):**
- Mục đích: Kiểm tra năng lực, tính điểm
- Giao diện: Tông màu **cam/coral** năng động
- Chỉ 1 lần thử (giữ nguyên)
- Không gợi ý (giữ nguyên)
- Yêu cầu mở khóa theo tiến độ
- Thưởng huy hiệu khi hoàn thành tốt

### 12.3 Cải tiến UI cho Mầm non

Khi `grade === 0`:
- **Font chữ câu hỏi lớn hơn** (`font-size` tăng ~20%)
- **Đáp án trắc nghiệm lớn hơn** (min-height tăng)
- **Màu sắc tươi sáng, có nhiều icon emoji hơn**
- **Cú Mèo có nhiều phản hồi khuyến khích hơn:**
  - Sai: "Không sao, con thử lại nhé! 💪"
  - Đúng: "Giỏi quá! Con thật tuyệt vời! 🌟"
  - Timeout: "Hết giờ rồi, mình cùng xem đáp án nhé! 😊"

---

## 13. Gợi ý thiết kế từ chuyên gia

> Với 10 năm kinh nghiệm thiết kế game giáo dục cho trẻ em, tôi có một số gợi ý quan trọng:

> **Phạm vi (Q11):** các đề xuất dưới đây mang tính tham khảo. Đã đưa vào **backlog**: minh họa emoji (13.1.2), TTS (13.1.4), streak bonus (13.4.2), pie chart kết quả (13.4.3), progressive difficulty (13.4.1). Đã chốt vào scope: số câu/lượt (13.1.1) và 3 lần thử cho Mầm non (13.3).

### 13.1 Thiết kế cho Mầm non — Những điều cần lưu ý đặc biệt

1. **Số lượng câu:** Mầm non nên giảm xuống **5-7 câu/lượt** thay vì 10. Trẻ 5-6 tuổi có khả năng tập trung ngắn (5-8 phút). Với 10 câu × 45s, lượt chơi có thể kéo dài 7-8 phút, quá dài cho lứa tuổi này.

   > **Đề xuất:** Config `questionsPerSession` theo grade:
   > - Mầm non: 5 câu
   > - Lớp 1: 8 câu
   > - Lớp 2: 10 câu

2. **Hình ảnh minh họa:** Thay vì chỉ hiện `3 + 5 = ?`, nên bổ sung hình minh họa (emoji/hình vẽ). Ví dụ: `🍎🍎🍎 + 🍎🍎🍎🍎🍎 = ?`. Điều này giúp trẻ Mầm non liên hệ trực quan.

3. **Phản hồi tích cực:** Trẻ Mầm non cần phản hồi tích cực nhiều hơn. Ngay cả khi sai, lời khuyến khích nên chiếm 70%, chỉ 30% là sửa lỗi.

4. **Âm thanh:** Cân nhắc thêm lời nói (text-to-speech) đọc đề cho Mầm non vì nhiều trẻ chưa đọc thạo số lớn hơn 5.

### 13.2 Thiết kế Tìm số — Gợi ý sư phạm

1. **Thứ tự pattern nên dạy dần:**
   - Giai đoạn 1 (dễ): `A + ? = B` → dễ hiểu nhất, chỉ cần trừ ngược
   - Giai đoạn 2 (vừa): `? + A = B` → cùng logic nhưng vị trí khác
   - Giai đoạn 3 (vừa-khó): `A - ? = B` → phép trừ ngược
   - Giai đoạn 4 (khó): `? - A = B` → khó nhất, cần cộng ngược

2. **Gợi ý hướng dẫn:** Mỗi pattern nên có gợi ý cụ thể:
   ```
   A + ? = B  → "Để tìm ?, con lấy B trừ A nhé!"
   ? + A = B  → "Cộng thì đổi chỗ cũng vậy. Con lấy B trừ A!"
   A - ? = B  → "Để tìm ?, con lấy A trừ B nhé!"
   ? - A = B  → "Để tìm ?, con lấy B cộng A nhé!"
   ```

### 13.3 Cấu trúc session hợp lý

| Tiêu chí | Mầm non | Lớp 1 | Lớp 2 |
|---|---|---|---|
| Số câu/lượt | 5 | 8 | 10 |
| Timer/câu (dễ) | 45s | 30s | 30s |
| Timer/câu (vừa) | 35s | 25s | 25s |
| Timer/câu (khó) | 30s | 20s | 20s |
| Số lần thử (luyện tập) | 3 | 2 | 2 |
| Gợi ý | Luôn hiện | Sau lần sai 1 | Sau lần sai 1 |
| Điểm đúng lần đầu | +10 | +10 | +10 |
| Phản hồi sai | Rất nhẹ nhàng | Khuyến khích | Khuyến khích |

### 13.4 Tối ưu trải nghiệm chung

1. **Progressive difficulty trong 1 lượt:** 3 câu đầu nên dễ hơn, câu 4-7 vừa, câu 8-10 khó hơn một chút. Tạo cảm giác "warm up" → "challenge".

2. **Streak bonus:** Khi đúng liên tiếp 3 câu, hiện hiệu ứng đặc biệt (Cú Mèo nhảy, sao bay). Trẻ em rất thích streak reward.

3. **Session summary thân thiện:** Thay vì chỉ hiện "7/10 câu đúng", nên có:
   - Mầm non: "Con làm được 4/5 câu! Giỏi lắm! 🌟🌟🌟🌟"
   - Lớp 1-2: Giữ như hiện tại + thêm biểu đồ nhỏ (pie chart câu đúng/sai)

---

## 14. Hiện trạng source code & ảnh hưởng

### 14.1 Files cần thay đổi

| File | Mô tả thay đổi | Mức độ |
|---|---|---|
| `src/types.ts` | `Grade = 0\|1\|2`, `Topic` mới, thêm `find-number`, type legacy cho log cũ | Lớn |
| `src/game/gameConfig.ts` | Config phạm vi 3 cấp, `questionsPerSession`, `gradeRanges`, `carryRatio` | Lớn |
| `src/game/questionTemplateEngine.ts` | Mapping `Topic → TemplateTopic[]`, `getLimit()` theo grade+topic, constraint mới, comparison mới | Lớn |
| `src/data/questionTemplates.json` | Template mới cho Mầm non, Tìm số, So sánh biểu thức | Lớn |
| `src/data/questions.ts` | Fallback câu cho Mầm non | Vừa |
| `src/App.tsx` | UI setup, map, topic names, grade display, bỏ nút log, số câu theo cấp, badge | Lớn |
| `src/styles.css` | Styling mới cho grade 0, node find-number, theme practice/challenge, responsive | Vừa |
| `src/utils/storage.ts` | `defaultState` hỗ trợ grade 0 + migration `completedByTopic` | Vừa |
| `package.json` | Thêm Vitest + script `test` | Nhỏ |

### 14.2 Files di chuyển

| Nguồn | Đích |
|---|---|
| `bobo-after-answer.png` | `src/assets/images/bobo-after-answer.png` |
| `bobo-gameplay-desktop.png` | `src/assets/images/bobo-gameplay-desktop.png` |
| `bobo-home-desktop.png` | `src/assets/images/bobo-home-desktop.png` |
| `bobo-home-mobile.png` | `src/assets/images/bobo-home-mobile.png` |
| `bobo-home-tablet.png` | `src/assets/images/bobo-home-tablet.png` |

> `data/play-sessions.json` **không di chuyển** (Q14) — giữ nguyên ở `data/`.

---

## 15. Acceptance Criteria

### AC1 — Cấu trúc thư mục

- **Given** project build thành công
- **When** ảnh đã nằm trong `src/assets/images/` và `play-sessions.json` vẫn ở `data/`
- **Then** `npm run build` pass, dev server hoạt động bình thường, ghi file JSON đúng `data/play-sessions.json`, không có HMR loop.

### AC2 — Mầm non hiển thị

- **Given** chọn Mầm non ở màn đăng nhập
- **When** vào bản đồ
- **Then** thấy `[Cộng/Trừ]  [So sánh]  [Tổng hợp]  [Thông thái]`, top-bar hiện "Mầm non".

### AC3 — Mầm non — Phạm vi Cộng/Trừ

- **Given** Mầm non, chủ đề Cộng/Trừ, độ khó Dễ
- **When** sinh 50 câu
- **Then** mọi toán hạng ≤ 5, kết quả ≤ 10, không có phép trừ cho kết quả âm.

### AC4 — Ghép Cộng+Trừ

- **Given** bất kỳ lớp nào
- **When** vào bản đồ
- **Then** thấy node "Cộng/Trừ" thay vì 2 node "Cộng" và "Trừ" riêng biệt.

### AC5 — Cộng/Trừ sinh cả 2 dạng

- **Given** chọn Cộng/Trừ
- **When** chơi 1 lượt (5/8/10 câu tuỳ cấp)
- **Then** có cả câu cộng (A + B = ?) và câu trừ (A - B = ?), tỉ lệ xấp xỉ 50/50.

### AC6 — Bỏ nút log

- **Given** đăng nhập thành công
- **When** vào màn Home
- **Then** **không** thấy nút "Xuất log" và "Lưu lịch sử chơi".

### AC7 — Tìm số Lớp 1

- **Given** Lớp 1, chủ đề Tìm số, Dễ
- **When** sinh 50 câu
- **Then** chỉ có 2 dạng cộng (`A + ? = B`, `? + A = B`), A, B < 10, phép tính không nhớ.
- **Given** Lớp 1, chủ đề Tìm số, Khó
- **When** sinh 50 câu
- **Then** có đủ 4 dạng (gồm `A - ? = B` và `? - A = B`), A, B < 100, không nhớ/không mượn.

### AC8 — Tìm số Lớp 2

- **Given** Lớp 2, chủ đề Tìm số, Vừa
- **When** sinh 50 câu
- **Then** A, B < 50, phép tính có nhớ/mượn, chỉ gồm 2 dạng cộng (`A + ? = B`, `? + A = B`).
- **Given** Lớp 2, chủ đề Tìm số, Khó
- **Then** có đủ 4 dạng, gồm `? - A = B`, A, B < 100, có nhớ/mượn.

### AC9 — So sánh Mầm non

- **Given** Mầm non, So sánh
- **When** sinh 20 câu
- **Then** 100% dạng `A __ B` (2 số đơn giản ≤ 10).

### AC10 — So sánh Lớp 1

- **Given** Lớp 1, So sánh, Vừa
- **When** sinh 20 câu
- **Then** có dạng `A+B __ C` hoặc `C __ A-B`, phép tính không nhớ, A,B,C ≤ 50.

### AC11 — So sánh Lớp 2

- **Given** Lớp 2, So sánh, Khó
- **When** sinh 20 câu
- **Then** có dạng `A+B __ C` hoặc `C __ A-B`, phép tính có nhớ, A,B,C ≤ 100.

### AC12 — Random xen bài cấp dưới

- **Given** Lớp 1, chế độ **Luyện tập**, bất kỳ chủ đề có ở cấp dưới
- **When** chơi 30 lượt (240 câu)
- **Then** tỉ lệ câu Mầm non ≤ 33%.
- **Given** cùng cấu hình ở chế độ **Thử thách**
- **Then** 0% câu cấp dưới.

### AC13 — Lớp 1 giữ phạm vi

- **Given** Lớp 1
- **When** chơi Cộng/Trừ
- **Then** phạm vi dễ ≤10, vừa ≤50, khó ≤100, không nhớ. (Lưu ý: code hiện tại đang để `getLimit` vừa = 20, cần sửa theo Q7.)

### AC14 — Lớp 2 giữ carry

- **Given** Lớp 2, Cộng trừ có nhớ
- **When** chơi
- **Then** hoạt động giữ nguyên như hiện tại.

### AC15 — Tổng hợp & Thông thái

- **Given** bất kỳ lớp
- **When** chơi Tổng hợp hoặc Thông thái
- **Then** trộn tất cả chủ đề khả dụng theo lớp, logic giữ nguyên.

### AC16 — Số câu mỗi lượt (Q1)

- **Given** chọn lần lượt Mầm non / Lớp 1 / Lớp 2
- **When** bắt đầu một lượt
- **Then** số câu lần lượt là 5 / 8 / 10; badge `perfect_run` và `tower_wisdom` tính theo tổng số câu của lượt.

### AC17 — Lớp 2 add-sub 50% có nhớ (Q4)

- **Given** Lớp 2, chủ đề Cộng/Trừ
- **When** sinh 100 câu
- **Then** 45–55% câu có nhớ, phần còn lại không nhớ.

### AC18 — Migration topic (Q5)

- **Given** localStorage có `completedByTopic.addition = 2`, `subtraction = 3`
- **When** mở app
- **Then** `completedByTopic['add-sub'] = 5`; badge cũ vẫn hiển thị bình thường; log mới ghi `add-sub`.

### AC19 — Test tự động (Q18)

- **Given** chạy `npm test`
- **When** Vitest thực thi
- **Then** pass toàn bộ test sinh câu cho AC3, AC5, AC7–AC12, AC17.

---

## 16. Task breakdown

| Task | Nội dung | Ước lượng | Dependency |
|---|---|---|---|
| **T0** | Di chuyển ảnh vào `src/assets/images/`, cập nhật README (không move `play-sessions.json`) | 0.1 ngày | — |
| **T1** | Cập nhật Types: `Grade = 0\|1\|2`, Topic mới (`add-sub`, `find-number`) | 0.5 ngày | — |
| **T2** | Cập nhật `gameConfig.ts`: phạm vi 3 cấp, `questionsPerSession`, `carryRatio`, `gradeRanges`; migration `completedByTopic` + `defaultState` grade 0 | 0.75 ngày | T1 |
| **T3** | Cập nhật Engine: `getLimit()` theo grade+topic, constraint mới, comparison mới | 1.5 ngày | T1, T2 |
| **T4** | Thêm templates: Mầm non, Tìm số, So sánh biểu thức vs số | 1 ngày | T1 |
| **T5** | Cập nhật `questions.ts`: fallback cho Mầm non, add-sub mixed | 0.5 ngày | T1, T2 |
| **T6** | UI — Màn đăng nhập: thêm nút Mầm non | 0.25 ngày | T1 |
| **T7** | UI — Bản đồ: ghép Cộng/Trừ, thêm Tìm số, So sánh 3 cấp | 0.5 ngày | T1 |
| **T8** | UI — Bỏ nút Xuất log, Lưu lịch sử, storage note | 0.25 ngày | — |
| **T9** | UI — Thiết kế lại Luyện tập & Thử thách, 3 lần thử cho Mầm non | 0.5 ngày | T7 |
| **T10** | Engine — Cơ chế random xen bài cấp dưới (≤33%, chỉ Luyện tập) | 0.5 ngày | T3 |
| **T11** | CSS — Styling mới cho Mầm non, find-number node, theme practice/challenge | 0.5 ngày | T6, T7 |
| **T12** | Huy hiệu: `find_number_star`, `add_sub_star`; scale `perfect_run`/`tower_wisdom` theo số câu | 0.25 ngày | T7 |
| **T13** | Test & QA: Vitest cho generator + smoke test tất cả tổ hợp | 1 ngày | T0–T12 |
| **T14** | Cập nhật README, specs | 0.25 ngày | T13 |

**Tổng ước lượng:** ~8.25 ngày

---

## 17. Edge cases

1. **Mầm non phạm vi quá hẹp:** Với dễ (max=5), số tổ hợp cộng/trừ rất ít → cần cơ chế chống trùng tốt và fallback khi hết tổ hợp.

2. **Tìm số `? - A = B`:** pattern khó nhất, xuất hiện ở **cả Lớp 1 và Lớp 2** nhưng chỉ ở mức **Khó** (Q6). Mức Dễ/Vừa chỉ dùng 2 dạng cộng (`A + ? = B`, `? + A = B`).

3. **So sánh biểu thức Lớp 2 có nhớ:** Khi `A + B` có nhớ, cần đảm bảo `C` được chọn sao cho câu hỏi có nghĩa (không quá chênh lệch).

4. **Random xen bài khi topic không tồn tại ở cấp dưới:** Ví dụ Lớp 1 chơi "Tìm số" → Mầm non không có "Tìm số" → sinh 100% bài Lớp 1, bỏ qua random cấp dưới.

5. **Grade 0 trong localStorage cũ:** Người chơi cũ có `grade: 1` hoặc `grade: 2` → không bị ảnh hưởng. Người mới chọn grade 0 → tạo profile mới bình thường.

6. **Backward compatibility Topic:** Đổi tên topic từ `addition`/`subtraction` → `add-sub` (Q5):
   - Khi load progress: `completedByTopic['add-sub'] = (addition ?? 0) + (subtraction ?? 0)`, sau đó bỏ 2 key cũ.
   - Badge cũ (`addition_star`, `subtraction_master`) giữ nguyên trong danh sách; badge mới `add_sub_star` chỉ áp dụng cho lượt mới.
   - Log/session cũ vẫn chứa `addition`/`subtraction` → khai báo type legacy riêng ở tầng đọc, không đổi `Topic` chính.

7. ~~**Thứ tự câu progressive difficulty:**~~ **Không triển khai trong iteration này** (Q2) — đưa vào backlog. Mỗi lượt dùng đúng 1 độ khó đã chọn.

8. **Badge theo số câu mới (Q1/Q16):** `perfect_run` = đúng toàn bộ lượt (5/5, 8/8, 10/10); `tower_wisdom` = 80% số câu (4/5, 7/8, 8/10).

---

## Phụ lục A — Ví dụ câu hỏi theo cấp

### Mầm non — Cộng/Trừ

```text
Dễ:   2 + 3 = ?    (đáp án: 5)
Vừa:  5 + 3 = ?    (đáp án: 8)
Khó:  6 + 4 = ?    (đáp án: 10)
Dễ:   4 - 1 = ?    (đáp án: 3)
Vừa:  8 - 5 = ?    (đáp án: 3)
Khó:  10 - 7 = ?   (đáp án: 3)
```

### Mầm non — So sánh

```text
3 __ 7  →  <
5 __ 5  →  =
9 __ 2  →  >
```

### Lớp 1 — Tìm số

```text
Dễ:     3 + ? = 8    (đáp án: 5)
Vừa:    ? + 7 = 15   (đáp án: 8)
Khó:    45 - ? = 23  (đáp án: 22, không nhớ)
Khó:    ? - 31 = 45  (đáp án: 76, không nhớ)
```

### Lớp 1 — So sánh biểu thức

```text
Dễ:     3 + 5 __ 9       →  <
Vừa:    12 __ 7 + 4      →  >
Khó:    45 + 32 __ 80    →  <
Khó:    56 __ 89 - 31    →  <
```

### Lớp 2 — Tìm số (có nhớ)

```text
Dễ:     8 + ? = 15   (đáp án: 7, có nhớ)
Vừa:    ? + 27 = 43  (đáp án: 16, có nhớ)
Khó:    63 - ? = 28  (đáp án: 35, có mượn)
```

### Lớp 2 — So sánh biểu thức (có nhớ)

```text
Dễ:     8 + 7 __ 16    →  <
Vừa:    30 __ 43 - 15  →  >
Khó:    57 + 38 __ 94  →  >
```

---

## Phụ lục B — Sơ đồ luồng chơi mới

```
[Màn đăng nhập]
  ├── Nhập tên
  ├── Chọn: [Mầm non] [Lớp 1] [Lớp 2]
  ├── Chọn avatar
  └── [Bắt đầu]
         │
         ▼
[Màn Home]
  ├── Thống kê
  ├── [Luyện tập]  →  [Bản đồ] → [Chọn độ khó] → [Chơi 5/8/10 câu] → [Kết quả]
  └── [Thử thách]  →  [Bản đồ] → [Chọn độ khó] → [Chơi 5/8/10 câu] → [Kết quả]

[Bản đồ — Mầm non]:
  [Cộng/Trừ] [So sánh] [Tổng hợp🔒] [Thông thái🔒]

[Bản đồ — Lớp 1]:
  [Cộng/Trừ] [Tìm số] [So sánh] [Tổng hợp🔒] [Thông thái🔒]

[Bản đồ — Lớp 2]:
  [Cộng/Trừ] [Tìm số] [Cộng trừ có nhớ] [So sánh] [Tổng hợp🔒] [Thông thái🔒]
```

---

## Phụ lục C — Quyết định đã chốt

Toàn bộ câu hỏi đã được chốt ngày 29/10/2026. Bảng gốc:

| # | Câu hỏi | Quyết định | Trạng thái |
|---|---|---|---|
| Q1 | Mầm non giảm xuống 5 câu/lượt? | **Có** — Mầm non 5, Lớp 1 8, Lớp 2 10 | ✅ Đã chốt |
| Q2 | Lớp 1 giảm xuống 8 câu/lượt? | **Có** | ✅ Đã chốt |
| Q3 | Mầm non có thêm minh họa emoji? | **Không** trong iteration này — backlog | ⏸ Backlog |
| Q4 | Progressive difficulty trong 1 lượt? | **Không** — backlog | ⏸ Backlog |
| Q5 | Mầm non cho 3 lần thử ở Luyện tập? | **Có** | ✅ Đã chốt |
| Q6 | Migration topic `addition`/`subtraction` → `add-sub`? | **Cộng dồn khi load**, giữ badge cũ | ✅ Đã chốt |
| Q7 | So sánh Lớp 2 dùng biểu thức carry? | **Có** — và `add-sub` Lớp 2 là 50% carry | ✅ Đã chốt |

Các câu Q8–Q18 (bổ sung trong buổi review) xem bảng đầy đủ ở [mục 0](#0-quyết-định-đã-chốt-29102026).
