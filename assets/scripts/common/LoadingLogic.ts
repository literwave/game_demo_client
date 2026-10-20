import { _decorator, Animation, Component, instantiate, Label, Node, Prefab, ProgressBar, Sprite, SpriteFrame, tween, UIOpacity, UITransform } from 'cc';
import { CoreEvent } from '../core/CoreEvent';
import { EventMgr } from '../utils/EventMgr';

const { ccclass, property } = _decorator;

const RUNNER_SOURCE_WIDTH = 160;
const RUNNER_SOURCE_HEIGHT = 120;
const RUNNER_DISPLAY_HEIGHT = 96;
const RUNNER_FPS = 15;
/** runnerFrames 前 8 帧是奔跑循环，其后是突刺动作帧 */
const RUNNER_RIDE_FRAMES = 8;

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

    /** 逐帧奔跑素材，随预制体一起加载，避免开头等待 */
    @property([SpriteFrame])
    runnerFrames: SpriteFrame[] = [];

    private targetProgress = 0;
    private visualProgress = 0;
    private trackLength = 1000;
    private trackCenterX = 0;
    private trackTopY = 0;
    private runnerHalfWidth = 50;
    private runnerBaseY = -55;
    private runnerSprite: Sprite | null = null;
    private rideFrames: SpriteFrame[] = [];
    private actionFrames: SpriteFrame[] = [];
    private frameIndex = 0;
    private animElapsed = 0;
    private actionIndex = 0;
    private actionPlaying = false;
    private actionTimer = 4;
    private runnerClock = 0;
    private runnerReady = false;
    private stageLabel: Label | null = null;
    private finishing = false;

    protected onLoad(): void {
        if (this.bar) {
            this.bar.progress = 0;
            const barNode = this.bar.node;
            const trackTransform = barNode.getComponent(UITransform);
            this.trackLength = trackTransform?.width ?? this.trackLength;
            const trackHeight = trackTransform?.height ?? 20;
            const trackPosition = barNode.position;
            this.trackCenterX = trackPosition.x;
            this.trackTopY = trackPosition.y + trackHeight * 0.5;
        }

        if (this.runner) {
            this.runnerSprite = this.runner.getComponent(Sprite);
        } else {
            this.createRunnerNode();
        }

        this.bindRunnerFrames();
        this.updateRunnerPosition();
        this.updatePercent();

        const stageNode = this.node.getChildByName('StageLabel');
        this.stageLabel = stageNode ? stageNode.getComponent(Label) : null;

        EventMgr.on(CoreEvent.loadProgress, this.onProgress, this);
        EventMgr.on(CoreEvent.loadComplete, this.onComplete, this);
    }

    protected onEnable(): void {
        this.targetProgress = 0;
        this.visualProgress = 0;
        this.runnerClock = 0;
        this.frameIndex = 0;
        this.animElapsed = 0;
        this.actionIndex = 0;
        this.actionPlaying = false;
        this.actionTimer = this.nextActionDelay();
        if (this.runnerSprite && this.rideFrames.length > 0) {
            this.runnerSprite.spriteFrame = this.rideFrames[0];
        }
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
        if (this.finishing) {
            return;
        }
        const next = Math.min(1, Math.max(0, percent));
        this.targetProgress = Math.max(this.targetProgress, next);
    }

    protected update(dt: number): void {
        const step = Math.min(dt, 0.1);
        this.runnerClock += step;
        this.advanceRunner(step);

        if (!this.finishing) {
            const diff = this.targetProgress - this.visualProgress;
            if (diff > 0.0005) {
                const ease = 1 - Math.exp(-step / 0.12);
                this.visualProgress = Math.min(this.targetProgress, this.visualProgress + diff * ease);
                this.updatePercent();
            }
            if (this.bar && Math.abs(this.bar.progress - this.visualProgress) > 0.0005) {
                this.bar.progress = this.visualProgress;
            }
        }

        this.updateRunnerPosition();
    }

    /** 逐帧奔跑与身体起伏独立于加载进度，进度停滞时也不会僵住 */
    private advanceRunner(dt: number): void {
        if (!this.runnerReady || !this.runnerSprite || this.rideFrames.length < 2) {
            return;
        }
        this.animElapsed += dt;
        const frameTime = 1 / RUNNER_FPS;
        while (this.animElapsed >= frameTime) {
            this.animElapsed -= frameTime;
            if (this.actionPlaying) {
                this.actionIndex += 1;
                if (this.actionIndex >= this.actionFrames.length) {
                    this.actionPlaying = false;
                    this.actionIndex = 0;
                    this.frameIndex = 0;
                    this.actionTimer = this.nextActionDelay();
                    this.runnerSprite.spriteFrame = this.rideFrames[0];
                } else {
                    this.runnerSprite.spriteFrame = this.actionFrames[this.actionIndex];
                }
            } else {
                this.frameIndex = (this.frameIndex + 1) % this.rideFrames.length;
                this.runnerSprite.spriteFrame = this.rideFrames[this.frameIndex];
                this.actionTimer -= frameTime;
                if (this.actionTimer <= 0 && this.actionFrames.length > 0) {
                    this.actionPlaying = true;
                    this.actionIndex = 0;
                    this.runnerSprite.spriteFrame = this.actionFrames[0];
                }
            }
        }
    }

    /** 隔一段时间突刺一次，避免动作循环过于频繁 */
    private nextActionDelay(): number {
        return 3.2 + Math.random() * 3.0;
    }

    private createRunnerNode(): void {
        const node = new Node('runner');
        node.layer = this.node.layer;
        const transform = node.addComponent(UITransform);
        transform.setContentSize(RUNNER_SOURCE_WIDTH, RUNNER_SOURCE_HEIGHT);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.trim = false;
        node.setParent(this.node);
        node.setSiblingIndex(this.node.children.length - 1);

        this.runner = node;
        this.runnerSprite = sprite;
    }

    /** 素材已随预制体序列化，加载页首帧即可直接开始播放 */
    private bindRunnerFrames(): void {
        const frames = (this.runnerFrames || []).filter((frame) => !!frame);
        if (!this.runner || !this.runnerSprite || frames.length === 0) {
            this.useFallbackRunner();
            return;
        }

        const sorted = frames.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        const rideCount = sorted.length > 1 ? Math.min(RUNNER_RIDE_FRAMES, sorted.length) : 1;
        this.rideFrames = sorted.slice(0, rideCount);
        this.actionFrames = sorted.length > rideCount ? sorted.slice(rideCount) : [];
        const scale = RUNNER_DISPLAY_HEIGHT / RUNNER_SOURCE_HEIGHT;
        this.runner.setScale(scale, scale, 1);
        this.runner.getComponent(UITransform)?.setContentSize(RUNNER_SOURCE_WIDTH, RUNNER_SOURCE_HEIGHT);
        this.runnerSprite.spriteFrame = this.rideFrames[0];
        this.frameIndex = 0;
        this.animElapsed = 0;
        this.actionIndex = 0;
        this.actionPlaying = false;
        this.actionTimer = this.nextActionDelay();
        this.runnerReady = true;
        this.measureRunner();
        this.updateRunnerPosition();
    }

    /** 素材缺失时退回旧预制体，避免加载页空一块 */
    private useFallbackRunner(): void {
        if (!this.runnerPrefab || !this.runner) {
            return;
        }
        const legacy = instantiate(this.runnerPrefab);
        legacy.name = 'runner';
        legacy.layer = this.node.layer;
        legacy.setParent(this.node);
        legacy.setSiblingIndex(this.node.children.length - 1);
        this.runner.destroy();
        this.runner = legacy;
        this.runnerSprite = null;
        this.runnerReady = false;
        this.measureRunner();
        this.updateRunnerPosition();
        const animation = legacy.getComponent(Animation);
        if (animation) {
            animation.play('qb_run_r');
        }
    }

    private measureRunner(): void {
        if (!this.runner) {
            return;
        }
        const transform = this.runner.getComponent(UITransform);
        const width = transform?.width ?? RUNNER_SOURCE_WIDTH;
        const height = transform?.height ?? RUNNER_SOURCE_HEIGHT;
        const scaleX = Math.abs(this.runner.scale.x) || 1;
        const scaleY = Math.abs(this.runner.scale.y) || 1;
        this.runnerHalfWidth = width * scaleX * 0.5;
        this.runnerBaseY = this.trackTopY + height * scaleY * 0.5 + 4;
    }

    private updateRunnerPosition(): void {
        if (!this.runner) {
            return;
        }
        const limit = Math.max(12, this.trackLength * 0.5 - this.runnerHalfWidth - 2);
        const sway = this.runnerReady ? Math.sin(this.runnerClock * 2.1) * 1.8 : 0;
        const bob = this.runnerReady ? Math.sin(this.runnerClock * 8.4) * 1.2 : 0;
        const x = this.trackCenterX - limit + this.visualProgress * limit * 2 + sway;
        this.runner.setPosition(x, this.runnerBaseY + bob, 0);
        this.runner.angle = this.runnerReady ? Math.sin(this.runnerClock * 5.6) * 1.2 : 0;
    }

    private updatePercent(): void {
        if (this.percentLabel) {
            this.percentLabel.string = `${Math.round(this.visualProgress * 100)}%`;
        }
    }

    protected onComplete(): void {
        if (this.finishing) {
            return;
        }
        this.targetProgress = 1;
        if (this.stageLabel) {
            this.stageLabel.string = '战场已就绪，正在展开山河…';
        }
    }

    /** 地图首帧已经在加载页后完成渲染，淡出并销毁加载页 */
    public finish(): void {
        if (this.finishing) {
            return;
        }
        this.finishing = true;
        this.targetProgress = 1;
        this.visualProgress = 1;
        if (this.bar) {
            this.bar.progress = 1;
        }
        this.updateRunnerPosition();
        this.updatePercent();
        if (this.stageLabel) {
            this.stageLabel.string = '山河已就绪';
        }
        const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        tween(opacity).to(0.35, { opacity: 0 }, { easing: 'quadOut' }).call(() => {
            if (this.node && this.node.isValid) {
                this.node.destroy();
            }
        }).start();
    }
}