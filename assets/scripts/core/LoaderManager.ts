import { Asset, resources } from 'cc';
import { EventMgr } from '../utils/EventMgr';
import { CoreEvent } from './CoreEvent';

export enum LoadDataType {
    DIR,
    FILE
}

export class LoadData {
    path: string = "";
    loadType: LoadDataType = LoadDataType.FILE;
    fileType: typeof Asset = Asset;

    constructor(path: string = "", loadType: LoadDataType = LoadDataType.FILE, fileType: typeof Asset = Asset) {
        this.path = path;
        this.loadType = loadType;
        this.fileType = fileType;
    }
}

export default class LoaderManager {
    protected static _instance: LoaderManager;
    public static getInstance(): LoaderManager {
        if (this._instance == null) {
            this._instance = new LoaderManager();
        }
        return this._instance;
    }

    protected _isLoading: boolean = false;
    protected _loadProgress: Map<string, number> = new Map();

    /**
     * 并发加载资源列表，按各项进度取平均值，并保证回调单调递增
     */
    public startLoadList(dataList: LoadData[],
        onProgress: (percent: number) => void,
        onComplete: (error: Error | null, paths: string[], datas: any[]) => void,
        target: any = null): void {

        if (this._isLoading) return;

        const totalItems = dataList.length;
        if (totalItems === 0) {
            if (onComplete) onComplete.call(target, null, [], []);
            return;
        }

        this._isLoading = true;

        const results = new Array(totalItems);
        const paths = new Array(totalItems);
        const itemProgress = new Array(totalItems).fill(0);
        let completedCount = 0;
        let lastPercent = 0;
        let hasError = false;

        const emitProgress = () => {
            if (hasError) return;
            let sum = 0;
            for (let i = 0; i < totalItems; i++) {
                sum += itemProgress[i];
            }
            // 保留最后 1% 给加载完成事件，避免提前显示 100%
            const percent = Math.min(0.99, sum / totalItems);
            if (percent <= lastPercent + 0.0001) return;
            lastPercent = percent;
            EventMgr.emit(CoreEvent.loadProgress, percent);
            if (onProgress) onProgress.call(target, percent);
        };

        const checkFinish = (index: number, error: Error | null, asset: any) => {
            if (hasError) return;
            if (error) {
                hasError = true;
                this._isLoading = false;
                if (onComplete) onComplete.call(target, error, [], []);
                return;
            }

            results[index] = asset;
            paths[index] = dataList[index].path;
            itemProgress[index] = 1;
            completedCount++;
            emitProgress();

            if (completedCount === totalItems) {
                this._isLoading = false;
                EventMgr.emit(CoreEvent.loadProgress, 1);
                EventMgr.emit(CoreEvent.loadComplete);
                if (onComplete) onComplete.call(target, null, paths, results);
            }
        };

        dataList.forEach((data, index) => {
            const loadCallback = (finish: number, total: number) => {
                if (hasError) return;
                const ratio = total > 0 ? Math.min(1, Math.max(0, finish / total)) : 0;
                if (ratio <= itemProgress[index]) return;
                itemProgress[index] = ratio;
                emitProgress();
            };

            if (data.loadType === LoadDataType.DIR) {
                resources.loadDir(data.path, data.fileType, loadCallback, (err, assets) => {
                    checkFinish(index, err, assets);
                });
            } else {
                resources.load(data.path, data.fileType, loadCallback, (err, asset) => {
                    checkFinish(index, err, asset);
                });
            }
        });
    }

    public startLoad(data: LoadData, loadProgress: (percent: number) => void, loadComplete: (error: Error, paths: string[], datas: any[]) => void, target: any = null): void {
        this.startLoadList([data], loadProgress, loadComplete, target);
    }
}