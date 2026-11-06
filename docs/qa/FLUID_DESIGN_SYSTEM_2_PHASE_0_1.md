# Fluid Design System 2.0 — Fases 0/1

## Fase / PR

- Nome: auditoria, fundamentos e estabilização da validação.
- Branch: `codex/vuyela-fluid-design-system-2`; base da continuação: `6e51706`.
- Estado em 5 de novembro de 2026: fase 1 aprovada após todos os gates locais e revisão visual.
- Objetivo: biblioteca optativa e demonstrador, preservando fluxos e limites transacionais.

## Diagnóstico e decisões

- Reutilizados Next 15.5.23, React 19, pacote workspace, tokens e componentes existentes.
- Card, Button, Navbar, BottomNavigation, Modal e Tabs têm `material` opcional; APIs anteriores preservadas.
- GlassSurface admite HTML semântico/ref; solid é o padrão seguro.
- MotionPreferences guarda apenas preferências visuais versionadas. Reduções do SO prevalecem.
- Botões reward/danger mantêm a apresentação original. Tokens Light/Dark sincronizados em CSS/TS/JSON.
- Modal contém foco, ignora campos ocultos, fecha com Escape e restaura foco/overflow.
- Tabs têm roving focus, setas, Home/End e preservam a montagem apenas do painel ativo.
- Corrigidas chaves duplicadas quando ligações têm o mesmo destino e rótulos distintos.
- Sem novas dependências. Raios/breakpoints legados não foram refatorados globalmente.

### Timeouts e evidências

O arranque anterior compilava rotas durante cada teste. O launcher agora invoca Node diretamente,
valida um build isolado e inicia Next dev. O setup pré-compila páginas e JS/CSS antes dos deadlines.
Asserções e timeouts por teste foram preservados; o arranque tem 15 minutos porque inclui o build.

Uma tentativa sobre Next start revelou 404 nos demonstradores operacionais, conforme as proteções
existentes. Essas proteções foram preservadas. Build e runtime de teste ficam sem credenciais
Supabase, sem reutilização de servidor arbitrário. `--dev-only` serve apenas a inspeção local e
não é utilizado pelo gate.

A primeira suite completa com prewarm terminou em 116 PASS, 4 FAIL e 4 skips condicionais
preexistentes. As falhas revelaram três problemas reais de layout, corrigidos antes da repetição:

- Tooltip alargava o documento para 333 px numa viewport de 320 px.
- Mínimos do gráfico administrativo alargavam o documento para 1036 px a 1024 px.
- Margem negativa das categorias POS alargava o documento para 324 px a 320 px.

Só quatro regras diretamente afetadas foram alteradas em `app/globals.css`, incluindo o centro
proporcional do gráfico. O demonstrador tem CSS próprio. Tabelas/categorias preservam scroll
interno deliberado; não foi escondido overflow no documento.

A execução seguinte terminou com 119 PASS, 1 FAIL e os mesmos 4 skips preexistentes. Todos os
testes Fluid desktop/mobile e PWA passaram. A falha no menu POS foi diagnosticada pelo trace:
o pedido de `next_dist_compiled` terminou com `net::ERR_NO_BUFFER_SPACE`, antes do clique,
impedindo a hidratação. Não foi uma falha da asserção de navegação nem um timeout de compilação.
O trace, contexto e JSON dessa execução foram preservados em
`playwright-report/fluid-evidence/phase1/failed-run-resource/`. A inspeção posterior não encontrou
Chromium de teste órfão nem esgotamento da faixa de portas; a origem exata do erro transitório
do Windows/Chromium não está demonstrada. A repetição integral passou: 120 PASS, 0 FAIL,
0 flaky e os mesmos 4 skips por perfil, em 12,9 minutos. Sem retries, alterações de asserções
ou mudanças de código da aplicação para contornar esse erro. O menu POS passou em 1,7 segundos.

Capturas exigem HTTP 200 e conteúdo esperado, evitando falsos PASS sobre 404. A captura espera
hidratação e preserva o caret, evitando mutações prematuras nos campos. O indicador dev fica
desativado apenas no ambiente de teste; erros de consola continuam verificados.

## Ficheiros alterados

- Pacote DS: tokens CSS/TS/JSON, GlassSurface, MotionPreferences, Card/Button/Navigation/Modal/Tabs,
  exports, estilos Fluid e documentação de API/migração.
- `app/dev/design-system/`: exemplos, estados, preferências, temas e CSS do demonstrador.
- `app/layout.tsx`: importação Fluid da entrega inicial.
- `app/globals.css`: correções mínimas do gráfico administrativo e categorias POS.
- `scripts/playwright-server.mjs`, `tests/e2e-setup.ts`, `playwright.config.ts`: build hermético,
  prewarm, logs, traces e JSON.
