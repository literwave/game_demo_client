import { _decorator, Color, Component, Graphics, Label, Node, Sprite, Tween, tween, UIOpacity, UITransform, Vec3, view } from 'cc';
const { ccclass, property } = _decorator;

const FONT_SIZE = 18;
const LINE_HEIGHT = 24;
const HORIZONTAL_PADDING = 24;
const VERTICAL_PADDING = 6;

@ccclass('Toast')
export default class Toast extends Component {
    @property(Label)
    msgLabel: Label | null = null;

    private _opacity: UIOpacity | null = null;
    private _basePosition: Vec3 = new Vec3();
    private _layoutParent: Node | null = null;

    protected onLoad(): void {
        this._opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
    }

    protected onEnable(): void {
        this._layoutParent = this.node.parent;
        this._layoutParent?.on(Node.EventType.SIZE_CHANGED, this.onViewportResize, this);
        view.on('design-resolution-changed', this.onViewportResize, this);
    }

    protected onDisable(): void {
        this._layoutParent?.off(Node.EventType.SIZE_CHANGED, this.onViewportResize, this);
        this._layoutParent = null;
        view.off('design-resolution-changed', this.onViewportResize, this);
        this.unscheduleAllCallbacks();
        Tween.stopAllByTarget(this.node);
        if (this._opacity) Tween.stopAllByTarget(this._opacity);
    }

    private onViewportResize(): void {
        Tween.stopAllByTarget(this.node);
        this.refreshLayout();
    }

    /** 按实际文字排版，短提示收窄，长提示换行；位置避开页面顶端标题。 */
    private refreshLayout(): void {
        const label = this.msgLabel;
        if (!label) return;
        const parentUi = this.node.parent?.getComponent(UITransform);
        const size = parentUi?.contentSize || view.getVisibleSize();
        const maxWidth = Math.max(80, Math.min(480, size.width - 48));
        const labelUi = label.node.getComponent(UITransform);
        label.customMaterial = null;
        label.fontSize = FONT_SIZE;
        label.lineHeight = LINE_HEIGHT;
        label.color = new Color(65, 53, 34, 255);
        label.isBold = false;
        label.isItalic = false;
        label.enableOutline = false;
        label.enableShadow = false;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        labelUi.setAnchorPoint(.5, .5);
        label.node.setPosition(0, 0, 0);
        label.node.setScale(1, 1, 1);

        label.overflow = Label.Overflow.NONE;
        label.enableWrapText = false;
        label.updateRenderData(true);
        const width = Math.min(maxWidth, Math.max(168, Math.ceil(labelUi.width) + HORIZONTAL_PADDING * 2));
        labelUi.setContentSize(width - HORIZONTAL_PADDING * 2, LINE_HEIGHT);
        label.overflow = Label.Overflow.RESIZE_HEIGHT;
        label.enableWrapText = true;
        label.updateRenderData(true);
        const textHeight = Math.min(96, Math.max(LINE_HEIGHT, Math.ceil(labelUi.height)));
        if (labelUi.height > textHeight) label.overflow = Label.Overflow.SHRINK;
        labelUi.setContentSize(width - HORIZONTAL_PADDING * 2, textHeight);
        const height = textHeight + VERTICAL_PADDING * 2;
        const rootUi = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        rootUi.setAnchorPoint(.5, .5);
        rootUi.setContentSize(width, height);

        const bg = this.node.getChildByName('bg');
        if (bg) {
            const sprite = bg.getComponent(Sprite);
            if (sprite) sprite.enabled = false;
            bg.setPosition(0, 0, 0);
            bg.getComponent(UITransform)?.setContentSize(width, height);
            let surface = bg.getChildByName('ToastSurface');
            if (!surface) {
                surface = new Node('ToastSurface');
                surface.layer = bg.layer;
                surface.addComponent(UITransform);
                surface.addComponent(Graphics);
                bg.addChild(surface);
            }
            surface.getComponent(UITransform).setContentSize(width, height);
            const g = surface.getComponent(Graphics);
            g.clear();
            g.fillColor = new Color(34, 27, 17, 35);
            g.roundRect(-width / 2, -height / 2 - 2, width, height, 4);
            g.fill();
            g.fillColor = new Color(224, 210, 178, 244);
            g.roundRect(-width / 2, -height / 2, width, height, 4);
            g.fill();
            g.strokeColor = new Color(174, 146, 91, 175);
            g.lineWidth = 1;
            g.roundRect(-width / 2 + .5, -height / 2 + .5, width - 1, height - 1, 4);
            g.stroke();
        }

        const centerX = parentUi ? (.5 - parentUi.anchorX) * size.width : 0;
        const centerY = parentUi ? (.5 - parentUi.anchorY) * size.height : 0;
        this._basePosition.set(centerX, centerY + Math.min(144, size.height * .2) - height / 2, 0);
        this.node.setPosition(this._basePosition);
    }

    protected onRemove(): void {
        Tween.stopAllByTarget(this.node);
        if (this._opacity) {
            Tween.stopAllByTarget(this._opacity);
            tween(this._opacity)
                .to(0.18, { opacity: 0 }, { easing: 'quadIn' })
                .call(() => {
                    this.node.active = false;
                })
                .start();
        } else {
            this.node.active = false;
        }
    }

    public setText(text: string): void {
        this.unscheduleAllCallbacks();
        Tween.stopAllByTarget(this.node);
        if (!text?.trim()) {
            this.node.active = false;
            return;
        }
        this._opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        if (this._opacity) {
            Tween.stopAllByTarget(this._opacity);
            this._opacity.opacity = 0;
        }

        if (this.msgLabel) {
            this.msgLabel.string = text;
        }

        this.node.active = true;
        this.refreshLayout();
        this.node.setPosition(this._basePosition.x, this._basePosition.y + 6, this._basePosition.z);
        this.node.setScale(1, 1, 1);

        tween(this.node)
            .to(0.18, { position: this._basePosition }, { easing: 'quadOut' })
            .start();

        if (this._opacity) {
            tween(this._opacity)
                .to(0.18, { opacity: 255 }, { easing: 'quadOut' })
                .start();
        }

        this.scheduleOnce(this.onRemove, Math.min(4.5, Math.max(2.2, text.length * .07)));
    }
}
