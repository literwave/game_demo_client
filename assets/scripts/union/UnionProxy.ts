import { hasId, idKey } from '../network/pto/ProtocolCommand';

export type AllianceId = number | string;
export class Apply {
    id: AllianceId = 0;
    rid: AllianceId = 0;
    nick_name = '';
    headIcon = 0;
    level = 0;
    power: number | string = 0;
    time = 0;
}
export class Member {
    rid: AllianceId = 0;
    name = '';
    pos = 3;
    headIcon = 0;
    level = 0;
    power: number | string = 0;
    joinTime = 0;
    offlineTime = 0;
    get title(): number { return this.pos - 1; }
    get titleDes(): string { return this.pos === 1 ? '盟主' : this.pos === 2 ? '官员' : '成员'; }
    x = 0;
    y = 0;
}
export class Union {
    id: AllianceId = 0;
    name = '';
    cnt = 0;
    memberMax = 0;
    notice = '';
    manifesto = '';
    flag = 0;
    level = 0;
    power: number | string = 0;
    joinType = 2;
    leaderId: AllianceId = 0;
    leaderName = '';
    createTime = 0;
    major: Member[] = [];
    getChairman(): Member {
        return this.major.find(m => m.pos === 1) || Object.assign(new Member(), { rid: this.leaderId, name: this.leaderName, pos: 1 });
    }
    getViceChairman(): Member { return this.major.find(m => m.pos === 2) || new Member(); }
    isMajor(uid: AllianceId): boolean {
        return hasId(uid) && (idKey(this.leaderId) === idKey(uid) || this.major.some(m => idKey(m.rid) === idKey(uid) && m.pos <= 2));
    }
}

export default class UnionProxy {
    myAllianceId: AllianceId = 0;
    myPos = 0;
    private unions = new Map<string, Union>();
    private members = new Map<string, Member[]>();
    private applies: Apply[] = [];
    private listIds: string[] = [];
    readonly invitations = new Map<string, any>();
    readonly applications = new Set<string>();

    clearData(): void {
        this.myAllianceId = 0; this.myPos = 0;
        this.unions.clear(); this.members.clear(); this.applies = []; this.listIds = [];
        this.invitations.clear(); this.applications.clear();
    }
    setMine(id: AllianceId, pos: number, info?: any): void {
        if (idKey(id) !== idKey(this.myAllianceId)) {
            this.members.delete(idKey(this.myAllianceId));
            this.applies = [];
        }
        this.myAllianceId = id || 0;
        this.myPos = hasId(id) ? pos : 0;
        if (info) this.updateInfo(info);
        if (!this.canManage()) this.applies = [];
    }
    updateInfo(info: any): Union | null {
        const b = info?.brief || info;
        if (!b || !hasId(b.allianceId)) return null;
        const u = this.unions.get(idKey(b.allianceId)) || new Union();
        Object.assign(u, { id: b.allianceId, name: b.name, cnt: b.memberCount, memberMax: b.memberMax,
            notice: b.notice, flag: b.flag, level: b.level, power: b.power, joinType: b.joinType, leaderName: b.leaderName });
        if (info.brief) Object.assign(u, { manifesto: info.manifesto, leaderId: info.leaderId, createTime: info.createTime });
        u.major = (this.members.get(idKey(u.id)) || []).filter(m => m.pos <= 2);
        this.unions.set(idKey(u.id), u);
        return u;
    }
    updateUnionList(list: any[]): void {
        this.listIds = (list || []).map(b => this.updateInfo(b)).filter(Boolean).map(u => idKey(u.id));
    }
    getUnionList(): Union[] { return this.listIds.map(id => this.unions.get(id)).filter(Boolean); }
    getUnion(id: AllianceId = 0): Union | null { return this.unions.get(idKey(hasId(id) ? id : this.myAllianceId)) || null; }
    updateMemberList(id: AllianceId, list: any[]): void {
        const members = (list || []).map(m => Object.assign(new Member(), m, { rid: m.uid }));
        this.members.set(idKey(id), members);
        const u = this.getUnion(id);
        if (u) u.major = members.filter(m => m.pos <= 2);
    }
    updateMember(id: AllianceId, data: any, remove: boolean): void {
        const list = this.getMemberList(id).filter(m => idKey(m.rid) !== idKey(data.uid));
        if (!remove) list.push(Object.assign(new Member(), data, { rid: data.uid }));
        this.members.set(idKey(id), list);
        const u = this.getUnion(id);
        if (u) u.major = list.filter(m => m.pos <= 2);
    }
    getMemberList(id: AllianceId = 0): Member[] { return this.members.get(idKey(hasId(id) ? id : this.myAllianceId)) || []; }
    updateApplyList(_id: AllianceId, list: any[]): void {
        this.applies = (list || []).map(a => Object.assign(new Apply(), a, { id: a.uid, rid: a.uid, nick_name: a.name }));
    }
    removeApply(uid: AllianceId): void { this.applies = this.applies.filter(a => idKey(a.id) !== idKey(uid)); }
    getApplyList(): Apply[] { return this.applies.slice(); }
    getApplyCnt(_id: AllianceId = 0): number { return this.applies.length; }
    isMeInUnion(): boolean { return hasId(this.myAllianceId); }
    isMeChairman(id: AllianceId = 0): boolean { return (!hasId(id) || idKey(id) === idKey(this.myAllianceId)) && this.myPos === 1; }
    isChairman(id: AllianceId, uid: AllianceId): boolean { return hasId(uid) && idKey(this.getUnion(id)?.leaderId) === idKey(uid); }
    canManage(): boolean { return this.isMeInUnion() && (this.myPos === 1 || this.myPos === 2); }
    canKick(uid: AllianceId): boolean {
        const target = this.getMemberList().find(m => idKey(m.rid) === idKey(uid));
        return !!target && target.pos > this.myPos && this.canManage();
    }
}
