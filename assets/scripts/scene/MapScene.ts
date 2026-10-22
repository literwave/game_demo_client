import { _decorator, Component, Node, Vec2, TiledMap } from 'cc';
const { ccclass, property } = _decorator;

import MapResBuildLogic from "../map/MapResBuildLogic";
import MapBuildTipsLogic from "../map/MapBuildTipsLogic";
import MapCityLogic from "../map/MapCityLogic";
import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import MapLogic from "../map/MapLogic";
import { MapAreaData, MapResType } from "../map/MapProxy";
import MapResLogic from "../map/MapResLogic";
import MapUtil from "../map/MapUtil";
import MapFacilityBuildLogic from "../map/MapFacilityBuildLogic";
import MapBuildTagLogic from "../map/MapBuildTagLogic";
import MapSysCityLogic from "../map/MapSysCityLogic";
import { EventMgr } from '../utils/EventMgr';
import { LogicEvent } from '../common/LogicEvent';
import { CoreEvent } from '../core/CoreEvent';

interface PendingMapArea {
    id: number;
    x: number;
    y: number;
    startY: number;
    endX: number;
    endY: number;
}

@ccclass('MapScene')
export default class MapScene extends Component {
    @property(Node)
    mapLayer: Node = null;

    protected _cmd: MapCommand = null;
    protected _centerX: number = 0;
    protected _centerY: number = 0;
    protected _lastUpPosTime: number = 0;
    private _pendingAreas: PendingMapArea[] = [];
    private _initialCellTotal = 0;
    private _initialCellDone = 0;
    private _positionReady = false;
    private _warmupStarted = false;
    private _ready = false;
    private _failed = false;
    private _tiledMap: TiledMap = null;
    private _itemLayers: {
        res: MapResLogic; build: MapResBuildLogic; facility: MapFacilityBuildLogic;
        tag: MapBuildTagLogic; tips: MapBuildTipsLogic; city: MapCityLogic; sysCity: MapSysCityLogic;
    } = null;

    protected onLoad(): void {
        this._cmd = MapCommand.getInstance();
        try {
            this.initializeMap();
        } catch (error) {
            this.failInitialization(error);
        }
    }

    private initializeMap(): void {
        if (!this.mapLayer) throw new Error('地图节点缺失');
        const tiledMap = this.mapLayer.addComponent(TiledMap);
        this._tiledMap = tiledMap;
        tiledMap.tmxAsset = this._cmd.proxy.tiledMapAsset;

        MapUtil.initMapConfig(tiledMap);
        this._cmd.initData();
        EventMgr.on(LogicEvent.mapShowAreaChange, this.onMapShowAreaChange, this);
        EventMgr.on(LogicEvent.scrollToMap, this.onScrollToMap, this);

        this.scheduleOnce(() => {
            try {
                const myCity: MapCityData = this._cmd.cityProxy.getMyMainCity();
                const mapLogic = this.node.getComponent(MapLogic);
                if (!mapLogic) throw new Error('地图控制器缺失');
                mapLogic.setTiledMap(tiledMap);
                mapLogic.scrollToMapPoint(myCity ? new Vec2(myCity.x, myCity.y) : new Vec2(16, 24));
                this.onTimer();
                this._positionReady = true;
            } catch (error) {
                this.failInitialization(error);
            }
        }, 0.1);

        this.schedule(this.onTimer, 0.2);
    }

    protected update(): void {
        if (this._failed) return;
        try {
            const started = Date.now();
            let processed = 0;
            // 地块中的资源、城池、标签预制体按 16 格 / 4ms 的预算逐帧生成。
            while (this._pendingAreas.length > 0 && processed < 16 && Date.now() - started < 4) {
                const area = this._pendingAreas[0];
                this.addMapCell(area.id, area.x, area.y);
                processed++;
                if (!this._ready) this._initialCellDone++;
                area.y++;
                if (area.y >= area.endY) {
                    area.y = area.startY;
                    area.x++;
                }
                if (area.x >= area.endX) this._pendingAreas.shift();
            }
            if (!this._ready && processed > 0) {
                const progress = this._initialCellTotal > 0 ? this._initialCellDone / this._initialCellTotal : 1;
                EventMgr.emit(CoreEvent.mapLoadProgress, 0.9 + Math.min(1, progress) * 0.08, '正在部署城池与资源…');
            }
            if (this._positionReady && !this._ready && !this._warmupStarted && this._pendingAreas.length === 0) {
                this._warmupStarted = true;
                EventMgr.emit(CoreEvent.mapLoadProgress, 0.99, '正在展开山河…');
                this.warmUpMap(this._tiledMap, 3, () => {
                    this.scheduleOnce(() => {
                        if (this._failed) return;
                        if (this._pendingAreas.length > 0) {
                            this._warmupStarted = false;
                            return;
                        }
                        this._ready = true;
                        EventMgr.emit(CoreEvent.mapReady);
                    }, 0.12);
                });
            }
        } catch (error) {
            this.failInitialization(error);
        }
    }

    private failInitialization(error: unknown): void {
        this._failed = true;
        this._pendingAreas.length = 0;
        this.unscheduleAllCallbacks();
        console.error('地图节点初始化失败:', error);
        EventMgr.emit(CoreEvent.mapLoadFailed, error);
    }

