import { useEffect, useRef, useState } from 'react';

type Receipt = {
    status?: string;
    numero?: string | number;
    serie?: string | number;
    ambiente?: string | number | null;
    dataEmissao?: string | null;
    chaveAcesso?: string | null;
    protocolo?: string | null;
    motivo?: string | null;
    qrCode?: string | null;
    urlChave?: string | null;
    emitente?: Record<string, string>;
    itens?: Array<Record<string, any>>;
    pagamentos?: Array<Record<string, any>>;
    totais?: { vNF?: number; vProd?: number };
};

const QR_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';

function moeda(valor: unknown): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dataHora(valor?: string | null): string {
    if (!valor) return '';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? valor : data.toLocaleString('pt-BR');
}

export function NfceReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
    const qrRef = useRef<HTMLDivElement>(null);
    const [qrDisponivel, setQrDisponivel] = useState(false);
    const qrTexto = receipt.qrCode || receipt.urlChave || '';

    useEffect(() => {
        let ativo = true;
        const gerar = () => {
            if (!ativo || !qrRef.current || !qrTexto) return false;
            const gerador = (window as any).qrcode;
            if (typeof gerador !== 'function') return false;
            const qr = gerador(0, 'M');
            qr.addData(qrTexto);
            qr.make();
            qrRef.current.innerHTML = qr.createImgTag(5, 8);
            setQrDisponivel(true);
            return true;
        };

        if (gerar()) return () => { ativo = false; };
        let script = document.querySelector<HTMLScriptElement>('script[data-nfce-qr]');
        if (!script) {
            script = document.createElement('script');
            script.src = QR_SCRIPT;
            script.async = true;
            script.dataset.nfceQr = 'true';
            document.head.appendChild(script);
        }
        const aoCarregar = () => gerar();
        script.addEventListener('load', aoCarregar);
        const timer = window.setInterval(() => {
            if (gerar()) window.clearInterval(timer);
        }, 250);
        const limite = window.setTimeout(() => window.clearInterval(timer), 8000);

        return () => {
            ativo = false;
            script?.removeEventListener('load', aoCarregar);
            window.clearInterval(timer);
            window.clearTimeout(limite);
        };
    }, [qrTexto]);

    const emitente = receipt.emitente ?? {};
    const total = receipt.totais?.vNF ?? receipt.totais?.vProd ?? 0;
    const contingencia = receipt.status === 'CONTINGENCIA';

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
            <style>{`
                @page { size: 80mm auto; margin: 3mm; }
                @media print {
                    body * { visibility: hidden !important; }
                    .nfce-print-zone, .nfce-print-zone * { visibility: visible !important; }
                    .nfce-print-zone { position: absolute !important; left: 0 !important; top: 0 !important; width: 74mm !important; color: #000 !important; background: #fff !important; }
                    .nfce-no-print { display: none !important; }
                }
            `}</style>
            <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white text-slate-900 shadow-2xl">
                <div className="nfce-no-print flex items-center justify-between border-b px-5 py-3">
                    <h2 className="text-lg font-bold">{contingencia ? 'NFC-e em contingência' : 'NFC-e autorizada'}</h2>
                    <button onClick={onClose} className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100" aria-label="Fechar">✕</button>
                </div>

                <div className="nfce-print-zone mx-auto max-w-[74mm] p-4 font-mono text-xs">
                    <header className="text-center">
                        <strong className="block text-sm">{emitente.nomeFantasia || emitente.razaoSocial || 'Emitente'}</strong>
                        {emitente.razaoSocial && <span className="block">{emitente.razaoSocial}</span>}
                        {emitente.cnpj && <span className="block">CNPJ: {emitente.cnpj}</span>}
                        {emitente.ie && <span className="block">IE: {emitente.ie}</span>}
                        <span className="block">{[emitente.logradouro, emitente.numero, emitente.bairro].filter(Boolean).join(', ')}</span>
                        <span className="block">{[emitente.cidade, emitente.uf].filter(Boolean).join('/')}</span>
                    </header>

                    <hr className="my-2 border-dashed border-slate-400" />
                    {receipt.ambiente === '2' || receipt.ambiente === 2
                        ? <p className="text-center font-bold">HOMOLOGAÇÃO — SEM VALOR FISCAL</p>
                        : null}
                    {contingencia && <p className="text-center font-bold">EMITIDA EM CONTINGÊNCIA</p>}
                    <p className="text-center font-bold">DANFE NFC-e — Documento Auxiliar</p>
                    <p className="text-center">Nº {String(receipt.numero ?? '').padStart(6, '0')} · Série {receipt.serie ?? ''}</p>
                    <p className="text-center">{dataHora(receipt.dataEmissao)}</p>

                    <hr className="my-2 border-dashed border-slate-400" />
                    <div className="grid grid-cols-[1fr_auto] gap-x-2 font-bold">
                        <span>ITEM</span><span>VALOR</span>
                    </div>
                    {(receipt.itens ?? []).map((item, index) => (
                        <div key={index} className="grid grid-cols-[1fr_auto] gap-x-2 border-b border-dotted border-slate-300 py-1">
                            <span>{item.descricao} <small>({item.quantidade} x {moeda(item.valorUnitario)})</small></span>
                            <span>{moeda(item.valorTotal)}</span>
                        </div>
                    ))}
                    <div className="mt-2 space-y-1">
                        {(receipt.pagamentos ?? []).map((pagamento, index) => (
                            <div key={index} className="flex justify-between">
                                <span>{pagamento.descricao || pagamento.formaPagamento}</span>
                                <span>{moeda(pagamento.valor)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between border-t border-slate-500 pt-1 text-sm font-bold">
                            <span>TOTAL</span><span>{moeda(total)}</span>
                        </div>
                    </div>

                    <hr className="my-2 border-dashed border-slate-400" />
                    <div ref={qrRef} className="flex justify-center py-1 [&_img]:h-36 [&_img]:w-36" />
                    {!qrDisponivel && qrTexto && <p className="break-all text-center text-[9px]">{qrTexto}</p>}
                    <p className="break-all text-center">Chave de acesso: {receipt.chaveAcesso || '—'}</p>
                    <p className="break-all text-center">Protocolo: {receipt.protocolo || '—'}</p>
                    {receipt.motivo && <p className="text-center">Motivo: {receipt.motivo}</p>}
                    {receipt.urlChave && <p className="break-all text-center">Consulta: {receipt.urlChave}</p>}
                    <p className="mt-2 text-center">Obrigado pela preferência!</p>
                </div>

                <div className="nfce-no-print flex justify-end gap-2 border-t p-4">
                    <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2">Fechar</button>
                    <button onClick={() => window.print()} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-600">Imprimir cupom</button>
                </div>
            </div>
        </div>
    );
}
