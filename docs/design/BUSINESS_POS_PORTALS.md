# Portais de Negócio e POS

## Estrutura visual

Os ecrãs Figma dos grupos `485`, `488`, `491`, `492`, `497`, `500` e `584` usam duas estruturas partilhadas:

- `BusinessPortalShell` para a área de gestão do negócio;
- `PosPortalShell` para transações e definições do terminal.

As vistas são selecionadas por parâmetros validados no servidor. Não devem ser criadas versões paralelas das mesmas páginas.

## Dados e operações

- As vistas do negócio reutilizam os dados reais do painel, campanhas, subscrição, indicações e definições.
- A mudança de negócio ou filial conserva o âmbito multi-tenant validado no servidor.
- A exportação analítica gera CSV a partir das transações autorizadas já carregadas.
- O POS identifica clientes por QR Code, cartão ou telefone e mantém as operações de saldo nas funções transacionais PostgreSQL.
- A descrição do serviço e o método de pagamento são registados nos metadados da transação.

## Segurança das definições POS

As páginas de definições representam o estado e os requisitos do terminal. Credenciais privadas dos provedores de pagamento não são enviadas para o navegador nem guardadas em estado de cliente. Uma integração futura deve persistir esses segredos apenas no servidor, com encriptação, RLS, validação de propriedade do negócio e auditoria.

Os campos públicos de configuração podem ser apresentados a partir de `business_payment_channels.public_settings`. Identificadores privados permanecem mascarados e a ativação de um canal continua dependente de uma configuração válida no servidor.

## Definições e pagamentos

- As seis vistas de definições usam `/negocio/pos/definicoes?vista=...` e o mesmo componente responsivo.
- Os cinco métodos de pagamento usam `/negocio/pos/definicoes/pagamentos?metodo=...` e partilham a mesma fronteira de segurança.
- Dados de negócio e filial apresentados no POS são carregados das fontes reais autorizadas por RLS.
- Estados não suportados, como alteração de saldos offline, são apresentados como indisponíveis em vez de simulados.
- Os frames mobile do grupo `584` são adaptações dos mesmos ecrãs; não constituem páginas ou aplicações paralelas.

## Responsividade

No desktop, o portal de negócio e as definições do POS usam navegação lateral, enquanto o POS mantém o cabeçalho operacional. Em ecrãs pequenos, as grelhas convertem-se numa coluna e as definições usam uma barra inferior fixa com as opções secundárias no menu `Mais`. Nenhuma vista deve provocar deslocação horizontal da página.
