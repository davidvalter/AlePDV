import { getPool } from '../connection';

export const empresaRepo = {
  async getDadosEmitente(): Promise<any | null> {
    const [rows] = await getPool().execute(
      `SELECT * FROM Empresa WHERE Ativo = 1 LIMIT 1`
    );
    return (rows as any[])[0] ?? null;
  },

  async getConfig(chave: string): Promise<string | null> {
    const [rows] = await getPool().execute(
      `SELECT Valor FROM Configuracoes WHERE Chave = ?`,
      [chave]
    );
    return (rows as any[])[0]?.Valor ?? null;
  },

  async getAlenfeConfig(): Promise<{ url: string; apiKey: string }> {
    const [rows] = await getPool().execute(
      `SELECT Chave, Valor FROM Configuracoes WHERE LOWER(Chave) IN ('alenfe_url', 'alenfe_api_key')`
    );
    const config: Record<string, string> = {};
    (rows as any[]).forEach((r) => {
      const chave = String(r.Chave ?? '').trim().toLowerCase();
      const valor = String(r.Valor ?? '').trim();
      if (chave && valor) config[chave] = valor;
    });
    return {
      url: config.alenfe_url || 'http://localhost:3001',
      apiKey: config.alenfe_api_key || '',
    };
  },
};
