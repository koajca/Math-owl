# Tasks Phát Triển Web Game "Cú Mèo Toán Học"

## Sprint 1: Thiết lập nền tảng và onboarding

- [x] Tạo repository / thiết lập project React + Vite.
- [x] Cấu hình `package.json`, `tsconfig.json` (nếu dùng TypeScript), và cấu trúc thư mục.
- [x] Cài đặt dependency cơ bản: React, React DOM, Vite, ESLint, Prettier.
- [x] Thiết lập `localStorage` helper và cấu hình môi trường phát triển.
- [x] Thiết kế định dạng câu hỏi và dữ liệu bài tập.
- [x] Tạo module dữ liệu câu hỏi mẫu theo lớp, chủ đề và độ khó.
- [x] Thiết kế cấu trúc lưu tiến độ `localStorage`.
- [x] Tạo màn trang chủ với tên game, giới thiệu và nút `Bắt đầu`.
- [x] Tạo màn nhập tên học sinh và chọn lớp (1 hoặc 2).
- [x] Tạo UI lựa chọn avatar và cài đặt âm thanh.
- [x] Lưu lựa chọn người chơi vào `localStorage`.

## Sprint 2: Chế độ chơi và cơ chế câu hỏi

- [x] Xây dựng màn chọn chế độ: Luyện tập / Thử thách.
- [x] Tạo màn chọn độ khó: Dễ / Vừa / Khó.
- [x] Tạo màn chọn chủ đề: Cộng, Trừ, So sánh, Tổng hợp.
- [x] Hiển thị trạng thái màn bị khóa và điều kiện mở khóa.
- [x] Xây dựng component hiển thị câu hỏi.
- [x] Hỗ trợ các kiểu câu hỏi: trắc nghiệm, nhập đáp án, điền số, so sánh.
- [x] Tạo bộ chọn đáp án 3 hoặc 4 lựa chọn cho trắc nghiệm.
- [x] Tạo trường nhập liệu cho câu hỏi nhập đáp án và điền số.
- [x] Hiển thị gợi ý khi người chơi sai 2 lần liên tiếp.
- [x] Cập nhật trạng thái đúng/sai và phản hồi từ cú mèo.
- [x] Thêm đồng hồ đếm ngược cho mỗi câu.
- [x] Xử lý khi hết giờ: tính là sai 1 lần, chuyển câu tiếp theo.
- [x] Quản lý số câu đã trả lời trong lượt Thử thách (10 câu).
- [x] Hiển thị thanh tiến độ và số câu còn lại.

## Sprint 3: Điểm số, kết quả và mở khóa

- [x] Tính điểm theo quy tắc: đúng lần đầu +10, đúng sau sai +5, sai 3 lần -5.
- [x] Thưởng thành tích: hoàn thành 8/10 +20, 10/10 +50 và huy hiệu.
- [x] Ngăn điểm âm.
- [x] Tạo màn kết quả sau lượt Thử thách.
- [x] Hiển thị số câu đúng, điểm, huy hiệu và gợi ý mở khóa.
- [x] Thiết kế hệ thống mở khóa cấp độ theo số thử thách hoàn thành.
- [x] Sử dụng `localStorage` để lưu số thử thách đã hoàn thành.
- [x] Hiển thị điều kiện mở khóa rõ ràng.
- [x] Mở khóa các chế độ/độ khó mới khi đạt mốc.

## Sprint 4: Âm thanh, UI và hoàn thiện trải nghiệm

