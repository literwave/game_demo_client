
import { RequestObject, NetEvent } from "./NetInterface";
import { NetTimer } from "./NetTimer";
import { WebSock } from "./WebSock";
import { EventMgr } from "../../utils/EventMgr";


export enum NetTipsType {
    Connecting,
    ReConnecting,
    Requesting,
}

export enum NetNodeState {
    Closed,                     // 已关闭
    Connecting,                 // 连接中
    Checking,                   // 验证中
    Working,                    // 可传输数据
}


export enum NetNodeType {
    GateServer,                     //网关服务器
    ChatServer,                     //聊天服务器
    LoginServer,                    //登录服务器
}


export interface NetConnectOptions {
    host?: string,              // 地址
    port?: number,              // 端口
    url?: string,               // url，与地址+端口二选一
    autoReconnect?: number,     // -1 永久重连，0不自动重连，其他正整数为自动重试次数
    type?: NetNodeType,          //服务器类型
}

export class NetNode {
    protected _connectOptions: NetConnectOptions = null;
    protected _autoReconnect: number = 0;
    protected _autoReconnectMax: number = 5;
    protected _state: NetNodeState = NetNodeState.Closed;                   // 节点当前状态
    protected _socket: WebSock = null;                                      // Socket对象（可能是原生socket、websocket、wx.socket...)
    protected _timer: NetTimer = null;


    protected _keepAliveTimer: any = null;                                  // 心跳定时器
    protected _reconnectTimer: any = null;                                  // 重连定时器
    protected _reconnectAttempt: number = 0;                                // 当前第几次重连
    /** 这次断开后要重新走网关登录 */
    protected _relogin: boolean = false;
    /** 主动关掉，不要接着重连。回到登录页走这条 */
    protected _manualClose: boolean = false;
    /** 关掉当前连接后要改连的地址，比如从网关换回登录服 */
    protected _pendingConnect: NetConnectOptions = null;
    protected _heartTime: number = 10 * 1000;                                 // 心跳间隔
    protected _receiveTime: number = 10 * 1000;                               // 多久没收到数据断开
    protected _reconnetTimeOut: number = 2 * 1000;                            // 重连间隔
    protected _requests: RequestObject[] = Array<RequestObject>();          // 请求列表
    protected _maxSeqId: number = 1000000;
    protected _seqId: number = 1;
    protected _invokePool: any = [];

    /********************** 网络相关处理 *********************/
    public init() {
        console.log(`NetNode init socket`);
        this._socket = new WebSock();
        this.initSocket();
        this._timer = new NetTimer();
        this.initTimer();
        this._invokePool = [];

    }

    public connect(options: NetConnectOptions): boolean {
        console.log(`NetNode connect socket:`, options);
        if (this._state != NetNodeState.Closed) {
            this._pendingConnect = options;
            this.closeSocket();
            return true;
        }
        return this.openSocket(options);
    }

    protected openSocket(options: NetConnectOptions): boolean {
        this._pendingConnect = null;
        this._manualClose = false;
        if (this._socket && this._state == NetNodeState.Closed) {
            this._state = NetNodeState.Connecting;
            if (!this._socket.connect(options)) {
                this._state = NetNodeState.Closed;
                this.updateNetTips(NetTipsType.Connecting, false);
                return false;
            }

            this._connectOptions = options;
            this.updateNetTips(NetTipsType.Connecting, true);
            return true;
        }
        return false;
    }


    /**
     * 更换线路
     * @param options 
     */
    public changeConect(options: NetConnectOptions) {
        if (options == this._connectOptions) {
            return;
        }

        if (this._state != NetNodeState.Closed) {
            this.closeSocket();
        }
        this.connect(options);
    }

    protected initSocket() {
        this._autoReconnect = this._autoReconnectMax;
        this._socket.onConnected = (event) => { this.onConnected(event) };
        this._socket.onUnpackMessage = (typeName, msg) => { this.onMessage(typeName, msg) };
        this._socket.onError = (event) => { this.onError(event) };
        this._socket.onClosed = (event) => { this.onClosed(event) };
        this._socket.onGetKey = () => { this.onGetKey() };

        EventMgr.on(NetEvent.ServerHandShake, this.onChecked, this);
    }


