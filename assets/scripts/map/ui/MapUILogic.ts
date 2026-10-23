import { _decorator, Component, Prefab, Node, Layout, Label, Button, Color, Graphics, instantiate, UITransform, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

import LoginCommand from "../../login/LoginCommand";
import ArmySelectNodeLogic from "./ArmySelectNodeLogic";
import CityArmySettingLogic from "./CityArmySettingLogic";
import FacilityListLogic from "./FacilityListLogic";
import MapUICommand from "./MapUICommand";
import Dialog, { DialogType } from "./Dialog";
import UnionCommand from "../../union/UnionCommand";
import MapCommand from "../MapCommand";
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
import TroopCommand from '../../general/TroopCommand';
import { CoreEvent } from '../../core/CoreEvent';

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

    protected _morePanel: Node = null;
    protected _moreMask: Node = null;
    protected _moreIndicator: Node = null;

    protected _resArray: any = [];
    private _uiListenersReady = false;
    private _hudTopShade: Graphics | null = null;

    protected onLoad(): void {

        this._resArray.push({ key: 1, name: "谷" });
        this._resArray.push({ key: 2, name: "木" });
        this._resArray.push({ key: 3, name: "铁" });


        EventMgr.on(CoreEvent.gameReady, this.onGameReady, this);
        // 被顶号需要立即处理，普通界面事件等加载结束再接入。
        EventMgr.on(LogicEvent.robLoginUI, this.robLoginUI, this);

        this.initMoreMenu();
        this.node.on(Node.EventType.SIZE_CHANGED, this.layoutHud, this);
        this.layoutHud();
        this.scheduleOnce(this.layoutHud, 0);
        this.updateRoleRes();
        this.updateRole();
    }

    private onGameReady(): void {
        if (this._uiListenersReady || !this.isValid) return;
        this._uiListenersReady = true;
        EventMgr.on(LogicEvent.openCityAbout, this.openCityAbout, this);
        EventMgr.on(LogicEvent.closeCityAbout, this.closeCityAbout, this);
        EventMgr.on(LogicEvent.openFacility, this.openFacility, this);
        EventMgr.on(LogicEvent.openArmySetting, this.openArmySetting, this);
        EventMgr.on(LogicEvent.upateMyRoleRes, this.updateRoleRes, this);
        EventMgr.on(LogicEvent.openGeneralDes, this.openGeneralDes, this);
        EventMgr.on(LogicEvent.openGeneralChoose, this.openGeneralChoose, this);
        EventMgr.on(LogicEvent.openArmySelectUi, this.onOpenArmySelectUI, this);
        EventMgr.on(LogicEvent.openDrawResult, this.openDrawR, this);
        EventMgr.on(LogicEvent.interiorCollect, this.onCollection, this);
        EventMgr.on(LogicEvent.openGeneralConvert, this.onOpenGeneralConvert, this);
        EventMgr.on(LogicEvent.openGeneralRoster, this.onOpenGeneralRoster, this);
        EventMgr.on(LogicEvent.openGeneral, this.openGeneral, this);
        EventMgr.on(LogicEvent.openSkill, this.onOpenSkill, this);
        EventMgr.on(LogicEvent.closeSkill, this.onCloseSkill, this);
        EventMgr.on(LogicEvent.openSkillInfo, this.onOpenSkillInfo, this);
        EventMgr.on(LogicEvent.beforeScrollToMap, this.beforeScrollToMap, this);
        EventMgr.on(LogicEvent.showTip, this.showTip, this);
        EventMgr.on(ServerConfig.s2c_tell_me, this.onTellMe, this);
        TroopCommand.getInstance().requestTroops();



        // 加载期间数据层继续同步，在这里一次性取最新缓存刷新 HUD。
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
        this.node.off(Node.EventType.SIZE_CHANGED, this.layoutHud, this);
        this.clearAllNode();
        MapUICommand.getInstance().proxy.clearData();
        EventMgr.targetOff(this);

        console.log("MapUILogic onDestroy")
    }

    /** 按可视区域布局常驻 HUD；弹窗和地图不参与此布局。 */
    private layoutHud(): void {
        const rootUi = this.node.getComponent(UITransform);
        const hud = this.node.getChildByName("HudRoot");
        if (!rootUi || !hud) {
            return;
        }
        const width = rootUi.width;
        const height = rootUi.height;
        this.drawHudTopShade(width, height);
        const margin = 12;
        const top = height * 0.5;
        const bottom = -height * 0.5 + margin;
        const headerY = top - 32;
        const playerWidth = 224;
        const player = this.node.getChildByName("PlayerCard");
        if (player) {
            player.getComponent(UITransform)?.setContentSize(playerWidth, 60);
            player.setPosition(-width * 0.5 + margin + playerWidth * 0.5, top - margin - 30, 0);
        }
        const resources = this.node.getChildByName("ResourceBar");
        const resourcesUi = resources ? resources.getComponent(UITransform) : null;
        if (resources && resourcesUi) {
            // 资源栏紧凑贴右；窄屏时压缩宽度避让头像。
            const safeLeft = -width * 0.5 + margin * 2 + playerWidth;
            const safeRight = width * 0.5 - margin;
            const barWidth = Math.min(400, safeRight - safeLeft);
            const barX = safeRight - barWidth * 0.5;
            resourcesUi.setContentSize(barWidth, 40);
            resources.setPosition(barX, headerY, 0);
            const step = barWidth / 4;
            resources.children.forEach((slot, index) => {
                slot.setPosition((index - 1.5) * step, 0, 0);
                slot.getComponent(UITransform)?.setContentSize(step, 44);
                const icon = slot.getChildByName("Dot");
                if (icon) {
                    icon.setPosition(-step * 0.5 + 12, 0, 0);
                    icon.getComponent(UITransform)?.setContentSize(22, 22);
                }
                const text = slot.getChildByName("New Label");
                const textUi = text ? text.getComponent(UITransform) : null;
                if (textUi) {
                    text.setPosition(14, 0, 0);
                    textUi.setContentSize(step - 28, 32);
                }
            });
        }
        const dock = hud.getChildByName("BottomNavBar");
        const navigation = hud.getChildByName("BottomNav");
        const more = hud.getChildByName("MorePanel");
        const dockWidth = Math.min(400, width - margin * 2);
        const dockX = width * 0.5 - margin - dockWidth * 0.5;
        if (dock) {
            dock.getComponent(UITransform)?.setContentSize(dockWidth, 80);
            dock.setPosition(dockX, bottom + 40, 0);
        }
        if (navigation) {
            navigation.getComponent(UITransform)?.setContentSize(dockWidth, 80);
            navigation.setPosition(dockX, bottom + 40, 0);
            const step = dockWidth / Math.max(1, navigation.children.length);
            navigation.children.forEach((button, index) => {
                button.setPosition((index - (navigation.children.length - 1) * 0.5) * step, 0, 0);
                button.getComponent(UITransform)?.setContentSize(step - 8, 80);
            });
        }
        if (more) {
            const moreUi = more.getComponent(UITransform);
            const moreWidth = moreUi ? moreUi.width : dockWidth;
            more.setPosition(width * 0.5 - margin - moreWidth * 0.5, bottom + 92 + (moreUi ? moreUi.height * 0.5 : 56), 0);
        }
    }

    /** 只在初始化和尺寸变化时重绘，让顶部文字融入地图边缘。 */
    private drawHudTopShade(width: number, height: number): void {
        if (!this._hudTopShade) {
            const shade = new Node('HudTopShade');
            shade.layer = this.node.layer;
            shade.addComponent(UITransform);
            this._hudTopShade = shade.addComponent(Graphics);
            this.node.addChild(shade);
            shade.setSiblingIndex(0);
        }
        const graphics = this._hudTopShade;
        const shadeHeight = 92;
        graphics.node.getComponent(UITransform).setContentSize(width, shadeHeight);
        graphics.node.setPosition(0, height * 0.5 - shadeHeight * 0.5, 0);
        graphics.clear();
        const bands = 32;
        const bandHeight = shadeHeight / bands;
        for (let i = 0; i < bands; i++) {
            graphics.fillColor = new Color(27, 29, 23, Math.round(220 * (1 - i / (bands - 1))));
            graphics.rect(-width * 0.5, shadeHeight * 0.5 - (i + 1) * bandHeight, width, bandHeight);
            graphics.fill();
        }
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
        label.string = name + " " + Tools.numberToShow(this.getResCount(itemId, resMap));
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

    protected onTellMe(data: any): void {
        const raw = data && (data.msg != null ? data.msg : (data.message != null ? data.message : (data.content != null ? data.content : data.text)));
        const msg = raw == null ? "" : String(raw).trim();
        if (msg.length === 0) {
            return;
        }
        EventMgr.emit(LogicEvent.showToast, msg);
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
