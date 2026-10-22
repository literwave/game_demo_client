import { _decorator, Component, Toggle, ScrollView, Prefab, Node, instantiate, tween, Tween, Vec3, UITransform, Label, Layout } from 'cc';
const { ccclass, property } = _decorator;

import { ArmyData } from "../../general/ArmyProxy";
import TroopCommand from "../../general/TroopCommand";
import { TroopData } from "../../general/TroopProxy";
import MapCommand from "../MapCommand";
import RightArmyItemLogic from "./RightArmyItemLogic";
import { MapCityData } from "../MapCityProxy";
import RightCityItemLogic from "./RightCityItemLogic";
import RightTagItemLogic from "./RightTagItemLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('RightInfoNodeLogic')
export default class RightInfoNodeLogic extends Component {
    @property([Toggle])
    toggles: Toggle[] = [];
    @property(ScrollView)
    armyScrollView: ScrollView = null;
    @property(ScrollView)
    cityScrollView: ScrollView = null;
    @property(ScrollView)
    tagsScrollView: ScrollView = null;

    @property(Prefab)
    armyItemPrefabs: Prefab = null;
    @property(Prefab)
    cityItemPrefabs: Prefab = null;

    @property(Prefab)
    tagItemPrefabs: Prefab = null;

    protected _armys: Node[] = [];

    private _collapsed: boolean = false;
    private _animating: boolean = false;
    private _expandedPos: Vec3 = new Vec3();
    private _collapsedX: number = 0;
    private _arrowNode: Node = null;
    private _arrowBasePos: Vec3 = new Vec3();
    private _tabExpandedPos: Vec3 = new Vec3();
    private _tabCollapsedPos: Vec3 = new Vec3();
    private _tabNode: Node = null;


    protected onLoad(): void {
        EventMgr.on(LogicEvent.updateArmyList, this.onUpdateArmyList, this);
        EventMgr.on(LogicEvent.updateArmy, this.onUpdateArmy, this);
        EventMgr.on(LogicEvent.updateTroopList, this.onUpdateTroopList, this);
        EventMgr.on(LogicEvent.updateTroop, this.onUpdateTroop, this);
        EventMgr.on(LogicEvent.updateTag, this.onUpdateTag, this);

        this.layoutPanel();
        this.scheduleOnce(this.layoutPanel, 0);
        if (this.node.parent) {
            this.node.parent.on(Node.EventType.SIZE_CHANGED, this.layoutPanel, this);
        }
        this.initToggleEvents();
        this.armyScrollView.node.active = true;
        this.cityScrollView.node.active = false;
        this.tagsScrollView.node.active = false;
        this.initArmys();
        // MapUILogic 统一请求部队数据，避免首屏重复请求和重建列表。
    }

    protected onDestroy(): void {
        if (this.node.parent) {
            this.node.parent.off(Node.EventType.SIZE_CHANGED, this.layoutPanel, this);
        }
        Tween.stopAllByTarget(this.node);
        if (this._tabNode) {
            Tween.stopAllByTarget(this._tabNode);
        }
        EventMgr.targetOff(this);
        if (this._arrowNode) {
            Tween.stopAllByTarget(this._arrowNode);
        }
        this.toggles.forEach((toggle: Toggle) => {
            if (toggle && toggle.node && toggle.node.isValid) {
                toggle.node.off(Toggle.EventType.TOGGLE, this.onClockToggle, this);
            }
        });
        this._armys.length = 0;
        this._armys = null;
    }

    protected initArmys(): void {
        const troops: TroopData[] = TroopCommand.getInstance().proxy.getTroops();
        const troopMap: Map<number, TroopData> = new Map<number, TroopData>();
        troops.forEach((troop) => troopMap.set(troop.troopIdx, troop));

        const troopCount = Math.max(3, troops.length > 0 ? troops[troops.length - 1].troopIdx : 0);
        while (this._armys.length > troopCount) {
            const item = this._armys.pop();
            item.removeFromParent();
            item.destroy();
        }
        for (let troopIdx: number = 1; troopIdx <= troopCount; troopIdx++) {
            let troop = troopMap.get(troopIdx);
            if (!troop) {
                troop = new TroopData();
                troop.troopIdx = troopIdx;
            }
            let item = this._armys[troopIdx - 1];
            if (!item || !item.isValid) {
                item = instantiate(this.armyItemPrefabs);
                item.parent = this.armyScrollView.content;
                this._armys[troopIdx - 1] = item;
            }
            const itemLogic = item.getComponent(RightArmyItemLogic);
            if (itemLogic) {
                itemLogic.setTroopData(troop, troopIdx);
            }
        }
        this.armyScrollView.content.getComponent(Layout)?.updateLayout();
    }

