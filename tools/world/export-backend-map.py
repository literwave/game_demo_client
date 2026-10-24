"""导出当前已确认的地图快照，不在后端重新生成资源。"""
import argparse
import csv
import hashlib
import io
import json
import runpy
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--output', default='temp/world-map-export', help='项目内导出目录')
args = parser.parse_args()
output = (ROOT / args.output).resolve()
if not output.is_relative_to(ROOT):
    raise SystemExit('导出目录必须位于项目内')
# 数据校验不通过时不写出交付包。
runpy.run_path(str(ROOT / 'tools/tests/fixed-birth-resources-regression.py'), run_name='__main__')
world = json.loads((ROOT / 'assets/resources/world/campaign-map.json').read_text(encoding='utf8'))
landscape = json.loads((ROOT / 'assets/resources/world/original-landscape.json').read_text(encoding='utf8'))
fixed = json.loads((ROOT / 'tools/world/fixed-birth-resources.json').read_text(encoding='utf8'))
reserved = set()
for city in world['cities']:
    radius = 3 if city['level'] >= 8 else 2 if city['level'] >= 5 else 1
    for y in range(city['y'] - radius, city['y'] + radius + 1):
        for x in range(city['x'] - radius, city['x'] + radius + 1):
            reserved.add(y * 1000 + x)
terrain = dict(width=1000, height=1000,
               blockedCells=sorted(set(landscape['riverCells']) | set(landscape['mountainCells'])),
               riverCells=landscape['riverCells'], mountainCells=landscape['mountainCells'],
               reservedCityCells=sorted(reserved))
encode = lambda value: json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode('utf8')
files = {
    'mapRes_0.json': (ROOT / 'assets/resources/config/mapRes_0.json').read_bytes(),
    'campaign-map.json': (ROOT / 'assets/resources/world/campaign-map.json').read_bytes(),
    'terrain.json': encode(terrain),
    'fixed-birth-resources.json': (ROOT / 'tools/world/fixed-birth-resources.json').read_bytes(),
}
table = io.StringIO(newline='')
writer = csv.writer(table)
writer.writerow(['id', 'region', 'regionName', 'x', 'y', 'cellId', 'type', 'level', 'group'])
for point in fixed['points']:
    writer.writerow([point['id'], point['region'], world['regions'][point['region']]['name'],
                     point['x'], point['y'], point['y'] * 1000 + point['x'], point['type'], point['level'], point['group']])
files['fixed-birth-resources.csv'] = table.getvalue().encode('utf-8-sig')
files['README.txt'] = '''地图快照接入说明
1. 坐标从0到999，cellId = y * 1000 + x，资源表list按cellId索引。
2. 出生州所有4/5/6级地已逐点固定，最终mapRes_0.json为权威快照，不可重新随机生成。
3. 类型52木、53铁、54石、55粮、50关隘/要塞、51城市。
4. 类型0不能一律当作阻挡：emptyCells是可通行空地，terrain.blockedCells是山河阻挡，reservedCityCells为城市占地。
5. campaign-map包含州域、关口连接、城市和建议出生区。出生点需按容量分配玩家并保持间距。
6. 旧200格存档要按(x,y)重新计算ID；服务端自行实施战斗、关隘通行、空地占领与奖励规则。
7. manifest.json包含每份文件的SHA256与地图版本标识，前后端应记录并校验同一版本。
'''.encode('utf8')
checksums = {name: hashlib.sha256(content).hexdigest() for name, content in sorted(files.items())}
revision = hashlib.sha256(encode(checksums)).hexdigest()
manifest = dict(schemaVersion=1, mapRevision=revision, width=1000, height=1000,
                cellIdFormula='y * 1000 + x', fixedBirthResourceCount=len(fixed['points']),
                fixedBirthLevels=[4, 5, 6], files=checksums)
files['manifest.json'] = encode(manifest)
output.mkdir(parents=True, exist_ok=True)
package = output / 'world-map-backend.zip'
with zipfile.ZipFile(package, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name, content in files.items():
        archive.writestr(name, content)
with zipfile.ZipFile(package) as archive:
    assert archive.testzip() is None
    for name, checksum in checksums.items():
        assert hashlib.sha256(archive.read(name)).hexdigest() == checksum
    assert archive.read('mapRes_0.json') == (ROOT / 'assets/resources/config/mapRes_0.json').read_bytes()
print(json.dumps({'exported': str(package.relative_to(ROOT)), 'files': len(files), 'fixedPoints': len(fixed['points']), 'sha256Verified': True}))
