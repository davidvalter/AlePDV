import axios from 'axios';
import { empresaRepo } from '../db/repositories/empresaRepo';

export const alenfeClient = {
    async enviarDocumento(payload: any): Promise<{ id: number }> {
        const config = await empresaRepo.getAlenfeConfig();
        const response = await axios.post(
            `${config.url}/nfce/criar`,
            payload,
            {
                timeout: 15000,
                headers: {
                    'x-api-key': config.apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );
        return { id: Number(response.data.id) };
    },

    async consultarStatus(nfceId: number): Promise<any> {
        const config = await empresaRepo.getAlenfeConfig();
        const { data } = await axios.get(
            `${config.url}/nfce/${nfceId}/consulta`,
            {
                timeout: 10000,
                headers: { 'x-api-key': config.apiKey },
            }
        );
        return data;
    },

    async cancelarDocumento(chaveAcesso: string, motivo: string): Promise<void> {
        const config = await empresaRepo.getAlenfeConfig();
        await axios.post(
            `${config.url}/api/documento/cancelar`,
            { chave_acesso: chaveAcesso, motivo },
            {
                timeout: 15000,
                headers: { 'x-api-key': config.apiKey },
            }
        );
    },
};
