export interface PdvApi {
    login: (username: string, senha: string) => Promise<{ success: boolean; user?: any; error?: string }>;
    logout: () => Promise<void>;
    checkConfig: () => Promise<boolean>;
    getProducts: () => Promise<any[]>;
    getCategories: () => Promise<string[]>;
    createOrder: (data: any) => Promise<{ success: boolean; data?: number; error?: string }>;
    addItem: (data: any) => Promise<{ success: boolean; data?: number; error?: string }>;
    getOrderItens: (pedidoId: number) => Promise<any[]>;
    closeOrder: (pedidoId: number, formaPagamentoId: number) => Promise<{ success: boolean; error?: string }>;
    emitDocument: (pedidoId: number) => Promise<{ success: boolean; error?: string }>;
    onFiscalCallback: (callback: (data: any) => void) => void;
    printCupom: (pedidoId: number) => Promise<{ success: boolean; error?: string }>;
}