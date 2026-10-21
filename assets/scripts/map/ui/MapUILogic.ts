import { _decorator, Component, Prefab, Node, Layout, Label, EditBox, Button, Sprite, Color, instantiate, UITransform, Vec2, input, Input, EventKeyboard, KeyCode } from 'cc';
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
import { ServerConfig } from '../../config/ServerConfig';
import { NetManager } from '../../network/socket/NetManager';
import { ProtoManager } from '../../network/pto/ProtoManager';
import SystemOpenCommand from '../../systemopen/SystemOpenCommand';
import TroopCommand from '../../general/TroopCommand';

const HEAD_ICON_SYSTEM_ID = 1;

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

    protected _morePanel: Node = null;
    protected _moreMask: Node = null;
    protected _moreIndicator: Node = null;
    protected _avatarEntry: Node = null;

    protected _gmCtrlDown: boolean = false;
    protected _gmBDown: boolean = false;
    protected _gmHistory: string[] = [];
    protected _gmHistoryIndex: number = -1;
    protected _gmHistoryDraft: string = "";
    protected _gmCommandBg: Sprite = null;
    protected _gmMessages: string[] = [];

    protected _resArray: any = [];

    protected onLoad(): void {

        this._resArray.push({ key: 1, name: "谷" });
        this._resArray.push({ key: 2, name: "木" });
        this._resArray.push({ key: 3, name: "铁" });


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

        EventMgr.on(ServerConfig.s2c_gm_command_help, this.onGMCommandHelp, this);
        EventMgr.on(ServerConfig.s2c_tell_me, this.onGMTellMe, this);
        if (this.gmCommandBox) {
            this.gmCommandBox.node.on(EditBox.EventType.EDITING_RETURN, this.onGMCommandReturn, this);
            this.gmCommandBox.node.on(EditBox.EventType.EDITING_DID_BEGAN, this.onGMCommandFocus, this);
            this.gmCommandBox.node.on(EditBox.EventType.EDITING_DID_ENDED, this.onGMCommandBlur, this);
            let bgNode = this.gmCommandBox.node.getChildByName("BACKGROUND_SPRITE");
            this._gmCommandBg = bgNode ? bgNode.getComponent(Sprite) : null;
        }
        if (this.gmEditBoxX) {
            this.gmEditBoxX.node.on(EditBox.EventType.EDITING_RETURN, this.onGMCoordReturn, this);
        }
        if (this.gmEditBoxY) {
            this.gmEditBoxY.node.on(EditBox.EventType.EDITING_RETURN, this.onGMCoordReturn, this);
        }

        this.initMoreMenu();
        this.initAvatarEntry();
        SystemOpenCommand.getInstance().requestSystemOpen();
        TroopCommand.getInstance().requestTroops();



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
        const gmCommandNode = this.gmCommandBox && this.gmCommandBox.node;
        if (gmCommandNode && gmCommandNode.isValid) {
            gmCommandNode.off(EditBox.EventType.EDITING_RETURN, this.onGMCommandReturn, this);
            gmCommandNode.off(EditBox.EventType.EDITING_DID_BEGAN, this.onGMCommandFocus, this);
            gmCommandNode.off(EditBox.EventType.EDITING_DID_ENDED, this.onGMCommandBlur, this);
        }
        const gmXNode = this.gmEditBoxX && this.gmEditBoxX.node;
        if (gmXNode && gmXNode.isValid) {
            gmXNode.off(EditBox.EventType.EDITING_RETURN, this.onGMCoordReturn, this);
        }
        const gmYNode = this.gmEditBoxY && this.gmEditBoxY.node;
        if (gmYNode && gmYNode.isValid) {
            gmYNode.off(EditBox.EventType.EDITING_RETURN, this.onGMCoordReturn, this);
        }
        if (this._avatarEntry && this._avatarEntry.isValid) {
            this._avatarEntry.off(Button.EventType.CLICK, this.onClickAvatar, this);
        }
        this._avatarEntry = null;
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);

        console.log("MapUILogic onDestroy")
    }

    protected initAvatarEntry(): void {
        this._avatarEntry = this.node.getChildByPath("PlayerCard");
        if (!this._avatarEntry) {
            console.warn("Avatar entry skipped: PlayerCard not found");
            return;
        }
        let button = this._avatarEntry.getComponent(Button);
        if (!button) {
            button = this._avatarEntry.addComponent(Button);
        }
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.97;
        button.duration = 0.08;
        this._avatarEntry.off(Button.EventType.CLICK, this.onClickAvatar, this);
        this._avatarEntry.on(Button.EventType.CLICK, this.onClickAvatar, this);
    }

    protected onClickAvatar(): void {
        AudioManager.instance.playClick();
        if (!this.isAvatarSystemOpen()) {
            const config = SystemOpenCommand.getInstance().getConfig(HEAD_ICON_SYSTEM_ID);
            const level = this.getUnlockLevel(config);
            const featureName = (config && config.Name) || "更换头像";
            EventMgr.emit(LogicEvent.showToast, level > 0 ? `${featureName}将在 Lv.${level} 开启` : `${featureName}尚未开启`);
            return;
        }
        EventMgr.emit(LogicEvent.showToast, "更换头像功能已开启");
    }

    protected isAvatarSystemOpen(): boolean {
        return SystemOpenCommand.getInstance().isSystemOpen(HEAD_ICON_SYSTEM_ID);
    }

    protected getUnlockLevel(config: any): number {
        if (!config || !Array.isArray(config.Cond)) {
            return 0;
        }
        for (const condition of config.Cond) {
            const level = Number(condition && condition.level);
            if (level > 0) {
                return level;
            }
        }
        return 0;
    }

    protected initMoreMenu(): void {
        let hudRoot = this.node.getChildByName("HudRoot");
        if (hudRoot == null) {
            return;
        }

        this._morePanel = hudRoot.getChildByName("MorePanel");
        this._moreMask = hudRoot.getChildByName("MoreMask");
        this._moreIndicator = hudRoot.getChildByPath("BottomNav/MoreButton/MoreIndicator");

        if (this._moreMask) {
            this._moreMask.on(Node.EventType.TOUCH_END, this.closeMoreMenu, this);
        }
        if (this._morePanel) {
            this._morePanel.children.forEach((child) => {
                child.on(Button.EventType.CLICK, this.closeMoreMenu, this);
            });
        }
    }

    public toggleMoreMenu(): void {
        AudioManager.instance.playClick();
        this.setMoreMenuVisible(this._morePanel != null && !this._morePanel.active);
    }

    public closeMoreMenu(): void {
        this.setMoreMenuVisible(false);
    }

    protected setMoreMenuVisible(visible: boolean): void {
        if (this._morePanel) {
            this._morePanel.active = visible;
        }
        if (this._moreMask) {
            this._moreMask.active = visible;
        }
        if (this._moreIndicator) {
            this._moreIndicator.active = visible;
        }
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
        if (!this.srollLayout || !this.srollLayout.node) {
            return;
        }
        var children = this.srollLayout.node.children;
        if (!children || children.length == 0) {
            return;
        }
        var roleRes = LoginCommand.getInstance().proxy.getRoleResData();
        var resMap = this.toResMap(roleRes);
        var i = 0;
        this.setResLabel(children, i, "令牌", 4, resMap);
        i += 1;

        for (let index = 0; index < this._resArray.length; index++) {
            const obj = this._resArray[index];
            this.setResLabel(children, i, obj.name, obj.key, resMap);
            i += 1;
        }
    }

    /** 服务器资源是 { resList: [{ k, v }] }，统一成 key -> 数量 */
    private toResMap(roleRes: any): { [key: number]: number } {
        var map: { [key: number]: number } = {};
        if (!roleRes) {
            return map;
        }
        if (Array.isArray(roleRes.resList)) {
            for (const item of roleRes.resList) {
                if (item && item.k !== undefined) {
                    map[Number(item.k)] = Number(item.v) || 0;
                }
            }
        }
        for (let key = 0; key <= 20; key++) {
            if (typeof roleRes[key] === "number") {
                map[key] = roleRes[key];
            }
        }
        return map;
    }

    private setResLabel(children: readonly Node[], index: number, name: string, itemId: number, resMap: { [key: number]: number }): void {
        if (index >= children.length) {
            return;
        }
        var labelNode = children[index].getChildByName("New Label");
        var label = labelNode ? labelNode.getComponent(Label) : null;
        if (!label) {
            return;
        }
        label.string = name + Tools.numberToShow(this.getResCount(itemId, resMap));
    }

    private getResCount(itemId: number, resMap: { [key: number]: number }): number {
        var proxy = LoginCommand.getInstance().proxy;
        if (proxy.hasItemCount(itemId)) {
            return proxy.getItemCount(itemId);
        }
        return resMap[itemId] || 0;
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
        let raw = event.rawEvent as KeyboardEvent;

        if (this.gmPanel && this.gmPanel.active) {
            if (event.keyCode === KeyCode.ESCAPE) {
                if (raw && raw.preventDefault) {
                    raw.preventDefault();
                }
                this.onClickGMClose();
                return;
            }
            if (this.gmCommandBox && this.gmCommandBox.isFocused()) {
                if (event.keyCode === KeyCode.ARROW_UP) {
                    if (raw && raw.preventDefault) {
                        raw.preventDefault();
                    }
                    this.navigateGMHistory(1);
                    return;
                }
                if (event.keyCode === KeyCode.ARROW_DOWN) {
                    if (raw && raw.preventDefault) {
                        raw.preventDefault();
                    }
                    this.navigateGMHistory(-1);
                    return;
                }
            }
        }

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
            this._gmHistoryIndex = -1;
            this._gmHistoryDraft = "";
            this.setGMTip("就绪 · Enter 执行 · goto x y 本地跳转 · help 查看帮助");
            this.scheduleOnce(this.focusGMCommand, 0);
        } else if (this.gmCommandBox) {
            this.gmCommandBox.blur();
        }
    }

    protected focusGMCommand(): void {
        if (this.gmPanel && this.gmPanel.active && this.gmCommandBox) {
            this.gmCommandBox.focus();
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

    protected setGMTip(text: string, append: boolean = false): void {
        if (this.gmTipLabel == null) {
            return;
        }
        let value = (text || "").trim();
        if (append && value.length > 0) {
            if (this._gmMessages.length > 0 && this._gmMessages[this._gmMessages.length - 1] == value) {
                return;
            }
            this._gmMessages.push(value);
            while (this._gmMessages.length > 2) {
                this._gmMessages.shift();
            }
        } else {
            this._gmMessages = value.length > 0 ? [value] : [];
        }
        this.gmTipLabel.string = this._gmMessages.join("\n");
    }

    public onClickGMClose(): void {
        AudioManager.instance.playClick();
        if (this.gmPanel) {
            this.gmPanel.active = false;
        }
        if (this.gmCommandBox) {
            this.gmCommandBox.blur();
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
        let command = this.gmCommandBox.string;
        this.executeGMCommand(command);
        this.scheduleOnce(this.focusGMCommand, 0);
    }

    protected onGMCommandReturn(): void {
        if (this.gmCommandBox == null) {
            return;
        }
        let command = this.gmCommandBox.string;
        this.executeGMCommand(command);
        this.scheduleOnce(this.focusGMCommand, 0);
    }

    protected onGMCommandFocus(): void {
        if (this._gmCommandBg) {
            this._gmCommandBg.color = new Color(58, 84, 112, 255);
        }
    }

    protected onGMCommandBlur(): void {
        if (this._gmCommandBg) {
            this._gmCommandBg.color = new Color(40, 56, 74, 255);
        }
    }

    protected onGMCoordReturn(): void {
        this.onClickGMJump();
        this.scheduleOnce(this.focusGMCommand, 0);
    }

    protected navigateGMHistory(direction: number): void {
        if (!this.gmCommandBox || this._gmHistory.length == 0) {
            return;
        }
        if (this._gmHistoryIndex < 0) {
            this._gmHistoryDraft = this.gmCommandBox.string;
            this._gmHistoryIndex = 0;
        } else {
            this._gmHistoryIndex += direction;
        }
        if (this._gmHistoryIndex < 0) {
            this._gmHistoryIndex = -1;
            this.gmCommandBox.string = this._gmHistoryDraft;
            return;
        }
        if (this._gmHistoryIndex >= this._gmHistory.length) {
            this._gmHistoryIndex = this._gmHistory.length - 1;
        }
        this.gmCommandBox.string = this._gmHistory[this._gmHistoryIndex];
    }

    protected rememberGMCommand(command: string): void {
        let text = (command || "").trim();
        if (text.length == 0) {
            return;
        }
        if (this._gmHistory.length == 0 || this._gmHistory[0] != text) {
            this._gmHistory.unshift(text);
            if (this._gmHistory.length > 20) {
                this._gmHistory.pop();
            }
        }
        this._gmHistoryIndex = -1;
        this._gmHistoryDraft = "";
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
            this.setGMTip("请输入命令", true);
            return;
        }
        this.rememberGMCommand(text);

        let args = text.split(/\s+/);
        let cmd = args[0].toLowerCase();
        if (cmd == "goto" || cmd == "jump" || cmd == "tp") {
            if (args.length < 3) {
                this.setGMTip("用法：goto x y", true);
                return;
            }
            this.jumpToCell(this.parseCoord(args[1]), this.parseCoord(args[2]));
            return;
        }
        if (cmd == "pos" || cmd == "where" || cmd == "coord") {
            this.refreshGMCoord();
            let center = MapCommand.getInstance().proxy.getCurCenterPoint();
            this.setGMTip(center ? ("当前坐标 " + center.x + " , " + center.y) : "坐标不可用", true);
            return;
        }
        if (cmd == "help" || cmd == "?") {
            this.setGMTip("本地命令：goto x y · pos · clear · help；其它指令会发送到服务器", true);
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
            let x = this.parseCoord(args[0]);
            let y = this.parseCoord(args[1]);
            if (!isNaN(x) && !isNaN(y)) {
                this.jumpToCell(x, y);
                return;
            }
        }
        this.sendGMCommand(text);
    }

    protected sendGMCommand(command: string): void {
        let msgName = ServerConfig.c2s_gm_command;
        let protoData = ProtoManager.getInstance().encode(msgName, {
            cmd: command
        });
        if (!protoData) {
            this.setGMTip("指令编码失败，请检查 Protobuf 配置", true);
            return;
        }
        NetManager.getInstance().send({
            name: msgName,
            msg: protoData
        });
        this.setGMTip("已发送：" + command + "  ·  等待服务器返回", true);
    }

    protected onGMCommandHelp(data: any): void {
        let list = (data && data.ret) || [];
        if (!Array.isArray(list) || list.length == 0) {
            this.setGMTip("服务器未返回 GM 帮助", true);
            return;
        }
        let parts = list.slice(0, 8).map((item: any) => item.k + "=" + item.v);
        this.setGMTip("GM 帮助：" + parts.join("  "), true);
    }

    protected onGMTellMe(data: any): void {
        let raw = data && (data.msg != null ? data.msg : (data.message != null ? data.message : (data.content != null ? data.content : data.text)));
        let msg = raw == null ? "" : String(raw).trim();
        if (msg.length == 0) {
            console.warn("[GM] s2c_tell_me 收到空消息", data);
            return;
        }
        console.log("[GM] s2c_tell_me", msg);
        if (this.gmPanel && this.gmPanel.active) {
            this.setGMTip(msg, true);
        } else {
            EventMgr.emit(LogicEvent.showToast, msg);
        }
    }

    protected jumpToCell(x: number, y: number): void {
        let mapSize = MapUtil.mapSize;
        if (mapSize == null || isNaN(x) || isNaN(y)
            || x < 0 || y < 0
            || x >= mapSize.width
            || y >= mapSize.height) {
            this.setGMTip("坐标无效，范围 0 - " + (mapSize ? (mapSize.width - 1) : 0), true);
            return;
        }
        EventMgr.emit(LogicEvent.scrollToMap, x, y);
        if (this.gmEditBoxX) {
            this.gmEditBoxX.string = x + "";
        }
        if (this.gmEditBoxY) {
            this.gmEditBoxY.string = y + "";
        }
        this.setGMTip("已跳转到 (" + x + ", " + y + ")", true);
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
