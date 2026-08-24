# Portais de Negócio e POS

## Estrutura visual

Os ecrãs Figma dos grupos `485`, `488`, `491`, `492`, `497` e `500` usam duas estruturas partilhadas:

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

## Responsividade

No desktop, o portal de negócio usa navegação lateral e o POS usa cabeçalho operacional. Em ecrãs pequenos, a navegação passa a horizontal e rolável, as grelhas convertem-se numa coluna e as tabelas mantêm deslocação interna sem causar deslocação horizontal da página.
