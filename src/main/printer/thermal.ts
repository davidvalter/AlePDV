import { BrowserWindow } from 'electron';
import { pedidoRepo } from '../db/repositories/pedidoRepo';

export const printer = {
    async printCupom(
        pedidoId: number
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const pedido = await pedidoRepo.getById(pedidoId);
            const itens = await pedidoRepo.getItens(pedidoId);
            if (!pedido) return { success: false, error: 'Pedido não encontrado' };

            const html = buildCupomHTML(pedido, itens);
            const win = new BrowserWindow({
                show: false,
                width: 350,
                height: 600,
            });

            win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
            win.webContents.on('did-finish-load', () => {
                win.webContents.print(
                    {
                        silent: true,
                        printBackground: true,
                        margins: { marginType: 'none' as any },
                    },
                    () => setTimeout(() => win.close(), 500)
                );
            });

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },
};

function buildCupomHTML(pedido: any, itens: any[]): string {
    const itensHTML = itens
        .map(
            (item) => `
      <tr>
        <td style="width:30px;vertical-align:top;font-size:11px">${item.Quantidade}x</td>
        <td style="font-size:11px">${item.CardapioNome ?? ''}</td>
        <td style="text-align:right;font-size:11px;white-space:nowrap">R$ ${(item.Quantidade * item.ValorUnitario).toFixed(2)}</td>
      </tr>`
        )
        .join('');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:280px;font-family:'Courier New',monospace;color:#000;padding:4px}
  .center{text-align:center}
  .line{border-top:1px dashed #000;margin:4px 0}
  table{width:100%;border-collapse:collapse}
  .total{font-size:14px;font-weight:bold}
</style></head><body>
  <div class="center">
    <strong>ALECRIM INTELIGENTE</strong><br/>
    <span style="font-size:10px">CNPJ: XX.XXX.XXX/0001-XX</span><br/>
    <span style="font-size:10px">${new Date().toLocaleString('pt-BR')}</span>
  </div>
  <div class="line"></div>
  <table>${itensHTML}</table>
  <div class="line"></div>
  <table>
    <tr>
      <td class="total">TOTAL</td>
      <td class="total" style="text-align:right">R$ ${Number(pedido.ValorTotal).toFixed(2)}</td>
    </tr>
  </table>
  <div class="line"></div>
  <div class="center" style="font-size:10px;margin-top:8px">
    Pedido #${pedido.Id} · ${pedido.Tipo.toUpperCase()}<br/>
    Obrigado pela preferência!
  </div>
</body></html>`;
}