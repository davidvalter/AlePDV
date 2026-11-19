import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { PosTerminal } from './PosTerminal';

export function Dashboard({ onReconfig }: { onReconfig: () => void }) {
  const { user, logout } = useAuthStore();
  const [view, setView] = useState<'pos' | 'orders'>('pos');

  return (
    <div className="flex h-screen bg-snow-50">
      {/* Sidebar */}
      <div className="w-20 bg-emerald-950 flex flex-col items-center py-6 gap-4">
        <div className="text-2xl mb-2">🌿</div>

        <button
          onClick={() => setView('pos')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
            view === 'pos'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-emerald-500 hover:bg-emerald-900'
          }`}
          title="PDV"
        >
          🛒
        </button>

        <button
          onClick={() => setView('orders')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
            view === 'orders'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-emerald-500 hover:bg-emerald-900'
          }`}
          title="Pedidos"
        >
          📋
        </button>

        <div className="flex-1" />

        {/* Botão de reconfiguração */}
        <button
          onClick={onReconfig}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl text-emerald-500 hover:bg-emerald-900 hover:text-emerald-300 transition-all"
          title="Reconfigurar sistema"
        >
          ⚙️
        </button>

        <button
          onClick={async () => {
            const result = await window.pdv.openLogFile();
            if (!result.success) {
              window.alert(result.error || 'Não foi possível abrir o arquivo de log.');
            }
          }}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl text-emerald-500 hover:bg-emerald-900 hover:text-emerald-300 transition-all"
          title="Abrir log para diagnóstico"
          aria-label="Abrir log para diagnóstico"
        >
          📄
        </button>

        {/* Info do operador */}
        <div className="text-emerald-300 text-[10px] text-center px-1 leading-tight">
          {user?.NomeCompleto?.split(' ')[0] ?? 'Operador'}
        </div>

        <button
          onClick={logout}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl text-emerald-500 hover:bg-red-900/50 hover:text-red-400 transition-all"
          title="Sair"
        >
          ⏻
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden">
        {view === 'pos' && <PosTerminal />}
        {view === 'orders' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-charcoal-900 mb-4">Pedidos Abertos</h2>
            <p className="text-emerald-500">Visualização de pedidos em desenvolvimento...</p>
          </div>
        )}
      </div>
    </div>
  );
}