import { useState } from 'react';
import { useOrderStore } from '../stores/useOrderStore';

const FORMAS_PAGAMENTO = [
    { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
    { id: 'cartao_credito', label: 'Crédito', icon: '💳' },
    { id: 'cartao_debito', label: 'Débito', icon: '💳' },
    { id: 'pix', label: 'Pix', icon: '📱' },
];

export function Cart() {
    const { cart, total, removeFromCart, finalizar, fiscalStatus, clear } = useOrderStore();
    const [showPayment, setShowPayment] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleFinalizar = async (forma: string) => {
        setProcessing(true);
        setShowPayment(false);
        await finalizar(forma);
        setProcessing(false);
    };

    return (
        <div className="w-96 bg-rustic-900 text-cream-50 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Carrinho</h2>
                {cart.length > 0 && (
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

            {/* Total e finalização */}
            <div className="border-t border-rustic-700 pt-4 mt-4">
                <div className="flex justify-between text-2xl font-bold mb-4">
                    <span>Total</span>
                    <span className="text-olive-400">R$ {total.toFixed(2)}</span>
                </div>

                {processing ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-400" />
                        <span className="ml-3 text-sm">
                            {fiscalStatus === 'processing' ? 'Emitindo NFC-e...' : 'Processando...'}
                        </span>
                    </div>
                ) : showPayment ? (
                    <div className="grid grid-cols-2 gap-2">
                        {FORMAS_PAGAMENTO.map((fp) => (
                            <button
                                key={fp.id}
                                onClick={() => handleFinalizar(fp.id)}
                                className="flex flex-col items-center gap-1 py-3 rounded-xl bg-rustic-800 hover:bg-rustic-700 text-cream-50 text-sm font-semibold"
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