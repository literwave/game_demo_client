import { _decorator, Button, Color, Component, HorizontalTextAlignment, Label, Node, Sprite, tween, UIOpacity, UITransform, Vec3 } from 'cc';
const { ccclass } = _decorator;

@ccclass('EnterTransitionLogic')
export default class EnterTransitionLogic extends Component {
    public onRetry: (() => void) | null = null;
    public onBack: (() => void) | null = null;

    private card: Node | null = null;
    private titleLabel: Label | null = null;
    private kickerLabel: Label | null = null;
    private subtitleLabel: Label | null = null;
    private accountLabel: Label | null = null;
    private serverLabel: Label | null = null;
    private statusLabel: Label | null = null;
    private percentLabel: Label | null = null;
    private tipLabel: Label | null = null;
    private fillSprite: Sprite | null = null;
    private trackWidth = 420;
    private statusLeftX = -210;
    private retryNode: Node | null = null;
    private backNode: Node | null = null;
    private opacity: UIOpacity | null = null;
    private tipRoot: Node | null = null;

    private targetProgress = 0;
    private shownProgress = 0;
    private baseStatus = '';
    private dotsTimer = 0;
    private tipTimer = 0;
    private tipIndex = 0;
    private running = false;
    private failed = false;

    private readonly statusBaseColor = new Color(201, 183, 143, 255);
    private readonly statusFailColor = new Color(232, 140, 112, 255);
    private readonly fillBaseColor = new Color(255, 255, 255, 255);
    private readonly fillFailColor = new Color(178, 158, 122, 255);

    private readonly tips: string[] = [
        '小提示：加入同盟，与盟友共谋天下',
        '小提示：合理屯田，方能久战不衰',
        '小提示：武将搭配，胜过一味强攻',
        '小提示：占据要地，可扼守一方山河',
    ];

    protected onLoad(): void {
        this.opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        this.card = this.child('Card');
        this.kickerLabel = this.childLabel('Card/Kicker');
        this.titleLabel = this.childLabel('Card/Title');
        this.subtitleLabel = this.childLabel('Card/Subtitle');
        this.accountLabel = this.childLabel('Card/Account');
        this.serverLabel = this.childLabel('Card/Server');
        this.statusLabel = this.childLabel('Card/Status');
        this.percentLabel = this.childLabel('Card/Percent');
        this.tipLabel = this.childLabel('Card/Tip');
        this.tipRoot = this.child('Card/Tip');
        this.retryNode = this.child('Card/Retry');
        this.backNode = this.child('Card/Back');
        this.fillSprite = this.child('Card/Track/Fill')?.getComponent(Sprite) || null;

        if (this.statusLabel) {
            this.statusLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
        }
        if (this.percentLabel) {
            this.percentLabel.horizontalAlign = HorizontalTextAlignment.RIGHT;
        }

        const tracking = this.child('Card/Track')?.getComponent(UITransform);
        if (tracking) {
            this.trackWidth = tracking.width;
            this.statusLeftX = -this.trackWidth / 2;
        }
        this.updateFill(0);

        const retryButton = this.retryNode?.getComponent(Button);
        if (retryButton) {
            retryButton.node.on(Button.EventType.CLICK, () => {
                if (this.onRetry) {
                    this.onRetry();
                }
            });
        }
        const backButton = this.backNode?.getComponent(Button);
        if (backButton) {
            backButton.node.on(Button.EventType.CLICK, () => {
                if (this.onBack) {
                    this.onBack();
                }
            });
        }

        this.showErrorButtons(false);
    }

    public play(account: string, server: string): void {
        this.running = true;
        this.failed = false;
        this.targetProgress = 0.08;
        this.shownProgress = 0.08;
        this.baseStatus = '正在验证身份';
        this.dotsTimer = 0;
        this.tipTimer = 0;
        this.tipIndex = 0;
        this.updateFill(this.shownProgress);

        if (this.percentLabel) {
            this.percentLabel.node.active = true;
        }
        if (this.statusLabel) {
            this.statusLabel.color = this.statusBaseColor;
        }
        if (this.fillSprite) {
            this.fillSprite.color = this.fillBaseColor;
        }
        this.setStatusCentered(false);
        if (this.accountLabel) {
            this.accountLabel.string = `主公 · ${account || '归来的旅人'}`;
        }
        if (this.serverLabel) {
            this.serverLabel.string = server || 'S1 · 推荐服';
        }
        if (this.tipLabel) {
            this.tipLabel.string = this.tips[0];
        }
        if (this.tipRoot) {
            this.tipRoot.active = true;
        }
        this.showErrorButtons(false);

        this.node.active = true;
        if (this.opacity) {
            this.opacity.opacity = 0;
            tween(this.opacity).to(0.35, { opacity: 255 }, { easing: 'quadOut' }).start();
        }
        if (this.card) {
            this.card.setScale(0.95, 0.95, 1);
            tween(this.card).to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' }).start();
        }
    }

