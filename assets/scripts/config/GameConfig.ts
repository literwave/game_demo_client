// /**连接配置*/

import { _decorator } from 'cc';
const GameConfig = {
    serverUrl: "ws://127.0.0.1:33022",
    webUrl: "http://127.0.0.1:8088",
    loginUrl: "ws://127.0.0.1:33021",
    // 排查协议时才开启；避免 Game View 为每个数据包序列化多份日志。
    traceNetworkPackets: false,
}
export { GameConfig };
