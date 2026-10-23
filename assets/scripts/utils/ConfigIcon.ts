/** 配置表 Icon 使用 resources 相对路径；不根据业务 ID 拼接文件名。 */
export function getConfigIconPath(icon: unknown): string {
    if (typeof icon !== 'string') return '';
    const base = icon.trim()
        .replace(/^db:\/\/assets\/resources\//, '')
        .replace(/^assets\/resources\//, '')
        .replace(/\/spriteFrame$/i, '')
        .replace(/\.(png|jpg|jpeg|webp)$/i, '');
    if (!base || base.startsWith('/') || base.includes(':') || base.includes('\\') ||
        base.split('/').some(part => !part || part === '..' || part === '.')) return '';
    return `${base}/spriteFrame`;
}
