import { _decorator, Component, SpriteFrame, Label, Sprite, resources } from 'cc';
const {ccclass, property} = _decorator;


import { gSkill } from "../../general/GeneralProxy";
import SkillCommand from "../../skill/SkillCommand";
import { Skill } from "../../skill/SkillProxy";


@ccclass('SkillIconLogic')
export default class SkillIconLogic extends Component {

    @property([SpriteFrame])
    sps:SpriteFrame[] = [];

    @property(Label)
    lvLab:Label = null;

    _data: Skill = null;
    private _iconRequest: number = 0;

    public setData(data:Skill, gdata:gSkill):void{

        this._data = data;
        const request = ++this._iconRequest;

        if(gdata){
            if(this.lvLab){
                this.lvLab.string = "lv:" + gdata.lv;
            }
        }else{
            if(this.lvLab){
                this.lvLab.string = "";
            }
        }
        const sprite = this.getComponent(Sprite);
        if (!sprite) return;
        const conf = data ? SkillCommand.getInstance().proxy.getSkillCfg(data.cfgId) : null;
        // 图片尺寸不改变现有技能格子的大小。
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = conf ? this.sps[conf.trigger - 1] || null : null;
        if (!conf || !conf.icon) return;

        const base = conf.icon.trim().replace(/\/spriteFrame$/i, '').replace(/\.png$/i, '');
        if (!base) return;
        const path = `${base}/spriteFrame`;
        const cached = resources.get(path, SpriteFrame);
        if (cached && cached.isValid) {
            sprite.spriteFrame = cached;
            return;
        }
        resources.load(path, SpriteFrame, (error: Error | null, frame: SpriteFrame) => {
            // 列表复用、清空或销毁后，旧请求不能覆盖当前技能图标。
            if (!this.isValid || !sprite.isValid || request !== this._iconRequest) return;
            if (error || !(frame instanceof SpriteFrame)) {
                console.warn(`技能图标加载失败: ${conf.cfgId} (${path})`, error);
                return;
            }
            sprite.spriteFrame = frame;
        });
    }

    public isEmpty():boolean {
        return this._data == null;
    }

    public getSkill():Skill {
        return this._data;
    }

}
