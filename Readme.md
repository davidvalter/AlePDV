# Alecrim PDV

Aplicativo desktop de ponto de venda (PDV) do Alecrim Inteligente, desenvolvido para registrar vendas de produtos e pratos do cardápio. O sistema conecta-se ao banco MySQL do ALESYS e reúne em uma interface local o atendimento, a finalização de pedidos e integrações com serviços externos.

## Propósito

O Alecrim PDV busca agilizar o atendimento no caixa e centralizar o registro de pedidos em um aplicativo desktop. A integração com o banco já usado pelo ALESYS permite consultar o cardápio e persistir pedidos sem manter um catálogo separado no PDV. O projeto também prevê emissão de NFC-e por um serviço fiscal externo e impressão de cupom.

## Funcionalidades

- Configuração inicial da conexão MySQL, endereço base do ALESYS e chave secreta, com opção de testar a conexão.
- Autenticação de operadores consultando os usuários cadastrados no banco.
- Consulta de produtos ativos e categorias do cardápio, com carregamento e cache local de imagens.
- Abertura de pedido de balcão, inclusão e remoção de itens e cálculo do total.
- Finalização do pedido com opções de pagamento em dinheiro, cartão de crédito, cartão de débito ou Pix.
- Integração de emissão de NFC-e com o serviço ALENFE, incluindo recebimento de atualizações por webhook.
- Geração e envio de cupom para impressão silenciosa.
- Handlers e repositórios para operações de caixa, empresa, pagamentos e pedidos.

## Tecnologias

- **Aplicativo desktop:** Electron 31
- **Interface:** React 18, TypeScript, Vite 5 e Tailwind CSS 3
- **Estado da interface:** Zustand
- **Acesso a dados:** MySQL por `mysql2`
- **Integração HTTP e webhook:** Axios e Express
- **Empacotamento:** electron-builder, com configuração de instalador NSIS para Windows

## Estrutura do projeto

```text
src/
├── main/                 # Processo principal do Electron e lógica de integração
│   ├── config/           # Armazenamento local de configurações
│   ├── db/               # Conexão MySQL e repositórios de dados
│   ├── fiscal/           # Emissão fiscal, cliente ALENFE e webhook
│   ├── ipc/              # Comunicação entre interface e processo principal
│   ├── printer/          # Geração e impressão de cupom
│   └── utils/            # Cache de imagens
├── preload/              # API segura exposta à interface Electron
├── renderer/             # Interface React
│   ├── components/       # Componentes de produto, categorias, carrinho e status fiscal
│   ├── pages/            # Telas de boas-vindas, configuração, login, PDV e painel
│   └── stores/           # Estado de autenticação, pedidos e produtos
└── shared/types/         # Tipos compartilhados de banco e API
```

Na raiz também ficam `package.json` e `package-lock.json` (dependências e comandos), `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js` e as configurações do TypeScript.

## Instalação e execução

### Pré-requisitos

- Node.js e npm instalados. O repositório não especifica uma versão mínima.
- Acesso a uma instância MySQL com o banco e as tabelas esperadas pelo ALESYS.
- Credenciais válidas do banco. Para os fluxos correspondentes, também são necessários o endereço do ALESYS e a configuração do serviço ALENFE.

### Executar em desenvolvimento

```bash
git clone https://github.com/davidvalter/AlePDV.git
cd AlePDV
npm install
npm run dev
```

Na primeira execução, use a tela de configuração inicial para informar host, porta, banco, usuário e senha do MySQL. O nome padrão do banco é `alesys`; confirme os dados com o ambiente ALESYS utilizado. Informe também a URL base do ALESYS para carregar imagens do cardápio.

### Compilar e empacotar

```bash
npm run build
npm run package
```

`npm run build` compila o processo principal e a interface. `npm run package` também aciona o electron-builder; a configuração do projeto define saída em `release/` e instalador NSIS para Windows.

## Observações

- O projeto depende de um banco ALESYS existente. Não há scripts de criação ou migração de esquema neste repositório. Para as imagens, o banco deve ter a evolução de miniaturas centralizadas aplicada: `Produtos.ImagemId` e `Pratos.ImagemId` apontam para `Midias`, cuja coluna `CaminhoMiniatura` contém o caminho web servido pelo ALESYS. O PDV monta a URL usando a URL base configurada. Em instalações com imagens legadas, aplique a migração documentada em `database/migrar_miniaturas.php` no repositório ALESYS antes de remover as colunas antigas.
- A integração fiscal usa o ALENFE e a emissão está configurada no código para o ambiente de **homologação**. O funcionamento depende das configurações e da disponibilidade desse serviço externo.
- A tela **Pedidos Abertos** está identificada no código como em desenvolvimento. A presença de repositórios ou handlers de caixa não significa que todos esses fluxos estejam disponíveis na interface.
- O repositório inclui uma licença GNU GPL versão 3 (`LICENSE`). Consulte o arquivo para os termos completos.
