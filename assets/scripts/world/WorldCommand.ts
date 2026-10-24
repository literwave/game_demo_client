import ProtocolCommand, { hasId, idKey, uint } from '../network/pto/ProtocolCommand';
import SnapshotStore from '../network/pto/SnapshotStore';
import { ServerConfig as S } from '../config/ServerConfig';
import { LogicEvent as E } from '../common/LogicEvent';
import { EventMgr } from '../utils/EventMgr';
import LoginCommand from '../login/LoginCommand';

export interface WorldPosition { x: number; y: number; }
export interface MarchInfo {
    troopIdx: number; targetType: number; targetId: number | string;
    startPos: WorldPosition; endPos: WorldPosition; startTime: number; endTime: number;
    state: number; path: WorldPosition[];
}
export interface WorldEntity {
    entityId: number | string; entityType: number; ownerId: number | string; cfgId: number;
    pos: WorldPosition; path: WorldPosition[]; startTime: number; endTime: number;
}

export default class WorldCommand extends ProtocolCommand {
    private static instance: WorldCommand;
    static getInstance(): WorldCommand { return this.instance || (this.instance = new WorldCommand()); }
    readonly marches = new SnapshotStore<MarchInfo>(m => String(m.troopIdx));
    readonly entities = new Map<string, WorldEntity>();
    private focusPos: WorldPosition | null = null;
    private lastFocus = '';
    private focusTimer: ReturnType<typeof setTimeout> | null = null;
    constructor() {
        super();
        this.listen(S.s2c_req_march_list, d => {
            this.finish(S.c2s_req_march_list); this.marches.replace(d.marchList || []); this.notifyMarches();
        });
        [S.s2c_march, S.s2c_sync_march].forEach(name => this.listen(name, d => {
            if (!d.marchInfo || !uint(d.marchInfo.troopIdx)) return;
            if (name === S.s2c_march) this.finish(`march:${d.marchInfo.troopIdx}`);
            this.marches.put(d.marchInfo); this.notifyMarches();
        }));
        this.listen(S.s2c_cancel_march, d => {
            this.finish(`march:${d.troopIdx}`);
            if (d.marchInfo) this.marches.put(d.marchInfo);
            else this.marches.remove(d.troopIdx);
            this.notifyMarches();
        });
        [S.s2c_aoi_enter, S.s2c_aoi_update].forEach(name => this.listen(name, d => {
            for (const entity of d.entities || []) if (hasId(entity.entityId)) this.entities.set(idKey(entity.entityId), entity);
            EventMgr.emit(E.updateWorldEntities, Array.from(this.entities.values()));
        }));
        this.listen(S.s2c_aoi_leave, d => {
            for (const id of d.entityIds || []) this.entities.delete(idKey(id));
            EventMgr.emit(E.updateWorldEntities, Array.from(this.entities.values()));
        });
        EventMgr.on(E.updateCityPosition, this.focus, this);
        EventMgr.on(E.mapEenterChange, this.focus, this);
    }
    protected reset(): void {
        this.marches.clear(); this.entities.clear(); this.focusPos = null; this.lastFocus = '';
        if (this.focusTimer !== null) clearTimeout(this.focusTimer);
        this.focusTimer = null;
    }
    protected onSessionReady(): void {
        this.requestMarches();
        this.focus(this.focusPos || LoginCommand.getInstance().proxy.getRoleData()?.cityPos);
    }
    private notifyMarches(): void { EventMgr.emit(E.updateMarches, this.marches.values()); }
    requestMarches(): boolean {
        if (this.isPending(S.c2s_req_march_list)) return false;
        this.marches.begin();
        const sent = this.request(S.c2s_req_march_list, {}, S.c2s_req_march_list, () => this.marches.cancel());
        if (!sent) this.marches.cancel();
        return sent;
    }
    march(troopIdx: number, targetType: number, targetId: number | string, targetPos: WorldPosition): boolean {
        if (!uint(troopIdx) || [1, 2].indexOf(targetType) < 0 || !this.validPos(targetPos) || (targetType === 2 && !hasId(targetId))) return false;
        return this.request(S.c2s_march, { troopIdx, targetType, targetId, targetPos }, `march:${troopIdx}`, () => this.requestMarches());
    }
    cancelMarch(troopIdx: number): boolean {
        return uint(troopIdx) && this.request(S.c2s_cancel_march, { troopIdx }, `march:${troopIdx}`, () => this.requestMarches());
    }
    /** 地图格子坐标，250ms 合并拖动上报；不用像素坐标代替格坐标。 */
    focus(pos: WorldPosition): void {
        if (!this.validPos(pos)) return;
        this.focusPos = { x: pos.x, y: pos.y };
        if (!this.ready || this.focusTimer !== null) return;
        this.focusTimer = setTimeout(() => {
            this.focusTimer = null;
            const p = this.focusPos;
            if (!p) return;
            const key = `${p.x},${p.y}`;
            if (key !== this.lastFocus && this.send(S.c2s_aoi_focus, { pos: p })) this.lastFocus = key;
        }, 250);
    }
    private validPos(pos: WorldPosition): boolean {
        return !!pos && Number.isInteger(pos.x) && Number.isInteger(pos.y) && pos.x >= 0 && pos.y >= 0 && pos.x < 1000 && pos.y < 1000;
    }
}
