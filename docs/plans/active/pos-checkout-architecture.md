# Arquitetura do checkout POS VUYELA

## Estado

Fundação do checkout POS implementada em 29 de agosto de 2026. A integração M-Pesa permanece como
a próxima etapa deste plano.

## Entrega concluída

- catálogo pesquisável e filtrável com carrinho de várias linhas e quantidades;
- venda sem cartão VUYELA;
- identificação opcional e tardia por QR, número do cartão ou telefone;
- desconto de fidelização configurável por produto ou serviço na área do negócio;
- cotação autoritativa no servidor e nova validação atómica antes da confirmação;
- utilização e crédito de YELAS na mesma compra através do ledger existente;
- autorização do cliente exigida apenas quando há débito de YELAS;
- linhas imutáveis da venda em `transaction_items`;
- reconciliação de numerário e cartão bancário com idempotência;
- UI responsiva validada em desktop e Pixel 5;
- migration aplicada ao projeto Supabase de produção.

Ficam para as entregas seguintes o adaptador M-Pesa, callbacks assíncronos, pagamentos divididos,
vendas suspensas/retomadas, autorização forte de resgate e reembolsos operacionais no POS.

## Objetivo

Transformar o POS VUYELA num aplicativo de caixa rápido, independente do portal do negócio e
seguro para vendas com ou sem cartão de fidelização. A venda deve começar no catálogo, manter o
carrinho como centro do fluxo e aplicar cliente, descontos, YELAS e pagamentos apenas quando forem
relevantes.

O desenho precisa servir restaurantes, retalho e serviços sem obrigar todos os negócios a usar a
mesma densidade de catálogo ou o mesmo método de pagamento.

## Diagnóstico da implementação atual

A fundação existente já oferece:

- negócio, filial e terminal persistentes;
- funções de proprietário, administrador, gestor de filial e caixa;
- catálogo persistente por negócio e filial;
- identificação do cliente por QR, número do cartão ou telefone;
- tentativas de pagamento idempotentes e pagamentos reconciliados;
- cálculo e ledger transacional de YELAS;
- PWA POS separada e acesso limitado a membros autorizados.

As principais limitações do fluxo atual são:

- a identificação do cartão é o primeiro passo obrigatório;
- uma venda sem cartão não pode ser concluída;
- o estado guarda um único `catalogItemId`, não um carrinho com várias linhas e quantidades;
- o desconto é recebido como um total, sem explicar a regra e os itens abrangidos;
- M-Pesa, e-Mola e mKesh existem no modelo, mas permanecem indisponíveis sem adaptador real;
- uma confirmação genérica do caixa representa a autorização do cliente para usar YELAS;
- o fluxo rígido de cinco passos cria mais navegação do que um caixa precisa;
- a transação guarda totais, mas não possui linhas imutáveis dos produtos vendidos;
- alterações de preço, falhas assíncronas e recuperação de uma venda interrompida não têm uma
  experiência completa.

## Referências estudadas

Os padrões relevantes observados nas fontes oficiais são:

- Square começa o checkout pela construção do carrinho e permite pesquisa, categorias, grelha,
  código de barras, quantidades, variantes e notas.
- Square e Shopify distinguem descontos por linha de descontos sobre a encomenda completa.
- Shopify permite associar o cliente a partir do carrinho, sem tornar a identificação condição
  para iniciar a venda.
- Shopify trata crédito de loja como uma forma de reduzir o valor ainda a pagar e exige permissões
  específicas do staff.
- Square mantém a encomenda, as linhas, os ajustes de preço e os pagamentos como conceitos
  relacionados, mas distintos.
- Stripe modela cada tentativa financeira como uma máquina de estados idempotente e recomenda a
  confirmação final pelo servidor e por eventos do provedor.
- M-Pesa Moçambique disponibiliza C2B síncrono e assíncrono, consulta de estado e reversões, o que
  exige um fluxo que suporte pagamentos pendentes e callbacks.

Fontes:

