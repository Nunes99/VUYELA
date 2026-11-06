# VUYELA Fluid Design System 2.0 — Plano de Execução para Codex

> **Documento de implementação** · VUYELA by LEMOTE · Website + PWA · Novembro de 2026  
> **Destino recomendado no repositório:** `docs/plans/active/vuyela-fluid-design-system-2.md`  
> **Repositório:** `Nunes99/VUYELA` · **Branch-base:** `main`  
> **Estado:** especificação de trabalho, **não** implementação concluída.

---

## 0. Instrução principal ao agente Codex

Atua como **Senior Frontend Architect, Design Systems Engineer e UX/UI Engineer** no projeto VUYELA. A tua missão é **evoluir o Design System já existente** para o **VUYELA Fluid Design System 2.0**, introduzindo **Glassmorphism, efeitos Liquid Glass inspirados na óptica do vidro e Motion Design adaptativo**, sem reescrever a plataforma, sem comprometer operações comerciais e sem transformar o VUYELA numa cópia visual de outro produto.

**Começa por inspecionar o código real do repositório e validar esta especificação contra o estado atual de `main`.** As informações deste documento representam o estado observado em 4 de novembro de 2026; se algo tiver mudado, regista a diferença antes de atuar. **Não assumes que o código está em falta só porque uma proposta anterior sugeria criá-lo.**

**Executa o trabalho de forma incremental e verificável.** Cria uma branch própria, produz um plano de alterações por ficheiro, implementa em pequenos commits, executa os testes aplicáveis e prepara Pull Requests de escopo limitado. Nunca declares uma fase concluída sem evidência de testes e revisão visual. Não faças deploy ou merge automaticamente sem instrução explícita.

### Resultado procurado

Uma interface VUYELA distintiva, fluida, elegante, acessível e rápida, onde:

- o **website público** utiliza vidro e motion com maior expressividade;
- o **portal do cliente** apresenta cartões digitais YELA, recompensas e navegação com microinterações úteis;
- os portais **Negócio e Administração** utilizam vidro de forma moderada, preservando leitura de dados;
- o **POS** mantém clareza transacional e efeitos mínimos;
- as **quatro PWAs existentes** continuam independentes, instaláveis e seguras;
- a identidade **Rede Viva**, os elementos culturais moçambicanos e a marca VUYELA são preservados.

---

## 1. Contexto técnico confirmado — não reconstruir

No repositório já existem:

| Área | Implementação existente |
|---|---|
| Aplicação web | Next.js 15 (App Router), React 19, TypeScript |
| Estilos | Tailwind CSS 3, CSS tradicional e design tokens |
| Design System | Pacote workspace `@lemote/vuyela-design-system` |
| Dados e autenticação | Supabase / PostgreSQL, RLS, RBAC e MFA |
| Operações de fidelização | Ledger e RPCs transacionais para YELAS |
| Portais | Cliente, Negócio, POS e Administração |
| PWA | Quatro manifestos e um Service Worker raiz |
| QA | Vitest, React Testing Library e Playwright |
| CI | Lint, typecheck, testes, build e E2E determinístico |
| Hosting | Vercel |

**Atenção:** o Design System já exporta componentes, incluindo `Button`, `Card`, `Field`, `Navigation`, `Overlay`, `StatCard`, `LoyaltyCard` e `Modal`. **Extende estes componentes** antes de criar soluções paralelas.

### Ficheiros e pastas a inspecionar primeiro

