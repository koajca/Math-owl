# Thiết Kế Game "Cú Mèo Toán Học"

## 1. Tổng quan

**Tên game:** Cú Mèo Toán Học

**Mục tiêu:**
- Giúp học sinh lớp 1 và lớp 2 luyện tập toán học cơ bản qua game web.
- Tập trung vào kỹ năng: cộng, trừ, so sánh và điền số trong phạm vi phù hợp.
- Kết hợp giải bài thông minh, phản hồi nhanh và tiến độ mở khóa.

**Nền tảng:**
- Web game sử dụng React + Vite + CSS thuần.
- Lưu tiến trình và cài đặt bằng `localStorage`.
- Không cần backend, không cần database.

## 2. Đối tượng người chơi

- Học sinh lớp 1 và lớp 2.
- Phụ huynh/giáo viên muốn tạo môi trường luyện tập toán cơ bản.
- Người dùng cần giao diện đơn giản, sinh động, thân thiện và dễ dùng.

## 3. Luồng chính của game

1. Màn chào / trang chủ.
2. Người chơi nhập tên và chọn lớp.
3. Chọn chế độ chơi: Luyện tập hoặc Thử thách.
4. Chọn độ khó và chủ đề.
5. Chơi 1 bộ câu hỏi.
6. Hiển thị kết quả, điểm số và tiến độ mở khóa.

## 4. Đăng nhập và lưu tiến độ

### 4.1 Dữ liệu đầu vào
- Tên học sinh.
- Lớp 1 hoặc lớp 2.
- Avatar cú mèo mặc định.

### 4.2 Cơ chế lưu trữ
- Dùng `localStorage` để lưu:
  - Tên học sinh.
  - Lớp học.
  - Tiến độ đã mở khóa.
  - Điểm tổng/điểm chế độ.
  - Cài đặt âm thanh.

### 4.3 Bảo mật
- Không cần email, mật khẩu hay tài khoản server.
- Dữ liệu tồn tại cục bộ trên trình duyệt.

## 5. Chế độ chơi

### 5.1 Luyện tập
- Dành cho làm quen và ôn bài.
- Áp lực nhẹ, sai không phạt nặng.
- Có gợi ý sau 2 lần sai liên tiếp.
- Có thể hiển thị thời gian, nhưng không gắt.
- Thích hợp để học sinh lặp lại kiến thức.

### 5.2 Thử thách
- Mỗi lượt gồm 10 câu.
- Có giới hạn thời gian mỗi câu.
- Có điểm số, phần thưởng và màn kết quả.
- Kết quả có thể hiện điểm, số câu đúng, huy hiệu.

## 6. Độ khó

### 6.1 Dễ
- Câu hỏi đơn giản, dễ hiểu.
- Chủ yếu chọn đáp án trắc nghiệm.
- 3 lựa chọn mỗi câu.
- Thời gian 30 giây/câu.

### 6.2 Vừa
- Kết hợp chọn đáp án và nhập đáp án.
- 4 lựa chọn nếu là câu trắc nghiệm.
- Thời gian 25 giây/câu.

### 6.3 Khó
- Ưu tiên nhập đáp án.
- Có câu điền số còn thiếu, so sánh biểu thức.
- Thời gian 20 giây/câu.

## 7. Nội dung bài học theo lớp

### 7.1 Lớp 1
- Cộng, trừ trong phạm vi 10, 20.
- Đếm số và so sánh số.
- Điền dấu `>`, `<`, `=`.
- Sắp xếp thứ tự số trong phạm vi 01 đến 99 ở mức trực quan.
- Tìm số còn thiếu trong phép cộng/trừ không nhớ, không mượn.
- Xem giờ đúng trên đồng hồ kim.
- Nhận biết thứ tự các ngày trong tuần.
- Nhận biết hôm qua, hôm nay, ngày mai bằng thứ trong tuần hoặc số ngày trong tháng.
- Câu hỏi trực quan, minh họa rõ ràng.

### 7.2 Lớp 2
- Cộng, trừ trong phạm vi 100.
- Cộng, trừ không nhớ.
- So sánh số hai chữ số.
- So sánh biểu thức đơn giản.
- Tìm số còn thiếu.
- Sắp xếp 7 đến 10 số trong phạm vi 01 đến 99.
- Bài tương tác kéo thả cho thứ tự số và thứ tự thời gian.

## 8. Cơ chế mở khóa

### 8.1 Nguyên tắc mở khóa
- Mở khóa theo số thử thách đã hoàn thành.
- Không mở khóa dựa trên tổng điểm.

