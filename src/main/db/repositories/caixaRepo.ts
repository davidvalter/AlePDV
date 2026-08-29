import { getPool, getConnection } from '../connection';

export const caixaRepo = {
    async abrirCaixa(responsavelId: number): Promise<number> {
        const dataStr = new Date().toISOString().slice(0, 10);
        const [existing] = await getPool().execute(
            `SELECT Id FROM FechamentosCaixa WHERE Data = ? AND Status = 'aberto'`,
            [dataStr]
        );
        if ((existing as any[]).length > 0) {
            throw new Error('Já existe um caixa aberto para esta data');
        }
        const [result] = await getPool().execute(
            `INSERT INTO FechamentosCaixa (Data, ResponsavelId, Status, ValorTotal)
       VALUES (?, ?, 'aberto', 0)`,
            [dataStr, responsavelId]
        );
        return (result as any).insertId;
    },

    async fecharCaixa(
        fechamentoId: number,
        itens: { operadora: string; meioPagamento: string; valor: number }[]
    ): Promise<void> {
        const conn = await getConnection();
        try {
            await conn.beginTransaction();
            for (const item of itens) {
                await conn.execute(
                    `INSERT INTO FechamentosCaixaItens (FechamentoId, Operadora, MeioPagamento, Valor)
           VALUES (?, ?, ?, ?)`,
                    [fechamentoId, item.operadora, item.meioPagamento, item.valor]
                );
            }
            await conn.execute(
                `UPDATE FechamentosCaixa
         SET ValorTotal = (
           SELECT COALESCE(SUM(Valor), 0) FROM FechamentosCaixaItens WHERE FechamentoId = ?
         ), Status = 'fechado' WHERE Id = ?`,
                [fechamentoId, fechamentoId]
            );
            await conn.commit();
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    },

    async getAberto(): Promise<any | null> {
        const [rows] = await getPool().execute(
            `SELECT * FROM FechamentosCaixa WHERE Status = 'aberto' ORDER BY Data DESC LIMIT 1`
        );
        return (rows as any[])[0] ?? null;
    },
};