- [x] Thêm hiệu ứng âm thanh đúng/sai/hết giờ/hoàn thành.
- [x] Đặt/copy `buzzer-or-wrong-answer.mp3` vào `public/sounds/` nếu file chưa nằm đúng thư mục asset.
- [x] Đặt/copy `success-answer.mp3` vào `public/sounds/` nếu file chưa nằm đúng thư mục asset.
- [x] Cập nhật âm thanh trả lời sai dùng file `public/sounds/buzzer-or-wrong-answer.mp3`.
- [x] Cập nhật âm thanh trả lời đúng dùng file `public/sounds/success-answer.mp3`.
- [x] Kiểm tra nút bật/tắt âm thanh áp dụng đúng cho 2 âm thanh trả lời đúng/sai mới.
- [x] Thêm âm thanh khởi động/chime khi vào game.
- [x] Thêm nút bật/tắt âm thanh.
- [x] Kết hợp phản hồi bằng cú mèo với biểu cảm và lời nhắc.
- [x] Thiết kế giao diện Khu Rừng Toán Học.
- [x] Tạo các thành phần UI: nút lớn, thẻ màn chơi, thanh tiến độ, biểu tượng.
- [x] Điều chỉnh font chữ của các bài toán có lời giải theo kích thước màn hình, tránh hiển thị quá khổ trên desktop/tablet/mobile nhưng vẫn đủ lớn và dễ đọc cho trẻ nhỏ.
- [x] Đảm bảo tương thích trên desktop và mobile.
- [x] Thêm các hiệu ứng chuyển cảnh nhẹ và hiển thị phản hồi.

## Sprint 5: Kiểm thử và tài liệu

- [ ] Kiểm thử chức năng chơi toàn bộ luồng quãng đường.
- [ ] Kiểm tra `localStorage` lưu và khôi phục tiến trình.
- [ ] Sửa lỗi hiển thị, tính toán điểm, và thời gian.
- [ ] Tinh chỉnh câu hỏi, độ khó, và gợi ý.
- [ ] Ghi chú cách mở rộng câu hỏi và chủ đề mới.
- [ ] Chuẩn bị bản mô tả kiến trúc cho phát triển tiếp theo.
- [ ] Lên kế hoạch thêm chủ đề mới: Nhân, Chia, Toán hình.

## Sprint 6: Template JSON sinh câu hỏi random

- [x] Rà soát `specs/knowledge/skill-generate-math.md` và chọn phạm vi template MVP cần chuyển đổi.
- [x] Chốt danh sách chủ đề template MVP: cộng, trừ, so sánh, điền số, tổng hợp hoặc toàn bộ chủ đề lớp 1.
- [x] Thiết kế file `src/data/questionTemplates.json` theo schema đã mô tả trong `specs/design.md`.
- [x] Tạo type `QuestionTemplate`, `TemplateVariable`, `GeneratedQuestion`, `QuestionType`, `Topic`, `Difficulty`.
- [x] Tạo bộ template mẫu cho các dạng: `multiple-choice`, `number-input`, `comparison-sign`, `missing-number`, `word-problem`.
- [x] Mỗi template phải có `id`, `sourceSkillId`, `grade`, `topic`, `difficulty`, `questionType`, `tags`.
- [x] Mỗi template phải có `variables`, `constraints`, `promptTemplate`, `answerRule` hoặc `answerExpression`.
- [x] Mỗi template phải có `hintTemplate`, `solutionTemplate`, `timeLimitSeconds`, `validationExamples`.
- [x] Tạo module `questionTemplateValidator` để kiểm tra template thiếu field, placeholder sai, constraint lỗi, example sai đáp án.
- [x] Tạo module `questionTemplateRenderer` để render đề bài, gợi ý và lời giải từ biến random.
- [x] Tạo module random biến từ `variables` và validate bằng `constraints`.
- [x] Tạo rule evaluator an toàn cho đáp án; không dùng `eval` trực tiếp với nội dung JSON.
- [x] Tạo rule sinh đáp án nhiễu cho trắc nghiệm, đảm bảo không trùng đáp án đúng và không trùng nhau.
- [x] Tạo cơ chế retry khi random biến không thỏa constraints, sau giới hạn retry thì bỏ qua template.
- [x] Tạo cơ chế chống lặp câu hỏi quá gần trong cùng một lượt chơi 10 câu.
- [x] Tích hợp generator mới vào game loop thay cho hoặc chạy song song với `sampleQuestions`.
- [x] Đảm bảo câu hỏi sinh ra vẫn tương thích với UI hiện tại: prompt, choices, correctAnswer, hint, timeLimitSeconds.
- [ ] Thêm unit test cho các template mẫu dựa trên `validationExamples`.
- [ ] Thêm test kiểm tra cộng/trừ không vượt phạm vi, không âm, không nhớ/không mượn khi template yêu cầu.
- [ ] Thêm test smoke tạo 10 câu cho mỗi tổ hợp lớp/chủ đề/độ khó MVP.

