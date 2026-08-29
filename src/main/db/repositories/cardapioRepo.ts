import { getPool } from '../connection';

export const cardapioRepo = {
  async getAtivos() {
    const [rows] = await getPool().execute(
      `SELECT c.*, p.NCM, p.CFOP FROM Cardapio c 
       LEFT JOIN Produtos p ON c.ProdutoId = p.Codigo 
       WHERE c.Ativo = 1 ORDER BY c.Categoria, c.Nome`
    );
    return rows as any[];
  },
  async getCategorias() {
    const [rows] = await getPool().execute(
      `SELECT DISTINCT Categoria FROM Cardapio WHERE Ativo = 1 AND Categoria IS NOT NULL`
    );
    return (rows as any[]).map(r => r.Categoria);
  }
};