
import { _decorator, Component, Prefab, ToggleContainer, Node, instantiate, view } from 'cc';
import GeneralCommand from "../../general/GeneralCommand";
import { ServerConfig } from '../../config/ServerConfig';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { EventMgr } from '../../utils/EventMgr';
import { styleGeneralHeader } from './GeneralDetailSkin';
const { ccclass, property } = _decorator;

@ccclass('GeneralInfoLogic')
export default class GeneralInfoLogic  extends Component {


    @property(Prefab)
    generalDesPrefab: Prefab = null;

    @property(Prefab)
    generalComposePrefab: Prefab = null;


    @property(Prefab)
    generalAddPrefab: Prefab = null;


    @property(ToggleContainer)
    generalToggleContainer: ToggleContainer = null;

    
    private _currData:any = null;
    private _cfgData:any = null;

    private _curIndex:number = 0;
    private _nodeList:Node[] = [];
    private _supportedTabs:boolean[] = [true, false, false];
    private _arranging = false;

    protected onLoad():void{
        EventMgr.on(LogicEvent.updateOneGenerals, this.updateOnce, this); 

        var des = instantiate(this.generalDesPrefab);
        des.parent = this.node;
        des.active = false;


        var comp = instantiate(this.generalComposePrefab);
        comp.parent = this.node;
        comp.active = false;


        var addd = instantiate(this.generalAddPrefab);
        addd.parent = this.node;
        addd.active = false;

        this._nodeList[0] = des;
        this._nodeList[1] = comp;
        this._nodeList[2] = addd;

        this._supportedTabs[1] = GeneralCommand.getInstance().isProtocolAvailable(ServerConfig.general_composeGeneral);
        this._supportedTabs[2] = GeneralCommand.getInstance().isProtocolAvailable(ServerConfig.general_addPrGeneral);
        const toggles = this.generalToggleContainer ? this.generalToggleContainer.toggleItems : [];
        for (let i = 1; i < this._supportedTabs.length; i++) {
            if (toggles[i] && toggles[i].node) {
                toggles[i].node.active = this._supportedTabs[i];
            }
            if (!this._supportedTabs[i] && this._nodeList[i]) {
                this._nodeList[i].active = false;
            }
        }
        this.refreshVisualLayout();
    }

    protected onEnable(): void {
        this.node.on(Node.EventType.SIZE_CHANGED, this.refreshVisualLayout, this);
        view.on('canvas-resize', this.refreshVisualLayout, this);
        view.on('design-resolution-changed', this.refreshVisualLayout, this);
        this.refreshVisualLayout();
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.SIZE_CHANGED, this.refreshVisualLayout, this);
        view.off('canvas-resize', this.refreshVisualLayout, this);
        view.off('design-resolution-changed', this.refreshVisualLayout, this);
    }

    public refreshVisualLayout(): void {
        if (this._arranging) return;
        this._arranging = true;
        try {
            styleGeneralHeader(this.node);
        } finally {
            this._arranging = false;
        }
    }

    protected start(): void {
        // mask 的旧适配脚本在子节点 onLoad 时仍可能执行，最后统一一次背景尺寸。
        this.refreshVisualLayout();
    }

    protected updateOnce(curData:any):void{
        this.setData(this._cfgData,curData)
    }
   

    protected onDestroy():void{
        this._nodeList = []
        EventMgr.targetOff(this);
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }



    public setData(cfgData:any,curData:any):void{
        this._currData = curData;
        this._cfgData = cfgData;
        this.setIndex(this._curIndex);
    }

    protected setIndex(index:number = 0):void{
        if (!this._supportedTabs[index]) {
            index = 0;
        }
        if (!this._nodeList[index]) {
            return;
        }
        this._curIndex = index;
        this.allVisible();
        this._nodeList[index].active = true;
        if (this.generalToggleContainer && this.generalToggleContainer.toggleItems[index]) {
            this.generalToggleContainer.toggleItems[index].isChecked = true;
        }

        let logicNameArr:string[] = ["GeneralDesLogic","GeneralComposeLogic","GeneralAddPrLogic"]
        let com = this._nodeList[index].getComponent(logicNameArr[index]);
        if(com){
            com.setData(this._cfgData, this._currData);
        }
    }


    protected allVisible():void{
        for(var i = 0; i < this._nodeList.length; i++){
            this._nodeList[i].active = false;
        }
    }

    protected selectHandle(event:any,other:any):void{
        // console.log("event:",event,other)
        AudioManager.instance.playClick();
        this.setIndex(other)
    }


}
