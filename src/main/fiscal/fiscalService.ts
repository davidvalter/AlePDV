import { pedidoRepo } from '../db/repositories/pedidoRepo';
import { fiscalRepo } from '../db/repositories/fiscalRepo';
import { empresaRepo } from '../db/repositories/empresaRepo';
import { pagamentoRepo } from '../db/repositories/pagamentoRepo';
import { alenfeClient } from './alenfeClient';
import { logger } from '../utils/logger';

const FORMA_PAGAMENTO_ALENFE: Record<string, string> = {
    dinheiro: '01',
    cartao_credito: '03',
    cartao_debito: '04',
    pix: '17',
};

const documentoValido = (documento: string) => /^\\d{11}$|^\\d{14}$/.test(documento);

export const fiscalService = {
    async emitir(
        pedidoId: number,
        documentoCliente?: string
    ): Promise<{ success: boolean; alenfeId?: number; error?: string }> {
        logger.info('fiscal.emit.started', { pedidoId });
        let vendaId: number | undefined;

        try {
            const config = await empresaRepo.getAlenfeConfig();
            const ambiente = Number(config.ambiente);
            if (ambiente !== 1 && ambiente !== 2) {
                throw new Error('ALENFE_AMBIENTE ausente ou inválido. Use 1 para Produção ou 2 para Homologação.');
            }

            const documentoInformado = String(documentoCliente ?? '').replace(/\\D/g, '');
            if (ambiente === 2 && !documentoValido(documentoInformado)) {
                throw new Error('Em Homologação, informe um CPF (11 dígitos) ou CNPJ (14 dígitos) antes de finalizar.');
            }
            const documentoFiscal = ambiente === 2 ? documentoInformado : config.cpfPadrao;
            if (!documentoValido(documentoFiscal)) {
                throw new Error('Configure ALENFE_CPF_PADRAO com CPF ou CNPJ válido nas Configurações do ALESYS para emitir em Produção.');
            }

            const pedido = await pedidoRepo.getById(pedidoId);
            if (!pedido) {
                throw new Error('Pedido não encontrado');
            }

            const itens = await pedidoRepo.getItens(pedidoId);
            if (itens.length === 0) {
                throw new Error('O pedido não possui itens válidos para emissão');
            }

            const itensNfce = itens.map((item: any, index: number) => {
                const ncm = String(item.NCM ?? '').replace(/\\D/g, '');
                const cfop = String(item.CFOP ?? '5102').replace(/\\D/g, '');
                if (!/^\\d{8}$/.test(ncm)) {
                    throw new Error(`NCM inválido ou ausente no item ${item.CardapioNome ?? item.CardapioId}`);
                }
                if (!/^\\d{4}$/.test(cfop)) {
                    throw new Error(`CFOP inválido no item ${item.CardapioNome ?? item.CardapioId}`);
                }

                const quantidade = Number(item.Quantidade);
                const valorUnitario = Number(item.ValorUnitario);
                const valorTotal = Number((quantidade * valorUnitario).toFixed(2));
                const cest = String(item.CEST ?? '').replace(/\\D/g, '');
                const csosn = String(item.CSOSN ?? '').replace(/\\D/g, '');

                return {
                    codigo: String(item.CardapioId ?? ''),
                    descricao: ambiente === 2 && index === 0
                        ? config.descricaoHomologacao
                        : String(item.CardapioNome ?? ''),
                    ncm,
                    cfop,
                    unidade: String(item.UnidadeMedida ?? 'UN'),
                    quantidade,
                    valorUnitario,
                    valorTotal,
                    ...(cest && /^\\d{7}$/.test(cest) ? { cest } : {}),
                    ...(csosn && /^\\d{3}$/.test(csosn) ? { csosn } : {}),
                };
            });

            const pagamentos = await pagamentoRepo.getByPedido(pedidoId);
            if (pagamentos.length === 0) {
                throw new Error('Nenhum pagamento confirmado foi encontrado para este pedido');
            }
            const pagamentosNfce = pagamentos.map((pagamento: any) => {
                const formaPagamento = FORMA_PAGAMENTO_ALENFE[String(pagamento.FormaPagamento)];
                if (!formaPagamento) {
                    throw new Error(`Forma de pagamento não mapeada para NFC-e: ${pagamento.FormaPagamento}`);
                }
                return { formaPagamento, valor: Number(pagamento.Valor) };
            });

            const payload = {
                cliente: {
                    cpfCnpj: documentoFiscal,
                    nome: ambiente === 2 ? config.nomeHomologacao : config.consumidorPadrao,
                    endereco: config.endereco,
                },
                itens: itensNfce,
                pagamentos: pagamentosNfce,
            };

            vendaId = await fiscalRepo.criarRegistro(pedidoId, payload);
            logger.info('fiscal.emit.requesting_alenfe', {
                pedidoId,
                vendaId,
                ambiente,
                itemCount: itensNfce.length,
            });

            const resposta = await alenfeClient.enviarDocumento(payload);
            if (!Number.isSafeInteger(resposta.id) || resposta.id <= 0) {
                throw new Error('O ALENFE não retornou um identificador válido para a NFC-e');
            }

            await fiscalRepo.marcarEnviado(vendaId, resposta.id);
            logger.info('fiscal.emit.sent', {
                pedidoId,
                vendaId,
                alenfeId: resposta.id,
                ambiente,
            });
            return { success: true, alenfeId: resposta.id };
        } catch (error: any) {
            logger.error('fiscal.emit.failed', error, { pedidoId, vendaId });
            return { success: false, error: error?.message ?? 'Erro desconhecido durante a emissão fiscal' };
        }
    },
};