import { BlockInputEvents, Button, Color, Graphics, Label, Layout, Node, Sprite, UITransform, Widget, view } from 'cc';
import BgLogic from '../../common/BgLogic';

/** 管理界面共用的墨色、铜线和纸色文字；装饰节点不接收输入。 */
export const ManagementColors = {
    ink: new Color(32, 36, 31, 255),
    panel: new Color(43, 46, 38, 250),
    inset: new Color(24, 29, 24, 205),
    text: new Color(238, 229, 206, 255),
    muted: new Color(169, 166, 144, 255),
    gold: new Color(197, 166, 108, 255),
    line: new Color(153, 134, 91, 115),
};

export function place(node: Node | null, x: number, y: number, width: number, height: number): void {
    if (!node) return;
    const widget = node.getComponent(Widget);
    if (widget) widget.enabled = false;
    const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
    ui.setAnchorPoint(.5, .5);
    ui.setContentSize(width, height);
    node.setPosition(x, y, 0);
    node.setScale(1, 1, 1);
}

export function hideSprite(node: Node | null): void {
    const sprite = node?.getComponent(Sprite);
    if (sprite) sprite.enabled = false;
}

export function manualLayout(node: Node | null): void {
    const layout = node?.getComponent(Layout);
    if (layout) layout.enabled = false;
}

export function inkSurface(parent: Node, name: string, width: number, height: number,
    fill: Color | null = ManagementColors.panel, border: Color | null = ManagementColors.line): Graphics {
    let node = parent.getChildByName(name);
    if (!node) {
        node = new Node(name);
        node.layer = parent.layer;
        parent.addChild(node);
        node.addComponent(UITransform);
        node.addComponent(Graphics);
        node.setSiblingIndex(0);
    }
    place(node, 0, 0, width, height);
    const g = node.getComponent(Graphics);
    g.clear();
    if (fill) {
        g.fillColor = fill;
        g.roundRect(-width / 2, -height / 2, width, height, 4);
        g.fill();
    }
    if (border) {
        g.strokeColor = border;
        g.lineWidth = 1;
        g.roundRect(-width / 2 + .5, -height / 2 + .5, width - 1, height - 1, 4);
        g.stroke();
    }
    return g;
}

export function textStyle(label: Label | null, x: number, y: number, width: number,
    size = 18, color = ManagementColors.text, align = Label.HorizontalAlign.LEFT, height = 32): void {
    if (!label) return;
    place(label.node, x, y, width, Math.max(height, Math.round(size * 1.35)));
    label.fontSize = size;
    label.lineHeight = Math.round(size * 1.35);
    label.color = color;
    label.horizontalAlign = align;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.overflow = Label.Overflow.CLAMP;
    label.enableWrapText = false;
    label.outlineWidth = 0;
}

export function caption(parent: Node, name: string, text: string, x: number, y: number,
    width: number, size = 18, color = ManagementColors.text, align = Label.HorizontalAlign.LEFT): Label {
    let node = parent.getChildByName(name);
    if (!node) {
        node = new Node(name);
        node.layer = parent.layer;
        parent.addChild(node);
        node.addComponent(UITransform);
        node.addComponent(Label);
    }
    const label = node.getComponent(Label);
    textStyle(label, x, y, width, size, color, align);
    label.string = text;
    return label;
}

/** 沿用原 Button 和事件，替换背景而不重绑业务回调。 */
export function panelButton(node: Node | null, text: string, x: number, y: number,
    width: number, height = 44, primary = false, close = false): void {
    if (!node) return;
    place(node, x, y, width, height);
    const background = node.getChildByName('Background') || node;
    if (background !== node) place(background, 0, 0, width, height);
    hideSprite(background);
    const g = inkSurface(background, 'ManagementButton', width, height,
        primary ? new Color(116, 94, 54, 255) : new Color(51, 55, 44, 240),
        primary ? ManagementColors.gold : ManagementColors.line);
    const button = node.getComponent(Button);
    if (button) {
        button.target = background;
        button.transition = Button.Transition.SCALE;
        button.zoomScale = .97;
        button.duration = .1;
    }
    const label = background.getComponentInChildren(Label);
    if (label) {
        label.node.active = !close;
        textStyle(label, 0, 0, width - 12, 16, ManagementColors.text, Label.HorizontalAlign.CENTER, height - 4);
        label.string = text;
    } else if (!close) {
        caption(background, 'ManagementCaption', text, 0, 0, width - 12, 16,
            ManagementColors.text, Label.HorizontalAlign.CENTER);
    }
    if (close) {
        g.lineWidth = 2;
        g.strokeColor = ManagementColors.text;
        g.moveTo(-7, -7); g.lineTo(7, 7);
        g.moveTo(-7, 7); g.lineTo(7, -7);
        g.stroke();
    }
}

export function modalBackdrop(root: Node, background: Node | null, image = false): { width: number; height: number } {
    const size = view.getVisibleSize();
    place(root, 0, 0, size.width, size.height);
    if (!root.getComponent(BlockInputEvents)) root.addComponent(BlockInputEvents);
    if (background) {
        const bg = background.getComponent(BgLogic);
        if (bg) bg.enabled = false;
        const sprite = background.getComponent(Sprite);
        if (image && sprite) {
            const cover = Math.max(size.width / 1280, size.height / 720);
            place(background, 0, 0, 1280 * cover, 720 * cover);
            sprite.color = new Color(65, 65, 53, 255);
        } else {
            place(background, 0, 0, size.width, size.height);
            hideSprite(background);
            inkSurface(background, 'ManagementBackdrop', size.width, size.height, ManagementColors.ink, null);
        }
    }
    return size;
}

export function headerRule(parent: Node, width: number, y: number): void {
    const g = inkSurface(parent, 'ManagementHeaderRule', width, 1, null, null);
    g.node.setPosition(0, y, 0);
    g.lineWidth = 1;
    g.strokeColor = ManagementColors.line;
    g.moveTo(-width / 2, 0); g.lineTo(width / 2, 0); g.stroke();
    g.strokeColor = ManagementColors.gold;
    g.moveTo(-width / 2, 0); g.lineTo(-width / 2 + 48, 0); g.stroke();
}
