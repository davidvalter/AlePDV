import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { Welcome } from './pages/Welcome';
import { Login } from './pages/Login';
import { Setup } from './pages/Setup';
import { Dashboard } from './pages/Dashboard';

export function App() {
    const [configStatus, setConfigStatus] = useState<'loading' | 'needs-setup' | 'ready'>('loading');
    const [showSetup, setShowSetup] = useState(false);
    const [forceReconfig, setForceReconfig] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        window.pdv.checkConfig().then((configured) => {
            setConfigStatus(configured ? 'ready' : 'needs-setup');
        });
    }, []);

    if (configStatus === 'loading') {
        return (
            <div className="flex items-center justify-center h-screen bg-emerald-950">
                <div className="text-emerald-50 text-xl">Carregando Alecrim PDV...</div>
            </div>
        );
    }

    // Tela de setup forçada (reconfiguração)
    if (forceReconfig) {
        return (
            <Setup
                onBack={() => {
                    setForceReconfig(false);
                    window.location.reload();
                }}
                isReconfig={true}
            />
        );
    }

    // Primeira configuração (instalação nova)
    if (configStatus === 'needs-setup') {
        return showSetup ? (
            <Setup onBack={() => setShowSetup(false)} />
        ) : (
            <Welcome onAdvance={() => setShowSetup(true)} />
        );
    }

    if (!user) return <Login onReconfig={() => setForceReconfig(true)} />;
    return <Dashboard onReconfig={() => setForceReconfig(true)} />;
}