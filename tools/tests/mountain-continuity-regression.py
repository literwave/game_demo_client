"""用真实PNG透明轮廓检查所有非关口山脊连接段，并检查关门可见/可点。"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('coverage', ROOT / 'tools/world/mountain_layout.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
world = json.loads((ROOT / 'assets/resources/world/campaign-map.json').read_text(encoding='utf8'))
landscape = json.loads((ROOT / 'assets/resources/world/original-landscape.json').read_text(encoding='utf8'))
data = json.loads((ROOT / 'assets/resources/config/mapRes_0.json').read_text(encoding='utf8'))
cover = module.Coverage()
mountains = set(landscape['mountainCells'])
blocked = mountains | set(landscape['riverCells'])
for p in landscape['patches']:
    assert p['y'] * 1000 + p['x'] in mountains
    cover.add(p)
missing = []
sample_count = 0
for idx in sorted(mountains):
    x, y = idx % 1000, idx // 1000
    for sx, sy in module.samples(x, y, mountains):
        if any(max(abs(sx - g['x']), abs(sy - g['y'])) <= 5 for g in world['gates']):
            continue
        sample_count += 1
        if not cover.covered(sx, sy):
            missing.append((sx, sy))
for g in world['gates']:
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            x, y = g['x'] + dx, g['y'] + dy
            if y * 1000 + x in blocked:
                continue
            px, py = module.pixel(x, y)
            for p in cover.buckets[px // 256, py // 256]:
                assert cover.alpha_at(p, px, py) < 64 and not cover.ellipse_at(p, px, py), ('gate obscured', g['name'], p)
report = dict(samples=sample_count, uncovered=len(missing), firstGaps=missing[:8], gatesClear=18, patches=len(landscape['patches']))
report_path = ROOT / 'temp/map-dispersion-review/mountain-coverage.json'
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(json.dumps(report), encoding='utf8')
print(json.dumps(report))
assert not missing, '山脊轮廓仍有未衔接位置'
