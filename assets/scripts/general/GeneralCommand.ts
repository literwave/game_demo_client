import { ServerConfig } from "../config/ServerConfig";
import { NetManager } from "../network/socket/NetManager";
import GeneralProxy from "./GeneralProxy";
import { EventMgr } from "../utils/EventMgr";
import { LogicEvent } from "../common/LogicEvent";
import { ProtoManager } from "../network/pto/ProtoManager";
import { NetEvent } from '../network/socket/NetInterface';

const GENERAL_REQUEST_TIMEOUT_MS = 8000;

export default class GeneralCommand {
    //单例
    protected static _instance: GeneralCommand;
    public static getInstance(): GeneralCommand {
        if (this._instance == null) {
            this._instance = new GeneralCommand();
        }
        return this._instance;
    }

    public static destory(): boolean {
        if (this._instance) {
            this._instance.onDestory();
            this._instance = null;
            return true;
        }
        return false;
    }

    //数据model
    protected _proxy: GeneralProxy = new GeneralProxy();
    private _sessionActive = false;
    private _uiReady = false;
    private _generalsDirty = false;
    private _hasGeneralSnapshot = false;
    private _generalRequest: Promise<boolean> | null = null;
    private _resolveGeneralRequest: ((ready: boolean) => void) | null = null;
    private _generalRequestTimer: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        EventMgr.on(ServerConfig.s2c_req_all_hero_base_info, this.onMyGenerals, this);
        EventMgr.on(ServerConfig.s2c_sync_hero_base_info, this.onHeroSync, this);
        EventMgr.on(NetEvent.ServerReconnectSuccess, this.onReconnectSuccess, this);
        EventMgr.on(ServerConfig.general_push, this.onGeneralPush, this);
        EventMgr.on(ServerConfig.general_drawGeneral, this.onDrawGenerals, this);
        EventMgr.on(ServerConfig.general_composeGeneral, this.onComposeGeneral, this);
        EventMgr.on(ServerConfig.general_addPrGeneral, this.onAddPrGeneral, this);
        EventMgr.on(ServerConfig.general_convert, this.onGeneralConvert, this);
        EventMgr.on(ServerConfig.general_upSkill, this.onUpSkill, this);
        EventMgr.on(ServerConfig.general_downSkill, this.onDownSkill, this);
        EventMgr.on(ServerConfig.general_lvSkill, this.onLvSkill, this);


    }

    public onDestory(): void {
        this.clearData();
        EventMgr.targetOff(this);
    }

    public clearData(): void {
        this._sessionActive = false;
        this._uiReady = false;
        this._generalsDirty = false;
        this._hasGeneralSnapshot = false;
        this.completeGeneralRequest(false);
        this._proxy.clearData();
    }

    /** 登录验证完成后立即请求，接收数据不依赖地图或界面是否已创建。 */
    public beginLoading(): Promise<boolean> {
        this._sessionActive = true;
        this._uiReady = false;
        return this.qryMyGenerals();
    }

    public setUIReady(): void {
        if (!this._sessionActive || this._uiReady) return;
        this._uiReady = true;
        if (this._generalsDirty) this.notifyGeneralsChanged();
    }

    private notifyGeneralsChanged(): void {
        this._generalsDirty = true;
        if (!this._uiReady) return;
        this._generalsDirty = false;
        EventMgr.emit(LogicEvent.updateGeneral);
        EventMgr.emit(LogicEvent.updateMyGenerals);
    }

    private onReconnectSuccess(): void {
        if (!this._sessionActive) return;
        this.completeGeneralRequest(false);
        this._hasGeneralSnapshot = false;
        this.qryMyGenerals();
    }

    public isProtocolAvailable(msgName: string): boolean {
        const id = ProtoManager.getInstance().getIdByMsgType(msgName);
        return id != null && id > 0;
    }

    public get proxy(): GeneralProxy {
        return this._proxy;
    }

    /**我的将领列表*/
    protected onMyGenerals(data: any): void {
        if (!this._sessionActive) return;
        const payload = data && data.msg && typeof data.msg === 'object' ? data.msg : data;
        if (!payload || (payload.code != null && Number(payload.code) !== 0)) {
            this.completeGeneralRequest(false);
            return;
        }
        this._proxy.setMyGenerals(payload.heroInfoList || payload.hero_info_list || []);
        this._hasGeneralSnapshot = true;
        this.completeGeneralRequest(true);
        this.notifyGeneralsChanged();
    }

    protected onHeroSync(data: any): void {
        if (!this._sessionActive) return;
        const payload = data && data.msg && typeof data.msg === 'object' ? data.msg : data;
        const heroInfo = payload ? (payload.heroInfo || payload.hero_info) : null;
        if (!heroInfo) {
            return;
        }
        this._proxy.updateGeneral(heroInfo);
        this.notifyGeneralsChanged();
    }

    protected onGeneralPush(data: any): void {

        this._proxy.updateGeneral(data.msg);
        EventMgr.emit(LogicEvent.updateGeneral);
        
    }

    protected onDrawGenerals(data: any): void {
        if (data.code == 0) {
            this._proxy.updateMyGenerals(data.msg.generals);
            EventMgr.emit(LogicEvent.updateMyGenerals);
            EventMgr.emit(LogicEvent.openDrawResult, data.msg.generals);
        }
        EventMgr.emit(LogicEvent.hideWaiting);
    }

    protected onComposeGeneral(data: any): void {
        console.log("onComposeGeneral ", data);
        if (data.code == 0) {
            this._proxy.updateMyGenerals(data.msg.generals);
            EventMgr.emit(LogicEvent.updateMyGenerals);
            EventMgr.emit(LogicEvent.updateOneGenerals, data.msg.generals[data.msg.generals.length - 1]);
        }
    }



    protected onAddPrGeneral(data: any): void {
        console.log("onAddPrGeneral ", data);
        if (data.code == 0) {
            this._proxy.updateGeneral(data.msg.general);
            EventMgr.emit(LogicEvent.updateOneGenerals, data.msg.general);
        }
    }

    protected onGeneralConvert(data: any): void {
        console.log("onGeneralConvert ", data);
        if (data.code == 0) {
            this._proxy.removeMyGenerals(data.msg.gIds);
            EventMgr.emit(LogicEvent.generalConvert, data.msg);
        }
    }

    protected onUpSkill(data: any): void {
        console.log("onUpSkill ", data);

    }


    protected onDownSkill(data: any): void {
        console.log("onDownSkill ", data);

    }

    protected onLvSkill(data: any): void {
        console.log("onLvSkill ", data);
    }


    /**我的角色属性*/
    public updateMyProperty(datas: any[]): void {
        this._proxy.updateMyGenerals(datas);
        EventMgr.emit(LogicEvent.updateMyGenerals);
    }

    public qryMyGenerals(force: boolean = false): Promise<boolean> {
        if (!this._sessionActive) return Promise.resolve(false);
        if (this._generalRequest) return this._generalRequest;
        if (this._hasGeneralSnapshot && !force) return Promise.resolve(true);
        var msgName = ServerConfig.c2s_req_all_hero_base_info;
        var protoData = ProtoManager.getInstance().encode(msgName, {
        });

        if (!protoData) {
            console.error("Failed to encode hero request");
            return Promise.resolve(false);
        }

        var sendData = {
            name: msgName,
            msg: protoData, // 这里直接传 Uint8Array
        };
        const request = new Promise<boolean>((resolve) => this._resolveGeneralRequest = resolve);
        this._generalRequest = request;
        this._generalRequestTimer = setTimeout(() => {
            console.warn('武将协议等待超时，后续打开界面可重试');
            this.completeGeneralRequest(false);
        }, GENERAL_REQUEST_TIMEOUT_MS);
        NetManager.getInstance().send(sendData);
        return request;
    }

    private completeGeneralRequest(ready: boolean): void {
        if (this._generalRequestTimer !== null) clearTimeout(this._generalRequestTimer);
        this._generalRequestTimer = null;
        const resolve = this._resolveGeneralRequest;
        this._resolveGeneralRequest = null;
        this._generalRequest = null;
        if (resolve) resolve(ready);
    }


    /**
     * 抽卡
     * @param drawTimes 
     */
    public drawGenerals(drawTimes: number = 1): void {
        let sendData: any = {
            name: ServerConfig.general_drawGeneral,
            msg: {
                drawTimes: drawTimes
            }
        };
        NetManager.getInstance().send(sendData);
    }



    /**
     * 
     * @param compId 
     * @param gIds 
     */
    public composeGeneral(compId: number = 1, gIds: number[] = []): void {
        let sendData: any = {
            name: ServerConfig.general_composeGeneral,
            msg: {
                compId: compId,
                gIds: gIds
            }
        };
        NetManager.getInstance().send(sendData);
    }


    public addPrGeneral(compId: number = 1, force_add: number, strategy_add: number, defense_add: number, speed_add: number, destroy_add: number): void {
        let sendData: any = {
            name: ServerConfig.general_addPrGeneral,
            msg: {
                compId: compId,
                forceAdd: force_add,
                strategyAdd: strategy_add,
                defenseAdd: defense_add,
                speedAdd: speed_add,
                destroyAdd: destroy_add
            }
        };
        NetManager.getInstance().send(sendData);
    }

    public convert(gIds: number[]): void {
        let sendData: any = {
            name: ServerConfig.general_convert,
            msg: {
                gIds: gIds
            }
        };
        NetManager.getInstance().send(sendData);
    }

    public upSkill(gId: number, cfgId: number, pos: number): void {
        let sendData: any = {
            name: ServerConfig.general_upSkill,
            msg: {
                gId: gId,
                cfgId: cfgId,
                pos: Number(pos)
            }
        };

        console.log("send upSkill:", sendData);
        NetManager.getInstance().send(sendData);
    }

    public downSkill(gId: number, cfgId: number, pos: number): void {
        let sendData: any = {
            name: ServerConfig.general_downSkill,
            msg: {
                gId: gId,
                cfgId: cfgId,
                pos: Number(pos)
            }
        };
        NetManager.getInstance().send(sendData);
    }


    public lvSkill(gId: number, pos: number) {
        let sendData: any = {
            name: ServerConfig.general_lvSkill,
            msg: {
                gId: gId,
                pos: Number(pos)
            }
        };
        NetManager.getInstance().send(sendData);
    }
}
