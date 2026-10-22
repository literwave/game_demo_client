import {
    _decorator,
    Button,
    Color,
    Component,
    EventTouch,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    Tween,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
    VerticalTextAlignment,
} from 'cc';
import { EventMgr } from '../utils/EventMgr';
import { LogicEvent } from './LogicEvent';

const { ccclass, property } = _decorator;

export interface ReconnectState {
    attempt?: number;
    maxAttempts?: number;
    retryDelayMs?: number;
}

const GOLD = new Color(216, 188, 128, 255);
const GOLD_SOFT = new Color(188, 156, 96, 150);
const TEXT_MAIN = new Color(238, 225, 198, 255);
const TEXT_SUB = new Color(191, 174, 143, 255);
const TEXT_FAINT = new Color(139, 123, 96, 255);
const SEAL_RED = new Color(119, 32, 26, 255);
const SEAL_RED_DARK = new Color(81, 24, 21, 255);

@ccclass('ReconnectLogic')
export default class ReconnectLogic extends Component {
    @property
    public blockInput: boolean = true;

    private built = false;
    private cardNode: Node | null = null;
    private titleLabel: Label | null = null;
    private statusLabel: Label | null = null;
    private attemptLabel: Label | null = null;
    private hintLabel: Label | null = null;
    private footnoteLabel: Label | null = null;
    private sealNode: Node | null = null;
    private sealLabel: Label | null = null;
    private progressNode: Node | null = null;
    private progressGraphics: Graphics | null = null;
    private retryButton: Node | null = null;
    private opacity: UIOpacity | null = null;

    private width = 1280;
    private height = 720;
    private dotsElapsed = 0;
    private dotCount = 0;
    private retryRemaining = 0;
    private retryTotal = 0;
    private phase = 0;
    private failed = false;
    private success = false;

    protected onLoad(): void {
        this.ensureBuilt();
    }

    public showReconnecting(state: ReconnectState = {}): void {
        if (!this.node.active) {
            this.node.active = true;
        }
        this.ensureBuilt();
        this.failed = false;
        this.success = false;
        this.cancelPendingHide();
        this.unschedule(this.enterLogin);

        this.dotsElapsed = 0;
        this.dotCount = 0;
        this.phase = 0;
        this.retryTotal = Math.max(0, (state.retryDelayMs ?? 2000) / 1000);
        this.retryRemaining = this.retryTotal;

        if (this.titleLabel) {
            this.titleLabel.string = '断线重连中';
            this.titleLabel.color = TEXT_MAIN;
        }
        if (this.statusLabel) {
            this.statusLabel.string = '正在尝试重新连接服务器';
            this.statusLabel.color = TEXT_SUB;
        }
        if (this.attemptLabel) {
            const attempt = Math.max(1, state.attempt ?? 1);
            const max = state.maxAttempts ?? 0;
            this.attemptLabel.string = max > 0
                ? `第 ${attempt} / ${max} 次重连 · ${Math.ceil(this.retryTotal)} 秒后重试`
                : `正在第 ${attempt} 次重连 · ${Math.ceil(this.retryTotal)} 秒后重试`;
            this.attemptLabel.color = TEXT_FAINT;
        }
        if (this.hintLabel) {
            this.hintLabel.string = '网络恢复后将自动返回战场';
            this.hintLabel.node.active = true;
        }
        if (this.footnoteLabel) {
            this.footnoteLabel.string = '请保持网络通畅，勿关闭游戏';
            this.footnoteLabel.node.active = true;
        }
        if (this.sealLabel) {
            this.sealLabel.string = '重';
            this.sealLabel.color = new Color(226, 198, 146, 255);
        }
        if (this.sealNode) {
            this.sealNode.setScale(1, 1, 1);
        }
        if (this.progressNode) {
            this.progressNode.active = true;
        }
        if (this.retryButton) {
            this.retryButton.active = false;
        }

        this.drawProgress();
        this.playIntro();
    }

    public showSuccess(): void {
        if (!this.built || !this.node.active) {
            return;
        }
        this.success = true;
        this.failed = false;
        this.cancelPendingHide();
        if (this.titleLabel) {
            this.titleLabel.string = '重连成功';
            this.titleLabel.color = new Color(174, 218, 157, 255);
        }
        if (this.statusLabel) {
            this.statusLabel.string = '已恢复与服务器的连接';
            this.statusLabel.color = TEXT_MAIN;
        }
        if (this.attemptLabel) {
            this.attemptLabel.string = '正在返回战场…';
            this.attemptLabel.color = GOLD_SOFT;
        }
        if (this.hintLabel) {
            this.hintLabel.node.active = false;
        }
        if (this.footnoteLabel) {
            this.footnoteLabel.node.active = false;
        }
        if (this.progressNode) {
            this.progressNode.active = false;
        }
        if (this.retryButton) {
            this.retryButton.active = false;
        }
        this.scheduleOnce(this.hideAfterSuccess, 0.9);
    }

