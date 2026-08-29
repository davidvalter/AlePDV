import { app } from 'electron';
import { join } from 'path';
import fs from 'fs';
import axios from 'axios';

let cacheDir: string | null = null;

export function getCacheDir(): string {
    if (!cacheDir) {
        cacheDir = join(app.getPath('userData'), 'image-cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
    }
    return cacheDir;
}

/**
 * Verifica se a imagem já está em cache local.
 * Se sim, retorna como data URL (base64) para uso imediato no renderer.
 */
export function getCachedImage(imageUrl: string): string | null {
    try {
        const filename = imageUrl.split('/').pop();
        if (!filename) return null;

        const localPath = join(getCacheDir(), filename);
        if (!fs.existsSync(localPath)) return null;

        const buffer = fs.readFileSync(localPath);
        const ext = filename.split('.').pop()?.toLowerCase() || 'png';
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'jpeg'
            : ext === 'webp' ? 'webp'
                : ext === 'gif' ? 'gif'
                    : 'png';
        return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
    } catch {
        return null;
    }
}

/**
 * Baixa a imagem em background e salva no cache local.
 * Não bloqueia o fluxo — na próxima vez que os produtos carregarem,
 * a imagem já estará em cache e será servida instantaneamente.
 */
export async function cacheImageInBackground(imageUrl: string): Promise<void> {
    try {
        const filename = imageUrl.split('/').pop();
        if (!filename) return;

        const localPath = join(getCacheDir(), filename);
        if (fs.existsSync(localPath)) return; // já em cache

        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
        });

        fs.writeFileSync(localPath, Buffer.from(response.data));
    } catch {
        // Falha silenciosa — tentará novamente na próxima carga
    }
}