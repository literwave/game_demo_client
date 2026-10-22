import { _decorator, Component, Prefab, Node, instantiate, TiledMapAsset, JsonAsset, SpriteFrame, sys, AudioSource, assert, resources } from 'cc';
const { ccclass, property } = _decorator;

import { GameConfig } from "./config/GameConfig";
import LoaderManager, { LoadData, LoadDataType } from "./core/LoaderManager";
import ConfigManager from "./core/ConfigManager";
import ArmyCommand from "./general/ArmyCommand";
import GeneralCommand from "./general/GeneralCommand";
import TroopCommand from "./general/TroopCommand";
import LoginCommand from "./login/LoginCommand";
import MapCommand from "./map/MapCommand";
import MapUICommand from "./map/ui/MapUICommand";
import { HttpManager } from "./network/http/HttpManager";
import { NetEvent } from "./network/socket/NetInterface";
import { NetManager } from "./network/socket/NetManager";
import SkillCommand from "./skill/SkillCommand";
import Toast from "./utils/Toast";
import { Tools } from "./utils/Tools";
import { EventMgr } from './utils/EventMgr';
import { AudioManager } from './common/AudioManager';
import { LogicEvent } from './common/LogicEvent';
import { ProtoManager } from './network/pto/ProtoManager';
import { CoreEvent } from './core/CoreEvent';
import LoadingLogic from './common/LoadingLogic';
import ReconnectLogic, { ReconnectState } from './common/ReconnectLogic';
import RewardCommand from './reward/RewardCommand';
import RewardWindowLogic from './reward/RewardWindowLogic';
import SystemOpenCommand from './systemopen/SystemOpenCommand';
import SystemUnlockWindow from './systemopen/SystemUnlockWindow';

@ccclass('Main')
export default class Main extends Component {
    @property(Prefab)
    loginScenePrefab: Prefab = null;

    @property(Prefab)
    mapScenePrefab: Prefab = null;
    @property(Prefab)
    mapUIScenePrefab: Prefab = null;

    @property(Prefab)
    loadingPrefab: Prefab = null;


    @property(Prefab)
    waitPrefab: Prefab = null;

    @property(Prefab)
    toastPrefab: Prefab = null;

    private _audioSource: AudioSource = null!;
    private toastNode: Node = null;
    protected _loginScene: Node = null;
    protected _mapScene: Node = null;
    protected _mapUIScene: Node = null;
    protected _loadingNode: Node = null;
    protected _waitNode: Node = null;
    private _reconnectNode: Node = null;
    private _reconnectLogic: ReconnectLogic = null;
    private _retryTimes: number = 0;
    private _h5GeneralPicIndex: number = 0;
    private _h5GeneralPic = [];


    protected onLoad(): void {

        console.log("main load");

        const audioSource = this.getComponent(AudioSource)!;
        assert(!!audioSource);
        this._audioSource = audioSource;

        AudioManager.instance.init(this._audioSource);

        EventMgr.on(LogicEvent.enterMap, this.onEnterMap, this);
        EventMgr.on(CoreEvent.mapReady, this.onMapReady, this);
        EventMgr.on(LogicEvent.enterLogin, this.enterLogin, this);
        EventMgr.on(LogicEvent.showToast, this.onShowToast, this);
        EventMgr.on(LogicEvent.showWaiting, this.showWaitNode, this);
        EventMgr.on(LogicEvent.hideWaiting, this.hideWaitNode, this);

        EventMgr.on(NetEvent.ServerRequesting, this.showWaitNode, this);
        EventMgr.on(NetEvent.ServerRequestSucess, this.onServerRequest, this);
        EventMgr.on(NetEvent.ServerReconnecting, this.onServerReconnecting, this);
        EventMgr.on(NetEvent.ServerReconnectSuccess, this.onServerReconnectSuccess, this);
        EventMgr.on(NetEvent.ServerReconnectFailed, this.onServerReconnectFailed, this);

        RewardCommand.getInstance();
        RewardWindowLogic.init();
        SystemOpenCommand.getInstance();
        SystemUnlockWindow.init();
        TroopCommand.getInstance();


        //初始化连接
        // NetManager.getInstance().connect({ url: GameConfig.serverUrl, type: NetNodeType.BaseServer });
        HttpManager.getInstance().setWebUrl(GameConfig.webUrl);

        // 初始化 Protobuf (异步)
        ProtoManager.getInstance().init().then(() => {
            console.log("Protobuf initialized");
            //初始化业务模块
            LoginCommand.getInstance();
            this.enterLogin();
        });

    }

    protected onDestroy(): void {
        console.log("main onDestroy");

        EventMgr.targetOff(this);
    }

    protected clearData(): void {
        MapCommand.getInstance().clearData();
        GeneralCommand.getInstance().clearData();
        ArmyCommand.getInstance().clearData();
        TroopCommand.getInstance().clearData();
        SystemOpenCommand.getInstance().proxy.clear();
        SystemUnlockWindow.reset();
    }

