import { useEffect, useState } from 'react';
import { useOrderStore } from '../stores/useOrderStore';

const FORMAS_PAGAMENTO = [
    { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
    { id: 'cartao_credito', label: 'Crédito', icon: '💳' },
    { id: 'cartao_debito', label: 'Débito', icon: '💳' },
    { id: 'pix', label: 'Pix', icon: '📱' },
];

export function Cart() {
    const { cart, total, removeFromCart, finalizar, fiscalStatus, paymentRecorded, finalizeError, currentPedidoId, clear } = useOrderStore();
    const [showPayment, setShowPayment] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [ambiente, setAmbiente] = useState<number | null>(null);
    const [ambienteErro, setAmbienteErro] = useState<string | null>(null);
    const [documentoCliente, setDocumentoCliente] = useState('');

    useEffect(() => {
        let active = true;
        window.pdv.getFiscalEnvironment().then((result: any) => {
            if (!active) return;
            const value = Number(result?.ambiente);
            if (!result?.success || (value !== 1 && value !== 2)) {
                setAmbiente(null);
                setAmbienteErro(result?.error || 'Configure ALENFE_AMBIENTE como 1 (Produção) ou 2 (Homologação) no ALESYS.');
                return;
            }
            setAmbiente(value);
            setAmbienteErro(value === 1 && !result?.cpfPadraoConfigurado
                ? 'Configure ALENFE_CPF_PADRAO com um CPF/CNPJ válido nas Configurações do ALESYS para emitir em Produção.'
                : null);
        }).catch((error: any) => {
            if (!active) return;
            setAmbiente(null);
            setAmbienteErro(error?.message || 'Não foi possível consultar ALENFE_AMBIENTE no ALESYS.');
        });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        setFeedback(null);
        setDocumentoCliente('');
    }, [currentPedidoId]);

    const documentoNumerico = documentoCliente.replace(/\D/g, '');
    const documentoValido = documentoNumerico.length === 11 || documentoNumerico.length === 14;

    const handleFinalizar = async (forma: string) => {
        if (ambiente === 2 && !documentoValido) {
            setFeedback({ type: 'error', message: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) para emitir em Homologação.' });
            return;
        }
        if (ambiente !== 1 && ambiente !== 2) {
            setFeedback({ type: 'error', message: ambienteErro || 'Ambiente fiscal não configurado.' });
            return;
        }

        setProcessing(true);
        setShowPayment(false);
        setFeedback(null);
        try {
            const result = await finalizar(forma, ambiente === 2 ? documentoNumerico : undefined);
            setFeedback(result.success
                ? { type: 'success', message: result.message || 'Pedido enviado para emissão fiscal.' }
                : { type: 'error', message: result.error || 'Não foi possível finalizar o pedido.' });
        } catch (error: any) {
            setFeedback({
                type: 'error',
                message: error?.message || 'Ocorreu um erro inesperado ao finalizar o pedido.',
            });
        } finally {
            setProcessing(false);
        }
    };

    const pagamentoBloqueado = processing
        || ambienteErro !== null
        || ambiente === null
        || (ambiente === 2 && !documentoValido);

    return (
        <div className="w-96 bg-rustic-900 text-cream-50 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Carrinho</h2>
                {cart.length > 0 && !paymentRecorded && !processing && (
                    <button onClick={clear} className="text-wood-400 hover:text-red-400 text-sm">
                        Limpar
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-wood-400 text-sm">
                        Nenhum item adicionado
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cart.map((item) => (
                            <div
                                key={item.itemId}
                                className="flex justify-between items-start pb-3 border-b border-rustic-800"
                            >
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{item.Nome}</p>
                                    <p className="text-wood-400 text-xs">
                                        {item.quantity}x · R$ {Number(item.PrecoVenda).toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-olive-400">
                                        R$ {(item.quantity * item.PrecoVenda).toFixed(2)}
                                    </span>
                                    <button
                                        onClick={() => removeFromCart(item.itemId)}
                                        className="text-wood-400 hover:text-red-400"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-rustic-700 pt-4 mt-4">
                <div className="flex justify-between text-2xl font-bold mb-4">
                    <span>Total</span>
                    <span className="text-olive-400">R$ {total.toFixed(2)}</span>
                </div>

                {(feedback || finalizeError) && (
                    <div
                        role={finalizeError || feedback?.type === 'error' ? 'alert' : 'status'}
                        aria-live="polite"
                        className={`mb-3 rounded-xl px-4 py-3 text-sm ${finalizeError || feedback?.type === 'error'
                            ? 'bg-red-900/40 text-red-200 border border-red-700'
                            : 'bg-emerald-900/40 text-emerald-200 border border-emerald-700'}`}
                    >
                        {finalizeError || feedback?.message}
                    </div>
                )}

                {processing ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-400" />
                        <span className="ml-3 text-sm">
                            {fiscalStatus === 'processing' ? 'Finalizando pedido e enviando NFC-e...' : 'Processando...'}
                        </span>
                    </div>
                ) : paymentRecorded && fiscalStatus === 'sent' ? (
                    <div className="w-full py-4 rounded-xl bg-emerald-900/40 text-emerald-200 text-center text-sm border border-emerald-700">
                        Pagamento registrado. Aguardando retorno fiscal do ALENFE.
                    </div>
                ) : paymentRecorded && fiscalStatus === 'authorized' ? (
                    <div className="w-full py-4 rounded-xl bg-emerald-900/40 text-emerald-200 text-center text-sm border border-emerald-700">
                        NFC-e autorizada. Preparando o próximo pedido...
                    </div>
                ) : paymentRecorded && fiscalStatus === 'rejected' ? (
                    <button
                        onClick={() => handleFinalizar('')}
                        className="w-full py-4 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold"
                    >
                        TENTAR EMITIR NFC-e NOVAMENTE
                    </button>
                ) : showPayment ? (
                    <div>
                        <p className="mb-2 text-xs text-wood-300">
                            Ambiente fiscal: <strong>{ambiente === 1 ? 'Produção' : ambiente === 2 ? 'Homologação' : 'indisponível'}</strong>
                        </p>
                        {ambiente === 2 && (
                            <div className="mb-3">
                                <label htmlFor="documento-cliente" className="block text-xs font-semibold mb-1.5">
                                    CPF ou CNPJ do consumidor
                                </label>
                                <input
                                    id="documento-cliente"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={18}
                                    value={documentoCliente}
                                    onChange={(event) => setDocumentoCliente(event.target.value.replace(/[^\d.\-/]/g, ''))}
                                    placeholder="Digite o CPF ou CNPJ"
                                    className="w-full px-3 py-2 rounded-lg bg-rustic-800 border border-rustic-700 text-cream-50 placeholder:text-wood-500 focus:outline-none focus:border-olive-400"
                                />
                                <p className="mt-1 text-xs text-wood-400">Homologação exige CPF (11 dígitos) ou CNPJ (14 dígitos).</p>
                            </div>
                        )}
                        {ambienteErro && (
                            <p className="mb-3 text-xs text-red-300">{ambienteErro}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            {FORMAS_PAGAMENTO.map((fp) => (
                                <button
                                    key={fp.id}
                                    disabled={pagamentoBloqueado}
                                    onClick={() => handleFinalizar(fp.id)}
                                    className="flex flex-col items-center gap-1 py-3 rounded-xl bg-rustic-800 hover:bg-rustic-700 text-cream-50 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="text-xl">{fp.icon}</span>
                                    {fp.label}
                                </button>
                            ))}
                            <button
                                onClick={() => setShowPayment(false)}
                                className="col-span-2 py-2 rounded-xl text-wood-400 text-sm hover:text-cream-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowPayment(true)}
                        disabled={cart.length === 0}
                        className="w-full py-4 rounded-xl bg-olive-500 hover:bg-olive-600 text-cream-50 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        FINALIZAR PEDIDO
                    </button>
                )}
            </div>
        </div>
    );
}