    public showFailed(): void {
        if (!this.node.active) {
            this.node.active = true;
        }
        this.ensureBuilt();
        this.failed = true;
        this.success = false;
        this.cancelPendingHide();
        this.unschedule(this.enterLogin);

        if (this.titleLabel) {
            this.titleLabel.string = '重连失败';
            this.titleLabel.color = new Color(224, 158, 126, 255);
        }
        if (this.statusLabel) {
            this.statusLabel.string = '未能恢复与服务器的连接';
            this.statusLabel.color = TEXT_SUB;
        }
        if (this.attemptLabel) {
            this.attemptLabel.string = '请检查网络环境后重新登录';
            this.attemptLabel.color = TEXT_FAINT;
        }
        if (this.hintLabel) {
            this.hintLabel.node.active = false;
        }
        if (this.footnoteLabel) {
            this.footnoteLabel.node.active = false;
        }
        if (this.progressNode) {
            this.progressNode.active = false;
        }
        if (this.retryButton) {
            this.retryButton.active = true;
        }
        if (this.sealLabel) {
            this.sealLabel.string = '断';
            this.sealLabel.color = new Color(232, 178, 130, 255);
        }
        if (this.sealNode) {
            Tween.stopAllByTarget(this.sealNode);
            this.sealNode.setScale(1.08, 1.08, 1);
            tween(this.sealNode)
                .to(0.18, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        }
        this.playIntro();
    }

    public hideNow(): void {
        this.cancelPendingHide();
        this.unschedule(this.enterLogin);
        this.failed = false;
        this.success = false;
        this.node.active = false;
    }

    protected update(dt: number): void {
        if (!this.built || this.failed || this.success) {
            return;
        }

        this.dotsElapsed += dt;
        if (this.dotsElapsed >= 0.36) {
            this.dotsElapsed = 0;
            this.dotCount = (this.dotCount + 1) % 3;
            if (this.statusLabel) {
                this.statusLabel.string = `正在尝试重新连接服务器${'.'.repeat(this.dotCount + 1)}`;
            }
        }

        if (this.retryRemaining > 0) {
            this.retryRemaining = Math.max(0, this.retryRemaining - dt);
            if (this.attemptLabel) {
                const seconds = Math.ceil(this.retryRemaining);
                const current = this.attemptLabel.string;
                const prefix = current.split('·')[0].trim();
                this.attemptLabel.string = this.retryRemaining > 0.05
                    ? `${prefix} · ${seconds} 秒后重试`
                    : `${prefix} · 正在连接`;
            }
        }

        this.phase = (this.phase + dt * 0.72) % 1;
        this.drawProgress();
    }

    private ensureBuilt(): void {
        if (this.built) {
            return;
        }
        this.built = true;

        const parentTransform = this.node.parent?.getComponent(UITransform);
        this.width = parentTransform?.width ?? 1280;
        this.height = parentTransform?.height ?? 720;

        let transform = this.node.getComponent(UITransform);
        if (!transform) {
            transform = this.node.addComponent(UITransform);
        }
        transform.setContentSize(this.width, this.height);
        transform.setAnchorPoint(0.5, 0.5);
        this.node.setPosition(0, 0, 0);

        this.opacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity);
        this.opacity.opacity = 0;

        const mask = this.createNode('DimMask', this.node, this.width, this.height);
        const maskGraphics = mask.addComponent(Graphics);
        maskGraphics.fillColor = new Color(5, 4, 3, 186);
        maskGraphics.rect(-this.width * 0.5, -this.height * 0.5, this.width, this.height);
        maskGraphics.fill();
        if (this.blockInput) {
            mask.on(Node.EventType.TOUCH_START, this.blockTouch, this, true);
            mask.on(Node.EventType.TOUCH_MOVE, this.blockTouch, this, true);
            mask.on(Node.EventType.TOUCH_END, this.blockTouch, this, true);
            mask.on(Node.EventType.TOUCH_CANCEL, this.blockTouch, this, true);
        }

        const backdrop = this.createNode('BackdropMark', this.node, 460, 460, 0, -18);
        const backdropLabel = backdrop.addComponent(Label);
        backdropLabel.string = '战';
        backdropLabel.fontSize = 300;
        backdropLabel.lineHeight = 320;
        backdropLabel.color = new Color(194, 155, 86, 12);
        backdropLabel.horizontalAlign = HorizontalTextAlignment.CENTER;
        backdropLabel.verticalAlign = VerticalTextAlignment.CENTER;

        this.cardNode = this.createNode('ReconnectCard', this.node, 460, 280);
        const panel = this.cardNode.addComponent(Graphics);
        this.drawPanel(panel);

        this.sealNode = this.createNode('Seal', this.cardNode, 68, 68, 0, 103);
        const sealGraphics = this.sealNode.addComponent(Graphics);
        this.drawSeal(sealGraphics);
        const sealText = this.createNode('SealText', this.sealNode, 58, 58);
        this.sealLabel = sealText.addComponent(Label);
        this.sealLabel.string = '重';
        this.sealLabel.fontSize = 26;
        this.sealLabel.lineHeight = 30;
        this.sealLabel.color = new Color(226, 198, 146, 255);
        this.sealLabel.horizontalAlign = HorizontalTextAlignment.CENTER;
        this.sealLabel.verticalAlign = VerticalTextAlignment.CENTER;

        this.titleLabel = this.createLabel('Title', this.cardNode, 400, 42, 0, 57, '断线重连中', 30, TEXT_MAIN);
        this.statusLabel = this.createLabel('Status', this.cardNode, 400, 28, 0, 15, '正在尝试重新连接服务器', 18, TEXT_SUB);
        this.attemptLabel = this.createLabel('Attempt', this.cardNode, 400, 24, 0, -17, '', 14, TEXT_FAINT);
        this.hintLabel = this.createLabel('Hint', this.cardNode, 400, 24, 0, -83, '网络恢复后将自动返回战场', 15, TEXT_SUB);
        this.footnoteLabel = this.createLabel('Footnote', this.cardNode, 400, 20, 0, -112, '请保持网络通畅，勿关闭游戏', 13, TEXT_FAINT);

        this.progressNode = this.createNode('Progress', this.cardNode, 360, 20, 0, -51);
        this.progressGraphics = this.progressNode.addComponent(Graphics);

        this.retryButton = this.createButton();
        this.retryButton.active = false;
    }

