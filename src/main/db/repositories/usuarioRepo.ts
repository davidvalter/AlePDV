import { getPool } from '../connection';
import crypto from 'crypto';
import { getStore } from '../../config/store';

export const usuarioRepo = {
    async login(username: string, senha: string) {
        const [rows] = await getPool().execute(`SELECT * FROM Usuarios WHERE Username = ? AND Ativo = 1`, [username]);
        const user = (rows as any[])[0];
        if (!user) return null;
        const secret = getStore().get('chave_secreta');
        const hash = crypto.createHmac('sha256', secret + user.Salt).update(senha).digest('hex');
        if (hash !== user.Senha) return null;
        return user;
    }
};