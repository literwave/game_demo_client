import { _decorator, Component, Label, Node, Sprite, UITransform, Layout } from 'cc';
const { ccclass, property } = _decorator;

import { ArmyCmd, ArmyData } from "../../general/ArmyProxy";
import GeneralCommand from "../../general/GeneralCommand";
import ArmyCommand from "../../general/ArmyCommand";
import { GeneralConfig, GeneralData } from "../../general/GeneralProxy";
import { TroopData } from "../../general/TroopProxy";
import { MapCityData } from "../MapCityProxy";
import MapCommand from "../MapCommand";
import DateUtil from "../../utils/DateUtil";
import GeneralHeadLogic from "./GeneralHeadLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { drawCommandRow, setCommandLabel } from './RightHudSkin';

@ccclass('RightArmyItemLogic')
export default class RightArmyItemLogic extends Component {
    @property(Label)
    labelInfo: Label = null;
    @property(Label)
    labelPos: Label = null;
    @property(Node)
    bottomNode: Node = null;
    @property(Sprite)
    headIcon: Sprite = null;
    @property(Label)
    labelSoldierCnt: Label = null;
    @property(Label)
    labelStrength: Label = null;
    @property(Label)
    labelMorale: Label = null;
    @property(Node)
    btnBack: Node = null;
    @property(Node)
    btnSetting: Node = null;

    public order: number = 0;
    protected _data: ArmyData = null;
    protected _troop: TroopData = null;
    protected _firstGeneral: GeneralData = null;
    protected _qryReturnTime: number = 0;

    protected onLoad(): void {
        EventMgr.on(LogicEvent.updateGeneral, this.onUpdateGeneral, this);
        EventMgr.on(LogicEvent.updateTroop, this.onUpdateTroop, this);
        this.bottomNode.active = false;
        this.layoutItem();
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
        this._data = null;
        this._troop = null;
    }

    protected update(): void {
        if (this._data && (this._data.state > 0 || this._data.cmd == ArmyCmd.Reclaim)) {
            let nowTime: number = DateUtil.getServerTime();
            let time: number = 0;
            if (this._data.state > 0) {
                //行军或者撤退中
                time = Math.max(0, this._data.endTime - nowTime);
            } else {
                //屯田中
                time = Math.max(0, GeneralCommand.getInstance().proxy.getCommonCfg().reclamation_time * 1000 - (nowTime - this._data.endTime));
                // if (time == 0 && nowTime - this._qryReturnTime > 2000) {
                //     //屯田结束 主动请求撤退
                //     this._qryReturnTime = nowTime;
                //     this.onClickBack();
                // }
            }
            this.labelPos.string = DateUtil.converSecondStr(time);
        }
    }

    protected onUpdateGeneral(): void {
        if (this._troop) {
            this.updateItem();
        }
    }

    protected onUpdateTroop(troop: TroopData): void {
        if (this._troop && troop && troop.troopIdx == this._troop.troopIdx) {
            this._troop = troop;
            this.updateItem();
        }
    }

    protected onClickTop(): void {
        AudioManager.instance.playClick();
        this.bottomNode.active = !this.bottomNode.active;
        this.layoutItem();
    }

    private layoutItem(): void {
        const top = this.node.getChildByName('topNode');
        const topUi = top?.getComponent(UITransform);
        const bottomUi = this.bottomNode?.getComponent(UITransform);
        const rootUi = this.node.getComponent(UITransform);
        if (!top || !topUi || !bottomUi || !rootUi) return;
        const detailHeight = this.bottomNode.active ? bottomUi.height : 0;
        rootUi.height = topUi.height + detailHeight;
        top.setPosition(0, detailHeight * 0.5, 0);
        this.bottomNode.setPosition(0, -topUi.height * 0.5, 0);
        this.refreshHeaderSkin();
        this.node.parent?.getComponent(Layout)?.updateLayout();
    }

    private refreshHeaderSkin(): void {
        const top = this.node.getChildByName('topNode');
        if (!top) return;
        const order = this.order || this._data?.order || 0;
        const hasHeroes = this._troop ? this._troop.getSortedHeroes().length > 0 : !!this._firstGeneral;
        const state = this._data ? ArmyCommand.getInstance().getArmyStateDes(this._data).replace(/[\[\]【】]/g, '') : (hasHeroes ? '已编队' : '待配置');
        drawCommandRow(top, !!this.bottomNode?.active, true);
        setCommandLabel(top, 'OrderBadge', order > 0 ? String(order).padStart(2, '0') : '军', -102, 1, 28, 13);
        setCommandLabel(top, 'StateBadge', state, 93, 12, 44, 10, !hasHeroes);
    }

    protected onClickBack(): void {
        AudioManager.instance.playClick();
        if (this._data) {
            let cityData: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
            ArmyCommand.getInstance().generalAssignArmy(this._data.id, ArmyCmd.Return, cityData.x, cityData.y, null);
        }
    }

