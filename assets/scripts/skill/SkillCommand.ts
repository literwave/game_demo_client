import { _decorator } from 'cc';
import { ServerConfig } from "../config/ServerConfig";
import { NetManager } from "../network/socket/NetManager";
import SkillProxy from "./SkillProxy";
import { EventMgr } from '../utils/EventMgr';
import { LogicEvent } from '../common/LogicEvent';
import { ProtoManager } from '../network/pto/ProtoManager';

export default class SkillCommand {
// //单例
    protected static _instance: SkillCommand;
    public static getInstance(): SkillCommand {
        if (this._instance == null) {
        this._instance = new SkillCommand();
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
    constructor() {
        EventMgr.on(ServerConfig.skill_list, this.onSkillList, this);
        EventMgr.on(ServerConfig.skill_push, this.onSkillPush, this);
    }
    protected _proxy: SkillProxy = new SkillProxy();
    public onDestory(): void {
        EventMgr.targetOff(this);
    }
    public get proxy(): SkillProxy {
        return this._proxy;
    }
    public qrySkillList(): boolean {
        const proto = ProtoManager.getInstance();
        const name = ServerConfig.skill_list;
        // 当前协议仅同步武将已装备技能，图鉴先使用本地配置展示。
        if (proto.getIdByMsgType(name) == null) return false;
        const msg = proto.encode(name, {});
        if (!msg) return false;
        NetManager.getInstance().send({ name, msg });
        return true;
    }
    
    protected onSkillList(data: any): void {
        console.log("onSkillList", data);
        if (data.code == 0) {
            this._proxy.updateSkills(data.msg.list);
            EventMgr.emit(LogicEvent.skillListInfo);
        }
    }
    protected onSkillPush(data: any): void {
        console.log("onSkillPush", data);
        this._proxy.updateSkills([data.msg]);
        EventMgr.emit(LogicEvent.updateGeneral);
    }
}
