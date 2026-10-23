import { resources, SpriteFrame } from 'cc';
import { SkillConf, SkillOutline } from "../config/skill/Skill";
import { getConfigIconPath } from '../utils/ConfigIcon';

export class Skill {
    id:number = 0;
    cfgId: number = 0;
    generals: number[] = [];
}

export default class SkillProxy {
    private _skillCfgMap:Map<number, SkillConf> = new Map<number, SkillConf>();
    protected _skillConfs: SkillConf[] = [];
    protected _skillOutLine: SkillOutline;
    protected _skills: Map<number, Skill> = new Map<number, Skill>();
    private _iconFrames: Map<string, SpriteFrame> = new Map();
    private _iconLoads: Map<string, Promise<SpriteFrame | null>> = new Map();
    private _iconGeneration = 0;
    public initSkillConfig(cfgs: any[]): void {
        this.releaseIcons();
        this._skillConfs = [];
        this._skillCfgMap.clear();

        for (const entry of cfgs) {
            if (!entry) continue;
            if (entry._name === "skill_outline") {
                this._skillOutLine = entry.json;
                continue;
            }
            const data = entry.json || entry;
            const cfgId = Number(data.Id ?? data.cfgId);
            if (!Number.isInteger(cfgId) || cfgId <= 0) continue;
            const icon = data.Icon ?? data.icon;
            const conf: SkillConf = {
                cfgId,
                name: data.Name ?? data.name,
                des: data.Desc ?? data.des,
                icon: typeof icon === 'string' ? icon.trim() : '',
                trigger: data.Trigger ?? data.trigger,
                target: data.Target ?? data.target,
                limit: data.Limit ?? data.limit,
                arms: data.Arms ?? data.arms,
                include_effect: data.IncludeEffect ?? data.include_effect,
                levels: data.Levels ?? data.levels,
            };
            this._skillConfs.push(conf);
            this._skillCfgMap.set(conf.cfgId, conf);
        }
    }
    public get skillConfs(): SkillConf[] {
        return this._skillConfs;
    }
    public get outLine(): SkillOutline {
        return this._skillOutLine;
    }
    public getSkillCfg(cfgId:number): SkillConf{
        if(this._skillCfgMap.has(cfgId)){
            return this._skillCfgMap.get(cfgId);
        }else{
            return null;
        }
    }

    public getIconPath(cfgId: number): string {
        return getConfigIconPath(this.getSkillCfg(cfgId)?.icon);
    }

    /** 加载页与所有技能格子共用真实图片缓存，不再按触发类型选择备用图。 */
    public getSkillIcon(cfgId: number): SpriteFrame | null {
        const path = this.getIconPath(cfgId);
        if (!path) return null;
        const retained = this._iconFrames.get(path);
        if (retained?.isValid) return retained;
        const cached = resources.get(path, SpriteFrame);
        if (!(cached instanceof SpriteFrame) || !cached.isValid) return null;
        cached.addRef();
        this._iconFrames.set(path, cached);
        return cached;
    }

    public loadSkillIcon(cfgId: number): Promise<SpriteFrame | null> {
        const cached = this.getSkillIcon(cfgId);
        if (cached) return Promise.resolve(cached);
        const path = this.getIconPath(cfgId);
        if (!path) return Promise.resolve(null);
        const pending = this._iconLoads.get(path);
        if (pending) return pending;
        const generation = this._iconGeneration;
        const request = new Promise<SpriteFrame | null>((resolve) => {
            let settled = false;
            const finish = (frame: SpriteFrame | null) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(frame);
            };
            const timer = setTimeout(() => {
                console.warn(`技能图标加载超时: ${cfgId} (${path})`);
                finish(null);
            }, 8000);
            try {
                resources.load(path, SpriteFrame, (error, frame) => {
                    if (settled) return;
                    if (generation !== this._iconGeneration) {
                        finish(null);
                        return;
                    }
                    if (error || !(frame instanceof SpriteFrame) || !frame.isValid) {
                        console.warn(`技能图标加载失败: ${cfgId} (${path})`, error);
                        finish(null);
                        return;
                    }
                    // 同一资源可能先被另一个格子从引擎缓存获取，只持有一次引用。
                    if (this._iconFrames.get(path) !== frame) {
                        frame.addRef();
                        this._iconFrames.set(path, frame);
                    }
                    finish(frame);
                });
            } catch (error) {
                console.warn(`技能图标加载失败: ${cfgId} (${path})`, error);
                finish(null);
            }
        });
        this._iconLoads.set(path, request);
        request.then(() => {
            if (this._iconLoads.get(path) === request) this._iconLoads.delete(path);
        });
        return request;
    }

    public async preloadSkillIcons(isCurrent: () => boolean): Promise<void> {
        const configs = this._skillConfs.slice();
        if (!configs.length) throw new Error('未找到技能配置');
        let index = 0;
        let failed = false;
        const worker = async () => {
            while (!failed && isCurrent() && index < configs.length) {
                const config = configs[index++];
                const frame = await this.loadSkillIcon(config.cfgId);
                if (!isCurrent()) return;
                if (!frame) {
                    failed = true;
                    throw new Error(`技能图标未就绪: ${config.name} (${config.cfgId})`);
                }
            }
        };
        // 真正完成 SpriteFrame 加载；限制并发以分散图片解码与纹理创建。
        await Promise.all(Array.from({ length: Math.min(4, configs.length) }, worker));
    }

    public releaseIcons(): void {
        this._iconGeneration++;
        this._iconLoads.clear();
        this._iconFrames.forEach(frame => { if (frame.isValid) frame.decRef(); });
        this._iconFrames.clear();
    }

    public getSkill(cfgId:number): Skill{
        if(this._skills.has(cfgId)){
            return this._skills.get(cfgId);
        }else{
            return null;
        }
    }

    /** 展示配置不依赖技能库存已返回，也不将预览项记为已拥有。 */
    public getSkillForDisplay(cfgId: number): Skill {
        const owned = this.getSkill(cfgId);
        if (owned) return owned;
        if (!this.getSkillCfg(cfgId)) return null;
        const skill = new Skill();
        skill.cfgId = cfgId;
        return skill;
    }
    public updateSkills(skills: Skill[]) {

        skills.forEach(skill => {
            this._skills.set(skill.cfgId, skill);
        });

    }
    public get skills():Skill[] {
        return Array.from(this._skills.values())
    }
}
