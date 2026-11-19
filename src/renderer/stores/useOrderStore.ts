import { create } from 'zustand';

interface OrderState {
  currentPedidoId: number | null;
  cart: any[];
  total: number;
  tipo: 'mesa' | 'balcao' | 'delivery';
  mesa: string | null;
  fiscalStatus: 'idle' | 'processing' | 'sent' | 'authorized' | 'rejected';
  paymentRecorded: boolean;
  customerDocument: string | null;
  finalizeError: string | null;
  applyFiscalCallback: (status: 'AUTORIZADA' | 'REJEITADA', reason?: string) => void;
  setTipo: (tipo: 'mesa' | 'balcao' | 'delivery') => void;
  setMesa: (mesa: string | null) => void;
  createOrder: (responsavelId: number) => Promise<void>;
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  loadCart: () => Promise<void>;
  finalizar: (formaPagamento: string, clienteDocumento?: string) => Promise<{
    success: boolean;
    alenfeId?: number;
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
  customerDocument: null,
  finalizeError: null,

  applyFiscalCallback: (status, reason) => set({
    fiscalStatus: status === 'AUTORIZADA' ? 'authorized' : 'rejected',
    finalizeError: status === 'REJEITADA' ? (reason || 'NFC-e rejeitada pelo serviço fiscal. Consulte o log para detalhes.') : null,
  }),

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
    const { currentPedidoId, cart, paymentRecorded } = get();
    if (!currentPedidoId || paymentRecorded) return;
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
    const { currentPedidoId, cart, paymentRecorded } = get();
    if (!currentPedidoId || paymentRecorded) return;
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

  finalizar: async (formaPagamento, clienteDocumento) => {
    const { currentPedidoId } = get();
    if (!currentPedidoId) {
      return { success: false, error: 'Não há um pedido ativo para finalizar.' };
    }

    const documento = clienteDocumento ?? get().customerDocument ?? undefined;
    set({ fiscalStatus: 'processing', finalizeError: null, customerDocument: documento || null });
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

      const fiscalResult = await window.pdv.emitDocument(currentPedidoId, documento);
      if (!fiscalResult.success) {
        const fiscalError = fiscalResult.error || 'O serviço fiscal não aceitou a solicitação.';
        const errorMessage = `Pagamento registrado, mas a emissão da NFC-e falhou: ${fiscalError}`;
        set({ fiscalStatus: 'rejected', finalizeError: errorMessage });
        return {
          success: false,
          error: errorMessage,
        };
      }

      set({ fiscalStatus: 'sent', finalizeError: null });
      return {
        success: true,
        alenfeId: fiscalResult.alenfeId,
        message: 'Pagamento registrado e solicitação da NFC-e enviada. Aguardando retorno fiscal.',
      };
    } catch (error: any) {
      const message = error?.message || 'Erro inesperado ao finalizar o pedido.';
      const errorMessage = paymentRecorded
        ? `Pagamento registrado, mas ocorreu uma falha na emissão fiscal: ${message}`
        : `Não foi possível registrar o pagamento: ${message}`;
      set({ fiscalStatus: 'rejected', finalizeError: errorMessage });
      return {
        success: false,
        error: errorMessage,
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
      customerDocument: null,
      finalizeError: null,
      mesa: null,
    }),
}));
