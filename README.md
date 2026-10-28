# Cú Mèo Toán Học

Web game học toán lớp 1 và lớp 2, xây dựng bằng React + Vite + TypeScript.

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

- Đăng nhập đơn giản bằng tên học sinh, chọn lớp và avatar cú mèo.
- Lưu tiến độ bằng `localStorage`, không cần backend/database.
- Trang chủ, bản đồ Khu Rừng Toán Học, chọn chế độ và chọn độ khó.
- Chế độ `Luyện tập` và `Thử thách`.
- Chủ đề theo lớp:
  - Lớp 1: `Cộng`, `Trừ`, `So sánh`, `Tổng hợp`, `Tháp Thông Thái`.
  - Lớp 2: `Cộng`, `Trừ`, `Cộng trừ có nhớ`, `Tổng hợp`, `Tháp Thông Thái` (không còn So sánh).
- Câu hỏi cộng/trừ không nhớ, không mượn và cộng có nhớ, trừ có mượn trong phạm vi phù hợp.
- Cấu hình phạm vi cộng trừ có nhớ tại `src/game/gameConfig.ts` (`carry.rangeByDifficulty`), ví dụ `< 20` hoặc `<= 99`.
- Câu hỏi trắc nghiệm, nhập đáp án, điền số còn thiếu và so sánh (so sánh chỉ dành cho Lớp 1).
- Mỗi thử thách gồm 10 câu, có timer theo độ khó.
- Hết giờ tự chuyển sang câu tiếp theo.
- Sai 2 lần liên tiếp có gợi ý, sai 3 lần liên tiếp trừ điểm.
- Mở khóa theo số thử thách hoàn thành.
- Tổng điểm, huy hiệu, âm thanh hiệu ứng và mascot cú mèo 2D.

## Lưu lịch sử chơi ra file JSON

Mỗi lượt chơi được ghi lại thành một bản ghi `PlaySessionRecord` gồm: người chơi, lớp, chế độ, chủ đề, độ khó, thời gian bắt đầu/kết thúc, tổng điểm, số câu đúng, huy hiệu và chi tiết từng câu (đề bài, đáp án đúng, câu trả lời, đúng/sai, hết giờ, số lần thử, thời gian trả lời, điểm).

Có 2 cách để lưu:

- **Tự động ghi ra file (khi chạy dev):** bản ghi được gửi tới dev server và ghi vào `data/play-sessions.json`, cập nhật theo `sessionId`. Chỉ hoạt động khi chạy `npm run dev`.
- **Tải file thủ công:** trên trang chủ bấm nút `Lưu lịch sử chơi (N)` để tải toàn bộ lịch sử về máy dưới dạng `owl-math-play-sessions-<thời-gian>.json`. Cách này hoạt động cả ở bản build production.

Lịch sử cũng được lưu cục bộ trong `localStorage` (key `owl_math_game_sessions_v1`, giữ tối đa 200 lượt gần nhất).


## Build

```bash
npm run build
```
