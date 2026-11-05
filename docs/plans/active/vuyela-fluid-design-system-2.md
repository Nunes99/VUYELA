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

- [x] 0 — Baseline e inventário: arquitetura auditada; baseline da continuação em `6e51706`.
- [x] 1 — Fundamentos e demonstrador: gates locais aprovados e evidências arquivadas em 05/11/2026.
- [ ] 2 — Público/Rede Viva: depende da validação da fase 1.
- [ ] 3 — Cliente/cartão: depende da validação visual e QR.
- [ ] 4 — Negócio/Admin: superfícies secundárias, tabelas sólidas.
- [ ] 5 — POS/PWA: sem animações transacionais, validar manifestos/cache.
- [ ] 6 — Performance/regressão: comparação de bundles e capturas; CWV p75 exige dados reais.

Não declarar fases concluídas sem gates e revisão visual. Staging autenticado e dispositivos
físicos devem ser registados separadamente de testes determinísticos locais.

Relatório: `docs/qa/FLUID_DESIGN_SYSTEM_2_PHASE_0_1.md`. Fase 1 aprovada: lint, typecheck,
347 testes unit/integration, DS build, produção e Playwright (120 PASS, 0 FAIL, 0 flaky,
4 exclusões preexistentes por perfil). Revisão visual em oito larguras; 52 capturas finais e
índice SHA-256 arquivados. A falha transitória `ERR_NO_BUFFER_SPACE` da execução anterior
fica documentada separadamente. A fase 2 está desbloqueada; fases seguintes não iniciadas.

## Fase 2 — proposta por ficheiro, condicionada ao gate da fase 1

- `src/components/MotionPreferences.tsx`: partilhar e inicializar preferências visuais no layout,
  mantendo uso isolado do demonstrador e apenas persistência local não sensível.
- `app/layout.tsx`: provider cliente recebe os Server Components como children; preservar metadata.
- `components/marketing/public-site-shell.tsx`: material seletivo no header/descoberta e controlos
  de conforto visual no footer; menu móvel mantém o seu viewport fixo.
- `app/fluid-public.css`: estilos públicos delimitados. O blur do header fica numa camada
  decorativa irmã, sem criar containing block para a navegação móvel fixa.
- `features/marketing/offer-editorial-carousel.tsx`, `business-dashboard-demo.tsx`: respeitar
  alterações das preferências do SO/aplicação e identificar visualmente dados demonstrativos.
- Testes: preferências partilhadas, carrossel sem movimento, navegação por teclado/menu,
  conteúdo/SEO público, oito larguras e capturas comparáveis com a fase 1.
- Gate próprio: lint, typecheck, unit/integration, DS build, produção, Playwright relevante e
  revisão visual antes de qualquer fase 3. Não alterar dados, autenticação ou contratos PWA.
