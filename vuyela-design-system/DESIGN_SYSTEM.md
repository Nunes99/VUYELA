# VUYELA — Especificação do Design System

## 1. Princípios

**Tecnologia com proximidade.** A interface deve parecer avançada sem exigir conhecimento técnico.

**Valor explícito.** Sempre que pontos forem mostrados, apresentar também o valor equivalente em meticais e o estabelecimento responsável.

**Cultura como sistema, não decoração.** Padrões inspirados na geometria das capulanas devem ser utilizados como textura secundária, nunca como ruído sobre conteúdos críticos.

**Uma acção dominante.** Cada ecrã transaccional deve indicar claramente a próxima acção: identificar cliente, registar compra, utilizar pontos ou confirmar.

**Mobile-first.** Os fluxos do cliente e do POS devem ser concebidos primeiro para telemóveis e redes móveis limitadas.

## 2. Cores

| Papel | Token | Valor | Uso |
|---|---|---:|---|
| Marca principal | `--vy-color-indigo` | `#073B4C` | Navegação, títulos, fundos institucionais |
| Acção digital | `--vy-color-teal` | `#00A6A6` | Estados activos, links e interacções |
| Recompensa | `--vy-color-gold` | `#F2B544` | Pontos, saldo e CTA principal |
| Campanha | `--vy-color-coral` | `#D95D4F` | Promoções e comunicação humana |
| Base cultural | `--vy-color-sand` | `#F7F2E8` | Fundos acolhedores |
| Texto | `--vy-color-graphite` | `#172126` | Conteúdo principal |

Nunca utilizar dourado como cor de sucesso ou erro. O dourado é reservado ao conceito de recompensa.

## 3. Tipografia

- **Sora:** títulos, valores de destaque e comunicação institucional.
- **Inter:** formulários, tabelas, botões, navegação e texto corrido.
- Números financeiros devem utilizar peso 700–900 e separadores locais.
- Tamanho mínimo normal: 14 px. Informações legais podem utilizar 12 px, desde que com contraste adequado.

## 4. Espaçamento

A escala utiliza base de 4 px. Preferir 8, 12, 16, 24, 32, 48, 64 e 96 px. Não criar espaçamentos arbitrários sem justificar um novo token.

## 5. Responsividade

| Nome | Largura | Uso principal |
|---|---:|---|
| `xs` | 480 px | Telemóveis compactos |
| `sm` | 760 px | Telemóveis grandes e tablets verticais |
| `md` | 1080 px | Tablets horizontais e portáteis pequenos |
| `lg` | 1280 px | Computadores |

- Container máximo: 1180 px.
- Gutter: 20 px no desktop; 14 px no mobile.
- Touch targets: mínimo 44 × 44 px.
- Tabelas devem utilizar scroll horizontal abaixo de 760 px; não reduzir texto até se tornar ilegível.

## 6. Componentes essenciais

### Button

Variantes: `primary`, `reward`, `secondary`, `outline`, `ghost`, `danger`.

- `reward` é o CTA comercial principal.
- `primary` é usado em acções operacionais e administrativas.
- `danger` exige texto explícito; não utilizar apenas ícone em acções destrutivas críticas.
- Estado de loading preserva a largura do botão.

### Badge

Utilizar para estados curtos: activo, pendente, expirado, campanha, nível ou tendência. Nunca usar badge como substituto de uma frase explicativa quando a consequência for importante.

### Field

Todos os campos precisam de label persistente. Placeholder não substitui label. Erros devem explicar como corrigir o valor.

### LoyaltyCard

Informação mínima:

1. estabelecimento;
2. saldo em pontos;
3. equivalente em MZN;
4. titular;
5. número do cartão;
6. estado.

O cartão de cada estabelecimento pode incorporar a sua identidade, mas deve manter a área de saldo e as regras de legibilidade da VUYELA.

### StatCard

Mostrar sempre período de comparação quando existir tendência. Exemplo: “+12% comparado com os 30 dias anteriores”.

### Modal

Utilizar para tarefas curtas. Processos com mais de dois passos devem abrir uma página ou drawer dedicado.

### Table

- Cabeçalho fixo quando a lista ultrapassar a altura do ecrã.
- Valores monetários alinhados à direita.
- Estado apresentado por texto e cor.
- Acções secundárias dentro de menu contextual.

## 7. Estados do produto

Todos os módulos devem prever:

- loading;
- vazio;
- sucesso;
- erro recuperável;
- erro de permissão;
- offline;
- dados parcialmente sincronizados.

Mensagens vazias devem explicar o benefício da primeira acção. Exemplo: “Ainda não possui clientes neste programa. Partilhe o QR de adesão para emitir o primeiro cartão.”

## 8. Acessibilidade

- WCAG 2.2 AA como referência mínima.
- Foco visível obrigatório.
- Contraste mínimo de 4,5:1 em texto normal.
- Não comunicar estado exclusivamente por cor.
- Modais devem fechar com Escape, recuperar foco e possuir nome acessível.
- Animações devem respeitar `prefers-reduced-motion`.
- QR Codes precisam de alternativa por número ou código manual.

## 9. Conteúdo e terminologia

Preferir:

- “Utilizar pontos” em vez de “Resgatar saldo”.
- “Valor restante a pagar” em vez de “Balanço da transacção”.
- “Equivalente a 250 MZN neste estabelecimento” em vez de “250 MZN disponíveis”, para evitar interpretação como dinheiro levantável.
- “Pontos expiraram” acompanhado da data e da regra aplicável.

## 10. Governança

O design system é propriedade do produto VUYELA e mantido pela LEMOTE.

- Product Design aprova mudanças visuais.
- Engenharia valida viabilidade, acessibilidade e performance.
- Produto valida terminologia e comportamento.
- Alterações em tokens são tratadas como mudanças globais.
- Componentes obsoletos devem permanecer documentados durante pelo menos uma versão menor antes da remoção.