### 8.2 Mốc mở khóa
- Ban đầu: mở Luyện tập Dễ, Thử thách Dễ và chủ đề cơ bản.
- Hoàn thành 3 thử thách: mở độ khó Vừa.
- Hoàn thành 6 thử thách: mở độ khó Khó.
- Hoàn thành 8 thử thách: mở màn Tổng hợp.
- Hoàn thành 12 thử thách: mở Tháp Thông Thái.

### 8.3 Hiển thị trạng thái khóa/mở
- Màn bị khóa hiển thị rõ ràng.
- Ghi chú: “Hoàn thành thêm 2 thử thách để mở khóa”.

## 9. Luật thời gian và gợi ý

### 9.1 Thời gian
- Mỗi câu có đồng hồ đếm ngược.
- Hết thời gian:
  - tính là sai 1 lần.
  - không cho làm lại câu.
  - tự động chuyển sang câu tiếp theo.
  - hiển thị hiệu ứng báo hết giờ nhẹ.

### 9.2 Gợi ý
- Sai 2 lần liên tiếp hoặc hết giờ: hiện gợi ý cho câu tiếp theo.
- Sai 3 lần liên tiếp: trừ điểm.

## 10. Hệ thống điểm

### 10.1 Quy tắc điểm
- Đúng lần đầu: +10 điểm.
- Đúng sau 1 lần sai: +5 điểm.
- Sai lần 1: không trừ điểm.
- Sai lần 2 liên tiếp: hiện gợi ý.
- Sai lần 3 liên tiếp: -5 điểm.
- Hết giờ: tính như sai 1 lần.
- Điểm không âm.

### 10.2 Thưởng thành tích
- Hoàn thành 8/10 câu đúng: +20 điểm.
- Hoàn thành 10/10 câu đúng: +50 điểm + huy hiệu.

## 11. Âm thanh và trải nghiệm

### 11.1 Âm thanh
- Nhạc/chime ngắn khi mở game hoặc vào màn hình chính.
- Không phát nhạc nền liên tục trong màn chơi.
- Hiệu ứng âm thanh trong lúc chơi:
  - Đúng: âm thanh vui.
  - Sai: âm thanh nhẹ.
  - Hết giờ: âm thanh ngắn.
  - Hoàn thành thử thách: âm thanh chúc mừng.
- Có nút bật/tắt âm thanh.

### 11.2 Linh vật
- Nhân vật chính: cú mèo thông thái.
- Vai trò:
  - Chào học sinh.
  - Đưa gợi ý.
  - Phản hồi đúng/sai.
  - Chúc mừng khi hoàn thành.
  - Hiện biểu cảm vui, suy nghĩ, khích lệ.

## 12. Giao diện và phong cách

### 12.1 Concept tổng thể
- Chủ đề: Khu Rừng Toán Học.
- Phong cách: 2D phẳng, đơn giản, sinh động.
- Màu sắc tươi sáng, thân thiện với trẻ em.
- Layout rõ ràng, dễ thao tác.

### 12.2 Các khu vực chính
- Nhà Cú Mèo: trang chủ.
- Cây Cộng Số: chủ đề cộng.
- Cầu Phép Trừ: chủ đề trừ.
- Khu So sánh/Điền số: chủ đề so sánh và tổng hợp.

### 12.3 UX chính
- Nút lớn, chữ rõ.
- Biểu tượng chú thích dễ hiểu.
- Feedback ngay khi trả lời đúng/sai.
- Thanh tiến độ, điểm số hiển thị rõ.

### 12.4 Thiết kế UI cho các dạng bài tương tác mới

Các dạng bài mới dùng chung khung màn chơi hiện tại: thanh tiến độ, timer, điểm số, mascot cú mèo, vùng câu hỏi trung tâm và vùng trả lời. Điểm khác nhau nằm ở component trả lời.

Nguyên tắc UI chung:

- Với câu hỏi mô tả dài hoặc bài toán lời văn, vùng đề bài dùng font responsive theo độ dài nội dung; câu càng dài thì font càng giảm trong giới hạn đọc tốt cho học sinh lớp 1-2.
- Font của đề bài không được tràn khung, không che vùng đáp án, không làm nút `Trả lời` bị đẩy khỏi màn hình trên mobile.
- Các nút đáp án, thẻ số, thẻ ngày và ô đích có hover/focus rõ ràng: đổi màu viền sang xanh lá hoặc xanh trời theo tone game, nền sáng nhẹ, không dùng màu đỏ/trạng thái lỗi cho hover bình thường.
- Hover/focus không được làm thay đổi kích thước element hoặc gây layout shift.
- Với dạng kéo thả/chọn nhiều bước, khi học sinh trả lời sai, component phải reset về trạng thái ban đầu và cho phép làm lại trong cùng câu hỏi nếu rule chấm điểm cho phép thử lại.

#### Sắp xếp số