    protected onClickSetting(): void {
        AudioManager.instance.playClick();
        if (this._data) {
            EventMgr.emit(LogicEvent.openArmySetting, this._data.cityId, this.order);
        } else if (this._troop) {
            const mainCity: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
            if (mainCity) {
                EventMgr.emit(LogicEvent.openArmySetting, mainCity.cityId, this.order);
            }
        }
    }

    protected updateGeneralByData(): void {
        var teamName = "";
        if (this._firstGeneral) {
            let cfg: GeneralConfig = GeneralCommand.getInstance().proxy.getGeneralCfg(this._firstGeneral.cfgId);
            teamName = cfg.name;
            this.headIcon.getComponent(GeneralHeadLogic).setHeadId(this._firstGeneral.cfgId);
            this.labelStrength.string = "体力 " + this._firstGeneral.physical_power + "/" + cfg.physical_power_limit;
        }
        this.labelInfo.string = teamName + "队";
        this.refreshHeaderSkin();

    }

    protected updateItem(): void {
        if (!this._data && this._troop) {
            this.updateTroopItem();
            return;
        }
        if (this._data && this._data.generals[0] != 0) {
            // console.log("updateItem", this._data);
            this.node.active = true;
            this._firstGeneral = GeneralCommand.getInstance().proxy.getMyGeneral(this._data.generals[0]);
            this.updateGeneralByData();

            this.labelPos.string = "(" + this._data.x + ", " + this._data.y + ")";

            this.labelSoldierCnt.string = "骑兵 " + (this._data.soldiers[0] + this._data.soldiers[1] + this._data.soldiers[2]);

            if (this._data.cmd == ArmyCmd.Idle) {
                
                this.btnSetting.active = true;
                let cityData: MapCityData = MapCommand.getInstance().cityProxy.getMyCityById(this._data.cityId);
                if (cityData && cityData.x == this._data.fromX && cityData.y == this._data.fromY){
                    //代表在城池里面
                    this.btnBack.active = false;
                }else{
                    //代表在城外据点待命
                    this.btnBack.active = true;
                }

            } else if (this._data.cmd == ArmyCmd.Conscript){
                this.btnSetting.active = false;
                this.btnBack.active = false;
            } else if (this._data.state == 0 && this._data.cmd != ArmyCmd.Reclaim) {
                //停留的时候才能配置队伍和撤退
                this.btnSetting.active = false;
                this.btnBack.active = true;
            } else {
                this.btnSetting.active = false;
                this.btnBack.active = false;
            }
        } else {
            this._firstGeneral = null;
            this.node.active = false;
        }
    }

    protected updateTroopItem(): void {
        this.node.active = true;
        const heroes = this._troop.getSortedHeroes();
        const firstHeroIdx = heroes.length > 0 ? heroes[0].heroIdx : 0;
        this._firstGeneral = firstHeroIdx > 0 ? GeneralCommand.getInstance().proxy.getMyGeneral(firstHeroIdx) : null;
        const firstCfg: GeneralConfig = this._firstGeneral ? (this._firstGeneral.config || GeneralCommand.getInstance().proxy.getGeneralCfg(firstHeroIdx)) : null;
        const teamName = firstCfg && firstCfg.name ? firstCfg.name : "未编队";

        if (this.headIcon) {
            this.headIcon.node.active = firstHeroIdx > 0;
            const headLogic = this.headIcon.getComponent(GeneralHeadLogic);
            if (firstHeroIdx > 0 && headLogic) {
                headLogic.setHeadId(firstHeroIdx);
            }
        }
        if (this.labelInfo) this.labelInfo.string = firstCfg ? teamName + "队" : "第" + this.order + "部队";
        if (this.labelPos) this.labelPos.string = "武将 " + heroes.length + "/3";
        if (this.labelSoldierCnt) this.labelSoldierCnt.string = "上阵 " + heroes.length + "/3";
        if (this.labelStrength) {
            this.labelStrength.string = firstCfg ? "速度 " + firstCfg.speed : "尚未配置武将";
        }
        if (this.labelMorale) {
            let attack: number = 0;
            heroes.forEach((hero) => {
                const general = GeneralCommand.getInstance().proxy.getMyGeneral(hero.heroIdx);
                const cfg = general ? (general.config || GeneralCommand.getInstance().proxy.getGeneralCfg(hero.heroIdx)) : null;
                if (cfg) {
                    attack += cfg.attack;
                }
            });
            this.labelMorale.string = "攻击 " + attack;
        }
        if (this.btnBack) this.btnBack.active = false;
        if (this.btnSetting) this.btnSetting.active = true;
        this.refreshHeaderSkin();
    }

    public setArmyData(data: ArmyData): void {
        this._data = data;
        this.updateItem();
    }

    public setTroopData(data: TroopData, order: number = 0): void {
        this._data = null;
        this._troop = data;
        this.order = order > 0 ? order : (data ? data.troopIdx : 0);
        this.updateItem();
    }
}
