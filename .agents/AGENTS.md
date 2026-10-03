# Workspace Rules cho Dự án Già Làng

Dưới đây là các quy tắc cốt lõi khi tham gia phát triển dự án này:

## 1. Quy trình làm việc với Git
- **Kiểm tra trước khi code:** Hãy luôn luôn kiểm tra git branch trước. Nếu có thay đổi mới, hãy tiến hành pull/rebase cập nhật và hoà hợp an toàn với dự án hiện tại rồi mới thực hiện công việc.
- **Push sau khi code:** Sau khi đã hoàn tất công việc, luôn luôn push commit lên github mới nhất, không cần xin phép hay hỏi lại.

## 2. Giao diện Chatbox (UI/UX)
- **Thiết kế Widget Twitch:** Khung chat (Chatbox) mang hơi hướng widget của Twitch (hollow bubbles, connector lines).
- **Bố cục (Layout):** Tin nhắn của Khách (người dùng) phải luôn được neo/căn lề ở bên phải màn hình. Tin nhắn của Già Làng (AI) được neo ở bên trái màn hình.
- **Màu sắc (Colors):** Phải sử dụng bộ màu đồng bộ với website: Nền tối (như `#0d1117`, `#161b22`) và các viền/text mang sắc vàng đồng (như `#d4af37`, `rgba(230, 197, 92, x)`). Tuyệt đối không dùng các màu lệch tông như cam đào, nâu đỏ.

## 3. Hành vi của Bot (Già Làng AI)
- **Độ dài câu trả lời:** Câu trả lời của AI phải được giới hạn TỐI ĐA 4 CÂU.
- **Văn phong:** Phải luôn ngắn gọn, súc tích, tránh dài dòng hay kể lể lê thê, đi thẳng vào trọng tâm hoặc lồng ghép tinh tế.
