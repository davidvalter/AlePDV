import { getPool, getConnection } from '../connection';

export const fiscalRepo = {
    async criarRegistro(pedidoId: number, payloadEnvio: object): Promise<number> {
        const [result] = await getPool().execute(
            `INSERT INTO VendasNFCE (PedidoId, Status, PayloadEnvio, Tentativas, CriadoEm, AtualizadoEm)
       VALUES (?, 'PENDENTE', ?, 0, NOW(), NOW())`,
            [pedidoId, JSON.stringify(payloadEnvio)]
        );
        return (result as any).insertId;
    },

    async marcarEnviado(vendaId: number, alenfeId: number): Promise<void> {
        await getPool().execute(
            `UPDATE VendasNFCE SET Status = 'ENVIADA', Protocolo = ?, AtualizadoEm = NOW() WHERE Id = ?`,
            [`ALENFE:${alenfeId}`, vendaId]
        );
    },

    async atualizarStatus(vendaId: number, dados: {
        status: string;
        chaveAcesso?: string | null;
        protocolo?: string | null;
        xmlProc?: string | null;
        motivoRejeicao?: string | null;
    }): Promise<void> {
        const conn = await getConnection();
        try {
            await conn.beginTransaction();
            await conn.execute(
                `UPDATE VendasNFCE
         SET Status = ?, ChaveAcesso = ?, Protocolo = ?, XmlProc = ?, MotivoRejeicao = ?, AtualizadoEm = NOW()
         WHERE Id = ?`,
                [dados.status, dados.chaveAcesso ?? null, dados.protocolo ?? null,
                dados.xmlProc ?? null, dados.motivoRejeicao ?? null, vendaId]
            );

            const [venda] = await conn.execute(
                `SELECT PedidoId FROM VendasNFCE WHERE Id = ?`, [vendaId]
            );
            const pedidoId = (venda as any[])[0]?.PedidoId;

            if (pedidoId) {
                const statusNFe = (dados.status === 'AUTORIZADA' || dados.status === 'CONTINGENCIA') ? 'emitida'
                    : (dados.status === 'REJEITADA' || dados.status === 'ERRO') ? 'erro' : 'emitindo';
                await conn.execute(
                    `UPDATE Pedidos SET StatusNFe = ?, ChaveNFe = ?, ProtocoloNFe = ?,
           DataEmissaoNFe = CASE WHEN ? = 'AUTORIZADA' THEN NOW() ELSE DataEmissaoNFe END
           WHERE Id = ?`,
                    [statusNFe, dados.chaveAcesso ?? null, dados.protocolo ?? null, dados.status, pedidoId]
                );
            }

            await conn.commit();
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    },

    async getByPedido(pedidoId: number): Promise<any | null> {
        const [rows] = await getPool().execute(
            `SELECT * FROM VendasNFCE WHERE PedidoId = ? ORDER BY Id DESC LIMIT 1`,
            [pedidoId]
        );
        return (rows as any[])[0] ?? null;
    },

    async getPendentes(): Promise<any[]> {
        const [rows] = await getPool().execute(
            `SELECT * FROM VendasNFCE WHERE Status IN ('PENDENTE', 'ENVIADA') AND Tentativas < 5 ORDER BY CriadoEm ASC`
        );
        return rows as any[];
    },
};