    private enterLogin(): void {
        this.disposeReconnectNow();
        this.disposeLoadingNow();
        this.clearAllScene();
        this.clearData();
        // 先取消网关重连，再打开登录页。否则登录页出来后，旧的重连定时器还会去连网关
        NetManager.getInstance().close();
        this._loginScene = instantiate(this.loginScenePrefab);
        this.node.addChild(this._loginScene);

        //this.h5LoadGeneralTex();
    }

    private onServerReconnecting(state: ReconnectState): void {
        if (!this._mapScene && !this._mapUIScene) {
            return;
        }
        const logic = this.ensureReconnectLogic();
        if (!logic) {
            this.showTopToast('网络连接已断开，正在尝试重连');
            return;
        }
        this._reconnectNode.setSiblingIndex(this.topLayer() + 20);
        logic.showReconnecting(state);
    }

    private onServerReconnectSuccess(): void {
        if (this._reconnectLogic && this._reconnectNode && this._reconnectNode.active) {
            this._reconnectLogic.showSuccess();
        }
    }

    private onServerReconnectFailed(): void {
        if (!this._mapScene && !this._mapUIScene) {
            this.enterLogin();
            return;
        }
        const logic = this.ensureReconnectLogic();
        if (!logic) {
            this.enterLogin();
            return;
        }
        this._reconnectNode.setSiblingIndex(this.topLayer() + 20);
        logic.showFailed();
    }

    private ensureReconnectLogic(): ReconnectLogic | null {
        if (this._reconnectNode && this._reconnectNode.isValid) {
            return this._reconnectLogic;
        }
        this._reconnectNode = new Node('Reconnect');
        this._reconnectNode.layer = this.node.layer;
        this._reconnectNode.setParent(this.node);
        this._reconnectNode.setSiblingIndex(this.topLayer() + 20);
        this._reconnectLogic = this._reconnectNode.addComponent(ReconnectLogic);
        this._reconnectNode.active = false;
        return this._reconnectLogic;
    }

    private disposeReconnectNow(): void {
        if (this._reconnectNode) {
            if (this._reconnectNode.isValid) {
                this._reconnectNode.destroy();
            }
            this._reconnectNode = null;
        }
        this._reconnectLogic = null;
    }

    protected onEnterMap(): void {
        if (this._loadingNode || this._mapScene) {
            return;
        }
        let dataList: LoadData[] = [];
        // INDEX 0: 地图数据
        dataList.push(new LoadData("world/map", LoadDataType.FILE, TiledMapAsset));
        // INDEX 1: 配置目录 (包含 Hero.json, mapRes_0.json 等)
        dataList.push(new LoadData("config", LoadDataType.DIR, JsonAsset));

        this.addLoadingNode();

        LoaderManager.getInstance().startLoadList(dataList,
            (percent) => {
                // 进度更新
            },
            (error: Error, paths: string[], datas: any[]) => {
                if (error != null) {
                    console.error("启动资源加载失败:", error);
                    this.disposeLoadingNow();
                    EventMgr.emit(LogicEvent.showToast, "战场资源加载失败，请重试");
                    return;
                }

                const tiledMap = datas[0] as TiledMapAsset;
                const configAssets = datas[1] as JsonAsset[];

                // 1. 初始化 ConfigManager
                ConfigManager.getInstance().loadConfigs(configAssets);

                // 2. 从 ConfigManager 获取特定配置
                const mapResCfg = ConfigManager.getInstance().getConfig("mapRes_0");
                const heroJson = ConfigManager.getInstance().getConfig("Hero");
                const basicCfg = ConfigManager.getInstance().getConfig("Global");

                // 3. 初始化地图
                MapCommand.getInstance().proxy.tiledMapAsset = tiledMap;
                MapCommand.getInstance().proxy.initMapResConfig(mapResCfg);

                // // 4. 初始化核心配置 Proxy
                // MapUICommand.getInstance().proxy.setAllFacilityCfg(configAssets);
                MapUICommand.getInstance().proxy.setBasic({ json: basicCfg });

                if (heroJson) {
                    GeneralCommand.getInstance().proxy.initHeroConfig(heroJson, basicCfg);
                }

                // 3. 全局设置
                const globalWarFree = ConfigManager.getInstance().getConfigItem("Global", "3");
                if (globalWarFree) {
                    MapCommand.getInstance().proxy.setWarFree(globalWarFree.value1);
                }

                // 4. 进入场景
                GeneralCommand.getInstance().qryMyGenerals();
                this.clearAllScene();
                this._mapScene = instantiate(this.mapScenePrefab);
                this._mapScene.parent = this.node;

                this._mapUIScene = instantiate(this.mapUIScenePrefab);
                this._mapUIScene.parent = this.node;

                // 保持加载页在最上层，等地图首帧真正渲染后再淡出
                if (this._loadingNode) {
                    this._loadingNode.setSiblingIndex(this.topLayer() + 1);
                }
                // 正常由 mapReady 收起；这里兜底，避免极端情况下加载页卡住
                this.scheduleOnce(this.finishLoading, 3);
            },
            this
        );
    }

