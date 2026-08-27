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

As páginas de definições representam o estado persistido do terminal. Credenciais privadas dos provedores de pagamento não são enviadas para o navegador nem guardadas em estado de cliente. A função `configure_business_payment_channel` guarda-as encriptadas no Supabase Vault, valida a propriedade do negócio e regista a alteração em auditoria sem incluir os valores secretos.

Os campos não secretos são apresentados a partir de `business_payment_channels.public_settings`. Identificadores privados permanecem mascarados. Os canais de fornecedor ficam no estado `testing` depois de receberem credenciais e só devem passar a `active` após validação pelo adaptador oficial do fornecedor.

## Definições e pagamentos

- As seis vistas de definições usam `/negocio/pos/definicoes?vista=...` e o mesmo componente responsivo.
- Os cinco métodos de pagamento usam `/negocio/pos/definicoes/pagamentos?metodo=...` e partilham a mesma fronteira de segurança.
- M-Pesa, e-Mola e mKesh expõem apenas os campos operacionais previstos no design e enviam segredos por ações de servidor para o Vault.
- Dinheiro e cartão guardam limites, regras de fecho, arredondamento, terminal, bandeiras, contactless e custos de processamento na configuração pública autorizada.
- Dados de negócio e filial apresentados no POS são carregados das fontes reais autorizadas por RLS.
- Estados não suportados, como alteração de saldos offline, são apresentados como indisponíveis em vez de simulados.
- Os frames mobile do grupo `584` são adaptações dos mesmos ecrãs; não constituem páginas ou aplicações paralelas.

## Responsividade

No desktop, o portal de negócio e as definições do POS usam navegação lateral, enquanto o POS mantém o cabeçalho operacional. Em ecrãs pequenos, as grelhas convertem-se numa coluna e as definições usam uma barra inferior fixa: seis secções nas definições e cinco métodos nos pagamentos. Todas as opções cabem na largura disponível, sem menu paralelo nem deslocação horizontal.