1. `AGENTS.md` — regras obrigatórias do projeto.
2. `ARCHITECTURE.md` — arquitetura e limites de domínio.
3. `docs/design/BRAND.md`, `docs/design/DESIGN_SYSTEM.md`, `docs/design/RESPONSIVE.md`, `docs/design/ACCESSIBILITY.md`.
4. `docs/plans/active/design-convergence.md` e `docs/qa/TESTING.md`.
5. `docs/architecture/PWA.md` — contratos de cache, instalação e segurança.
6. `vuyela-design-system/src/index.ts`, `src/styles/tokens.css`, `src/styles/components.css`, `src/components/`, `src/tokens.ts`, `tokens/design-tokens.json`.
7. `app/layout.tsx`, `app/globals.css`, `app/marketing.css`, `app/rede-viva.css`.
8. `app/(public)/page.tsx`, `components/marketing/public-site-shell.tsx`, `features/marketing/`.
9. `features/customer-dashboard/`, `features/business-dashboard/`, `features/pos/`, `features/admin/`.
10. `features/pwa/`, `app/pwa/[area]/manifest.webmanifest/route.ts`, `app/sw.js/route.ts`.
11. `tests/unit/`, `tests/integration/`, `tests/e2e/` e `.github/workflows/quality.yml`.

**Observação de manutenção:** `app/globals.css` tem cerca de 531 KB de código-fonte no estado anteriormente observado. Analisa duplicações, especificidade, colisões e CSS efetivamente enviado em produção. **Não confundas tamanho do ficheiro-fonte com tamanho do bundle transferido ao navegador.** Evita adicionar grandes blocos novos a esse ficheiro; migra apenas o CSS diretamente afetado por cada fase, sem refatorações alheias ao escopo.

---

## 2. Restrições inegociáveis

### Produto e operações

- **Somente website e PWA.** Não criar aplicações nativas, React Native, Expo, APK ou IPA.
- Não alterar, eliminar nem contornar lógica de fidelização, preços, descontos, pagamentos, operações POS, carteiras, ledger, sessões, MFA, RLS ou permissões.
- **YELA/YELAS (`YL`)** permanece o nome comercial. Quando aplicável, apresentar também o equivalente em **MZN** e o estabelecimento emissor.
- Não apresentar dados fictícios como se fossem atividade real. Demonstrações devem estar explicitamente identificadas como tal.
- Não criar eventos artificiais de compra, novos movimentos de YELAS ou novas operações financeiras para efeitos de animação.
- Preservar o isolamento entre tenants/negócios e os quatro ambientes protegidos.
- Não modificar diretamente o esquema Supabase, migrações SQL, credenciais, configurações Vercel ou contratos de pagamento nesta iniciativa visual.

### Arquitetura

- Preservar **Next.js + React + TypeScript + Tailwind + Supabase + Vercel**.
- Priorizar **React Server Components**; usar `"use client"` somente quando a interação exigir JavaScript no cliente.
- Evitar novas dependências de grande dimensão sem medições e justificação. A biblioteca **Motion for React** pode ser proposta/adicionada **se os protótipos demonstrarem benefício**, com carregamento seletivo e avaliação do bundle.
- Não introduzir Angular, Tramvai, WebGL ou Three.js como requisito global. Shaders/WebGL só podem ser uma experiência opcional, isolada e aprovada posteriormente.
- Não instalar componentes externos que dupliquem a biblioteca interna sem avaliação.
- Não substituir todo o visual Rede Viva por vidro, gradientes ou um design genérico.

### Controlo de alterações

- Trabalhar em branch de feature, por exemplo `codex/vuyela-fluid-design-system-2`.
- Não fazer push diretamente para `main`.
- Não alterar secrets, variáveis de produção, dados reais ou configurações de deployment.
- Não executar migrações nem testes de escrita contra produção.
- Preservar interfaces públicas de componentes existentes; se houver alteração incompatível, documentar migração e atualizar os consumidores no mesmo PR.
- Não marcar testes como aprovados sem os ter executado; indicar `não executado` quando necessário.

---

## 3. Direção visual e identidade

### Conceito

**VUYELA Fluid Design 2.0 — tecnologia com proximidade, movimento e identidade moçambicana.**

A sensação desejada é de qualidade e leveza, não de espetáculo permanente. O vidro deve comunicar contexto, profundidade e interatividade; o conteúdo continua dominante.

### Identidade preservada

