import { ServerConfig } from "../config/ServerConfig";
import { NetManager } from "../network/socket/NetManager";
import { Tools } from "../utils/Tools";
import LoginProxy, { toProtoInt } from "./LoginProxy";
import { NetEvent } from "../network/socket/NetInterface";
import MapCommand from "../map/MapCommand";
import { LocalCache } from "../utils/LocalCache";
import DateUtil from "../utils/DateUtil";
import { EventMgr } from "../utils/EventMgr";
import { Md5 } from "../libs/crypto/md5";
import { LogicEvent } from "../common/LogicEvent";
import { ProtoManager } from "../network/pto/ProtoManager";

/** 心跳间隔。短于常见 NAT 的 30 秒空闲断开 */
const HEARTBEAT_INTERVAL_MS = 5000;
/** 连续大约 3 次没收到回包就当掉线 */
const HEARTBEAT_TIMEOUT_MS = 15000;

export default class LoginCommand {
    //单例
    protected static _instance: LoginCommand;
    public static getInstance(): LoginCommand {
        if (this._instance == null) {
            this._instance = new LoginCommand();
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
    protected _proxy: LoginProxy = new LoginProxy();
    private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    /** 最近一次收到 s2c_heart_beat 的单调钟 */
    private _lastHeartbeatMono: number = 0;
    /** 本次断线是否正在自动重连，登录验证完成后恢复主界面 */
    private _reconnecting: boolean = false;

    constructor() {
        EventMgr.on(NetEvent.ServerCheckLogin, this.onServerConneted, this);
        EventMgr.on(NetEvent.ServerDisconnected, this.stopHeartbeat, this);
        EventMgr.on(NetEvent.ServerReconnecting, this.onServerReconnecting, this);
        EventMgr.on(NetEvent.ServerReconnectFailed, this.onReconnectFailed, this);
        EventMgr.on(LogicEvent.enterLogin, this.onEnterLogin, this);
        EventMgr.on(ServerConfig.s2c_user_login, this.onAccountLogin, this);
        EventMgr.on(ServerConfig.s2c_heart_beat, this.setServerTime, this);
        EventMgr.on(ServerConfig.s2c_user_login_ok, this.onEnterServer, this);
        EventMgr.on(ServerConfig.s2c_user_base_info, this.onGetUserBaseInfo, this);
        EventMgr.on(ServerConfig.s2c_req_user_res, this.onGetUserRes, this);
        EventMgr.on(ServerConfig.s2c_user_create, this.onUserCreate, this);
        EventMgr.on(ServerConfig.s2c_sync_item_data, this.onSyncItemData, this);
        EventMgr.on(ServerConfig.s2c_sync_user_res_list, this.onSyncUserResList, this);

        EventMgr.on(ServerConfig.account_reLogin, this.onAccountRelogin, this);
        EventMgr.on(ServerConfig.account_logout, this.onAccountLogout, this);
        EventMgr.on(ServerConfig.account_robLogin, this.onAccountRobLogin, this)
        EventMgr.on(ServerConfig.chat_login, this.onChatLogin, this)

    }

    public onDestory(): void {
        this.stopHeartbeat();
        EventMgr.targetOff(this);
    }

    //抢登录
    private onAccountRobLogin(): void {
        console.log("onAccountRobLogin")
        EventMgr.emit(LogicEvent.robLoginUI);
    }

    /**玩家基础信息*/
    private onGetUserBaseInfo(data: any): void {
        console.log("LoginProxy  getUserBaseInfo:", data);
        let name = data.name;
        if (name == "") {
            EventMgr.emit(LogicEvent.createRole);
        }
        else {
            data.userId = this._proxy.getLoginData().userId;
            console.log("LoginProxy  getUserBaseInfo userId:", data, this._proxy.getLoginData());
            this._proxy.saveEnterData(data);
            EventMgr.emit(LogicEvent.enterMap);
        }
        var msgName = ServerConfig.c2s_req_user_res;
        var protoData = ProtoManager.getInstance().encode(msgName, {
        });

        if (!protoData) {
            console.error("Failed to encode login request");
            return;
        }

        var sendData = {
            name: msgName,
            msg: protoData, // 这里直接传 Uint8Array
        };
        NetManager.getInstance().send(sendData);
    }

    /**玩家资源*/
    private onGetUserRes(data: any): void {
        if (!data) return;
        console.log("LoginProxy  onGetUserRes:", data);
        this._proxy.setRoleResData(data);
        // 资源回包只同步数据；不能用它决定是否进入加载页。
        EventMgr.emit(LogicEvent.upateMyRoleRes);
    }

    /**物品数量同步，主界面资源栏跟着刷新*/
    private onSyncItemData(data: any): void {
        if (!data) {
            return;
        }
        this._proxy.updateItemData(data.itemUid, data.itemId, data.itemCnt);
        EventMgr.emit(LogicEvent.upateMyRoleRes);
    }

    /**资源列表增量同步*/
    private onSyncUserResList(data: any): void {
        if (!data || !Array.isArray(data.resList)) {
            return;
        }
        const roleRes = this._proxy.getRoleResData();
        if (!roleRes || !Array.isArray(roleRes.resList)) {
            this._proxy.setRoleResData({ resList: data.resList.slice() });
        } else {
            const merged: Map<number, number> = new Map();
            for (const item of roleRes.resList) {
                if (item && item.k !== undefined) {
                    merged.set(Number(item.k), Number(item.v) || 0);
                }
            }
            for (const item of data.resList) {
                if (item && item.k !== undefined) {
                    merged.set(Number(item.k), Number(item.v) || 0);
                }
            }
            roleRes.resList = Array.from(merged.entries()).map(([k, v]) => ({ k, v }));
        }
        EventMgr.emit(LogicEvent.upateMyRoleRes);
    }

    /**创建玩家*/
    private onUserCreate(data: any): void {
        console.log("LoginProxy  onUserCreate:", data);
        if (!data || !data.name) return;
        this._proxy.saveEnterData(data);
        // 与已有角色保持一致：创建成功立即显示进度页，其它资源在加载阶段就绪。
        EventMgr.emit(LogicEvent.enterMap);
    }

    /**登录回调*/
    private onAccountLogin(data: any): void {
        console.log("LoginProxy  login:", data);

        this._proxy.saveLoginData(data);
        LocalCache.setLoginValidation(data);

        EventMgr.emit(LogicEvent.loginComplete, data.code);
    }

    /** 心跳回包。heartBeatTime 是服务器 unix 秒，倒计时在这之上加单调钟 */
    private setServerTime(data: any): void {
        if (!data) {
            return;
        }
        DateUtil.setServerTime(data.heartBeatTime);
        this._lastHeartbeatMono = DateUtil.monotonicNow();
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this._lastHeartbeatMono = DateUtil.monotonicNow();
        this.sendHeartbeat();
        this._heartbeatTimer = setInterval(() => this.tickHeartbeat(), HEARTBEAT_INTERVAL_MS);
    }

    private stopHeartbeat(): void {
        if (this._heartbeatTimer !== null) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
    }

    private tickHeartbeat(): void {
        const silent = DateUtil.monotonicNow() - this._lastHeartbeatMono;
        if (silent >= HEARTBEAT_TIMEOUT_MS) {
            console.log("heartbeat timeout", silent);
            this.stopHeartbeat();
            NetManager.getInstance().dropConnection();
            return;
        }
        this.sendHeartbeat();
    }

    private sendHeartbeat(): void {
        const msgName = ServerConfig.c2s_heart_beat;
        const protoData = ProtoManager.getInstance().encode(msgName, {});
        if (!protoData) {
            return;
        }
        NetManager.getInstance().send({
            name: msgName,
            msg: protoData,
        });
    }

    /**进入服务器回调*/
    private onEnterServer(data: any): void {
        console.log("LoginProxy  enter:", data);
        // MapCommand.getInstance()
        // EventMgr.emit(LogicEvent.enterMap);
        this._proxy.setLoginDataUserAndServerId(data);

        var msgName = ServerConfig.c2s_user_base_info;

        // 使用 ProtoManager 编码
        // 注意：这里需要根据你的 .proto 文件里的定义来写
        // 假设 login.proto 里定义的请求消息是 c2s_user_login，并且在 Login 包下
        var protoData = ProtoManager.getInstance().encode(msgName, {
        });

        if (!protoData) {
            console.error("Failed to encode login request");
            return;
        }

        var sendData = {
            name: msgName,
            msg: protoData, // 这里直接传 Uint8Array
        };
        NetManager.getInstance().send(sendData);
        this.startHeartbeat();
        if (this._reconnecting) {
            this._reconnecting = false;
            EventMgr.emit(NetEvent.ServerReconnectSuccess);
        }
    }

    /** 网关重连成功后重新验证，不走旧的 account.reLogin */
    private onServerConneted(): void {
        const loginData = this._proxy.getLoginData();
        console.log("LoginProxy  conneted:", loginData);

        if (loginData && loginData.token) {
            this.role_enterServer(loginData);
            return;
        }
        this._reconnecting = false;
        EventMgr.emit(NetEvent.ServerHandShake);
    }

    private onReconnectFailed(): void {
        this.stopHeartbeat();
        this._reconnecting = false;
    }

    private onServerReconnecting(): void {
        this._reconnecting = true;
    }

    private onEnterLogin(): void {
        this.stopHeartbeat();
        this._reconnecting = false;
    }

    /**重新登录回调回调*/
    private onAccountRelogin(data: any): void {
        //断线重新登录
        console.log("LoginProxy  relogin:", data);
        if (data.code == 0) {
            // EventMgr.emit(NetEvent.ServerHandShake);
            // this.role_enterServer(this._proxy.getSession());
        }
    }

    /**登出回调*/
    private onAccountLogout(data: any): void {
        //重换成功再次调用
        this._proxy.clear();
        EventMgr.emit(LogicEvent.enterLogin);

    }




    //聊天登录
    private onChatLogin(data: any): void {
        console.log("onChatLogin:", data);
    }

    public get proxy(): LoginProxy {
        return this._proxy;
    }

    /**
     * login
     * @param data 
     */
    public accountLogin(name: string, password: string) {

        var msgName = ServerConfig.c2s_user_login;
        var pwd = Md5.encrypt(password);

        // 使用 ProtoManager 编码
        // 注意：这里需要根据你的 .proto 文件里的定义来写
        // 假设 login.proto 里定义的请求消息是 c2s_user_login，并且在 Login 包下
        var protoData = ProtoManager.getInstance().encode(msgName, {
            account: name,
            passwd: pwd,
            accountType: 1, // 根据 proto 定义补充字段
            appId: "",
            cchid: "",
            serverId: 120,
            userId: 0
        });

        if (!protoData) {
            console.error("Failed to encode login request");
            return;
        }

        var send_data = {
            name: msgName,
            msg: protoData, // 这里直接传 Uint8Array
        };

        console.log("accountLogin:", send_data);
        NetManager.getInstance().send(send_data);
    }


    /**
     * create
     * @param uid 
     * @param nickName 
     * @param sex 
     * @param sid 
     * @param headId 
     */
    public role_create(uid: number, nickName: string, sex: number = 0, sid: number = 0, headId: number = 0): boolean {
        var msgName = ServerConfig.c2s_user_create;
        var protoData = ProtoManager.getInstance().encode(msgName, {
            sex: sex,
            name: nickName,
        });
        if (!protoData) return false;
        var send_data = {
            name: msgName,
            msg: protoData, // 这里直接传 Uint8Array
        };
        NetManager.getInstance().send(send_data);
        return true;
    }


    public role_enterServer(loginData) {
        var msgName = ServerConfig.c2s_verify_login;

        // 使用 ProtoManager 编码
        // 注意：这里需要根据你的 .proto 文件里的定义来写
        // 假设 login.proto 里定义的请求消息是 c2s_user_login，并且在 Login 包下
        var protoData = ProtoManager.getInstance().encode(msgName, {
            userId: toProtoInt(loginData.userId),
            passwd: loginData.passwd,
            token: loginData.token, // 根据 proto 定义补充字段
        });
        var send_data = {
            name: msgName,
            msg: protoData, // 这里直接传 Uint8Array
        };
        NetManager.getInstance().send(send_data);
    }

    /**
     * 重新登录
     * @param session 
     */
    public account_reLogin(session: string) {
        var api_name = ServerConfig.account_reLogin;
        var send_data = {
            name: api_name,
            msg: {
                session: session,
                hardware: Tools.getUUID()
            }
        };
        NetManager.getInstance().send(send_data);
    }


    /**
     * logout
     */
    public account_logout(): void {
        // 主动退出必须在断网或服务器未回包时也能完成；关闭连接同时取消自动重连。
        NetManager.getInstance().close();
        this._proxy.clear();
        EventMgr.emit(LogicEvent.enterLogin);
    }


    public chatLogin(rid: number, token: string, nick_name: string = ''): void {
        var api_name = ServerConfig.chat_login;
        var send_data = {
            name: api_name,
            msg: {
                rid: rid,
                token: token,
                nickName: nick_name
            }
        };

        console.log("send_data:", send_data);
        NetManager.getInstance().send(send_data);
    }
}
