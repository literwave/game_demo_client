import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

import { MapCityData } from "../MapCityProxy";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { drawCommandRow, setCommandLabel } from './RightHudSkin';

@ccclass('RightCityItemLogic')
export default class RightCityItemLogic extends Component {
    @property(Label)
    labelInfo: Label = null;
    @property(Label)
    labelPos: Label = null;

    protected _data: MapCityData = null;


    protected onLoad(): void {
        const background = this.node.getChildByName('bg');
        if (!background) return;
        drawCommandRow(background);
        setCommandLabel(background, 'EntryBadge', '城', -102, 1, 28, 13);
    }

    protected onDestroy(): void {
        this._data = null;
    }

    protected onClickBg(): void {
        AudioManager.instance.playClick();
        if (this._data) {
            EventMgr.emit(LogicEvent.scrollToMap, this._data.x, this._data.y);
        }
    }

    public setArmyData(data: MapCityData): void {
        this._data = data;
        if (this._data) {
            this.labelInfo.string = this._data.name;
            this.labelPos.string = "(" + this._data.x + ", " + this._data.y + ")";
        }
    }
}
