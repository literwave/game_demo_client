import { _decorator, Camera, Color, Component, EffectAsset, Graphics, Material, Node, resources, Sprite, SpriteFrame, UITransform, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CloudBackdrop')
export default class CloudBackdrop extends Component {
    @property([Node])
    clouds: Node[] = [];

    @property(Node)
    followCamera: Node = null;

    @property
    driftSpeed: number = 10;

    @property
    viewWidth: number = 1600;

    protected _speeds: number[] = [];
    protected _halfSpan: number = 800;
    private _halfHeight: number = 450;
    private _cameraX: number = 0;
    private _cameraY: number = 0;
    private _camera: Camera = null;
    private _fog: Graphics = null;
    private _fogTexture: Node = null;
    private _layoutWidth: number = 0;
    private _layoutHeight: number = 0;
    private readonly _parallax = 0.35;
    private _cloudMaterial: Material = null;
    private _cloudFrames: SpriteFrame[] = [];

    protected onLoad(): void {
        this.resolveCamera();
        this._camera = this.followCamera?.getComponent(Camera);
        this._cameraX = this.followCamera?.position.x ?? 0;
        this._cameraY = this.followCamera?.position.y ?? 0;
        const base = this.node.getChildByName('FogBase');
        if (base) {
            // 原占位 Sprite 会显示缺图标记，底色用纯色绘制并随视口铺满。
            const sprite = base.getComponent(Sprite);
            if (sprite) sprite.enabled = false;
            // 一个节点只能保留一个 UI 渲染组件，填色放到独立子节点。
            const fill = base.getChildByName('FogFill') || new Node('FogFill');
            fill.layer = base.layer;
            if (!fill.parent) base.addChild(fill);
            this._fog = fill.getComponent(Graphics) || fill.addComponent(Graphics);
        }
        this._fogTexture = this.node.getChildByName('FogTexture');
        const textureSprite = this._fogTexture?.getComponent(Sprite);
        if (textureSprite) textureSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        for (let i = 0; i < this.clouds.length; i++) {
            // 同一风向、低速漂移，避免交错反向运动造成拖动错觉。
            this._speeds[i] = this.driftSpeed * (0.18 + (i % 5) * 0.035);
            const sprite = this.clouds[i]?.getComponent(Sprite);
            if (sprite) sprite.color = new Color(232, 229, 211, 255);
        }
        this.updateCoverage();
        this.loadSoftEdges();
    }

    protected onDestroy(): void {
        this._cloudMaterial?.destroy();
        this._cloudFrames.forEach(frame => frame.destroy());
    }

    private loadSoftEdges(): void {
        resources.load('effects/map-cloud', EffectAsset, (error, effect) => {
            if (!this.isValid || !this.node.isValid) return;
            if (error) {
                console.warn('CloudBackdrop: 云层柔边材质加载失败', error);
                return;
            }
            const material = new Material();
            material.initialize({ effectAsset: effect });
            this._cloudMaterial = material;
            const frames = new Map<unknown, SpriteFrame>();
            for (const node of [...this.clouds, this._fogTexture]) {
                const sprite = node?.getComponent(Sprite);
                const source = sprite?.spriteFrame;
                if (!source) continue;
                // 独立帧使用整张云纹理，柔边 UV 不受动态合图、裁边影响；共享原图不做修改。
                const texture = source.original?._texture || source.texture;
                let frame = frames.get(texture);
                if (!frame) {
                    frame = new SpriteFrame();
                    frame.texture = texture;
                    frame.packable = false;
                    frames.set(texture, frame);
                    this._cloudFrames.push(frame);
                }
                sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                sprite.spriteFrame = frame;
                sprite.customMaterial = material;
            }
        });
    }

    protected lateUpdate(dt: number): void {
        this.updateCoverage();
        let cameraDX = 0;
        let cameraDY = 0;
        if (this.followCamera && this.followCamera.isValid) {
            const position = this.followCamera.position;
            cameraDX = (position.x - this._cameraX) * this._parallax;
            cameraDY = (position.y - this._cameraY) * this._parallax;
            this._cameraX = position.x;
            this._cameraY = position.y;
            this.node.setPosition(position.x, position.y, this.node.position.z);
        }

        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];
            if (!cloud || !cloud.isValid) {
                continue;
            }

            const transform = cloud.getComponent(UITransform);
            const width = transform ? transform.width * Math.abs(cloud.scale.x) : 200;
            const height = transform ? transform.height * Math.abs(cloud.scale.y) : 100;
            // 完全离开视口后才循环，保留越界余量，快速拖动与定位也不会堆在同一边。
            const x = this.wrap(cloud.position.x + this._speeds[i] * Math.min(dt, 0.1) - cameraDX,
                this._halfSpan + width * 0.5 + 32);
            const y = this.wrap(cloud.position.y - cameraDY, this._halfHeight + height * 0.5 + 32);
            cloud.setPosition(x, y, cloud.position.z);
        }
    }

    private wrap(value: number, limit: number): number {
        if (value >= -limit && value <= limit) return value;
        const period = limit * 2;
        return ((value + limit) % period + period) % period - limit;
    }

    private updateCoverage(): void {
        const visible = view.getVisibleSize();
        const height = this._camera ? this._camera.orthoHeight * 2 : visible.height;
        const width = height * visible.width / Math.max(1, visible.height);
        this._halfSpan = width * 0.5;
        this._halfHeight = height * 0.5;
        if (width === this._layoutWidth && height === this._layoutHeight) return;
        this._layoutWidth = width;
        this._layoutHeight = height;
        this.node.getComponent(UITransform)?.setContentSize(width, height);
        if (this._fog) {
            const w = width + 256;
            const h = height + 256;
            this._fog.node.getComponent(UITransform).setContentSize(w, h);
            this._fog.clear();
            this._fog.fillColor = new Color(173, 184, 176, 255);
            this._fog.rect(-w * 0.5, -h * 0.5, w, h);
            this._fog.fill();
        }
        this._fogTexture?.getComponent(UITransform)?.setContentSize(width + 256, height + 256);
    }

    private resolveCamera(): void {
        if (this.followCamera && this.followCamera.isValid) {
            return;
        }

        let current = this.node.parent;
        while (current) {
            const cameraNode = current.getChildByName('Map Camera');
            if (cameraNode) {
                this.followCamera = cameraNode;
                return;
            }
            current = current.parent;
        }
    }
}
