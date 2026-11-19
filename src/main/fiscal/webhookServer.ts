import express from 'express';
import { BrowserWindow } from 'electron';
import { fiscalRepo } from '../db/repositories/fiscalRepo';
import { getPool } from '../db/connection';
import { logger } from '../utils/logger';

export function startWebhookServer(port: number) {
    const app = express();
    app.use(express.json({ limit: '10mb' }));

    app.post('/alenfe/callback', async (req, res) => {
        const body = req.body ?? {};
        const alenfeId = Number(body.nfceId ?? body.nfce_id);
        const protocolo = body.protocolo ?? null;
        const pedidoId = Number(body.pedido_id ?? body.pedidoId) || undefined;
        const evento = String(body.evento ?? '');
        const statusRecebido = String(body.status ?? '').toUpperCase();
        const status = ['AUTORIZADA', 'REJEITADA', 'ERRO', 'CONTINGENCIA'].includes(statusRecebido)
            ? statusRecebido
            : evento === 'NFC_E_AUTORIZADA'
                ? 'AUTORIZADA'
                : evento === 'NFC_E_REJEITADA'
                    ? 'REJEITADA'
                    : evento.startsWith('NFC_E_ERRO')
                        ? 'ERRO'
                        : evento === 'NFC_E_CONTINGENCIA'
                            ? 'CONTINGENCIA'
                            : '';

        const chaveAcesso = body.chaveAcesso ?? body.chave_acesso ?? null;
        const xmlProc = body.xmlProc ?? body.xml ?? null;
        const motivoRejeicao = body.motivoRejeicao ?? body.motivo_rejeicao ?? body.motivo ?? null;

        logger.info('fiscal.webhook.received', {
            alenfeId: Number.isSafeInteger(alenfeId) ? alenfeId : undefined,
            protocolo,
            status,
            pedidoId,
            rejectionReason: status === 'REJEITADA' && typeof motivoRejeicao === 'string'
                ? motivoRejeicao.slice(0, 500)
                : undefined,
        });

        try {
            if (!status) {
                logger.warn('fiscal.webhook.invalid_status', { evento, statusRecebido });
                return res.status(400).send({ error: 'Evento/status fiscal não reconhecido' });
            }

            let venda: any;
            if (Number.isSafeInteger(alenfeId) && alenfeId > 0) {
                const [rows] = await getPool().execute(
                    `SELECT * FROM VendasNFCE WHERE Protocolo = ? ORDER BY Id DESC LIMIT 1`,
                    [`ALENFE:${alenfeId}`]
                );
                venda = (rows as any[])[0];
            }

            if (!venda && pedidoId) {
                venda = await fiscalRepo.getByPedido(pedidoId);
            }

            if (!venda && protocolo) {
                const [rows] = await getPool().execute(
                    `SELECT * FROM VendasNFCE WHERE Protocolo = ? OR Id = ? ORDER BY Id DESC LIMIT 1`,
                    [protocolo, protocolo]
                );
                venda = (rows as any[])[0];
            }

            if (!venda) {
                logger.warn('fiscal.webhook.sale_not_found', { alenfeId, protocolo, pedidoId });
                return res.sendStatus(404);
            }

            await fiscalRepo.atualizarStatus(venda.Id, {
                status,
                chaveAcesso,
                protocolo,
                xmlProc,
                motivoRejeicao,
            });

            const win = BrowserWindow.getAllWindows()[0];
            if (win && !win.isDestroyed()) {
                win.webContents.send('fiscal:callback', {
                    pedidoId: venda.PedidoId,
                    status,
                    chave_acesso: chaveAcesso,
                    motivo_rejeicao: motivoRejeicao,
                });
            }

            logger.info('fiscal.webhook.status_updated', {
                pedidoId: venda.PedidoId,
                alenfeId,
                status,
                protocolo,
            });
            res.sendStatus(200);
        } catch (error) {
            logger.error('fiscal.webhook.failed', error, { alenfeId, protocolo, status, pedidoId });
            res.sendStatus(500);
        }
    });

    app.get('/health', (_req, res) => res.json({ ok: true }));

    app.listen(port, '0.0.0.0', () => {
        logger.info('fiscal.webhook.listening', { port });
    });
}
