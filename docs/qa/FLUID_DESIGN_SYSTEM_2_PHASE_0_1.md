# Fluid Design System 2.0 — Fases 0/1

## Fase / PR

- Nome: auditoria e fundamentos optativos.
- Branch: `codex/vuyela-fluid-design-system-2`.
- Commit/PR: não criado; gate Playwright reprovado, revisão visual pendente.
- Objetivo: materiais adaptativos na biblioteca existente, sem alterar operações dos portais.

## Diagnóstico e decisões

- Pacote workspace existente, Next 15.5.23 e React 19 reutilizados.
- APIs Card, Button, Navbar, BottomNavigation e Modal estendidas por `material` opcional.
- GlassSurface admite elemento semântico, atributos HTML e ref; material padrão solid.
- MotionPreferences usa armazenamento local versionado, sem dados pessoais/financeiros.
- Preferências do SO mantêm precedência; preferência da aplicação apenas reduz efeitos.
- Reward/danger mantêm a apresentação existente; não recebem materiais de vidro.
- Tokens novos sincronizados em CSS/TS/JSON; sem corrigir raios/breakpoints legados globalmente.
- Fonte `app/globals.css`: 558 370 bytes; não alterada. Este valor não é tamanho transferido.
- CSS de materiais isolado; nenhum novo pacote instalado.
- Modal existente reforçado para Tab/Shift+Tab e restauro do overflow anterior.

## Ficheiros alterados

- `tests/e2e/fluid-surfaces.spec.ts`: verifica cinco superfícies em oito larguras e recolhe capturas antes/depois; ainda não executado.

- `vuyela-design-system/src/styles/tokens.css`, `src/tokens.ts`, `tokens/design-tokens.json`: glass e motion.
- `src/styles/fluid.css`, `src/styles/index.css`, `app/layout.tsx`: materiais e importação.
- `src/components/GlassSurface.tsx`, `MotionPreferences.tsx`: novas primitivas.
- `Card.tsx`, `Button.tsx`, `Navigation.tsx`, `Modal.tsx`, `src/index.ts`: extensão compatível.
- `app/dev/design-system/showcase.tsx`: demonstrações light/dark, estados e preferências.
- `tests/unit/fluid-design-system.test.tsx`, `tests/e2e/fluid-design-system.spec.ts`: regressão.
- `docs/design/DESIGN_SYSTEM.md`, `ACCESSIBILITY.md`: uso e limites.
- `docs/plans/active/vuyela-fluid-design-system-2.md`: inventário, fases e acompanhamento.

## Verificação

| Gate | Estado / evidência |
| --- | --- |
| install frozen | PASS; dependências já atualizadas, lockfile preservado |
| baseline lint | PASS |
| baseline typecheck | PASS |
| baseline unit/integration | PASS, 338 testes / 73 ficheiros |
| lint após alterações | PASS na revisão final, execução fora da sandbox terminou com exit code 0 |
| typecheck após alterações | PASS, app e pacote |
| unit/integration após alterações | PASS na revisão final, 345 testes / 74 ficheiros, incluindo 7 testes dos fundamentos Fluid |
| ds:build | PASS na revisão final |
| build | PASS numa revisão intermédia após repetição fora da sandbox; última revisão compilou em 8,6 minutos mas a execução foi interrompida na etapa de lint/tipos; gate final NÃO APROVADO |
| Playwright | FAIL: timeout de arranque automático (180s). Com servidor isolado pré-iniciado enumerou 114 testes, mas o primeiro teste de autenticação falhou após 2 minutos; execução interrompida. As novas verificações visuais não chegaram a executar |
| Acessibilidade | testes unitários de semântica, foco, Escape e preferências; revisão visual pendente |
| Visual QA | NÃO EXECUTADO; Chromium desktop/mobile e oito larguras configurados, sem capturas válidas |
| Performance | valores atuais abaixo; sem comparação antes/depois válida |

O typecheck simultâneo ao primeiro build encontrou tipos gerados em falta. Reexecutado depois
da geração, passou. Não foram alterados scripts nem excluídos tipos/testes para contornar falhas.

O build intermédio aprovado reportou: homepage 115 kB First Load JS; Cliente 126 kB; Negócio/Admin 117 kB; POS 127 kB;
demonstrador 118 kB; partilhado 102 kB. Não são medições de transferência CSS, CWV ou p75.
Não há dados de campo nem medições em dispositivos físicos nesta fase.
Não ficou nenhum servidor de validação iniciado por esta tarefa intencionalmente em execução.

## Segurança e regressões

- Mudanças de autenticação, tenant, SQL, POS, pagamentos, ledger, manifestos ou SW: NENHUMA.
- Dados de exemplos apenas na rota de desenvolvimento, que mantém noindex e bloqueio em produção.
- Sem testes live, migrações, escrita em produção, merge ou deploy.
- Risco: CSS legado pode ter maior especificidade; mitigação por importação final e testes de browser.
- Limitações: ainda sem Safari/iPhone, Android físico, Firefox e CWV p75.

## Próximo passo

Concluir gate Playwright e inspeção das capturas antes de iniciar rollout público e nos portais.
As fases 2–6 continuam dependentes da validação desta base.

Tentativas adicionais: o arranque direto de Next respondeu HTTP 200; no servidor isolado, a
compilação inicial de `/dev/pos` demorou 165,9s e a de `/cliente/entrar` 81,6s. O teste de
autenticação excedeu o seu limite de 120s. Foi tentado build determinístico com as mesmas
variáveis de teste, para reutilizar páginas pré-compiladas, mas essa tentativa não concluiu o
gate. Não foram aumentados timeouts, removidas asserções nem ignorados testes para obter PASS.

**Aceitação: não aprovada.** Fase 1 implementada parcialmente e pendente de validação. Nenhum
rollout das fases 2–5 efetuado; fase 6 pendente. Não há alegação de preservação integral validada
por browser, de comparação visual ou de melhoria de desempenho.
