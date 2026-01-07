import { _decorator, Component, Sprite, SpriteFrame, resources } from 'cc';
const { ccclass } = _decorator;
import GeneralCommand from "../../general/GeneralCommand";

@ccclass('GeneralHeadLogic')
export default class GeneralHeadLogic extends Component {

    public setHeadId(hero_type: any): void {
        let sp = this.node.getComponent(Sprite);

        const cfg = GeneralCommand.getInstance().proxy.getGeneralCfg(hero_type);
        const resPath = cfg && cfg.resource ? cfg.resource.split('.')[0] : ("card_" + hero_type);

        var frame = GeneralCommand.getInstance().proxy.getGeneralTex(hero_type);
        if (frame) {
            if (sp) {
                sp.spriteFrame = frame;
            }
        } else {
            console.log("load setHeadId from hero folder:", resPath);
            resources.load("hero/" + resPath + "/spriteFrame", SpriteFrame,
                (finish: number, total: number) => {
                },
                (error: Error, asset: any) => {
                    if (error != null) {
                        console.log("setHeadId error using path:", "hero/" + resPath, "error:", error.message);
                    } else {
                        var frame = asset as SpriteFrame;
                        if (sp) {
                            sp.spriteFrame = frame;
                        }

                        GeneralCommand.getInstance().proxy.setGeneralTex(hero_type, frame);
                    }
                });
        }
    }
}
