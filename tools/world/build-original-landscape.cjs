// 原创地图视觉布局。仅读取玩法表，绝不修改资源、城池或阻挡坐标。
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/resources/config/mapRes_0.json'), 'utf8'));
if (data.w !== 200 || data.h !== 200) throw new Error('旧美术迁移脚本只适用于200×200旧地图；千里山河请运行 build-campaign-map.py，并通过AssetDB保存暂存TMX。');
const seen = new Set(), groups = [];
for (let i = 0; i < data.list.length; i++) {
    if (data.list[i][0] !== 0 || seen.has(i)) continue;
    const queue = [i]; seen.add(i);
    for (let k = 0; k < queue.length; k++) {
        const x = queue[k] % data.w, y = Math.floor(queue[k] / data.w);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy, id = ny * data.w + nx;
            if (nx < 0 || ny < 0 || nx >= data.w || ny >= data.h || seen.has(id) || data.list[id][0] !== 0) continue;
            seen.add(id); queue.push(id);
        }
    }
    groups.push(queue);
}
groups.sort((a, b) => b.length - a.length || a[0] - b[0]);
// 三条贯通的天然廊道：中部水系、南部水系、东部入海口。
const riverCells = groups.filter((g, i) => i === 0 || i === 2 || i === 5).flat().sort((a, b) => a - b);
const rivers = new Set(riverCells);
const patches = [], occupied = [];
const names = ['ridge', 'foothills', 'peaks', 'valley'];
function hash(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
for (const group of groups) for (const id of group) {
    if (rivers.has(id)) continue;
    const x = id % data.w, y = Math.floor(id / data.w);
    if (occupied.some(p => Math.abs(p.x - x) + Math.abs(p.y - y) < 2.8)) continue;
    occupied.push({ x, y });
    const n = hash(x, y);
    patches.push({ x, y, art: names[Math.floor(n * 4)], width: Math.round(230 + n * 100) });
}
// 边缘装饰向地图外延展，所有合法格子都留在陆地内；不生成新的可交互格子。
function edge(t, phase) { return 4.1 + 2 * Math.sin(t * .22 + phase) + Math.sin(t * .58 + phase * 2) + .5 * Math.sin(t * 1.1 + phase); }
for (let side = 0; side < 4; side++) for (let t = 3; t < Math.max(data.w, data.h) - 3; t += 3) {
    const n = hash(side + 501, t), d = edge(t, side * 1.7) * .55;
    const x = side === 0 ? -d : side === 1 ? data.w - 1 + d : t;
    const y = side === 2 ? -d : side === 3 ? data.h - 1 + d : t;
    patches.push({ x, y, art: n > .45 ? names[Math.floor(n * 4)] : 'forest', width: Math.round(190 + n * 170) });
}
for (const [x, y] of [[-1, -1], [data.w, -1], [data.w, data.h], [-1, data.h]]) {
    patches.push({ x, y, art: 'valley', width: 310 });
    patches.push({ x: x + .8, y: y - .8, art: 'forest', width: 180 });
}
const config = { version: 1, width: data.w, height: data.h, seed: 20261024, riverCells, patches };
fs.writeFileSync(path.join(root, 'assets/resources/world/original-landscape.json'), JSON.stringify(config));
// TMX 保留格子尺寸和两张逻辑掩码。原创地形由连续材质绘制，消除地块拼缝。
const file = path.join(root, 'assets/resources/world/map.tmx');
const tmx = fs.readFileSync(file, 'utf8');
const masks = ['obstruct', 'city_position'].map((name, index) => {
    const match = tmx.match(new RegExp('<layer\\b[^>]*name="' + name + '"[^>]*>[\\s\\S]*?<data encoding="csv">([\\s\\S]*?)</data>\\s*</layer>'));
    if (!match) throw new Error('Missing logical map layer: ' + name);
    const values = match[1].match(/\d+/g).map(n => +n ? 1 : 0);
    return `<layer id="${index + 1}" name="${name}" width="${data.w}" height="${data.h}" visible="0"><data encoding="csv">${values.join(',')}</data></layer>`;
});
fs.writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>\n<map version="1.4" tiledversion="1.4.3" orientation="isometric" renderorder="right-down" width="${data.w}" height="${data.h}" tilewidth="200" tileheight="100" infinite="0" nextlayerid="3" nextobjectid="1">\n<tileset firstgid="1" source="original-ground.tsx"/>\n${masks.join('\n')}\n</map>\n`);
fs.writeFileSync(path.join(root, 'assets/resources/world/original-ground.tsx'), '<?xml version="1.0" encoding="UTF-8"?>\n<tileset version="1.4" name="original-ground" tilewidth="512" tileheight="512" tilecount="1" columns="1"><image source="../ui/world/plains.png" width="512" height="512"/></tileset>\n');
console.log(JSON.stringify({ riverCells: riverCells.length, mountainPatches: occupied.length, borderPatches: patches.length - occupied.length }));