    private drawPanel(graphics: Graphics): void {
        graphics.clear();
        graphics.fillColor = new Color(13, 11, 8, 244);
        graphics.roundRect(-228, -138, 456, 276, 9);
        graphics.fill();

        graphics.lineWidth = 1.5;
        graphics.strokeColor = GOLD_SOFT;
        graphics.roundRect(-228, -138, 456, 276, 9);
        graphics.stroke();

        graphics.lineWidth = 1;
        graphics.strokeColor = new Color(160, 130, 78, 80);
        graphics.roundRect(-215, -125, 430, 250, 6);
        graphics.stroke();

        graphics.lineWidth = 1;
        graphics.strokeColor = new Color(206, 174, 108, 150);
        graphics.moveTo(-170, 34);
        graphics.lineTo(-28, 34);
        graphics.moveTo(28, 34);
        graphics.lineTo(170, 34);
        graphics.stroke();

        graphics.fillColor = new Color(206, 174, 108, 170);
        graphics.circle(0, 34, 2.5);
        graphics.fill();

        graphics.lineWidth = 1;
        graphics.strokeColor = new Color(160, 130, 78, 65);
        graphics.moveTo(-170, -99);
        graphics.lineTo(170, -99);
        graphics.stroke();

        this.drawCorner(graphics, -212, 122, 1, -1);
        this.drawCorner(graphics, 212, 122, -1, -1);
        this.drawCorner(graphics, -212, -122, 1, 1);
        this.drawCorner(graphics, 212, -122, -1, 1);
    }

    private drawCorner(graphics: Graphics, x: number, y: number, sx: number, sy: number): void {
        graphics.lineWidth = 2;
        graphics.strokeColor = new Color(212, 177, 108, 190);
        graphics.moveTo(x, y + sy * 20);
        graphics.lineTo(x, y);
        graphics.lineTo(x + sx * 20, y);
        graphics.stroke();
        graphics.fillColor = new Color(212, 177, 108, 180);
        graphics.circle(x + sx * 6, y + sy * 6, 1.6);
        graphics.fill();
    }

