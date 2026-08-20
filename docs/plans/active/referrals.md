# Fase 15 - Referrals

## Objectivo

Implementar indicacoes por negocio sem premiar o registo. A recompensa acontece apenas quando o cliente indicado conclui uma compra valida que cumpre as regras activas.

## Contrato

- configuracao por negocio para estado, compra minima, premios, validade e limites;
- convites de uso unico ligados ao cartao do indicador;
- aceitacao por um cliente com cartao activo no mesmo negocio;
- nenhum movimento de pontos na criacao ou aceitacao do convite;
- recompensa atomica das duas carteiras depois da primeira compra qualificadora;
- movimentos `referral` no ledger para cada carteira premiada;
- reversoes compensatorias quando a compra qualificadora e reembolsada;
- bloqueio de auto-indicacao, cliente existente, indicacao reciproca, convite expirado e excesso de limite;
- RLS para clientes e gestores, sem mutacoes directas das tabelas pelo browser.

## Superficies

- `/cliente/indicacoes`: criar e aceitar convites, consultar regras e historico;
- `/negocio/indicacoes`: configurar o programa e acompanhar resultados;
- RPCs transaccionais no PostgreSQL para todas as mutacoes sensiveis.

## Verificacao

- contratos da migracao e dos RPCs;
- modelos de apresentacao e equivalencia MZN;
- fallbacks protegidos das duas rotas;
- lint, typecheck, testes, Playwright e build de producao;
- migracao remota e advisors de seguranca/desempenho.

## Estado remoto

- `implement_referral_programs` e `harden_referral_programs` aplicadas no projecto ligado;
- RLS activo em `referral_programs` e `referrals`;
- helpers de recompensa e reversao sem `EXECUTE` para `anon` ou `authenticated`;
- avisos de desempenho da fase resolvidos;
- os tres avisos `SECURITY DEFINER` dos endpoints autenticados sao intencionais e cada funcao valida identidade, cartao ou gestao do tenant antes de escrever.
