import { JsonAsset, resources } from 'cc';
import { LogicEvent } from '../common/LogicEvent';
import { ServerConfig } from '../config/ServerConfig';
import ConfigManager from '../core/ConfigManager';
import { NetManager } from '../network/socket/NetManager';
import { ProtoManager } from '../network/pto/ProtoManager';
import { EventMgr } from '../utils/EventMgr';
import SystemOpenProxy, { SystemOpenConfig } from './SystemOpenProxy';

export default class SystemOpenCommand {
    protected static _instance: SystemOpenCommand;

    public static getInstance(): SystemOpenCommand {
        if (this._instance == null) {
            this._instance = new SystemOpenCommand();
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

    protected _proxy: SystemOpenProxy = new SystemOpenProxy();
    private _configReady: boolean = false;
    private _configLoading: boolean = false;
    private _configWaiters: Array<() => void> = [];

    constructor() {
        EventMgr.on(ServerConfig.s2c_req_system_open, this.onSystemOpenList, this);
        EventMgr.on(ServerConfig.s2c_sync_system_open, this.onSystemOpenSync, this);
        this.loadConfig();
    }

    public onDestory(): void {
        EventMgr.targetOff(this);
    }

    public get proxy(): SystemOpenProxy {
        return this._proxy;
    }

    public whenConfigReady(callback: () => void): void {
        if (this._configReady) {
            callback();
            return;
        }
        this._configWaiters.push(callback);
    }

    public getConfig(id: number): SystemOpenConfig | null {
        return this._proxy.getConfig(id);
    }

    public isSystemOpen(id: number): boolean {
        return this._proxy.isOpened(id);
    }

    public requestSystemOpen(): void {
        const msgName = ServerConfig.c2s_req_system_open;
        if (!ProtoManager.getInstance().isReady()) {
            console.warn("SystemOpen request skipped: ProtoManager not ready");
            return;
        }
        const protoData = ProtoManager.getInstance().encode(msgName, {});
        if (!protoData) {
            console.error("Failed to encode system open request");
            return;
        }
        NetManager.getInstance().send({
            name: msgName,
            msg: protoData,
        });
    }

    private loadConfig(): void {
        if (this._configLoading || this._configReady) {
            return;
        }

        this._configLoading = true;
        resources.load('config/SystemOpen', JsonAsset, (error: Error, asset: JsonAsset) => {
            this._configLoading = false;
            if (error || !asset) {
                console.warn("SystemOpen config load failed:", error);
                const fallback = ConfigManager.getInstance().getConfig("SystemOpen");
                this.applyConfigs(Array.isArray(fallback) ? fallback : []);
                return;
            }
            this.applyConfigs(Array.isArray(asset.json) ? asset.json : []);
        });
    }

    private applyConfigs(list: any[]): void {
        this._proxy.setConfigs(list);
        this._configReady = true;
        const waiters = this._configWaiters.slice();
        this._configWaiters.length = 0;
        waiters.forEach((callback) => callback());
    }

    private onSystemOpenList(data: any): void {
        const payload = this.getPayload(data);
        if (!payload) {
            return;
        }
        const ids = payload.systemIdList || payload.system_id_list || payload.ids || [];
        this._proxy.setOpenedIds(Array.isArray(ids) ? ids : []);
        EventMgr.emit(LogicEvent.systemOpenUpdated, this._proxy.getOpenedIds());
    }

    private onSystemOpenSync(data: any): void {
        const payload = this.getPayload(data);
        if (!payload) {
            return;
        }
        const id = Number(payload.systemId != null ? payload.systemId : (payload.system_id != null ? payload.system_id : payload.id));
        if (!id) {
            console.warn("SystemOpen sync received without a valid systemId:", data);
            return;
        }
        this._proxy.markOpened(id);
        EventMgr.emit(LogicEvent.systemOpenUpdated, this._proxy.getOpenedIds());
        EventMgr.emit(LogicEvent.systemUnlock, id);
    }

    private getPayload(data: any): any {
        if (!data) {
            return null;
        }
        if (data.msg && typeof data.msg === 'object') {
            return data.msg;
        }
        return data;
    }
}
