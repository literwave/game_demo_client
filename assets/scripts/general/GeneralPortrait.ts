/** 武将列表、编队、奖励和配置工具共用的画像资源目录。 */
export const GENERAL_PORTRAIT_DIRECTORY = 'ui/hero';

/** Icon 是相对于 resources 的资源路径。 */
export function getGeneralPortraitPath(icon?: string): string {
    if (!icon || !icon.trim()) return '';
    const path = icon.trim().replace(/\/spriteFrame$/i, '').replace(/\.(png|jpe?g|webp)$/i, '');
    return `${path}/spriteFrame`;
}