- Component đề xuất: `SortNumbersQuestion`.
- Tiêu đề nằm trên cùng của vùng câu hỏi:
  - `Hãy sắp xếp các số sau từ bé đến lớn`
  - `Hãy sắp xếp các số sau từ lớn đến bé`
- Bên dưới tiêu đề là 2 vùng rõ ràng:
  - Vùng đích phía trên: danh sách ô trống theo đúng số lượng cần sắp xếp.
  - Vùng thẻ phía dưới: danh sách các thẻ số ban đầu bị trộn thứ tự.
- Mỗi ô trống là một slot lớn, có viền nét đứt hoặc nền sáng nhẹ, không chứa chữ hướng dẫn dài.
- Mỗi thẻ số là một nút lớn, bo góc, có bóng nhẹ, dễ kéo bằng ngón tay.
- Trên desktop/tablet: hỗ trợ kéo thả thẻ số từ vùng dưới lên ô trống phía trên.
- Trên mobile hoặc khi kéo thả không ổn: hỗ trợ bấm chọn một thẻ số, sau đó bấm ô trống đích để đặt thẻ.
- Cho phép đổi thẻ đã đặt trước khi bấm `Trả lời`.
- Có nút `Trả lời` sau khi học sinh đặt xong các thẻ số.
- Khi sai, highlight nhẹ các vị trí chưa đúng trong thời gian ngắn, sau đó reset toàn bộ ô trống và đưa các thẻ số về vùng dưới để học sinh chọn lại.
- Gợi ý từ cú mèo:
  - Với bé đến lớn: `Con tìm số bé nhất trước rồi đặt ở đầu hàng nhé.`
  - Với lớn đến bé: `Con tìm số lớn nhất trước rồi đặt ở đầu hàng nhé.`

#### Tìm số trong ô trống

- Component đề xuất: `MissingEquationQuestion`.
- Hiển thị phép tính ở giữa màn hình bằng font lớn.
- Ô trống là thẻ lớn có viền nổi bật và ký hiệu `?`, không nhập trực tiếp vào ô.
- Bên dưới phép tính có 4 đáp án để chọn, trong đó chỉ có 1 đáp án đúng là số cần điền vào ô trống.
- Đáp án nhiễu phải không trùng nhau, gần với đáp án đúng ở mức vừa phải để trẻ cần suy luận nhưng không bị đánh đố.
- Hỗ trợ 4 pattern:
  - `__ + b = result`
  - `a + __ = result`
  - `a - __ = result`
  - `__ - b = result`
- Nếu đáp án hiển thị dạng `05`, logic chấm vẫn coi là tương đương với giá trị số `5`.
- Khi sai, hint phải giải thích theo vị trí ô trống, không chỉ đưa công thức chung.

#### Xem giờ

- Component đề xuất: `ClockQuestion`.
- Tiêu đề cố định: `Đồng hồ chỉ mấy giờ?`
- Vùng chính là đồng hồ tròn:
  - Có đủ số 1 đến 12.
  - Kim phút dài hơn, luôn chỉ 12.
  - Kim giờ ngắn hơn, chỉ một số từ 1 đến 12.
  - Kim giờ và kim phút khác màu để dễ phân biệt.
- Bên dưới có 4 đáp án dạng nút lớn, ví dụ `3 giờ`, `7 giờ`.
- Khi đúng, đồng hồ có thể nhấn nhẹ hoặc phát sáng nhẹ.
- Khi sai, cú mèo gợi ý: `Kim phút chỉ 12, mình nhìn kim ngắn để biết mấy giờ.`

#### Chọn ngày trong tuần

- Component đề xuất: `WeekdayBlankQuestion`.
- Tiêu đề cố định: `Chọn ngày trong tuần`.
- Vùng chính là dãy thẻ ngày liên tiếp, trong đó có một thẻ ô trống.
- Dãy ngày có thể xuống dòng trên mobile nhưng vẫn giữ thứ tự đọc trái sang phải, trên xuống dưới.
- Ô trống dùng viền nét đứt và ký hiệu `?`.
- Bên dưới có 4 đáp án là các ngày trong tuần.
- Khi đúng, ô trống được lấp bằng ngày đúng.
- Khi sai, cú mèo gợi ý: `Con đọc các ngày theo thứ tự. Sau Chủ nhật sẽ quay lại Thứ 2.`

#### Hôm qua - Hôm nay - Ngày mai

