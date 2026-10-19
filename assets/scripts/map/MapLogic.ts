import { _decorator, Component, TiledMap, Camera, Node, Vec2, Event, game, UITransform, EventMouse, EventTouch, Vec3, view } from 'cc';
const { ccclass, property } = _decorator;

import MapCommand from "./MapCommand";
import MapUtil from "./MapUtil";
import { EventMgr } from '../utils/EventMgr';
import { LogicEvent } from '../common/LogicEvent';

@ccclass('MapLogic')
export default class MapLogic extends Component {
    protected _cmd: MapCommand;
    protected _tiledMap: TiledMap = null;
    protected _mapCamera: Camera = null;
    protected _isTouch: boolean = false;
    protected _isMove: boolean = false;
    //地图相机缩放倍率边界
    protected _minZoomRatio: number = 1;
    protected _maxZoomRatio: number = 0.8;
    protected _changeZoomRadix: number = 200;
    protected _orthoHeight:number = 360;

    //地图相机移动边界
    protected _maxMapX: number = 1;
    protected _maxMapY: number = 1;

    protected _touchAniNode: Node = null;
    protected _centerPoint: Vec2 = null;

    // 拖动输入按帧合并，避免一帧内多次刷新 TiledMap 裁剪
    protected _pendingCameraX: number = 0;
    protected _pendingCameraY: number = 0;
    protected _moveDirty: boolean = false;
    protected _tempCameraPos: Vec3 = new Vec3();
    protected _lastCenterSyncTime: number = 0;

    
    protected onLoad(): void {
        console.log("MapLogic onLoad");
        this._cmd = MapCommand.getInstance();
        this._mapCamera = this.node.parent.getChildByName("Map Camera").getComponent(Camera);
   
        this._orthoHeight = this._mapCamera.orthoHeight;

        EventMgr.on(LogicEvent.openCityAbout, this.openCityAbout, this);
        EventMgr.on(LogicEvent.closeCityAbout, this.closeCityAbout, this);

    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);

