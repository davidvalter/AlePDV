// src/main/db/repositories/pagamentoRepo.ts
import { getPool } from '../connection';

export const pagamentoRepo = {
    async registrar(pagamento: {
        pedidoId: number;
        formaPagamento: string;
        valor: number;
        troco?: number;
        dadosAdicionais?: string;
    }): Promise<number> {
        const [result] = await getPool().execute(
            `INSERT INTO Pagamentos (PedidoId, FormaPagamento, Valor, Troco, Status, DataHora)
       VALUES (?, ?, ?, ?, 'confirmado', NOW())`,
            [pagamento.pedidoId, pagamento.formaPagamento, pagamento.valor, pagamento.troco ?? 0]
        );
        return (result as any).insertId;
    },

    async getByPedido(pedidoId: number): Promise<any[]> {
        const [rows] = await getPool().execute(
            `SELECT * FROM Pagamentos WHERE PedidoId = ? ORDER BY DataHora`,
            [pedidoId]
        );
        return rows as any[];
    },
};