"""按原始PNG的不透明轮廓连接山脊；只编排位置，不修改美术图片。"""
import collections
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read_alpha(name):
    png = (ROOT / 'assets/resources/ui/world' / (name + '.png')).read_bytes()
    width, height, depth, color, _, _, interlace = struct.unpack('>IIBBBBB', png[16:29])
    assert depth == 8 and color == 6 and interlace == 0, name
    compressed = bytearray()
    offset = 8
    while offset < len(png):
        length = struct.unpack('>I', png[offset:offset + 4])[0]
        if png[offset + 4:offset + 8] == b'IDAT':
            compressed.extend(png[offset + 8:offset + 8 + length])
        offset += length + 12
    raw = zlib.decompress(compressed)
    stride = width * 4
    prev = bytearray(stride)
    alpha = bytearray(width * height)
    for y in range(height):
        offset = y * (stride + 1)
        mode = raw[offset]
        row = bytearray(raw[offset + 1:offset + 1 + stride])
        for i in range(stride):
            left, up, corner = row[i - 4] if i >= 4 else 0, prev[i], prev[i - 4] if i >= 4 else 0
            if mode == 1:
                predictor = left
            elif mode == 2:
                predictor = up
            elif mode == 3:
                predictor = (left + up) // 2
            elif mode == 4:
                p = left + up - corner
                distances = (abs(p - left), abs(p - up), abs(p - corner))
                predictor = (left, up, corner)[distances.index(min(distances))]
            else:
                assert mode == 0
                predictor = 0
            row[i] = (row[i] + predictor) & 255
        alpha[y * width:(y + 1) * width] = row[3::4]
        prev = row
    return width, height, alpha


def pixel(x, y):
    return (x - y) * 100, (999 - x - y) * 50


class Coverage:
    def __init__(self):
        self.frames = {name: read_alpha(name) for name in ('valley', 'foothills', 'ridge')}
        self.buckets = collections.defaultdict(list)

    def alpha_at(self, patch, px, py):
        width, height, alpha = self.frames[patch['art']]
        x, y = pixel(patch['x'], patch['y'])
        h = patch['width'] * height / width * patch.get('heightScale', 1)
        u = (px - x) / patch['width'] + .5
        if patch.get('flipX'):
            u = 1 - u
        v = 1 - patch.get('anchorY', .22) - (py - y) / h
        if not 0 <= u < 1 or not 0 <= v < 1:
            return 0
        return alpha[int(v * height) * width + int(u * width)]

    def ellipse_at(self, patch, px, py):
        width, height, _ = self.frames[patch['art']]
        x, y = pixel(patch['x'], patch['y'])
        h = patch['width'] * height / width * patch.get('heightScale', 1)
        dx = (px - x) / (patch['width'] * .39)
        dy = (py - y - (.5 - patch.get('anchorY', .22)) * h) / (h * .39)
        return dx * dx + dy * dy <= 1

    def add(self, patch):
        width, height, _ = self.frames[patch['art']]
        x, y = pixel(patch['x'], patch['y'])
        h = patch['width'] * height / width * patch.get('heightScale', 1)
        ay = patch.get('anchorY', .22)
        for by in range(math.floor((y - ay * h) / 256), math.floor((y + (1 - ay) * h) / 256) + 1):
            for bx in range(math.floor((x - patch['width'] / 2) / 256), math.floor((x + patch['width'] / 2) / 256) + 1):
                self.buckets[bx, by].append(patch)

    def covered(self, x, y):
        px, py = pixel(x, y)
        return any(self.alpha_at(p, px, py) >= 160 for p in self.buckets[math.floor(px / 256), math.floor(py / 256)])


def samples(x, y, mountains):
    yield x, y
    for dx, dy in ((1, 0), (0, 1), (1, 1), (1, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < 1000 and 0 <= ny < 1000 and ny * 1000 + nx in mountains:
            for step in (.25, .5, .75):
                yield x + dx * step, y + dy * step


def build_mountain_patches(mountains, gates, blocked, noise):
    cover = Coverage()
    protected = [pixel(g['x'] + dx, g['y'] + dy) for g in gates
                 for dy in (-1, 0, 1) for dx in (-1, 0, 1)
                 if not blocked[(g['y'] + dy) * 1000 + g['x'] + dx]]
    patches = []
    near_gate = lambda x, y: any(max(abs(x - g['x']), abs(y - g['y'])) <= 4 for g in gates)

    def clear_pass(p):
        px, py = pixel(p['x'], p['y'])
        return all(not cover.ellipse_at(p, x, y) and cover.alpha_at(p, x, y) < 64
                   for x, y in protected if abs(px - x) < 600 and abs(py - y) < 600)

    for idx in sorted(mountains):
        x, y = idx % 1000, idx // 1000
        if all(cover.covered(sx, sy) for sx, sy in samples(x, y, mountains)):
            continue
        h = noise(x // 16, y // 16)
        gate_distance = min(max(abs(x - g['x']), abs(y - g['y'])) for g in gates)
        apron = gate_distance <= 4
        patch = dict(x=x, y=y, art='valley', width=140 + gate_distance * 65 if apron else 620 + noise(x, y) % 70,
                     heightScale=.8 if apron else .48 + (h % 10) / 100,
                     anchorY=.48, role='base', flipX=bool(noise(x // 4, y // 4) % 2))
        if clear_pass(patch):
            patches.append(patch)
            cover.add(patch)

    # 高低起伏沿同一条底脊展开；一段范围仅放一个主峰，不把所有格子都堆成尖峰。
    peaks = {}
    for idx in sorted(mountains):
        x, y = idx % 1000, idx // 1000
        px, py = pixel(x, y)
        key = math.floor(px / 760), math.floor(py / 400)
        if key not in peaks or noise(x, y) < noise(peaks[key][0], peaks[key][1]):
            peaks[key] = (x, y)
    for x, y in peaks.values():
        h = noise(x, y)
        apron = near_gate(x, y)
        patch = dict(x=x, y=y, art='foothills' if noise(x // 16, y // 16) % 5 == 0 else 'ridge',
                     width=220 if apron else 460 + h % 100,
                     heightScale=.82 + (h % 12) / 100, anchorY=.3, role='crest')
        # 原图山脊从左上向右下，另一方向的边界翻转后衔接。
        patch['flipX'] = (y * 1000 + x + 1 in mountains) != ((y + 1) * 1000 + x in mountains)
        if clear_pass(patch):
            patches.append(patch)
    return patches
