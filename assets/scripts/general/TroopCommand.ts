import { ServerConfig } from "../config/ServerConfig";
import { LogicEvent } from "../common/LogicEvent";
import { NetManager } from "../network/socket/NetManager";
import { ProtoManager } from "../network/pto/ProtoManager";
import { EventMgr } from "../utils/EventMgr";
import TroopProxy, { HeroIndexMap } from "./TroopProxy";

export default class TroopCommand {
    protected static _instance: TroopCommand;

    public static getInstance(): TroopCommand {
        if (this._instance == null) {
            this._instance = new TroopCommand();
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

    protected _proxy: TroopProxy = new TroopProxy();

    constructor() {
        EventMgr.on(ServerConfig.s2c_req_troop, this.onTroopList, this);
        EventMgr.on(ServerConfig.s2c_edit_troop, this.onEditTroop, this);
    }

    public onDestory(): void {
        EventMgr.targetOff(this);
    }

    public get proxy(): TroopProxy {
        return this._proxy;
    }

    public clearData(): void {
        this._proxy.clearData();
    }

    public requestTroops(): void {
        const msgName = ServerConfig.c2s_req_troop;
        if (!ProtoManager.getInstance().getIdByMsgType(msgName)) {
            console.warn("Troop protocol is not available:", msgName);
            return;
        }
        const protoData = ProtoManager.getInstance().encode(msgName, {});
        if (!protoData) {
            console.error("Failed to encode troop request");
            return;
        }
        NetManager.getInstance().send({ name: msgName, msg: protoData });
    }

    public editTroop(troopIdx: number, heroIdxMap: HeroIndexMap): void {
        const index = Number(troopIdx);
        if (!index) {
            console.error("editTroop skipped: invalid troopIdx", troopIdx);
            return;
        }
        const msgName = ServerConfig.c2s_edit_troop;
        if (!ProtoManager.getInstance().getIdByMsgType(msgName)) {
            console.warn("Troop protocol is not available:", msgName);
            return;
        }
        const pos2HeroMap: { [position: string]: number } = {};
        Object.keys(heroIdxMap || {}).forEach((heroKey) => {
            const heroIdx = Number(heroKey);
            const position = Number(heroIdxMap[heroKey]);
            if (!Number.isFinite(heroIdx) || !Number.isFinite(position) || heroIdx <= 0 || position < 0) {
                return;
            }
            pos2HeroMap[String(position)] = heroIdx;
        });
        const protoData = ProtoManager.getInstance().encode(msgName, {
            troopInfo: {
                troopIdx: index,
                pos2HeroMap: pos2HeroMap,
            },
        });
        if (!protoData) {
            console.error("Failed to encode troop edit request");
            return;
        }
        NetManager.getInstance().send({ name: msgName, msg: protoData });
    }

    protected onTroopList(data: any): void {
        const payload = this.getPayload(data);
        if (!payload) {
            return;
        }
        const list = payload.troopList || payload.troop_list || [];
        this._proxy.updateTroops(Array.isArray(list) ? list : []);
        EventMgr.emit(LogicEvent.updateTroopList, this._proxy.getTroops());
    }

    protected onEditTroop(data: any): void {
        const payload = this.getPayload(data);
        if (!payload) {
            return;
        }
        const troop = this._proxy.updateTroop(payload.troopInfo || payload.troop_info || payload);
        if (!troop) {
            console.warn("Troop edit response without troopIdx:", payload);
            return;
        }
        EventMgr.emit(LogicEvent.updateTroopList, this._proxy.getTroops());
        EventMgr.emit(LogicEvent.updateTroop, troop);
    }

    protected getPayload(data: any): any {
        if (!data) {
            return null;
        }
        const payload = data.msg && typeof data.msg === 'object' ? data.msg : data;
        if (payload.code != null && Number(payload.code) !== 0) {
            console.warn("Troop request failed:", payload.code);
            return null;
        }
        return payload;
    }
}
