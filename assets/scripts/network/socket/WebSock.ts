import { ISocket } from "./NetInterface";
import * as crypto from "../../libs/crypto/crypto"
import { ProtoManager } from "../pto/ProtoManager";



export class WebSock implements ISocket {
    private _ws: WebSocket = null;              // websocket对象
    private _key: String = "";


    onConnected(event): void {

    }


    onUnpackMessage(typeName: string, data: any) {

    }


    onGetKey() {

    }


    onMessage(msg): void {
        console.log("websocket onMessage raw:", msg, "type:", typeof msg, "isBuffer:", msg instanceof ArrayBuffer);

        let view: Uint8Array;
        if (msg instanceof ArrayBuffer) {
            view = new Uint8Array(msg);
            console.log("Received bytes:", view.slice(0, 20)); // 打印前20字节
        } else {
            // 如果是 Blob (某些浏览器默认)，需要转 ArrayBuffer，这里先略过
            return;
        }

        // 如果是原始二进制数据，我们需要解析它
        // 假设格式: [Length(2)][ProtocolID(2)][Protobuf]
        // 解析包头
        const dv = new DataView(view.buffer);
        const len = dv.getUint16(0, false); // Big Endian
        const protocolId = dv.getUint16(2, false);

        console.log(`Packet Header: Len=${len}, ProtocolID=${protocolId}`);

        // 提取 Protobuf 数据 (跳过前4字节)
        const protoData = view.slice(4);

        // 动态查找消息类型
        const typeName = ProtoManager.getInstance().getMsgTypeById(protocolId);

        if (typeName) {
            console.log(`Resolving ID ${protocolId} to ${typeName}`);
            const decoded = ProtoManager.getInstance().decode(typeName, protoData);

            if (decoded) {
                console.log(`Decoded ${typeName}:`, decoded);
                // 分发消息
                this.onUnpackMessage(typeName, decoded);
            } else {
                console.error(`Failed to decode ${typeName}`);
            }
        } else {
            console.error(`Unknown Protocol ID: ${protocolId}`);
        }

        return;
    }


    onError(event): void {
        console.log("websocket onError:", event)
    }

    onClosed(event): void {
        console.log("websocket onClosed:", event)
    }

    connect(options: any) {
        if (this._ws) {
            if (this._ws.readyState === WebSocket.CONNECTING) {
                console.log("websocket connecting, wait for a moment...")
                return false;
            }
        }

        let url = null;
        if (options.url) {
            url = options.url;
        } else {
            let ip = options.ip;
            let port = options.port;
            let protocol = options.protocol;
            url = `${protocol}://${ip}:${port}`;
        }
        console.log()
        this._ws = new WebSocket(url);
        this._ws.binaryType = options.binaryType ? options.binaryType : "arraybuffer";
        this._ws.onmessage = (event) => {
            this.onMessage(event.data);
        };

        this._ws.onopen = this.onConnected;
        this._ws.onerror = this.onError;
        this._ws.onclose = this.onClosed;

        return true;
    }

    send(buffer: any) {
        if (this._ws.readyState == WebSocket.OPEN) {
            this._ws.send(buffer);
            return true;
        }
        return false;
    }

    close(code?: number, reason?: string) {
        this._key = "";
        this._ws.close(code, reason);
    }


    /**
     * json 加密打包
     * @param send_data 
     */
    /**
     * 打包并发送
     * @param send_data {name: string, msg: any, seq: number}
     */
    /**
     * 打包并发送 (二进制协议)
     * 格式: [包长(2字节)] + [随机数(2字节)] + [Protobuf数据]
     * @param send_data Uint8Array
     */
    public packAndSend(send_data: any) {
        let protoData: Uint8Array | null = null;
        let msgName: string = "";

        if (send_data instanceof Uint8Array) {
            protoData = send_data;
        } else if (send_data.msg && send_data.msg instanceof Uint8Array) {
            protoData = send_data.msg;
            msgName = send_data.name; // 获取消息名称
        }

        if (!protoData) {
            console.error("packAndSend: Expected Uint8Array or {msg: Uint8Array}, got", send_data);
            return;
        }

        const protoLen = protoData.length;

        // 包头长度: 2字节包长 + 2字节 Protocol ID
        // 总长度 = 4 + protoLen
        const totalLen = 4 + protoLen;

        const buffer = new ArrayBuffer(totalLen);
        const view = new DataView(buffer);

        // 1. 写入包长 (2字节)
        // 通常包长指后续数据的长度 (Protocol ID + Proto数据)
        // 也就是 2 + protoLen
        view.setUint16(0, 2 + protoLen, false); // false = Big Endian (网络字节序)

        // 2. 写入 Protocol ID (2字节)
        let protocolId = 0;
        if (msgName) {
            protocolId = ProtoManager.getInstance().getIdByMsgType(msgName);
            if (!protocolId) {
                console.warn(`packAndSend: No Protocol ID found for ${msgName}, using 0`);
            } else {
                console.log(`packAndSend: Mapped ${msgName} to ID ${protocolId}`);
            }
        } else {
            console.warn("packAndSend: No msgName provided, using random/0 ID");
            // protocolId = Math.floor(Math.random() * 65535); // 之前是随机数，现在最好不要随机
        }

        view.setUint16(2, protocolId, false);

        // 3. 写入 Protobuf 数据
        const uint8View = new Uint8Array(buffer);
        uint8View.set(protoData, 4);
        console.log("packAndSend buffer:", buffer);
        // 发送
        this.send(buffer);
    }
}