## Sprint 7: App log để review câu hỏi và đáp án

- [x] Thiết kế type `QuestionPlayLog` theo schema trong `specs/design.md`.
- [x] Tạo `sessionId` cho mỗi lượt chơi practice/challenge.
- [x] Tạo module `appLogger` để ghi log trong memory trong phiên chơi hiện tại.
- [x] Lưu log cục bộ vào `localStorage` hoặc `IndexedDB` với giới hạn dung lượng.
- [x] Ghi event `question_generated` sau khi generator tạo xong câu hỏi.
- [x] Log `question_generated` phải có `templateId`, `sourceSkillId`, biến random, prompt, choices, correctAnswer, hint, solution.
- [x] Ghi event `question_answered` khi người chơi trả lời.
- [x] Log `question_answered` phải có userAnswer, đúng/sai, attemptCount, timeSpentSeconds, scoreDelta.
- [x] Ghi event `question_timeout` khi hết giờ.
- [x] Ghi event `template_skipped` khi template không sinh được biến hợp lệ sau giới hạn retry.
- [x] Ghi event `template_validation_error` khi template lỗi schema, constraint hoặc render placeholder.
- [x] Thêm nút hoặc chế độ export log thành `.jsonl` hoặc `.json` để review.
- [x] Đảm bảo log không hiển thị đáp án đúng trong màn chơi bình thường của học sinh.
- [x] Trong môi trường dev, có thể mirror log ra `console.debug` nhưng không phụ thuộc vào console.
- [x] Thêm cơ chế xóa log cũ hoặc chỉ giữ N lượt chơi gần nhất.
- [ ] Thêm test kiểm tra mỗi câu sinh ra đều có log `question_generated`.
- [ ] Thêm test kiểm tra trả lời đúng/sai/hết giờ đều tạo log tương ứng.
- [ ] Thêm test kiểm tra export log chứa đủ dữ liệu để tái hiện câu hỏi đã sinh.

## Sprint 8: Các dạng bài tương tác mới

### Dữ liệu, type và generator

- [x] Mở rộng `QuestionType` với các dạng mới: `sort-numbers`, `clock-hour`, `weekday-blank`, `relative-date`.
- [x] Mở rộng `GeneratedQuestion`/`Question` để hỗ trợ `interactionPayload`.
- [x] Tạo type `SortNumbersPayload`, `MissingEquationPayload`, `ClockHourPayload`, `WeekdayBlankPayload`, `RelativeDatePayload`.
- [x] Mở rộng template JSON để lưu payload/rule cho các dạng bài tương tác mới.
- [x] Mở rộng rule evaluator để kiểm tra đáp án dạng mảng, mapping kéo thả và lựa chọn đồng hồ/ngày.
- [x] Mở rộng logger để ghi `interactionPayload`, `userInteractionState`, `correctInteractionState`.
- [x] Cập nhật generator để chọn các dạng bài mới theo `topic`, `difficulty`, `questionType` và chế độ chơi.
- [x] Cập nhật logic normalize đáp án để chấp nhận `5` và `05` cho bài tìm số trong ô trống.

### Dạng sắp xếp số