    protected initCitys(): void {
        let citys: MapCityData[] = MapCommand.getInstance().cityProxy.getMyCitys();
        this.clearList(this.cityScrollView);
        if (citys && citys.length > 0) {
            for (let i: number = 0; i < citys.length; i++) {
                let item: Node = instantiate(this.cityItemPrefabs);
                item.parent = this.cityScrollView.content;
                item.getComponent(RightCityItemLogic).setArmyData(citys[i]);
            }
        }
    }

    protected initTags(): void {
        let tags = MapCommand.getInstance().proxy.getPosTags();
        this.clearList(this.tagsScrollView);
        for (let i: number = 0; i < tags.length; i++) {
            var tag = tags[i];


            let item: Node = instantiate(this.tagItemPrefabs);
            item.parent = this.tagsScrollView.content;
            item.getComponent(RightTagItemLogic).setData(tag);
        }
    }

    protected onUpdateArmyList(datas: ArmyData[]): void {
        this.initArmys();
    }

    protected onUpdateArmy(data: ArmyData): void {
        const mainCity = MapCommand.getInstance().cityProxy.getMyMainCity();
        if (data && mainCity && this._armys[data.order - 1] && mainCity.cityId == data.cityId) {
            this._armys[data.order - 1].getComponent(RightArmyItemLogic).setArmyData(data);
        }
    }

    protected onUpdateTroopList(): void {
        this.initArmys();
    }

    protected onUpdateTroop(troop: TroopData): void {
        if (!troop) {
            return;
        }
        const item = this._armys[troop.troopIdx - 1];
        if (item) {
            const itemLogic = item.getComponent(RightArmyItemLogic);
            if (itemLogic) {
                itemLogic.setTroopData(troop, troop.troopIdx);
            }
        } else {
            this.initArmys();
        }
    }

    protected onUpdateTag(): void {
        if (this.tagsScrollView.node.active) this.initTags();
    }

    private clearList(scrollView: ScrollView): void {
        const items = scrollView.content.children.slice();
        scrollView.content.removeAllChildren();
        items.forEach(item => item.destroy());
    }

    private initToggleEvents(): void {
        this.toggles.forEach((toggle: Toggle) => {
            if (toggle && toggle.node) {
                toggle.node.off(Toggle.EventType.TOGGLE, this.onClockToggle, this);
                toggle.node.on(Toggle.EventType.TOGGLE, this.onClockToggle, this);
            }
        });
    }

    private layoutPanel(): void {
        const parentUi = this.node.parent ? this.node.parent.getComponent(UITransform) : null;
        const panelUi = this.getComponent(UITransform);
        if (!parentUi || !panelUi) {
            return;
        }
        Tween.stopAllByTarget(this.node);
        if (this._tabNode) {
            Tween.stopAllByTarget(this._tabNode);
        }
        this._animating = false;
        if (this._arrowNode) {
            Tween.stopAllByTarget(this._arrowNode);
            this._arrowNode.setPosition(this._arrowBasePos);
        }
        this.node.setPosition(parentUi.width * 0.5 - 24 - panelUi.width * 0.5, parentUi.height * 0.5 - 116 - panelUi.height * 0.5, 0);
        this.initCollapseState();
        if (this._collapsed) {
            this.node.setPosition(this._collapsedX, this._expandedPos.y, this._expandedPos.z);
            if (this._tabNode) {
                this._tabNode.setPosition(this._tabCollapsedPos);
            }
        } else if (this._tabNode) {
            this._tabNode.setPosition(this._tabExpandedPos);
        }
    }

