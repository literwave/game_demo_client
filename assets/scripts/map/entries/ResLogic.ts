import { _decorator, Color, Component, Graphics, Node, Sprite, UITransform } from 'cc';
import { MapResData, MapResType } from '../MapProxy';
import WorldMapArt from '../WorldMapArt';
import WorldCampaign from '../WorldCampaign';
import MapUtil from '../MapUtil';
import { resourceFootprint } from '../ResourceFootprint';
import { caption, ManagementColors } from '../ui/ManagementStyle';
import { Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ResLogic')
export default class ResLogic extends Component {
    @property(Sprite)
    spr: Sprite = null;
    protected _data: MapResData = null;

    public setResourceData(data: MapResData): void {
        this._data = data;
        const art = { [MapResType.WOOD]: 'forest', [MapResType.IRON]: 'iron',
            [MapResType.STONE]: 'quarry', [MapResType.GRAIN]: 'grain', [MapResType.SYS_FORTRESS]: 'fort' }[data.type];
        if (!art) { this.spr.spriteFrame = null; return; }
        const level = Math.min(9, Math.max(1, data.level));
        const wild = level <= 3 && data.type !== MapResType.SYS_FORTRESS;
        const width = data.type === MapResType.SYS_FORTRESS ? 138 : wild ? 60 + level * 8 : 80 + level * 5;
        WorldMapArt.apply(this.spr, wild ? 'wild_' + art : art, width);
        this.spr.color = wild ? new Color(225, 229, 212, 245) : new Color(238, 237, 220, 255);
        if (data.type >= MapResType.WOOD && data.type <= MapResType.GRAIN) {
            const frame = this.spr.spriteFrame;
            const size = resourceFootprint(frame.originalSize.width, frame.originalSize.height,
                MapUtil.tileSize.width, MapUtil.tileSize.height, level);
            // 资源图片完整收进单格，不让树冠/矿堆穿出选中边界；不裁切原图。
            this.spr.trim = false;
            this.spr.node.getComponent(UITransform).setContentSize(size.width, size.height);
            this.spr.node.getComponent(UITransform).setAnchorPoint(.5, .5);
            this.spr.node.setPosition(0, 0, 0);
            this.spr.node.setScale(1, 1, 1);
            this.hideLegacyDecorations();
        } else {
            for (const name of ['ResourceRank', 'ResourceGrade', 'ResourceCluster0', 'ResourceCluster1', 'ResourceCluster2']) {
                const old = this.node.getChildByName(name); if (old) old.active = false;
            }
            this.spr.trim = true;
            this.spr.node.getComponent(UITransform).setAnchorPoint(.5, .25);
            this.spr.node.setPosition(0, -3, 0);
        }
        const gate = WorldCampaign.gateAt(data.x, data.y);
        const title = this.node.getChildByName('CampaignGateName');
        if (title) title.active = !!gate;
        if (title) title.active = false;
    }

    private hideLegacyDecorations(): void {
        for (const name of ['ResourceRank', 'ResourceGrade', 'ResourceCluster0', 'ResourceCluster1', 'ResourceCluster2']) {
            const node = this.node.getChildByName(name); if (node) node.active = false;
        }
    }

}