- Component đề xuất: `RelativeDateQuestion`.
- Tiêu đề cố định: `Tìm giá trị đúng`.
- Vùng trên có 3 ô đích: `Hôm qua`, `Hôm nay`, `Ngày mai`.
- Mỗi ô đích chỉ hiển thị nhãn ngắn cố định và vùng trống rõ ràng; không dùng chữ nền dài như `Kéo thả đáp án vào đây`.
- Vùng dưới có 3 thẻ đáp án bị trộn thứ tự.
- Học sinh kéo thẻ vào ô đích tương ứng.
- Fallback mobile: bấm một thẻ đáp án, rồi bấm ô đích để đặt vào.
- Cho phép đổi vị trí trước khi bấm `Trả lời`.
- Khi sai, reset toàn bộ 3 ô đích về trạng thái ban đầu, trả 3 thẻ về vùng dưới và cho học sinh chọn lại.
- Có 2 mode:
  - `weekday`: thẻ là thứ trong tuần.
  - `monthDate`: thẻ là ngày trong tháng dạng `01` đến `31`.
- Hint:
  - `weekday`: `Hôm nay nằm giữa hôm qua và ngày mai.`
  - `monthDate`: `Ba số ngày tăng thêm 1 từng bước.`

### 12.5 Quy tắc phân cấp độ khó cho các dạng bài tương tác mới

Độ khó của các dạng bài mới được xác định theo 4 trục:

- Số lượng phần tử học sinh phải xử lý.
- Phạm vi số/ngày/giờ được sinh.
- Mức suy luận ngược hoặc suy luận theo chuỗi.
- Độ gần nhau của đáp án nhiễu.

Thao tác kéo thả không nên là nguồn tăng độ khó chính. Với học sinh nhỏ, độ khó nên đến từ tư duy toán/thời gian, còn thao tác UI phải luôn đủ dễ và có fallback.

#### Sắp xếp số

| Độ khó | Số lượng | Phạm vi | Chiều sắp xếp | Đặc điểm nhiễu |
|---|---:|---|---|---|
| Dễ | 6 số | `01-20` | Ưu tiên bé đến lớn | Các số cách nhau rõ |
| Vừa | 7-8 số | `01-99` | Bé đến lớn hoặc lớn đến bé | Có một vài số gần nhau |
| Khó | 9-10 số | `01-99` | Bé đến lớn hoặc lớn đến bé | Nhiều số gần nhau/cùng hàng chục, ví dụ `31`, `34`, `39` |

Ghi chú thiết kế:

- Dễ vẫn dùng kéo thả hoặc bấm chọn để đặt thẻ vào ô trống như các mức khác, nhưng ít số hơn để trẻ nắm cơ chế.
- Khó có thể dùng các cặp dễ nhầm như `07`, `17`, `70`, nhưng không nên lạm dụng trong cùng một câu.
- Thời lượng làm bài sắp xếp số bằng 2 lần thời lượng bài toán thông thường ở cùng độ khó.

#### Tìm số trong ô trống

| Độ khó | Pattern ưu tiên | Phạm vi | Đặc điểm |
|---|---|---|---|
| Dễ | `__ + b = result`, `a + __ = result` | `01-20` | Số thiếu nhỏ, suy luận trực quan |
| Vừa | Thêm `a - __ = result` | `01-99` | Có cộng và trừ, vẫn không nhớ/không mượn |
| Khó | Thêm `__ - b = result` | `01-99` | Suy luận ngược bằng phép cộng, dễ nhầm thành phần |

Ràng buộc mọi mức:

- Cộng không nhớ.
- Trừ không mượn.
- Kết quả không âm.
- Chỉ một ô trống và một nghiệm đúng.
- Mỗi câu có đúng 4 lựa chọn đáp án; chỉ 1 lựa chọn là đáp án đúng.

#### Xem giờ

| Độ khó | Giờ được sinh | Đáp án nhiễu | Đặc điểm |
|---|---|---|---|
| Dễ | Giờ quen thuộc: `3`, `6`, `9`, `12` | Cách xa đáp án đúng | Tập trung nhận biết kim giờ |
| Vừa | Bất kỳ giờ `1-12` | Có thể gồm giờ liền trước/liền sau | Bắt đầu phân biệt vị trí gần nhau |
| Khó | Bất kỳ giờ `1-12` | Ưu tiên giờ kề bên và số dễ nhầm trên mặt đồng hồ | Vẫn giữ kim phút ở `12` |

#### Chọn ngày trong tuần

| Độ khó | Dãy ngày | Vị trí ô trống | Đáp án nhiễu |
|---|---|---|---|
| Dễ | Không qua cuối tuần | Ô trống ở giữa | Nhiễu cách xa đáp án đúng |
| Vừa | Có thể bắt đầu giữa tuần hoặc qua `Thứ 7`, `Chủ nhật` | Ô trống random | Nhiễu là ngày hợp lệ bất kỳ |
| Khó | Có thể đi qua vòng tuần `Chủ nhật -> Thứ 2` | Ô trống random, dãy dài hơn | Nhiễu ưu tiên ngày liền kề để tăng suy luận |