    /** 进图时强制重算各图层裁剪区，避免加载页淡出后出现缺块的黑色条带 */
    protected warmUpMap(tiledMap: TiledMap, frames: number, done: () => void): void {
        const step = () => {
            try {
                if (!tiledMap || !tiledMap.isValid) throw new Error('地图预热时图层已失效');
                const layers = tiledMap.getLayers();
                for (let i = 0; i < layers.length; i++) layers[i].updateCulling();
                if (--frames <= 0) done();
            } catch (error) {
                this.failInitialization(error);
            }
        };
        // scheduleOnce 的回调内重新注册同一个函数会被本次定时器清理。
        // 使用有次数限制的 schedule，保证真正经过三帧，而非等待三秒兜底。
        this.schedule(step, 0, Math.max(0, frames - 1));
    }

    protected onDestroy(): void {
        this._pendingAreas.length = 0;
        EventMgr.targetOff(this);
        if (this._cmd) this._cmd.proxy.clearData();
        this._cmd = null;
    }

    protected onTimer(): void {

        if (this._cmd.proxy.qryAreaIds && this._cmd.proxy.qryAreaIds.length > 0) {
            let qryIndex: number = this._cmd.proxy.qryAreaIds.shift();
            let qryData: MapAreaData = this._cmd.proxy.getMapAreaData(qryIndex);
            if (qryData.checkAndUpdateQryTime()) {
                // this._cmd.qryNationMapScanBlock(qryData);
            }
        }
        let nowTime: number = Date.now();
        if (nowTime - this._lastUpPosTime > 1000) {
            this._lastUpPosTime = nowTime;
            //间隔一秒检测中心点是否改变
            let point: Vec2 = MapCommand.getInstance().proxy.getCurCenterPoint();
            if (point != null && (this._centerX != point.x || this._centerY != point.y)) {
                this._centerX = point.x;
                this._centerY = point.y;
                MapCommand.getInstance().upPosition(point.x, point.y);
            }
        }
    }

    protected onMapShowAreaChange(centerPoint: Vec2, centerAreaId: number, addIds: number[], removeIds: number[]): void {


        let resLogic: MapResLogic = this.node.getComponent(MapResLogic);
        let buildResLogic: MapResBuildLogic = this.node.getComponent(MapResBuildLogic);
        let buildFacilityLogic: MapFacilityBuildLogic = this.node.getComponent(MapFacilityBuildLogic);
        let tagLogic: MapBuildTagLogic = this.node.getComponent(MapBuildTagLogic);
        let buildTipsLogic: MapBuildTipsLogic = this.node.getComponent(MapBuildTipsLogic);
        let cityLogic: MapCityLogic = this.node.getComponent(MapCityLogic);
        let sysCityLogic: MapSysCityLogic = this.node.getComponent(MapSysCityLogic);
        this._itemLayers = { res: resLogic, build: buildResLogic, facility: buildFacilityLogic,
            tag: tagLogic, tips: buildTipsLogic, city: cityLogic, sysCity: sysCityLogic };

        //更新展示区域
        resLogic.udpateShowAreas(addIds, removeIds);
        buildResLogic.udpateShowAreas(addIds, removeIds);
        buildFacilityLogic.udpateShowAreas(addIds, removeIds);
        tagLogic.udpateShowAreas(addIds, removeIds);
        buildTipsLogic.udpateShowAreas(addIds, removeIds);
        cityLogic.udpateShowAreas(addIds, removeIds);
        sysCityLogic.udpateShowAreas(addIds, removeIds);

        // 移走的区域必须取消排队，避免分帧后又向已移除区域填充节点。
        this._pendingAreas = this._pendingAreas.filter((area) => {
            if (removeIds.indexOf(area.id) < 0) return true;
            if (!this._ready) this._initialCellTotal -= (area.endX - area.x - 1) * (area.endY - area.startY) + area.endY - area.y;
            return false;
        });
        for (const id of addIds) {
            if (this._pendingAreas.some((area) => area.id === id)) continue;
            const area: MapAreaData = this._cmd.proxy.getMapAreaData(id);
            if (!area || area.endCellX <= area.startCellX || area.endCellY <= area.startCellY) continue;
            this._pendingAreas.push({ id, x: area.startCellX, y: area.startCellY,
                startY: area.startCellY, endX: area.endCellX, endY: area.endCellY });
            if (!this._ready) this._initialCellTotal += (area.endCellX - area.startCellX) * (area.endCellY - area.startCellY);
        }
    }

    private addMapCell(areaId: number, x: number, y: number): void {
        const layers = this._itemLayers;
        if (!layers) throw new Error('地图图层尚未初始化');
        const cellId = MapUtil.getIdByCellPoint(x, y);
        const resource = this._cmd.proxy.getResData(cellId);
        const build = this._cmd.buildProxy.getBuild(cellId);
        const city = this._cmd.cityProxy.getCity(cellId);
        if (resource) {
            layers.res.addItem(areaId, resource);
            if (resource.type === MapResType.SYS_CITY) layers.sysCity.addItem(areaId, resource);
            if (resource.type <= MapResType.FORTRESS) layers.tag.addItem(areaId, resource);
        }
        if (build) {
            if (build.type === MapResType.SYS_CITY) layers.sysCity.addItem(areaId, build);
            else if (build.type === MapResType.SYS_FORTRESS) layers.res.addItem(areaId, build);
            else layers.build.addItem(areaId, build);
            layers.facility.addItem(areaId, build);
            layers.tips.addItem(areaId, build);
        }
        if (city) layers.city.addItem(areaId, city);
    }

    protected onScrollToMap(x: number, y: number): void {
        let old = this.node.getComponent(MapLogic).curCameraPoint();
        let cur = this.node.getComponent(MapLogic).toCameraPoint(new Vec2(x, y));

        EventMgr.emit(LogicEvent.beforeScrollToMap, cur.x, cur.y, old.x, old.y);
        this.node.getComponent(MapLogic).scrollToMapPoint(new Vec2(x, y));
    }
}
