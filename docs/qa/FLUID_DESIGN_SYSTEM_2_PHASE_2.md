# Fluid Design System 2.0 — Fase 2

## Fase / PR

- Nome: website público e preferências visuais partilhadas.
- Branch: `codex/vuyela-fluid-design-system-2`; fase 1 aprovada no commit `c399f78`.
- Estado: em validação; não avançar para a fase 3 antes de concluir os gates.
- Objetivo: vidro seletivo, movimento adaptativo e identidade editorial preservada.

## Diagnóstico e decisões

- Reutilizados o shell público, navegação nativa com details/summary, carrossel de ofertas,
  ilustração do painel e tokens existentes. Sem dependências novas.
- Header: blur apenas numa camada decorativa irmã. O ancestral do menu fixo não recebe filtro,
  preservando a sua relação com o viewport. Descoberta usa frosted; texto e imagens não são filtrados.
- Cartões editoriais/ofertas: elevação discreta com hover/foco em ponteiro fino, sem movimento
  quando há redução manual ou do SO. Hero, fotografias, capulana e conteúdos mantidos.
- Preferências versionadas partilhadas no layout, com controlos no footer. Persistência contém
  apenas movimento/transparência, sem dados de conta, cartões, saldos ou autorização.
- Autoplay JavaScript reage às preferências e a alterações do SO. A navegação manual continua
  disponível e usa scroll instantâneo quando há redução. Mudar preferências não reposiciona
  desnecessariamente o carrossel.
- A ilustração do painel identifica os dados como demonstrativos, sem anunciar métricas simuladas
  como atividade em tempo real.

## Ficheiros alterados

- `vuyela-design-system/src/components/MotionPreferences.tsx`: provider, controlos partilhados,
  inicialização sem controlos visíveis e hook de redução de movimento.
- `vuyela-design-system/package.json`: entrada pública `./visual-preferences`, sem dependências.
- `app/layout.tsx`: inicialização transversal; children mantêm os seus Server Components.
- `components/marketing/public-site-shell.tsx`: camada decorativa, descoberta e conforto visual.
- `app/fluid-public.css`: estilos delimitados às superfícies públicas, separado de globals.css.
- `features/marketing/{offer-editorial-carousel,business-dashboard-demo}.tsx`: movimento adaptativo.
- Testes unitários/Playwright e documentação: contratos, acessibilidade e plano de execução.

## Verificação

| Gate | Estado |
| --- | --- |
| lint | PASS |
| typecheck | PASS, app e pacote |
| unit/integration | PASS, 350 testes / 75 ficheiros; 13 afetados repetidos após nova entrada |
| ds:build | PASS |
| produção | PASS após correção da importação Server/Client |
| Playwright | EM EXECUÇÃO, 126 casos nos dois perfis |
| Visual QA | PENDENTE das capturas finais |
| Performance | assets finais medidos; comparação abaixo |

O primeiro build bloqueou a importação do barrel legado pelo layout: Modal/Overlay já usam
hooks e dependiam de consumidores cliente. Criou-se uma entrada específica das preferências,
evitando importar esses módulos no grafo servidor. Não se converteu o pacote inteiro para client.
Os gates são repetidos após esta correção, sem aumentar timeouts nem remover asserções.

A primeira execução browser encontrou uma condição de streaming num teste POS existente:
`.pos-figma-settings-layout` correspondia simultaneamente ao layout visível e a uma cópia dentro
de `div[hidden]#S:1`, ainda não removida pelo Next. O snapshot seguinte já continha um único
layout. O teste deve esperar pelo layout visível único e pelo título esperado da rota, preservando
a rejeição de layouts visíveis duplicados. Essa correção foi aplicada aos dois loops, sem escolher
arbitrariamente o primeiro elemento nem aumentar timeouts.

A execução terminou em 119 PASS / 3 FAIL / 4 exclusões por perfil. Além dos dois casos POS,
o novo teste móvel revelou que CSS legado ocultava o span do aviso demonstrativo. O aviso foi
movido para um parágrafo próprio de 14px, antes dos dados ilustrativos, preservando a asserção
de visibilidade. Traces e resultados dessa execução estão em `phase2/failed-run/`.
A nova execução inclui Enter/Tab no menu, foco visível e capturas dos controlos abertos a
320/1440 px. A fase continua bloqueada até a repetição integral e a revisão visual passarem.

A execução seguinte teve 117 PASS / 5 FAIL / 4 exclusões. O teste público móvel e o layout POS
desktop passaram; os restantes seletores de texto/rodapé/breadcrumb também encontraram cópias
ocultas do streaming. Foram delimitados ao shell/layout visível único, mantendo asserções de
contagem, conteúdo, foco e geometria. Evidência em `phase2/failed-run-streaming-and-offline/`.

