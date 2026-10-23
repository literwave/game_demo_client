import { _decorator, BlockInputEvents, Button, Color, Component, Graphics, Label, Mask,
    Node, SafeArea, ScrollView, Sprite, UITransform, Widget } from 'cc';
import LoginCommand from '../../login/LoginCommand';
import { HeadIconConfig } from '../../login/HeadIconProxy';
import { LogicEvent } from '../../common/LogicEvent';
import { AudioManager } from '../../common/AudioManager';
import { EventMgr } from '../../utils/EventMgr';

const { ccclass } = _decorator;
const PAPER = new Color(239, 230, 205, 255);
const MUTED = new Color(179, 169, 145, 255);
const GOLD = new Color(178, 148, 99, 255);
const INK = new Color(39, 39, 32, 255);

interface HeadTile {
    config: HeadIconConfig;
    node: Node;
    background: Graphics;
    sprite: Sprite;
    name: Label;
    badge: Label;
    button: Button;
}

@ccclass('HeadIconPanel')
export default class HeadIconPanel extends Component {
    private _safeArea: Node;
    private _panel: Node;
    private _scrim: Graphics;
    private _background: Graphics;
    private _title: Label;
    private _subtitle: Label;
    private _status: Label;
    private _close: Node;
    private _confirm: Button;
    private _confirmArt: Graphics;
    private _confirmLabel: Label;
    private _scroll: ScrollView;
    private _view: Node;
    private _content: Node;
    private _tiles: HeadTile[] = [];
    private _selectedId = 0;
    private _itemWidth = 102;

    public show(): void {
        if (!this._panel) this.build();
        this.node.active = true;
        const command = LoginCommand.getInstance();
        const current = command.proxy.getRoleData()?.headIcon || 0;
        this._selectedId = command.headIcons.getDisplayId(current);
        this._safeArea.getComponent(SafeArea)?.updateArea();
        this.layout();
        this._scroll.scrollToTop(0);
        this.refresh();
    }

    private build(): void {
        this.node.addComponent(UITransform);
        this.stretch(this.node);
        this.node.addComponent(BlockInputEvents);
        this._scrim = this.makeNode('Scrim', this.node, 1, 1).addComponent(Graphics);
        this._safeArea = this.makeNode('SafeContent', this.node, 1, 1);
        this.stretch(this._safeArea);
        this._safeArea.addComponent(SafeArea);
        this._panel = this.makeNode('Panel', this._safeArea, 760, 600);
        this._background = this.makeNode('Background', this._panel, 760, 600).addComponent(Graphics);
        this._title = this.makeLabel('Title', this._panel, '更换头像', 26, PAPER);
        this._subtitle = this.makeLabel('Subtitle', this._panel, '选择心仪的武将头像', 15, MUTED);
        this._status = this.makeLabel('Status', this._panel, '', 16, PAPER);

        this._close = this.makeNode('Close', this._panel, 48, 48);
        const closeButton = this._close.addComponent(Button);
        closeButton.transition = Button.Transition.SCALE;
        closeButton.zoomScale = .94;
        const closeArt = this.makeNode('Art', this._close, 44, 44).addComponent(Graphics);
        closeArt.strokeColor = PAPER;
        closeArt.lineWidth = 2;
        closeArt.moveTo(-8, -8); closeArt.lineTo(8, 8);
        closeArt.moveTo(-8, 8); closeArt.lineTo(8, -8);
        closeArt.stroke();
        this._close.on(Button.EventType.CLICK, this.close, this);

        const scrollNode = this.makeNode('AvatarScroll', this._panel, 700, 400);
        this._scroll = scrollNode.addComponent(ScrollView);
        this._scroll.horizontal = false;
        this._scroll.vertical = true;
        this._scroll.cancelInnerEvents = true;
        this._scroll.elastic = true;
        this._view = this.makeNode('View', scrollNode, 700, 400);
        this.stretch(this._view);
        this._view.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
        this._content = this.makeNode('Content', this._view, 700, 400);
        this._content.getComponent(UITransform).setAnchorPoint(.5, 1);
        this._scroll.content = this._content;

        const confirmNode = this.makeNode('Confirm', this._panel, 176, 44);
        this._confirm = confirmNode.addComponent(Button);
        this._confirm.transition = Button.Transition.SCALE;
        this._confirm.zoomScale = .97;
        this._confirmArt = this.makeNode('Art', confirmNode, 176, 44).addComponent(Graphics);
        this._confirmLabel = this.makeLabel('Label', confirmNode, '使用头像', 18, INK);
        this._confirmLabel.node.getComponent(UITransform).setContentSize(164, 40);
        confirmNode.on(Button.EventType.CLICK, this.confirm, this);

        for (const config of LoginCommand.getInstance().headIcons.configs) this.createTile(config);
        this.node.on(Node.EventType.SIZE_CHANGED, this.layout, this);
        this._safeArea.on(Node.EventType.SIZE_CHANGED, this.layout, this);
        EventMgr.on(LogicEvent.updateMyRole, this.refresh, this);
        EventMgr.on(LogicEvent.headIconChangeState, this.refresh, this);
        EventMgr.on(LogicEvent.systemOpenUpdated, this.refresh, this);
    }