- [Square: construir o carrinho](https://squareup.com/help/us/en/article/8238-build-your-customer-s-cart-in-the-square-retail-pos-app)
- [Square: aplicar descontos](https://squareup.com/help/us/en/article/5362-apply-discounts)
- [Square Orders API](https://developer.squareup.com/docs/orders-api/what-it-does)
- [Square: descontos e ajustes por encomenda ou linha](https://developer.squareup.com/docs/orders-api/apply-taxes-and-discounts)
- [Shopify POS](https://help.shopify.com/en/manual/sell-in-person/shopify-pos)
- [Shopify: associar cliente ao carrinho](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/customer-management/add-customer-profile-to-cart)
- [Shopify: descontos no POS](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/discount-management/applying-discounts)
- [Shopify: utilizar crédito no POS](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/payment-management/store-credit/redeem-store-credit)
- [Stripe Payment Intents](https://docs.stripe.com/payments/payment-intents)
- [Stripe Terminal offline](https://docs.stripe.com/terminal/features/operate-offline/collect-card-payments)
- [Vodacom Moçambique: API aberta M-Pesa](https://www.vm.co.mz/m-pesa/artigo/api-aberta-do-m-pesa)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)

## Decisão principal

O POS deixa de ser um assistente linear centrado no cartão e passa a ser um checkout centrado na
venda.

Existem apenas dois momentos principais para o caixa:

1. **Venda**: selecionar produtos ou serviços e construir o carrinho.
2. **Cobrança**: associar opcionalmente o cliente, aplicar benefícios e receber o pagamento.

Confirmação e recibo são estados destes momentos, não páginas permanentes da navegação.

## Fluxo normal recomendado

### 1. Abrir uma venda

O POS abre diretamente no catálogo associado ao negócio, filial e terminal autenticados. O topo
mostra apenas o contexto operacional indispensável:

- negócio e filial;
- terminal;
- operador;
- estado da ligação e sincronização;
- ação para terminar sessão ou trocar de turno quando autorizado.

O operador não volta a escolher o negócio durante cada venda. A troca de contexto é uma operação
separada e protegida.

### 2. Construir o carrinho

O caixa pode:

- navegar por categorias;
- pesquisar por nome ou SKU;
- usar produtos favoritos configurados para o terminal;
- ler código de barras quando o catálogo o suportar;
- adicionar vários itens;
- alterar quantidade;
- selecionar variantes ou modificadores futuros;
- adicionar uma nota;
- remover uma linha ou limpar o carrinho;
- guardar a venda para retomar depois, quando tiver permissão.

Itens iguais podem ser agrupados numa linha com quantidade. Itens com modificadores diferentes
permanecem separados.

### 3. Rever a venda

Antes da cobrança, o carrinho apresenta:

- subtotal;
- descontos automáticos já conhecidos;
- itens não elegíveis para desconto;
- taxas ou encargos, quando forem futuramente configurados;
- total provisório.

O botão principal deve dizer `Rever e cobrar`, acompanhado do valor. O caixa pode sempre recuar ao
catálogo sem perder o carrinho.

### 4. Associar o cliente ou cartão VUYELA

Na cobrança existe a ação opcional `Adicionar cartão VUYELA` com quatro métodos:

- ler o QR de identificação;
- introduzir o número do cartão;
- procurar pelo telefone;
- continuar sem cartão.

Associar o cartão recalcula imediatamente o carrinho no servidor e apresenta:

- identidade mascarada do cliente;
- estado do cartão;
- YELAS disponíveis;
- descontos exclusivos aplicados;
- produtos abrangidos;
- poupança total;
- YELAS que a compra poderá gerar.

O cartão não concede desconto por si só. Ele ativa apenas as regras de preço e benefícios que o
negócio configurou para esse programa, produto, categoria, filial ou período.

O caixa pode remover ou substituir o cartão antes de iniciar o pagamento. Qualquer alteração volta
a calcular a cotação.

### 5. Utilizar YELAS

Ganhar YELAS não exige uma autorização adicional do cliente. Utilizar YELAS exige prova explícita
e independente da identificação.

Métodos previstos para autorização de resgate:

- QR de utilização temporário, assinado e de uso único, gerado pela aplicação do cliente;
- código curto de utilização com expiração;
- PIN do cliente, apenas depois de existir um mecanismo seguro para o configurar e validar;
- confirmação no dispositivo do cliente, quando notificações em tempo real estiverem disponíveis.

Pesquisar pelo telefone ou ler o QR permanente identifica o cartão, mas nunca autoriza sozinho a
utilização de saldo.

O POS mostra o máximo utilizável, permite escolher a quantidade e atualiza o total antes da
confirmação. O cliente deve conseguir ver claramente:

- YELAS antes da compra;
- YELAS utilizadas;
- respetivo valor promocional em MZN;
- valor ainda a pagar;
- YELAS estimadas a ganhar.

### 6. Escolher o pagamento

O POS apresenta apenas os canais ativos para aquela combinação de negócio, filial e terminal:

- numerário;
- terminal bancário externo;
- M-Pesa;
- e-Mola;
- mKesh;
- pagamento integral com YELAS, quando o total líquido for zero.

Métodos de provedor passam por `iniciado`, `pendente`, `autorizado`, `recusado`, `expirado` e
`reconciliado`. Um estado pendente mantém o carrinho bloqueado para evitar cobranças duplicadas e
oferece `Consultar estado` ou `Cancelar`, quando o provedor permitir.

Uma recusa preserva o carrinho e permite escolher outro método. Uma resposta perdida no browser é
recuperada pelo identificador da transação e pelo estado guardado no servidor.

O modelo de dados deve aceitar vários pagamentos para a mesma venda, mesmo que a primeira versão
da interface disponibilize apenas um método de cada vez. Isso permite pagamento parcial e divisão
de métodos sem reconstruir a arquitetura.

### 7. Concluir

A venda só fica `completed` quando:

- o pagamento necessário estiver reconciliado; ou
- o total líquido for zero e a autorização do resgate estiver confirmada.

No mesmo limite transacional, o servidor:

- valida novamente preços e regras;
- impede reutilização da cotação;
- conclui a venda;
- grava os pagamentos confirmados;
- ativa o cartão quando a regra for `primeira compra`;
- cria o débito de YELAS, quando existir;
- cria o crédito de novas YELAS, quando existir;
- produz o recibo e o registo de auditoria.

O ecrã final mostra total, método, poupança, movimentos de YELAS e ações `Nova venda`, `Ver recibo`
e `Enviar recibo` quando o canal estiver configurado.

## Ordem de cálculo

O servidor é a única autoridade de preço. O navegador envia identificadores, quantidades e
intenções, nunca totais confiáveis.

Ordem inicial definida:

```text
subtotal = soma(preço_unitário * quantidade)
descontos_de_item = regras elegíveis aplicadas a linhas específicas
descontos_de_encomenda = regras elegíveis aplicadas ao restante subtotal
total_após_descontos = subtotal - descontos_de_item - descontos_de_encomenda
valor_yelas = min(valor solicitado, saldo, limite configurado, total elegível)
total_a_pagar = total_após_descontos - valor_yelas
base_de_acumulação = total_a_pagar elegível
yelas_a_creditar = floor(base_de_acumulação * taxa_de_acumulação)
```

Regras obrigatórias:

- dinheiro usa unidades inteiras de centavos, nunca `float`;
- nenhum desconto torna uma linha ou venda negativa;
- uma regra declara se combina ou não com outras regras;
- descontos de valor fixo são distribuídos pelas linhas elegíveis para relatórios e reembolsos;
- taxas futuras são calculadas numa fase explícita, nunca escondidas dentro do desconto;
- débito e crédito de YELAS são movimentos separados ligados à mesma transação;
- reembolsos criam movimentos compensatórios e não alteram o ledger histórico;
- o recibo guarda os preços e regras aplicados no momento da venda.

## Experiência por dispositivo

### Desktop e tablet

- catálogo à esquerda;
- carrinho fixo à direita;
- pesquisa e categorias sempre acessíveis;
- resumo e ação de cobrança no fundo do carrinho;
- painel de cobrança substitui o catálogo sem desmontar o resumo da venda;
- atalhos de teclado apenas como melhoria, nunca como única forma de operar.

### Telemóvel

- catálogo ocupa o ecrã;
- barra inferior fixa mostra quantidade e total do carrinho;
- tocar na barra abre o carrinho como vista completa;
- cobrança usa secções progressivas: cliente, benefícios e pagamento;
- uma única ação principal por estado;
- recuar preserva dados; cancelar uma venda não vazia exige confirmação.

### Navegação do aplicativo POS

A navegação do caixa deve ser curta e independente do portal do negócio:

- `Caixa`;
- `Vendas`;
- `Sincronização` ou `Estado`, quando necessário;
- `Conta`.

Catálogo, equipa, terminais, preços e integrações são administrados no portal do negócio. O POS lê
essas configurações, mas não expõe controlos administrativos a um caixa.

## Permissões recomendadas

### Caixa

- criar e cobrar vendas;
- associar clientes;
- usar descontos automáticos;
- consultar as próprias vendas e recibos;
- cancelar um carrinho antes do pagamento.

### Gestor de filial

- todas as permissões do caixa;
- aplicar desconto manual dentro do limite configurado;
- anular venda e autorizar correções;
- consultar vendas da filial;
- resolver uma venda pendente.

### Administrador ou proprietário

- configurar catálogo, descontos, meios de pagamento e terminais no portal do negócio;
- definir limites de desconto e anulação;
- gerir operadores;
- iniciar reembolsos e consultar auditoria completa.

Operações elevadas usam confirmação do gestor e ficam associadas ao operador que pediu e ao que
autorizou.

## Arquitetura de dados recomendada

As tabelas existentes continuam como fundação:

- `business_catalog_items`;
- `pos_terminals` e configurações relacionadas;
- `business_members`;
- `transactions`;
- `payment_attempts`;
- `transaction_payments`;
- `point_ledger` e `point_wallets`.

Extensões necessárias, sem criar uma segunda versão paralela do POS:

### `transaction_items`

Snapshot imutável das linhas vendidas:

- transação, negócio e filial;
- item de catálogo opcional;
- SKU, nome e descrição no momento da venda;
- quantidade;
- preço unitário;
- subtotal bruto;
- desconto atribuído;
- total líquido;
- metadados sanitizados de variante ou nota.

### `pricing_rules`

Regras administradas pelo negócio:

- tipo `percentage` ou `fixed`;
- âmbito `line` ou `order`;
- ativação `automatic`, `loyalty_card`, `offer_code` ou `manual`;
- valor, prioridade e combinação;
- mínimo de quantidade ou valor;
- início e fim;
- negócio, filial e estado.

### `pricing_rule_targets`

Associa uma regra a produtos ou categorias. Uma regra sem alvo explícito pode abranger a venda
completa quando o seu âmbito permitir.

### `transaction_adjustments`

Snapshot de cada desconto ou ajuste aplicado:

- regra de origem opcional;
- linha ou encomenda abrangida;
- tipo e valor;
- montante calculado;
- motivo;
- operador responsável por um ajuste manual.

### Extensões de `transactions`

- versão para concorrência otimista;
- momento e expiração da cotação;
- estado de liquidação;
- número de recibo;
- origem da venda;
- cartão continua opcional;
- totais permanecem derivados das linhas e ajustes.

O estado `draft` representa o carrinho persistido. Pagamento pendente não é venda concluída. Uma
venda com total zero pode ser concluída sem criar um `transaction_payments` de valor zero.

## Limites de servidor

### Cotação

`quote_pos_sale` recebe negócio, filial, terminal, itens, cartão opcional e intenção de resgate.
O servidor:

- valida acesso do operador;
- lê preços atuais;
- avalia regras;
- valida cartão e saldo;
- devolve linhas, ajustes, totais, versão e expiração da cotação.

### Pagamento

`initiate_pos_payment` valida a versão da cotação e cria ou reutiliza uma tentativa idempotente. Os
adaptadores de provedor implementam um contrato comum para iniciar, consultar, cancelar, reverter
e validar callbacks.

### Conclusão

`finalize_pos_sale` é interna e chamada apenas depois da reconciliação financeira ou confirmação
manual autorizada. A conclusão e todos os movimentos de YELAS ocorrem atomicamente.

As funções expostas devem ter execução revogada por defeito, concessões explícitas, validação de
negócio e filial e testes RLS de permissão e negação. Funções `SECURITY DEFINER` justificadas ficam
fora de caminhos públicos genéricos, usam `search_path` vazio e validam o utilizador dentro da
função.

## Pagamentos e adaptadores

Cada provedor implementa o mesmo contrato, mas conserva os seus estados e referências:

```text
createAttempt
queryStatus
cancelAttempt
reversePayment
verifyCallback
```

- credenciais ficam no servidor ou Supabase Vault;
- o browser recebe apenas configuração mascarada;
- callbacks são autenticados e idempotentes;
- `provider_reference` é única por canal;
- um callback repetido não duplica pagamento, venda ou YELAS;
- a aplicação consulta o estado quando o callback demora;
- Realtime privado pode melhorar a atualização do POS, mas polling autenticado continua como
  recuperação.

M-Pesa pode usar C2B síncrono ou assíncrono. e-Mola e mKesh só aparecem como integrados depois de
existirem documentação, credenciais e callbacks validados. O terminal bancário externo permanece
um método manual até existir adquirente integrado.

## Operação com ligação instável

A primeira implementação não deve prometer pagamento de provedor nem movimentação de YELAS
offline.

Com ligação instável, o POS pode:

- manter o carrinho local enquanto a sessão estiver aberta;
- recuperar um rascunho já persistido;
- mostrar catálogo previamente carregado com indicação da última sincronização;
- consultar pagamentos que ficaram pendentes;
- impedir a conclusão financeira quando não consegue validar o servidor.

Uma futura fila offline para numerário deve criar vendas provisórias sem YELAS e só concluir após
sincronização e verificação de duplicados. Esse risco precisa de limites por terminal, valor e
quantidade antes de ser ativado.

## Recuperação de falhas

| Situação                                 | Comportamento esperado                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| QR ou cartão inválido                    | Manter o carrinho e permitir tentar novamente ou continuar sem cartão.           |
| Cartão suspenso                          | Explicar que não pode aplicar benefícios; nunca expor o motivo privado ao caixa. |
| Sem desconto elegível                    | Associar o cartão e mostrar claramente que não há benefício nesta venda.         |
| Preço alterado                           | Recalcular, destacar a diferença e pedir nova confirmação antes do pagamento.    |
| Saldo de YELAS alterado                  | Recalcular o máximo utilizável e invalidar a autorização anterior.               |
| Pagamento recusado                       | Preservar o carrinho e permitir outro método.                                    |
| Pagamento pendente                       | Bloquear nova cobrança, consultar estado e permitir recuperação.                 |
| Browser fecha após cobrança              | Recuperar a venda pelo servidor e mostrar recibo ou estado pendente.             |
| Duplo clique ou callback repetido        | Reutilizar a mesma chave idempotente sem duplicar efeitos.                       |
| Pagamento confirmado e fidelização falha | Manter pagamento reconciliado numa fila de resolução; não cobrar novamente.      |
| Reembolso                                | Criar pagamento/reversão e movimentos compensatórios de YELAS auditáveis.        |

## Métricas de experiência e operação

O lançamento deve medir:

- tempo entre primeiro item e cobrança;
- número médio de toques por venda;
- abandono de carrinho;
- taxa de associação de cartão;
- taxa de utilização de YELAS;
- tempo e falhas por método de pagamento;
- pagamentos pendentes ou reconciliados manualmente;
- descontos manuais por operador;
- duplicações evitadas por idempotência;
- diferenças entre cotação e conclusão.

Objetivos iniciais:

- produto favorito adicionado em até dois toques;
- venda simples em numerário concluída sem cartão e sem passos desnecessários;
- cartão associado sem perder o carrinho;
- método recusado recuperado sem recriar a venda;
- nenhuma movimentação de YELAS antes da confirmação financeira;
- nenhuma duplicação por repetição de ação ou callback.

## Casos de aceitação prioritários

1. Vender vários produtos sem cartão e pagar em numerário.
2. Associar cartão no fim e aplicar desconto apenas aos produtos elegíveis.
3. Associar cartão sem benefício e concluir pelo preço normal.
4. Utilizar YELAS com autorização temporária e pagar o restante.
5. Utilizar e ganhar YELAS na mesma compra com dois movimentos no histórico.
6. Ativar uma adesão configurada para primeira compra depois do pagamento confirmado.
7. Recusar M-Pesa e repetir com numerário sem perder o carrinho.
8. Receber callback M-Pesa duplicado sem duplicar pagamento ou YELAS.
9. Recuperar no POS uma venda cujo browser fechou durante pagamento pendente.
10. Impedir caixa sem permissão de aplicar desconto manual ou anular venda.
11. Reembolsar uma venda e criar movimentos compensatórios.
12. Operar corretamente em telemóvel, tablet e desktop sem navegação duplicada.

## Sequência de implementação recomendada

1. Validar este fluxo e fechar regras de descontos, autorização e pagamento.
2. Criar linhas de transação, regras de preço, ajustes e estados necessários.
3. Implementar o motor de cotação no servidor com testes unitários e de propriedade.
4. Refazer o POS como catálogo e carrinho, mantendo o aplicativo e autenticação atuais.
5. Adicionar cartão opcional, descontos elegíveis e autorização forte de YELAS.
6. Ligar numerário e terminal externo manual ao novo fluxo.
7. Implementar o adaptador M-Pesa e callbacks em ambiente de testes.
8. Adicionar recuperação de vendas, recibos, reembolsos e auditoria.
9. Executar testes RLS, concorrência, integração e Playwright por dispositivo.
10. Fazer piloto com uma filial e métricas antes de ativar outros provedores.

## Defaults de produto recomendados

Para iniciar a implementação sem introduzir opções excessivas no primeiro lançamento:

- aplicar automaticamente a melhor vantagem e não acumular descontos, exceto quando uma regra for
  explicitamente marcada como combinável;
- impedir descontos manuais para o caixa por defeito e exigir autorização do gestor;
- manter a cotação válida durante cinco minutos e invalidá-la ao alterar carrinho, cartão ou YELAS;
- autorizar resgates com QR temporário ou código curto, ambos de uso único;
- preparar vários pagamentos no modelo, mas entregar primeiro uma cobrança por método;
- permitir rascunho e recuperação sem ligação, mas não concluir pagamentos ou YELAS offline;
- ativar adesão por primeira compra apenas depois de o pagamento ficar reconciliado;
- calcular novas YELAS sobre o valor elegível realmente pago depois de descontos e resgate;
- aplicar descontos específicos apenas às linhas elegíveis e mostrar a poupança por linha;
- preservar o carrinho em recusas, falhas de rede e troca de método de pagamento.

## Decisões ainda a validar com o produto

- se descontos de membro e ofertas podem acumular ou se vence a maior vantagem;
- limite e aprovação de descontos manuais;
- validade da cotação antes de exigir recálculo;
- autorização inicial de resgate: QR temporário, código ou ambos;
- possibilidade e limites de pagamentos divididos na primeira entrega;
- política de venda provisória em numerário sem ligação;
- formato fiscal e canais do recibo em Moçambique;
- regras de taxas, gorjetas e arredondamento, caso sejam necessárias;
- comportamento da primeira compra quando a adesão exige taxa ou aprovação manual.
