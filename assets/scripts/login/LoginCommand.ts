import { ServerConfig } from "../config/ServerConfig";
import { NetManager } from "../network/socket/NetManager";
import { Tools } from "../utils/Tools";
import LoginProxy from "./LoginProxy";
import { NetEvent } from "../network/socket/NetInterface";
import MapCommand from "../map/MapCommand";
import { LocalCache } from "../utils/LocalCache";
import DateUtil from "../utils/DateUtil";
import { EventMgr } from "../utils/EventMgr";
import { Md5 } from "../libs/crypto/md5";
import { LogicEvent } from "../common/LogicEvent";
import { ProtoManager } from "../network/pto/ProtoManager";

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
    private isAllReady: boolean = false;

    constructor() {
        EventMgr.on(NetEvent.ServerCheckLogin, this.onServerConneted, this);
        EventMgr.on(ServerConfig.s2c_user_login, this.onAccountLogin, this);
        EventMgr.on(ServerConfig.s2c_heart_beat, this.setServerTime, this);
        EventMgr.on(ServerConfig.s2c_user_login_ok, this.onEnterServer, this);
        EventMgr.on(ServerConfig.s2c_user_base_info, this.onGetUserBaseInfo, this);
        EventMgr.on(ServerConfig.s2c_req_user_res, this.onGetUserRes, this);
        EventMgr.on(ServerConfig.s2c_user_create, this.onUserCreate, this);

        EventMgr.on(ServerConfig.account_reLogin, this.onAccountRelogin, this);
        EventMgr.on(ServerConfig.account_logout, this.onAccountLogout, this);
        EventMgr.on(ServerConfig.account_robLogin, this.onAccountRobLogin, this)
        EventMgr.on(ServerConfig.chat_login, this.onChatLogin, this)

    }

    public onDestory(): void {
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
        console.log("LoginProxy  onGetUserRes:", data);
        this._proxy.setRoleResData(data)
        this.makeSureAllDataReady()
    }

    /**拿到玩家资源数据和玩家数据才加载界面 */
    private makeSureAllDataReady(): void {
        console.log("LoginProxy  makeSureAllDataReady:");
        if (this._proxy.getRoleResData() && this._proxy.getRoleData()) {
            this.isAllReady = true;
        }
        if (this.isAllReady) {
            EventMgr.emit(LogicEvent.enterMap);
        }
    }

    /**创建玩家*/
    private onUserCreate(data: any): void {
        console.log("LoginProxy  onUserCreate:", data);
        this._proxy.saveEnterData(data);
        this.makeSureAllDataReady()
    }

    /**登录回调*/
    private onAccountLogin(data: any): void {
        console.log("LoginProxy  login:", data);

        this._proxy.saveLoginData(data);
        LocalCache.setLoginValidation(data);

        EventMgr.emit(LogicEvent.loginComplete, data.code);
    }

    /**进入服务器回调*/
    private setServerTime(data: any): void {
        DateUtil.setServerTime(data.heartBeatTime);
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
    }

    /**重连回调*/
    private onServerConneted(): void {
        //重新连接成功 重新登录
        var loginData = this._proxy.getLoginData();
        var roleData = this._proxy.getRoleData();
        console.log("LoginProxy  conneted:", loginData, roleData);

        if (loginData) {
            this.account_reLogin(loginData.session);
        } else {
            EventMgr.emit(NetEvent.ServerHandShake);
        }
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
            serverId: "120",
            userId: ""
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
    public role_create(uid: string, nickName: string, sex: number = 0, sid: number = 0, headId: number = 0) {
        var msgName = ServerConfig.c2s_user_create;
        var protoData = ProtoManager.getInstance().encode(msgName, {
            sex: sex,
            name: nickName,
        });
        var send_data = {
            name: msgName,
            msg: protoData, // 这里直接传 Uint8Array
        };
        NetManager.getInstance().send(send_data);
    }


    public role_enterServer(loginData) {
        var msgName = ServerConfig.c2s_verify_login;

        // 使用 ProtoManager 编码
        // 注意：这里需要根据你的 .proto 文件里的定义来写
        // 假设 login.proto 里定义的请求消息是 c2s_user_login，并且在 Login 包下
        var protoData = ProtoManager.getInstance().encode(msgName, {
            userId: loginData.userId,
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
        var api_name = ServerConfig.account_logout;
        var send_data = {
            name: api_name,
            msg: {

            }
        };
        NetManager.getInstance().send(send_data);
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