    private createTile(config: HeadIconConfig): void {
        const node = this.makeNode(`Avatar_${config.id}`, this._content, 102, 134);
        const background = this.makeNode('Background', node, 102, 134).addComponent(Graphics);
        const spriteNode = this.makeNode('Portrait', node, 82, 82);
        spriteNode.setPosition(0, 16, 0);
        const sprite = spriteNode.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = LoginCommand.getInstance().headIcons.getIcon(config.id);
        const name = this.makeLabel('Name', node, config.name, 16, PAPER);
        name.node.setPosition(0, -41, 0);
        const badge = this.makeLabel('State', node, '', 12, GOLD);
        badge.node.setPosition(0, -58, 0);
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = .97;
        node.on(Button.EventType.CLICK, () => {
            if (LoginCommand.getInstance().changingHeadIcon) return;
            AudioManager.instance.playClick();
            this._selectedId = config.id;
            this.refresh();
        }, this);
        this._tiles.push({ config, node, background, sprite, name, badge, button });
        if (!sprite.spriteFrame) {
            LoginCommand.getInstance().headIcons.loadIcon(config.id).then(frame => {
                if (!this.isValid || !sprite.isValid) return;
                sprite.spriteFrame = frame;
                this.refresh();
            });
        }
    }

    private layout(): void {
        if (!this._panel) return;
        const rootSize = this.node.getComponent(UITransform);
        const safeSize = this._safeArea.getComponent(UITransform);
        if (!rootSize || !safeSize || safeSize.width < 1 || safeSize.height < 1) return;
        this.drawRect(this._scrim, rootSize.width, rootSize.height, new Color(0, 0, 0, 170));
        const width = Math.min(760, Math.max(260, safeSize.width - 32));
        const height = Math.min(600, Math.max(280, safeSize.height - 32));
        this._panel.getComponent(UITransform).setContentSize(width, height);
        this.drawRect(this._background, width, height, INK, new Color(146, 124, 82, 255));
        this._title.node.setPosition(0, height / 2 - 38, 0);
        this._title.node.getComponent(UITransform).setContentSize(width - 120, 42);
        this._subtitle.node.setPosition(0, height / 2 - 72, 0);
        this._subtitle.node.getComponent(UITransform).setContentSize(width - 48, 28);
        this._close.setPosition(width / 2 - 32, height / 2 - 32, 0);

        const viewWidth = width - 48;
        const viewHeight = height - 184;
        const columns = Math.max(1, Math.floor((viewWidth + 12) / 114));
        const gap = 12;
        this._itemWidth = (viewWidth - gap * (columns - 1)) / columns;
        const contentHeight = Math.max(viewHeight, Math.ceil(this._tiles.length / columns) * 146 - gap);
        this._scroll.stopAutoScroll();
        this._scroll.node.getComponent(UITransform).setContentSize(viewWidth, viewHeight);
        this._scroll.node.setPosition(0, -4, 0);
        this._view.getComponent(Widget).updateAlignment();
        this._content.getComponent(UITransform).setContentSize(viewWidth, contentHeight);
        this._content.setPosition(0, viewHeight / 2, 0);
        this._tiles.forEach((tile, index) => {
            tile.node.getComponent(UITransform).setContentSize(this._itemWidth, 134);
            tile.node.setPosition(-viewWidth / 2 + this._itemWidth / 2 + (index % columns) * (this._itemWidth + gap),
                -67 - Math.floor(index / columns) * 146, 0);
            tile.name.node.getComponent(UITransform).setContentSize(this._itemWidth - 8, 24);
            tile.badge.node.getComponent(UITransform).setContentSize(this._itemWidth - 8, 18);
        });
        this._status.node.setPosition(0, -height / 2 + 69, 0);
        this._status.node.getComponent(UITransform).setContentSize(width - 48, 28);
        this._confirm.node.setPosition(0, -height / 2 + 32, 0);
        this.refresh();
    }

