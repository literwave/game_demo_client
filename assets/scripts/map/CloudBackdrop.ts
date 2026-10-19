import { _decorator, Camera, Component, Node, UITransform, view } from 'cc';
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

    protected onLoad(): void {
        this.resolveCamera();

        const visibleSize = view.getVisibleSize();
        const camera = this.followCamera ? this.followCamera.getComponent(Camera) : null;
        const visibleHeight = camera ? camera.orthoHeight * 2 : visibleSize.height;
        const aspect = visibleSize.height > 0 ? visibleSize.width / visibleSize.height : 16 / 9;
        this._halfSpan = Math.max(this.viewWidth * 0.5, visibleHeight * aspect * 0.5 + 120);

        for (let i = 0; i < this.clouds.length; i++) {
            const direction = i % 2 === 0 ? 1 : -1;
            this._speeds[i] = this.driftSpeed * (0.55 + Math.random() * 0.9) * direction;
        }
    }

    protected lateUpdate(dt: number): void {
        if (this.followCamera && this.followCamera.isValid) {
            const position = this.followCamera.position;
            this.node.setPosition(position.x, position.y, this.node.position.z);
        }

        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];
            if (!cloud || !cloud.isValid) {
                continue;
            }

            const transform = cloud.getComponent(UITransform);
            const width = transform ? transform.width * Math.abs(cloud.scale.x) : 200;
            const wrapLimit = this._halfSpan + width * 0.5;
            let x = cloud.position.x + this._speeds[i] * dt;
            if (x > wrapLimit) {
                x = -wrapLimit;
            } else if (x < -wrapLimit) {
                x = wrapLimit;
            }
            cloud.setPosition(x, cloud.position.y, cloud.position.z);
        }
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
