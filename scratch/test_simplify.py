import json
import os
from shapely.geometry import shape, mapping
from shapely.validation import make_valid

input_path = "frontend/assets/vietnam_34_provinces.geojson"
with open(input_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for tol in [0.001, 0.002, 0.005]:
    simplified_features = []
    for f in data['features']:
        geom = shape(f['geometry'])
        # simplify
        simp_geom = geom.simplify(tol, preserve_topology=True)
        if not simp_geom.is_valid:
            simp_geom = make_valid(simp_geom)
        simplified_features.append({
            "type": "Feature",
            "properties": f['properties'],
            "geometry": mapping(simp_geom)
        })
    
    out_obj = {
        "type": "FeatureCollection",
        "features": simplified_features
    }
    out_path = f"frontend/assets/vietnam_34_provinces_tol_{tol}.json"
    with open(out_path, "w", encoding="utf-8") as out_f:
        json.dump(out_obj, out_f, ensure_ascii=False)
    
    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"Tolerance {tol}: size = {size_mb:.2f} MB")
