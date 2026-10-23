import { Color, Node, Sprite } from 'cc';
import BgLogic from '../../common/BgLogic';
import { place } from './ManagementStyle';

/** 武将列表、档案与部队配置共用背景图的色调和等比铺满规则。 */
export function styleGeneralPageBackground(root: Node, width: number, height: number,
    background: Node | null = root.getChildByName('mask')): void {
    const sprite = background?.getComponent(Sprite);
    if (!background || !sprite) return;
    const legacyScale = background.getComponent(BgLogic);
    if (legacyScale) legacyScale.enabled = false;
    const oldBackdrop = background.getChildByName('ManagementBackdrop');
    if (oldBackdrop) { oldBackdrop.removeFromParent(); oldBackdrop.destroy(); }
    const imageSize = sprite.spriteFrame?.originalSize;
    const imageWidth = imageSize?.width || width;
    const imageHeight = imageSize?.height || height;
    const cover = Math.max(width / imageWidth, height / imageHeight);
    sprite.enabled = true;
    sprite.type = Sprite.Type.SIMPLE;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = new Color(71, 65, 55, 255);
    place(background, 0, 0, imageWidth * cover, imageHeight * cover);
    background.setSiblingIndex(0);
}
