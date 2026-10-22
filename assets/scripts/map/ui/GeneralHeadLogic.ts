import { _decorator, Component, Sprite, isValid } from 'cc';
const { ccclass } = _decorator;
import GeneralCommand from "../../general/GeneralCommand";

@ccclass('GeneralHeadLogic')
export default class GeneralHeadLogic extends Component {
    private _headRequestId = 0;

    protected onDestroy(): void {
        this._headRequestId++;
    }

    public setHeadId(hero_type: any): void {
        const requestId = ++this._headRequestId;
        const sp = this.node.getComponent(Sprite);
        if (!sp) return;
        const proxy = GeneralCommand.getInstance().proxy;
        const cached = proxy.getGeneralTex(hero_type);
        // 列表会复用卡片；新图未就绪时先清掉上一张，不能沿用旧武将画像。
        sp.spriteFrame = cached && isValid(cached) ? cached : null;
        if (sp.spriteFrame) return;

        proxy.loadGeneralTex(hero_type).then((asset) => {
            if (!asset) return;
            // 较早的异步请求可能晚返回，不能覆盖已复用卡片或访问已销毁的组件。
            if (requestId !== this._headRequestId || !isValid(this, true) || !isValid(sp, true)) return;
            sp.spriteFrame = asset;
        });
    }
}
