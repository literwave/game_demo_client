import { idKey } from '../network/pto/ProtocolCommand';
export class ChatMsg {
    msgId: number | string = 0;
    rid: number | string = 0;
    targetId: number | string = 0;
    headIcon = 0;
    nick_name = '';
    type = 0;
    channel = 1;
    msg = '';
    time = 0;
}
export default class ChatProxy {
    private histories = new Map<string, ChatMsg[]>();
    private receiving = new Map<string, ChatMsg[]>();
    limit = 100;
    key(channel: number, targetId: any = 0): string { return channel === 3 ? `3:${idKey(targetId)}` : String(channel); }
    clearData(): void { this.histories.clear(); this.receiving.clear(); }
    clearAlliance(): void { this.histories.delete('2'); this.receiving.delete('2'); }
    beginHistory(channel: number, targetId: any): void { this.receiving.set(this.key(channel, targetId), []); }
    cancelHistory(channel: number, targetId: any): void { this.receiving.delete(this.key(channel, targetId)); }
    private convert(d: any): ChatMsg {
        return Object.assign(new ChatMsg(), { msgId: d.msgId, rid: d.senderId, nick_name: d.senderName,
            headIcon: d.headIcon, targetId: d.targetId, channel: d.channel, type: d.channel - 1, msg: d.content, time: d.time });
    }
    private merge(key: string, messages: ChatMsg[]): void {
        const unique = new Map<string, ChatMsg>();
        messages.forEach(m => unique.set(idKey(m.msgId), m));
        this.histories.set(key, Array.from(unique.values()).sort((a, b) => a.time - b.time ||
            idKey(a.msgId).length - idKey(b.msgId).length || idKey(a.msgId).localeCompare(idKey(b.msgId))).slice(-this.limit));
    }
    updateHistory(channel: number, targetId: any, messages: any[]): void {
        const key = this.key(channel, targetId);
        this.merge(key, [...(messages || []).map(m => this.convert(m)), ...(this.receiving.get(key) || [])]);
        this.receiving.delete(key);
    }
    updateMessage(message: any, myUid: any): void {
        if (!message || [1, 2, 3].indexOf(message.channel) < 0) return;
        const target = idKey(message.senderId) === idKey(myUid) ? message.targetId : message.senderId;
        const key = this.key(message.channel, target);
        const msg = this.convert(message);
        const pending = this.receiving.get(key);
        if (pending) pending.push(msg);
        this.merge(key, [...(this.histories.get(key) || []), msg]);
    }
    getWorldChatList(): ChatMsg[] { return this.getHistory(1); }
    getUnionChatList(): ChatMsg[] { return this.getHistory(2); }
    getHistory(channel: number, targetId: any = 0): ChatMsg[] { return (this.histories.get(this.key(channel, targetId)) || []).slice(); }
}
