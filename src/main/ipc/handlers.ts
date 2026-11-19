import { ipcMain } from 'electron';
import { isConfigured, getStore } from '../config/store';
import { testConnection } from '../db/connection';
import { usuarioRepo } from '../db/repositories/usuarioRepo';
import { cardapioRepo } from '../db/repositories/cardapioRepo';
import { pedidoRepo } from '../db/repositories/pedidoRepo';
import { pagamentoRepo } from '../db/repositories/pagamentoRepo';
import { empresaRepo } from '../db/repositories/empresaRepo';
import { caixaRepo } from '../db/repositories/caixaRepo';
import { fiscalService } from '../fiscal/fiscalService';
import { printer } from '../printer/thermal';
import { getCachedImage, cacheImageInBackground } from '../utils/imageCache';

export function registerIpcHandlers() {
    // ── Configuração ──
    ipcMain.handle('config:check', () => isConfigured());

    ipcMain.handle('config:save', (_, config) => {
        const s = getStore();
        s.set('db.host', config.dbHost);
        s.set('db.port', config.dbPort ?? 3306);
        s.set('db.user', config.dbUser);
        s.set('db.password', config.dbPassword);
        s.set('db.database', config.dbName ?? 'alesys');
        s.set('chave_secreta', config.chaveSecreta);
        s.set('alesys_url', config.alesysUrl ?? '');
        return true;
    });

    ipcMain.handle('config:testConnection', () => testConnection());

    // ── Autenticação ──
    ipcMain.handle('auth:login', async (_, username: string, senha: string) => {
        try {
            const user = await usuarioRepo.login(username, senha);
            return user ? { success: true, user } : { success: false, error: 'Credenciais inválidas' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // ── Cardápio (com cache de miniaturas) ──
    ipcMain.handle('db:getProducts', async () => {
        try {
            const products = await cardapioRepo.getAtivos();
            let alesysUrl = (getStore().get('alesys_url', '') as string).trim();
            while (alesysUrl.endsWith('/')) {
                alesysUrl = alesysUrl.slice(0, -1);
            }

            const data = products.map((p: any) => {
                const imagePath = typeof p.Imagem === 'string' ? p.Imagem.trim() : '';
                let imagemUrl: string | null = null;

                // CaminhoMiniatura é armazenado como caminho web, ex.: /uploads/pratos/miniaturas/...
                if (imagePath.startsWith('https://') || imagePath.startsWith('http://')) {
                    imagemUrl = imagePath;
                } else if (imagePath && alesysUrl) {
                    imagemUrl = `${alesysUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
                }

                if (imagemUrl) {
                    const cached = getCachedImage(imagemUrl);
                    if (cached) {
                        imagemUrl = cached;
                    } else {
                        cacheImageInBackground(imagemUrl).catch(() => { });
                    }
                }

                return { ...p, Imagem: imagemUrl };
            });

            return { success: true, data };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('db:getCategories', async () => {
        try { return { success: true, data: await cardapioRepo.getCategorias() }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });

    // ── Pedidos ──
    ipcMain.handle('db:createOrder', async (_, data) => {
        try { return { success: true, data: await pedidoRepo.create(data) }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });

    ipcMain.handle('db:addItem', async (_, item) => {
        try { return { success: true, data: await pedidoRepo.addItem(item) }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });

    ipcMain.handle('db:removeItem', async (_, itemId: number, pedidoId: number) => {
        try { await pedidoRepo.removeItem(itemId, pedidoId); return { success: true }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });

    ipcMain.handle('db:getOrderItens', async (_, pedidoId: number) => {
        try { return { success: true, data: await pedidoRepo.getItens(pedidoId) }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });

    ipcMain.handle('db:closeOrder', async (_, pedidoId: number, formaPagamento: string) => {
        try {
            const pedido = await pedidoRepo.getById(pedidoId);
            await pedidoRepo.fechar(pedidoId, null);
            await pagamentoRepo.registrar({
                pedidoId,
                formaPagamento,
                valor: pedido.ValorTotal,
            });
            return { success: true };
        } catch (e: any) { return { success: false, error: e.message }; }
    });

    ipcMain.handle('db:getOpenOrders', async () => {
        try { return { success: true, data: await pedidoRepo.getAbertos() }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });

    // ── Fiscal ──
    ipcMain.handle('fiscal:emit', async (_, pedidoId: number) => {
        return fiscalService.emitir(pedidoId);
    });

    // ── Impressão ──
    ipcMain.handle('printer:cupom', async (_, pedidoId: number) => {
        return printer.printCupom(pedidoId);
    });

    // ── Caixa ──
    ipcMain.handle('db:openCash', async (_, responsavelId: number) => {
        try { return { success: true, data: await caixaRepo.abrirCaixa(responsavelId) }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });

    ipcMain.handle('db:getOpenCash', async () => {
        try { return { success: true, data: await caixaRepo.getAberto() }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });

    // ── Empresa ──
    ipcMain.handle('db:getEmpresa', async () => {
        try { return { success: true, data: await empresaRepo.getDadosEmitente() }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });
}