#### Hôm qua - Hôm nay - Ngày mai

| Độ khó | Mode | Dữ liệu | Đặc điểm |
|---|---|---|---|
| Dễ | `weekday` | 3 ngày liên tiếp, không qua cuối tuần | Thẻ đáp án random nhưng chuỗi quen thuộc |
| Vừa | `weekday` | Có thể qua cuối tuần | Cần hiểu vòng tuần |
| Khó | `monthDate` | 3 ngày liên tiếp dạng `01-31`, `yesterday <= 29` | Cần nhận biết số ngày tăng thêm 1 |

Ghi chú thiết kế:

- Với `monthDate`, không sinh chuyển tháng trong MVP.
- Với `weekday`, cho phép case `Chủ nhật -> Thứ 2 -> Thứ 3` từ mức vừa trở lên.

## 13. Kiến trúc dữ liệu đề xuất

### 13.1 Nguồn dữ liệu câu hỏi
- MVP dùng một file `.json` chứa các template sinh câu hỏi random.
- Nguồn tổng hợp ban đầu là `specs/knowledge/skill-generate-math.md`.
- File JSON không chỉ lưu câu hỏi tĩnh; mỗi template phải có đủ dữ liệu để game tự sinh đề bài, đáp án, gợi ý và lời giải phù hợp với bộ biến random.
- Generator runtime sẽ chuyển một template thành một `Question` cụ thể trước khi hiển thị cho người chơi.

### 13.2 Schema template câu hỏi

Mỗi template đề xuất có các field:

```json
{
  "id": "addition-within-10-basic",
  "sourceSkillId": "3.1.1",
  "topic": "addition",
  "grade": 1,
  "difficulty": "easy",
  "questionType": "number-input",
  "tags": ["within-10", "no-carry", "calc"],
  "variables": {
    "a": { "type": "integer", "min": 1, "max": 9 },
    "b": { "type": "integer", "min": 1, "max": 9 }
  },
  "constraints": [
    "a + b <= 10"
  ],
  "promptTemplate": "{{a}} + {{b}} = ?",
  "answerExpression": "a + b",
  "choicesRule": null,
  "hintTemplate": "Bắt đầu từ {{a}}, đếm thêm {{b}} bước.",
  "solutionTemplate": "{{a}} + {{b}} = {{answer}}.",
  "timeLimitSeconds": 30,
  "validationExamples": [
    { "variables": { "a": 2, "b": 3 }, "answer": 5 }
  ]
}
```

Các field chính:

- `id`: định danh ổn định của template.
- `sourceSkillId`: mã bài trong `skill-generate-math.md` nếu có, ví dụ `1.1.2` hoặc `Template 3.1.1`.
- `topic`: nhóm học tập như `counting`, `addition`, `subtraction`, `comparison`, `ordering`, `missing-number`, `geometry`, `measurement`, `time`, `calendar`, `mixed`.
- `grade`: lớp áp dụng.
- `difficulty`: `easy`, `medium`, `hard`.
- `questionType`: `multiple-choice`, `number-input`, `comparison-sign`, `missing-number`, `fill-text`, `word-problem`, `sort-numbers`, `clock-hour`, `weekday-blank`, `relative-date`.
- `variables`: biến random và miền giá trị.
- `constraints`: điều kiện bắt buộc để bộ biến hợp lệ.
- `promptTemplate`: đề bài có placeholder.
- `answerExpression` hoặc `answerRule`: công thức/rule tính đáp án đúng.
- `choicesRule`: quy tắc sinh lựa chọn cho trắc nghiệm.
- `hintTemplate`: gợi ý render theo biến.
- `solutionTemplate`: lời giải render theo biến và đáp án.
- `validationExamples`: ví dụ kiểm tra thủ công/auto test cho template.

### 13.3 Luồng sinh câu hỏi từ template

1. Lọc template theo `grade`, `topic`, `difficulty`, `questionType` và chế độ chơi.
2. Random biến theo `variables`.
3. Kiểm tra `constraints`; nếu fail thì random lại.
4. Tính `answer` bằng `answerExpression` hoặc `answerRule`.
5. Sinh `choices` nếu là trắc nghiệm, đảm bảo không trùng đáp án đúng và không có lựa chọn vô lý.
6. Render `prompt`, `hint`, `solution` từ template.
7. Kiểm tra câu hỏi không trùng quá gần trong cùng lượt 10 câu.
8. Ghi log sự kiện sinh câu hỏi vào app log ở chế độ review/QA.
9. Trả về object `Question` cụ thể cho UI.

Nếu một template không sinh được bộ biến hợp lệ sau số lần thử giới hạn, generator bỏ qua template đó trong lượt hiện tại.

