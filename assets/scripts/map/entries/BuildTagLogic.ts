import { _decorator, Component, Node } from 'cc';
import MapCommand from "../MapCommand";
import { MapResData } from "../MapProxy";
const { ccclass, property } = _decorator;


@ccclass('BuildTagLogic')
export default class BuildTagLogic extends Component {
   
    protected _data: MapResData = null;

    @property(Node)
    tagIconNode: Node = null;

    protected onLoad(): void {
        this.tagIconNode.active = false;
    }

    protected onDisable(): void {
        this._data = null;
        this.tagIconNode.active = false;
    }

     public setResourceData(data: MapResData): void {
        this._data = data;
        this.updateUI();
     }

    public updateUI(): void {
        if (this._data) {
            this.tagIconNode.active = MapCommand.getInstance().proxy.isPosTag(this._data.x, this._data.y);
        }
    }

}
