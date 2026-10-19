import { _decorator, Component, Label, Tween, tween, UIOpacity, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Toast')
export default class Toast extends Component {
    @property(Label)
    msgLabel: Label | null = null;

    private _opacity: UIOpacity | null = null;
    private _basePosition: Vec3 = new Vec3();

    protected onLoad(): void {
        this._opacity = this.node.getComponent(UIOpacity);
        this._basePosition.set(this.node.position);
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
        if (this._opacity) {
            Tween.stopAllByTarget(this._opacity);
            this._opacity.opacity = 0;
        }

        if (this.msgLabel) {
            this.msgLabel.string = text;
        }

        this.node.active = true;
        this.node.setPosition(this._basePosition.x, this._basePosition.y + 10, this._basePosition.z);
        this.node.setScale(0.97, 0.97, 1);

        tween(this.node)
            .parallel(
                tween().to(0.18, { position: this._basePosition }, { easing: 'quadOut' }),
                tween().to(0.18, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
            )
            .start();

        if (this._opacity) {
            tween(this._opacity)
                .to(0.18, { opacity: 255 }, { easing: 'quadOut' })
                .start();
        }

        this.scheduleOnce(this.onRemove, 2.2);
    }
}
