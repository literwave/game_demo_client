import { _decorator, Component, Label, Sprite, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;
import WorldMapArt from '../WorldMapArt';

import DateUtil from "../../utils/DateUtil";
import { MapCityData } from "../MapCityProxy";
import MapCommand from "../MapCommand";
import { EventMgr } from '../../utils/EventMgr';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('CityLogic')
export default class CityLogic extends Component {
    @property(Label)
    labelName: Label | null = null;
    @property(Sprite)
    upSpr: Sprite | null = null;
    @property(Sprite)
    downSpr: Sprite | null = null;
    @property(Node)
    mianNode: Node | null = null;
    protected _data: MapCityData = null;
    protected _limitTime: number = 0;
    protected onLoad(): void {
        this._limitTime = MapCommand.getInstance().proxy.getWarFree();
    }
    protected onDestroy(): void {

    }
    protected onEnable(): void {
        EventMgr.on(LogicEvent.unionChange, this.onUnionChange, this);
    }
    protected onDisable(): void {
        this._data = null;
        this.unscheduleAllCallbacks();
        EventMgr.targetOff(this);
    }
    protected onUnionChange(rid: number, unionId: number, parentId: number): void {
        if (!this._data) return;
        if (this._data.rid == rid ){
        this._data.unionId = unionId;
        this._data.parentId = parentId;
        }
        this.updateUI();
    }
    public setCityData(data: MapCityData): void {
        this._data = data;
        console.log("setCityData:", data);
        this.updateUI();
    }
    public updateUI(): void {
        if (this._data) {
        this.labelName.string = this._data.name;

        const icon = this.node.getChildByName('sprite')?.getComponent(Sprite);
        if (icon) {
            icon.node.setScale(1, 1, 1); icon.node.setPosition(0, 0, 0);
            icon.node.getComponent(UITransform).setAnchorPoint(.5, .3);
            WorldMapArt.apply(icon, 'county', WorldMapArt.playerCityWidth);
        }
        WorldMapArt.ownership(this.node, this.upSpr, this.downSpr,
            WorldMapArt.factionColor(this._data, MapCommand.getInstance().buildProxy), 380);
        this.mianNode?.setPosition(120, 30, 0);

        var diff = DateUtil.getServerTime() - this._data.occupyTime;
        console.log("diff", diff, this._limitTime);
        if (this._data.parentId > 0 && diff<this._limitTime){
        this.mianNode.active = true;
        this.stopCountDown();
        this.schedule(this.countDown, 1.0);
        }else{
        this.mianNode.active = false;
        }
        }
    }
    public countDown() {
        var diff = DateUtil.getServerTime() - this._data.occupyTime;
        if (diff>this._limitTime){
        this.stopCountDown();
        this.mianNode.active = false;
        }
    }
    public stopCountDown() {
        this.unscheduleAllCallbacks();
    }
}

