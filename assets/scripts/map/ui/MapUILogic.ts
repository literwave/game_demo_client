import { _decorator, Component, Prefab, Node, Layout, Label, EditBox, instantiate, UITransform, Vec2, input, Input, EventKeyboard, KeyCode } from 'cc';
const { ccclass, property } = _decorator;

import LoginCommand from "../../login/LoginCommand";
import ArmySelectNodeLogic from "./ArmySelectNodeLogic";
import CityArmySettingLogic from "./CityArmySettingLogic";
import FacilityListLogic from "./FacilityListLogic";
import MapUICommand from "./MapUICommand";
import Dialog, { DialogType } from "./Dialog";
import UnionCommand from "../../union/UnionCommand";
import MapCommand from "../MapCommand";
import MapUtil from "../MapUtil";
import FortressAbout from "./FortressAbout";
import CityAboutLogic from "./CityAboutLogic";
import GeneralListLogic from "./GeneralListLogic";
import TransformLogic from "./TransformLogic";
import { Tools } from "../../utils/Tools";
import GeneralInfoLogic from "./GeneralInfoLogic";
import WarReportLogic from "./WarReportLogic";
import DrawRLogic from "./DrawRLogic";
import { GeneralData } from "../../general/GeneralProxy";
import SkillLogic from "./SkillLogic";
import { SkillConf } from "../../config/skill/Skill";
import SkillInfoLogic from "./SkillInfoLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { Skill } from '../../skill/SkillProxy';
import { LogicEvent } from '../../common/LogicEvent';



@ccclass('MapUILogic')
export default class MapUILogic extends Component {

    @property(Node)
    contentNode: Node = null;

    @property(Prefab)
    facilityPrefab: Prefab = null;
    protected _facilityNode: Node = null;

    @property(Prefab)
    armySettingPrefab: Prefab = null;
    protected _armySettingNode: Node = null;

    @property(Prefab)
    dialog: Prefab = null;
    protected _dialogNode: Node = null;

    @property(Prefab)
    generalPrefab: Prefab = null;
    protected _generalNode: Node = null;

    @property(Prefab)
    generalDesPrefab: Prefab = null;
    protected _generalDesNode: Node = null;

    @property(Prefab)
    cityAboutPrefab: Prefab = null;
    protected _cityAboutNode: Node = null;

    @property(Prefab)
    fortressAboutPrefab: Prefab = null;
    protected _fortressAboutNode: Node = null;

    @property(Prefab)
    warReportPrefab: Prefab = null;
    protected _warReportNode: Node = null;
    @property(Prefab)
    armySelectPrefab: Prefab = null;
    protected _armySelectNode: Node = null;

    @property(Prefab)
    drawPrefab: Prefab = null;
    protected _drawNode: Node = null;

    @property(Prefab)
    drawResultrefab: Prefab = null;
    protected _drawResultNode: Node = null;

    @property(Prefab)
    unionPrefab: Prefab = null;
    protected _unionNode: Node = null;

    @property(Prefab)
    chatPrefab: Prefab = null;
    protected _chatNode: Node = null;

    @property(Prefab)
    collectPrefab: Prefab = null;
    protected _collectNode: Node = null;


    @property(Prefab)
    transFormPrefab: Prefab = null;
    protected _transFormNode: Node = null;

    @property(Prefab)
    generalConvertPrefab: Prefab = null;
    protected _generalConvertNode: Node = null;

    @property(Prefab)
    generalRosterPrefab: Prefab = null;
    protected _generalRosterNode: Node = null;

    @property(Prefab)
    skillPrefab: Prefab = null;
    protected _skillNode: Node = null;

    @property(Prefab)
    skillInfoPrefab: Prefab = null;
    protected _skillInfoNode: Node = null;

    @property(Prefab)
    settingPrefab: Prefab = null;
    protected _settingNode: Node = null;


    @property(Prefab)
    cloudAniPrefab: Prefab = null;
    protected _cloudAniNode: Node = null;


    @property(Node)
    widgetNode: Node = null;

    @property(Layout)
    srollLayout: Layout = null;

    @property(Label)
    nameLabel: Label = null;

    @property(Label)
    ridLabel: Label = null;

