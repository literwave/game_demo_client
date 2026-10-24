"""对真实地图统计等级、分区和新手窗口，输出可复核报告。"""
import collections
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
data = json.loads((ROOT / 'assets/resources/config/mapRes_0.json').read_text(encoding='utf8'))
regions = [collections.Counter() for _ in range(3)]
sample = collections.Counter()
for i, (kind, level) in enumerate(data['list']):
    if not 52 <= kind <= 55:
        continue
    x, y = i % data['w'], i // data['w']
    radius = math.hypot(x - 499.5, y - 499.5)
    regions[0 if radius >= 285 else 1 if radius >= 100 else 2][level] += 1
    if max(abs(x - 19), abs(y - 27)) <= 12:
        sample[level] += 1
report = {'regions': [dict(sorted(c.items())) for c in regions], 'near_19_27_radius12': dict(sorted(sample.items()))}
config = json.loads((ROOT / 'assets/resources/world/campaign-map.json').read_text(encoding='utf8'))
spawn_counts = collections.Counter()
for spawn in config['spawnZones']:
    spawn_counts[spawn['region']] += 1
    nearby = collections.defaultdict(collections.Counter)
    for dy in range(-24, 25):
        for dx in range(-24, 25):
            kind, level = data['list'][(spawn['y'] + dy) * data['w'] + spawn['x'] + dx]
            if 52 <= kind <= 55:
                distance = max(abs(dx), abs(dy))
                for radius in (5, 12, 24):
                    if distance <= radius:
                        nearby[radius][level] += 1
    assert set(nearby[5]) <= {1, 2}, spawn
    assert nearby[5][1] >= 8 and nearby[5][2] >= 8, spawn
    assert nearby[12][3] >= 12 and not any(level >= 5 for level in nearby[12]), spawn
    assert nearby[24][4] >= 8, spawn
    kinds = {data['list'][(spawn['y'] + dy) * data['w'] + spawn['x'] + dx][0]
             for dy in range(-5, 6) for dx in range(-5, 6)}
    assert {52, 53, 54, 55} <= kinds, spawn
assert len(spawn_counts) == 6
assert (regions[0][5] + regions[0][6]) / sum(regions[0].values()) < .06
assert regions[0][6] / sum(regions[0].values()) < .005
assert regions[1][8] / sum(regions[1].values()) < .03
assert regions[2][9] / sum(regions[2].values()) < .06
means = [sum(level * count for level, count in c.items()) / sum(c.values()) for c in regions]
assert means[0] < means[1] < means[2]
report['mean_levels'] = means
report['recommended_spawn_zones'] = dict(sorted(spawn_counts.items()))
report['spawn_progression_checks'] = 'PASS'
(ROOT / 'temp/resource-progression-audit.json').write_text(json.dumps(report, indent=2), encoding='utf8')
print(json.dumps(report))
