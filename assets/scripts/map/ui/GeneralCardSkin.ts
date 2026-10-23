import { Color, Graphics, Label, Node, UITransform } from 'cc';

interface CardDetails {
    name: string;
    level: string;
    role: string;
    camp: string;
    stat: string;
    stars: number;
    promotedStars: number;
}

interface CardSkin {
    node: Node;
    graphics: Graphics;
    labels: { [key: string]: Label };
    hidden: Array<{ node: Node; active: boolean }>;
    signature: string;
}

const skins = new WeakMap<Node, CardSkin>();
const paper = new Color(239, 229, 205, 255);
const muted = new Color(193, 177, 146, 255);

function makeLabel(parent: Node, name: string, x: number, y: number,
    width: number, size: number, align = Label.HorizontalAlign.CENTER): Label {
    const node = new Node(name);
    node.layer = parent.layer;
    parent.addChild(node);
    node.setPosition(x, y, 0);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, 44);
    const label = node.addComponent(Label);
    label.fontSize = size;
    label.lineHeight = 40;
    label.color = paper;
    label.horizontalAlign = align;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.enableWrapText = false;
    label.overflow = Label.Overflow.SHRINK;
    return label;
}

/** 共享卡牌离开本页样式前先还原，数据刷新随后决定阵营、费用等字段的可见性。 */
export function clearGeneralCardSkin(root: Node): void {
    const skin = skins.get(root);
    if (!skin) return;
    for (const entry of skin.hidden) {
        if (entry.node.isValid) entry.node.active = entry.active;
    }
    skin.hidden = [];
    skin.node.active = false;
}

/** 只用于武将列表，沿用原画像、点击回调及上阵/选中状态节点。 */
export function applyGeneralCardSkin(root: Node, details: CardDetails): void {
    const frame = root.getChildByName('head_wrap');
    if (!frame || !root.getChildByName('pic')) return;
    let skin = skins.get(root);
    if (!skin) {
        const node = new Node('RosterCardFinish');
        node.layer = root.layer;
        node.addComponent(UITransform).setContentSize(350, 480);
        root.addChild(node);
        // 盖住画像底部，既有的选中、上阵和删除节点仍在上层。
        node.setSiblingIndex(root.children.indexOf(frame) + 1);
        const ink = new Node('FrameInk');
        ink.layer = root.layer;
        ink.addComponent(UITransform).setContentSize(350, 480);
        node.addChild(ink);
        const labels = {
            name: makeLabel(node, 'Name', -55, -158, 190, 34, Label.HorizontalAlign.LEFT),
            level: makeLabel(node, 'Level', 109, 208, 92, 23),
            role: makeLabel(node, 'Role', -85, -207, 130, 23, Label.HorizontalAlign.LEFT),
            camp: makeLabel(node, 'Camp', -137, 208, 40, 25),
            stat: makeLabel(node, 'Stat', 109, -158, 82, 20, Label.HorizontalAlign.RIGHT),
        };
        labels.name.fontFamily = 'serif';
        labels.role.color = muted;
        labels.stat.color = muted;
        skin = { node, graphics: ink.addComponent(Graphics), labels, hidden: [], signature: '' };
        skins.set(root, skin);
    }
    skin.node.active = true;
    for (const name of ['head_wrap', 'name', 'lv', 'campLabel', 'cost', 'starLayout', 'New Sprite(Splash)']) {
        const node = root.getChildByName(name);
        if (!node) continue;
        if (!skin.hidden.some(entry => entry.node === node)) {
            skin.hidden.push({ node, active: node.active });
        }
        node.active = false;
    }

    const signature = JSON.stringify(details);
    if (signature === skin.signature) return;
    skin.signature = signature;
    for (const key of ['name', 'level', 'role', 'camp', 'stat']) {
        skin.labels[key].string = details[key];
        skin.labels[key].node.active = details[key] !== '';
    }
    const g = skin.graphics;
    g.clear();
    // 温润墨色信息底托，人物上半身完整保留。
    g.fillColor = new Color(30, 28, 24, 248);
    g.rect(-173, -238, 346, 111);
    g.fill();
    for (let band = 0; band < 4; band++) {
        g.fillColor = new Color(30, 28, 24, 160 - band * 38);
        g.rect(-173, -127 + band * 6, 346, 6);
        g.fill();
    }
    g.lineWidth = 2;
    g.strokeColor = new Color(173, 143, 91, 240);
    g.rect(-173, -238, 346, 476);
    g.stroke();
    g.lineWidth = 1;
    g.strokeColor = new Color(213, 185, 132, 105);
    g.rect(-168, -233, 336, 466);
    g.moveTo(-150, -185);
    g.lineTo(150, -185);
    g.stroke();
    g.strokeColor = new Color(213, 185, 132, 225);
    g.lineWidth = 2;
    for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
            g.moveTo(sx * 148, sy * 229);
            g.lineTo(sx * 164, sy * 229);
            g.lineTo(sx * 164, sy * 213);
            g.stroke();
        }
    }
    g.fillColor = new Color(30, 28, 24, 216);
    g.roundRect(59, 188, 100, 40, 3);
    g.fill();
    if (details.camp) {
        g.fillColor = new Color(110, 62, 46, 245);
        g.roundRect(-157, 186, 40, 44, 2);
        g.fill();
    }
    const stars = Math.max(0, Math.min(5, Math.floor(details.stars || 0)));
    for (let index = 0; index < stars; index++) {
        const x = 146 - (stars - 1 - index) * 23;
        g.fillColor = index < details.promotedStars ? new Color(194, 112, 79, 255) :
            new Color(204, 176, 112, 255);
        for (let point = 0; point < 10; point++) {
            const angle = Math.PI / 2 + point * Math.PI / 5;
            const radius = point % 2 === 0 ? 9 : 4;
            const px = x + Math.cos(angle) * radius;
            const py = -207 + Math.sin(angle) * radius;
            if (point === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
        }
        g.close();
        g.fill();
    }
}
