import { pedidoRepo } from '../db/repositories/pedidoRepo';
import { fiscalRepo } from '../db/repositories/fiscalRepo';
import { empresaRepo } from '../db/repositories/empresaRepo';
import { pagamentoRepo } from '../db/repositories/pagamentoRepo';
import { alenfeClient } from './alenfeClient';
import { logger } from '../utils/logger';
import { BrowserWindow } from 'electron';

const FORMA_PAGAMENTO_ALENFE: Record<string, string> = {
    dinheiro: '01',
    cartao_credito: '03',
    cartao_debito: '04',
    pix: '17',
};

const documentoValido = (documento: string) => /^\d{11}$|^\d{14}$/.test(documento);

const rotulosPagamento: Record<string, string> = {
    '01': 'Dinheiro',
    '03': 'Cartão de Crédito',
    '04': 'Cartão de Débito',
    '17': 'PIX',
};

function valorTag(xml: string, tag: string): string | null {
    if (!xml) return null;
    const match = xml.match(new RegExp(`<(?:[\\w.-]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${tag}>`, 'i'));
    if (!match) return null;
    return match[1]
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();
}

function valorEmpresa(empresa: any, nomes: string[]): string {
    const normalizados = new Set(nomes.map((nome) => nome.toLowerCase()));
    const chave = Object.keys(empresa ?? {}).find((key) => normalizados.has(key.toLowerCase()));
    return chave ? String(empresa[chave] ?? '') : '';
}

function montarCupom(pedidoId: number, status: string, payload: any, nota: any, empresa: any) {
    const xml = String(nota.xmlImpressao ?? '');
    const itens = Array.isArray(payload?.itens) ? payload.itens : [];
    const pagamentos = Array.isArray(payload?.pagamentos) ? payload.pagamentos : [];
    const total = Number(nota.valorNota ?? itens.reduce((soma: number, item: any) => soma + Number(item.valorTotal ?? 0), 0));

    return {
        pedidoId,
        status,
        nfceId: nota.id,
        numero: nota.numero,
        serie: nota.serie,
        ambiente: valorTag(xml, 'tpAmb') ?? nota.ambiente ?? null,
        dataEmissao: nota.dataAutorizacao ?? nota.dataEmissao ?? valorTag(xml, 'dhEmi'),
        chaveAcesso: nota.chaveAcesso ?? valorTag(xml, 'chNFe') ?? '',
        protocolo: nota.protocolo ?? valorTag(xml, 'nProt') ?? '',
        motivo: nota.motivoRejeicao ?? nota.motivoContingencia ?? '',
        xmlImpressao: xml,
        qrCode: valorTag(xml, 'qrCode'),
        urlChave: valorTag(xml, 'urlChave'),
        emitente: {
            razaoSocial: valorEmpresa(empresa, ['RazaoSocial', 'Razao_Social']),
            nomeFantasia: valorEmpresa(empresa, ['NomeFantasia', 'Nome_Fantasia']),
            cnpj: valorEmpresa(empresa, ['Cnpj', 'CNPJ']),
            ie: valorEmpresa(empresa, ['InscricaoEstadual', 'IE']),
            logradouro: valorEmpresa(empresa, ['Logradouro', 'Endereco']),
            numero: valorEmpresa(empresa, ['Numero']),
            bairro: valorEmpresa(empresa, ['Bairro']),
            cidade: valorEmpresa(empresa, ['Cidade']),
            uf: valorEmpresa(empresa, ['Uf', 'UF']),
            cep: valorEmpresa(empresa, ['Cep', 'CEP']),
        },
        itens,
        pagamentos: pagamentos.map((pagamento: any) => ({
            ...pagamento,
            descricao: rotulosPagamento[String(pagamento.formaPagamento)] ?? 'Outros',
        })),
        totais: { vProd: total, vDesc: 0, vNF: total },
        troco: 0,
    };
}