| Token / referência | Valor conhecido | Regra |
|---|---|---|
| Índico | `#073B4C` | Base institucional, navegação e estrutura |
| Turquesa | `#00A6A6` | Ações e interações |
| Dourado | `#F2B544` | **Reservado para YELAS, recompensas e benefício comercial** |
| Coral | `#D95D4F` | Acentos e comunicação contextual |
| Areia | `#F7F2E8` | Superfícies claras |
| Grafite | `#172126` | Texto e áreas escuras |
| Tipografia | Sora + Inter, servidas localmente | Preservar hierarquia, não depender de CDN |
| Marca | `VuyelaLogo` + SVG oficial | Não criar logótipos textuais alternativos |
| Capulana | Texturas/padrões existentes | Utilização cultural intencional e subtil |

**Não substituir os tokens existentes por valores literais dispersos nos componentes.** Reutilizar tokens semânticos, adicionar tokens novos sem conflito e atualizar simultaneamente as fontes relevantes (`tokens.css`, JSON e TS, conforme o contrato do pacote).

### Intensidade dos efeitos por superfície

| Superfície | Intensidade | Aplicação prioritária |
|---|---|---|
| Website público / homepage | Alta, mas seletiva | Header, hero secundário, descoberta, cartões destacados |
| Marketplace / páginas de ofertas | Moderada | Filtros, chips, overlays e navegação |
| Cliente / PWA | Moderada | Cartão YELA, bottom navigation, progressos, recompensas |
| Negócio / PWA | Baixa | Toolbar, filtros, painéis de contexto, modais |
| Administração / PWA | Baixa | Navegação e ações secundárias |
| POS / PWA | Mínima | Estados não críticos e shell; **sem distrair a confirmação de vendas** |

---

## 4. Especificação dos efeitos

### 4.1. Níveis de material

**Nível A — `solid` (padrão seguro)**

- Superfície sólida com borda, sombra e contraste estáveis.
- Padrão para dados densos, formulários, tabelas, confirmações e POS.
- Deve funcionar em navegadores sem suporte a `backdrop-filter`.

**Nível B — `frosted` (Glassmorphism leve)**

- Transparência controlada, desfoque moderado, borda subtil e elevação.
- Adequado a header, painéis sobre imagem e superfícies flutuantes.
- `backdrop-filter`/`-webkit-backdrop-filter` com **fallback sólido**.
- Evitar múltiplas camadas de desfoque sobrepostas.

**Nível C — `liquid` (interação fluida)**

- Efeito anterior mais reflexos discretos, transformações suaves, resposta ao foco/hover/toque.
- Reservado para poucos componentes de destaque e eventos de recompensa.
- Não depender de movimento do rato para funcionar em dispositivos touch.
- Sem refração fisicamente precisa obrigatória; CSS e SVG são o ponto de partida.

**Nível D — `immersive` (experimental / fora do escopo inicial)**

- WebGL / shaders / refracção avançada opcionais, isolados em demonstrador separado.
- Exigem aprovação explícita após medições reais em dispositivos de entrada de gama.

### 4.2. Tokens novos sugeridos

Criar nomes e valores finais **após** comparar o sistema atual, sem duplicar tokens já existentes:

```css
/* Referência semântica; calibrar valores com protótipos e testes. */
--vy-glass-bg: rgba(255, 255, 255, 0.76);
--vy-glass-border: rgba(255, 255, 255, 0.62);
--vy-glass-shadow: 0 12px 32px rgba(3, 43, 56, 0.10);
--vy-glass-blur: 12px;
--vy-glass-highlight: rgba(255, 255, 255, 0.55);
--vy-glass-radius: var(--vy-radius-lg);
--vy-motion-enter: var(--vy-motion-normal);
--vy-motion-emphasis: var(--vy-motion-slow);
```

Adicionar equivalentes para `[data-theme="dark"]`, conservando contraste. Os valores acima são **pontos de partida**, não uma exigência de os copiar sem análise.

### 4.3. Estados obrigatórios

Cada componente interativo deve suportar os estados relevantes: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `error` e `success` quando aplicável. O estado deve ser comunicado **também sem cor ou animação**.

### 4.4. Movimento

