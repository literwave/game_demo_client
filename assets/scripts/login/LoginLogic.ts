import { _decorator, Component, EditBox, Label } from 'cc';
const { ccclass, property } = _decorator;

import { LocalCache } from "../utils/LocalCache";
import LoginCommand from "./LoginCommand";
import { EventMgr } from '../utils/EventMgr';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import { NetManager } from "../network/socket/NetManager";
import { GameConfig } from '../config/GameConfig';
import { NetNodeType } from "../network/socket/NetNode";
import { ServerConfig } from '../config/ServerConfig';

@ccclass('LoginLogic')
export default class LoginLogic extends Component {

    @property(EditBox)
    editName: EditBox = null;

    @property(EditBox)
    editPass: Label = null;

    protected onLoad(): void {
        EventMgr.on(LogicEvent.loginComplete, this.onLoginComplete, this);
        //初始化登录服连接
        NetManager.getInstance().connect({ url: GameConfig.loginUrl, type: NetNodeType.LoginServer });
        var data = LocalCache.getLoginValidation();
        console.log("LoginLogic  data:", data)
        if (data) {
            this.editName.string = data.account;
            this.editPass.string = data.passwd;
        }
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    protected onLoginComplete(): void {
        console.log("LoginLogic  onLoginComplete");
        this.node.active = false;
        NetManager.getInstance().close();
    }

    protected onClickRegister(): void {
        AudioManager.instance.playClick();

        if (!this.editName.string || !this.editPass.string) {
            EventMgr.emit(LogicEvent.showToast, "账号密码有误");
            return;
        }

        LoginCommand.getInstance().register(this.editName.string, this.editPass.string);
    }

    protected onClickLogin(): void {
        AudioManager.instance.playClick();

        if (!this.editName.string || !this.editPass.string) {
            EventMgr.emit(LogicEvent.showToast, "账号密码有误");
            return;
        }

        LoginCommand.getInstance().accountLogin(this.editName.string, this.editPass.string)
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }
}
