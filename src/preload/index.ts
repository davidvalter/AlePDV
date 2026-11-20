import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('pdv', {
    // Configuração
    checkConfig: () => ipcRenderer.invoke('config:check'),
    saveConfig: (config: any) => ipcRenderer.invoke('config:save', config),
    testConnection: () => ipcRenderer.invoke('config:testConnection'),
    openLogFile: () => ipcRenderer.invoke('system:openLogFile'),

    // Auth
    login: (username: string, senha: string) =>
        ipcRenderer.invoke('auth:login', username, senha),

    // Produtos
    getProducts: () => ipcRenderer.invoke('db:getProducts'),
    getCategories: () => ipcRenderer.invoke('db:getCategories'),

    // Pedidos
    createOrder: (data: any) => ipcRenderer.invoke('db:createOrder', data),
    addItem: (item: any) => ipcRenderer.invoke('db:addItem', item),
    removeItem: (itemId: number, pedidoId: number) =>
        ipcRenderer.invoke('db:removeItem', itemId, pedidoId),
    getOrderItens: (pedidoId: number) => ipcRenderer.invoke('db:getOrderItens', pedidoId),
    closeOrder: (pedidoId: number, formaPagamento: string) =>
        ipcRenderer.invoke('db:closeOrder', pedidoId, formaPagamento),
    getOpenOrders: () => ipcRenderer.invoke('db:getOpenOrders'),

    // Fiscal
    getFiscalEnvironment: () => ipcRenderer.invoke('fiscal:getEnvironment'),
    emitDocument: (pedidoId: number, documento?: string) =>
        ipcRenderer.invoke('fiscal:emit', pedidoId, documento),
    onFiscalCallback: (callback: (data: any) => void) => {
        const listener = (_e: Electron.IpcRendererEvent, data: any) => callback(data);
        ipcRenderer.on('fiscal:callback', listener);
        return () => ipcRenderer.removeListener('fiscal:callback', listener);
    },

    // Impressão
    printCupom: (pedidoId: number) => ipcRenderer.invoke('printer:cupom', pedidoId),

    // Caixa
    openCash: (responsavelId: number) => ipcRenderer.invoke('db:openCash', responsavelId),
    getOpenCash: () => ipcRenderer.invoke('db:getOpenCash'),

    // Empresa
    getEmpresa: () => ipcRenderer.invoke('db:getEmpresa'),
});