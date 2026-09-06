# Convergência UI/UX das páginas públicas

## Objetivo

Alinhar todas as páginas públicas com o novo sistema visual da página inicial, mantendo a identidade VUYELA, a cultura moçambicana, o conteúdo real, os requisitos de SEO e os fluxos já funcionais.

A renovação visual não altera a voz do produto. A comunicação pública deve usar os termos `plataforma VUYELA`, `programa de fidelização`, `negócios parceiros`, `estabelecimentos aderentes`, `cartões`, `YELAS` e `benefícios` conforme o contexto. A palavra `rede` não deve ser usada como nome, categoria ou proposta de valor da VUYELA.

## Inventário de rotas públicas

### Institucionais

- `/` — página inicial
- `/como-funciona` — ciclo de fidelização
- `/clientes` — proposta para clientes
- `/negocios` — proposta para negócios
- `/precos` — planos e comparação
- `/ajuda` — ajuda e suporte

### Descoberta e conteúdo dinâmico

- `/estabelecimentos` — diretório de negócios
- `/estabelecimentos/[slug]` — perfil público do negócio
- `/categorias` — diretório de categorias
- `/categorias/[slug]` — negócios por categoria
- `/locais` — diretório territorial
- `/locais/[cidade]` — negócios por cidade
- `/locais/[cidade]/[categoria]` — negócios por cidade e categoria
- `/ofertas` — ofertas públicas
- `/ofertas/[slug]` — detalhe da oferta
- `/pesquisar` — pesquisa pública, partilhável e não indexável

As entradas de autenticação são públicas no sentido técnico, mas pertencem aos produtos Cliente, Negócio, POS e Administração. Devem manter identidades e fluxos próprios, sem serem tratadas como páginas editoriais ou de SEO.

## Lacunas confirmadas

- `/termos` e `/privacidade` são referenciadas no cadastro, mas ainda não existem. São páginas públicas obrigatórias antes do lançamento.
- Não existe atualmente uma rota `/blog`; qualquer decisão de a introduzir deve incluir modelo de conteúdo, autoria, SEO e publicação, em vez de uma página meramente visual.
- O contacto público está concentrado em `/ajuda`; não existe uma rota autónoma `/contactos`.

## Princípios de convergência

1. Usar a fundação `rv-*` já adotada na página inicial, sem criar um terceiro sistema visual.
2. Limitar o conteúdo a `80rem`, com os mesmos alinhamentos do cabeçalho e rodapé.
3. Reservar a capulana para momentos de marca, com presença subtil e intencional.
4. Evitar contentores dentro de contentores e usar cartões apenas para elementos repetidos ou interativos.
5. Fazer cada página conduzir à próxima ação através de ligações reais.
6. Exibir informação pública real de negócios, campanhas e ofertas, com estados vazios úteis.
7. Garantir leitura, toque e navegação em 320, 375, 390, 430, 768, 1024, 1280 e 1440 píxeis.

## Ordem de implementação

### Bloco 1 — Fundação e narrativa

- Consolidar cabeçalho, rodapé, largura, tipografia, botões e estados de foco.
- Atualizar `/como-funciona` como página-modelo do sistema.

### Bloco 2 — Aquisição

- Atualizar `/clientes` e `/negocios`.
- Atualizar `/precos` e assegurar a continuidade com o cadastro de negócio.

### Bloco 3 — Descoberta

- Atualizar `/estabelecimentos`, `/categorias`, `/locais`, `/ofertas` e `/pesquisar`.
- Unificar filtros, pesquisa, paginação, cartões e estados vazios.

### Bloco 4 — Detalhe e conversão

- Atualizar os perfis de estabelecimentos e detalhes de ofertas.
- Tornar campanhas, ofertas e ações de adesão totalmente navegáveis.

### Bloco 5 — Confiança

- Atualizar `/ajuda` e as ligações para suporte, privacidade e termos.
- Executar auditoria responsiva, acessibilidade, SEO e desempenho.

## Critérios de conclusão

- Não existem páginas públicas a reutilizar heranças visuais antigas incompatíveis.
- Cabeçalho, rodapé, botões, títulos, grelhas e ritmos seguem uma única fundação.
- Não existem sobreposições, texto cortado ou deslocamento horizontal nos breakpoints suportados.
- Todos os CTA e filtros têm destino ou comportamento real.
- Conteúdo dinâmico apresenta carregamento, vazio, erro e sucesso de forma consistente.
- Lint, TypeScript, testes relevantes, Playwright e build de produção passam.