- [x] Tạo template sinh bài `sort-numbers`.
- [x] Sinh 6 số cho độ khó Dễ, trong phạm vi `01-20`.
- [x] Sinh 7-8 số cho độ khó Vừa, trong phạm vi `01-99`.
- [x] Sinh 9-10 số cho độ khó Khó, trong phạm vi `01-99`.
- [x] Đảm bảo các số trong một câu không trùng nhau.
- [x] Hỗ trợ 2 hướng sắp xếp: từ bé đến lớn và từ lớn đến bé.
- [x] Tạo component `SortNumbersQuestion` với kéo thả để đổi thứ tự thẻ số.
- [x] Thêm fallback click/tap: chọn 2 thẻ để hoán đổi vị trí.
- [x] Kiểm tra đáp án bằng cách so sánh toàn bộ thứ tự học sinh gửi với `correctOrder`.
- [x] Log thứ tự ban đầu, thứ tự học sinh gửi và thứ tự đúng.

### Dạng tìm số trong ô trống

- [x] Mở rộng template tìm số trong ô trống cho 4 pattern: `__ + b = result`, `a + __ = result`, `a - __ = result`, `__ - b = result`.
- [x] Đảm bảo tất cả phép cộng không nhớ và phép trừ không mượn.
- [x] Đảm bảo số nằm trong khoảng `01-99`, kết quả không âm và mỗi câu có một nghiệm duy nhất.
- [x] Phân cấp độ khó theo design: Dễ dùng cộng trong `01-20`, Vừa thêm trừ trong `01-99`, Khó thêm pattern `__ - b = result`.
- [x] Tạo component `MissingEquationQuestion` hiển thị ô trống nổi bật và 4 đáp án để chọn phía dưới.
- [x] Sinh 4 đáp án không trùng nhau cho `MissingEquationQuestion`, trong đó chỉ 1 đáp án đúng.
- [x] Hint thay đổi theo `equationPattern`.
- [x] Log phương trình render, pattern, đáp án đúng và đáp án học sinh nhập.

### Dạng xem giờ

- [x] Tạo template sinh bài `clock-hour`.
- [x] Sinh `hour` từ 1 đến 12, `minuteHand` luôn bằng 12.
- [x] Sinh 4 đáp án không trùng nhau, chỉ 1 đáp án đúng.
- [x] Phân cấp độ khó theo design: Dễ ưu tiên 3/6/9/12, Vừa bất kỳ 1-12, Khó dùng nhiễu kề bên/dễ nhầm.
- [x] Tạo component `ClockQuestion` vẽ đồng hồ rõ ràng với số 1-12.
- [x] Kim phút dài hơn và luôn chỉ 12; kim giờ ngắn hơn và chỉ `hour`.
- [x] Thêm phản hồi đúng/sai cho đồng hồ, không làm layout nhảy.
- [x] Log giờ được sinh, choices, đáp án đúng và lựa chọn của học sinh.

### Dạng chọn ngày trong tuần

- [x] Tạo template sinh bài `weekday-blank`.
- [x] Sinh dãy ngày theo chu kỳ `Thứ 2 -> ... -> Chủ nhật -> Thứ 2`.
- [x] Cho phép dãy bắt đầu từ bất kỳ ngày nào trong tuần.
- [x] Cho phép dãy đi qua cuối tuần ở mức Vừa/Khó.
- [x] Sinh một ô trống tại `blankIndex`, tránh luôn cố định một vị trí.
- [x] Sinh 4 đáp án không trùng nhau, gồm đúng ngày còn thiếu.
- [x] Tạo component `WeekdayBlankQuestion` hiển thị dãy ngày và ô trống rõ ràng.
- [x] Khi chọn đúng, lấp ô trống bằng ngày đúng.
- [x] Log dãy ngày render, vị trí ô trống, choices, đáp án đúng và lựa chọn của học sinh.

### Dạng hôm qua - hôm nay - ngày mai

