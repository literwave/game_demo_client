/** 全量查询与增量推送共用的缓存，保留查询途中收到的较新变更。 */
export default class SnapshotStore<T> {
    private items = new Map<string, T>();
    private changes: Map<string, T | null> | null = null;
    constructor(private key: (value: T) => string) {}
    get(id: number | string): T | undefined { return this.items.get(String(id)); }
    values(): T[] { return Array.from(this.items.values()); }
    clear(): void { this.items.clear(); this.changes = null; }
    begin(): void { this.changes = new Map(); }
    cancel(): void { this.changes = null; }
    put(value: T): void {
        const key = this.key(value);
        this.items.set(key, value);
        if (this.changes) this.changes.set(key, value);
    }
    remove(id: number | string): void {
        this.items.delete(String(id));
        if (this.changes) this.changes.set(String(id), null);
    }
    replace(list: T[]): void {
        this.items = new Map(list.map(value => [this.key(value), value]));
        this.changes?.forEach((value, key) => {
            if (value === null) this.items.delete(key);
            else this.items.set(key, value);
        });
        this.changes = null;
    }
}
