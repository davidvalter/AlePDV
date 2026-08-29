import os from 'os';
import { pedidoRepo } from '../db/repositories/pedidoRepo';
import { fiscalRepo } from '../db/repositories/fiscalRepo';
import { empresaRepo } from '../db/repositories/empresaRepo';
import { alenfeClient } from './alenfeClient';

function getLocalIP(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] ?? []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

export const fiscalService = {
    async emitir(
        pedidoId: number
    ): Promise<{ success: boolean; protocolo?: string; error?: string }> {
        try {
            const pedido = await pedidoRepo.getById(pedidoId);
            if (!pedido) return { success: false, error: 'Pedido não encontrado' };

            const itens = await pedidoRepo.getItens(pedidoId);
            const empresa = await empresaRepo.getDadosEmitente();
            if (!empresa) return { success: false, error: 'Dados do emitente não configurados' };

            const payload = {
                ambiente: 'homologacao',
                serie: '1',
                tipo_documento: 'NFC-e',
                pedido: {
                    numero: pedido.Id,
                    data_emissao: new Date().toISOString(),
                },
                emitente: {
                    cnpj: empresa.Cnpj,
                    ie: empresa.InscricaoEstadual,
                    razao_social: empresa.RazaoSocial,
                    nome_fantasia: empresa.NomeFantasia,
                    endereco: {
                        logradouro: empresa.Logradouro,
                        numero: empresa.Numero,
                        bairro: empresa.Bairro,
                        municipio: empresa.Cidade,
                        uf: empresa.Uf,
                        cep: empresa.Cep,
                    },
                },
                destinatario: {
                    cpf: null,
                    nome: 'Consumidor nao identificado',
                },
                itens: itens.map((item: any) => ({
                    codigo: item.CardapioId?.toString() ?? '',
                    descricao: item.CardapioNome ?? '',
                    ncm: item.NCM ?? '',
                    cfop: item.CFOP ?? '5102',
                    csosn: item.CSOSN ?? '102',
                    cest: item.CEST ?? '',
                    unidade: item.UnidadeMedida ?? 'UN',
                    quantidade: item.Quantidade,
                    valor_unitario: item.ValorUnitario,
                    valor_total: item.Quantidade * item.ValorUnitario,
                })),
                valor_total: pedido.ValorTotal,
                webhook_url: `http://${getLocalIP()}:3010/alenfe/callback`,
            };

            const vendaId = await fiscalRepo.criarRegistro(pedidoId, payload);
            const resposta = await alenfeClient.enviarDocumento(payload);
            await fiscalRepo.marcarEnviado(vendaId);

            return { success: true, protocolo: resposta.protocolo };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },
};