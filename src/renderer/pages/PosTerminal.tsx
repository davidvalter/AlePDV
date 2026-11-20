import { useEffect, useState } from 'react';
import { useProductStore } from '../stores/useProductStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useAuthStore } from '../stores/useAuthStore';
import { ProductCard } from '../components/ProductCard';
import { Cart } from '../components/Cart';
import { CategoryBar } from '../components/CategoryBar';
import { FiscalStatusModal } from '../components/FiscalStatusModal';
import { NfceReceiptModal } from '../components/NfceReceiptModal';

export function PosTerminal() {
  const { products, categories, selectedCategory, loadProducts, selectCategory, filtered } =
    useProductStore();
  const { createOrder, currentPedidoId, addToCart, fiscalStatus, clear, applyFiscalCallback, paymentRecorded } = useOrderStore();
  const { user } = useAuthStore();
  const [showFiscalModal, setShowFiscalModal] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  useEffect(() => {
    loadProducts();
    if (!currentPedidoId && user) {
      createOrder(user.Id);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = window.pdv.onFiscalCallback((data) => {
      if (data?.pedidoId && data.pedidoId !== currentPedidoId) return;

      if (data?.receipt) {
        applyFiscalCallback(data.status, data.motivo_rejeicao);
        setReceipt(data.receipt);
        return;
      }

      if (data?.status === 'REJEITADA' || data?.status === 'ERRO' || data?.status === 'CANCELADA') {
        applyFiscalCallback(data.status, data.motivo_rejeicao);
        setShowFiscalModal(true);
        window.setTimeout(() => setShowFiscalModal(false), 3000);
      }
    });
    return unsubscribe;
  }, [currentPedidoId, applyFiscalCallback]);

  const handleAddToCart = async (product: any) => {
    await addToCart(product);
  };

  const handleCloseReceipt = async () => {
    setReceipt(null);
    clear();
    if (user) await createOrder(user.Id);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <CategoryBar
          categories={categories}
          selected={selectedCategory}
          onSelect={selectCategory}
        />
        <div className="flex-1 overflow-y-auto mt-4">
          {products.length === 0 ? (
            <div className="flex items-center justify-center h-full text-wood-400">
              Carregando produtos...
            </div>
          ) : (
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered().map((product) => (
                <ProductCard key={product.Id} product={product} onAdd={handleAddToCart} disabled={paymentRecorded} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Cart />

      {showFiscalModal && fiscalStatus === 'rejected' && (
        <FiscalStatusModal status={fiscalStatus} />
      )}
      {receipt && (
        <NfceReceiptModal receipt={receipt} onClose={handleCloseReceipt} />
      )}
    </div>
  );
}
