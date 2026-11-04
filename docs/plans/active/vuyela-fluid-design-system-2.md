# VUYELA Fluid Design System 2.0 — execução

Especificação preservada em `VUYELA_FLUID_DESIGN_SYSTEM_2_0_CODEX.md`.
Branch: `codex/vuyela-fluid-design-system-2`. Sem merge ou deploy automático.

## Auditoria / Fase 0

- Next 15 / React 19; pacote workspace consumido diretamente por exports de src.
- Card, Button, Navbar, BottomNavigation, Modal e Drawer já existem: estender APIs.
- Tokens light/dark e durações 150/220/400ms existentes: reutilizar.
- Divergência preexistente: raios CSS de 8px vs TS/JSON de 8–32px;
  breakpoints DS 480/760/1080/1280 vs documentação 640/1024/1440. Não corrigir globalmente.
- Rede Viva já tem animações contínuas e regras de reduced motion.
- Modal/Drawer: Escape e reposição de foco existentes; contenção de foco precisa de reforço.
- Cartão cliente já tem QR de identificação, YL/MZN e frente/verso. Não duplicar.
- Quatro PWAs partilham o SW raiz; armazenamento offline só de identificação.
- Único ficheiro inicialmente não versionado: especificação fornecida pelo utilizador.

## Plano por ficheiro

1. `src/styles/tokens.css`, `src/tokens.ts`, `tokens/design-tokens.json`: novos tokens sincronizados.
2. `src/styles/fluid.css`: materiais optativos, fallback, foco, preferências, sem aumentar globals.css.
3. `src/components/GlassSurface.tsx`: superfície semântica com ref; reutilizar em composições.
4. Card, Button, Navigation, Modal: prop material aditiva; defaults inalterados.
5. `src/components/MotionPreferences.tsx`: controlo local, preferências do SO por defeito.
6. Demonstrador existente: light/dark, estados e preferências, dados marcados demonstração.
7. Testes unitários e Playwright: contratos, teclado, fallback, responsividade, preferências.
8. Documentação de uso e relatório de validação.

## Fases e gates

- [ ] 0 — Baseline e inventário: inventário feito; baseline browser não aprovado por timeouts.
- [ ] 1 — Fundamentos e demonstrador: alterações locais implementadas; QA/aceitação pendentes.
- [ ] 2 — Público/Rede Viva: depende da validação da fase 1.
- [ ] 3 — Cliente/cartão: depende da validação visual e QR.
- [ ] 4 — Negócio/Admin: superfícies secundárias, tabelas sólidas.
- [ ] 5 — POS/PWA: sem animações transacionais, validar manifestos/cache.
- [ ] 6 — Performance/regressão: comparação de bundles e capturas; CWV p75 exige dados reais.

Não declarar fases concluídas sem gates e revisão visual. Staging autenticado e dispositivos
físicos devem ser registados separadamente de testes determinísticos locais.

Relatório: `docs/qa/FLUID_DESIGN_SYSTEM_2_PHASE_0_1.md`. A fase 1 não está concluída e as fases
seguintes não foram iniciadas. E2E falhou por timeout de arranque e timeout no teste de login;
capturas e comparação visual não executadas. Não efetuar rollout com base apenas nos testes unitários.
