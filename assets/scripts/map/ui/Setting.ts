import { _decorator, BlockInputEvents, Button, Color, Component, Label, Node, Toggle, UITransform, UIOpacity, Widget } from 'cc';
import { AudioManager } from '../../common/AudioManager';
import BgLogic from '../../common/BgLogic';
import { DialogOut } from '../../common/DialogOut';
import { caption, headerRule, hideSprite, inkSurface, ManagementColors as C, panelButton, place, textStyle } from './ManagementStyle';

const { ccclass, property } = _decorator;

@ccclass('Setting')
export class Setting extends Component {
    @property(Toggle)
    protected music: Toggle = null;

    @property(Toggle)
    protected sound: Toggle = null;

    private _exitButton: Node | null = null;
    private _prepared = false;

    public setExitButton(button: Node): void {
        const panel = this.node.getChildByName('bg');
        if (!panel) throw new Error('[Setting] 设置面板缺失');
        this._exitButton = button;
        button.parent = panel;
        button.active = true;
        if (this._prepared) this.layout();
    }

    protected onLoad(): void {
        this.prepare();
    }

    public show(): void {
        this.prepare();
        this.node.active = true;
        this.node.getComponent(Widget).updateAlignment();
        // 打开面板只读取偏好，不触发 Toggle 的音频设置回调。
        this.music.setIsCheckedWithoutNotify(AudioManager.instance.getConfiguration(true));
        this.sound.setIsCheckedWithoutNotify(AudioManager.instance.getConfiguration(false));
        this.layout();
    }

    private prepare(): void {
        if (this._prepared) return;
        const panel = this.node.getChildByName('bg');
        const mask = this.node.getChildByName('mask');
        if (!panel || !mask || !this.music || !this.sound) throw new Error('[Setting] 设置预制体结构不完整');
        const backdrop = mask.getComponent(BgLogic);
        if (backdrop) backdrop.enabled = false;
        const popAnimation = panel.getComponent(DialogOut);
        if (popAnimation) popAnimation.enabled = false;
        if (!this.node.getComponent(BlockInputEvents)) this.node.addComponent(BlockInputEvents);
        const widget = this.node.getComponent(Widget) || this.node.addComponent(Widget);
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        widget.top = widget.bottom = widget.left = widget.right = 0;
        widget.alignMode = Widget.AlignMode.ALWAYS;
        this._prepared = true;
        this.node.on(Node.EventType.SIZE_CHANGED, this.layout, this);
        widget.updateAlignment();
        this.layout();
    }

    private layout(): void {
        if (!this._prepared) return;
        const size = this.node.getComponent(UITransform);
        const panel = this.node.getChildByName('bg');
        const mask = this.node.getChildByName('mask');
        const width = Math.min(420, Math.max(280, size.width - 32));
        const height = 292;
        place(mask, 0, 0, size.width, size.height);
        hideSprite(mask);
        const opacity = mask.getComponent(UIOpacity);
        if (opacity) opacity.opacity = 255;
        inkSurface(mask, 'SettingsScrim', size.width, size.height, new Color(0, 0, 0, 145), null);
        place(panel, 0, 0, width, height);
        hideSprite(panel);
        inkSurface(panel, 'SettingsSurface', width, height, new Color(32, 37, 30, 255), C.line);
        caption(panel, 'SettingsTitle', '设置', -width / 2 + 100, 112, 152, 23);
        panelButton(panel.getChildByName('close'), '', width / 2 - 30, 112, 36, 36, false, true);
        headerRule(panel, width - 48, 82);
        panel.getChildByName('ManagementHeaderRule').setSiblingIndex(1);

        const rows = [
            { toggle: this.music, name: 'MusicRow', label: 'Label', title: '背景音乐', y: 42 },
            { toggle: this.sound, name: 'SoundRow', label: 'Label-001', title: '游戏音效', y: -18 },
        ];
        for (const row of rows) {
            const surface = inkSurface(panel, row.name, width - 48, 50, new Color(46, 51, 42, 255), null);
            surface.node.setPosition(0, row.y, 0);
            surface.node.setSiblingIndex(1);
            const label = panel.getChildByName(row.label)?.getComponent(Label);
            if (label) label.string = row.title;
            textStyle(label, -width / 2 + 108, row.y, 148, 17, C.text);
            place(row.toggle.node, width / 2 - 70, row.y, 80, 44);
            this.paintToggle(row.toggle);
        }
        const divider = inkSurface(panel, 'SettingsFooterRule', width - 48, 1, C.line, null);
        divider.node.setPosition(0, -62, 0);
        divider.node.setSiblingIndex(1);
        if (this._exitButton) {
            panelButton(this._exitButton, '退出游戏', 0, -105, width - 48, 44);
            const label = this._exitButton.getComponentInChildren(Label);
            if (label) label.color = new Color(219, 187, 152, 255);
        }
    }

    private paintToggle(toggle: Toggle): void {
        hideSprite(toggle.node);
        if (toggle.checkMark) toggle.checkMark.enabled = false;
        toggle.transition = Button.Transition.SCALE;
        toggle.zoomScale = .96;
        toggle.target = toggle.node;
        const enabled = toggle.isChecked;
        const g = inkSurface(toggle.node, 'SettingsSwitch', 68, 30, null, null);
        g.fillColor = enabled ? new Color(122, 103, 61, 255) : new Color(26, 31, 26, 255);
        g.roundRect(-34, -15, 68, 30, 15);
        g.fill();
        g.strokeColor = enabled ? C.gold : C.line;
        g.lineWidth = 1;
        g.roundRect(-33.5, -14.5, 67, 29, 14.5);
        g.stroke();
        g.fillColor = enabled ? C.text : C.muted;
        g.circle(enabled ? 18 : -18, 0, 10);
        g.fill();
        caption(toggle.node, 'SettingsSwitchState', enabled ? '开' : '关', enabled ? -13 : 13, 0,
            24, 12, enabled ? C.text : C.muted, Label.HorizontalAlign.CENTER);
    }

    public onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }

    public onClickMusic(): void {
        AudioManager.instance.playClick();
        if (this.music.isChecked) AudioManager.instance.openMusic();
        else AudioManager.instance.closeMusic();
        this.paintToggle(this.music);
    }

    public onClickSound(): void {
        AudioManager.instance.playClick();
        if (this.sound.isChecked) AudioManager.instance.openSound();
        else AudioManager.instance.closeSound();
        this.paintToggle(this.sound);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.SIZE_CHANGED, this.layout, this);
    }
}