    private onMapReady(): void {
        this.unschedule(this.finishLoading);
        this.finishLoading();
    }

    private finishLoading(): void {
        if (!this._loadingNode) {
            return;
        }
        const logic = this._loadingNode.getComponent(LoadingLogic);
        if (logic) {
            logic.finish();
        } else if (this._loadingNode.isValid) {
            this._loadingNode.destroy();
        }
        this._loadingNode = null;
    }

    private disposeLoadingNow(): void {
        if (this._loadingNode) {
            if (this._loadingNode.isValid) {
                this._loadingNode.destroy();
            }
            this._loadingNode = null;
        }
    }

    private h5LoadGeneralTex() {
        if (!sys.isBrowser) {
            return;
        }

        if (this._h5GeneralPic.length == 0) {
            let generalpic = resources.getDirWithPath("./generalpic");
            // console.log("generalpic:", generalpic);
            generalpic.forEach(v => {
                if (v.ctor == SpriteFrame) {
                    this._h5GeneralPic.push(v);
                }
            });
        }

        let f = () => {

            for (let index = this._h5GeneralPicIndex; index < this._h5GeneralPic.length; index++) {
                const pic = this._h5GeneralPic[index];

                let name = pic.path.replaceAll("spriteFrame", "");
                name = name.replaceAll("/", "");
                name = name.replaceAll("\\", "");

                let id: number = Number(String(name).split("_")[1]);
                let frame = GeneralCommand.getInstance().proxy.getGeneralTex(id);
                this._h5GeneralPicIndex = index + 1;
                // console.log("load index 1111:", index);

                if (!frame) {
                    resources.load(pic.path, SpriteFrame,
                        (finish: number, total: number) => {
                        },
                        (error: Error, asset: any) => {
                            if (error != null) {
                                console.log("h5LoadGeneralTex error:", error.message);
                            } else {
                                GeneralCommand.getInstance().proxy.setGeneralTex(id, asset);
                            }
                        });
                    break;
                }
            }
            if (this._h5GeneralPicIndex >= this._h5GeneralPic.length) {
                this.unschedule(f);
                console.log("h5 load generalPic finish");
            }
        }

        this.schedule(f, 0.01);

    }

    protected addLoadingNode(): void {
        if (this.loadingPrefab) {
            if (this._loadingNode == null) {
                this._loadingNode = instantiate(this.loadingPrefab);
            }

            this._loadingNode.parent = this.node;
            this._loadingNode.setSiblingIndex(this.topLayer() + 1);
        }
    }


    protected showWaitNode(): void {
        if (this._waitNode == null) {
            this._waitNode = instantiate(this.waitPrefab);
            this._waitNode.parent = this.node;
        }
        this._waitNode.setSiblingIndex(this.topLayer() + 2);
        this._waitNode.active = true;
    }

    protected hideWaitNode(): void {
        if (this._waitNode == null) {
            this._waitNode = instantiate(this.waitPrefab);
            this._waitNode.parent = this.node;
            this._waitNode.setSiblingIndex(this.topLayer() + 2);
        }
        this._waitNode.active = false;
    }


    protected showTopToast(text: string = ""): void {
        if (this.toastNode == null) {
            let toast = instantiate(this.toastPrefab);
            toast.parent = this.node;
            this.toastNode = toast;
        }
        this.toastNode.active = true;
        this.toastNode.setSiblingIndex(this.topLayer() + 10);
        this.toastNode.getComponent(Toast).setText(text);
    }


    private onServerRequest(msg: any): void {
        if (msg.code == undefined || msg.code == 0 || msg.code == 9) {
            this._retryTimes = 0;
            return;
        }

        if (msg.code == -1 || msg.code == -2 || msg.code == -3 || msg.code == -4) {
            if (this._retryTimes < 3) {
                LoginCommand.getInstance().role_enterServer(LoginCommand.getInstance().proxy.getSession());
                this._retryTimes += 1;
                return
            }
        }

        this.showTopToast(Tools.getCodeStr(msg.code));
    }

    private onShowToast(msg: string) {
        this.showTopToast(msg);
    }

    protected clearAllScene() {
        if (this._mapScene) {
            this._mapScene.destroy();
            this._mapScene = null;
        }

        if (this._mapUIScene) {
            this._mapUIScene.destroy();
            this._mapUIScene = null;
        }

        if (this._loginScene) {
            this._loginScene.destroy();
            this._loginScene = null;
        }

        if (this._waitNode) {
            this._waitNode.destroy();
            this._waitNode = null;
        }

    }

    public topLayer(): number {
        return this.node.children.length + 1;
    }
}
