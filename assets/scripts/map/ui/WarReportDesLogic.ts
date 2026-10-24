import { _decorator, Component, ScrollView, Node, instantiate } from 'cc';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { EventMgr } from '../../utils/EventMgr';
import BattleCommand, { ReportBrief, ReportInfo } from '../../battle/BattleCommand';
import WarReportDesItemLogic from './WarReportDesItemLogic';
const { ccclass, property } = _decorator;

@ccclass('WarReportDesLogic')
export default class WarReportDesLogic extends Component {
    @property(ScrollView) scrollView: ScrollView = null;
    @property(Node) item: Node = null;
    private reportId: number | string = 0;
    private info: ReportInfo | null = null;
    private actions: any[] = [];
    private cursor = 0;
    onLoad(): void {
        this.item.active = false;
        this.scrollView.node.on('scroll-to-bottom', this.scrollToBottom, this);
    }
    onEnable(): void {
        EventMgr.on(LogicEvent.updateReportDetail, this.onDetail, this);
        EventMgr.on(LogicEvent.updateReportReplay, this.onReplay, this);
    }
    onDisable(): void { EventMgr.targetOff(this); }
    onDestroy(): void { EventMgr.targetOff(this); this.scrollView?.node.off('scroll-to-bottom', this.scrollToBottom, this); }
    setData(brief: ReportBrief): void {
        this.reportId = brief.reportId; this.info = null; this.actions = []; this.cursor = 0;
        this.clearRows();
        const command = BattleCommand.getInstance();
        const cached = command.details.get(String(this.reportId));
        if (cached) this.onDetail(cached);
        else this.showMessage(command.requestDetail(this.reportId) ? '正在加载战报…' : '战报未加载，请稍后重新打开');
    }
    private onDetail(info: ReportInfo): void {
        if (String(info.brief.reportId) !== String(this.reportId)) return;
        this.info = info;
        const command = BattleCommand.getInstance();
        const replay = info.replay || command.replays.get(String(this.reportId));
        if (replay) this.onReplay(this.reportId, replay);
        else this.showMessage(command.requestReplay(this.reportId) ? '正在加载回放…' : '暂无回放数据');
    }
    private onReplay(id: any, replay: any): void {
        if (String(id) !== String(this.reportId)) return;
        this.actions = replay?.actions || []; this.cursor = 0;
        this.clearRows();
        if (this.actions.length) this.make();
        else this.showMessage('本次战斗暂无逐回合记录');
        this.scrollView.scrollToTop();
    }
    private clearRows(): void {
        for (const node of this.scrollView.content.children.slice()) if (node !== this.item) { node.removeFromParent(); node.destroy(); }
    }
    private showMessage(text: string): void {
        this.clearRows(); this.addRow().showMessage(text);
    }
    private addRow(): WarReportDesItemLogic {
        const node = instantiate(this.item); node.parent = this.scrollView.content; node.active = true;
        return node.getComponent(WarReportDesItemLogic);
    }
    private make(): void {
        const end = Math.min(this.cursor + 6, this.actions.length);
        while (this.cursor < end) {
            this.addRow().setProtocolAction(this.actions[this.cursor], this.info, this.cursor === this.actions.length - 1);
            this.cursor++;
        }
    }
    protected scrollToBottom(): void { this.make(); }
    protected onClickClose(): void { AudioManager.instance.playClick(); this.node.active = false; }
}