async function acompanharEmissao(pedidoId: number, vendaId: number, alenfeId: number, payload: any) {
    const estadosFinais = new Set(['AUTORIZADA', 'REJEITADA', 'CONTINGENCIA', 'ERRO', 'CANCELADA']);
    const prazoFinal = Date.now() + 120000;
    let tentativa = 0;
    while (Date.now() < prazoFinal) {
        tentativa += 1;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
            const resposta = await alenfeClient.consultarStatus(alenfeId);
            const nota = resposta?.nota ?? resposta?.data?.nota ?? resposta?.data ?? resposta;
            const status = String(nota?.status ?? '').toUpperCase();
            if (!estadosFinais.has(status)) continue;

            const podeImprimir = status === 'AUTORIZADA' || status === 'CONTINGENCIA';
            const dadosEmpresa = podeImprimir ? await empresaRepo.getDadosEmitente() : null;
            const recibo = podeImprimir ? montarCupom(pedidoId, status, payload, nota, dadosEmpresa) : null;
            const motivo = nota?.motivoRejeicao ?? nota?.motivoContingencia ?? '';
            await fiscalRepo.atualizarStatus(vendaId, {
                status,
                chaveAcesso: recibo?.chaveAcesso || nota?.chaveAcesso || null,
                protocolo: recibo?.protocolo || nota?.protocolo || null,
                xmlProc: recibo?.xmlImpressao || null,
                motivoRejeicao: motivo || null,
            });
            const win = BrowserWindow.getAllWindows()[0];
            if (win && !win.isDestroyed()) {
                win.webContents.send('fiscal:callback', {
                    pedidoId,
                    status,
                    motivo_rejeicao: motivo,
                    ...(recibo ? { receipt: recibo } : {}),
                });
            }
            logger.info('fiscal.status.received', { pedidoId, vendaId, alenfeId, status, tentativa });
            return;
        } catch (error: any) {
            if (tentativa === 1 || tentativa % 10 === 0) {
                logger.warn('fiscal.status.poll_failed', { pedidoId, alenfeId, tentativa, error: error?.message });
            }
        }
    }
    logger.warn('fiscal.status.poll_timeout', { pedidoId, vendaId, alenfeId });
}

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

            const documentoInformado = String(documentoCliente ?? '').replace(/\D/g, '');
            if (ambiente === 2 && !documentoValido(documentoInformado)) {
                throw new Error('Em Homologação, informe um CPF (11 dígitos) ou CNPJ (14 dígitos) antes de finalizar.');
            }
            if (ambiente === 1 && documentoInformado && !documentoValido(documentoInformado)) {
                throw new Error('O CPF/CNPJ informado deve ter 11 ou 14 dígitos.');
            }
            const documentoFiscal = documentoInformado || config.cpfPadrao;
            if (!documentoValido(documentoFiscal)) {
                throw new Error('Informe um CPF/CNPJ válido do cliente ou configure ALENFE_CPF_PADRAO nas Configurações do ALESYS.');
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
                const ncm = String(item.NCM ?? '').replace(/\D/g, '');
                const cfop = String(item.CFOP ?? '5102').replace(/\D/g, '');
                if (!/^\d{8}$/.test(ncm)) {
                    throw new Error(`NCM inválido ou ausente no item ${item.CardapioNome ?? item.CardapioId}`);
                }
                if (!/^\d{4}$/.test(cfop)) {
                    throw new Error(`CFOP inválido no item ${item.CardapioNome ?? item.CardapioId}`);
                }

                const quantidade = Number(item.Quantidade);
                const valorUnitario = Number(item.ValorUnitario);
                const valorTotal = Number((quantidade * valorUnitario).toFixed(2));
                const cest = String(item.CEST ?? '').replace(/\D/g, '');
                const csosn = String(item.CSOSN ?? '').replace(/\D/g, '');

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
                    ...(cest && /^\d{7}$/.test(cest) ? { cest } : {}),
                    ...(csosn && /^\d{3}$/.test(csosn) ? { csosn } : {}),
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
            void acompanharEmissao(pedidoId, vendaId, resposta.id, payload);
            return { success: true, alenfeId: resposta.id };
        } catch (error: any) {
            logger.error('fiscal.emit.failed', error, { pedidoId, vendaId });
            return { success: false, error: error?.message ?? 'Erro desconhecido durante a emissão fiscal' };
        }
    },
};