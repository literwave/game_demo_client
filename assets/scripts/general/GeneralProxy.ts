
import { SpriteFrame } from "cc";
import GeneralCommand from "./GeneralCommand";

/**武将(配置)*/
export class GeneralConfig {
    name: string = "";
    hero_type: number = 0;
    force: number = 0;
    strategy: number = 0;
    defense: number = 0;
    speed: number = 0;
    destroy: number = 0;
    cost: number = 0;

    force_grow: number = 0;
    strategy_grow: number = 0;
    defense_grow: number = 0;
    speed_grow: number = 0;
    destroy_grow: number = 0;
    physical_power_limit: number = 0;
    cost_physical_power: number = 0;
    probability: number = 0;

    star: number = 0;
    arms: number[] = [];
    camp: number = 0;
    resource: string = "";
}

/**武将等级配置*/
export class GenaralLevelConfig {
    level: number = 0;
    exp: number = 0;
    soldiers: number = 0;
}

/**武将阵营枚举*/
export class GeneralCampType {
    static Han: number = 1;
    static Qun: number = 2;
    static Wei: number = 3;
    static Shu: number = 4;
    static Wu: number = 5;
}

/**武将共有配置*/
export class GeneralCommonConfig {
    physical_power_limit: number = 100;
    cost_physical_power: number = 10;
    recovery_physical_power: number = 10;
    reclamation_time: number = 3600;
    draw_general_cost: number = 0;
}

export class gSkill {
    id: number = 0;
    lv: number = 0;
    cfgId: number = 0;
}

/**武将基础数据类*/
export class GeneralData {
    hero_type: number = 0;  // 配置ID & 唯一ID
    exp: number = 0;
    level: number = 0;
    order: number = 0;
    star: number = 0;
    state: number = 0;
    parentId: number = 0;  // 归属ID
    cityId: number = 0;

    config: GeneralConfig = new GeneralConfig();
    skills: gSkill[] = [];

    force_added: number = 0;
    strategy_added: number = 0;
    defense_added: number = 0;
    speed_added: number = 0;
    destroy_added: number = 0;
    star_lv: number = 0;
    physical_power: number = 0;

    public static createFromServer(serverData: any, generalData: GeneralData = null, generalCfg: GeneralConfig): GeneralData {
        let data: GeneralData = generalData || new GeneralData();
        if (!serverData) return data;
        data.hero_type = serverData.heroType;

        data.level = serverData.lv;
        data.exp = serverData.exp;
        data.star = serverData.star;
        data.state = serverData.state;

        data.config = generalCfg || (typeof GeneralCommand !== 'undefined' && GeneralCommand.getInstance() ? GeneralCommand.getInstance().proxy.getGeneralCfg(data.hero_type) : null) || new GeneralConfig();
        data.skills = serverData.skillList || [];

        data.force_added = serverData.force_added || 0;
        data.strategy_added = serverData.strategy_added || 0;
        data.defense_added = serverData.defense_added || 0;
        data.speed_added = serverData.speed_added || 0;
        data.destroy_added = serverData.destroy_added || 0;
        data.star_lv = serverData.star_lv || 0;
        data.physical_power = serverData.physical_power || 0;

        return data;
    }

    public static getPrStr(base: number, added: number, level: number, grow: number): string {
        let val = (base + added + (level - 1) * grow) / 100;
        return val.toFixed(2);
    }
}

export default class GeneralProxy {
    protected _heroConfigs: Map<string, GeneralConfig> = new Map<string, GeneralConfig>();
    protected _levelConfigs: GenaralLevelConfig[] = [];
    protected _commonConfig: GeneralCommonConfig = new GeneralCommonConfig();
    protected _heroTexs: Map<string, SpriteFrame> = new Map<string, SpriteFrame>();
    protected _myGenerals: Map<number, GeneralData> = new Map<number, GeneralData>();

    public clearData(): void {
        this._myGenerals.clear();
    }

