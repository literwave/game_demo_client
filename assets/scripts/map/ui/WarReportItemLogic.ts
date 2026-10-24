import BattleCommand, { ReportBrief } from '../../battle/BattleCommand';
import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

import LoginCommand from "../../login/LoginCommand";
import { Role } from "../../login/LoginProxy";
import DateUtil from "../../utils/DateUtil";
import MapUICommand from "./MapUICommand";
import { WarReport } from "./MapUIProxy";
import { EventMgr } from '../../utils/EventMgr';
import GeneralItemLogic from './GeneralItemLogic';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('WarReportItemLogic')
export default class WarReportItemLogic extends Component {

    private _curData:ReportBrief = null;

    @property(Node)
    readBg:Node = null;

    @property([Node])
    ackNode:Node[] = [];

    @property([Node])
    defNode:Node[] = [];

    @property(Node)
    winNode:Node = null;

    @property(Node)
    loseNode:Node = null;

    @property(Label)
    timeLabel: Label = null;

    @property(Label)
    leftLabel: Label = null;

    @property(Label)
    rightLabel: Label = null;

    @property(Label)
    posLabel: Label = null;

    protected onLoad():void{
        this.winNode.active = this.loseNode.active = false;
    }

    protected updateItem(data: ReportBrief): void {
        this._curData = data;
        this.readBg.active = data.isRead;
        this.ackNode.forEach(node => node.active = false);
        this.defNode.forEach(node => node.active = false);
        this.winNode.active = data.result === 1;
        this.loseNode.active = data.result === 2;
        const detail = BattleCommand.getInstance().details.get(String(data.reportId));
        this.leftLabel.string = `${detail?.atkSide?.name || '攻方'}  ${data.atkPower}`;
        this.rightLabel.string = `${detail?.defSide?.name || '守方'}  ${data.defPower}`;
        this.timeLabel.string = DateUtil.converTimeStr(data.time * 1000, 'YYYY-MM-DD hh:mm:ss');
        this.posLabel.string = `(${data.pos?.x || 0},${data.pos?.y || 0})`;
    }

    protected setTeams(node:Node[],generals:any[]){
        for(var i = 0; i < node.length ;i++){
            let item:Node = node[i];
            let com = item.getComponent(GeneralItemLogic);
            var general = generals[i];
            if(general){
                item.active = true;
                if(com){
                    com.setWarReportData(general);
                }

            }else{
                item.active = false;
            }

        }
    }

    protected onClickItem():void{
        AudioManager.instance.playClick();

        var isRead = MapUICommand.getInstance().proxy.isRead(this._curData.reportId);
        if(!isRead){
            MapUICommand.getInstance().warRead(this._curData.reportId);
        }

        EventMgr.emit(LogicEvent.clickWarReport, this._curData);
       
    }

    protected onClickPos(){
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.closeReport);
        EventMgr.emit(LogicEvent.scrollToMap, this._curData.pos.x, this._curData.pos.y);
    }
}
