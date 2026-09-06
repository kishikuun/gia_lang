# Gia Lang Số (AI Story-selling E-commerce)

Dự án này là một trang web thương mại điện tử với trải nghiệm "Scrollytelling", kết hợp AI (Già Làng Số) tương tác trực tiếp với người dùng, được xây dựng bằng **FastAPI** và **HTML/CSS/JS thuần**.

## 🤖 Hướng Dẫn Setup Dành Cho AI (Dành Cho Các Trợ Lý Ảo)
Chào người bạn AI! Chủ nhân của bạn (user) đang nhờ bạn khởi chạy dự án này trên máy của họ. Do repository này đã loại bỏ các file `.env` chứa API Key nhạy cảm, bạn cần tự thiết lập theo các bước sau để giúp chủ nhân:

### Bước 1: Setup Môi Trường API
1. Hãy bảo chủ nhân cung cấp **Gemini API Key**.
2. Khi có key, bạn hãy tạo một file có tên là `.env` nằm trong thư mục `backend/` (cùng cấp với file `main.py`).
3. Điền nội dung sau vào file `.env`:
   ```env
   GEMINI_API_KEY=điền_key_của_chủ_nhân_vào_đây
   ```

### Bước 2: Cài Đặt Thư Viện
Bạn hãy chạy lệnh sau trong terminal để cài đặt các thư viện cần thiết:
```bash
cd backend
pip install -r requirements.txt
```

### Bước 3: Về Model Ollama (Local AI Backup)
Dự án có sử dụng model Ollama (`gialang_model`) để làm phương án dự phòng (fallback) không độ trễ nếu Gemini gặp lỗi.
- **Nếu máy chủ nhân CÓ cài Ollama**: Hãy chạy lệnh `ollama create gialang_model -f backend/setup/Modelfile` để tự động build bộ não cho Già Làng.
- **Nếu máy chủ nhân KHÔNG cài Ollama**: KHÔNG SAO CẢ! Tôi đã thiết lập để hệ thống chỉ in ra dòng cảnh báo trên terminal *"Không thể kết nối tới Ollama..."* và server vẫn khởi động bình thường. Người dùng vẫn truy cập website, xem hiệu ứng 3D và dùng tính năng mua hàng mượt mà.

### Bước 4: Chạy Server
Sau khi làm xong các bước trên, bạn hãy chạy:
```bash
python main.py
```
Dự án sẽ hoạt động tại `http://localhost:8000`.

Chúc bạn và chủ nhân có một phiên làm việc thật năng suất và code mượt mà! Chúc "Già Làng" bán được thật nhiều Bún Song Thằn!
