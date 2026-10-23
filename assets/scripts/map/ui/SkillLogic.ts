import { _decorator, Component, ScrollView } from 'cc';
const {ccclass, property} = _decorator;

import { GeneralData } from "../../general/GeneralProxy";
import GeneralCommand from "../../general/GeneralCommand";
import SkillCommand from "../../skill/SkillCommand";
import { Skill } from "../../skill/SkillProxy";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import ListLogic from '../../utils/ListLogic';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('SkillLogic')
export default class SkillLogic extends Component {

    @property(ScrollView)
    scrollView: ScrollView = null;

    _general: GeneralData = null;
    _type: number = 0;
    _skillPos : number = -1;


   
    protected onEnable():void{
       
        EventMgr.on(LogicEvent.skillListInfo, this.onSkillList, this);
        EventMgr.on(LogicEvent.updateGeneral, this.onSkillList, this);
        this.onSkillList();
        SkillCommand.getInstance().qrySkillList();
    }

    protected onDisable():void {
        EventMgr.targetOff(this)
    }

    protected onSkillList(){
    
        const proxy = SkillCommand.getInstance().proxy;
        const generals = GeneralCommand.getInstance().proxy.getMyGenerals();
        const items = proxy.skillConfs.map(conf => {
            const item = Object.assign(new Skill(), proxy.getSkillForDisplay(conf.cfgId));
            item.generals = generals.filter(general =>
                (general.skills || []).some(skill => skill && skill.cfgId === conf.cfgId)
            ).map(general => general.id);
            return item;
        });
        const comp = this.scrollView?.node.getComponent(ListLogic);
        if (comp) comp.setData(items);
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected onClickItem(data: Skill, target): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.openSkillInfo, data, this._type, this._general, this._skillPos);
    }


    /** type:0普通展示、type:1 学习、2:武将查看 **/
    public setData(type:number, general:GeneralData, skillPos: number) {
        this._type = type;
        this._general = general;
        this._skillPos = skillPos;
    }

}
