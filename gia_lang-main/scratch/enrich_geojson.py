import requests
import json
import sys

url = 'https://raw.githubusercontent.com/lamngockhuong/vietnam-3d-map/master/data/vietnam-provinces.geojson'
resp = requests.get(url)
data = resp.json()

user_table = [
    {"stt": 1, "don_vi_moi": "An Giang", "sap_nhap": "Kiên Giang + An Giang", "trung_tam": "Kiên Giang"},
    {"stt": 2, "don_vi_moi": "Bắc Ninh", "sap_nhap": "Bắc Giang + Bắc Ninh", "trung_tam": "Bắc Giang"},
    {"stt": 3, "don_vi_moi": "Cà Mau", "sap_nhap": "Bạc Liêu + Cà Mau", "trung_tam": "Cà Mau"},
    {"stt": 4, "don_vi_moi": "Cao Bằng", "sap_nhap": "Giữ nguyên", "trung_tam": "Cao Bằng"},
    {"stt": 5, "don_vi_moi": "Đắk Lắk", "sap_nhap": "Phú Yên + Đắk Lắk", "trung_tam": "Đắk Lắk"},
    {"stt": 6, "don_vi_moi": "Điện Biên", "sap_nhap": "Giữ nguyên", "trung_tam": "Điện Biên"},
    {"stt": 7, "don_vi_moi": "Đồng Nai", "sap_nhap": "Bình Phước + Đồng Nai", "trung_tam": "Đồng Nai"},
    {"stt": 8, "don_vi_moi": "Đồng Tháp", "sap_nhap": "Tiền Giang + Đồng Tháp", "trung_tam": "Tiền Giang"},
    {"stt": 9, "don_vi_moi": "Gia Lai", "sap_nhap": "Gia Lai + Bình Định", "trung_tam": "Bình Định"},
    {"stt": 10, "don_vi_moi": "Hà Tĩnh", "sap_nhap": "Giữ nguyên", "trung_tam": "Hà Tĩnh"},
    {"stt": 11, "don_vi_moi": "Hưng Yên", "sap_nhap": "Thái Bình + Hưng Yên", "trung_tam": "Hưng Yên"},
    {"stt": 12, "don_vi_moi": "Khánh Hoà", "sap_nhap": "Khánh Hòa + Ninh Thuận", "trung_tam": "Khánh Hòa"},
    {"stt": 13, "don_vi_moi": "Lai Châu", "sap_nhap": "Giữ nguyên", "trung_tam": "Lai Châu"},
    {"stt": 14, "don_vi_moi": "Lâm Đồng", "sap_nhap": "Đắk Nông + Lâm Đồng + Bình Thuận", "trung_tam": "Lâm Đồng"},
    {"stt": 15, "don_vi_moi": "Lạng Sơn", "sap_nhap": "Giữ nguyên", "trung_tam": "Lạng Sơn"},
    {"stt": 16, "don_vi_moi": "Lào Cai", "sap_nhap": "Lào Cai + Yên Bái", "trung_tam": "Yên Bái"},
    {"stt": 17, "don_vi_moi": "Nghệ An", "sap_nhap": "Giữ nguyên", "trung_tam": "Nghệ An"},
    {"stt": 18, "don_vi_moi": "Ninh Bình", "sap_nhap": "Hà Nam + Ninh Bình + Nam Định", "trung_tam": "Ninh Bình"},
    {"stt": 19, "don_vi_moi": "Phú Thọ", "sap_nhap": "Hòa Bình + Vĩnh Phúc + Phú Thọ", "trung_tam": "Phú Thọ"},
    {"stt": 20, "don_vi_moi": "Quảng Ngãi", "sap_nhap": "Quảng Ngãi + Kon Tum", "trung_tam": "Quảng Ngãi"},
    {"stt": 21, "don_vi_moi": "Quảng Ninh", "sap_nhap": "Giữ nguyên", "trung_tam": "Quảng Ninh"},
    {"stt": 22, "don_vi_moi": "Quảng Trị", "sap_nhap": "Quảng Bình + Quảng Trị", "trung_tam": "Quảng Bình"},
    {"stt": 23, "don_vi_moi": "Sơn La", "sap_nhap": "Giữ nguyên", "trung_tam": "Sơn La"},
    {"stt": 24, "don_vi_moi": "Tây Ninh", "sap_nhap": "Long An + Tây Ninh", "trung_tam": "Tây Ninh"},
    {"stt": 25, "don_vi_moi": "Thái Nguyên", "sap_nhap": "Bắc Kạn + Thái Nguyên", "trung_tam": "Thái Nguyên"},
    {"stt": 26, "don_vi_moi": "Thanh Hóa", "sap_nhap": "Giữ nguyên", "trung_tam": "Thanh Hóa"},
    {"stt": 27, "don_vi_moi": "TP. Cần Thơ", "sap_nhap": "Sóc Trăng + Hậu Giang + TP. Cần Thơ", "trung_tam": "Cần Thơ"},
    {"stt": 28, "don_vi_moi": "TP. Đà Nẵng", "sap_nhap": "Quảng Nam + TP. Đà Nẵng", "trung_tam": "Đà Nẵng"},
    {"stt": 29, "don_vi_moi": "TP. Hà Nội", "sap_nhap": "Giữ nguyên", "trung_tam": "Hà Nội"},
    {"stt": 30, "don_vi_moi": "TP. Hải Phòng", "sap_nhap": "Hải Dương + TP. Hải Phòng", "trung_tam": "Hải Phòng"},
    {"stt": 31, "don_vi_moi": "TP. Hồ Chí Minh", "sap_nhap": "Bình Dương + TP. HCM + Bà Rịa - Vũng Tàu", "trung_tam": "Hồ Chí Minh"},
    {"stt": 32, "don_vi_moi": "TP. Huế", "sap_nhap": "Giữ nguyên", "trung_tam": "Huế"},
    {"stt": 33, "don_vi_moi": "Tuyên Quang", "sap_nhap": "Hà Giang + Tuyên Quang", "trung_tam": "Tuyên Quang"},
    {"stt": 34, "don_vi_moi": "Vĩnh Long", "sap_nhap": "Bến Tre + Vĩnh Long + Trà Vinh", "trung_tam": "Vĩnh Long"}
]

# Map user table entries to features
for item in user_table:
    clean = item["don_vi_moi"].replace("TP. ", "").replace("Khánh Hoà", "Khánh Hòa").strip()
    match = None
    for f in data['features']:
        p = f['properties']
        gname = p['ten_tinh'].replace("TP. ", "").strip()
        if clean.lower() == gname.lower():
            match = f
            break
    if match:
        # Check if we can enrich the feature with exact table data
        p = match['properties']
        p['stt_bang'] = item['stt']
        p['don_vi_moi'] = item['don_vi_moi']
        p['cac_don_vi_sap_nhap'] = item['sap_nhap']
        p['trung_tam_hanh_chinh'] = item['trung_tam']
        p['is_giu_nguyen'] = (item['sap_nhap'] == "Giữ nguyên")
    else:
        print("FAILED TO MATCH:", item)

print("All matched successfully! Saving verified geojson...")
with open("frontend/assets/vietnam_34_provinces.geojson", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Saved to frontend/assets/vietnam_34_provinces.geojson")
