import { _decorator, Component, Node, Sprite, SpriteFrame, Label, UIOpacity, tween, Tween, Vec3, resources, Prefab, instantiate, director, Canvas, Button, Layers } from 'cc';
import { EventMgr } from "../utils/EventMgr";
import { LogicEvent } from "../common/LogicEvent";
import ConfigManager from "../core/ConfigManager";

const { ccclass } = _decorator;

export interface RewardInfo {
    rewardType: number;
    itemId: number;
    itemCount: number;
}

const RESOURCE_NAMES: { [key: number]: string } = {
    1: "粮食",
    2: "木材",
    3: "铁矿",
    4: "令牌",
};

const RESOURCE_ICONS: { [key: number]: string } = {
    1: "grain",
    2: "wood",
    3: "iron",
    4: "token",
};

@ccclass('RewardWindowLogic')
export default class RewardWindowLogic extends Component {
    private static _current: RewardWindowLogic | null = null;
    private static _loading = false;
    private static _queue: RewardInfo[][] = [];
    private static _inited = false;

    /** 放在启动流程里调用一次，监听奖励展示事件 */
    public static init(): void {
        if (this._inited) {
            return;
        }
        this._inited = true;
        EventMgr.on(LogicEvent.showReward, this.onShowReward, this);
    }

    private static onShowReward(list: RewardInfo[]): void {
        this.show(list);
    }

    public static show(list: RewardInfo[]): void {
        if (!list || !list.length) {
            return;
        }
        if (this._current && this._current.isValid) {
            this._current.play(list, this._current.node.active);
            return;
        }
        if (this._loading) {
            this._queue.push(list);
            return;
        }

        this._loading = true;
        resources.load('prefab/RewardWindow', Prefab, (error: Error, prefab: Prefab) => {
            this._loading = false;
            if (error || !prefab) {
                console.error('RewardWindow prefab load failed:', error);
                return;
            }
            const node = instantiate(prefab);
            const canvas = director.getScene()?.getComponentInChildren(Canvas);
            const parent = canvas ? canvas.node : director.getScene();
            if (!parent) {
                node.destroy();
                return;
            }
            parent.addChild(node);
            node.setPosition(0, 0, 0);
            const mapUI = parent.getChildByName('MapUIScene');
            this.applyLayer(node, mapUI ? mapUI.layer : Layers.Enum.UI_3D);

            const logic = node.getComponent(RewardWindowLogic);
            if (!logic) {
                node.destroy();
                return;
            }
            this._current = logic;
            logic.play(list, false);

            while (this._queue.length) {
                const next = this._queue.shift();
                if (next) {
                    logic.play(next, true);
                }
            }
        });
    }

    private static applyLayer(node: Node, layer: number): void {
        node.layer = layer;
        for (const child of node.children) {
            this.applyLayer(child, layer);
        }
    }

    private rewards: RewardInfo[] = [];
    private content: Node | null = null;
    private templateNode: Node | null = null;
    private panel: Node | null = null;
    private confirm: Node | null = null;
    private opacity: UIOpacity | null = null;

    protected onLoad(): void {
        this.opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        this.panel = this.node.getChildByPath('Panel');
        this.confirm = this.node.getChildByPath('Panel/Confirm');
        this.content = this.node.getChildByPath('Panel/Content');
        this.templateNode = this.content ? this.content.getChildByName('ItemTemplate') : null;
        if (this.templateNode) {
            this.templateNode.active = false;
        }
        if (this.confirm) {
            this.confirm.on(Button.EventType.CLICK, this.onConfirm, this);
        }
        this.node.active = false;
    }

    protected onDestroy(): void {
        if (RewardWindowLogic._current === this) {
            RewardWindowLogic._current = null;
        }
    }

