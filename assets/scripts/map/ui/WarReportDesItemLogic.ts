import { _decorator, Component, RichText, Label, UITransform, Node } from 'cc';
import { ReportInfo } from '../../battle/BattleCommand';
const { ccclass, property } = _decorator;

@ccclass('WarReportDesItemLogic')
export default class WarReportDesItemLogic extends Component {
    @property(RichText) warLab: RichText = null;
    @property(Label) roundsLabel: Label = null;
    @property(Label) endLab: Label = null;
    @property(Node) cNode: Node = null;
    showMessage(message: string): void {
        this.roundsLabel.string = ''; this.warLab.string = message; this.endLab.node.active = false; this.resize();
    }
    setProtocolAction(action: any, info: ReportInfo, isEnd: boolean): void {
        const names = ['', '普攻', '主动技能', '被动技能', '追击', '指挥', '治疗', '状态变化'];
        const unit = (side: number, pos: number) => `${side === 1 ? '攻方' : '守方'}·第${pos + 1}阵位`;
        this.roundsLabel.string = `第 ${action.round} 回合`;
        const lines = [`${unit(action.fromSide, action.fromPos)}  ${names[action.actType] || '行动'}${action.skillId ? `（技能 ${action.skillId}）` : ''}`];
        for (const effect of action.effects || []) {
            const flags = effect.flags || 0;
            const suffix = (flags & 1 ? ' 暴击' : '') + (flags & 2 ? ' 闪避' : '') + (flags & 4 ? ' 未命中' : '');
            const verb = action.actType === 6 ? '恢复' : action.actType === 7 ? '变化' : '损失';
            lines.push(`${unit(effect.targetSide, effect.targetPos)} ${verb} ${Math.abs(effect.value)}，剩余 ${effect.afterSoldier}${suffix}`);
        }
        this.warLab.string = lines.join('<br/>');
        this.endLab.node.active = isEnd;
        this.endLab.string = info?.brief.result === 1 ? '战斗胜利' : info?.brief.result === 2 ? '战斗失败' : '战斗结束';
        this.resize();
    }
    private resize(): void {
        const height = Math.max(40, this.warLab.getComponent(UITransform)?.height || 0) + (this.endLab.node.active ? 40 : 0);
        const content = this.cNode.getComponent(UITransform); if (content) content.height = height;
        const root = this.node.getComponent(UITransform); if (root) root.height = height + 40;
    }
}