- Preferir `transform` e `opacity` a animações de layout quando possível.
- Microinterações: utilizar tokens atuais (`150 ms`, `220 ms`, `400 ms`) como base.
- Não criar animações contínuas em dashboards, listas densas ou POS.
- Evitar parallax pesado, deslocamentos excessivos, brilho piscante e efeitos que dificultem a leitura.
- Respeitar `prefers-reduced-motion: reduce`; quando ativo, reduzir ou eliminar animações não essenciais.
- Suportar modo de transparência reduzida dentro da aplicação e `prefers-reduced-transparency`, quando disponível, com fallback próprio.
- Usar animações para indicar **mudanças reais de estado**, nunca para sugerir transação confirmada antes de resposta do servidor.

---

## 5. Componentes prioritários e API proposta

**Antes de codificar:** examinar os componentes já presentes e optar por variantes/compostos existentes quando possível. Não implementar a API abaixo literalmente se ela contradisser contratos públicos atuais; documentar qualquer adaptação.

| Componente | Responsabilidade | Exigências |
|---|---|---|
| `GlassSurface` | Superfície `solid` / `frosted` / `liquid` | Ref semântico, `className`, tema, fallback, contrastes |
| `GlassButton` ou variante de `Button` | CTA com material adaptativo | Foco claro, loading, disabled, touch ≥44px |
| `FloatingNavigation` | Navbar flutuante | Sem sobreposição, sticky previsível, teclado, scroll |
| `FluidCard` ou variante de `Card` | Cartão reutilizável | Conteúdo legível e sem desfoque excessivo |
| `LiquidLoyaltyCard` | Cartão digital YELA | Dados reais; QR legível; offline inalterado |
| `PointsBalanceMotion` | Transição de saldo | Só anima após dados confirmados; fallback estático |
| `RewardFeedback` | Feedback de recompensa | Não alterar ledger; acessibilidade via anúncio textual |
| `FluidTabs` ou variante de `Tabs` | Navegação de vistas | Roving focus/teclado quando necessário |
| `GlassOverlay` / variante de `Modal` | Diálogo/painel | Gestão de foco, Escape, labels, scroll lock |
| `MotionPreferences` | Preferências de movimento/transparência | Persistência local não sensível, respeito ao SO |

**Design Systems:** exportar componentes publicamente em `vuyela-design-system/src/index.ts`; incluir estilo em ficheiros do pacote, documentação e testes. Evitar nomes de classes globais que possam colidir com CSS legado; preferir prefixos `vy-` ou a convenção já aprovada.

---

## 6. Plano de implementação incremental

### Fase 0 — Baseline e inventário (sem redesign)

**Objetivo:** compreender o estado real antes de fazer alterações.

1. Confirmar branch, estado de trabalho, dependências e scripts.
2. Inspecionar componentes existentes, consumidores, tokens, CSS global e responsividade.
3. Criar um inventário: **reutilizar / estender / criar / retirar**.
4. Identificar superfícies que atualmente usam vidro, blur, transições e animações.
5. Executar baseline de lint, typecheck, unit/integration tests, E2E determinístico e build, se o ambiente permitir.
6. Registar capturas e métricas iniciais de desktop/mobile, quando possível.
7. Criar `docs/plans/active/vuyela-fluid-design-system-2.md` no repositório, com checklist de implementação e estado verificável.

**Saída:** plano por ficheiro + baseline de QA + lista de riscos. Não implementar melhorias genéricas desconectadas do design.

### Fase 1 — Tokens, fundamentos e componentes (PR separado)

**Objetivo:** introduzir o material visual sem modificar fluxos de negócio.

1. Adicionar tokens semânticos `glass` e motion, Light/Dark.
2. Definir materiais `solid`, `frosted` e `liquid` com fallback.
3. Estender `Card`, `Button`, overlays e navigation sem quebrar APIs existentes.
4. Criar exemplos na rota já existente `/dev/design-system`, se adequada.
5. Criar documentação de uso, anti-padrões e comportamento responsivo.
6. Criar testes de renderização, teclado, fallback e preferências de acessibilidade.