### 13.4 Ràng buộc nội dung toán học

- Cộng/trừ lớp 1 phải nằm trong phạm vi yêu cầu của chủ đề: 10, 20 hoặc 99 tùy template.
- Phép trừ không được ra số âm.
- Phép cộng trừ không nhớ, không vượt quá 99
- Template `no-carry` không được sinh phép cộng có nhớ.
- Template `no-borrow` không được sinh phép trừ có mượn.
- Bài so sánh phải tính hai vế trước khi chọn dấu `>`, `<`, `=`.
- Bài điền số còn thiếu phải có nghiệm duy nhất.
- Bài lời văn phải giữ ngữ cảnh hợp lý: số lượng vật thể không âm, tên nhân vật nhất quán, đơn vị đo đúng.
- Gợi ý và lời giải phải dùng đúng các con số đã random, không được hard-code số từ ví dụ gốc.

### 13.5 Dữ liệu câu hỏi runtime

Sau khi sinh từ template, UI chỉ nhận object câu hỏi cụ thể:

```ts
type GeneratedQuestion = {
  id: string;
  templateId: string;
  grade: 1 | 2;
  topic: Topic;
  difficulty: Difficulty;
  type: QuestionType;
  prompt: string;
  correctAnswer: string | number;
  choices?: Array<string | number>;
  hint: string;
  solution: string;
  timeLimitSeconds: number;
};
```

### 13.6 Payload cho các dạng câu hỏi tương tác

Các dạng câu hỏi cơ bản có thể dùng `prompt`, `choices`, `correctAnswer`. Các dạng tương tác mới cần thêm `interactionPayload` để UI render đúng component.

```ts
type InteractionPayload =
  | SortNumbersPayload
  | MissingEquationPayload
  | ClockHourPayload
  | WeekdayBlankPayload
  | RelativeDatePayload;

type GeneratedQuestion = {
  id: string;
  templateId: string;
  grade: 1 | 2;
  topic: Topic;
  difficulty: Difficulty;
  type: QuestionType;
  prompt: string;
  correctAnswer: string | number | string[] | Record<string, string>;
  choices?: Array<string | number>;
  hint: string;
  solution: string;
  timeLimitSeconds: number;
  interactionPayload?: InteractionPayload;
};
```

#### SortNumbersPayload

```ts
type SortDirection = "ascending" | "descending";

type SortNumbersPayload = {
  kind: "sort-numbers";
  title: "Hãy sắp xếp các số sau từ bé đến lớn" | "Hãy sắp xếp các số sau từ lớn đến bé";
  numbers: string[];
  numericValues: number[];
  initialPool: string[];
  targetSlots: Array<string | null>;
  sortDirection: SortDirection;
  correctOrder: string[];
};
```

Rule sinh dữ liệu:

- Random `count` từ 7 đến 10.
- Random số duy nhất trong khoảng 1 đến 99.
- Render số dạng 2 chữ số nếu thiết kế yêu cầu, ví dụ `01`, `07`, `25`.
- `initialPool` là danh sách thẻ số ban đầu hiển thị phía dưới.
- `targetSlots` khởi tạo bằng danh sách `null` có cùng độ dài với `numbers`.
- `correctOrder` là danh sách đã sort theo `sortDirection`.
- Khi học sinh trả lời sai, UI reset `targetSlots` về toàn bộ `null` và khôi phục `initialPool`.
- Dữ liệu log cần lưu cả `initialPool`, `targetSlots` học sinh gửi, `correctOrder` và kết quả đúng/sai.

#### MissingEquationPayload

```ts
type EquationPattern =
  | "blank-plus-b"
  | "a-plus-blank"
  | "a-minus-blank"
  | "blank-minus-b";

type MissingEquationPayload = {
  kind: "missing-equation";
  equationPattern: EquationPattern;
  displayParts: Array<string | { blank: true }>;
  values: Record<string, number>;
  blankKey: "a" | "b";
  correctAnswer: number;
  choices: string[];
  acceptLeadingZero: true;
};
```

Rule sinh dữ liệu:

- Tất cả số nằm trong khoảng 1 đến 99.
- Phép cộng không nhớ: hàng đơn vị của hai số cộng lại nhỏ hơn 10.
- Phép trừ không mượn: số bị trừ lớn hơn hoặc bằng số trừ, và hàng đơn vị của số bị trừ lớn hơn hoặc bằng hàng đơn vị của số trừ.
- Kết quả không âm.
- Mỗi câu có đúng một nghiệm.
- UI normalize đáp án trước khi kiểm tra để `5` và `05` đều hợp lệ.

#### ClockHourPayload

