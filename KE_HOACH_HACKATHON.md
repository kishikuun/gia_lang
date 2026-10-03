# Kế Hoạch Nâng Cấp Dự Án "Già Làng Số" - Vòng Trong Hackathon

## I. Phân Tích Hiện Trạng Dự Án & Đề Bài Mới

### 1. Hiện trạng dự án:
- **Backend:** Đã được xây dựng bằng FastAPI (`main.py`), tích hợp Google Gemini và Ollama. Đã có cơ chế cấp quyền Tool Calling cho AI (ví dụ: `add_to_cart`, `highlight_product`, `play_sound`). System Prompt đã định hình tính cách "Già Làng Gen Z". Kho tri thức được đặt tại `kien_thuc.txt`.
- **Frontend:** Các trang `home`, `heritage`, `products` sử dụng Jinja2 Template, có khung chat cơ bản.

### 2. Yêu cầu mới từ ban giám khảo:
Thời gian thực hiện: **120 phút**.
- **(1) Tương tác chọn chủ đề:** Người dùng phải chọn được ít nhất 3 chủ đề (Nguồn gốc, quy trình, giá trị văn hóa).
- **(2) Định dạng AI:** Giới hạn 2-4 câu, ngôn ngữ gần gũi.
- **(3) Bám sát tri thức & Tình huống thiếu dữ liệu:** AI không được tự sáng tác, phải nói rõ chưa có thông tin nếu hỏi ngoài lề. Chức năng **phân tích tình huống và hiển thị mức độ nguy cơ** (ví dụ: Cảnh báo khi thiếu dữ liệu).
- **(4) Gợi ý tương tác (Next actions):** Sau mỗi câu trả lời, cần có ít nhất 2 gợi ý cho người dùng click tiếp.
- **(5) Kết nối sản phẩm:** Dữ liệu bắt buộc (Bún Song Thằn, 150.000đ/hộp, đậu xanh nguyên chất).
- **(6) Yêu cầu Pitching:** Trình diễn chạy được, trình bày cách ứng dụng AI, nếu hạn chế & hướng phát triển.

---

## II. Kế Hoạch Phân Công Chi Tiết (Cho 5 Thành Viên)

Với thời gian 120 phút cực kỳ áp lực, nhóm cần chia rõ nhiệm vụ song song, không dẫm chân lên nhau. Dưới đây là bảng phân công:

### 🌟 NHÓM LẬP TRÌNH (3 Người)

#### 👨‍💻 Coder 1: Trưởng nhóm AI & Backend Logic (Core)
- **Nhiệm vụ chính:** Quản lý toàn bộ "não" của AI, cấu hình Prompt và đánh giá nguy cơ.
- **Action items:**
  1. Cập nhật **System Instruction** trong `main.py`: Bổ sung chặt chẽ luật "Trả lời 2-4 câu", "Tuyệt đối không bịa thông tin", "Dữ liệu mock: 150k/hộp".
  2. Viết thêm một luồng phân tích (Pre-processing) độc lập hoặc dùng Structured Output để đánh giá câu hỏi của người dùng -> Trả về JSON có chứa trường `risk_level` (Ví dụ: `Safe` nếu hỏi đúng chủ đề bún Song Thằn, `Warning` nếu hỏi về kiến thức không có trong data).
  3. Xử lý kịch bản "Thiếu dữ liệu": Cài cắm prompt để AI tự thú nhận "Già chưa nghe tới chuyện này bao giờ..." thay vì nói dối.

#### 👨‍💻 Coder 2: Backend API & Data Structure (Luồng tương tác)
- **Nhiệm vụ chính:** Xử lý format trả về của API và tính năng "Gợi ý tương tác".
- **Action items:**
  1. Thay đổi cấu trúc trả về của API `/api/interact`. Thay vì chỉ trả về `text`, cần trả về JSON với cấu trúc: `{ "response": "...", "actions": [...], "suggested_replies": ["Già kể tiếp đi", "Sản phẩm này có gì đặc biệt?"], "risk_level": "Safe" }`.
  2. Tích hợp với Coder 1 để AI tự sinh ra `suggested_replies` theo ngữ cảnh, hoặc viết logic cứng (fallback) trong backend để luôn luôn có 2 gợi ý được chèn vào.

