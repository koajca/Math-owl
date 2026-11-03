# Cú Mèo Toán Học

Web game học toán cho **Mầm non**, **Lớp 1** và **Lớp 2**, xây dựng bằng React + Vite + TypeScript.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở trình duyệt tại URL Vite hiển thị, thường là:

```text
http://127.0.0.1:5173
```

## Nội dung đã triển khai

- Đăng nhập đơn giản bằng tên học sinh, chọn lớp (Mầm non / Lớp 1 / Lớp 2) và avatar cú mèo.
- Lưu tiến độ bằng `localStorage`, không cần backend/database.
- Trang chủ, bản đồ Khu Rừng Toán Học, chọn chế độ và chọn độ khó.
- Chế độ `Luyện tập` và `Thử thách`, phân biệt bằng màu chủ đề xanh/cam.
- **Số câu mỗi lượt:** Mầm non 5 câu, Lớp 1 8 câu, Lớp 2 10 câu.
- Chủ đề theo lớp:
  - Mầm non: `Cộng/Trừ`, `So sánh`, `Tổng hợp`, `Tháp Thông Thái`.
  - Lớp 1: `Cộng/Trừ`, `Tìm số`, `So sánh`, `Tổng hợp`, `Tháp Thông Thái`.
  - Lớp 2: `Cộng/Trừ`, `Tìm số`, `Cộng trừ có nhớ`, `So sánh`, `Tổng hợp`, `Tháp Thông Thái`.
- `Cộng/Trừ` sinh cả câu cộng và câu trừ, tỉ lệ xấp xỉ 50/50. Lớp 2 có khoảng 50% câu cần nhớ/mượn.
- `Tìm số` có 4 dạng điền số còn thiếu; dạng trừ chỉ xuất hiện ở độ khó Khó.
- `So sánh`:
  - Mầm non: chỉ so sánh hai số trong phạm vi 10.
  - Lớp 1: so sánh hai số hoặc biểu thức với số, không nhớ/mượn.
  - Lớp 2: so sánh hai số hoặc biểu thức với số, biểu thức có nhớ/mượn.
- Ở chế độ Luyện tập, Lớp 1–2 có thể xen tối đa 33% câu của cấp dưới (trừ `Tìm số` và `Cộng trừ có nhớ`). Thử thách luôn 100% câu đúng cấp.
- Phạm vi, thời gian và số câu được cấu hình tập trung tại `src/game/gameConfig.ts`.
- Timer theo lớp và độ khó: Mầm non 45/35/30 giây, Lớp 1–2 30/25/20 giây.
- Hết giờ tự chuyển sang câu tiếp theo, tính sai và không cho trả lời lại.
- `Luyện tập`: Mầm non được trả lời 3 lần mỗi câu; Lớp 1–2 được 2 lần. Sai lần đầu hiện thẻ gợi ý 💡 và khoá đáp án sai (nếu là dạng chọn), đúng lần sau được +5 điểm.
- `Thử thách`: chỉ 1 lần trả lời mỗi câu, không bao giờ hiện gợi ý. Hoàn thành 100% nhận +50 điểm, đạt từ 80% nhận +20 điểm.
- Sai 3 câu liên tiếp (đã kết thúc câu) trừ 5 điểm, điểm không âm.
- Mở khóa theo số thử thách hoàn thành.
- Tổng điểm, huy hiệu, âm thanh hiệu ứng và mascot cú mèo 2D.
- Giao diện responsive cho điện thoại, iPad dọc/ngang và desktop; giữ đề + đáp án + timer trong khung nhìn hợp lý, tự cuộn về đầu trang khi sang câu mới.
- Nút `Đăng xuất` có xác nhận, mặc định giữ tiến độ; có tuỳ chọn xoá toàn bộ tiến độ và lịch sử trên thiết bị.
- Khi chuyển câu, focus được đưa về khung đề bài để không dính vào đáp án/ô nhập của câu trước.

## Đăng xuất và dữ liệu trên thiết bị

Nút `Đăng xuất` nằm ở cuối thanh trên cùng của các màn đã đăng nhập. Khi xác nhận:

- Quay về màn nhập tên với form trống.
- Mặc định **giữ** điểm, huy hiệu, tiến độ mở khoá và lịch sử chơi.
- Nếu tick `Xoá cả tiến độ và lịch sử trên thiết bị`, toàn bộ tiến độ, lịch sử lượt chơi và log câu hỏi sẽ bị xoá.

Dữ liệu cũ (Lớp 1/2, chủ đề `addition`/`subtraction`) vẫn được đọc và tự gộp thành `add-sub` khi tải.

## Lưu lịch sử chơi ra file JSON

Mỗi lượt chơi được ghi lại thành một bản ghi `PlaySessionRecord` gồm: người chơi, lớp, chế độ, chủ đề, độ khó, thời gian bắt đầu/kết thúc, tổng điểm, số câu đúng, huy hiệu và chi tiết từng câu (đề bài, đáp án đúng, câu trả lời, đúng/sai, hết giờ, số lần thử, thời gian trả lời, điểm, `hintShown`, `retried`, `hintText`).

- **Tự động ghi ra file (khi chạy dev):** bản ghi được gửi tới dev server và ghi vào `data/play-sessions.json`, cập nhật theo `sessionId`. Chỉ hoạt động khi chạy `npm run dev` hoặc `npm run preview`.
- Các nút tải log/lịch sử thủ công trên trang chủ đã được bỏ khỏi giao diện. Các hàm export tương ứng vẫn còn trong `src/utils/` để dùng khi cần.

Lịch sử cũng được lưu cục bộ trong `localStorage` (key `owl_math_game_sessions_v1`, giữ tối đa 200 lượt gần nhất).

## Cấu trúc thư mục chính

```text
src/
├── assets/images/        # Ảnh tham chiếu giao diện (bobo-*.png)
├── data/                 # Template JSON, sinh câu hỏi, fallback
├── game/                 # gameConfig, engine template, test
├── utils/                # storage, lịch sử lượt chơi, log câu hỏi
├── App.tsx
└── styles.css
data/update-screen-game/  # Requirements, designs, tasks của iteration này
```

## Kiểm tra chất lượng

```bash
npm run build   # TypeScript + Vite build
npm test        # Vitest (39 test)
```

## Build

```bash
npm run build
```
