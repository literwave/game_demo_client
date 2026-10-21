import {
    _decorator,
    assetManager,
    BlockInputEvents,
    Button,
    Camera,
    Canvas,
    Color,
    Component,
    director,
    EventKeyboard,
    Graphics,
    input,
    Input,
    instantiate,
    KeyCode,
    Label,
    Layers,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    Tween,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import { EventMgr } from '../utils/EventMgr';
import SystemOpenCommand from './SystemOpenCommand';
import { SystemOpenConfig } from './SystemOpenProxy';

const { ccclass } = _decorator;

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;
const EMBLEM_Y = 280;

const GOLD = new Color(238, 204, 142, 255);
const GOLD_BRIGHT = new Color(255, 229, 177, 255);
const IVORY = new Color(247, 236, 214, 255);
const MUTED = new Color(183, 164, 132, 255);
const DIM = new Color(133, 116, 88, 255);

interface UnlockAssets {
    panel: SpriteFrame | null;
    ribbon: SpriteFrame | null;
    button: SpriteFrame | null;
    star: SpriteFrame | null;
    glow: SpriteFrame | null;
    rays: SpriteFrame | null;
    ring: SpriteFrame | null;
    seal: SpriteFrame | null;
    spark: SpriteFrame | null;
}

@ccclass('SystemUnlockWindow')
export default class SystemUnlockWindow extends Component {
    private static _current: SystemUnlockWindow | null = null;
    private static _queue: SystemOpenConfig[] = [];
    private static _assets: UnlockAssets | null = null;
    private static _assetLoading: boolean = false;
    private static _assetWaiters: Array<(assets: UnlockAssets) => void> = [];
    private static _inited: boolean = false;

    public static init(): void {
        if (this._inited) {
            return;
        }
        this._inited = true;
        EventMgr.on(LogicEvent.systemUnlock, this.onSystemUnlock, this);
    }

    public static reset(): void {
        this._queue.length = 0;
        if (this._current && this._current.node && this._current.node.isValid) {
            this._current.node.destroy();
        }
        this._current = null;
    }

    private static onSystemUnlock(systemId: number): void {
        const id = Number(systemId);
        if (!id) {
            return;
        }
        const command = SystemOpenCommand.getInstance();
        const config = command.getConfig(id);
        if (config) {
            this.enqueue(config);
            return;
        }
        command.whenConfigReady(() => {
            const resolved = command.getConfig(id) || {
                Id: id,
                Name: "新系统",
                Desc: "新的功能已向你开放",
                Cond: [],
            };
            this.enqueue(resolved);
        });
    }

    private static enqueue(config: SystemOpenConfig): void {
        this._queue.push(config);
        this.pump();
    }

    private static pump(): void {
        if (this._current || this._queue.length == 0) {
            return;
        }
        const config = this._queue.shift();
        if (!config) {
            return;
        }
        this.ensureAssets((assets) => {
            if (config && !this._current) {
                this.spawn(config, assets);
            }
        });
    }

    private static spawn(config: SystemOpenConfig, assets: UnlockAssets): void {
        const parent = this.resolveParent();
        if (!parent) {
            console.warn("System unlock skipped: Canvas not found");
            return;
        }

        const layer = this.resolveUILayer(parent);
        const node = new Node("SystemUnlockWindow");
        node.layer = layer;
        parent.addChild(node);
        node.setPosition(0, 0, 0);
        node.setSiblingIndex(parent.children.length - 1);

        const transform = node.addComponent(UITransform);
        transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        node.addComponent(UIOpacity);

        const logic = node.addComponent(SystemUnlockWindow);
        this._current = logic;
        logic.play(config, assets, () => {
            if (this._current === logic) {
                this._current = null;
            }
            this.pump();
        });
    }

    private static resolveParent(): Node | null {
        const canvas = director.getScene() && director.getScene().getComponentInChildren(Canvas);
        return canvas ? canvas.node : null;
    }

    private static resolveUILayer(parent: Node): number {
        const sceneLayers = [parent.getChildByName("MapUIScene"), parent.getChildByName("LoginScene")];
        for (const sceneNode of sceneLayers) {
            if (sceneNode && sceneNode.layer) {
                return sceneNode.layer;
            }
        }

        const cameraNode = parent.getChildByName("UI Camera");
        const camera = cameraNode ? cameraNode.getComponent(Camera) : null;
        if (camera) {
            for (const child of parent.children) {
                if (child.layer && (camera.visibility & child.layer) !== 0) {
                    return child.layer;
                }
            }
            for (const layer of [Layers.Enum.UI_2D, Layers.Enum.UI_3D, Layers.Enum.DEFAULT]) {
                if ((camera.visibility & layer) !== 0) {
                    return layer;
                }
            }
        }
        return Layers.Enum.UI_2D;
    }

    private static ensureAssets(callback: (assets: UnlockAssets) => void): void {
        if (this._assets) {
            callback(this._assets);
            return;
        }
        if (this._assetLoading) {
            this._assetWaiters.push(callback);
            return;
        }

        this._assetLoading = true;
        Promise.all([
            this.loadAnyFrame("ea85543b-fd4f-4bc4-887b-e29747b29a68@f9941"),
            this.loadAnyFrame("c34403af-2813-4a81-b865-f8bd30740681@f9941"),
            this.loadResourceFrame("ui/system_unlock/button_gold/spriteFrame"),
            this.loadAnyFrame("064508c8-04a6-40a6-9ae1-115fc8e94dcc@f9941"),
            this.loadResourceFrame("ui/system_unlock/glow_gold/spriteFrame"),
            this.loadResourceFrame("ui/system_unlock/rays_gold/spriteFrame"),
            this.loadResourceFrame("ui/system_unlock/ring_gold/spriteFrame"),
            this.loadResourceFrame("ui/system_unlock/seal_gold/spriteFrame"),
            this.loadResourceFrame("ui/system_unlock/spark_gold/spriteFrame"),
        ]).then((frames) => {
            const assets: UnlockAssets = {
                panel: frames[0],
                ribbon: frames[1],
                button: frames[2],
                star: frames[3],
                glow: frames[4],
                rays: frames[5],
                ring: frames[6],
                seal: frames[7],
                spark: frames[8],
            };
            this._assets = assets;
            this._assetLoading = false;
            callback(assets);
            const waiters = this._assetWaiters.slice();
            this._assetWaiters.length = 0;
            waiters.forEach((waiter) => waiter(assets));
        });
    }

    private static loadAnyFrame(uuid: string): Promise<SpriteFrame | null> {
        return new Promise((resolve) => {
            assetManager.loadAny(uuid, (error: Error, asset: any) => {
                if (error || !(asset instanceof SpriteFrame)) {
                    console.warn("System unlock sprite load failed:", uuid, error);
                    resolve(null);
                    return;
                }
                resolve(asset);
            });
        });
    }

    private static loadResourceFrame(path: string): Promise<SpriteFrame | null> {
        return new Promise((resolve) => {
            resources.load(path, SpriteFrame, (error: Error, asset: SpriteFrame) => {
                if (error || !asset) {
                    console.warn("System unlock sprite load failed:", path, error);
                    resolve(null);
                    return;
                }
                resolve(asset);
            });
        });
    }

    private _assets: UnlockAssets = null;
    private _config: SystemOpenConfig = null;
    private _onClosed: (() => void) | null = null;
    private _built: boolean = false;
    private _closing: boolean = false;
    private _shownAt: number = 0;
    private _elapsed: number = 0;
    private _idleReady: boolean = false;

    private _veil: Node = null;
    private _raysNode: Node = null;
    private _glowNode: Node = null;
    private _ringNode: Node = null;
    private _emblemNode: Node = null;
    private _panelNode: Node = null;
    private _ribbonNode: Node = null;
    private _featureNode: Node = null;
    private _descNode: Node = null;
    private _conditionNode: Node = null;
    private _confirmNode: Node = null;
    private _hintNode: Node = null;
    private _particlesNode: Node = null;
    private _sparkTemplate: Node = null;

    public play(config: SystemOpenConfig, assets: UnlockAssets, onClosed: () => void): void {
        this._config = config;
        this._assets = assets;
        this._onClosed = onClosed;
        this._closing = false;
        this._shownAt = Date.now();
        this._elapsed = 0;
        this._idleReady = false;

        if (!this._built) {
            this.build();
        }
        this.refreshText();
        this.animateIn();
    }

    protected onDestroy(): void {
        this.unscheduleAllCallbacks();
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        if (SystemUnlockWindow._current === this) {
            SystemUnlockWindow._current = null;
        }
    }

    protected update(deltaTime: number): void {
        if (!this._built || this._closing) {
            return;
        }
        this._elapsed += deltaTime;
        if (this._raysNode) {
            this._raysNode.angle -= deltaTime * 2.4;
        }
        if (this._ringNode) {
            this._ringNode.angle += deltaTime * 7.5;
        }
        if (this._idleReady && this._glowNode) {
            const scale = 1 + Math.sin(this._elapsed * 2.2) * 0.035;
            this._glowNode.setScale(scale, scale, 1);
        }
        if (this._idleReady && this._emblemNode) {
            this._emblemNode.setPosition(0, EMBLEM_Y + Math.sin(this._elapsed * 1.8) * 3, 0);
        }
    }

    private build(): void {
        this._built = true;
        const rootOpacity = this.node.getComponent(UIOpacity);
        if (rootOpacity) {
            rootOpacity.opacity = 0;
        }

        this._veil = this.createNode("Veil", this.node, DESIGN_WIDTH, DESIGN_HEIGHT, 0, 0);
        this.drawVeil(this._veil);
        this._veil.addComponent(BlockInputEvents);
        this._veil.on(Node.EventType.TOUCH_END, this.dismiss, this);
        this.node.on(Node.EventType.TOUCH_END, this.dismiss, this);

        this._raysNode = this.createSpriteNode("Rays", this.node, 820, 820, 0, EMBLEM_Y, this._assets.rays, new Color(255, 230, 181, 255));
        this.setOpacity(this._raysNode, 0);

        this._glowNode = this.createSpriteNode("Glow", this.node, 680, 680, 0, EMBLEM_Y, this._assets.glow, new Color(255, 242, 214, 255));
        this.setOpacity(this._glowNode, 0);

        this._panelNode = this.createSpriteNode("Panel", this.node, 660, 430, 0, -30, this._assets.panel, new Color(255, 235, 198, 255));
        this.drawPanelDepth(this._panelNode);

        this._ribbonNode = this.createSpriteNode("Ribbon", this._panelNode, 300, 47, 0, 180, this._assets.ribbon, GOLD_BRIGHT);
        this.createLabel("RibbonTitle", this._ribbonNode, 270, 40, 0, 1, "系统解锁", 22, GOLD_BRIGHT, true);
        this.createLabel("Kicker", this._panelNode, 380, 24, 0, 142, "S Y S T E M   U N L O C K E D", 12, MUTED, false);

        this._featureNode = this.createLabelNode("Feature", this._panelNode, 560, 62, 0, 100, "", 40, IVORY, true);
        this.drawDivider(this._panelNode, 0, 55);
        this._descNode = this.createLabelNode("Description", this._panelNode, 540, 64, 0, 10, "", 20, MUTED, false);
        const descLabel = this._descNode.getComponent(Label);
        if (descLabel) {
            descLabel.lineHeight = 28;
            descLabel.enableWrapText = true;
            descLabel.overflow = Label.Overflow.CLAMP;
        }
        this._conditionNode = this.createLabelNode("Condition", this._panelNode, 460, 28, 0, -30, "", 17, DIM, false);

        this._confirmNode = this.createSpriteNode("Confirm", this._panelNode, 196, 56, 0, -90, this._assets.button, new Color(255, 246, 220, 255));
        const confirmButton = this._confirmNode.addComponent(Button);
        confirmButton.target = this._confirmNode;
        confirmButton.transition = Button.Transition.SCALE;
        confirmButton.zoomScale = 0.95;
        confirmButton.duration = 0.08;
        this._confirmNode.on(Button.EventType.CLICK, this.onConfirmClick, this);
        this.createLabel("ConfirmLabel", this._confirmNode, 200, 50, 0, 0, "开始体验", 22, GOLD_BRIGHT, true);

        this._hintNode = this.createLabelNode("Hint", this._panelNode, 420, 26, 0, -160, "点击任意处继续", 15, MUTED, false);
        const hintOpacity = this._hintNode.addComponent(UIOpacity);
        hintOpacity.opacity = 0;

        this._emblemNode = this.createNode("Emblem", this.node, 180, 180, 0, EMBLEM_Y);
        this._ringNode = this.createSpriteNode("EmblemRing", this._emblemNode, 168, 168, 0, 0, this._assets.ring, GOLD);
        this.createSpriteNode("EmblemSeal", this._emblemNode, 104, 104, 0, 0, this._assets.seal, new Color(255, 238, 204, 255));
        this.createLabel("EmblemGlyph", this._emblemNode, 92, 92, 0, 0, "启", 46, GOLD_BRIGHT, true);

        this._particlesNode = this.createNode("Particles", this.node, DESIGN_WIDTH, DESIGN_HEIGHT, 0, 0);
        this._sparkTemplate = this.createSpriteNode("SparkTemplate", this._particlesNode, 30, 30, 0, EMBLEM_Y, this._assets.spark || this._assets.star, GOLD_BRIGHT);
        this._sparkTemplate.addComponent(UIOpacity);
        this._sparkTemplate.active = false;

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private refreshText(): void {
        const config = this._config;
        if (!config) {
            return;
        }
        const feature = this._featureNode && this._featureNode.getComponent(Label);
        if (feature) {
            feature.string = config.Name || "新系统";
        }
        const desc = this._descNode && this._descNode.getComponent(Label);
        if (desc) {
            desc.string = config.Desc || "新的功能已向你开放，快去体验吧";
        }
        const condition = this._conditionNode && this._conditionNode.getComponent(Label);
        if (condition) {
            const level = this.getConditionLevel(config);
            condition.string = level > 0 ? `已达成 Lv.${level} 解锁条件` : "功能已开放";
        }
    }

    private getConditionLevel(config: SystemOpenConfig): number {
        if (!config || !Array.isArray(config.Cond)) {
            return 0;
        }
        for (const condition of config.Cond) {
            const level = Number(condition && condition.level);
            if (level > 0) {
                return level;
            }
        }
        return 0;
    }

    private animateIn(): void {
        const rootOpacity = this.node.getComponent(UIOpacity);
        if (rootOpacity) {
            Tween.stopAllByTarget(rootOpacity);
            rootOpacity.opacity = 0;
            tween(rootOpacity).to(0.26, { opacity: 255 }).start();
        }

        if (this._raysNode) {
            const opacity = this._raysNode.getComponent(UIOpacity);
            this._raysNode.setScale(0.66, 0.66, 1);
            Tween.stopAllByTarget(this._raysNode);
            tween(this._raysNode).delay(0.06).to(0.65, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' }).start();
            if (opacity) {
                Tween.stopAllByTarget(opacity);
                opacity.opacity = 0;
                tween(opacity).delay(0.06).to(0.55, { opacity: 185 }).start();
            }
        }

        if (this._glowNode) {
            const opacity = this._glowNode.getComponent(UIOpacity);
            this._glowNode.setScale(0.55, 0.55, 1);
            Tween.stopAllByTarget(this._glowNode);
            tween(this._glowNode).delay(0.1).to(0.7, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' }).start();
            if (opacity) {
                Tween.stopAllByTarget(opacity);
                opacity.opacity = 0;
                tween(opacity).delay(0.1).to(0.55, { opacity: 215 }).start();
            }
        }

        if (this._emblemNode) {
            this._emblemNode.setScale(0.18, 0.18, 1);
            this._emblemNode.angle = -28;
            Tween.stopAllByTarget(this._emblemNode);
            tween(this._emblemNode)
                .delay(0.16)
                .to(0.55, { scale: new Vec3(1.08, 1.08, 1), angle: 0 }, { easing: 'backOut' })
                .to(0.14, { scale: new Vec3(1, 1, 1) })
                .start();
        }

        if (this._panelNode) {
            this._panelNode.setScale(0.84, 0.84, 1);
            this._panelNode.angle = -2;
            Tween.stopAllByTarget(this._panelNode);
            tween(this._panelNode)
                .delay(0.1)
                .to(0.58, { scale: new Vec3(1, 1, 1), angle: 0 }, { easing: 'backOut' })
                .start();
        }

        this.fadeScaleIn(this._ribbonNode, 0.28, 0.32, true);
        this.fadeUp(this._featureNode, 0.42, 18, 0.36);
        this.fadeUp(this._descNode, 0.56, 14, 0.34);
        this.fadeUp(this._conditionNode, 0.66, 10, 0.32);

        if (this._confirmNode) {
            this._confirmNode.setScale(0.78, 0.78, 1);
            Tween.stopAllByTarget(this._confirmNode);
            tween(this._confirmNode).delay(0.8).to(0.34, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
        }

        if (this._hintNode) {
            const hintOpacity = this._hintNode.getComponent(UIOpacity);
            if (hintOpacity) {
                Tween.stopAllByTarget(hintOpacity);
                hintOpacity.opacity = 0;
                tween(hintOpacity)
                    .delay(1.2)
                    .to(0.4, { opacity: 185 })
                    .to(1.3, { opacity: 245 })
                    .to(1.3, { opacity: 150 })
                    .union()
                    .repeatForever()
                    .start();
            }
        }

        this.scheduleOnce(() => this.spawnSparkBurst(20), 0.3);
        this.scheduleOnce(() => {
            this._elapsed = 0;
            this._idleReady = true;
        }, 0.92);
        this.schedule(this.spawnAmbientSpark, 0.22, 1000000);
    }

    private fadeScaleIn(node: Node | null, delay: number, duration: number, fromX: boolean): void {
        if (!node) {
            return;
        }
        const opacity = this.ensureOpacity(node);
        const start = fromX ? new Vec3(0.55, 0.9, 1) : new Vec3(0.92, 0.92, 1);
        node.setScale(start);
        Tween.stopAllByTarget(node);
        tween(node).delay(delay).to(duration, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
        if (opacity) {
            Tween.stopAllByTarget(opacity);
            opacity.opacity = 0;
            tween(opacity).delay(delay).to(0.25, { opacity: 255 }).start();
        }
    }

    private fadeUp(node: Node | null, delay: number, distance: number, duration: number): void {
        if (!node) {
            return;
        }
        const opacity = this.ensureOpacity(node);
        const base = node.position.clone();
        node.setPosition(base.x, base.y - distance, base.z);
        Tween.stopAllByTarget(node);
        tween(node).delay(delay).to(duration, { position: base }, { easing: 'quadOut' }).start();
        if (opacity) {
            Tween.stopAllByTarget(opacity);
            opacity.opacity = 0;
            tween(opacity).delay(delay).to(0.28, { opacity: 255 }).start();
        }
    }

    private spawnSparkBurst(count: number): void {
        for (let i = 0; i < count; i++) {
            this.spawnSpark(true);
        }
    }

    private spawnAmbientSpark(): void {
        if (this._closing) {
            return;
        }
        this.spawnSpark(false);
    }

    private spawnSpark(burst: boolean): void {
        if (!this._sparkTemplate || !this._sparkTemplate.parent) {
            return;
        }
        const spark = instantiate(this._sparkTemplate);
        spark.active = true;
        spark.parent = this._particlesNode;

        const angle = Math.random() * Math.PI * 2;
        const startRadius = burst ? 12 + Math.random() * 26 : 72 + Math.random() * 48;
        const travel = burst ? 130 + Math.random() * 185 : 34 + Math.random() * 42;
        const start = new Vec3(Math.cos(angle) * startRadius, EMBLEM_Y + Math.sin(angle) * startRadius, 0);
        const end = new Vec3(Math.cos(angle) * (startRadius + travel), EMBLEM_Y + Math.sin(angle) * (startRadius + travel) + 20, 0);
        const size = burst ? 0.16 + Math.random() * 0.28 : 0.1 + Math.random() * 0.14;
        const lifetime = burst ? 0.8 + Math.random() * 0.45 : 0.95 + Math.random() * 0.35;

        spark.setPosition(start);
        spark.setScale(size, size, 1);
        spark.angle = Math.random() * 180;
        const opacity = spark.getComponent(UIOpacity) || spark.addComponent(UIOpacity);
        opacity.opacity = 0;

        tween(spark)
            .to(lifetime, {
                position: end,
                scale: new Vec3(size * 0.25, size * 0.25, 1),
                angle: spark.angle + 70,
            }, { easing: 'quadOut' })
            .call(() => {
                if (spark.isValid) {
                    spark.destroy();
                }
            })
            .start();
        tween(opacity)
            .to(0.16, { opacity: 245 })
            .delay(Math.max(0, lifetime - 0.46))
            .to(0.3, { opacity: 0 })
            .start();
    }

    private onConfirmClick(): void {
        AudioManager.instance.playClick();
        this.dismiss();
    }

    private onKeyDown(event: EventKeyboard): void {
        if (event.keyCode === KeyCode.ENTER || event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.ESCAPE) {
            this.dismiss();
        }
    }

    private dismiss(): void {
        if (this._closing || !this.node.active) {
            return;
        }
        if (Date.now() - this._shownAt < 650) {
            return;
        }
        this._closing = true;
        this.unscheduleAllCallbacks();
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);

        const rootOpacity = this.node.getComponent(UIOpacity);
        if (rootOpacity) {
            Tween.stopAllByTarget(rootOpacity);
            tween(rootOpacity).to(0.22, { opacity: 0 }).start();
        }
        if (this._panelNode) {
            Tween.stopAllByTarget(this._panelNode);
            tween(this._panelNode).to(0.18, { scale: new Vec3(1.025, 1.025, 1) }).start();
        }
        if (this._emblemNode) {
            Tween.stopAllByTarget(this._emblemNode);
            tween(this._emblemNode).to(0.18, { scale: new Vec3(1.12, 1.12, 1) }).start();
        }
        this.scheduleOnce(this.finishClose, 0.24);
    }

    private finishClose(): void {
        const callback = this._onClosed;
        this._onClosed = null;
        if (callback) {
            callback();
        }
        if (this.node && this.node.isValid) {
            this.node.destroy();
        }
    }

    private createNode(name: string, parent: Node, width: number, height: number, x: number, y: number): Node {
        const node = new Node(name);
        node.layer = this.node.layer;
        parent.addChild(node);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);
        node.setPosition(x, y, 0);
        return node;
    }

    private createSpriteNode(name: string, parent: Node, width: number, height: number, x: number, y: number, frame: SpriteFrame | null, color: Color): Node {
        const node = this.createNode(name, parent, width, height, x, y);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.type = Sprite.Type.SIMPLE;
        sprite.spriteFrame = frame;
        sprite.color = color;
        return node;
    }

    private createLabelNode(name: string, parent: Node, width: number, height: number, x: number, y: number, text: string, fontSize: number, color: Color, bold: boolean): Node {
        const node = this.createNode(name, parent, width, height, x, y);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.ceil(fontSize * 1.28);
        label.color = color;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        if (bold) {
            label.enableOutline = true;
            label.outlineColor = new Color(18, 11, 5, 210);
            label.outlineWidth = 2;
        }
        return node;
    }

    private createLabel(name: string, parent: Node, width: number, height: number, x: number, y: number, text: string, fontSize: number, color: Color, bold: boolean): Node {
        return this.createLabelNode(name, parent, width, height, x, y, text, fontSize, color, bold);
    }

    private ensureOpacity(node: Node): UIOpacity {
        return node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
    }

    private setOpacity(node: Node, value: number): void {
        const opacity = this.ensureOpacity(node);
        opacity.opacity = value;
    }

    private drawVeil(node: Node): void {
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(6, 4, 2, 226);
        graphics.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        graphics.fill();
    }

    private drawPanelDepth(panel: Node): void {
        const shadow = this.createNode("PanelShadow", panel.parent, 692, 452, 0, -38);
        const shadowGraphics = shadow.addComponent(Graphics);
        shadowGraphics.fillColor = new Color(0, 0, 0, 160);
        shadowGraphics.roundRect(-346, -226, 692, 452, 34);
        shadowGraphics.fill();
        shadow.setSiblingIndex(panel.getSiblingIndex());

        const inner = this.createNode("PanelInner", panel, 584, 344, 0, -3);
        const innerGraphics = inner.addComponent(Graphics);
        innerGraphics.fillColor = new Color(14, 10, 6, 214);
        innerGraphics.roundRect(-292, -172, 584, 344, 18);
        innerGraphics.fill();
        innerGraphics.strokeColor = new Color(221, 180, 109, 58);
        innerGraphics.lineWidth = 1;
        innerGraphics.roundRect(-286, -166, 572, 332, 16);
        innerGraphics.stroke();
    }

    private drawDivider(parent: Node, x: number, y: number): void {
        const divider = this.createNode("Divider", parent, 380, 12, x, y);
        const graphics = divider.addComponent(Graphics);
        graphics.lineWidth = 1;
        graphics.strokeColor = new Color(218, 180, 112, 155);
        graphics.moveTo(-184, 0);
        graphics.lineTo(-18, 0);
        graphics.moveTo(18, 0);
        graphics.lineTo(184, 0);
        graphics.stroke();

        const gem = this.createNode("DividerGem", parent, 12, 12, x, y);
        const gemGraphics = gem.addComponent(Graphics);
        gemGraphics.fillColor = new Color(238, 202, 139, 210);
        gemGraphics.moveTo(0, 5);
        gemGraphics.lineTo(5, 0);
        gemGraphics.lineTo(0, -5);
        gemGraphics.lineTo(-5, 0);
        gemGraphics.close();
        gemGraphics.fill();
    }
}