        this._cmd = null;
    }

    public setTiledMap(tiledMap: TiledMap): void {
        this._tiledMap = tiledMap;
        this._tiledMap.enableCulling = true;

        this.updateCulling();
        
        var uit = this._tiledMap.node.getComponent(UITransform);
        this._maxMapX = (uit.width - view.getVisibleSize().width) * 0.5;
        this._maxMapY = (uit.height - view.getVisibleSize().height) * 0.5;
        this._tiledMap.node.on(Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        this._tiledMap.node.on(Node.EventType.TOUCH_START, this.onTouchBegan, this);
        this._tiledMap.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this._tiledMap.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this._tiledMap.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    protected openCityAbout(data: any): void {
        this._mapCamera.orthoHeight = this._orthoHeight * this._maxZoomRatio;
        this.updateCulling();
    }

    protected closeCityAbout(): void {
        this._mapCamera.orthoHeight = this._orthoHeight * this._minZoomRatio;
        this.updateCulling();
    }

    protected onMouseWheel(event: EventMouse): void {
        let scrollY: number = event.getScrollY();
        let changeRatio: number = Number((scrollY / this._changeZoomRadix).toFixed(1));
        let newZoomRatio: number = Math.min(this._minZoomRatio, Math.max(this._maxZoomRatio, this._mapCamera.orthoHeight/this._orthoHeight + changeRatio));

        this._mapCamera.orthoHeight = this._orthoHeight * newZoomRatio;
        this.updateCulling();
    }

    protected update(): void {
        if (!this._moveDirty || !this._mapCamera) {
            return;
        }
        this.applyPendingCameraMove();

        const now = Date.now();
        if (now - this._lastCenterSyncTime >= 80) {
            this._lastCenterSyncTime = now;
            this.syncCenterMapCellPoint();
        }
    }

    private applyPendingCameraMove(): void {
        this._moveDirty = false;
        this._tempCameraPos.set(this._pendingCameraX, this._pendingCameraY, this._mapCamera.node.position.z);
        this._mapCamera.node.setPosition(this._tempCameraPos);
    }

    private syncCenterMapCellPoint(): void {
        const pixelPoint = new Vec2(this._pendingCameraX, this._pendingCameraY);
        this.setCenterMapCellPoint(MapUtil.mapPixelToCellPoint(pixelPoint), pixelPoint);
    }

    private flushPendingCameraMove(): void {
        if (!this._moveDirty || !this._mapCamera) {
            return;
        }
        this.applyPendingCameraMove();
        this._lastCenterSyncTime = Date.now();
        this.syncCenterMapCellPoint();
    }

    protected onTouchMove(event: EventTouch): void {
        if (this._isTouch) {
            let delta: Vec2 = event.getDelta();
            if (delta.x != 0 || delta.y != 0) {
                this._isMove = true;
                this._pendingCameraX = Math.min(this._maxMapX, Math.max(-this._maxMapX, this._pendingCameraX - delta.x));
                this._pendingCameraY = Math.min(this._maxMapY, Math.max(-this._maxMapY, this._pendingCameraY - delta.y));
                this._moveDirty = true;
            }
        }
    }

    protected onTouchBegan(event: EventTouch): void {
        this._isTouch = true;
        this._isMove = false;
        this._moveDirty = false;
        let pos = this._mapCamera.node.position;
        this._pendingCameraX = pos.x;
        this._pendingCameraY = pos.y;
    }

    protected onTouchEnd(event: EventTouch): void {
        this._isTouch = false;
        this.flushPendingCameraMove();
        if (this._isMove == false) {
            let touchLocation: Vec2 = event.touch.getUILocation();
            let touchLocation1 = this.viewPointToWorldPoint(touchLocation);
            let mapPoint: Vec2 = MapUtil.worldPixelToMapCellPoint(touchLocation1);
            let clickCenterPoint: Vec2 = MapUtil.mapCellToPixelPoint(mapPoint);
            //派发事件
            // console.log("onTouchEnd:", touchLocation1, clickCenterPoint);

            EventMgr.emit(LogicEvent.touchMap, mapPoint, clickCenterPoint);
        } else {
            EventMgr.emit(LogicEvent.moveMap);
        }
        this._isMove = false;
    }

    protected onTouchCancel(event: EventTouch): void {
        this._isTouch = false;
        this.flushPendingCameraMove();
        this._isMove = false;
    }

    //界面坐标转世界坐标
    protected viewPointToWorldPoint(point: Vec2): Vec2 {
        // console.log("viewPointToWorldPoint in", point.x, point.y);

        let canvasNode: Node = this.node.parent;
        let cuit = canvasNode.getComponent(UITransform);
        let uit = this._tiledMap.node.getComponent(UITransform);


        let cameraWorldX: number = uit.width * uit.anchorX - view.getVisibleSize().width * cuit.anchorX + this._mapCamera.node.position.x;
        let cameraWorldY: number = uit.height * uit.anchorY - view.getVisibleSize().height * cuit.anchorY + this._mapCamera.node.position.y;

        return new Vec2(point.x + cameraWorldX, point.y + cameraWorldY);
    }



    //世界坐标转化为相对地图的像素坐标
    protected worldToMapPixelPoint(point: Vec2): Vec2 {
        var uit = this._tiledMap.node.getComponent(UITransform);
        let pixelX: number = point.x - uit.width * uit.anchorX;
        let pixelY: number = point.y - uit.height * uit.anchorY;
        return new Vec2(pixelX, pixelY);
    }

    public scrollToMapPoint(point: Vec2): void {
        let temp = this.toCameraPoint(point);
        this._mapCamera.node.setPosition(temp.x, temp.y, this._mapCamera.node.position.z);
        // 相机监听尚未绑定时（进图首帧）也要立刻重算一次裁剪区
        this.updateCulling();

        this._pendingCameraX = temp.x;
        this._pendingCameraY = temp.y;
        this._moveDirty = false;
        this._lastCenterSyncTime = Date.now();

        let pixelPoint: Vec2 = MapUtil.mapCellToPixelPoint(point);
        this.setCenterMapCellPoint(point, pixelPoint);
    }

    protected setCenterMapCellPoint(point: Vec2, pixelPoint: Vec2): void {
        this._cmd.proxy.setCurCenterPoint(point, pixelPoint);
    }

    private updateCulling() {
        if (this._tiledMap) {
            // 只派发一次，让 TiledLayer 绑定当前相机并完成一次裁剪。
            this._tiledMap.node.emit(Node.EventType.TRANSFORM_CHANGED);
        }
    }

 
    public curCameraPoint():Vec2 {
        let pos = this._mapCamera.node.position;
        return new Vec2(pos.x, pos.y);
    }


    public toCameraPoint(point: Vec2) {
        let pixelPoint: Vec2 = MapUtil.mapCellToPixelPoint(point);
        let positionX: number = Math.min(this._maxMapX, Math.max(-this._maxMapX, pixelPoint.x));
        let positionY: number = Math.min(this._maxMapY, Math.max(-this._maxMapY, pixelPoint.y));
        return new Vec2(positionX, positionY);
    }
}
