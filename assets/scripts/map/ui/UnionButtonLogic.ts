import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

import UnionCommand from "../../union/UnionCommand";
import { MapCityData } from "../MapCityProxy";
import MapCommand from "../MapCommand";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('UnionButtonLogic')
export default class WarButtonLogic extends Component {


    @property(Node)
    tipsNode:Node = null;

    protected onLoad():void{
        EventMgr.on(LogicEvent.updateUnionApply, this.updateView, this);
        this.tipsNode.active = false;
    }


    protected updateView():void{
        let cnt = UnionCommand.getInstance().proxy.getApplyCnt();
        this.tipsNode.active = cnt > 0;
    }

    protected onDestroy():void{
        EventMgr.targetOff(this);
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }


}