- [x] Tạo template sinh bài `relative-date`.
- [x] Hỗ trợ `calendarMode = weekday`.
- [x] Hỗ trợ `calendarMode = monthDate`.
- [x] Với `weekday`, sinh 3 ngày liên tiếp và cho phép qua cuối tuần từ mức Vừa trở lên.
- [x] Với `monthDate`, sinh `yesterday` từ 1 đến 29, `today = yesterday + 1`, `tomorrow = yesterday + 2`.
- [x] Render ngày trong tháng dạng 2 chữ số `01-31`.
- [x] Random thứ tự 3 thẻ đáp án trước khi hiển thị.
- [x] Tạo component `RelativeDateQuestion` với 3 ô đích: `Hôm qua`, `Hôm nay`, `Ngày mai`.
- [x] Hỗ trợ kéo thả thẻ đáp án vào ô đích.
- [x] Thêm fallback click/tap: chọn thẻ, chọn ô đích.
- [x] Cho phép đổi đáp án trước khi bấm `Trả lời`.
- [x] Kiểm tra đúng khi toàn bộ mapping `yesterday/today/tomorrow` khớp `correctMapping`.
- [x] Log mode được sinh, 3 giá trị đúng, thứ tự đáp án ban đầu, mapping học sinh gửi và mapping đúng.

### Tích hợp và kiểm thử

- [x] Cập nhật `GameScreen` để route component theo `questionType`.
- [x] Cập nhật phân phối câu hỏi để các dạng mới xuất hiện trong Luyện tập và Thử thách.
- [x] Cập nhật thời gian mỗi câu cho các dạng kéo thả nếu cần, tránh quá gắt với trẻ nhỏ.
- [x] Đảm bảo các dạng kéo thả không tự tính sai trước khi học sinh bấm `Trả lời`.
- [x] Kiểm thử responsive desktop/tablet/mobile cho các component mới.
- [x] Test sinh dữ liệu theo độ khó cho từng dạng bài mới.
- [x] Test log cho từng dạng bài mới có đủ dữ liệu để tái hiện câu hỏi.
- [x] Test một lượt 10 câu có thể trộn câu cũ và câu mới mà không crash game loop.

## Sprint 9: Cải tiến UI/UX tương tác sau review

### Sắp xếp số dạng ô trống phía trên

- [x] Cập nhật `SortNumbersPayload` để có `initialPool`, `targetSlots` và `correctOrder`.
- [x] Cập nhật generator `sort-numbers` để khởi tạo `initialPool` là danh sách số bị trộn và `targetSlots` là danh sách ô trống.
- [x] Thiết kế lại `SortNumbersQuestion` thành 2 vùng: ô trống phía trên và thẻ số phía dưới.
- [x] Hỗ trợ kéo thả thẻ số từ vùng dưới vào ô trống phía trên.
- [x] Hỗ trợ fallback click/tap: chọn thẻ số, chọn ô trống đích để đặt thẻ.
- [x] Cho phép đổi hoặc gỡ thẻ đã đặt khỏi ô trống trước khi bấm `Trả lời`.
- [x] Khi bấm `Trả lời`, chỉ chấm đúng khi toàn bộ `targetSlots` khớp `correctOrder`.
- [x] Khi trả lời sai, highlight nhẹ vị trí sai rồi reset toàn bộ ô trống, trả thẻ số về vùng dưới và cho học sinh làm lại.
- [x] Log `sort-numbers` gồm `initialPool`, `targetSlots` học sinh gửi, `correctOrder`, số lần thử và kết quả đúng/sai.
- [x] Tăng thời lượng bài `sort-numbers` lên gấp đôi bài toán thông thường cùng độ khó.

### Reset khi sai cho bài kéo thả/chọn nhiều bước

- [x] Cập nhật luồng chấm điểm để các bài kéo thả/chọn nhiều bước không tự chuyển câu ngay sau lần sai đầu tiên nếu còn lượt thử.
- [x] Với `relative-date`, khi trả lời sai phải reset 3 ô đích về trống, trả thẻ đáp án về danh sách phía dưới và cho chọn lại.
- [x] Với `relative-date`, ô đích chỉ hiển thị nhãn ngắn `Hôm qua`, `Hôm nay`, `Ngày mai`; loại bỏ chữ nền dài kiểu `Kéo thả đáp án vào đây`.
- [x] Đảm bảo các bài kéo thả vẫn ghi log cho từng lần trả lời sai và đúng.
- [x] Kiểm tra timeout vẫn chuyển câu đúng rule, không reset vô hạn khi hết giờ.