**Saída:** biblioteca integrada e demonstrável, sem alteração de backend ou portais críticos.

### Fase 2 — Website público e Rede Viva (PR separado)

**Objetivo:** melhorar apresentação e navegação sem perder identidade local.

1. Aplicar vidro seletivo ao header e componentes flutuantes da homepage.
2. Preservar hero fotográfico, capulana e composição editorial **Rede Viva**.
3. Refinar cards de ofertas e descoberta com estados de interação claros.
4. Evitar blur nos textos sobre imagens que reduza contraste.
5. Preservar SEO, renderização e conteúdo público vindo do Supabase.
6. Identificar visualmente qualquer painel **demonstrativo**; não exibir métricas mockadas como live.
7. Testar larguras existentes entre **320 e 1440 px**, incluindo navegação por teclado.

**Saída:** homepage e áreas selecionadas modernizadas, sem regressões no marketplace ou SEO.

### Fase 3 — Experiência Cliente / cartão YELA (PR separado)

**Objetivo:** dar destaque à fidelização e à clareza dos movimentos.

1. Introduzir material visual adaptativo no cartão digital existente.
2. Manter legibilidade do QR Code, número do cartão, negócio e valor YELA/MZN.
3. Animar apenas alterações de estado confirmadas pelo backend.
4. Refinar estados de loading, vazio, erro, saldo e recompensa.
5. Preservar o comportamento offline existente: **identificação do cartão sem saldo nem resgate offline**.
6. Não gravar dados sensíveis adicionais em IndexedDB ou Cache Storage.

**Saída:** experiência móvel premium, funcional com e sem animações.

### Fase 4 — Negócio e Administração (PRs separados, se necessário)

**Objetivo:** elevar a qualidade sem comprometer produtividade.

1. Aplicar materiais `solid` por defeito nas tabelas e formulários.
2. Usar `frosted` em filtros, toolbar, modais e superfícies secundárias.
3. Manter navegação, seleção de negócio/filial e controlo de permissões intactos.
4. Eliminar inconsistências visuais só nas superfícies tocadas.
5. Validar leitura dos indicadores em desktop, tablet e telemóvel.

**Saída:** portais consistentes, sem regressões de dados nem de UX operacional.

### Fase 5 — POS e PWA (PR separado)

**Objetivo:** consistência e robustez, **não** espetáculo visual.

1. Aplicar apenas melhorias de tipografia, espaçamento, feedback e superficies discretas.
2. Preservar fluxos de venda, cálculo, resgate, confirmação, pagamentos e estorno.
3. Não adicionar transições que atrasem ou ocultem confirmações transacionais.
4. Confirmar os quatro manifestos independentes e os scopes de cada portal.
5. Preservar Service Worker, offline fallback, limites de cache e ausência de escrituras offline.
6. Validar instalação/atualização PWA, visibilidade do foco e utilização com touch.

**Saída:** PWA estável com design harmonizado; operações críticas inalteradas.

### Fase 6 — Performance, regressão e documentação

1. Comparar tamanhos de CSS e JS **de produção** com o baseline.
2. Medir Core Web Vitals em mobile e desktop; explicar quaisquer regressões.
3. Executar testes de acessibilidade e verificar contraste/teclado.
4. Testar `prefers-reduced-motion` e transparência reduzida.
5. Executar os gates completos e Playwright relevante às quatro superfícies.
6. Verificar o diff à procura de lógica de negócio, secrets ou alterações inesperadas.
7. Atualizar `docs/design/DESIGN_SYSTEM.md`, `docs/design/ACCESSIBILITY.md`, exemplos e plano.
8. Preparar relatório de aceitação e notas de migração.

**Saída:** PR final e evidências auditáveis; nenhuma conclusão sem validação.

---

## 7. Acessibilidade e suporte técnico

O Design System 2.0 deve procurar conformidade com **WCAG 2.2 AA** nas interfaces alteradas.

**Obrigatório:**

