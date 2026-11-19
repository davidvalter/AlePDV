import { create } from 'zustand';

interface OrderState {
  currentPedidoId: number | null;
  cart: any[];
  total: number;
  tipo: 'mesa' | 'balcao' | 'delivery';
  mesa: string | null;
  fiscalStatus: 'idle' | 'processing' | 'sent' | 'authorized' | 'rejected';
  paymentRecorded: boolean;
  setTipo: (tipo: 'mesa' | 'balcao' | 'delivery') => void;
  setMesa: (mesa: string | null) => void;
  createOrder: (responsavelId: number) => Promise<void>;
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  loadCart: () => Promise<void>;
  finalizar: (formaPagamento: string) => Promise<{
    success: boolean;
    protocolo?: string;
    message?: string;
    error?: string;
  }>;
  clear: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  currentPedidoId: null,
  cart: [],
  total: 0,
  tipo: 'balcao',
  mesa: null,
  fiscalStatus: 'idle',
  paymentRecorded: false,

  setTipo: (tipo) => set({ tipo }),
  setMesa: (mesa) => set({ mesa }),

  createOrder: async (responsavelId) => {
    const { tipo, mesa } = get();
    const result = await window.pdv.createOrder({ tipo, mesa, responsavelId, cliente: null });
    if (result.success) {
      set({ currentPedidoId: result.data, paymentRecorded: false, fiscalStatus: 'idle' });
    }
  },

  addToCart: async (product) => {
    const { currentPedidoId, cart } = get();
    if (!currentPedidoId) return;
    const result = await window.pdv.addItem({
      pedidoId: currentPedidoId,
      cardapioId: product.Id,
      quantidade: 1,
      valorUnitario: product.PrecoVenda,
    });
    if (result.success) {
      set({
        cart: [...cart, { ...product, itemId: result.data, quantity: 1 }],
        total: cart.reduce((acc, i) => acc + i.PrecoVenda, 0) + product.PrecoVenda,
      });
    }
  },

  removeFromCart: async (itemId) => {
    const { currentPedidoId, cart } = get();
    if (!currentPedidoId) return;
    await window.pdv.removeItem(itemId, currentPedidoId);
    const newCart = cart.filter((i) => i.itemId !== itemId);
    set({
      cart: newCart,
      total: newCart.reduce((acc, i) => acc + i.PrecoVenda, 0),
    });
  },

  loadCart: async () => {
    const { currentPedidoId } = get();
    if (!currentPedidoId) return;
    const result = await window.pdv.getOrderItens(currentPedidoId);
    if (result.success) {
      set({
        cart: result.data,
        total: result.data.reduce((acc: number, i: any) => acc + Number(i.ValorTotal), 0),
      });
    }
  },

  finalizar: async (formaPagamento) => {
    const { currentPedidoId } = get();
    if (!currentPedidoId) {
      return { success: false, error: 'Não há um pedido ativo para finalizar.' };
    }

    set({ fiscalStatus: 'processing' });
    let paymentRecorded = get().paymentRecorded;

    try {
      if (!paymentRecorded) {
        const paymentResult = await window.pdv.closeOrder(currentPedidoId, formaPagamento);
        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Não foi possível registrar o pagamento.');
        }
        paymentRecorded = true;
        set({ paymentRecorded: true });
      }

      const fiscalResult = await window.pdv.emitDocument(currentPedidoId);
      if (!fiscalResult.success) {
        const fiscalError = fiscalResult.error || 'O serviço fiscal não aceitou a solicitação.';
        set({ fiscalStatus: 'rejected' });
        return {
          success: false,
          error: `Pagamento registrado, mas a emissão da NFC-e falhou: ${fiscalError}`,
        };
      }

      set({ fiscalStatus: 'sent' });
      return {
        success: true,
        protocolo: fiscalResult.protocolo,
        message: 'Pagamento registrado e solicitação da NFC-e enviada. Aguardando retorno fiscal.',
      };
    } catch (error: any) {
      set({ fiscalStatus: 'rejected' });
      const message = error?.message || 'Erro inesperado ao finalizar o pedido.';
      return {
        success: false,
        error: paymentRecorded
          ? `Pagamento registrado, mas ocorreu uma falha na emissão fiscal: ${message}`
          : `Não foi possível registrar o pagamento: ${message}`,
      };
    }
  },

  clear: () =>
    set({
      currentPedidoId: null,
      cart: [],
      total: 0,
      fiscalStatus: 'idle',
      paymentRecorded: false,
      mesa: null,
    }),
}));