    private initCollapseState(): void {
        this._expandedPos.set(this.node.position);
        this._tabNode = this.node.parent ? this.node.parent.getChildByName('RightInfoTab') : null;
        this._arrowNode = this._tabNode ? this._tabNode.getChildByName('Arrow') : null;
        if (this._arrowNode) {
            this._arrowBasePos.set(this._arrowNode.position);
        }
        this._tabExpandedPos.set(this._tabNode ? this._tabNode.position : this.node.position);
        this._tabCollapsedPos.set(this._tabExpandedPos);

        const parentUi: UITransform = this.node.parent ? this.node.parent.getComponent(UITransform) : null;
        const selfUi: UITransform = this.getComponent(UITransform);
        const tabUi: UITransform = this._tabNode ? this._tabNode.getComponent(UITransform) : null;
        if (parentUi && selfUi) {
            this._collapsedX = parentUi.width * 0.5 + selfUi.width * 0.5;
            if (this._tabNode && tabUi) {
                this._tabExpandedPos.set(
                    this._expandedPos.x - selfUi.width * 0.5 - tabUi.width * 0.5,
                    this._expandedPos.y,
                    this._expandedPos.z
                );
                this._tabCollapsedPos.set(
                    this._tabExpandedPos.x + (this._collapsedX - this._expandedPos.x),
                    this._expandedPos.y,
                    this._expandedPos.z
                );
            }
        }
        this.refreshCollapseVisual();
    }

    private refreshCollapseVisual(): void {
        if (!this._tabNode) {
            return;
        }
        if (this._arrowNode) {
            this._arrowNode.angle = this._collapsed ? -90 : 90;
        }
        const hint: Node = this._tabNode.getChildByName('Hint');
        const label: Label = hint ? hint.getComponent(Label) : null;
        if (label) {
            label.string = this._collapsed ? '展\n开' : '收\n起';
        }
        this.startArrowIdle();
    }

    private startArrowIdle(): void {
        if (!this._arrowNode) {
            return;
        }
        Tween.stopAllByTarget(this._arrowNode);
        this._arrowNode.setPosition(this._arrowBasePos);
        const drift: number = this._collapsed ? -2 : 2;
        tween(this._arrowNode)
            .to(1.1, { position: new Vec3(this._arrowBasePos.x + drift, this._arrowBasePos.y, this._arrowBasePos.z) }, { easing: 'sineInOut' })
            .to(1.1, { position: new Vec3(this._arrowBasePos) }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }

    onToggleCollapse(): void {
        if (this._animating) {
            return;
        }
        AudioManager.instance.playClick();
        this._animating = true;
        this._collapsed = !this._collapsed;
        this.refreshCollapseVisual();
        const target: Vec3 = new Vec3(this._collapsed ? this._collapsedX : this._expandedPos.x, this._expandedPos.y, this._expandedPos.z);
        tween(this.node)
            .to(0.34, { position: target }, { easing: 'cubicInOut' })
            .call(() => {
                this._animating = false;
            })
            .start();

        if (this._tabNode) {
            const tabTarget: Vec3 = new Vec3(
                this._collapsed ? this._tabCollapsedPos.x : this._tabExpandedPos.x,
                this._tabExpandedPos.y,
                this._tabExpandedPos.z
            );
            tween(this._tabNode)
                .to(0.34, { position: tabTarget }, { easing: 'cubicInOut' })
                .start();
        }
    }

    onClockToggle(toggle: Toggle): void {
        if (!toggle || !toggle.isChecked) {
            return;
        }
        AudioManager.instance.playClick();
        let index: number = this.toggles.indexOf(toggle);
        if (index == 1) {
            this.armyScrollView.node.active = false;
            this.cityScrollView.node.active = true;
            this.tagsScrollView.node.active = false;
            this.initCitys();
        } else if (index == 0) {
            this.armyScrollView.node.active = true;
            this.cityScrollView.node.active = false;
            this.tagsScrollView.node.active = false;
        } else {
            this.armyScrollView.node.active = false;
            this.cityScrollView.node.active = false;
            this.tagsScrollView.node.active = true;
            this.initTags();
        }
    }
}
