import { _decorator, Component, EditBox, Toggle, Button, Label, resources, TiledMapAsset, JsonAsset } from 'cc';
const { ccclass, property } = _decorator;

import { ServerConfig } from "../config/ServerConfig";
import LoginCommand from "./LoginCommand";
import { toProtoInt } from "./LoginProxy";
import { EventMgr } from '../utils/EventMgr';
import { createName } from '../libs/NameDict';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';

@ccclass('CreateLogic')
export default class CreateLogic extends Component {

    @property(EditBox)
    editName: EditBox = null;


    @property(Toggle)
    manToggle: Toggle = null;

    @property(Button)
    createButton: Button = null;

    @property(Label)
    createButtonLabel: Label = null;

    @property(Label)
    statusLabel: Label = null;

    private _pending = false;


    protected onLoad(): void {
        EventMgr.on(ServerConfig.s2c_user_create, this.onCreated, this);
        EventMgr.on(LogicEvent.enterMap, this.onEnteringMap, this);
        this.editName.string = this.getRandomName();
        // 先显示角色页，再低优先级预下载；正式加载仍由 Main 负责。
        this.scheduleOnce(() => {
            const onPreloaded = (error: Error | null) => {
                if (error) console.warn('战场资源预下载未完成，将在进入时重试:', error.message);
            };
            resources.preload('world/map', TiledMapAsset, onPreloaded);
            resources.preloadDir('config', JsonAsset, onPreloaded);
        }, 0.05);
    }

    protected onClickCreate() {
        if (this._pending) return;
        const name = this.editName.string.trim();
        const command = LoginCommand.getInstance();
        const loginData = command.proxy.getLoginData();
        if (!name || !loginData) {
            this.setStatus(!name ? '请先输入角色名称' : '登录状态已失效，请重新登录');
            return;
        }
        AudioManager.instance.playClick();
        const sex = this.manToggle.isChecked ? 1 : 2;
        this.setPending(true);
        this.setStatus('正在创建角色，请稍候…');
        this.scheduleOnce(this.onCreateTimeout, 12);
        // 先更新按钮，避免快速连点在同一轮回调中重复发送创建请求。
        this.scheduleOnce(() => {
            if (!this._pending) return;
            try {
                if (!command.role_create(toProtoInt(loginData.userId), name, sex, command.proxy.serverId, 0)) {
                    this.onCreateFailed('创建请求未能发送，请重试');
                }
            } catch (error) {
                console.error('创建请求失败:', error);
                this.onCreateFailed('创建请求未能发送，请重试');
            }
        }, 0);
    }

    protected onClickToggle() {
        AudioManager.instance.playClick();
    }


    private onCreated(data: { name?: string }): void {
        if (!data || !data.name) {
            this.onCreateFailed('创建未成功，请修改名称后重试');
            return;
        }
        this.onEnteringMap();
    }

    private onEnteringMap(): void {
        if (!this._pending) return;
        this.unschedule(this.onCreateTimeout);
        if (this.createButtonLabel) this.createButtonLabel.string = '正在进入战场…';
        this.setStatus('角色已创建，正在准备战场…');
    }

    private onCreateTimeout(): void {
        this.onCreateFailed('暂未收到服务器回复，请稍后重试');
    }

    private onCreateFailed(message: string): void {
        this.unschedule(this.onCreateTimeout);
        this.setPending(false);
        this.setStatus(message);
    }

    private setPending(pending: boolean): void {
        this._pending = pending;
        if (this.createButton) this.createButton.interactable = !pending;
        if (this.createButtonLabel) this.createButtonLabel.string = pending ? '创建中…' : '创建角色';
    }

    private setStatus(message: string): void {
        if (this.statusLabel) this.statusLabel.string = message;
    }

    protected onRandomName(): void {
        if (this._pending) return;
        AudioManager.instance.playClick();
        this.editName.string = this.getRandomName();
    }



    protected getRandomName(): string {
        var sex = this.manToggle.isChecked ? "boy" : "girl";
        let name = createName(sex);
        return name
    }



    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }
}