    private drawSeal(graphics: Graphics): void {
        graphics.clear();
        graphics.fillColor = SEAL_RED;
        graphics.circle(0, 0, 31);
        graphics.fill();
        graphics.fillColor = SEAL_RED_DARK;
        graphics.circle(0, 0, 25);
        graphics.fill();
        graphics.lineWidth = 1.5;
        graphics.strokeColor = new Color(222, 188, 126, 215);
        graphics.circle(0, 0, 31);
        graphics.stroke();
        graphics.lineWidth = 1;
        graphics.strokeColor = new Color(222, 188, 126, 110);
        graphics.circle(0, 0, 27);
        graphics.stroke();
    }

    private drawProgress(): void {
        if (!this.progressGraphics) {
            return;
        }
        const graphics = this.progressGraphics;
        graphics.clear();
        graphics.fillColor = new Color(73, 62, 46, 180);
        graphics.rect(-180, -1, 360, 2);
        graphics.fill();

        const segmentWidth = 86;
        const start = -180 - segmentWidth + this.phase * (360 + segmentWidth);
        graphics.fillColor = new Color(213, 177, 105, 85);
        graphics.rect(start, -1.5, segmentWidth, 3);
        graphics.fill();

        const glowStart = start + segmentWidth * 0.5 - 20;
        graphics.fillColor = new Color(236, 207, 147, 210);
        graphics.rect(glowStart, -2, 40, 4);
        graphics.fill();

        graphics.fillColor = new Color(222, 190, 125, 220);
        graphics.circle(-180, 0, 2);
        graphics.circle(180, 0, 2);
        graphics.fill();
    }

    private createButton(): Node {
        if (!this.cardNode) {
            throw new Error('Reconnect card is not ready');
        }
        const buttonNode = this.createNode('ReturnLoginButton', this.cardNode, 196, 46, 0, -73);
        const graphics = buttonNode.addComponent(Graphics);
        graphics.fillColor = new Color(87, 27, 23, 255);
        graphics.roundRect(-98, -23, 196, 46, 5);
        graphics.fill();
        graphics.lineWidth = 1.5;
        graphics.strokeColor = GOLD;
        graphics.roundRect(-98, -23, 196, 46, 5);
        graphics.stroke();
        graphics.lineWidth = 1;
        graphics.strokeColor = new Color(224, 191, 126, 100);
        graphics.roundRect(-91, -16, 182, 32, 3);
        graphics.stroke();

        const button = buttonNode.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        buttonNode.on(Button.EventType.CLICK, this.onReturnLogin, this);

        this.createLabel('Label', buttonNode, 180, 32, 0, 0, '返回登录', 18, new Color(235, 211, 164, 255));
        return buttonNode;
    }

    private createLabel(
        name: string,
        parent: Node,
        width: number,
        height: number,
        x: number,
        y: number,
        text: string,
        size: number,
        color: Color,
    ): Label {
        const node = this.createNode(name, parent, width, height, x, y);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = Math.max(size + 4, height);
        label.color = color;
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        return label;
    }

    private createNode(name: string, parent: Node, width: number, height: number, x: number = 0, y: number = 0): Node {
        const node = new Node(name);
        node.layer = this.node.layer;
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);
        transform.setAnchorPoint(0.5, 0.5);
        node.setPosition(x, y, 0);
        node.setParent(parent);
        return node;
    }

    private playIntro(): void {
        if (!this.opacity || !this.cardNode) {
            return;
        }
        Tween.stopAllByTarget(this.opacity);
        Tween.stopAllByTarget(this.cardNode);
        this.opacity.opacity = 0;
        this.cardNode.setScale(0.965, 0.965, 1);
        tween(this.opacity).to(0.18, { opacity: 255 }, { easing: 'quadOut' }).start();
        tween(this.cardNode)
            .to(0.24, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    private hideAfterSuccess(): void {
        if (!this.success || !this.opacity) {
            return;
        }
        Tween.stopAllByTarget(this.opacity);
        tween(this.opacity)
            .to(0.24, { opacity: 0 }, { easing: 'quadIn' })
            .call(() => {
                this.success = false;
                this.node.active = false;
            })
            .start();
    }

    private cancelPendingHide(): void {
        this.unschedule(this.hideAfterSuccess);
        if (this.opacity) {
            Tween.stopAllByTarget(this.opacity);
        }
    }

    private blockTouch(event: EventTouch): void {
        event.propagationStopped = true;
    }

    private onReturnLogin(): void {
        if (!this.failed) {
            return;
        }
        this.scheduleOnce(this.enterLogin, 0.08);
    }

    private enterLogin(): void {
        EventMgr.emit(LogicEvent.enterLogin);
    }
}