#### 👨‍💻 Coder 3: Frontend Developer (UI/UX)
- **Nhiệm vụ chính:** Đưa các tính năng mới hiển thị lên giao diện mượt mà nhất để ban giám khảo chấm điểm.
- **Action items:**
  1. Tạo UI **3 nút bấm chọn chủ đề ban đầu** (Nguồn gốc bún Song Thằn, Quy trình làm bún, Giá trị văn hóa) ngay khi mở hộp chat.
  2. Xử lý hiển thị **"Gợi ý tương tác"**: Nhận mảng `suggested_replies` từ API và vẽ thành các nút bấm (chip buttons) ở cuối câu trả lời của AI. Khi click vào thì tự động gửi tin nhắn.
  3. Xử lý UI **Hiển thị mức độ nguy cơ**: Bổ sung một icon cảnh báo nhỏ hoặc thay đổi màu viền tin nhắn (ví dụ viền vàng) nếu API trả về `risk_level == 'Warning'`, kèm tooltip "Dữ liệu ngoài kho tri thức".

### 🌟 NHÓM NỘI DUNG & THUYẾT TRÌNH (2 Người)

#### 📝 Thành viên 4: Data Engineer & QA Tester
- **Nhiệm vụ chính:** Đảm bảo "sạch" dữ liệu và kiểm thử toàn bộ ngóc ngách của ứng dụng.
- **Action items:**
  1. Review lại toàn bộ file `backend/data/kien_thuc.txt`. Đảm bảo các thông tin như "Bún Song Thằn", "150.000 đồng/hộp", "Đậu xanh nguyên chất" phải cực kỳ rõ ràng, dễ trích xuất. Xóa bớt rác nếu có.
  2. Đóng vai trò là Tester, liên tục nhập các tình huống khó để phá AI (Ví dụ hỏi: "Bún này giá 200k đúng không?", "Làm bún này có dùng hóa chất không?", "Ông kể chuyện siêu nhân đi").
  3. Phối hợp với Coder 1 để sửa ngay Prompt nếu AI bắt đầu "bịa chuyện".

#### 🎤 Thành viên 5: Presenter & Business Analyst
- **Nhiệm vụ chính:** Chuẩn bị nội dung thuyết trình cực sắc bén, ăn điểm phần "Nêu hạn chế & Hướng phát triển".
- **Action items:**
  1. Chuẩn bị kịch bản Demo: Biết chính xác click vào đâu, hỏi câu gì để phô diễn 100% tính năng (Chọn chủ đề -> AI trả lời ngắn -> Click gợi ý -> Hỏi câu ngoài lề -> App hiện cảnh báo).
  2. Viết nội dung giải thích: Chuẩn bị slide/tờ rơi giải thích "Cách ứng dụng AI" (Dùng mô hình Gemini/Ollama, định hướng bằng System Prompt khắt khe, kết hợp cơ chế kiểm soát hallucination qua phân tích mức độ rủi ro).
  3. Lên danh sách hạn chế & tương lai:
     - *Hạn chế:* Đưa hết tri thức vào prompt dài (Context window) không tối ưu nếu data lớn, có thể gây nhiễu; Phụ thuộc tốc độ phản hồi của API ngoài.
     - *Hướng phát triển:* Nâng cấp lên RAG (Retrieval-Augmented Generation) thực thụ với Vector Database (như Chroma/Milvus) để truy xuất dữ liệu lớn; Áp dụng luồng "Agentic Workflow" có bước kiểm duyệt câu trả lời độc lập trước khi gửi cho khách.

---

## III. Timeline Hành Động (120 Phút)
- **Phút 0 - 15:** Trưởng nhóm phân công, chốt lại cấu trúc JSON API (`/api/interact`).
- **Phút 15 - 75:** 3 Coder cắm đầu code song song. Data Engineer dọn dẹp file kiến thức. Presenter viết slide.
- **Phút 75 - 90:** Ghép nối Frontend và Backend. Bắn thử API thực tế.
- **Phút 90 - 110:** QA Tester bắt đầu nhập dữ liệu phá app. Coders fix bug (Đặc biệt phần "nguy cơ" và "gợi ý").
- **Phút 110 - 120:** Đóng băng code. Chạy thử demo flow 3 lần với Presenter để đảm bảo hoàn hảo. Chuẩn bị nộp bài.