    protected onGetKey() {
        this._state = NetNodeState.Working;

        // if(this._connectOptions.type == NetNodeType.BaseServer){

        // }else{
        //     this.onChecked();
        // }

        // EventMgr.emit(NetEvent.ServerCheckLogin);

    }


    protected initTimer() {
        this._timer.init();
    }

    protected updateNetTips(tipsType: NetTipsType, isShow: boolean) {
        if (tipsType == NetTipsType.Requesting) {
            // EventMgr.emit(NetEvent.ServerRequesting, isShow);

        } else if (tipsType == NetTipsType.Connecting) {

        } else if (tipsType == NetTipsType.ReConnecting) {

        }
    }

    // 网络连接成功
    protected onConnected(event) {
        console.log("NetNode onConnected!")
        this._autoReconnect = this._autoReconnectMax;
        this._reconnectAttempt = 0;

        // 不需要握手包，连接成功直接视为验证通过
        this._state = NetNodeState.Working;

        this.clearTimer();
        console.log("websocket onConnected:", event);
        this.onGetKey()

        // 直接调用 onChecked 处理队列中的请求
        this.onChecked();

        if (this._relogin) {
            this._relogin = false;
            EventMgr.emit(NetEvent.ServerCheckLogin);
        }
    }

    // 连接验证成功，进入工作状态
    protected onChecked() {
        console.log("NetNode onChecked!")

        // 关闭连接或重连中的状态显示
        this.updateNetTips(NetTipsType.Connecting, false);
        this.updateNetTips(NetTipsType.ReConnecting, false);

        if (this._requests.length > 0) {
            for (var i = 0; i < this._requests.length; i++) {
                let req = this._requests[i];
                if (req.sended == false) {
                    this.socketSend(req);
                }

            }
            // 如果还有等待返回的请求，启动网络请求层
        }
    }

    // 接收到一个完整的消息包
    protected onMessage(typeName: string, msg): void {
        // console.log(`NetNode onMessage msg ` ,msg);

        if (msg) {
            EventMgr.emit(typeName, msg);
        }
        if (!this.isHeartbeat(typeName)) {
            console.log("NetNode onMessage!", typeName, msg);
        }
    }

    protected isHeartbeat(name: string): boolean {
        return !!name && name.indexOf("heart_beat") >= 0;
    }

    protected onError(event) {
        console.log("onError:", event);
        this.restReq();
        if (this._reconnectTimer !== null) {
            return;
        }
        if (this._state != NetNodeState.Closed && this._socket) {
            this._socket.close();
        }
    }

    protected onClosed(event) {
        console.log("onClosed:", event);
        EventMgr.emit(NetEvent.ServerDisconnected);
        if (this._reconnectTimer !== null && !this._manualClose) {
            return;
        }
        this.clearTimer();
        const manual = this._manualClose;
        this._manualClose = false;
        this._state = NetNodeState.Closed;
        if (manual) {
            this._relogin = false;
            this.openPending();
            return;
        }
        this.tryConnet();
    }

    protected restReq() {
        for (var i = 0; i < this._requests.length; i++) {
            let req = this._requests[i];
            req.sended = false;
        }
    }

    /**
     * 重连
     */
    public tryConnet() {
        if (this._reconnectTimer !== null) {
            return;
        }
        console.log("tryConnet", this._autoReconnect)
        if (this.isAutoReconnect()) {
            if (this._autoReconnect > 0) {
                this._reconnectAttempt = this._autoReconnectMax - this._autoReconnect + 1;
            } else {
                this._reconnectAttempt += 1;
            }
            this.updateNetTips(NetTipsType.ReConnecting, true);
            EventMgr.emit(NetEvent.ServerReconnecting, {
                attempt: this._reconnectAttempt,
                maxAttempts: this._autoReconnectMax,
                retryDelayMs: this._reconnetTimeOut,
            });
            if (this._connectOptions && this._connectOptions.type == NetNodeType.GateServer) {
                this._relogin = true;
            }

            this._state = NetNodeState.Closed;
            this._reconnectTimer = setTimeout(() => {
                this._reconnectTimer = null;
                console.log("NetNode tryConnet!")
                this.connect(this._connectOptions);
                if (this._autoReconnect > 0) {
                    this._autoReconnect -= 1;
                }
            }, this._reconnetTimeOut);
            if (this._socket) {
                this._socket.close();
            }
        } else {
            const gate = this._connectOptions && this._connectOptions.type == NetNodeType.GateServer;
            const relogin = this._relogin || gate;
            this._relogin = false;
            this._state = NetNodeState.Closed;
            if (relogin) {
                EventMgr.emit(NetEvent.ServerReconnectFailed, {
                    attempt: this._reconnectAttempt,
                    maxAttempts: this._autoReconnectMax,
                });
            }
        }

    }

