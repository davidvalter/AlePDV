import type { PdvApi } from '@shared/types/api';

declare global {
  interface Window {
    pdv: PdvApi;
  }
}
export {};