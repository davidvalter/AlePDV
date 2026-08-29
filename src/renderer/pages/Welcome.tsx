export function Welcome({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Logo e título */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-3xl mb-6 shadow-2xl shadow-emerald-500/30">
            <span className="text-4xl">🌿</span>
          </div>
          <h1 className="text-4xl font-bold text-emerald-50 tracking-tight mb-2">
            Alecrim PDV
          </h1>
          <p className="text-emerald-300 text-lg">
            Sistema de Ponto de Venda inteligente
          </p>
        </div>

        {/* Descrição */}
        <div className="bg-emerald-800/40 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-emerald-700/50">
          <p className="text-emerald-100 text-center leading-relaxed text-lg">
            Um sistema moderno e ágil para gestão de pedidos, pagamentos
            e emissão fiscal NFC-e, projetado para agilizar o seu atendimento
            com a simplicidade de um aplicativo de delivery.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-700/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🛒</span>
            </div>
            <p className="text-emerald-200 text-sm font-semibold">Pedidos rápidos</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-700/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🧾</span>
            </div>
            <p className="text-emerald-200 text-sm font-semibold">NFC-e automática</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-700/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-emerald-200 text-sm font-semibold">Pagamentos integrados</p>
          </div>
        </div>

        {/* Botão avançar */}
        <button
          onClick={onAdvance}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-lg transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-400/40 hover:scale-[1.02]"
        >
          Avançar para configuração →
        </button>

        {/* Crédito */}
        <div className="text-center mt-8">
          <p className="text-emerald-400 text-sm">
            Desenvolvido por{' '}
            <span className="font-bold text-emerald-300">GOUVTEC INFORMÁTICA</span>
          </p>
        </div>
      </div>
    </div>
  );
}