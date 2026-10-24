import ProtocolCommand from '../network/pto/ProtocolCommand';
import { ServerConfig as S } from '../config/ServerConfig';
import { LogicEvent as E } from '../common/LogicEvent';
import { EventMgr } from '../utils/EventMgr';

/** 建造和升级即时完成，以 s2c_sync_build 为唯一等级来源。 */
export default class BuildCommand extends ProtocolCommand {
    private static instance: BuildCommand;
    static getInstance(): BuildCommand { return this.instance || (this.instance = new BuildCommand()); }
    readonly levels = new Map<number, number>();
    constructor() {
        super();
        this.listen(S.s2c_sync_build, d => {
            if (!Number.isInteger(d.bid) || d.bid <= 0 || !Number.isInteger(d.level) || d.level < 0) return;
            this.finish(`build:${d.bid}`);
            this.levels.set(d.bid, d.level);
            EventMgr.emit(E.updateCityBuilds, d);
        });
    }
    protected reset(): void { this.levels.clear(); }
    create(bid: number): boolean { return this.change(S.c2s_create_build, bid); }
    upgrade(bid: number): boolean { return this.change(S.c2s_up_build, bid); }
    private change(name: string, bid: number): boolean {
        return Number.isInteger(bid) && bid > 0 && bid <= 0x7fffffff && this.request(name, { bid }, `build:${bid}`);
    }
}