    /** 心跳超时或链路已死时关掉当前连接，交给重连。主动关闭请用 closeSocket */
    public dropConnection() {
        if (this._state == NetNodeState.Closed) {
            this.tryConnet();
            return;
        }
        if (this._socket) {
            this._socket.close();
        }
    }

    // 主动关闭。取消正在进行的重连，不再自动重连网关
    public closeSocket(code?: number, reason?: string) {
        console.log("closeSocket", code, reason);
        this._manualClose = true;
        this._relogin = false;
        this._autoReconnect = 0;
        this._reconnectAttempt = 0;
        this.clearTimer();
        this._requests.length = 0;
        this._seqId = 1;

        if (this._state == NetNodeState.Closed) {
            this._manualClose = false;
            this.openPending();
            return;
        }

        if (this._socket) {
            this._socket.close(code, reason);
        } else {
            this._manualClose = false;
            this._state = NetNodeState.Closed;
            this.openPending();
        }
    }

    protected openPending(): void {
        const options = this._pendingConnect;
        this._pendingConnect = null;
        if (options) {
            this.openSocket(options);
        }
    }




    public send(send_data: any, force: boolean = false): void {

        let requestIns = this.createInvoke();
        requestIns.dat = send_data;
        requestIns.name = send_data.name;
        // 回包由 onMessage 按协议名分发给 Command；没有通用的请求应答匹配事件。
        this.sendPack(requestIns, force);
    }

    // 发起请求，如果当前处于重连中，进入缓存列表等待重连完成后发送
    public sendPack(obj: RequestObject, force: boolean = false): boolean {
        if (!this.isHeartbeat(obj && obj.name)) {
            console.log("this._state", this._state);
        }
        if (this._state == NetNodeState.Working || force) {
            this.socketSend(obj);
        }

        else if (this._state == NetNodeState.Checking ||
            this._state == NetNodeState.Connecting) {
            this._requests.push(obj);
        }

        else if (this._state == NetNodeState.Closed) {
            this.connect(this._connectOptions);
            this._requests.push(obj);
        }

        else {
            console.error("NetNode request error! current state is " + this._state);
        }
        return false;
    }


    /**
     * 打包发送
     * @param obj 
     */
    public socketSend(obj: RequestObject) {
        obj.startTime = new Date().getTime()
        this._socket.packAndSend(obj.dat);
        this._seqId += 1;
        obj.sended = true;
    }


    /**
     * 心跳
     */
    public getHearbeat() {
        var obj = this.createInvoke();//new RequestObject();
        obj.dat = { name: "heartbeat", msg: { ctime: new Date().getTime() }, seq: 0 };
        obj.rspName = "heartbeat";
        obj.seq = 0;
        return obj;

    }


    /********************** 心跳、超时相关处理 *********************/
    protected cannelMsgTimer(data: any = null) {
        this._timer.cancel(data);
    }

    protected resetHearbeatTimer() {
        if (this._keepAliveTimer !== null) {
            clearInterval(this._keepAliveTimer);
        }

        this._keepAliveTimer = setInterval(() => {
            this.sendPack(this.getHearbeat());
        }, this._heartTime);
    }

    protected clearTimer() {
        if (this._keepAliveTimer !== null) {
            clearTimeout(this._keepAliveTimer);
            this._keepAliveTimer = null;
        }
        if (this._reconnectTimer !== null) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        this._timer.destroy();
    }

    public isAutoReconnect() {
        return this._autoReconnect != 0;
    }

    public rejectReconnect() {
        this._autoReconnect = 0;
        this.clearTimer();
    }






    protected createInvoke(): RequestObject {
        // console.log("createInvoke_invokePool :",this._invokePool.length)
        if (this._invokePool.length > 0) {
            return this._invokePool.shift();
        }
        return new RequestObject();
    }

    protected destroyInvoke(invoke: RequestObject): void {
        invoke.destroy();
        this._invokePool.push(invoke);
        // console.log("destroyInvoke_invokePool :",this._invokePool.length)
    }
}
