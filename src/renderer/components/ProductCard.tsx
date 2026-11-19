export function ProductCard({ product, onAdd, disabled = false }: { product: any; onAdd: (p: any) => void; disabled?: boolean }) {
    return (
        <div
            onClick={() => { if (!disabled) onAdd(product); }}
            aria-disabled={disabled}
            className={`bg-white p-4 rounded-2xl shadow-sm border border-snow-200 transition-all group ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:border-emerald-400 cursor-pointer'}`}
        >
            <div className="aspect-square bg-snow-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center p-2">
                {product.Imagem ? (
                    <img
                        src={product.Imagem}
                        alt={product.Nome}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) parent.innerHTML = '<span class="text-4xl text-snow-300">🍽️</span>';
                        }}
                    />
                ) : (
                    <span className="text-4xl text-snow-300">🍽️</span>
                )}
            </div>
            <h3 className="text-charcoal-900 font-semibold leading-tight mb-1 text-sm">{product.Nome}</h3>
            <p className="text-charcoal-400 text-xs mb-3 line-clamp-2">{product.Descricao ?? ''}</p>
            <div className="flex justify-between items-center">
                <span className="text-emerald-600 font-bold">R$ {Number(product.PrecoVenda).toFixed(2)}</span>
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    +
                </div>
            </div>
        </div>
    );
}