    @property(Node)
    gmPanel: Node = null;

    @property(EditBox)
    gmCommandBox: EditBox = null;

    @property(EditBox)
    gmEditBoxX: EditBox = null;

    @property(EditBox)
    gmEditBoxY: EditBox = null;

    @property(Label)
    gmCoordLabel: Label = null;

    @property(Label)
    gmTipLabel: Label = null;

    protected _gmCtrlDown: boolean = false;
    protected _gmBDown: boolean = false;

    protected _resArray: any = [];
    protected _yieldArray: any = [];

    protected onLoad(): void {

        this._resArray.push({ key: 1, name: "谷 " });
        this._resArray.push({ key: 2, name: "木 " });
        this._resArray.push({ key: 3, name: "铁 " });

        this._yieldArray.push({ key: 1, name: "木+" });
        this._yieldArray.push({ key: 2, name: "铁+" });
        this._yieldArray.push({ key: 3, name: "石+" });


        EventMgr.on(LogicEvent.openCityAbout, this.openCityAbout, this);
        EventMgr.on(LogicEvent.closeCityAbout, this.closeCityAbout, this);
        EventMgr.on(LogicEvent.openFortressAbout, this.openFortressAbout, this);
        EventMgr.on(LogicEvent.openFacility, this.openFacility, this);
        EventMgr.on(LogicEvent.openArmySetting, this.openArmySetting, this);
        EventMgr.on(LogicEvent.upateMyRoleRes, this.updateRoleRes, this);
        EventMgr.on(LogicEvent.openGeneralDes, this.openGeneralDes, this);
        EventMgr.on(LogicEvent.openGeneralChoose, this.openGeneralChoose, this);
        EventMgr.on(LogicEvent.openArmySelectUi, this.onOpenArmySelectUI, this);
        EventMgr.on(LogicEvent.openDrawResult, this.openDrawR, this);
        EventMgr.on(LogicEvent.robLoginUI, this.robLoginUI, this);
        EventMgr.on(LogicEvent.interiorCollect, this.onCollection, this);
        EventMgr.on(LogicEvent.openGeneralConvert, this.onOpenGeneralConvert, this);
        EventMgr.on(LogicEvent.openGeneralRoster, this.onOpenGeneralRoster, this);
        EventMgr.on(LogicEvent.openGeneral, this.openGeneral, this);
        EventMgr.on(LogicEvent.openSkill, this.onOpenSkill, this);
        EventMgr.on(LogicEvent.closeSkill, this.onCloseSkill, this);
        EventMgr.on(LogicEvent.openSkillInfo, this.onOpenSkillInfo, this);
        EventMgr.on(LogicEvent.beforeScrollToMap, this.beforeScrollToMap, this);
        EventMgr.on(LogicEvent.showTip, this.showTip, this);
        EventMgr.on(LogicEvent.mapEenterChange, this.onMapCenterChange, this);
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);



