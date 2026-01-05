
export async function fetchAppIcon(baseUrl: string): Promise<string | null> {
    try {
        // HTMLを取得
        const response = await fetch(baseUrl, {
            headers: { 'User-Agent': 'Tobira-Auth-Bot/1.0' },
            cf: { cacheTtl: 3600 }
        });
        if (!response.ok) return null;
        const html = await response.text();
        
        let iconUrl: string | null = null;

        // 1. 優先: sizes="512x512" を持つアイコン
        const sizeMatch = html.match(/<link[^>]+(?:rel=["'](?:apple-touch-icon|icon)["'][^>]*sizes=["']512x512["']|sizes=["']512x512["'][^>]*rel=["'](?:apple-touch-icon|icon)["'])[^>]*href=["']([^"']+)["']/i);
        if (sizeMatch && sizeMatch[1]) {
            iconUrl = sizeMatch[1];
        }

        // 2. 次点: apple-touch-icon (一般的に高解像度)
        if (!iconUrl) {
            const touchMatch = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
            if (touchMatch && touchMatch[1]) iconUrl = touchMatch[1];
        }

        // 3. フォールバック: 通常の favicon
        if (!iconUrl) {
            const favMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
            if (favMatch && favMatch[1]) iconUrl = favMatch[1];
        }

        // URLの正規化 (相対パス対策)
        if (iconUrl) {
            try {
                return new URL(iconUrl, baseUrl).href;
            } catch (e) { return null; }
        }
        
        // 4. 最終手段: /favicon.ico が存在するか確認
        try {
            const defaultFavicon = new URL('/favicon.ico', baseUrl).href;
            const check = await fetch(defaultFavicon, { method: 'HEAD' });
            if (check.ok) return defaultFavicon;
        } catch(e) {}

        return null;
    } catch (e) {
        console.error('Icon fetch failed', e);
        return null;
    }
}