- Contraste mínimo de **4,5:1** para texto normal e **3:1** para texto grande (salvo exceções normativas aplicáveis).
- Contraste suficiente para componentes e indicadores visuais de foco.
- Navegação por teclado e `:focus-visible` em elementos interativos.
- Alvos de toque de pelo menos **44×44 px** onde praticável, conforme regra existente do projeto.
- Modais e menus com semântica acessível e foco gerido corretamente.
- Sem informação transmitida **apenas** por transparência, cor, som ou animação.
- Compatibilidade com leitores de ecrã; eventos de recompensa usam texto acessível.
- `@supports` para efeito de vidro, com superfície sólida como fallback.
- Atenção a `backdrop-filter` em dispositivos de baixo desempenho; evitar filtros aninhados.
- Sem brilho pulsante ou animação permanente em ecrãs de operação.

**Dispositivos de verificação:** iPhone/Safari compatível, Android/Chrome de entrada de gama, Chrome/Edge desktop e Firefox desktop quando viável. Registar versões efetivamente testadas; não alegar suporte onde não houve teste.

---

## 8. Desempenho — critérios mensuráveis

**Metas do produto, medidas no percentil 75 em condições representativas:**

| Métrica | Meta |
|---|---|
| LCP | ≤ 2,5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0,1 |
| Acessibilidade | WCAG 2.2 AA, dentro do escopo testado |
| Mobile | Sem scroll horizontal ou sobreposição dos controlos |
| POS | Sem atraso visual que impeça leitura ou confirmação |

Registar **antes/depois** para homepage, Cliente, Negócio e POS. Não declarar que uma melhoria é mais rápida sem medições comparáveis. O custo do efeito deve ser analisado em JS, CSS, frames perdidos e consumo de recursos em dispositivos mais modestos. Se o custo for desproporcionado, reduzir intensidade ou usar material `solid`.

Não adicionar bibliotecas 3D, vídeo de fundo, grandes SVG filters ou WebGL indiscriminadamente. Caso um efeito experimental seja aprovado, carregá-lo somente na rota relevante, nunca no layout global de todos os portais.

---

## 9. Testes e Quality Gate

Executar os scripts existentes, sem alterar os comandos por conveniência:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm ds:build
```

`pnpm test:e2e:live` **não deve ser executado contra produção**; exige ambiente de staging e contas dedicadas. Não divulgar credenciais em logs, documentos ou Pull Requests.

### Testes adicionais propostos

- **Unitários:** seleção de variantes e fallback; renderização de estados; tokens; guardas de preferência de movimento.
- **Integração:** componentes do Design System exportados e consumidos sem quebra de contrato.
- **Playwright:** 320/375/390/430/768/1024/1280/1440 px; navegação teclado; menu fixo sem colisões; temas; reduced motion; instalação/manifestos PWA existentes.
- **Visual QA:** comparar screenshots de antes/depois da homepage, cartão, Business e POS.
- **Regressão crítica:** saldo, QR, compra e resgate continuam a usar dados/ações originais; nenhuma alteração do ledger.

O gate deve **falhar** perante testes quebrados, contraste insuficiente, foco invisível, overflow, instalação PWA regressiva ou alteração não prevista na lógica transacional.

---

## 10. Critérios de aceitação por entrega (Definition of Done)

Uma entrega só está concluída quando:

- [ ] O componente usa tokens do VUYELA e respeita a identidade Rede Viva.
- [ ] `solid` funciona sem suporte a `backdrop-filter`.
- [ ] `frosted` e `liquid` não prejudicam a leitura de textos e dados.
- [ ] Light/Dark são coerentes nas superfícies abrangidas.
- [ ] Movimento e transparência podem ser reduzidos.
- [ ] Navegação por teclado e foco visível funcionam.
- [ ] Layouts mobile/tablet/desktop não apresentam colisões nem overflow.
- [ ] Nenhum fluxo transacional, sessão, RLS ou permissão foi alterado inadvertidamente.
- [ ] Quatro PWAs preservam manifestos, scope e segurança de cache.
- [ ] Testes aplicáveis, typecheck, lint e build passam — ou bloqueios são declarados.
- [ ] Existe comparação visual e, quando aplicável, de desempenho antes/depois.
- [ ] Documentação e plano de migração foram atualizados.
- [ ] PR inclui resumo, riscos, screenshots, medições e comandos executados.

---

## 11. Modelo de relatório obrigatório do Codex

No fim de **cada fase/PR**, responder neste formato:

```markdown
### Fase / PR
- Nome:
- Branch / commit:
- Objetivo:

