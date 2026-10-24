import { ServerConfig as S } from '../config/ServerConfig';
import { LogicEvent as E } from '../common/LogicEvent';
import { EventMgr } from '../utils/EventMgr';
import ProtocolCommand, { hasId, idKey } from '../network/pto/ProtocolCommand';
import LoginCommand from '../login/LoginCommand';
import UnionProxy, { AllianceId } from './UnionProxy';

export default class UnionCommand extends ProtocolCommand {
    private static _instance: UnionCommand;
    static getInstance(): UnionCommand { return this._instance || (this._instance = new UnionCommand()); }
    static destory(): boolean {
        if (!this._instance) return false;
        this._instance.onDestory(); this._instance = null; return true;
    }
    readonly proxy = new UnionProxy();
    private membershipVersion = 0;
    private requestedMembershipVersion = 0;
    private applyAllianceId = '0';
    constructor() {
        super();
        this.listen(S.s2c_req_my_alliance, d => {
            this.finish(S.c2s_req_my_alliance);
            if (this.membershipVersion === this.requestedMembershipVersion) this.setMine(d.info?.brief?.allianceId || 0, d.myPos, d.info);
        });
        this.listen(S.s2c_sync_my_alliance, d => { this.membershipVersion++; this.setMine(d.allianceId, d.myPos, d.info); });
        this.listen(S.s2c_create_alliance, d => {
            this.finish(S.c2s_create_alliance);
            this.membershipVersion++;
            this.setMine(d.info?.brief?.allianceId || 0, 1, d.info);
            EventMgr.emit(E.createUnionSuccess);
        });
        [S.s2c_leave_alliance, S.s2c_dissolve_alliance].forEach(name => this.listen(name, () => {
            this.finish(S.c2s_leave_alliance); this.finish(S.c2s_dissolve_alliance);
            this.membershipVersion++;
            this.setMine(0, 0); EventMgr.emit(E.dismissUnionSuccess); this.unionList();
        }));
        this.listen(S.s2c_req_alliance_list, d => { this.finish(S.c2s_req_alliance_list); this.proxy.updateUnionList(d.allianceList); EventMgr.emit(E.updateUnionList, this.proxy.getUnionList()); });
        [S.s2c_req_alliance_info, S.s2c_sync_alliance, S.s2c_set_alliance_info].forEach(name => this.listen(name, d => {
            this.finish(S.c2s_set_alliance_info);
            const u = this.proxy.updateInfo(d.info);
            if (u) { EventMgr.emit(E.unionInfo, u); EventMgr.emit(E.unionNotice, { id: u.id, text: u.notice }); }
        }));
        this.listen(S.s2c_req_member_list, d => {
            this.proxy.updateMemberList(d.allianceId, d.memberList); this.notifyMembers();
        });
        this.listen(S.s2c_sync_member_change, d => {
            if (!d.member || !hasId(d.member.uid)) return;
            this.proxy.updateMember(d.allianceId, d.member, d.changeType === 2 || d.changeType === 3);
            this.notifyMembers();
        });
        this.listen(S.s2c_req_apply_list, d => {
            this.finish(S.c2s_req_apply_list);
            if (!this.proxy.canManage()) return;
            if (this.applyAllianceId !== idKey(this.proxy.myAllianceId)) { this.unionApplyList(); return; }
            this.proxy.updateApplyList(this.proxy.myAllianceId, d.applyList);
            EventMgr.emit(E.updateUnionApply, this.proxy.getApplyList());
        });
        this.listen(S.s2c_handle_apply, d => {
            this.finish(S.c2s_handle_apply); this.proxy.removeApply(d.uid);
            EventMgr.emit(E.updateUnionApply, this.proxy.getApplyList()); EventMgr.emit(E.verifyUnionSuccess);
            if (d.agree) this.unionMember();
        });
        this.listen(S.s2c_kick_member, d => {
            this.finish(S.c2s_kick_member); this.proxy.updateMember(this.proxy.myAllianceId, { uid: d.uid }, true);
            this.notifyMembers(); EventMgr.emit(E.kickUnionSuccess);
        });
        this.listen(S.s2c_set_member_pos, d => {
            this.finish(S.c2s_set_member_pos); this.unionMember(); EventMgr.emit(E.unionAppoint, d);
        });
        this.listen(S.s2c_transfer_leader, d => {
            this.finish(S.c2s_transfer_leader); this.requestMine(); this.unionMember(); EventMgr.emit(E.unionAbdicate, d);
        });
        this.listen(S.s2c_apply_alliance, d => {
            this.finish(S.c2s_apply_alliance);
            if (!this.proxy.isMeInUnion()) this.proxy.applications.add(idKey(d.allianceId));
            if (this.proxy.getUnion(d.allianceId)?.joinType === 2) EventMgr.emit(E.showToast, '申请已发送，等待审批');
            EventMgr.emit(E.updateUnionList, this.proxy.getUnionList());
            this.requestMine();
        });
        this.listen(S.s2c_cancel_apply, d => {
            this.finish(S.c2s_cancel_apply); this.proxy.applications.delete(idKey(d.allianceId));
            EventMgr.emit(E.updateUnionList, this.proxy.getUnionList());
        });
        this.listen(S.s2c_invite_alliance, () => this.finish(S.c2s_invite_alliance));
        this.listen(S.s2c_sync_alliance_invite, d => {
            if (!hasId(d.brief?.allianceId)) return;
            this.proxy.invitations.set(idKey(d.brief.allianceId), d); EventMgr.emit(E.allianceInvite, d);
        });
        this.listen(S.s2c_handle_invite, d => {
            this.finish(S.c2s_handle_invite); this.proxy.invitations.delete(idKey(d.allianceId));
            if (d.agree) this.requestMine();
        });
    }
    protected reset(): void { this.proxy.clearData(); this.membershipVersion = 0; this.requestedMembershipVersion = 0; this.applyAllianceId = '0'; }
    protected onSessionReady(): void { this.requestMine(); }
    private setMine(id: AllianceId, pos: number, info?: any): void {
        const oldId = idKey(this.proxy.myAllianceId);
        this.proxy.setMine(id, pos, info);
        LoginCommand.getInstance().proxy.setAllianceId(id);
        if (hasId(id)) this.proxy.applications.delete(idKey(id));
        EventMgr.emit(E.unionChange, id);
        EventMgr.emit(E.unionInfo, this.proxy.getUnion());
        EventMgr.emit(E.updateUnionApply, this.proxy.getApplyList());
        if (this.proxy.canManage()) this.unionApplyList();
        if (oldId !== idKey(id)) EventMgr.emit(E.updateMyRole);
    }
    private notifyMembers(): void { EventMgr.emit(E.updateUnionMember, this.proxy.getMemberList()); }
    requestMine(): boolean {
        if (this.isPending(S.c2s_req_my_alliance)) return false;
        this.requestedMembershipVersion = this.membershipVersion;
        return this.request(S.c2s_req_my_alliance, {});
    }
    unionCreate(name: string, flag = 0, joinType = 2, notice = ''): boolean {
        return !this.proxy.isMeInUnion() && !!name.trim() && ([1, 2, 3].indexOf(joinType) >= 0)
            && this.request(S.c2s_create_alliance, { name: name.trim(), flag, joinType, notice });
    }
    unionJoin(id: AllianceId = 0): boolean { return !this.proxy.isMeInUnion() && hasId(id) && this.request(S.c2s_apply_alliance, { allianceId: id }); }
    cancelApply(id: AllianceId): boolean { return hasId(id) && this.request(S.c2s_cancel_apply, { allianceId: id }); }
    unionList(keyword = '', start = 1, count = 0): boolean { return this.request(S.c2s_req_alliance_list, { keyword, start: Math.max(1, start), count: Math.max(0, count) }); }
    unionInfo(id: AllianceId = 0): boolean { return hasId(id) ? this.send(S.c2s_req_alliance_info, { allianceId: id }) : this.requestMine(); }
    unionMember(id: AllianceId = 0): boolean { return (hasId(id) || this.proxy.isMeInUnion()) && this.send(S.c2s_req_member_list, { allianceId: id }); }
    unionApplyList(_id: AllianceId = 0): boolean {
        if (!this.proxy.canManage() || this.isPending(S.c2s_req_apply_list)) return false;
        this.applyAllianceId = idKey(this.proxy.myAllianceId);
        return this.request(S.c2s_req_apply_list, {});
    }
    unionDismiss(): boolean { return this.proxy.myPos === 1 && this.request(S.c2s_dissolve_alliance, {}); }
    unionExit(): boolean { return this.proxy.myPos > 1 && this.request(S.c2s_leave_alliance, {}); }
    unionVerify(uid: AllianceId = 0, decide = 0): boolean {
        return this.proxy.canManage() && hasId(uid) && this.request(S.c2s_handle_apply, { uid, agree: decide === 1 });
    }
    unionKick(uid: AllianceId = 0): boolean { return this.proxy.canKick(uid) && this.request(S.c2s_kick_member, { uid }); }
    unionAppoint(uid: AllianceId = 0, title = 1): boolean {
        return this.proxy.myPos === 1 && this.proxy.canKick(uid) && ([1, 2].indexOf(title) >= 0)
            && this.request(S.c2s_set_member_pos, { uid, pos: title + 1 });
    }
    unionAbdicate(uid: AllianceId = 0): boolean {
        return this.proxy.myPos === 1 && this.proxy.canKick(uid) && this.request(S.c2s_transfer_leader, { uid });
    }
    setAllianceInfo(flag: number, joinType: number, notice: string, manifesto: string): boolean {
        return this.proxy.canManage() && ([1, 2, 3].indexOf(joinType) >= 0) && this.request(S.c2s_set_alliance_info, { flag, joinType, notice, manifesto });
    }
    modNotice(notice: string): boolean {
        const u = this.proxy.getUnion();
        return !!u && this.setAllianceInfo(u.flag, u.joinType, notice, u.manifesto);
    }
    invite(uid: AllianceId): boolean { return this.proxy.canManage() && hasId(uid) && this.request(S.c2s_invite_alliance, { uid }); }
    handleInvite(allianceId: AllianceId, agree: boolean): boolean {
        return hasId(allianceId) && this.request(S.c2s_handle_invite, { allianceId, agree });
    }
    appoint(uid: AllianceId = 0): boolean { return this.unionAppoint(uid); }
    unionLog(): void { EventMgr.emit(E.unionLog, []); EventMgr.emit(E.showToast, '当前协议暂未提供联盟日志'); }
}
