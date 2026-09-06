import json

with open('frontend/assets/vietnam_34_provinces.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total features: {len(data['features'])}")
sorted_feats = sorted(data['features'], key=lambda x: x['properties'].get('stt_bang', 999))
for f in sorted_feats:
    p = f['properties']
    print(f"{p.get('stt_bang')}. {p.get('don_vi_moi')} | Gồm: {p.get('cac_don_vi_sap_nhap')} | TT: {p.get('trung_tam_hanh_chinh')} | Giữ nguyên: {p.get('is_giu_nguyen')}")