    public play(list: RewardInfo[], append: boolean): void {
        this.rewards = append ? this.rewards.concat(list) : list.slice();
        this.node.active = true;
        if (this.node.parent) {
            this.node.setSiblingIndex(this.node.parent.children.length - 1);
        }
        this.buildItems();

        if (this.opacity) {
            Tween.stopAllByTarget(this.opacity);
            this.opacity.opacity = 0;
            tween(this.opacity).to(0.18, { opacity: 255 }).start();
        }
        if (this.panel) {
            Tween.stopAllByTarget(this.panel);
            this.panel.setScale(0.94, 0.94, 1);
            tween(this.panel).to(0.26, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
        }
    }

    private onConfirm(): void {
        if (this.opacity) {
            tween(this.opacity).to(0.14, { opacity: 0 }).call(() => {
                this.node.active = false;
            }).start();
        } else {
            this.node.active = false;
        }
    }

    private buildItems(): void {
        if (!this.content || !this.templateNode) {
            return;
        }
        for (const child of this.content.children.slice()) {
            if (child !== this.templateNode) {
                child.destroy();
            }
        }

        const list = this.rewards.slice(0, 8);
        if (this.rewards.length > 8) {
            console.warn('RewardWindow only shows first 8 rewards, total:', this.rewards.length);
        }
        const rows = Math.ceil(list.length / 4);
        const cellW = 110;
        const cellH = 108;
        const gapX = 10;
        const gapY = 8;

        for (let i = 0; i < list.length; i++) {
            const cell = instantiate(this.templateNode);
            cell.active = true;
            cell.parent = this.content;

            const row = Math.floor(i / 4);
            const col = i % 4;
            const countInRow = Math.min(4, list.length - row * 4);
            const rowWidth = countInRow * cellW + (countInRow - 1) * gapX;
            const x = -rowWidth / 2 + cellW / 2 + col * (cellW + gapX);
            const totalHeight = rows * cellH + (rows - 1) * gapY;
            const y = totalHeight / 2 - cellH / 2 - row * (cellH + gapY);

            cell.setPosition(x, y, 0);
            this.fillCell(cell, list[i]);
        }
    }

    private fillCell(cell: Node, info: RewardInfo): void {
        const countLabel = cell.getChildByName('Count')?.getComponent(Label);
        if (countLabel) {
            countLabel.string = `×${info.itemCount || 0}`;
        }
        const nameLabel = cell.getChildByName('Name')?.getComponent(Label);
        if (nameLabel) {
            nameLabel.string = this.getRewardName(info);
        }
        const icon = cell.getChildByName('Icon')?.getComponent(Sprite);
        if (!icon) {
            return;
        }
        icon.node.active = false;
        const path = this.getIconPath(info);
        if (!path) {
            return;
        }
        resources.load(path, SpriteFrame, (error: Error, frame: SpriteFrame) => {
            if (error || !frame || !icon.isValid) {
                return;
            }
            icon.spriteFrame = frame;
            icon.node.active = true;
        });
    }

    private getIconPath(info: RewardInfo): string {
        if (info.rewardType === 3) {
            return `hero/${this.getHeroResource(info.itemId)}/spriteFrame`;
        }
        const iconName = RESOURCE_ICONS[info.itemId];
        if (info.rewardType === 1 && iconName) {
            return `ui/resource_icons/icon_${iconName}/spriteFrame`;
        }
        return '';
    }

    private getRewardName(info: RewardInfo): string {
        if (info.rewardType === 3) {
            const hero = this.getHeroConfig(info.itemId);
            return (hero && hero.name) || `武将 ${info.itemId}`;
        }
        if (info.rewardType === 1) {
            return RESOURCE_NAMES[info.itemId] || "资源";
        }
        if (info.rewardType === 2 || info.rewardType === 4) {
            return "道具";
        }
        return "奖励";
    }

    private getHeroResource(heroId: number): string {
        const hero = this.getHeroConfig(heroId);
        if (hero && hero.Resources) {
            return String(hero.Resources).split('.')[0];
        }
        return `card_${heroId}`;
    }

    private getHeroConfig(heroId: number): any {
        const heroes = ConfigManager.getInstance().getConfig("Hero");
        if (!Array.isArray(heroes)) {
            return null;
        }
        return heroes.find((cfg: any) => cfg && cfg.Id === heroId) || null;
    }
}
