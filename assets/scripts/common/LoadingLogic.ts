import { _decorator, Animation, Component, instantiate, Label, Node, Prefab, ProgressBar, UITransform } from 'cc';
import { CoreEvent } from '../core/CoreEvent';
import { EventMgr } from '../utils/EventMgr';

const { ccclass, property } = _decorator;

@ccclass('LoadingLogic')
export default class LoadingLogic extends Component {
    @property(ProgressBar)
    bar: ProgressBar | null = null;

    @property(Label)
    percentLabel: Label | null = null;

    @property(Prefab)
    runnerPrefab: Prefab | null = null;

    @property(Node)
    runner: Node | null = null;

    private targetProgress = 0;
    private visualProgress = 0;
    private trackLength = 1000;
    private runnerHalfWidth = 18;
    private runnerBaseX = 0;
    private runnerBaseY = -35;

    protected onLoad(): void {
        if (this.bar) {
            this.bar.progress = 0;
            const barNode = this.bar.node;
            const trackTransform = barNode.getComponent(UITransform);
            this.trackLength = trackTransform?.width ?? this.trackLength;
            const trackHeight = trackTransform?.height ?? 20;
            const trackPosition = barNode.position;
            this.runnerBaseX = trackPosition.x;
            this.runnerBaseY = trackPosition.y + trackHeight * 0.5;
        }

        if (!this.runner && this.runnerPrefab) {
            const runner = instantiate(this.runnerPrefab);
            runner.name = 'runner';
            runner.layer = this.node.layer;
            runner.setParent(this.node);
            this.runner = runner;
        }

        if (this.runner) {
            const runnerTransform = this.runner.getComponent(UITransform);
            this.runnerHalfWidth = (runnerTransform?.width ?? 36) * Math.abs(this.runner.scale.x) * 0.5;
            this.runnerBaseY += (runnerTransform?.height ?? 94) * Math.abs(this.runner.scale.y) * 0.5 + 4;
            const animation = this.runner.getComponent(Animation);
            if (animation) {
                animation.play('qb_run_r');
            }
        }

        this.updateRunnerPosition();
        this.updatePercent();
        EventMgr.on(CoreEvent.loadProgress, this.onProgress, this);
        EventMgr.on(CoreEvent.loadComplete, this.onComplete, this);
    }

    protected onEnable(): void {
        this.targetProgress = 0;
        this.visualProgress = 0;
        if (this.bar) {
            this.bar.progress = 0;
        }
        this.updateRunnerPosition();
        this.updatePercent();
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    protected onProgress(percent: number): void {
        this.targetProgress = Math.min(1, Math.max(0, percent));
        if (this.bar) {
            this.bar.progress = this.targetProgress;
        }
    }

    protected update(dt: number): void {
        if (Math.abs(this.targetProgress - this.visualProgress) < 0.001) {
            this.visualProgress = this.targetProgress;
        } else {
            const smoothing = 1 - Math.pow(0.002, dt);
            this.visualProgress += (this.targetProgress - this.visualProgress) * smoothing;
        }
        this.updateRunnerPosition();
        this.updatePercent();
    }

    private updateRunnerPosition(): void {
        if (!this.runner) {
            return;
        }
        const limit = this.trackLength * 0.5 - this.runnerHalfWidth - 2;
        const x = this.runnerBaseX - limit + this.visualProgress * limit * 2;
        this.runner.setPosition(x, this.runnerBaseY, 0);
    }

    private updatePercent(): void {
        if (this.percentLabel) {
            this.percentLabel.string = `${Math.round(this.visualProgress * 100)}%`;
        }
    }

    protected onComplete(): void {
        this.node.parent = null;
    }
}
