import { _decorator, Color, Graphics, Node, UITransform, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

import ResLogic from "./entries/ResLogic";
import MapBaseLayerLogic from "./MapBaseLayerLogic";
import { MapResData, MapResType } from "./MapProxy";
import MapUtil from "./MapUtil";

@ccclass('MapResLogic')
export default class MapResLogic extends MapBaseLayerLogic {
    private overview = false;
    private overviewGraphics: Graphics = null;

    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    public setItemData(item: Node, data: any): void {
        let resData: MapResData = data as MapResData;
        let position: Vec2 = MapUtil.mapCellToPixelPoint(new Vec2(resData.x, resData.y));
        item.setPosition(new Vec3(position.x, position.y, 0));
        item.getComponent(ResLogic).setResourceData(resData);
        item.active = !this.overview || data.type === MapResType.SYS_FORTRESS;
    }

    public addItem(areaIndex: number, data: any): Node {
        if (this.overview && data.type >= MapResType.WOOD && data.type <= MapResType.GRAIN) return null;
        return super.addItem(areaIndex, data);
    }

    /** 远景合并为一层资源色标，不为每一格新建高细节 Sprite；城池、要塞和领地保留。 */
    public refreshOverview(enabled: boolean): void {
        this.overview = enabled;
        for (const items of this._itemMap.values()) for (const [id, node] of items) {
            node.active = !enabled || this._cmd.proxy.getResData(id)?.type === MapResType.SYS_FORTRESS;
        }
        if (this.overviewGraphics) this.overviewGraphics.node.active = false;

    }
}