Na falha PWA desktop, o HTML guardado de `/offline` continha o título correto, mas o fetch do
worker a `/cliente` recebeu HTTP 200 online mesmo depois de `context.setOffline(true)`.
O teste reforça a perda de rede com `context.route(...).abort("internetdisconnected")`, incluindo
pedidos pertencentes ao worker, conforme a [API oficial de routing de Service Workers](https://playwright.dev/docs/service-workers#network-events-and-routing).
Não se fabrica HTML nem se substitui a implementação do fallback. Asserções adicionais exigem
os assets reais em cache, resposta entregue pelo Service Worker, tentativa de rede bloqueada,
identificação/QR e ausência de HTML privado em cache. O Service Worker e o payload offline não
foram alterados. Validação dirigida em execução antes do gate completo.

A validação dirigida confirmou offline nos dois perfis, público/teclado, Negócio, descoberta do
Cliente e definições POS. Restaram dois seletores de cópias ocultas noutros passos Cliente/POS
(21 PASS / 2 FAIL / 3 exclusões). Resultados em `phase2/targeted-before-scope/`. Os seletores
de DOM/texto desses dois ficheiros foram então delimitados sistematicamente aos seus portais
visíveis, mantendo seletores por role para diálogos fora do portal. Também as medições de
geometria cliente usam o root visível. Gate completo de 126 casos em execução; fase 3 bloqueada.

Essa suite completa passou: 122 PASS / 0 FAIL / 0 flaky / 4 exclusões, em 11,3 minutos,
com offline nos dois perfis. Resultado preservado em `phase2/pre-visual-fix/results.json`.
A revisão visual seguinte encontrou uma colisão preexistente no indicador MZN da ilustração
a 320/375/390 px e labels truncados. A variação passou para uma linha própria no móvel e os
títulos/valores podem quebrar linha. Não foram alterados os valores demonstrativos.

Também se corrigiu o gráfico com movimento reduzido: desativar a animação deixava o
`stroke-dashoffset` inicial a ocultar a linha. O estado estático agora usa offset zero tanto
para o SO como para a preferência local. O teste público verifica ambos independentemente.

`scripts/inspect-fluid.mjs` confirmou os três indicadores sem truncamento/colisão nas oito
larguras, sem erros de consola e com o gráfico estático visível. Comparações e geometria em
`phase2-metrics-before/` e `phase2-metrics-after/`. Novo gate integral em execução com as
correções visuais; não avançar para a fase 3 antes da aprovação final.

Na retoma de 6 de novembro, o relatório guardado da execução com a correção visual confirmou 119 PASS / 3 FAIL /
4 exclusões: as três falhas eram o mesmo seletor global de «Serviço indisponível» em `pos.spec.ts`.
Todos os testes públicos, a geometria dos indicadores e offline dos dois perfis passaram.
O resultado e os traces estão em `phase2/last-auth-streaming-failures/`.

Foi criada `tests/e2e/support/protected-state.ts`: exige um único `.auth-shell:visible` e mantém
as verificações exatas de título e estado. A asserção é partilhada por POS, Cliente, Negócio,
indicações e Administração. Os formulários de autenticação também delimitam os seletores de
DOM/texto/labels ao shell ativo, incluindo inputs ocultos de encaminhamento e medições de
layout. Não se alterou qualquer guarda de acesso da aplicação. Repetição integral em execução.

A primeira repetição de 6 de novembro ficou bloqueada pela infraestrutura: 122 casos não
conseguiram lançar o Chromium e apenas quatro casos sem browser passaram. Não constitui
validação da aplicação; resultado em `phase2/missing-browser/results.json`. Instalou-se a revisão
exigida pelo Playwright, usando a cadeia de certificados do Windows com `--use-system-ca`,
mantendo TLS verificado. O lançamento independente confirmou Chromium 151.0.7922.34 no mesmo
ambiente da suite. O bootstrap agora verifica o browser antes de compilar; o gate foi reiniciado.

Contraste calculado das novas superfícies sobre fundos extremos: navegação do header 7,79:1;
descoberta inativa 5,06:1; descoberta ativa 5,00:1. São amostras delimitadas de texto, não uma
certificação WCAG da plataforma. Valores em `phase2/contrast.json` no arquivo local de evidências.

### Performance

Assets finais: CSS 568 902 bytes / gzip estimado 92 405; JS 1 967 459 / gzip 590 108.
Face à fase 1: CSS +2 584 bytes (+351 gzip); JS +41 414 bytes (+13 837 gzip). O total agrega todos
os chunks emitidos e não representa a transferência de uma página. Homepage First Load JS:
115 → 116 kB; o bloco partilhado mantém 102 kB. Cliente/Negócio/Admin/POS mantêm os valores
arredondados da fase 1. O acréscimo dá acesso às preferências persistentes e partilhadas; sem
biblioteca de animação adicional. Não se alega melhoria de velocidade ou cumprimento de CWV p75.
O build final inclui o aviso móvel numa linha própria, foco do footer com o token do tema e
espaçamento de ícones do menu tablet, sem alterações de conteúdo ou navegação.

## Segurança e regressões

- Nenhuma alteração em dados públicos, metadata, SEO, autenticação, permissões, tenant,
  SQL, ledger, pagamentos, transações POS, manifestos ou Service Worker.
- Sem testes live, escrita em produção, merge ou deploy.
- O browser determinístico usa dados vazios/protegidos; ofertas preenchidas são verificadas
  também nos testes do componente com dados explicitamente de teste.
- Safari/iPhone, Android físico e Firefox não testados. CWV p75 necessita de dados reais.

## Próximo passo

Concluir build, suite browser e revisão comparativa. Arquivar resultados antes de aprovar a fase 2.

## Notas de migração / descrição de PR

Título sugerido: `Aplica Fluid ao website público e estabiliza streaming/offline nos E2E`.

O header e a descoberta adotam materiais seletivos. O footer permite reduzir movimento e
transparência; os carrosséis respondem às preferências do dispositivo e da aplicação. A
ilustração comercial identifica os seus dados demonstrativos e mantém indicadores legíveis no
móvel. A navegação, os conteúdos públicos, a renderização servidor e a metadata são preservados.

Importar preferências em Server Components através de
`@lemote/vuyela-design-system/visual-preferences`, evitando o barrel legado com outros hooks.
A API standalone continua disponível; não há migração de dados nem dependências novas.
Os testes identificam o portal visível durante streaming e exercitam o fallback offline real.
Anexar os resultados e capturas aprovados indicados neste relatório. Sem merge ou deploy.