### Diagnóstico e decisões
- O que já existia e foi reutilizado:
- O que foi criado/alterado:
- Justificação de novas dependências (se houver):

### Ficheiros alterados
- `path/to/file`: alteração e motivo

### Verificação
- lint: PASS / FAIL / NÃO EXECUTADO
- typecheck: PASS / FAIL / NÃO EXECUTADO
- unit/integration: PASS / FAIL / NÃO EXECUTADO
- build: PASS / FAIL / NÃO EXECUTADO
- Playwright: PASS / FAIL / NÃO EXECUTADO
- Acessibilidade: resultado e método
- Visual QA: screenshots e viewports
- Performance: comparação antes/depois ou ausência justificada

### Segurança e regressões
- Mudanças de autenticação, tenant, SQL, POS ou ledger: NENHUMA / detalhar
- Riscos identificados:
- Limitações:

### Próximo passo
- Entrega seguinte:
- Dependências ou decisões pendentes:
```

---

## 12. Primeira tarefa a executar agora

**Tarefa inicial recomendada (FASE 0 + início da FASE 1):**

1. Ler `AGENTS.md`, as especificações de marca/design, o pacote `vuyela-design-system` e o CSS relevante.
2. Criar inventário dos componentes existentes e **propor a menor alteração possível** para introduzir `solid`, `frosted` e `liquid`.
3. Auditar tokens Light/Dark e identificar regras de contraste, motion e fallback.
4. Criar demonstrador na rota `/dev/design-system`, sem alterar as operações da plataforma.
5. Adicionar os primeiros componentes/tokens e testes, apenas após confirmar convenções existentes.
6. Validar o quality gate e apresentar screenshots comparativos.
7. Preparar PR descritivo. **Não realizar merge nem deploy sem autorização.**

**Atenção:** a etapa de estabilização operacional — staging, backups e testes transacionais autenticados — é uma **dependência para piloto comercial**, mas não deve ser misturada indiscriminadamente com este PR de Design System. Se detetares risco crítico, documenta e bloqueia a operação afetada; não reescrevas sistemas financeiros no âmbito de uma tarefa visual.

---

## 13. Instrução de arranque pronta para Codex

> Lê integralmente `AGENTS.md`, `ARCHITECTURE.md` e o ficheiro `docs/plans/active/vuyela-fluid-design-system-2.md`. Trabalha sobre o repositório **VUYELA** existente, na branch `main`, criando uma feature branch. **Não reconstruas a plataforma**: ela já possui Design System, quatro PWAs, motor de fidelização, POS, Business e Administração. Executa primeiro a **Fase 0 — baseline e inventário** e apresenta um plano por ficheiro. Depois implementa incrementalmente a **Fase 1 — tokens e componentes fundamentais** com variantes `solid`, `frosted` e `liquid`, fallback sem blur, Light/Dark, `prefers-reduced-motion`, acessibilidade e testes. Preserva a identidade **Rede Viva**, a marca moçambicana, os nomes **YELAS/MZN** e todas as fronteiras de segurança e transações. Não alteres Supabase, RLS, ledger, POS, pagamentos ou deploy no trabalho de UI. Executa os quality gates e entrega o relatório obrigatório. **Não faças merge nem deploy automaticamente.**

---

**Definição de sucesso:** elevar a qualidade visual da plataforma existente **sem diminuir a confiabilidade, a acessibilidade, o desempenho ou a identidade VUYELA**.
