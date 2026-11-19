import { getPool, getConnection } from '../connection';

export const pedidoRepo = {
  async create(data: {
    tipo: string;
    mesa: string | null;
    cliente: string | null;
    responsavelId: number;
    observacoes?: string;
  }): Promise<number> {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        `INSERT INTO Pedidos (Tipo, Mesa, Cliente, ResponsavelId, Observacoes, Status, StatusNFe, DataAbertura, ValorTotal)
         VALUES (?, ?, ?, ?, ?, 'aberto', 'pendente', NOW(), 0)`,
        [data.tipo, data.mesa, data.cliente, data.responsavelId, data.observacoes ?? null]
      );
      await conn.commit();
      return (result as any).insertId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async addItem(item: {
    pedidoId: number;
    cardapioId: number;
    quantidade: number;
    valorUnitario: number;
  }): Promise<number> {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        `INSERT INTO ItensPedido (PedidoId, CardapioId, Quantidade, ValorUnitario, Status)
         VALUES (?, ?, ?, ?, 'pendente')`,
        [item.pedidoId, item.cardapioId, item.quantidade, item.valorUnitario]
      );
      await conn.execute(
        `UPDATE Pedidos SET ValorTotal = (
           SELECT COALESCE(SUM(Quantidade * ValorUnitario), 0) FROM ItensPedido
           WHERE PedidoId = ? AND Status != 'cancelado'
         ) WHERE Id = ?`,
        [item.pedidoId, item.pedidoId]
      );
      await conn.commit();
      return (result as any).insertId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async removeItem(itemId: number, pedidoId: number): Promise<void> {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(`UPDATE ItensPedido SET Status = 'cancelado' WHERE Id = ?`, [itemId]);
      await conn.execute(
        `UPDATE Pedidos SET ValorTotal = (
           SELECT COALESCE(SUM(Quantidade * ValorUnitario), 0) FROM ItensPedido
           WHERE PedidoId = ? AND Status != 'cancelado'
         ) WHERE Id = ?`,
        [pedidoId, pedidoId]
      );
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async getItens(pedidoId: number): Promise<any[]> {
    const [rows] = await getPool().execute(
      `SELECT
         ip.*,
         c.Nome AS CardapioNome,
         c.PrecoVenda,
         COALESCE(p.NCM, pr.NCM) AS NCM,
         COALESCE(p.CFOP, pr.CFOP) AS CFOP,
         COALESCE(p.CSOSN, pr.CSOSN) AS CSOSN,
         COALESCE(p.CEST, pr.CEST) AS CEST,
         COALESCE(p.UnidadeMedida, pr.UnidadeMedida, 'UN') AS UnidadeMedida
       FROM ItensPedido ip
       LEFT JOIN Cardapio c ON ip.CardapioId = c.Id
       LEFT JOIN Produtos p
         ON c.TipoItem = 'produto' AND c.ProdutoId = p.Codigo
       LEFT JOIN Pratos pr
         ON c.TipoItem = 'prato' AND c.PratoId = pr.Id
       WHERE ip.PedidoId = ? AND ip.Status != 'cancelado'
       ORDER BY ip.Id`,
      [pedidoId]
    );
    return rows as any[];
  },

  async getById(pedidoId: number): Promise<any | null> {
    const [rows] = await getPool().execute(
      `SELECT * FROM Pedidos WHERE Id = ?`,
      [pedidoId]
    );
    return (rows as any[])[0] ?? null;
  },

  async fechar(pedidoId: number, formaPagamentoId: number | null): Promise<void> {
    await getPool().execute(
      `UPDATE Pedidos SET Status = 'fechado', DataFechamento = NOW(), FormaPagamentoId = ? WHERE Id = ?`,
      [formaPagamentoId, pedidoId]
    );
  },

  async getAbertos(): Promise<any[]> {
    const [rows] = await getPool().execute(
      `SELECT p.*, u.NomeCompleto as ResponsavelNome
       FROM Pedidos p
       INNER JOIN Usuarios u ON p.ResponsavelId = u.Id
       WHERE p.Status = 'aberto' ORDER BY p.DataAbertura DESC`
    );
    return rows as any[];
  },

  async getAbertosByTipo(tipo: string): Promise<any[]> {
    const [rows] = await getPool().execute(
      `SELECT p.*, u.NomeCompleto as ResponsavelNome
       FROM Pedidos p
       INNER JOIN Usuarios u ON p.ResponsavelId = u.Id
       WHERE p.Status = 'aberto' AND p.Tipo = ? ORDER BY p.DataAbertura DESC`,
      [tipo]
    );
    return rows as any[];
  },

  async isMesaOcupada(mesa: string): Promise<boolean> {
    const [rows] = await getPool().execute(
      `SELECT Id FROM Pedidos WHERE Mesa = ? AND Status = 'aberto' LIMIT 1`,
      [mesa]
    );
    return (rows as any[]).length > 0;
  },
};