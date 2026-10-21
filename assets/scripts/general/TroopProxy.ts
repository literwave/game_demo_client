/** 部队协议中的英雄位置映射：英雄 ID -> 位置 */
export type HeroIndexMap = { [heroIdx: string]: number };

/** 协议 pos2HeroMap：位置 -> 英雄 idx，转成 [英雄 idx, 位置] */
function normalizePos2HeroMap(rawMap: any): Array<[number, number]> {
    const result: Array<[number, number]> = [];
    if (!rawMap) {
        return result;
    }

    if (rawMap instanceof Map) {
        rawMap.forEach((heroIdx, position) => {
            result.push([Number(heroIdx), Number(position)]);
        });
        return result;
    }

    if (Array.isArray(rawMap)) {
        rawMap.forEach((item: any) => {
            if (!item) {
                return;
            }
            const position = Number(item.key != null ? item.key : item[0]);
            const heroIdx = Number(item.value != null ? item.value : item[1]);
            result.push([heroIdx, position]);
        });
        return result;
    }

    if (typeof rawMap === 'object') {
        Object.keys(rawMap).forEach((position) => {
            result.push([Number(rawMap[position]), Number(position)]);
        });
    }
    return result;
}

function unwrapTroop(serverData: any): any {
    if (!serverData) {
        return serverData;
    }
    return serverData.troopInfo || serverData.troop_info || serverData;
}

/** 部队数据 */
export class TroopData {
    troopIdx: number = 0;
    heroPositions: Map<number, number> = new Map<number, number>();

    public static createFromServer(serverData: any, troopData: TroopData = null): TroopData {
        const data = troopData || new TroopData();
        if (!serverData) {
            return data;
        }

        const troop = unwrapTroop(serverData);
        data.troopIdx = Number(troop.troopIdx != null ? troop.troopIdx : (troop.troop_idx != null ? troop.troop_idx : data.troopIdx));
        data.heroPositions.clear();

        const entries = normalizePos2HeroMap(troop.pos2HeroMap != null ? troop.pos2HeroMap : troop.pos_2_hero_map);
        entries.forEach(([heroIdx, position]) => {
            if (!Number.isFinite(heroIdx) || !Number.isFinite(position) || heroIdx <= 0 || position < 0) {
                return;
            }
            data.removePosition(position);
            data.heroPositions.set(heroIdx, position);
        });
        return data;
    }

    public getHeroMap(): HeroIndexMap {
        const result: HeroIndexMap = {};
        this.heroPositions.forEach((position, heroIdx) => {
            result[String(heroIdx)] = position;
        });
        return result;
    }

    public getHeroIdxAt(position: number): number {
        let result = 0;
        this.heroPositions.forEach((heroPosition, heroIdx) => {
            if (result == 0 && heroPosition == position) {
                result = heroIdx;
            }
        });
        return result;
    }

    public getHeroPosition(heroIdx: number): number {
        return this.heroPositions.has(heroIdx) ? this.heroPositions.get(heroIdx) : -1;
    }

    public hasHero(heroIdx: number): boolean {
        return this.heroPositions.has(heroIdx);
    }

    public setHero(heroIdx: number, position: number): void {
        if (!Number.isFinite(heroIdx) || !Number.isFinite(position) || heroIdx <= 0 || position < 0) {
            return;
        }
        this.removeHero(heroIdx);
        this.removePosition(position);
        this.heroPositions.set(heroIdx, position);
    }

    public removeHero(heroIdx: number): void {
        this.heroPositions.delete(heroIdx);
    }

    public removePosition(position: number): void {
        let occupant = 0;
        this.heroPositions.forEach((heroPosition, heroIdx) => {
            if (occupant == 0 && heroPosition == position) {
                occupant = heroIdx;
            }
        });
        if (occupant > 0) {
            this.heroPositions.delete(occupant);
        }
    }

    public getSortedHeroes(): Array<{ heroIdx: number, position: number }> {
        const list: Array<{ heroIdx: number, position: number }> = [];
        this.heroPositions.forEach((position, heroIdx) => {
            list.push({ heroIdx, position });
        });
        list.sort((left, right) => left.position - right.position);
        return list;
    }

    public getHeroCount(): number {
        return this.heroPositions.size;
    }
}

export default class TroopProxy {
    protected _troops: Map<number, TroopData> = new Map<number, TroopData>();

    public clearData(): void {
        this._troops.clear();
    }

    public updateTroops(datas: any[]): void {
        this._troops.clear();
        if (!Array.isArray(datas)) {
            return;
        }
        datas.forEach((serverData) => {
            const troop = TroopData.createFromServer(serverData);
            if (troop.troopIdx > 0) {
                this._troops.set(troop.troopIdx, troop);
            }
        });
    }

    public updateTroop(serverData: any): TroopData {
        if (!serverData) {
            return null;
        }
        const troop = unwrapTroop(serverData);
        const troopIdx = Number(troop.troopIdx != null ? troop.troopIdx : troop.troop_idx);
        if (!troopIdx) {
            return null;
        }
        const troopData = TroopData.createFromServer(troop, this._troops.get(troopIdx) || null);
        this._troops.set(troopIdx, troopData);
        return troopData;
    }

    public getTroop(troopIdx: number): TroopData {
        return this._troops.get(Number(troopIdx)) || null;
    }

    public getTroops(): TroopData[] {
        const list = Array.from(this._troops.values());
        list.sort((left, right) => left.troopIdx - right.troopIdx);
        return list;
    }

    public getTroopIdxByHero(heroIdx: number): number {
        let result = 0;
        this._troops.forEach((troop) => {
            if (result == 0 && troop.hasHero(Number(heroIdx))) {
                result = troop.troopIdx;
            }
        });
        return result;
    }

    public isHeroInTroop(heroIdx: number): boolean {
        return this.getTroopIdxByHero(heroIdx) > 0;
    }

    public getAssignedHeroIds(): Set<number> {
        const result = new Set<number>();
        this._troops.forEach((troop) => {
            troop.heroPositions.forEach((position, heroIdx) => result.add(heroIdx));
        });
        return result;
    }
}
