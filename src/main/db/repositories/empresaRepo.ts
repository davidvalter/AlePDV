import { getPool } from '../connection';

export type AlenfeConfig = {
  url: string;
  apiKey: string;
  ambiente: string | null;
  cpfPadrao: string;
  consumidorPadrao: string;
  nomeHomologacao: string;
  descricaoHomologacao: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
};

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

  async getAlenfeConfig(): Promise<AlenfeConfig> {
    const chaves = [
      'alenfe_url',
      'alenfe_api_key',
      'alenfe_ambiente',
      'alenfe_cpf_padrao',
      'alenfe_consumidor_padrao',
      'alenfe_nome_homologacao',
      'alenfe_descricao_homologacao',
      'alenfe_endereco_logradouro',
      'alenfe_endereco_numero',
      'alenfe_endereco_bairro',
      'alenfe_endereco_cidade',
      'alenfe_endereco_uf',
      'alenfe_endereco_cep',
    ];
    const [rows] = await getPool().execute(
      `SELECT Chave, Valor FROM Configuracoes WHERE LOWER(TRIM(Chave)) IN (${chaves.map(() => '?').join(', ')})`,
      chaves
    );
    const config: Record<string, string> = {};
    (rows as any[]).forEach((row) => {
      const chave = String(row.Chave ?? '').trim().toLowerCase();
      if (chave) config[chave] = String(row.Valor ?? '').trim();
    });

    return {
      url: (config.alenfe_url || 'http://localhost:3001').replace(/\/+$/, ''),
      apiKey: config.alenfe_api_key || '',
      ambiente: config.alenfe_ambiente || null,
      cpfPadrao: (config.alenfe_cpf_padrao || '').replace(/\D/g, ''),
      consumidorPadrao: config.alenfe_consumidor_padrao || 'CONSUMIDOR',
      nomeHomologacao: config.alenfe_nome_homologacao || 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
      descricaoHomologacao: config.alenfe_descricao_homologacao || 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
      endereco: {
        logradouro: config.alenfe_endereco_logradouro || 'NAO INFORMADO',
        numero: config.alenfe_endereco_numero || '0',
        bairro: config.alenfe_endereco_bairro || 'NAO INFORMADO',
        cidade: config.alenfe_endereco_cidade || 'NAO INFORMADO',
        uf: (config.alenfe_endereco_uf || 'DF').toUpperCase(),
        cep: (config.alenfe_endereco_cep || '00000000').replace(/\D/g, ''),
      },
    };
  },
};