export interface ApiResult<T = undefined> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PdvApi {
    // Configuração
    checkConfig: () => Promise<boolean>;
    saveConfig: (config: any) => Promise<boolean>;
    testConnection: () => Promise<boolean>;
    openLogFile: () => Promise<{ success: boolean; path: string; error?: string }>;

    // Autenticação
    login: (username: string, senha: string) => Promise<{ success: boolean; user?: any; error?: string }>;

    // Cardápio
    getProducts: () => Promise<ApiResult<any[]>>;
    getCategories: () => Promise<ApiResult<string[]>>;

    // Pedidos
    createOrder: (data: any) => Promise<ApiResult<number>>;
    addItem: (data: any) => Promise<ApiResult<number>>;
    removeItem: (itemId: number, pedidoId: number) => Promise<ApiResult>;
    getOrderItens: (pedidoId: number) => Promise<ApiResult<any[]>>;
    closeOrder: (pedidoId: number, formaPagamento: string) => Promise<ApiResult>;
    getOpenOrders: () => Promise<ApiResult<any[]>>;

    // Fiscal
    getFiscalEnvironment: () => Promise<{ success: boolean; ambiente?: string | null; cpfPadraoConfigurado?: boolean; error?: string }>;
    emitDocument: (pedidoId: number, documento?: string) => Promise<{
        success: boolean;
        alenfeId?: number;
        error?: string;
    }>;
    onFiscalCallback: (callback: (data: any) => void) => void;

    // Impressão
    printCupom: (pedidoId: number) => Promise<{ success: boolean; error?: string }>;

    // Caixa
    openCash: (responsavelId: number) => Promise<ApiResult<number>>;
    getOpenCash: () => Promise<ApiResult<any>>;

    // Empresa
    getEmpresa: () => Promise<ApiResult<any>>;
}