        this.updateRoleRes();
        this.updateRole();
        let unionId = MapCommand.getInstance().cityProxy.myUnionId;
        if (unionId > 0) {
            UnionCommand.getInstance().unionApplyList(unionId);
        }
    }

    protected robLoginUI(): void {
        this.showTip("账号在其他地方登录", function () {
            EventMgr.emit(LogicEvent.enterLogin);
        });
    }

    protected showTip(text: string, close: Function): void {
        if (this._dialogNode == null) {
            this._dialogNode = instantiate(this.dialog)
            this._dialogNode.parent = this.contentNode;
        } else {
            this._dialogNode.active = true;
        }
        this._dialogNode.setSiblingIndex(this.topLayer());
        this._dialogNode.getComponent(Dialog).show(text, DialogType.OnlyConfirm);
        this._dialogNode.getComponent(Dialog).setClose(close)
    }


    protected onDestroy(): void {
        this.clearAllNode();
        MapUICommand.getInstance().proxy.clearData();
        EventMgr.targetOff(this);
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);

        console.log("MapUILogic onDestroy")
    }

    protected onBack(): void {
        AudioManager.instance.playClick();
        LoginCommand.getInstance().account_logout();
    }


    protected clearAllNode(): void {
        this._facilityNode = null;
        this._generalNode = null;
        this._cityAboutNode = null;
        this._fortressAboutNode = null;
        this._armySelectNode = null;
        this._armySettingNode = null;
        this._drawNode = null;
        this._drawResultNode = null;
        this._generalDesNode = null;
        this._dialogNode = null
    }



    public topLayer(): number {
        return this.contentNode.children.length + 1;
    }
    /**
     * 设施
     */
    protected openFacility(data: any): void {
        if (this._facilityNode == null) {
            this._facilityNode = instantiate(this.facilityPrefab);
            this._facilityNode.parent = this.contentNode;
        } else {
            this._facilityNode.active = true;
        }
        this._facilityNode.setSiblingIndex(this.topLayer());
        this._facilityNode.getComponent(FacilityListLogic).setData(data);
    }

    protected openArmySetting(cityId: number, order: number): void {
        if (this._armySettingNode == null) {
            this._armySettingNode = instantiate(this.armySettingPrefab);
            this._armySettingNode.parent = this.contentNode;
        } else {
            this._armySettingNode.active = true;
        }
        this._armySettingNode.setSiblingIndex(this.topLayer());
        this._armySettingNode.getComponent(CityArmySettingLogic).setData(cityId, order);
    }
    /**
     * 武将
     */

    protected onClickGeneral() {
        AudioManager.instance.playClick();
        this.openGeneral([]);
    }

    protected openGeneral(data: number[], type: number = 0, position: number = 0): void {
        if (this._generalNode == null) {
            this._generalNode = instantiate(this.generalPrefab);
            this._generalNode.parent = this.contentNode;
        } else {
            this._generalNode.active = true;
        }
        this._generalNode.setSiblingIndex(this.topLayer());
        this._generalNode.getComponent(GeneralListLogic).setData(data, type, position);
    }


    /**
     * 武将选择
     * @param data 
     * @param zIndex 
     */
    protected openGeneralChoose(data: number[], position: number = 0): void {
        this.openGeneral(data, 1, position);
    }

    /**打开军队选择界面*/
    protected onOpenArmySelectUI(cmd: number, x: number, y: number): void {
        if (this._armySelectNode == null) {
            this._armySelectNode = instantiate(this.armySelectPrefab);
            this._armySelectNode.parent = this.contentNode;
        } else {
            this._armySelectNode.active = true;
        }
        this._armySelectNode.setSiblingIndex(this.topLayer());
        this._armySelectNode.getComponent(ArmySelectNodeLogic).setData(cmd, x, y);
    }


    /**
     * 武将详情
     */
    protected openGeneralDes(cfgData: any, curData: any): void {
        if (this._generalDesNode == null) {
            this._generalDesNode = instantiate(this.generalDesPrefab);
            this._generalDesNode.parent = this.contentNode;
        } else {
            this._generalDesNode.active = true;
        }
        this._generalDesNode.setSiblingIndex(this.topLayer());
        this._generalDesNode.getComponent(GeneralInfoLogic).setData(cfgData, curData);
    }


    /**
     * 城市
     */
    protected openCityAbout(data: any): void {

        if (this._cityAboutNode == null) {
            this._cityAboutNode = instantiate(this.cityAboutPrefab);
            this._cityAboutNode.parent = this.contentNode;
        } else {
            this._cityAboutNode.active = true;
        }

        this._cityAboutNode.setSiblingIndex(this.topLayer());
        this.widgetNode.active = false;
        EventMgr.emit(LogicEvent.scrollToMap, data.x, data.y);
        this._cityAboutNode.getComponent(CityAboutLogic).setData(data);
    }

    protected closeCityAbout(): void {
        this.widgetNode.active = true;
    }

    protected openFortressAbout(data: any): void {
        if (this._fortressAboutNode == null) {
            this._fortressAboutNode = instantiate(this.fortressAboutPrefab);
            this._fortressAboutNode.parent = this.contentNode;
        } else {
            this._fortressAboutNode.active = true;
        }
        this._fortressAboutNode.setSiblingIndex(this.topLayer());
        this._fortressAboutNode.getComponent(FortressAbout).setData(data);
    }



    /**
     * 战报
     */
    protected openWarReport(): void {
        AudioManager.instance.playClick();
        if (this._warReportNode == null) {
            this._warReportNode = instantiate(this.warReportPrefab);
            this._warReportNode.parent = this.contentNode;
        } else {
            this._warReportNode.active = true;
        }
        this._warReportNode.setSiblingIndex(this.topLayer());
        this._warReportNode.getComponent(WarReportLogic).updateView();
    }

    /**
     * 角色信息
     */
    protected updateRoleRes(): void {
        var children = this.srollLayout.node.children;
        var roleRes = LoginCommand.getInstance().proxy.getRoleResData();

        console.log(roleRes)
        var i = 0;
        children[i].getChildByName("New Label").getComponent(Label).string = "令牌 " + Tools.numberToShow(roleRes[1]);
        i += 1;


        for (let index = 0; index < this._resArray.length; index++) {
            const obj = this._resArray[index];
            var label = children[i].getChildByName("New Label").getComponent(Label)

            if (obj.key == "gold") {
                label.string = obj.name + Tools.numberToShow(roleRes[obj.key]);
            } else {
                label.string = obj.name + Tools.numberToShow(roleRes[obj.key]);
            }

            i += 1;
        }

        for (let index = 0; index < this._yieldArray.length; index++) {
            const obj = this._yieldArray[index];
            var label = children[i].getChildByName("New Label").getComponent(Label)
            label.string = obj.name + Tools.numberToShow(roleRes[obj.key]);
            i += 1;
        }

    }



    /**
     * 抽卡
     */
    protected openDraw(): void {
        AudioManager.instance.playClick();
        if (this._drawNode == null) {
            this._drawNode = instantiate(this.drawPrefab);
            this._drawNode.parent = this.contentNode;
        } else {
            this._drawNode.active = true;
        }
        this._drawNode.setSiblingIndex(this.topLayer());
    }




    /**
     * 抽卡结果
     * @param data 
     */
    protected openDrawR(data: any): void {
        if (this._drawResultNode == null) {
            this._drawResultNode = instantiate(this.drawResultrefab);
            this._drawResultNode.parent = this.contentNode;
        } else {
            this._drawResultNode.active = true;
        }
        this._drawResultNode.setSiblingIndex(this.topLayer());
        this._drawResultNode.getComponent(DrawRLogic).setData(data);
    }



    protected openUnion(): void {
        AudioManager.instance.playClick();
        if (this._unionNode == null) {
            this._unionNode = instantiate(this.unionPrefab);
            this._unionNode.parent = this.contentNode;
        } else {
            this._unionNode.active = true;
        }
        this._unionNode.setSiblingIndex(this.topLayer());
    }


    protected openChat(): void {
        AudioManager.instance.playClick();
        if (this._chatNode == null) {
            this._chatNode = instantiate(this.chatPrefab);
            this._chatNode.parent = this.contentNode;
        } else {
            this._chatNode.active = true;
        }
        this._chatNode.setSiblingIndex(this.topLayer());
    }



    protected openTr(): void {
        AudioManager.instance.playClick();
        if (this._transFormNode == null) {
            this._transFormNode = instantiate(this.transFormPrefab);
            this._transFormNode.parent = this.contentNode;
        } else {
            this._transFormNode.active = true;
        }
        this._transFormNode.setSiblingIndex(this.topLayer());
        this._transFormNode.getComponent(TransformLogic).initView();
    }

    protected onOpenGeneralConvert(): void {
        AudioManager.instance.playClick();
        console.log("onOpenGeneralConvert");
        if (this._generalConvertNode == null) {
            this._generalConvertNode = instantiate(this.generalConvertPrefab);
            this._generalConvertNode.parent = this.contentNode;

        } else {
            this._generalConvertNode.active = true;
        }

        this._generalConvertNode.setSiblingIndex(this.topLayer());

    }

    protected onOpenGeneralRoster(): void {
        AudioManager.instance.playClick();
        console.log("onOpenGeneralRoster");
        if (this._generalRosterNode == null) {
            this._generalRosterNode = instantiate(this.generalRosterPrefab);
            this._generalRosterNode.parent = this.contentNode;
        } else {
            this._generalRosterNode.active = true;
        }
        this._generalRosterNode.setSiblingIndex(this.topLayer());

    }

    onClickSkillBtn(): void {
        AudioManager.instance.playClick();
        this.onOpenSkill(0);
    }

    protected onOpenSkill(type: number = 0, general: GeneralData = null, skillPos: number = -1): void {
        console.log("onOpenSkill", type, general, skillPos);
        if (this._skillNode == null) {
            this._skillNode = instantiate(this.skillPrefab);
            this._skillNode.parent = this.contentNode;
        } else {
            this._skillNode.active = true;
        }
        this._skillNode.setSiblingIndex(this.topLayer());
        this._skillNode.getComponent(SkillLogic).setData(type, general, skillPos);
    }

    protected onCloseSkill() {
        AudioManager.instance.playClick();
        if (this._skillNode) {
            this._skillNode.active = false;
        }
    }

    protected onOpenSkillInfo(cfg: Skill, type: number = 0, general: GeneralData = null, skillPos: number = -1) {
        console.log("onOpenSkillInfo", cfg, type, general, skillPos);
        AudioManager.instance.playClick();
        if (this._skillInfoNode == null) {
            this._skillInfoNode = instantiate(this.skillInfoPrefab);
            this._skillInfoNode.parent = this.contentNode;
        } else {
            this._skillInfoNode.active = true;
        }
        this._skillInfoNode.setSiblingIndex(this.topLayer());
        this._skillInfoNode.getComponent(SkillInfoLogic).setData(cfg, type, general, skillPos);
    }


    //征收
    protected onCollection(msg: any): void {
        this.showTip("成功征收到 " + msg.gold + " 金币", null);
    }

    protected updateRole(): void {
        var roleData = LoginCommand.getInstance().proxy.getRoleData();
        console.log("updateRole", roleData);
        this.nameLabel.string = roleData.name;
        this.ridLabel.string = "ID " + roleData.userId + "";
    }

    protected onClickCollection(): void {
        AudioManager.instance.playClick();

        if (this._collectNode == null) {
            this._collectNode = instantiate(this.collectPrefab);
            this._collectNode.parent = this.contentNode;
        }
        this._collectNode.active = true;
        this._collectNode.setSiblingIndex(this.topLayer());

    }

    protected onClickSetting(): void {
        AudioManager.instance.playClick();
        if (this._settingNode == null) {
            this._settingNode = instantiate(this.settingPrefab);
            this._settingNode.parent = this.contentNode;
        }
        this._settingNode.active = true;
        this._settingNode.setSiblingIndex(this.topLayer());

    }

    protected onKeyDown(event: EventKeyboard): void {
        if (event.keyCode === KeyCode.CTRL_LEFT || event.keyCode === KeyCode.CTRL_RIGHT) {
            this._gmCtrlDown = true;
            return;
        }

        if (event.keyCode === KeyCode.KEY_B) {
            if (this._gmBDown) {
                return;
            }
            this._gmBDown = true;
        }

        let raw = event.rawEvent as KeyboardEvent;
        let ctrl = this._gmCtrlDown || !!(raw && raw.ctrlKey);
        if (ctrl && event.keyCode === KeyCode.KEY_B) {
            if (raw && raw.preventDefault) {
                raw.preventDefault();
            }
            this.toggleGMPanel();
        }
    }

    protected onKeyUp(event: EventKeyboard): void {
        if (event.keyCode === KeyCode.CTRL_LEFT || event.keyCode === KeyCode.CTRL_RIGHT) {
            this._gmCtrlDown = false;
        }
        if (event.keyCode === KeyCode.KEY_B) {
            this._gmBDown = false;
        }
    }

    protected onMapCenterChange(): void {
        if (this.gmPanel && this.gmPanel.active) {
            this.refreshGMCoord();
        }
    }

    public toggleGMPanel(): void {
        if (this.gmPanel == null) {
            return;
        }
        let show = !this.gmPanel.active;
        this.gmPanel.active = show;
        AudioManager.instance.playClick();
        if (show) {
            this.refreshGMCoord();
            if (this.gmCommandBox) {
                this.gmCommandBox.string = "";
            }
            this.setGMTip("输入 goto x y 跳转，或直接填写坐标");
        }
    }

    protected refreshGMCoord(): void {
        let center: Vec2 = MapCommand.getInstance().proxy.getCurCenterPoint();
        if (center == null) {
            return;
        }
        if (this.gmCoordLabel) {
            this.gmCoordLabel.string = "当前坐标  " + center.x + " , " + center.y;
        }
        if (this.gmEditBoxX) {
            this.gmEditBoxX.string = center.x + "";
        }
        if (this.gmEditBoxY) {
            this.gmEditBoxY.string = center.y + "";
        }
    }

    protected setGMTip(text: string): void {
        if (this.gmTipLabel) {
            this.gmTipLabel.string = text;
        }
    }

    public onClickGMClose(): void {
        AudioManager.instance.playClick();
        if (this.gmPanel) {
            this.gmPanel.active = false;
        }
    }

    public onClickGMJump(): void {
        AudioManager.instance.playClick();
        if (this.gmEditBoxX == null || this.gmEditBoxY == null) {
            return;
        }
        this.jumpToCell(this.parseCoord(this.gmEditBoxX.string), this.parseCoord(this.gmEditBoxY.string));
    }

    public onClickGMExecute(): void {
        AudioManager.instance.playClick();
        if (this.gmCommandBox == null) {
            return;
        }
        this.executeGMCommand(this.gmCommandBox.string);
    }

    protected parseCoord(value: string): number {
        if (value == null || value.trim().length == 0) {
            return NaN;
        }
        return Number(value);
    }

    protected executeGMCommand(command: string): void {
        let text = (command || "").trim();
        if (text.length == 0) {
            this.setGMTip("请输入命令");
            return;
        }

        let args = text.split(/\s+/);
        let cmd = args[0].toLowerCase();
        if (cmd == "goto" || cmd == "jump" || cmd == "tp") {
            if (args.length < 3) {
                this.setGMTip("用法：goto x y");
                return;
            }
            this.jumpToCell(this.parseCoord(args[1]), this.parseCoord(args[2]));
            return;
        }
        if (cmd == "pos" || cmd == "where" || cmd == "coord") {
            this.refreshGMCoord();
            let center = MapCommand.getInstance().proxy.getCurCenterPoint();
            this.setGMTip(center ? ("当前坐标 " + center.x + " , " + center.y) : "坐标不可用");
            return;
        }
        if (cmd == "help") {
            this.setGMTip("支持：goto x y / pos / clear");
            return;
        }
        if (cmd == "clear") {
            if (this.gmCommandBox) {
                this.gmCommandBox.string = "";
            }
            this.setGMTip("");
            return;
        }
        if (args.length == 2) {
            this.jumpToCell(this.parseCoord(args[0]), this.parseCoord(args[1]));
            return;
        }
        this.setGMTip("未知命令：" + args[0]);
    }

    protected jumpToCell(x: number, y: number): void {
        let mapSize = MapUtil.mapSize;
        if (mapSize == null || isNaN(x) || isNaN(y)
            || x < 0 || y < 0
            || x >= mapSize.width
            || y >= mapSize.height) {
            this.setGMTip("坐标无效，范围 0 - " + (mapSize ? (mapSize.width - 1) : 0));
            return;
        }
        EventMgr.emit(LogicEvent.scrollToMap, x, y);
        if (this.gmEditBoxX) {
            this.gmEditBoxX.string = x + "";
        }
        if (this.gmEditBoxY) {
            this.gmEditBoxY.string = y + "";
        }
        this.setGMTip("已跳转到 (" + x + ", " + y + ")");
    }

    protected beforeScrollToMap(x: number, y: number, oldx: number, oldy: number): void {
        let newPoint = new Vec2(x, y);
        let oldPoint = new Vec2(oldx, oldy);
        let dis = Vec2.squaredDistance(newPoint, oldPoint);
        console.log("beforeScrollToMap:", x, y, oldx, oldy, dis);

        if (dis < 360000) {
            return;
        }

        if (this._cloudAniNode == null) {
            this._cloudAniNode = instantiate(this.cloudAniPrefab);
            this._cloudAniNode.parent = this.contentNode;
        }
        this._cloudAniNode.active = true;
        this._cloudAniNode.setSiblingIndex(this.topLayer());

    }



}
