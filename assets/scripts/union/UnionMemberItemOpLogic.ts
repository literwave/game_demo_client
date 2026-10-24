import { _decorator, Component, Button, Node } from 'cc';
import { AudioManager } from '../common/AudioManager';
const { ccclass, property } = _decorator;

import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import UnionCommand from "./UnionCommand";
import { Member, Union } from "./UnionProxy";

@ccclass('UnionMemberItemOpLogic')
export default class UnionMemberItemOpLogic extends Component {


    @property(Button)
    kickButton: Button = null;

    @property(Button)
    abdicateButton: Button = null;

    @property(Button)
    appointButton: Button = null;

    
    @property(Button)
    unAppointButton: Button = null;
    

    protected _menberData:Member = null;

    protected onLoad():void{
        this.node.on(Node.EventType.TOUCH_END, this.click, this);
    }

    protected onDestroy():void{
        this.node.off(Node.EventType.TOUCH_END, this.click, this);
    }

    protected click():void{
        this.node.active = false;
        AudioManager.instance.playClick();
    }
    
    public setData(data):void{
        this._menberData = data;
        const proxy = UnionCommand.getInstance().proxy;
        const canKick = proxy.canKick(data.rid);
        const leader = proxy.myPos === 1;
        this.kickButton.node.active = canKick;
        this.abdicateButton.node.active = leader && canKick;
        this.appointButton.node.active = leader && data.pos === 3;
        this.unAppointButton.node.active = leader && data.pos === 2;
        this.node.active = canKick;
    }

    protected kick():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionKick(this._menberData.rid);
        this.node.active = false;
    }

    
    protected appoint():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionAppoint(this._menberData.rid, 1);
        this.node.active = false;
    }

    protected unAppoint():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionAppoint(this._menberData.rid, 2);
        this.node.active = false;
    }

    protected abdicate():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionAbdicate(this._menberData.rid);
        this.node.active = false;
    }
    

}
