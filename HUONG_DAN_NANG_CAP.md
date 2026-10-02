# 📜 HƯỚNG DẪN NÂNG CẤP & MỞ RỘNG MÃ NGUỒN (GIÀ LÀNG SỐ)

Tài liệu này cung cấp hướng dẫn kỹ thuật chi tiết dành cho lập trình viên để duy trì, tối ưu hóa và mở rộng các phân hệ trong dự án **Già Làng Số (AI Story-selling E-commerce)**.

---

## 📑 MỤC LỤC
1. [Tổng Quan Kiến Trúc Dự Án](#1-tổng-quan-kiến-trúc-dự-án)
2. [Nâng Cấp Phân Hệ Trí Tuệ Nhân Tạo (AI Gateway)](#2-nâng-cấp-phân-hệ-trí-tuệ-nhân-tạo-ai-gateway)
3. [Nâng Cấp Bản Đồ Di Sản & Kho Tích Xưa 34 Tỉnh Thành](#3-nâng-cấp-bản-đồ-di-sản--kho-tích-xưa-34-tỉnh-thành)
4. [Nâng Cấp Khu Thương Mại & Quản Lý Sản Phẩm](#4-nâng-cấp-khu-thương-mại--quản-lý-sản-phẩm)
5. [Tối Ưu Giao Diện, Typography & Hiệu Ứng](#5-tối-ưu-giao-diện-typography--hiệu-ứng)
6. [Quy Trình Kiểm Thử & Chuẩn Hóa Mã Nguồn](#6-quy-trình-kiểm-thử--chuẩn-hóa-mã-nguồn)
7. [Triển Khai Môi Trường Thực Tế (Production Deployment)](#7-triển-khai-môi-trường-thực-tế-production-deployment)

---

## 1. TỔNG QUAN KIẾN TRÚC DỰ ÁN

```text
gia_lang/
├── backend/
│   ├── config.py                 # Nạp biến môi trường (.env, API keys)
│   ├── main.py                   # FastAPI server, AI Gateway (Gemini & Ollama), routing
│   ├── data/
│   │   └── kien_thuc.txt         # Tri thức nền tảng buôn làng cho AI RAG
│   └── setup/
│       └── Modelfile             # Cấu hình Local AI model cho Ollama
├── frontend/
│   ├── assets/
│   │   ├── css/style.css         # Toàn bộ CSS phong cách Dark Luxury & Glassmorphism
│   │   ├── js/app.js             # Logic Scrollytelling, Cart, Map, AI Chat, Decryption
│   │   ├── images/               # Kho ảnh sản phẩm & di sản thực tế (100% authentic)
│   │   └── vietnam_34_provinces.geojson # Dữ liệu vector bản đồ 34 tỉnh mới
│   └── templates/
│       ├── base.html             # Khung nền, Header/Footer, Modal mua hàng, Modal Tích Xưa
│       ├── home.html             # Trang chủ, Bản đồ tương tác toàn màn hình, Campfire
│       ├── products.html         # Danh mục mua sắm chi tiết
│       └── heritage.html         # Không gian di sản văn hóa
├── README.md                     # Hướng dẫn cài đặt nhanh
└── HUONG_DAN_NANG_CAP.md         # Tài liệu này
```

---

## 2. NÂNG CẤP PHÂN HỆ TRÍ TUỆ NHÂN TẠO (AI GATEWAY)

### 2.1. Cập nhật Model Gemini thế hệ mới
Trong file `backend/main.py`, danh sách `candidate_models` được sắp xếp theo thứ tự ưu tiên:
```python
class GiaLangChatbot:
    def __init__(self):
        # Ưu tiên các model tốc độ cao, độ trễ thấp
        self.candidate_models = [
            'gemini-3.5-flash-lite', 
            'gemini-3.8-flash', 
            'gemini-3.5-flash',
            'gemini-2.5-flash'
        ]
```
> **Mẹo nâng cấp:** Khi Google phát hành phiên bản mới hơn (ví dụ `gemini-4.0-flash`), chỉ cần bổ sung tên model vào đầu mảng `self.candidate_models`. Hệ thống sẽ tự động handshake khi khởi động tại hàm `warmup_gemini_sync()`.

### 2.2. Bổ sung Công cụ (Function / Tool Calling) cho Già Làng
Để Già Làng có thể thực hiện thêm tác vụ (ví dụ: tạo voucher giảm giá, tra cứu đơn hàng, phát nhạc theo yêu cầu):
1. Khai báo hàm Python có đầy đủ docstring mô tả chi tiết:
```python
def tao_ma_giam_gia(phan_tram: int = 10) -> str:
    """Tạo mã giảm giá độc quyền từ Già Làng tặng cho khách ngoan."""
    ma = f"GIALANG{phan_tram}"
    return json.dumps({"status": "success", "voucher_code": ma, "discount": phan_tram})
```
2. Thêm hàm vào danh sách `tools`:
```python
tools = [add_to_cart, highlight_product, play_sound, tao_ma_giam_gia]
```
3. Xử lý trả về trong nhánh `if response.function_calls:` và frontend [app.js](file:///c:/Users/hocsinh/Downloads/gia_lang-main%20%282%29/gia_lang-main%20%283%29/gia_lang-main/frontend/assets/js/app.js).

### 2.3. Cập nhật Tri thức buôn làng & Prompt
- Chỉnh sửa trực tiếp file [backend/data/kien_thuc.txt](file:///c:/Users/hocsinh/Downloads/gia_lang-main%20%282%29/gia_lang-main%20%283%29/gia_lang-main/backend/data/kien_thuc.txt) để bổ sung thêm truyền thuyết, thông tin địa danh, sản vật mới.
- Điều chỉnh `system_instruction` trong `backend/main.py` nếu muốn thay đổi văn phong hoặc bổ sung quy tắc tương tác.

---

## 3. NÂNG CẤP BẢN ĐỒ DI SẢN & KHO TÍCH XƯA 34 TỈNH THÀNH

### 3.1. Cập nhật Dữ liệu Ranh giới Bản đồ
Tệp [frontend/assets/vietnam_34_provinces.geojson](file:///c:/Users/hocsinh/Downloads/gia_lang-main%20%282%29/gia_lang-main%20%283%29/gia_lang-main/frontend/assets/vietnam_34_provinces.geojson) chứa toàn bộ 34 polygon tỉnh thành sáp nhập mới.
Mỗi feature bao gồm các thuộc tính sau:
```json
{
  "stt_bang": 11,
  "don_vi_moi": "Gia Lai",
  "cac_don_vi_sap_nhap": "Gia Lai + Bình Định",
  "trung_tam_hanh_chinh": "Bình Định",
  "is_giu_nguyen": false,
  "dtich_km2": 21576.56,
  "dan_so": 3583691,
  "center_lat": 13.9833,
  "center_lng": 108.0
}
```
> Khi có thay đổi về địa giới hành chính, chỉ cần chỉnh sửa các thuộc tính `cac_don_vi_sap_nhap`, `trung_tam_hanh_chinh` hoặc tọa độ `coordinates` tương ứng trong file GeoJSON.

### 3.2. Bổ sung Tích Xưa cho các Tỉnh Thành Mới
Mở tệp [frontend/assets/js/app.js](file:///c:/Users/hocsinh/Downloads/gia_lang-main%20%282%29/gia_lang-main%20%283%29/gia_lang-main/frontend/assets/js/app.js) và tìm đối tượng `PROVINCE_STORIES_DB`. Thêm mục mới theo cấu trúc chuẩn:
```javascript
'tên_tỉnh_viết_thường': {
    title: 'Tiêu đề cổ tích hào sảng, thơ mộng',
    paragraphs: [
        'Đoạn văn thứ nhất...',
        'Đoạn văn thứ hai về tích xưa và ẩm thực tiến vua...',
        'Đoạn văn kết bài ca ngợi nghĩa tình non nước...'
    ],
    heritageTitle: 'Bảo vật & Sản vật đất trời:',
    heritageDesc: 'Tên các đặc sản, di sản văn hóa phi vật thể nổi bật.'
}
```

### 3.3. Tinh chỉnh Hiệu ứng Mờ Nhòe & Dịch Cổ Ngữ
- **Độ mờ nhòe & ánh sáng nền:** Chỉnh sửa lớp `.elder-story-overlay` và `body.story-dimmed` trong [frontend/assets/css/style.css](file:///c:/Users/hocsinh/Downloads/gia_lang-main%20%282%29/gia_lang-main%20%283%29/gia_lang-main/frontend/assets/css/style.css):
  - `backdrop-filter: blur(14px) brightness(0.72);`
  - `background: rgba(10, 8, 6, 0.46);`
- **Bộ ký tự Cổ ngữ (*Runes*):** Trong `app.js`, bạn có thể bổ sung các ký tự chữ cổ Chăm, Phạn, Đông Sơn hoặc phù hiệu huyền bí vào mảng `ANCIENT_RUNES`.

---

## 4. NÂNG CẤP KHU THƯƠNG MẠI & QUẢN LÝ SẢN PHẨM

### 4.1. Thêm Sản Phẩm Mới vào Cửa Hàng
Tất cả dữ liệu sản phẩm phục vụ Modal Mua Hàng chi tiết được định nghĩa tại `PRODUCTS_DB` trong [frontend/assets/js/app.js](file:///c:/Users/hocsinh/Downloads/gia_lang-main%20%282%29/gia_lang-main%20%283%29/gia_lang-main/frontend/assets/js/app.js):
```javascript
ten_san_pham_id: {
    id: 'ten_san_pham_id',
    shortName: 'Tên Ngắn',
    name: 'Tên Đầy Đủ Cao Cấp',
    badge: '✦ Huy Hiệu Nổi Bật',
    rating: '5.0',
    reviewCount: '1,2k',
    soldCount: '850',
    originalPrice: 350000,
    discountText: '-15% GIẢM',
    vouchers: ['Giảm 20.000₫', 'Freeship đơn 500k'],
    shipping: 'Vận chuyển hỏa tốc toàn quốc (2 - 3 ngày)',
    shippingSub: 'Miễn phí vận chuyển cho đơn hàng từ 500.000₫',
    guarantee: 'Già Làng Bảo Chứng • 100% Chính gốc',
    variationLabel: 'Phân Loại:',
    stock: 25,
    mainImage: '/assets/images/ten_anh_chinh.jpg',
    gallery: [
        '/assets/images/ten_anh_chinh.jpg',
        '/assets/images/anh_phu_1.jpg'
    ],
    variations: [
        { id: 'var_1', name: 'Loại A Đặc Biệt', price: 295000, img: '/assets/images/ten_anh_chinh.jpg' }
    ]
}
```

### 4.2. Tiêu chuẩn Hình ảnh Sản phẩm
Để đảm bảo tốc độ tải trang nhanh và giao diện thẩm mỹ:
- **Định dạng:** JPG hoặc WebP.
- **Tỷ lệ khuyến nghị:** `1:1` (hình vuông, tối thiểu 600x600px).
- **Dung lượng:** Dưới 300KB mỗi ảnh.
- **Vị trí lưu trữ:** `frontend/assets/images/`.

---

## 5. TỐI ƯU GIAO DIỆN, TYPOGRAPHY & HIỆU ỨNG

### 5.1. Chuẩn Hóa Typography Tiếng Việt
Dự án sử dụng Google Font tiêu chuẩn:
- **`Be Vietnam Pro`**: Phông chữ chính cho toàn bộ nội dung, thẻ sản phẩm, lời kể tích xưa để đảm bảo không bị lỗi khoảng cách dấu trên mọi hệ điều hành.
- **`Playfair Display`**: Dành cho các tiêu đề lớn mang tính trang trọng, cổ điển.
- **`Inter`**: Dành cho các số liệu thống kê, bảng biểu, toolbar.

> **Lưu ý:** Tuyệt đối không khai báo fallback font là `Georgia` cho nội dung tiếng Việt có dấu vì Windows sẽ bị lỗi tách dấu.

### 5.2. Hoạt Ảnh Cuộn Mượt (Smooth Scroll)
Dự án tích hợp đồng thời **GSAP ScrollTrigger** và **Lenis Smooth Scroll**. Khi mở các modal toàn màn hình (như bản đồ hoặc tích xưa), cần tạm dừng Lenis bằng lệnh:
```javascript
if (typeof lenis !== 'undefined' && lenis) {
    lenis.stop(); // Tắt cuộn trang ngầm
}
```
Và khởi động lại khi đóng modal bằng `lenis.start();`.

---

## 6. QUY TRÌNH KIỂM THỬ & CHUẨN HÓA MÃ NGUỒN

Trước khi bàn giao hoặc đẩy mã nguồn lên môi trường kiểm thử/production, lập trình viên nên thực hiện quy trình kiểm tra tự động sau:

### 6.1. Kiểm tra Cú pháp JavaScript
Sử dụng Node.js để kiểm tra tệp `app.js` không có lỗi cú pháp:
```bash
node -c frontend/assets/js/app.js
```
*(Nếu terminal không báo lỗi gì và trả về exit code 0 nghĩa là tệp hợp lệ).*

### 6.2. Kiểm tra Cặp Ngoặc CSS
Đảm bảo không bị thiếu ngoặc nhọn `{}` làm vỡ giao diện:
```bash
python -c "
with open('frontend/assets/css/style.css', 'r', encoding='utf-8') as f:
    c = f.read()
print('Open:', c.count('{'), 'Close:', c.count('}'))
assert c.count('{') == c.count('}'), 'Lỗi lệch cặp ngoặc CSS!'
"
```

### 6.3. Kiểm tra Tính Toàn Vẹn của Tệp Ảnh
Xác nhận tất cả ảnh trong mã nguồn đều có tệp thực tế trên đĩa:
```bash
python -c "
import re, os
with open('frontend/assets/js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()
imgs = set(re.findall(r'/assets/images/([a-zA-Z0-9_\-\.]+)', text))
missing = [i for i in imgs if not os.path.exists(os.path.join('frontend/assets/images', i))]
print('Ảnh thiếu:', missing if missing else '100% đầy đủ')
"
```

### 6.4. Kiểm tra Endpoint Sức Khỏe Máy Chủ
Kiểm tra phản hồi của API:
```bash
python -c "
import urllib.request
print('Status:', urllib.request.urlopen('http://127.0.0.1:8000/api/health').status)
"
```

---

## 7. TRIỂN KHAI MÔI TRƯỜNG THỰC TẾ (PRODUCTION DEPLOYMENT)

### 7.1. Chạy với Gunicorn & Uvicorn Workers
Để phục vụ hàng ngàn người dùng đồng thời trên máy chủ Linux/Ubuntu:
```bash
pip install gunicorn uvicorn
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 7.2. Cấu hình Nginx Reverse Proxy & SSL (HTTPS)
File cấu hình mẫu Nginx `/etc/nginx/sites-available/gialang.conf`:
```nginx
server {
    server_name gialangso.vn www.gialangso.vn;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /assets/ {
        alias /var/www/gia_lang/frontend/assets/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

*Tài liệu được biên soạn và chuẩn hóa toàn diện cho dự án Già Làng Số.*
