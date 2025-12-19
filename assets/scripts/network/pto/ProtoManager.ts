import { _decorator, resources, TextAsset, JsonAsset } from 'cc';

// 声明全局 protobuf 对象 (由 assets/scripts/3rd/protobuf.js 提供)
declare const protobuf: any;

export class ProtoManager {
    private static _instance: ProtoManager = null;
    private _root: any = null;
    private _isReady: boolean = false;
    private _idMap: { [key: number]: string } = {};
    private _nameMap: { [key: string]: number } = {};

    public static getInstance(): ProtoManager {
        if (this._instance == null) {
            this._instance = new ProtoManager();
        }
        return this._instance;
    }

    constructor() {
        // 创建 protobuf 根对象
        this._root = new protobuf.Root();
    }

    /**
     * 异步初始化 - 加载 resources/proto 下的 .proto 文件
     */
    public async init(): Promise<void> {
        if (this._isReady) {
            return;
        }

        console.log("ProtoManager init, protobuf version:", protobuf.version);

        // 定义需要加载的 proto 文件列表 (相对于 assets/resources 的路径，不含扩展名)
        const protoFiles = [
            "protbuf/proto/pto/common",
            "protbuf/proto/pto/login",
            "protbuf/proto/pto/chat",
            "protbuf/proto/pto/hero",
            "protbuf/proto/pto/build",
            "protbuf/proto/pto/heartbeat",
            "protbuf/proto/pto/reward",
            "protbuf/proto/pto/user",
        ];

        try {
            // 并行加载所有文件
            const loadPromises = protoFiles.map(file => this.loadProtoFile(file));

            // 加载 ID 映射
            loadPromises.push(this.loadPbJson());

            await Promise.all(loadPromises);

            this._isReady = true;
            console.log("ProtoManager initialized successfully");

            // 调试：打印所有已加载的类型
            console.log("Loaded Types:", Object.keys(this._root.nested || {}));
            console.log("Protocol ID Map loaded:", Object.keys(this._idMap).length);

        } catch (error) {
            console.error("ProtoManager init failed:", error);
        }
    }

    private loadPbJson(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.load("protbuf/proto/netPb", JsonAsset, (err, asset: JsonAsset) => {
                if (err) {
                    console.error("Failed to load netPb.json", err);
                    reject(err);
                    return;
                }

                try {
                    const json: any = asset.json;
                    if (json && json.define) {
                        this.parseIdMap(json.define);
                    } else {
                        console.error("netPb.json format incorrect: missing 'define' field");
                    }
                    resolve();
                } catch (e) {
                    console.error("Failed to parse netPb.json", e);
                    reject(e);
                }
            });
        });
    }

    private parseIdMap(define: any) {
        for (const pkgName in define) {
            const messages = define[pkgName];
            for (const msgName in messages) {
                const id = messages[msgName];
                // 构造全名: Package.MessageName
                const fullName = `${pkgName}.${msgName}`;
                this._idMap[id] = fullName;
                this._nameMap[fullName] = id;
            }
        }
    }

    public getMsgTypeById(id: number): string {
        return this._idMap[id];
    }

    public getIdByMsgType(type: string): number {
        return this._nameMap[type];
    }

    /**
     * 加载单个 .proto 文件
     */
    private loadProtoFile(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // 使用 TextAsset 加载文本内容
            resources.load(path, TextAsset, (err, asset: TextAsset) => {
                if (err) {
                    console.error(`Failed to load ${path}:`, err);
                    reject(err);
                    return;
                }

                try {
                    // 解析 proto 文本
                    const parsed = protobuf.parse(asset.text);

                    // 将解析出的 root 合并到主 root 中
                    this.mergeRoot(this._root, parsed.root);

                    resolve();
                } catch (e) {
                    console.error(`Failed to parse ${path}:`, e);
                    reject(e);
                }
            });
        });
    }

    /**
     * 辅助方法：合并两个 Root 对象
     */
    private mergeRoot(target: any, source: any) {
        if (!source || !source.nested) return;

        for (const name in source.nested) {
            const nested = source.nested[name];
            // 如果目标没有这个 namespace/type，直接添加
            if (!target.nested) target.nested = {};

            if (!target.nested[name]) {
                target.nested[name] = nested;
                nested.parent = target; // 更新父引用
            } else {
                // 如果已存在（通常是 package 重复），则递归合并
                if (nested.nested) {
                    this.mergeRoot(target.nested[name], nested);
                }
            }
        }
    }

    public isReady(): boolean {
        return this._isReady;
    }

    /**
     * 编码消息
     * @param typeName 消息类型名称 (例如 "Login.c2s_user_login")
     * @param data 消息数据对象
     * @returns 编码后的 Uint8Array
     */
    public encode(typeName: string, data: any): Uint8Array {
        if (!this._isReady) {
            console.error("ProtoManager not ready");
            return null;
        }

        try {
            // 查找类型
            const Type = this._root.lookupType(typeName);

            // 验证数据 (可选，开发阶段很有用)
            const errMsg = Type.verify(data);
            if (errMsg) {
                console.error(`Proto verify error [${typeName}]:`, errMsg);
                // return null; // 可以选择是否中断
            }

            // 创建消息对象
            const message = Type.create(data);

            // 编码
            return Type.encode(message).finish();
        } catch (e) {
            console.error(`Proto encode error [${typeName}]:`, e);
            return null;
        }
    }

    /**
     * 解码消息
     * @param typeName 消息类型名称 (例如 "Login.s2c_user_login")
     * @param buffer 二进制数据
     * @returns 解码后的数据对象
     */
    public decode(typeName: string, buffer: Uint8Array): any {
        if (!this._isReady) {
            console.error("ProtoManager not ready");
            return null;
        }

        try {
            const Type = this._root.lookupType(typeName);

            // 解码
            const message = Type.decode(buffer);

            // 转换为普通 JS 对象
            return Type.toObject(message, {
                defaults: true,  // 填充默认值
                arrays: true,    // 空数组也会存在
                objects: true,   // 空对象也会存在
                // longs: String,  // Long 类型转为 String (防止精度丢失)
            });
        } catch (e) {
            console.error(`Proto decode error [${typeName}]:`, e);
            return null;
        }
    }
}
