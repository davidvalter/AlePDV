import { getPool } from '../connection';

export const cardapioRepo = {
  async getAtivos() {
    const [rows] = await getPool().execute(
      `SELECT
         c.Id,
         c.Nome,
         c.Descricao,
         c.TipoItem,
         c.ProdutoId,
         c.PratoId,
         c.PrecoVenda,
         c.Categoria,
         c.Ativo,
         c.CriadoEm,
         COALESCE(mp.CaminhoMiniatura, mpr.CaminhoMiniatura) AS Imagem,
         COALESCE(p.NCM, pr.NCM) AS NCM,
         COALESCE(p.CFOP, pr.CFOP) AS CFOP,
         COALESCE(p.CSOSN, pr.CSOSN) AS CSOSN,
         COALESCE(p.CEST, pr.CEST) AS CEST,
         COALESCE(p.UnidadeMedida, pr.UnidadeMedida, 'UN') AS UnidadeMedida
       FROM Cardapio c
       LEFT JOIN Produtos p
         ON c.TipoItem = 'produto' AND c.ProdutoId = p.Codigo
       LEFT JOIN Pratos pr
         ON c.TipoItem = 'prato' AND c.PratoId = pr.Id
       LEFT JOIN Midias mp ON mp.Id = p.ImagemId
       LEFT JOIN Midias mpr ON mpr.Id = pr.ImagemId
       WHERE c.Ativo = 1
         AND (
           (c.TipoItem = 'produto' AND p.Ativo = 1 AND p.TipoProduto = 'vendavel')
           OR (c.TipoItem = 'prato' AND pr.Status = 1)
         )
       ORDER BY c.Categoria, c.Nome`
    );
    return rows as any[];
  },

  async getCategorias() {
    const [rows] = await getPool().execute(
      `SELECT DISTINCT c.Categoria
       FROM Cardapio c
       LEFT JOIN Produtos p
         ON c.TipoItem = 'produto' AND c.ProdutoId = p.Codigo
       LEFT JOIN Pratos pr
         ON c.TipoItem = 'prato' AND c.PratoId = pr.Id
       WHERE c.Ativo = 1
         AND c.Categoria IS NOT NULL
         AND (
           (c.TipoItem = 'produto' AND p.Ativo = 1 AND p.TipoProduto = 'vendavel')
           OR (c.TipoItem = 'prato' AND pr.Status = 1)
         )`
    );
    return (rows as any[]).map(r => r.Categoria);
  }
};
