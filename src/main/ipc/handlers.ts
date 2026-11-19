import { ipcMain, shell } from 'electron';
import { dirname } from 'path';
import { getLogFilePath, logger } from '../utils/logger';
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

    ipcMain.handle('config:testConnection', async () => {
        logger.info('config.database_test.started');
        const success = await testConnection();
        logger.info('config.database_test.completed', { success });
        return success;
    });

    // ── Autenticação ──
    ipcMain.handle('auth:login', async (_, username: string, senha: string) => {
        try {
            const user = await usuarioRepo.login(username, senha);
            logger.info('auth.login.completed', { success: Boolean(user) });
            return user ? { success: true, user } : { success: false, error: 'Credenciais inválidas' };
        } catch (error: any) {
            logger.error('auth.login.failed', error);
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

            logger.info('catalog.load.completed', { itemCount: data.length, imageCount: data.filter((item: any) => Boolean(item.Imagem)).length });
            return { success: true, data };
        } catch (e: any) {
            logger.error('catalog.load.failed', e);
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('db:getCategories', async () => {
        try { return { success: true, data: await cardapioRepo.getCategorias() }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });

    // ── Pedidos ──
    ipcMain.handle('db:createOrder', async (_, data) => {
        logger.info('order.create.started', { tipo: data.tipo, responsavelId: data.responsavelId });
        try {
            const pedidoId = await pedidoRepo.create(data);
            logger.info('order.create.completed', { pedidoId, tipo: data.tipo });
            return { success: true, data: pedidoId };
        } catch (error: any) {
            logger.error('order.create.failed', error, { tipo: data.tipo });
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('db:addItem', async (_, item) => {
        logger.info('order.item_add.started', { pedidoId: item.pedidoId, cardapioId: item.cardapioId, quantidade: item.quantidade });
        try {
            const itemId = await pedidoRepo.addItem(item);
            logger.info('order.item_add.completed', { pedidoId: item.pedidoId, itemId });
            return { success: true, data: itemId };
        } catch (error: any) {
            logger.error('order.item_add.failed', error, { pedidoId: item.pedidoId, cardapioId: item.cardapioId });
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('db:removeItem', async (_, itemId: number, pedidoId: number) => {
        logger.info('order.item_remove.started', { pedidoId, itemId });
        try {
            await pedidoRepo.removeItem(itemId, pedidoId);
            logger.info('order.item_remove.completed', { pedidoId, itemId });
            return { success: true };
        } catch (error: any) {
            logger.error('order.item_remove.failed', error, { pedidoId, itemId });
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('db:getOrderItens', async (_, pedidoId: number) => {
        try { return { success: true, data: await pedidoRepo.getItens(pedidoId) }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });

    ipcMain.handle('db:closeOrder', async (_, pedidoId: number, formaPagamento: string) => {
        logger.info('order.payment.started', { pedidoId, formaPagamento });
        try {
            const pedido = await pedidoRepo.getById(pedidoId);
            if (!pedido) {
                throw new Error(`Pedido #${pedidoId} não encontrado para finalização.`);
            }

            await pedidoRepo.fechar(pedidoId, null);
            await pagamentoRepo.registrar({
                pedidoId,
                formaPagamento,
                valor: Number(pedido.ValorTotal),
            });
            logger.info('order.payment.completed', {
                pedidoId,
                formaPagamento,
                valor: Number(pedido.ValorTotal),
            });
            return { success: true };
        } catch (error: any) {
            logger.error('order.payment.failed', error, { pedidoId, formaPagamento });
            return { success: false, error: error?.message ?? 'Erro ao registrar pagamento.' };
        }
    });

    ipcMain.handle('system:openLogFile', async () => {
        const filePath = getLogFilePath();
        const directory = dirname(filePath);
        logger.info('logs.open_requested', { filePath });
        const error = await shell.openPath(directory);
        if (error) {
            logger.error('logs.open_failed', new Error(error), { filePath, directory });
            return { success: false, path: filePath, error };
        }
        return { success: true, path: filePath };
    });

    ipcMain.handle('db:getOpenOrders', async () => {
        try { return { success: true, data: await pedidoRepo.getAbertos() }; }
        catch (e: any) { return { success: false, error: e.message }; }
    });

    // ── Fiscal ──
    ipcMain.handle('fiscal:getEnvironment', async () => {
        try {
            const { ambiente } = await empresaRepo.getAlenfeConfig();
            return { success: true, ambiente };
        } catch (error: any) {
            logger.error('fiscal.environment.read_failed', error);
            return { success: false, error: error?.message ?? 'Não foi possível ler ALENFE_AMBIENTE.' };
        }
    });

    ipcMain.handle('fiscal:emit', async (_, pedidoId: number, documento?: string) => {
        return fiscalService.emitir(pedidoId, documento);
    });

    // ── Impressão ──
    ipcMain.handle('printer:cupom', async (_, pedidoId: number) => {
        logger.info('printer.cupom.started', { pedidoId });
        const result = await printer.printCupom(pedidoId);
        if (result.success) logger.info('printer.cupom.completed', { pedidoId });
        else logger.warn('printer.cupom.failed', { pedidoId, error: result.error });
        return result;
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
