# Contratos dos fluxos operacionais

## Objetivo

Estes contratos fecham as regras funcionais introduzidas pelos desenhos NEW PHAS antes da
implementação dos controlos das áreas Negócio, POS, Cliente e Administração.

## Regras invariantes

- um ecrã não pode apresentar uma integração como ativa sem um registo persistido que o confirme;
- todas as relações operacionais devem preservar o mesmo `business_id` e, quando aplicável, a
  filial autorizada;
- credenciais, tokens, chaves privadas e payloads brutos de provedores não pertencem a tabelas
  legíveis pelo navegador;
- uma autorização financeira nunca altera pontos;
- uma operação de fidelização nunca substitui a confirmação financeira;
- alterações de saldo continuam exclusivamente nas RPCs transacionais existentes e criam sempre
  um lançamento no ledger;
- estados privilegiados são alterados apenas por operações de servidor auditáveis.

## Terminal POS

Um terminal passa por `provisioning`, `active`, `suspended` ou `revoked`. A abertura da página POS
num navegador não cria nem ativa um terminal. `active` exige `activated_at`; `suspended` e
`revoked` exigem os respetivos instantes.

As definições, dispositivos e canais de pagamento herdam o negócio do terminal. A leitura para o
navegador é feita por `get_pos_terminal_configuration`, depois da validação do negócio e da filial.

## Pagamentos

Os canais podem operar em modo `manual` ou `provider`. Um canal de provedor só pode ficar `active`
depois de existir uma referência de credenciais configuradas no servidor. A base de dados guarda
apenas identificação mascarada e configuração pública.

Cada tentativa financeira usa uma chave de idempotência por negócio e percorre `initiated`,
`pending`, `authorized`, `declined`, `cancelled`, `expired` ou `reconciled`. Apenas uma tentativa
autorizada e reconciliada poderá originar um `transaction_payments` nas fases transacionais
seguintes.

Até existirem contratos e credenciais reais, M-Pesa, e-Mola e mKesh permanecem indisponíveis. O
dinheiro usa confirmação manual no balcão. O cartão usa confirmação manual depois da aprovação no
terminal bancário externo.

## Catálogo, equipa e cliente

- serviços e produtos pertencem ao negócio e podem ser limitados a uma filial;
- convites de equipa guardam apenas o hash do token, nunca o token original;
- preferências e favoritos pertencem ao próprio cliente e exigem um cartão ativo no negócio;
- uma oferta ativada mantém estado e vínculo ao cliente, cartão, negócio e eventual transação;
- a data de nascimento é opcional; suspensão de conta exige instante e motivo coerentes.

## Suporte e administração

Mensagens de suporte herdam o requerente e o negócio do ticket. Mensagens internas nunca podem ser
criadas como se fossem do requerente. Configurações globais são não secretas, não têm acesso direto
para utilizadores autenticados e serão alteradas por operações administrativas auditadas.