```ts
type ClockHourPayload = {
  kind: "clock-hour";
  hour: number;
  minuteHand: 12;
  choices: string[];
  correctAnswer: string;
};
```

Rule sinh dữ liệu:

- `hour` random từ 1 đến 12.
- `minuteHand` luôn là 12.
- `choices` có 4 đáp án không trùng nhau, đều trong khoảng `1 giờ` đến `12 giờ`.
- `correctAnswer` là `${hour} giờ`.

#### WeekdayBlankPayload

```ts
type Weekday =
  | "Thứ 2"
  | "Thứ 3"
  | "Thứ 4"
  | "Thứ 5"
  | "Thứ 6"
  | "Thứ 7"
  | "Chủ nhật";

type WeekdayBlankPayload = {
  kind: "weekday-blank";
  title: "Chọn ngày trong tuần";
  startWeekday: Weekday;
  sequenceLength: number;
  blankIndex: number;
  displaySequence: Array<Weekday | { blank: true }>;
  choices: Weekday[];
  correctAnswer: Weekday;
};
```

Rule sinh dữ liệu:

- Chu kỳ ngày là `Thứ 2 -> Thứ 3 -> Thứ 4 -> Thứ 5 -> Thứ 6 -> Thứ 7 -> Chủ nhật -> Thứ 2`.
- `startWeekday` random từ 7 ngày.
- `sequenceLength` nên từ 4 đến 7 để trẻ không bị quá tải.
- `blankIndex` không nên luôn ở giữa; có thể random nhưng tránh vị trí đầu nếu muốn giữ ngữ cảnh dễ đọc.
- `choices` có 4 ngày hợp lệ, không trùng nhau, gồm `correctAnswer`.

#### RelativeDatePayload

```ts
type CalendarMode = "weekday" | "monthDate";

type RelativeDateSlot = "yesterday" | "today" | "tomorrow";

type RelativeDatePayload = {
  kind: "relative-date";
  title: "Tìm giá trị đúng";
  calendarMode: CalendarMode;
  targets: Array<{
    slot: RelativeDateSlot;
    label: "Hôm qua" | "Hôm nay" | "Ngày mai";
  }>;
  shuffledChoices: string[];
  correctMapping: Record<RelativeDateSlot, string>;
};
```

Rule sinh dữ liệu:

- Với `weekday`:
  - Chọn 3 ngày liên tiếp theo chu kỳ tuần.
  - Cho phép qua cuối tuần, ví dụ `Chủ nhật -> Thứ 2 -> Thứ 3`.
  - `shuffledChoices` là 3 ngày đã random thứ tự.
- Với `monthDate`:
  - Random `yesterday` từ 1 đến 29.
  - `today = yesterday + 1`.
  - `tomorrow = yesterday + 2`.
  - Render dạng 2 chữ số: `01`, `02`, ..., `31`.
  - Không sinh case chuyển tháng trong MVP.
- UI kiểm tra đúng khi cả 3 ô được đặt đúng.

### 13.7 Ràng buộc UX và kiểm tra đáp án cho tương tác kéo thả

- Kéo thả phải có fallback bằng click/tap: chọn thẻ nguồn, chọn vị trí đích.
- Học sinh được phép sửa đáp án trước khi bấm `Trả lời`.
- Trạng thái thiếu đáp án phải hiển thị nhẹ nhàng: `Con còn một ô chưa điền nhé.`
- Không tự tính sai khi trẻ chỉ kéo nhầm nhưng chưa bấm trả lời.
- Với `sort-numbers`, đáp án đúng khi toàn bộ mảng học sinh gửi khớp `correctOrder`.
- Với `relative-date`, đáp án đúng khi toàn bộ mapping `yesterday/today/tomorrow` khớp `correctMapping`.
- Log phải ghi cả trạng thái ban đầu và trạng thái học sinh gửi để debug được lỗi kéo thả.

### 13.8 Dữ liệu tiến độ
- `completedChallenges`
- `unlockedLevels`
- `bestScore`
- `soundEnabled`
- `playerName`
- `grade`

### 13.9 App log cho câu hỏi sinh random

Mục tiêu của app log là giúp developer/phụ huynh review lại câu hỏi được sinh từ template có hợp lý không, đáp án có đúng không, và game có xử lý đúng khi học sinh trả lời không.

Vì MVP là web app chạy trên trình duyệt, app không nên giả định có quyền tự ghi trực tiếp vào filesystem. Thiết kế đề xuất:

- Lưu log tạm trong memory trong phiên chơi hiện tại.
- Đồng bộ log cục bộ vào `localStorage` hoặc `IndexedDB` với giới hạn dung lượng.
- Có nút/chế độ export log thành file `.jsonl` hoặc `.json` để review.
- Trong môi trường dev có thể ghi thêm ra `console.debug`, nhưng không dựa vào console làm nguồn log duy nhất.

