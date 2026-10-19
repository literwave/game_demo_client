import { _decorator, Color, Component, EditBox, Event, Label, Node, Sprite } from 'cc';
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
    editPass: EditBox = null;

    @property(Sprite)
    eyeIcon: Sprite | null = null;

    @property(Node)
    agreementMark: Node | null = null;

    @property(Node)
    rememberMark: Node | null = null;

    @property(Node)
    serverPanel: Node | null = null;

    @property(Label)
    serverLabel: Label | null = null;

    private agreementAccepted = false;
    private rememberAccount = true;
    private selectedServerName = "S1 · 推荐服";

    protected onLoad(): void {
        EventMgr.on(LogicEvent.loginComplete, this.onLoginComplete, this);
        //初始化登录服连接
        NetManager.getInstance().connect({ url: GameConfig.loginUrl, type: NetNodeType.LoginServer });
        var data = LocalCache.getLoginValidation();
        console.log("LoginLogic  data:", data)

        this.rememberAccount = LocalCache.getPersonMemory("rememberAccount", true) !== false;
        var rememberedAccount = LocalCache.getPersonMemory("rememberedAccount", "");
        if (this.rememberAccount && rememberedAccount) {
            this.editName.string = String(rememberedAccount);
        } else if (this.rememberAccount && data && typeof data === 'object') {
            this.editName.string = data.account || '';
        }
        // 缓存里保存的是服务端返回的密码摘要，不能直接回填到输入框
        this.editPass.string = '';
        this.setPasswordVisible(false);

        var savedServerName = LocalCache.getPersonMemory("selectedServerName", "");
        if (savedServerName) {
            this.selectedServerName = String(savedServerName) === "推荐服 · S1"
                ? "S1 · 推荐服"
                : String(savedServerName);
        }

        this.refreshAgreement();
        this.refreshRemember();
        this.refreshServer();
        if (this.serverPanel) {
            this.serverPanel.active = false;
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
    }

    protected onClickLogin(): void {
        AudioManager.instance.playClick();

        if (!this.agreementAccepted) {
            EventMgr.emit(LogicEvent.showToast, "请先阅读并同意用户协议");
            return;
        }

        if (!this.editName.string || !this.editPass.string) {
            EventMgr.emit(LogicEvent.showToast, "账号密码有误");
            return;
        }

        if (this.rememberAccount) {
            LocalCache.setPersonMemory("rememberedAccount", this.editName.string);
        } else {
            LocalCache.setPersonMemory("rememberedAccount", "");
        }

        LoginCommand.getInstance().accountLogin(this.editName.string, this.editPass.string)
    }

    protected onClickTogglePassword(): void {
        if (!this.editPass) {
            return;
        }
        this.setPasswordVisible(this.editPass.inputFlag === EditBox.InputFlag.PASSWORD);
    }

    protected onClickAgreement(): void {
        AudioManager.instance.playClick();
        this.agreementAccepted = !this.agreementAccepted;
        this.refreshAgreement();
    }

    protected onClickRemember(): void {
        AudioManager.instance.playClick();
        this.rememberAccount = !this.rememberAccount;
        LocalCache.setPersonMemory("rememberAccount", this.rememberAccount);
        if (!this.rememberAccount) {
            LocalCache.setPersonMemory("rememberedAccount", "");
        }
        this.refreshRemember();
    }

    protected onClickForgotPassword(): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.showToast, "请联系客服重置密码");
    }

    protected onClickServer(): void {
        AudioManager.instance.playClick();
        if (this.serverPanel) {
            this.serverPanel.active = !this.serverPanel.active;
        }
    }

    protected onClickServerOption(_event: Event, customEventData: string): void {
        AudioManager.instance.playClick();
        if (!customEventData) {
            return;
        }
        this.selectedServerName = customEventData;
        LocalCache.setPersonMemory("selectedServerName", customEventData);
        this.refreshServer();
        if (this.serverPanel) {
            this.serverPanel.active = false;
        }
    }

    protected onClickUnavailableServer(): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.showToast, "该服务器暂未开放");
    }

    private refreshAgreement(): void {
        if (this.agreementMark) {
            this.agreementMark.active = this.agreementAccepted;
        }
    }

    private refreshRemember(): void {
        if (this.rememberMark) {
            this.rememberMark.active = this.rememberAccount;
        }
    }

    private refreshServer(): void {
        if (this.serverLabel) {
            this.serverLabel.string = this.selectedServerName;
        }
    }

    private setPasswordVisible(visible: boolean): void {
        if (!this.editPass) {
            return;
        }
        this.editPass.inputFlag = visible ? EditBox.InputFlag.DEFAULT : EditBox.InputFlag.PASSWORD;
        if (this.eyeIcon) {
            this.eyeIcon.color = visible
                ? new Color(255, 236, 196, 255)
                : new Color(148, 130, 100, 255);
        }
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }
}
