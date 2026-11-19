import os from 'os';
import { pedidoRepo } from '../db/repositories/pedidoRepo';
import { fiscalRepo } from '../db/repositories/fiscalRepo';
import { empresaRepo } from '../db/repositories/empresaRepo';
import { alenfeClient } from './alenfeClient';
import { logger } from '../utils/logger';

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
        logger.info('fiscal.emit.started', { pedidoId });
        try {
            const pedido = await pedidoRepo.getById(pedidoId);
            if (!pedido) {
                const message = 'Pedido não encontrado';
                logger.warn('fiscal.emit.validation_failed', { pedidoId, reason: message });
                return { success: false, error: message };
            }

            const itens = await pedidoRepo.getItens(pedidoId);
            if (itens.length === 0) {
                const message = 'O pedido não possui itens válidos para emissão';
                logger.warn('fiscal.emit.validation_failed', { pedidoId, reason: message });
                return { success: false, error: message };
            }

            const empresa = await empresaRepo.getDadosEmitente();
            if (!empresa) {
                const message = 'Dados do emitente não configurados';
                logger.warn('fiscal.emit.validation_failed', { pedidoId, reason: message });
                return { success: false, error: message };
            }

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
            logger.info('fiscal.emit.requesting_alenfe', { pedidoId, vendaId, itemCount: itens.length });
            const resposta = await alenfeClient.enviarDocumento(payload);
            await fiscalRepo.marcarEnviado(vendaId);

            logger.info('fiscal.emit.sent', { pedidoId, vendaId, protocolo: resposta.protocolo });
            return { success: true, protocolo: resposta.protocolo };
        } catch (error: any) {
            logger.error('fiscal.emit.failed', error, { pedidoId });
            return { success: false, error: error?.message ?? 'Erro desconhecido durante a emissão fiscal' };
        }
    },
};
