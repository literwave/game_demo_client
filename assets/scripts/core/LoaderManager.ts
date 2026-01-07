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
     * 并发加载资源列表
     */
    public startLoadList(dataList: LoadData[],
        onProgress: (percent: number) => void,
        onComplete: (error: Error | null, paths: string[], datas: any[]) => void,
        target: any = null): void {

        if (this._isLoading) return;
        this._isLoading = true;

        const totalItems = dataList.length;
        const results = new Array(totalItems);
        const paths = new Array(totalItems);
        let completedCount = 0;
        let hasError = false;

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
            completedCount++;

            if (completedCount === totalItems) {
                this._isLoading = false;
                EventMgr.emit(CoreEvent.loadComplete);
                if (onComplete) onComplete.call(target, null, paths, results);
            }
        };

        dataList.forEach((data, index) => {
            const loadCallback = (finish: number, total: number) => {
                // 简单的进度计算：已完成项 + 当前项的比例
                const itemPercent = 1 / totalItems;
                const currentProgress = (finish / total) * itemPercent;
                // 这里我们暂不记录细化的每项进度，直接通过已完成数量估算
                const totalPercent = Number(((completedCount / totalItems) + currentProgress).toFixed(2));

                EventMgr.emit(CoreEvent.loadProgress, totalPercent);
                if (onProgress) onProgress.call(target, totalPercent);
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
