export function FiscalStatusModal({
    status,
}: {
    status: 'processing' | 'authorized' | 'rejected';
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-cream-50 rounded-2xl p-8 w-96 text-center shadow-2xl">
                {status === 'processing' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-olive-500 border-t-transparent mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-rustic-900">Emitindo NFC-e</h3>
                        <p className="text-wood-500 text-sm mt-1">Aguardando autorização da SEFAZ...</p>
                    </>
                )}
                {status === 'authorized' && (
                    <>
                        <div className="w-16 h-16 bg-olive-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                            ✓
                        </div>
                        <h3 className="text-xl font-bold text-rustic-900">NFC-e Autorizada!</h3>
                        <p className="text-wood-500 text-sm mt-1">Imprimindo cupom...</p>
                    </>
                )}
                {status === 'rejected' && (
                    <>
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                            ✕
                        </div>
                        <h3 className="text-xl font-bold text-rustic-900">NFC-e Rejeitada</h3>
                        <p className="text-wood-500 text-sm mt-1">Verifique os dados e tente novamente.</p>
                    </>
                )}
            </div>
        </div>
    );
}