import express from 'express';
import { BrowserWindow } from 'electron';
import { fiscalRepo } from '../db/repositories/fiscalRepo';

export function startWebhookServer(port: number) {
    const app = express();
    app.use(express.json({ limit: '10mb' }));

    app.post('/alenfe/callback', async (req, res) => {
        const { protocolo, status, chave_acesso, xml, motivo_rejeicao, pedido_id } = req.body;

        try {
            // Busca a venda pelo protocolo ou pedido_id
            let venda;
            if (protocolo) {
                const [rows] = await (await import('../db/connection')).getPool().execute(
                    `SELECT * FROM VendasNFCE WHERE Protocolo = ? OR Id = ? ORDER BY Id DESC LIMIT 1`,
                    [protocolo, protocolo]
                );
                venda = (rows as any[])[0];
            } else if (pedido_id) {
                venda = await fiscalRepo.getByPedido(pedido_id);
            }

            if (!venda) {
                console.error('Webhook: venda não encontrada', { protocolo, pedido_id });
                return res.sendStatus(404);
            }

            // Atualiza o status fiscal
            await fiscalRepo.atualizarStatus(venda.Id, {
                status,
                chaveAcesso: chave_acesso ?? null,
                protocolo: protocolo ?? null,
                xmlProc: xml ?? null,
                motivoRejeicao: motivo_rejeicao ?? null,
            });

            // Notifica a UI
            const win = BrowserWindow.getAllWindows()[0];
            if (win && !win.isDestroyed()) {
                win.webContents.send('fiscal:callback', {
                    pedidoId: venda.PedidoId,
                    status,
                    chave_acesso,
                    motivo_rejeicao,
                });
            }

            res.sendStatus(200);
        } catch (error) {
            console.error('Erro no webhook ALENFE:', error);
            res.sendStatus(500);
        }
    });

    // Health check
    app.get('/health', (_req, res) => res.json({ ok: true }));

    app.listen(port, '0.0.0.0', () => {
        console.log(`Webhook ALENFE escutando na porta ${port}`);
    });
}