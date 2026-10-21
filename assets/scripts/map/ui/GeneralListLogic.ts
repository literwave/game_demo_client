
import { _decorator, Component, ScrollView, Label } from 'cc';
const { ccclass, property } = _decorator;

import GeneralCommand from "../../general/GeneralCommand";
import TroopCommand from "../../general/TroopCommand";
import MapUICommand from "./MapUICommand";
import { ServerConfig } from "../../config/ServerConfig";
import { EventMgr } from '../../utils/EventMgr';
import ListLogic from '../../utils/ListLogic';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('GeneralListLogic')
export default class GeneralListLogic extends Component {

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Label)
    cntLab: Label = null;

    private _cunGeneral: number[] = [];
    private _type: number = 0;
    private _position: number = 0;
    private _convertSupported: boolean = false;

    protected onLoad(): void {
        this._convertSupported = GeneralCommand.getInstance().isProtocolAvailable(ServerConfig.general_convert);
        const convertNode = this.node.getChildByPath("New Node/convertBtn");
        if (convertNode) {
            convertNode.active = this._convertSupported;
        }
    }

    protected onEnable(): void {
        EventMgr.on(LogicEvent.updateMyGenerals, this.initGeneralCfg, this);
        EventMgr.on(LogicEvent.generalConvert, this.initGeneralCfg, this);
        EventMgr.on(LogicEvent.updateTroopList, this.initGeneralCfg, this);
        EventMgr.on(LogicEvent.chosedGeneral, this.onClickClose, this);
    }


    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }

    protected onClickConvert(): void {
        AudioManager.instance.playClick();
        if (!this._convertSupported) {
            EventMgr.emit(LogicEvent.showToast, "武将转换暂未开放");
            return;
        }
        EventMgr.emit(LogicEvent.openGeneralConvert);
        this.node.active = false;
    }

    protected onTuJianConvert(): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.openGeneralRoster);
        this.node.active = false;
    }

    protected initGeneralCfg(): void {
        if (!this.scrollView) {
            return;
        }

        const limit = 100;
        const proxy = GeneralCommand.getInstance().proxy;
        const cnt = proxy.getMyActiveGeneralCnt();
        if (this.cntLab) {
            this.cntLab.string = "(" + cnt + "/" + limit + ")";
        }

        const excluded = new Set<number>();
        this._cunGeneral.forEach((id) => {
            const heroIdx = Number(id);
            if (heroIdx > 0) {
                excluded.add(heroIdx);
            }
        });

        const list = proxy.getUseGenerals()
            .filter((general) => !excluded.has(general.hero_type))
            .map((general) => Object.assign({}, general, { listType: this._type, listPosition: this._position }));

        const comp = this.scrollView.node.getComponent(ListLogic);
        if (comp) {
            comp.setData(list);
        }
    }



    public setData(data: number[], type: number = 0, position: number = 0): void {
        this._cunGeneral = [];
        if (data && data.length > 0) {
            this._cunGeneral = data;
        }

        this._type = type;
        this._position = position;

        this.initGeneralCfg();
        GeneralCommand.getInstance().qryMyGenerals();
        TroopCommand.getInstance().requestTroops();
    }

}
