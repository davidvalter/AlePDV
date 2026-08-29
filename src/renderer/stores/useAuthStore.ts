import { create } from 'zustand';

interface AuthState {
    user: any | null;
    login: (username: string, senha: string) => Promise<boolean>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    login: async (username, senha) => {
        const result = await window.pdv.login(username, senha);
        if (result.success) {
            set({ user: result.user });
            return true;
        }
        return false;
    },
    logout: () => set({ user: null }),
}));