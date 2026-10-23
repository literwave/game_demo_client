import { _decorator } from 'cc';
import { SkillConf, SkillOutline } from "../config/skill/Skill";

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
    public initSkillConfig(cfgs: any[]): void {
        this._skillConfs = [];
        this._skillCfgMap.clear();

        for (const entry of cfgs) {
            if (!entry) continue;
            if (entry._name === "skill_outline") {
                this._skillOutLine = entry.json;
                continue;
            }
            const data = entry.json || entry;
            const cfgId = data.Id ?? data.cfgId;
            if (!Number.isFinite(cfgId)) continue;
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
