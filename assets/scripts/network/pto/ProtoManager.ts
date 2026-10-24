import { _decorator, resources, TextAsset, JsonAsset } from 'cc';
import Long from '../../libs/long/long.js';

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
        // 必须在类型 setup/Reader 初始化前配置，浏览器没有自动 require('long')。
        protobuf.util.Long = Long;
        protobuf.configure();
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

        try {
            await Promise.all([this.loadProtoFiles(), this.loadPbJson()]);

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
            resources.load("protbuf/net_pb", JsonAsset, (err, asset: JsonAsset) => {
                if (err) {
                    console.error("Failed to load net_pb.json", err);
                    reject(err);
                    return;
                }

                try {
                    const json: any = asset.json;
                    if (json && json.define) {
                        this.parseIdMap(json.define);
                    } else {
                        console.error("net_pb.json format incorrect: missing 'define' field");
                    }
                    resolve();
                } catch (e) {
                    console.error("Failed to parse net_pb.json", e);
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

    private loadProtoFiles(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.loadDir("protbuf/pto", TextAsset, (err, assets: TextAsset[]) => {
                if (err) {
                    console.error("Failed to load protbuf/pto", err);
                    reject(err);
                    return;
                }

                const ordered = (assets || []).slice().sort((left, right) => {
                    if (left.name === "common") return -1;
                    if (right.name === "common") return 1;
                    return left.name.localeCompare(right.name);
                });

                try {
                    ordered.forEach((asset) => {
                        const parsed = protobuf.parse(asset.text);
                        this.mergeRoot(this._root, parsed.root);
                    });
                    resolve();
                } catch (e) {
                    console.error("Failed to parse protbuf/pto", e);
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

            data = this.normalizeLongs(Type, data);
            const errMsg = Type.verify(data);
            if (errMsg) {
                console.error(`Proto verify error [${typeName}]:`, errMsg);
                return null;
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
            const object = Type.toObject(message, {
                defaults: true,  // 填充默认值
                arrays: true,    // 空数组也会存在
                objects: true,   // 空对象也会存在
                longs: String,
            });
            return this.restoreSafeLongs(Type, object);
        } catch (e) {
            console.error(`Proto decode error [${typeName}]:`, e);
            return null;
        }
    }

    /** 只转换声明为 int64 的字段，不把无效 uint32/string 等输入静默强转。 */
    private normalizeLongs(type: any, data: any): any {
        if (!data) return data;
        const out = { ...data };
        for (const field of type.fieldsArray) {
            if (out[field.name] == null) continue;
            field.resolve();
            const convert = (value: any) => {
                if (/^(u?int64|sint64|fixed64|sfixed64)$/.test(field.type)) {
                    if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new Error(`${field.name}: unsafe int64 number; use a decimal string`);
                    if (typeof value === 'string' && /^-?\d+$/.test(value)) {
                        const long = Long.fromValue(value, field.type === 'uint64' || field.type === 'fixed64');
                        if (long.toString() !== value) throw new Error(`${field.name}: invalid or out-of-range int64`);
                        return long;
                    }
                    return value;
                }
                return field.resolvedType?.fieldsArray ? this.normalizeLongs(field.resolvedType, value) : value;
            };
            if (field.map) {
                const map = { ...out[field.name] };
                Object.keys(map).forEach(key => map[key] = convert(map[key])); out[field.name] = map;
            } else out[field.name] = field.repeated ? out[field.name].map(convert) : convert(out[field.name]);
        }
        return out;
    }

    /** 兼容现有小整数逻辑；超过安全整数范围的 ID 保持十进制字符串。 */
    private restoreSafeLongs(type: any, object: any): any {
        if (!object) return object;
        for (const field of type.fieldsArray) {
            if (object[field.name] == null) continue;
            field.resolve();
            const convert = (value: any) => {
                if (/^(u?int64|sint64|fixed64|sfixed64)$/.test(field.type)) {
                    const number = Number(value);
                    return Number.isSafeInteger(number) ? number : String(value);
                }
                return field.resolvedType?.fieldsArray ? this.restoreSafeLongs(field.resolvedType, value) : value;
            };
            if (field.map) Object.keys(object[field.name]).forEach(key => object[field.name][key] = convert(object[field.name][key]));
            else object[field.name] = field.repeated ? object[field.name].map(convert) : convert(object[field.name]);
        }
        return object;
    }
}