    public setStage(progress: number, status?: string): void {
        if (this.failed) {
            return;
        }
        this.targetProgress = Math.max(this.shownProgress, Math.min(1, progress));
        if (status) {
            this.baseStatus = status;
            this.dotsTimer = 0;
        }
    }

    public complete(): void {
        if (this.failed) {
            return;
        }
        this.setStage(1, '山河已就绪');
        if (this.percentLabel) {
            this.percentLabel.string = '100%';
        }
    }

    public fail(message: string): void {
        if (!this.running) {
            return;
        }
        this.failed = true;
        this.baseStatus = message;
        this.dotsTimer = 0;
        if (this.statusLabel) {
            this.statusLabel.string = message;
            this.statusLabel.color = this.statusFailColor;
        }
        if (this.fillSprite) {
            this.fillSprite.color = this.fillFailColor;
        }
        if (this.percentLabel) {
            this.percentLabel.node.active = false;
        }
        this.setStatusCentered(true);
        if (this.tipRoot) {
            this.tipRoot.active = false;
        }
        this.showErrorButtons(true);
    }

    public resetForRetry(): void {
        this.failed = false;
        this.targetProgress = 0.12;
        this.shownProgress = 0.12;
        this.baseStatus = '正在重新连接';
        this.dotsTimer = 0;
        this.tipTimer = 0;
        this.updateFill(this.shownProgress);
        this.showErrorButtons(false);
        if (this.percentLabel) {
            this.percentLabel.node.active = true;
        }
        if (this.statusLabel) {
            this.statusLabel.color = this.statusBaseColor;
        }
        if (this.fillSprite) {
            this.fillSprite.color = this.fillBaseColor;
        }
        this.setStatusCentered(false);
        if (this.tipRoot) {
            this.tipRoot.active = true;
        }
    }

    protected update(dt: number): void {
        if (!this.running) {
            return;
        }

        const smoothing = 1 - Math.pow(0.0025, dt);
        this.shownProgress += (this.targetProgress - this.shownProgress) * smoothing;
        this.updateFill(this.shownProgress);

        if (this.percentLabel) {
            this.percentLabel.string = `${Math.round(this.shownProgress * 100)}%`;
        }

        if (this.statusLabel && !this.failed) {
            this.dotsTimer += dt;
            const dots = Math.floor(this.dotsTimer / 0.32) % 4;
            this.statusLabel.string = `${this.baseStatus}${'.'.repeat(dots)}`;
        }

        if (this.tipLabel && !this.failed) {
            this.tipTimer += dt;
            if (this.tipTimer >= 4.5) {
                this.tipTimer = 0;
                this.tipIndex = (this.tipIndex + 1) % this.tips.length;
                this.tipLabel.string = this.tips[this.tipIndex];
            }
        }
    }

    public hide(): void {
        this.running = false;
        this.node.active = false;
    }

    private updateFill(progress: number): void {
        if (!this.fillSprite) {
            return;
        }
        const transform = this.fillSprite.getComponent(UITransform);
        if (!transform) {
            return;
        }
        const value = Math.max(0, Math.min(1, progress));
        transform.width = this.trackWidth * value;
    }

    private setStatusCentered(centered: boolean): void {
        if (!this.statusLabel) {
            return;
        }
        const transform = this.statusLabel.node.getComponent(UITransform);
        if (!transform) {
            return;
        }
        const y = this.statusLabel.node.position.y;
        if (centered) {
            transform.setAnchorPoint(0.5, 0.5);
            this.statusLabel.node.setPosition(0, y, 0);
            this.statusLabel.horizontalAlign = HorizontalTextAlignment.CENTER;
        } else {
            transform.setAnchorPoint(0, 0.5);
            this.statusLabel.node.setPosition(this.statusLeftX, y, 0);
            this.statusLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
        }
    }

    private showErrorButtons(visible: boolean): void {
        if (this.retryNode) {
            this.retryNode.active = visible;
        }
        if (this.backNode) {
            this.backNode.active = visible;
        }
    }

    private child(path: string): Node | null {
        let node: Node = this.node;
        for (const name of path.split('/')) {
            if (!name) {
                continue;
            }
            node = node.getChildByName(name);
            if (!node) {
                return null;
            }
        }
        return node;
    }

    private childLabel(path: string): Label | null {
        const node = this.child(path);
        return node ? node.getComponent(Label) : null;
    }
}