    private refresh(): void {
        if (!this._panel || !this.node.activeInHierarchy) return;
        const command = LoginCommand.getInstance();
        const current = command.proxy.getRoleData()?.headIcon || 0;
        const display = command.headIcons.getDisplayId(current);
        const busy = command.changingHeadIcon;
        for (const tile of this._tiles) {
            const selected = tile.config.id === this._selectedId;
            this.drawRect(tile.background, this._itemWidth, 134,
                selected ? new Color(75, 65, 45, 255) : new Color(48, 48, 39, 255),
                selected ? GOLD : new Color(100, 94, 73, 160));
            tile.badge.string = tile.config.id === display ? '使用中' : (selected ? '已选择' : '');
            tile.button.interactable = !busy && !!tile.sprite.spriteFrame?.isValid;
        }
        const selected = command.headIcons.getConfig(this._selectedId);
        const ready = !!command.headIcons.getIcon(this._selectedId);
        const alreadyUsed = current === this._selectedId;
        this._confirm.interactable = !busy && !alreadyUsed && !!selected && ready && command.isHeadIconOpen();
        this._confirmLabel.string = busy ? '正在保存…' : alreadyUsed ? '当前头像' : '使用头像';
        this.drawRect(this._confirmArt, 176, 44, this._confirm.interactable ? GOLD : new Color(116, 106, 84, 255));
        this._status.string = busy ? '正在等待服务器确认' : !ready ? '头像图片未就绪，请稍后重试' :
            selected ? `已选择：${selected.name}` : '请选择一个头像';
    }

    private confirm(): void {
        AudioManager.instance.playClick();
        LoginCommand.getInstance().changeHeadIcon(this._selectedId);
    }

    private close(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.SIZE_CHANGED, this.layout, this);
        this._safeArea?.off(Node.EventType.SIZE_CHANGED, this.layout, this);
        EventMgr.targetOff(this);
    }

    private makeNode(name: string, parent: Node, width: number, height: number): Node {
        const node = new Node(name);
        node.layer = parent.layer;
        node.addComponent(UITransform).setContentSize(width, height);
        parent.addChild(node);
        return node;
    }

    private stretch(node: Node): void {
        const widget = node.addComponent(Widget);
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        widget.top = widget.bottom = widget.left = widget.right = 0;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        widget.updateAlignment();
    }

    private makeLabel(name: string, parent: Node, text: string, size: number, color: Color): Label {
        const label = this.makeNode(name, parent, 180, 32).addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 4;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.CLAMP;
        label.enableWrapText = false;
        return label;
    }

    private drawRect(graphics: Graphics, width: number, height: number, fill: Color, border?: Color): void {
        graphics.node.getComponent(UITransform).setContentSize(width, height);
        graphics.clear();
        graphics.fillColor = fill;
        graphics.roundRect(-width / 2, -height / 2, width, height, 4);
        graphics.fill();
        if (border) {
            graphics.lineWidth = 1;
            graphics.strokeColor = border;
            graphics.roundRect(-width / 2 + .5, -height / 2 + .5, width - 1, height - 1, 4);
            graphics.stroke();
        }
    }
}
