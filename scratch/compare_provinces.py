import requests
import json

url = 'https://raw.githubusercontent.com/lamngockhuong/vietnam-3d-map/master/data/vietnam-provinces.geojson'
resp = requests.get(url)
data = resp.json()

user_table = [
    (1, "An Giang", "Kiên Giang + An Giang", "Kiên Giang"),
    (2, "Bắc Ninh", "Bắc Giang + Bắc Ninh", "Bắc Giang"),
    (3, "Cà Mau", "Bạc Liêu + Cà Mau", "Cà Mau"),
    (4, "Cao Bằng", "Giữ nguyên", "Cao Bằng"),
    (5, "Đắk Lắk", "Phú Yên + Đắk Lắk", "Đắk Lắk"),
    (6, "Điện Biên", "Giữ nguyên", "Điện Biên"),
    (7, "Đồng Nai", "Bình Phước + Đồng Nai", "Đồng Nai"),
    (8, "Đồng Tháp", "Tiền Giang + Đồng Tháp", "Tiền Giang"),
    (9, "Gia Lai", "Gia Lai + Bình Định", "Bình Định"),
    (10, "Hà Tĩnh", "Giữ nguyên", "Hà Tĩnh"),
    (11, "Hưng Yên", "Thái Bình + Hưng Yên", "Hưng Yên"),
    (12, "Khánh Hoà", "Khánh Hòa + Ninh Thuận", "Khánh Hòa"),
    (13, "Lai Châu", "Giữ nguyên", "Lai Châu"),
    (14, "Lâm Đồng", "Đắk Nông + Lâm Đồng + Bình Thuận", "Lâm Đồng"),
    (15, "Lạng Sơn", "Giữ nguyên", "Lạng Sơn"),
    (16, "Lào Cai", "Lào Cai + Yên Bái", "Yên Bái"),
    (17, "Nghệ An", "Giữ nguyên", "Nghệ An"),
    (18, "Ninh Bình", "Hà Nam + Ninh Bình + Nam Định", "Ninh Bình"),
    (19, "Phú Thọ", "Hòa Bình + Vĩnh Phúc + Phú Thọ", "Phú Thọ"),
    (20, "Quảng Ngãi", "Quảng Ngãi + Kon Tum", "Quảng Ngãi"),
    (21, "Quảng Ninh", "Giữ nguyên", "Quảng Ninh"),
    (22, "Quảng Trị", "Quảng Bình + Quảng Trị", "Quảng Bình"),
    (23, "Sơn La", "Giữ nguyên", "Sơn La"),
    (24, "Tây Ninh", "Long An + Tây Ninh", "Tây Ninh"),
    (25, "Thái Nguyên", "Bắc Kạn + Thái Nguyên", "Thái Nguyên"),
    (26, "Thanh Hóa", "Giữ nguyên", "Thanh Hóa"),
    (27, "TP. Cần Thơ", "Sóc Trăng + Hậu Giang + TP. Cần Thơ", "Cần Thơ"),
    (28, "TP. Đà Nẵng", "Quảng Nam + TP. Đà Nẵng", "Đà Nẵng"),
    (29, "TP. Hà Nội", "Giữ nguyên", "Hà Nội"),
    (30, "TP. Hải Phòng", "Hải Dương + TP. Hải Phòng", "Hải Phòng"),
    (31, "TP. Hồ Chí Minh", "Bình Dương + TP. HCM + Bà Rịa - Vũng Tàu", "Hồ Chí Minh"),
    (32, "TP. Huế", "Giữ nguyên", "Huế"),
    (33, "Tuyên Quang", "Hà Giang + Tuyên Quang", "Tuyên Quang"),
    (34, "Vĩnh Long", "Bến Tre + Vĩnh Long + Trà Vinh", "Vĩnh Long")
]

geo_provinces = {}
for f in data['features']:
    p = f['properties']
    name = p['ten_tinh'].strip()
    geo_provinces[name] = p

print("Total in GeoJSON:", len(geo_provinces))
print("-" * 50)
matched = 0
for stt, name, merge, center in user_table:
    # check match
    clean_name = name.replace("TP. ", "").strip()
    found = False
    for gname in geo_provinces:
        if clean_name.lower() in gname.lower() or gname.lower() in clean_name.lower():
            found = True
            matched += 1
            print(f"MATCH: [{stt}] {name} <-> {gname}")
            break
    if not found:
        print(f"MISSING: [{stt}] {name}")

print("-" * 50)
print(f"Matched: {matched}/{len(user_table)}")
