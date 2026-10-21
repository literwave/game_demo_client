import { _decorator, Component, Label, Layout, Prefab, Node, EventTouch, instantiate } from 'cc';
const { ccclass, property } = _decorator;

import GeneralCommand from "../../general/GeneralCommand";
import { GeneralData } from "../../general/GeneralProxy";
import SkillCommand from "../../skill/SkillCommand";
import GeneralItemLogic, { GeneralItemType } from "./GeneralItemLogic";
import SkillIconLogic from "./SkillIconLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('GeneralDesLogic')
export default class GeneralDesLogic extends Component {

    @property(Label)
    nameLab: Label = null;

    @property(Layout)
    srollLayout: Layout = null;

    @property(Label)
    lvLabel: Label = null;

    @property(Label)
    foreLabel: Label = null;

    @property(Label)
    defenseLabel: Label = null;

    @property(Label)
    speedLabel: Label = null;

    @property(Label)
    strategyLabel: Label = null;

    @property(Label)
    destroyLabel: Label = null;

    @property(Label)
    expLabel: Label = null;

    @property(Label)
    powerLabel: Label = null;

    @property(Label)
    costLabel: Label = null;


    @property(Prefab)
    generalItemPrefab: Prefab = null;

    @property(Node)
    generalItemParent: Node = null;

    @property([Node])
    skillIcons: Node[] = [];

    @property([Label])
    skillNameLab: Label[] = [];

    private _currData: GeneralData = null;
    private _cfgData: any = null;


    private _nameObj: any = {};
    private _addPrObj: any = {};
    private _generalNode: Node = null;

    protected onEnable() {
        EventMgr.on(LogicEvent.updateGeneral, this.updateGeneral, this)
    }

    protected onDisable() {
        EventMgr.targetOff(this);
    }

    protected onLoad(): void {

        this._nameObj = {
            force: "武力",
            strategy: "战略",
            defense: "防御",
            speed: "速度",
            destroy: "破坏",
        };

        this._generalNode = instantiate(this.generalItemPrefab);
        this._generalNode.parent = this.generalItemParent;
    }

    protected updateGeneral() {
        if (!this._currData) {
            return;
        }
        var data = GeneralCommand.getInstance().proxy.getMyGeneral(this._currData.hero_type);
        if (data) {
            this.setData(this._cfgData, data);
        }
    }

    public setData(cfgData: any, curData: GeneralData): void {
        if (!cfgData || !curData) {
            return;
        }
        this._currData = curData;
        this._cfgData = cfgData;

        var nextCfg = GeneralCommand.getInstance().proxy.getGeneralLevelCfg(this._currData.level + 1);
        var levelExp = nextCfg ? nextCfg.exp : "MAX";
        var maxLevel: number = GeneralCommand.getInstance().proxy.getMaxLevel();
        if (this.lvLabel) this.lvLabel.string = '等级:' + this._currData.level + "/" + maxLevel;
        if (this.expLabel) this.expLabel.string = "经验:" + curData.exp + "/" + levelExp;

        if (this.nameLab) this.nameLab.string = this._cfgData.name;

        this._addPrObj = {
            force: this._currData.force_added,
            strategy: this._currData.strategy_added,
            defense: this._currData.defense_added,
            speed: this._currData.speed_added,
            destroy: this._currData.destroy_added,
        };


        if (this.foreLabel) this.foreLabel.string = "攻击:" + this.formatStat(cfgData.attack);
        if (this.strategyLabel) this.strategyLabel.string = "生命:" + this.formatStat(cfgData.hp);
        if (this.defenseLabel) this.defenseLabel.string = "防御:" + this.formatStat(cfgData.defense);
        if (this.speedLabel) this.speedLabel.string = "速度:" + this.formatStat(cfgData.speed);
        if (this.destroyLabel) this.destroyLabel.string = "暴击:" + this.formatStat(cfgData.crit);

        var com = this._generalNode ? this._generalNode.getComponent(GeneralItemLogic) : null;
        if (com) {
            com.updateItem(this._currData);
        }

        if (this.powerLabel) this.powerLabel.string = "职业:" + (cfgData.heroClass || "无");
        if (this.costLabel) this.costLabel.string = "技能:" + (cfgData.skill || "无");

        const skills = curData.skills || [];
        for (let index = 0; index < this.skillIcons.length; index++) {
            if (index >= skills.length) {
                const icon = this.skillIcons[index];
                const iconNameLab = this.skillNameLab[index];
                if (icon && icon.getComponent(SkillIconLogic)) {
                    icon.getComponent(SkillIconLogic).setData(null, null);
                }
                if (iconNameLab) {
                    iconNameLab.string = index == 0 ? (cfgData.skill || "") : "";
                }
                continue;
            }
            let gSkill = curData.skills[index];
            let icon = this.skillIcons[index];
            let iconNameLab = this.skillNameLab[index];

            if (gSkill == null) {
                if (icon && icon.getComponent(SkillIconLogic)) {
                    icon.getComponent(SkillIconLogic).setData(null, null);
                }
                if (iconNameLab) iconNameLab.string = "";
            } else {

                let skillConf = SkillCommand.getInstance().proxy.getSkillCfg(gSkill.cfgId);
                let skill = SkillCommand.getInstance().proxy.getSkill(gSkill.cfgId);
                if (skillConf && skill) {
                    icon.getComponent(SkillIconLogic).setData(skill, gSkill);
                    iconNameLab.string = skillConf.name;
                } else {
                    if (icon && icon.getComponent(SkillIconLogic)) {
                        icon.getComponent(SkillIconLogic).setData(null, null);
                    }
                    if (iconNameLab) iconNameLab.string = "";
                }
            }
        }
    }

    private getAttrStr(key: string): string {
        let hero_type = this._currData.hero_type;
        let cfg = GeneralCommand.getInstance().proxy.getGeneralCfg(hero_type);
        if (!cfg) return this._nameObj[key] + ": 0.00";
        var str = GeneralData.getPrStr(cfg[key], this._addPrObj[key], this._currData.level, cfg[key + "_grow"]);
        return this._nameObj[key] + ":" + str;
    }

    private formatStat(value: any): string {
        const numberValue = Number(value || 0);
        return Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(2);
    }

    protected onClickSkill(event: EventTouch, pos) {
        AudioManager.instance.playClick();
        console.log("event", event, pos);
        var node: Node = event.target;
        const skillIcon = node ? node.getComponent(SkillIconLogic) : null;
        if (!skillIcon) {
            return;
        }
        var isEmpty = skillIcon.isEmpty();
        if (isEmpty) {
            EventMgr.emit(LogicEvent.openSkill, 1, this._currData, pos);
        } else {
            let skill = skillIcon.getSkill();
            EventMgr.emit(LogicEvent.openSkillInfo, skill, 2, this._currData, pos);
        }
    }

}