### Font, hover và responsive

- [x] Giảm cỡ chữ tự động cho các câu hỏi có mô tả dài hoặc bài toán lời văn dài.
- [x] Đảm bảo câu hỏi dài không tràn khung, không che đáp án và không đẩy nút thao tác khỏi màn hình mobile.
- [x] Thêm hiệu ứng hover/focus cho đáp án, thẻ số, thẻ ngày và ô đích: đổi viền sang xanh lá/xanh trời, nền sáng nhẹ theo tone game.
- [x] Đảm bảo hover/focus không làm layout nhảy hoặc thay đổi kích thước element.
- [x] Thêm trạng thái focus tương đương hover để dùng được bằng bàn phím.
- [x] Kiểm thử responsive desktop/tablet/mobile cho các thay đổi UI mới.

## Phân chia module theo độ ưu tiên

### Must have cho MVP

- Login local.
- Home/map.
- Chọn chế độ, chủ đề, độ khó.
- Game loop 10 câu.
- Cộng/trừ/so sánh.
- Template JSON sinh câu hỏi random cho phạm vi MVP.
- App log/export log để review câu hỏi random và đáp án.
- Các dạng bài tương tác mới: sắp xếp số, tìm số trong ô trống, xem giờ, chọn ngày trong tuần, hôm qua/hôm nay/ngày mai.
- Timer.
- Điểm và gợi ý.
- Mở khóa theo số thử thách.
- Result screen.
- localStorage.
- Âm thanh đầy đủ.
- Hiệu ứng đúng/sai/hoàn thành.
- Mascot nhiều biểu cảm.

### Should have

- Huy hiệu.

### Could have

- Nhiều skin cú mèo.
- Kéo thả đáp án.
- Nhiệm vụ hằng ngày.
- Bản đồ nhiều màn hơn.

## Acceptance criteria MVP

- Học sinh có thể vào game bằng tên và lớp mà không cần tài khoản thật.
- Hoàn thành được một thử thách 10 câu.
- Câu hỏi đúng phạm vi và đúng rule không nhớ/không mượn.
- Câu hỏi sinh từ template JSON có prompt, đáp án, gợi ý và lời giải khớp với biến random.
- Các dạng bài tương tác mới sinh đúng theo rule độ khó trong `specs/design.md`.
- Câu sắp xếp số hỗ trợ kéo thả và fallback click/tap.
- Câu hôm qua/hôm nay/ngày mai hỗ trợ kéo thả và fallback click/tap.
- Câu xem giờ hiển thị đồng hồ rõ ràng, kim phút chỉ 12, kim giờ chỉ đúng giờ được sinh.
- Câu chọn ngày trong tuần xử lý đúng chu kỳ qua `Chủ nhật -> Thứ 2`.
- Mỗi câu được sinh trong lượt chơi có log `question_generated` đủ dữ liệu để tái hiện.
- Khi người chơi trả lời hoặc hết giờ, app ghi log kết quả xử lý tương ứng.
- Có thể export log thành `.jsonl` hoặc `.json` để review.
- Hết giờ tự chuyển câu tiếp theo.
- Sai 2 lần liên tiếp có gợi ý.
- Sai 3 lần liên tiếp bị trừ điểm.
- Hoàn thành thử thách lưu tiến độ vào localStorage.
- Độ khó/màn chơi mở khóa đúng theo số thử thách hoàn thành.
- UI dùng tiếng Việt, phù hợp học sinh lớp 1 và lớp 2.
- Font chữ của đề bài, lời giải, gợi ý và đáp án co giãn hợp lý theo màn hình, không tràn khung hoặc che mất nút thao tác.
- Chạy ổn trên mobile và desktop.
