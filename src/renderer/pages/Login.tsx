import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

export function Login({ onReconfig }: { onReconfig: () => void }) {
    const { login } = useAuthStore();
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const ok = await login(username, senha);
        if (!ok) setError('Usuário ou senha inválidos');
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center h-screen bg-emerald-950 relative">
            {/* Botão de reconfiguração no canto superior direito */}
            <button
                onClick={onReconfig}
                className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-emerald-800/50 hover:bg-emerald-700/60 text-emerald-300 hover:text-emerald-200 flex items-center justify-center transition-all"
                title="Reconfigurar sistema"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            </button>

            {/* Card de login */}
            <div className="bg-snow-50 rounded-3xl shadow-2xl p-10 w-96">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
                        <span className="text-3xl">🌿</span>
                    </div>
                    <h1 className="text-2xl font-bold text-charcoal-900">Alecrim PDV</h1>
                    <p className="text-emerald-500 text-sm mt-1 font-medium">Sistema de Ponto de Venda</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-charcoal-700 text-sm font-semibold mb-1.5">Usuário</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-snow-200 bg-snow-50 text-charcoal-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                            placeholder="Digite seu usuário"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-charcoal-700 text-sm font-semibold mb-1.5">Senha</label>
                        <input
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-snow-200 bg-snow-50 text-charcoal-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                            <p className="text-red-600 text-sm font-semibold text-center">{error}</p>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>

            {/* Footer */}
            <p className="absolute bottom-6 text-emerald-500/40 text-xs">
                GOUVTEC INFORMÁTICA
            </p>
        </div>
    );
}