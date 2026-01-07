import { _decorator, JsonAsset } from 'cc';

export default class ConfigManager {
    private static _instance: ConfigManager = null;
    private _configs: { [key: string]: any } = {};

    public static getInstance(): ConfigManager {
        if (!ConfigManager._instance) {
            ConfigManager._instance = new ConfigManager();
        }
        return ConfigManager._instance;
    }

    /**
     * 加载指定目录下的所有 JSON 配置文件
     */
    loadConfigs(data: any[], callback?: (err: Error | null) => void) {
        if (data && Array.isArray(data)) {
            data.forEach(asset => {
                if (asset && asset.name && asset.json) {
                    this._configs[asset.name] = asset.json;
                } else if (asset && asset.json) {
                    this._configs[`config_${Object.keys(this._configs).length}`] = asset.json;
                }
            });
        }

        if (callback) callback(null);
    }


    /**
     * 直接传入 JSON 数据初始化配置
     */
    initConfig(dirAssets: JsonAsset[] | any[], singleAsset?: any) {
        if (dirAssets && Array.isArray(dirAssets)) {
            dirAssets.forEach(asset => {
                if (asset instanceof JsonAsset) {
                    this._configs[asset.name] = asset.json;
                } else {
                    this._configs[`config_${Object.keys(this._configs).length}`] = asset;
                }
            });
        }

        if (singleAsset) {
            if (singleAsset instanceof JsonAsset) {
                this._configs[singleAsset.name] = singleAsset.json;
            } else {
                this._configs[`config_${Object.keys(this._configs).length}`] = singleAsset;
            }
        }
    }

    /**
     * 获取某个配置文件的内容
     */
    getConfig(configName: string): any {
        const config = this._configs[configName];
        if (!config) {
            console.warn(`配置文件 "${configName}" 不存在`);
        }
        return config;
    }

    /**
     * 获取某个配置文件中指定键的值
     */
    getConfigItem(configName: string, key: string): any {
        const config = this.getConfig(configName);
        if (config) {
            return config[key];
        }
        return null;
    }
}