Log không được hiển thị đáp án đúng trong màn chơi. Nếu có màn debug/log viewer thì phải tách khỏi flow học sinh chơi bình thường.

Schema log đề xuất:

```ts
type QuestionPlayLog = {
  eventId: string;
  eventType:
    | "question_generated"
    | "question_answered"
    | "question_timeout"
    | "template_skipped"
    | "template_validation_error";
  timestamp: string;
  sessionId: string;
  playerName?: string;
  grade: 1 | 2;
  mode: "practice" | "challenge";
  topic: Topic;
  difficulty: Difficulty;
  templateId?: string;
  sourceSkillId?: string;
  variables?: Record<string, string | number | boolean>;
  prompt?: string;
  choices?: Array<string | number>;
  interactionPayload?: InteractionPayload;
  correctAnswer?: string | number;
  hint?: string;
  solution?: string;
  userAnswer?: string | number;
  userInteractionState?: unknown;
  correctInteractionState?: unknown;
  isCorrect?: boolean;
  attemptCount?: number;
  timeSpentSeconds?: number;
  scoreDelta?: number;
  hintShown?: boolean;
  errorMessage?: string;
};
```

Thời điểm ghi log:

- Khi generator tạo xong câu hỏi: ghi `question_generated` gồm template, biến random, đề bài, choices, đáp án đúng, gợi ý và lời giải.
- Khi học sinh trả lời: ghi `question_answered` gồm câu trả lời, đúng/sai, số lần thử, thời gian trả lời và điểm.
- Với câu tương tác, log thêm `interactionPayload`, `userInteractionState` và `correctInteractionState`.
  - `sort-numbers`: log thứ tự số ban đầu, thứ tự học sinh gửi, thứ tự đúng.
  - `relative-date`: log mapping học sinh kéo vào các ô và mapping đúng.
  - `clock-hour`: log giờ được sinh, choices và lựa chọn của học sinh.
  - `weekday-blank`: log dãy ngày, vị trí ô trống, choices và lựa chọn của học sinh.
- Khi hết giờ: ghi `question_timeout`.
- Khi template bị bỏ qua hoặc validate lỗi: ghi `template_skipped` hoặc `template_validation_error`.

Quy tắc vận hành:

- Mỗi lượt chơi có một `sessionId` để gom log.
- Log cần đủ thông tin để tái hiện câu hỏi đã sinh mà không cần random lại.
- App nên giới hạn số log lưu cục bộ, ví dụ chỉ giữ N lượt chơi gần nhất.
- Export log nên dùng JSONL để dễ đọc từng dòng và dễ diff khi review.

## 14. Luồng UI đề xuất

1. Trang chủ: chào mừng, chọn tên/lớp, nút `Bắt đầu`.
2. Màn chọn chế độ: Luyện tập / Thử thách.
3. Màn chọn chủ đề và độ khó.
4. Màn chơi: câu hỏi, đồng hồ, thanh tiến độ, biểu tượng cú mèo và component trả lời theo `questionType`.
5. Màn kết quả: tổng điểm, số câu đúng, huy hiệu, gợi ý mở khóa.
6. Màn tiến độ: hiển thị các màn đã mở khóa, màn bị khóa và điều kiện mở.

Trong `GameScreen`, UI chọn component theo `questionType`:

- `multiple-choice`: lưới đáp án.
- `number-input`, `missing-number`: ô nhập số.
- `comparison-sign`: chọn dấu `>`, `<`, `=`.
- `sort-numbers`: ô trống phía trên và thẻ số phía dưới để kéo thả hoặc bấm chọn đặt vào ô.
- `missing-equation`: phép tính có ô trống nổi bật và 4 đáp án số để chọn.
- `clock-hour`: đồng hồ kim và 4 đáp án.
- `weekday-blank`: dãy ngày có ô trống và 4 đáp án.
- `relative-date`: kéo thả 3 thẻ vào `Hôm qua`, `Hôm nay`, `Ngày mai`, ô đích không có chữ nền hướng dẫn dài.

## 15. Tính năng mở rộng sau này

- Thêm nhiều chủ đề như: Nhân, Chia cơ bản, Toán hình.
- Thêm bảng xếp hạng cục bộ.
- Thêm nhiều nhân vật/skin cho avatar.
- Thêm tính năng luyện theo ngày.

## 16. Kết luận

Game thiết kế hướng tới sự đơn giản, dễ dùng và tạo động lực học tập cho học sinh nhỏ tuổi. Trải nghiệm tập trung vào phản hồi nhanh, giao diện vui nhộn, tiến độ mở khóa và điểm thưởng để giữ trẻ em hứng thú.
