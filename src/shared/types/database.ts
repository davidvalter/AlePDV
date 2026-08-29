export interface Cardapio {
  Id: number;
  Nome: string;
  Descricao: string | null;
  TipoItem: 'produto' | 'prato';
  ProdutoId: number | null;
  PratoId: number | null;
  PrecoVenda: number;
  Categoria: string | null;
  Imagem: string | null;
  Ativo: boolean;
  CriadoEm: Date;
}

export interface Produtos {
  Codigo: number;
  Nome: string;
  Descricao: string | null;
  CodigoBarras: string | null;
  UnidadeMedida: string;
  Categoria: string | null;
  DataCadastro: Date;
  Ativo: boolean;
  TipoProduto: 'insumo' | 'vendavel';
  CategoriaVenda: string | null;
  NCM: string | null;
  CFOP: string | null;
  CSOSN: string | null;
  CEST: string | null;
}

export interface Pedidos {
  Id: number;
  DataAbertura: Date;
  DataFechamento: Date | null;
  Status: 'aberto' | 'fechado' | 'cancelado';
  Tipo: 'mesa' | 'delivery' | 'balcao' | 'manual';
  FormaPagamentoId: number | null;
  Mesa: string | null;
  Cliente: string | null;
  ValorTotal: number;
  Observacoes: string | null;
  ResponsavelId: number;
  StatusNFe: 'pendente' | 'emitindo' | 'emitida' | 'erro';
  ChaveNFe: string | null;
  ProtocoloNFe: string | null;
  XMLNFe: string | null;
  DataEmissaoNFe: Date | null;
}

export interface ItensPedido {
  Id: number;
  PedidoId: number;
  PratoId: number | null;
  Quantidade: number;
  ValorUnitario: number;
  ValorTotal: number;
  Status: 'pendente' | 'preparando' | 'entregue' | 'cancelado';
  CardapioId: number | null;
  TipoItem: 'produto' | 'prato' | null;
}

export interface VendasNFCE {
  Id: number;
  PedidoId: number;
  NfceId: number | null;
  ChaveAcesso: string | null;
  Protocolo: string | null;
  Status: 'PENDENTE' | 'ENVIADA' | 'AUTORIZADA' | 'CONTINGENCIA' | 'REJEITADA' | 'CANCELADA' | 'ERRO';
  MotivoRejeicao: string | null;
  XmlProc: string | null;
  PayloadEnvio: object | null;
  Tentativas: number;
  CriadoEm: Date;
  AtualizadoEm: Date;
}

export interface Usuarios {
  Id: number;
  Username: string;
  NomeCompleto: string;
  Senha: string;
  Salt: string;
  Ativo: boolean;
  perfil_id: number;
}