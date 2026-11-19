import { useState } from 'react';

export function Setup({ onBack }: { onBack: () => void }) {
  const [config, setConfig] = useState({
    dbHost: '',
    dbPort: 3306,
    dbUser: '',
    dbPassword: '',
    dbName: 'alesys',
    chaveSecreta: '',
    alesysUrl: '',
  });
  const [tested, setTested] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await window.pdv.saveConfig(config);
    setSaved(true);
    setTimeout(() => window.location.reload(), 800);
  };

  const handleTest = async () => {
    await window.pdv.saveConfig(config);
    const ok = await window.pdv.testConnection();
    setTested(ok);
  };

  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
            <span className="text-2xl">⚙️</span>
          </div>
          <h1 className="text-2xl font-bold text-emerald-50 mb-1">Configuração Inicial</h1>
          <p className="text-emerald-400 text-sm">Conecte o PDV ao banco de dados</p>
        </div>

        {/* Card principal */}
        <div className="bg-snow-50 rounded-3xl shadow-2xl p-8 max-h-[70vh] overflow-y-auto">
          {/* Seção Banco de Dados */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-emerald-500 rounded-full" />
              <h2 className="text-sm font-bold text-charcoal-800 uppercase tracking-wide">
                Banco de Dados
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-charcoal-700 text-xs font-semibold mb-1.5">
                  Host
                </label>
                <input
                  type="text"
                  value={config.dbHost}
                  onChange={(e) => setConfig({ ...config, dbHost: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-snow-200 bg-snow-50 text-charcoal-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-sm"
                  placeholder="alesys.alecriminteligente.com.br"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-charcoal-700 text-xs font-semibold mb-1.5">
                    Porta
                  </label>
                  <input
                    type="number"
                    value={config.dbPort}
                    onChange={(e) => setConfig({ ...config, dbPort: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-snow-200 bg-snow-50 text-charcoal-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-700 text-xs font-semibold mb-1.5">
                    Banco
                  </label>
                  <input
                    type="text"
                    value={config.dbName}
                    onChange={(e) => setConfig({ ...config, dbName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-snow-200 bg-snow-50 text-charcoal-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-charcoal-700 text-xs font-semibold mb-1.5">
                  Usuário
                </label>
                <input
                  type="text"
                  value={config.dbUser}
                  onChange={(e) => setConfig({ ...config, dbUser: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-snow-200 bg-snow-50 text-charcoal-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-charcoal-700 text-xs font-semibold mb-1.5">
                  Senha
                </label>
                <input
                  type="password"
                  value={config.dbPassword}
                  onChange={(e) => setConfig({ ...config, dbPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-snow-200 bg-snow-50 text-charcoal-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-snow-200 my-6" />

          {/* Seção ALESYS URL */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-emerald-500 rounded-full" />
              <h2 className="text-sm font-bold text-charcoal-800 uppercase tracking-wide">
                Configurações herdadas do Alesys
              </h2>
            </div>

            <div>
              <label className="block text-charcoal-700 text-xs font-semibold mb-1.5">
                URL base do ALESYS
              </label>
              <input
                type="text"
                value={config.alesysUrl}
                onChange={(e) => setConfig({ ...config, alesysUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-snow-200 bg-snow-50 text-charcoal-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-sm"
                placeholder="https://alesys.alecriminteligente.com.br"
              />
              <p className="text-charcoal-400 text-xs mt-1.5">
                As miniaturas são servidas pelo ALESYS em <code className="text-emerald-600">/uploads/produtos/miniaturas/</code> e <code className="text-emerald-600">/uploads/pratos/miniaturas/</code>.
              </p>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-snow-200 my-6" />

          {/* Seção Segurança */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-emerald-500 rounded-full" />
              <h2 className="text-sm font-bold text-charcoal-800 uppercase tracking-wide">
                Segurança
              </h2>
            </div>

            <div>
              <label className="block text-charcoal-700 text-xs font-semibold mb-1.5">
                Chave Secreta (HMAC)
              </label>
              <input
                type="password"
                value={config.chaveSecreta}
                onChange={(e) => setConfig({ ...config, chaveSecreta: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-snow-200 bg-snow-50 text-charcoal-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-sm"
                placeholder="CHAVE_SECRETA do segredos.php"
              />
              <p className="text-charcoal-400 text-xs mt-1.5">
                Mesma chave usada no arquivo <code className="text-emerald-600">segredos.php</code> do ALESYS
              </p>
            </div>
          </div>

          {/* Status de teste */}
          {tested === true && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-emerald-700 text-sm font-semibold flex items-center gap-2">
                <span>✓</span> Conexão bem-sucedida!
              </p>
            </div>
          )}
          {tested === false && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm font-semibold flex items-center gap-2">
                <span>✕</span> Falha na conexão. Verifique os dados.
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="px-5 py-3 rounded-xl border border-snow-300 text-charcoal-600 font-semibold text-sm hover:bg-snow-100 transition-all"
            >
              ← Voltar
            </button>
            <button
              onClick={handleTest}
              className="flex-1 py-3 rounded-xl border border-emerald-500 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-all"
            >
              Testar Conexão
            </button>
            <button
              onClick={handleSave}
              disabled={saved}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
            >
              {saved ? 'Salvo! ✓' : 'Salvar e Iniciar'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-emerald-500/60 text-xs">
          GOUVTEC INFORMÁTICA
        </p>
      </div>
    </div>
  );
}