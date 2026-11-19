import { useEffect, useState } from 'react';
import { useProductStore } from '../stores/useProductStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useAuthStore } from '../stores/useAuthStore';
import { ProductCard } from '../components/ProductCard';
import { Cart } from '../components/Cart';
import { CategoryBar } from '../components/CategoryBar';
import { FiscalStatusModal } from '../components/FiscalStatusModal';

export function PosTerminal() {
  const { products, categories, selectedCategory, loadProducts, selectCategory, filtered } =
    useProductStore();
  const { createOrder, currentPedidoId, addToCart, fiscalStatus, clear, applyFiscalCallback } = useOrderStore();
  const { user } = useAuthStore();
  const [showFiscalModal, setShowFiscalModal] = useState(false);

  useEffect(() => {
    loadProducts();
    // Cria um pedido automático ao entrar no PDV (tipo balcão)
    if (!currentPedidoId && user) {
      createOrder(user.Id);
    }
  }, []);

  // Listener do webhook fiscal
  useEffect(() => {
    window.pdv.onFiscalCallback((data) => {
      if (data.status === 'AUTORIZADA') {
        applyFiscalCallback('AUTORIZADA');
        setShowFiscalModal(true);
        setTimeout(() => {
          clear();
          setShowFiscalModal(false);
          if (user) createOrder(user.Id);
        }, 2000);
      } else if (data.status === 'REJEITADA') {
        applyFiscalCallback('REJEITADA', data.motivo_rejeicao);
        setShowFiscalModal(true);
      }
    });
  }, []);

  const handleAddToCart = async (product: any) => {
    await addToCart(product);
  };

  return (
    <div className="flex h-full">
      {/* Área de produtos */}
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
                <ProductCard key={product.Id} product={product} onAdd={handleAddToCart} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Carrinho */}
      <Cart />

      {/* Modal fiscal */}
      {showFiscalModal && <FiscalStatusModal status={fiscalStatus} />}
    </div>
  );
}