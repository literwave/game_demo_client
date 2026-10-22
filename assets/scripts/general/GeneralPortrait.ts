/** 武将列表、编队、奖励和配置工具共用的画像资源目录。 */
export const GENERAL_PORTRAIT_DIRECTORY = 'ui/hero';

export function getGeneralPortraitPath(heroId: number | string, resource?: string): string {
    const filename = resource && resource.trim() ? resource.trim() : `card_${heroId}`;
    const name = filename.replace(/\.(png|jpe?g|webp)$/i, '');
    return `${GENERAL_PORTRAIT_DIRECTORY}/${name}/spriteFrame`;
}
