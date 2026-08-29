import Store from 'electron-store';

let store: Store | null = null;

export function initStore() {
  store = new Store({
    name: 'alecrim-pdv-config',
    encryptionKey: 'alecrim-2024-pdv-secure',
  });
}

export function getStore() {
  if (!store) throw new Error('Store não inicializado');
  return store;
}

export function isConfigured(): boolean {
  const s = getStore();
  return !!(s.get('db.host') && s.get('chave_secreta'));
}