    public initHeroConfig(heroJson: any, bCost: any): void {
        this._heroConfigs.clear();
        for (let key in heroJson) {
            const data = heroJson[key];
            const cfg = new GeneralConfig();
            cfg.hero_type = Number(data.HeroId || key);
            cfg.name = data.name;
            cfg.resource = data.Resources;

            // 基础属性
            cfg.star = data.star || 3;
            cfg.camp = data.camp || 1;
            cfg.arms = data.arms || [1];
            cfg.cost = data.cost || 2;

            if (bCost && bCost.general) {
                cfg.physical_power_limit = bCost.general.physical_power_limit;
                cfg.cost_physical_power = bCost.general.cost_physical_power;
            }

            this._heroConfigs.set(String(cfg.hero_type), cfg);
            if (!cfg.name) {
                console.warn(`GeneralConfig for hero_type ${cfg.hero_type} has no name.`);
            }
        }
        console.log("武将配置初始化完成，共加载数量:", this._heroConfigs.size);

        if (bCost && bCost.general) {
            this._commonConfig.physical_power_limit = bCost.general.physical_power_limit;
            this._commonConfig.cost_physical_power = bCost.general.cost_physical_power;
            this._commonConfig.recovery_physical_power = bCost.general.recovery_physical_power;
            this._commonConfig.reclamation_time = bCost.general.reclamation_time;
            this._commonConfig.draw_general_cost = bCost.general.draw_general_cost;
        }
    }

    public initGeneralConfig(cfgs: any, bCost: any): void {
        this.initHeroConfig(cfgs, bCost);
    }

    public initGeneralTex(texs: SpriteFrame[]): void {
        this._heroTexs.clear();
        const nameMap: Map<string, SpriteFrame> = new Map();
        for (let i = 0; i < texs.length; i++) {
            nameMap.set(texs[i].name, texs[i]);
        }

        this._heroConfigs.forEach((cfg) => {
            if (cfg.resource) {
                const resName = cfg.resource.split('.')[0];
                if (nameMap.has(resName)) {
                    this._heroTexs.set(String(cfg.hero_type), nameMap.get(resName));
                }
            }
        });
    }

    public updateMyGenerals(datas: any[]): void {
        if (!datas || !Array.isArray(datas)) return;

        for (var i = 0; i < datas.length; i++) {
            const serverItem = datas[i];
            let id = serverItem.hero_type;
            let data: GeneralData = GeneralData.createFromServer(serverItem, null, this.getGeneralCfg(id));
            this._myGenerals.set(data.hero_type, data);
        }
    }

    public updateGeneral(data: any) {
        let id = data.hero_type;
        if (data.state != 0 && id) {
            this._myGenerals.delete(Number(id));
        } else if (id) {
            let general: GeneralData = GeneralData.createFromServer(data, this._myGenerals.get(Number(id)), this.getGeneralCfg(id));
            this._myGenerals.set(general.hero_type, general);
        }
    }

    public getGeneralCfg(hero_type: any): GeneralConfig {
        return this._heroConfigs.get(String(hero_type));
    }

    public getGeneralLevelCfg(level: number): GenaralLevelConfig {
        if (level > 0 && level <= this._levelConfigs.length) {
            return this._levelConfigs[level - 1];
        }
        return null;
    }

    public getMaxLevel(): number {
        return this._levelConfigs.length || 50; // 默认最大50级
    }

    public getGeneralAllCfg(): Map<string, GeneralConfig> {
        return this._heroConfigs;
    }

    public getMyGenerals(): GeneralData[] {
        return Array.from(this._myGenerals.values());
    }

    public getMyGeneral(hero_type: number): GeneralData {
        return this._myGenerals.get(hero_type) || null;
    }

    public getMyActiveGeneralCnt(): number {
        let cnt = 0;
        this._myGenerals.forEach(g => { if (g.state == 0) cnt++; });
        return cnt;
    }

    public getUseGenerals(): GeneralData[] {
        let list = this.getMyGenerals();
        list.sort((a, b) => {
            if (a.order > 0 && b.order == 0) return -1;
            if (a.order == 0 && b.order > 0) return 1;
            return b.level - a.level;
        });
        return list;
    }

    /**武将头像素材*/
    public getGeneralTex(hero_type: any): SpriteFrame {
        return this._heroTexs.get(String(hero_type)) || null;
    }

    public setGeneralTex(hero_type: any, frame: SpriteFrame) {
        this._heroTexs.set(String(hero_type), frame);
    }
}