- `scripts/inspect-fluid.mjs`: capturas e diagnóstico local de geometria/consola.
- Testes Fluid unitários/E2E: compatibilidade, teclado, foco, preferências e oito larguras.
- `next.config.mjs`: indicador dev desativado condicionalmente para testes.
- Documentação de design, QA e plano: decisões e estado verificável.

## Verificação

| Gate | Resultado da continuação |
| --- | --- |
| lint | PASS |
| typecheck | PASS, aplicação e pacote |
| unit/integration | PASS, 347 testes em 74 ficheiros, incluindo 9 dos fundamentos |
| ds:build | PASS |
| produção | PASS, build final isolado pelo bootstrap E2E com o CSS atual |
| Playwright final | PASS, 120 testes, 0 falhas, 0 flaky; 4 exclusões preexistentes por perfil |
| diff whitespace | PASS |
| Visual QA | PASS, oito larguras dos fundamentos revistas; 52 capturas finais arquivadas |

### Acessibilidade e revisão visual

Chromium 151.0.7922.34 confirmou documento dentro de 320 px para demonstrador/POS e dentro de
1024 px para Administração, sem erros de consola. Revistas as capturas Light/Dark, gráfico e POS.
O centro do gráfico é verificado para não ocultar o anel ao reduzir a largura. Fundamentos revistos
em 320/375/390/430/768/1024/1280/1440 px, com controlos, estados e exemplo Dark sem colisões.

Contraste dos tokens de texto sobre glass, com fundos extremos preto/branco e com/sem reflexo:
mínimo 13,69:1 Light e 9,51:1 Dark. Cobre os novos materiais, não certifica toda a plataforma.
Teclado, foco, reduced motion, transparência reduzida e forced colours integram a suite Fluid.

Evidência local: `playwright-report/fluid-evidence/phase1-before`, `phase1-after`, `admin-before`,
`admin-after`, `pos-before`, `pos-after` e a pasta final `phase1`. O arquivo da fase contém:

- `results.json`: resultado integral aprovado, preservado antes das fases seguintes;
- `foundations/{perfil}-{largura}.png`: 16 recortes Light/Dark, nos dois perfis e oito larguras;
- `showcase/fluid-{perfil}-{largura}.png`: 16 capturas completas do demonstrador;
- `{superficie}-{perfil}-{390|1440}.png`: 20 capturas Público/Cliente/Negócio/Admin/POS;
- `bundle-metrics.json` e `contrast.json`: valores medidos;
- `evidence-index.json`: índice dos 55 artefactos finais, com tamanho e SHA-256;
- `failed-run-resource/`: diagnóstico da execução anterior, separado da aceitação final.

As quatro exclusões são casos móveis não aplicáveis ao projeto desktop (menu Negócio, fluxo
Cliente e dois casos POS); esses casos passaram no perfil móvel. Os artefactos ficam ignorados
pelo Git; este relatório regista o resultado e os caminhos locais para revisão.

### Performance

Baseline da continuação: CSS 564 956 bytes / gzip estimado 91 612; JS 1 925 225 / gzip 575 947.
Build final: CSS 566 318 / gzip 92 054; JS 1 926 045 / gzip 576 271. Agregam todos os assets
emitidos; a diferença inclui CSS exclusivo do demonstrador. Não são transferências por página.
Delta face ao baseline: CSS +1 362 bytes (+442 gzip); JS +820 bytes (+324 gzip).
First Load JS: homepage 115 kB; Cliente 126 kB; Negócio/Admin 117 kB; POS 127 kB; demonstrador
119 kB. CWV p75 e dispositivos físicos não foram medidos.

## Segurança e regressões

- Autenticação, permissões, tenant, SQL, pagamentos, ledger e contratos PWA/SW: sem mudanças.
- POS: correção de largura CSS, sem alterações transacionais.
- Sem testes live, migrações, credenciais expostas, escrita em produção, merge ou deploy.
- Safari/iPhone, Android físico e Firefox continuam não testados.

## Próximo passo

A fase 2 pode iniciar: todos os gates locais da fase 1 passaram. Aplicar os materiais seletivos
ao público e partilhar as preferências, conforme o plano por ficheiro. Fases 3–6 continuam
dependentes dos seus próprios gates. O piloto comercial mantém as dependências de staging e
dispositivos físicos, fora desta aceitação determinística local.

## Notas de migração / descrição de PR

Título sugerido: `Introduz materiais Fluid optativos e estabiliza a validação visual`.

Os consumidores existentes mantêm a apresentação sem a prop `material`. Os novos materiais
exigem os estilos Fluid, já incluídos no layout e no entrypoint CSS do pacote. Ações reward/danger
mantêm as cores semânticas; solid é o fallback. Não há migração de dados nem dependências novas.
O PR deve incluir este relatório e anexar as capturas locais indicadas. Sem merge ou deploy.
