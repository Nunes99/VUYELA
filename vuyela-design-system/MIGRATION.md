# Migração do protótipo para o Design System

## Objectivo

Substituir valores e classes locais do protótipo por tokens e componentes compartilhados, sem alterar o comportamento visual de uma só vez.

## Etapa 1 — Tokens

No `styles.css` actual, substituir gradualmente:

| Classe/variável antiga | Novo token              |
| ---------------------- | ----------------------- |
| `--ink`                | `--vy-color-indigo`     |
| `--ink-900`            | `--vy-color-indigo-900` |
| `--ink-950`            | `--vy-color-indigo-950` |
| `--teal`               | `--vy-color-teal`       |
| `--gold`               | `--vy-color-gold`       |
| `--coral`              | `--vy-color-coral`      |
| `--sand`               | `--vy-color-sand`       |
| `--graphite`           | `--vy-color-graphite`   |
| `--muted`              | `--vy-text-muted`       |
| `--line`               | `--vy-border`           |
| `--shadow`             | `--vy-shadow-md`        |
| `--soft-shadow`        | `--vy-shadow-sm`        |

## Etapa 2 — Classes básicas

| Protótipo         | Design system                                        |
| ----------------- | ---------------------------------------------------- |
| `.container`      | `.vy-container`                                      |
| `.section`        | `.vy-section`                                        |
| `.section-tight`  | `.vy-section--compact`                               |
| `.btn`            | `.vy-button`                                         |
| `.btn-primary`    | `.vy-button--reward`                                 |
| `.btn-ink`        | variante React `primary`                             |
| `.btn-ghost`      | `.vy-button--outline` ou `ghost` conforme o contexto |
| `.pill`           | `.vy-badge.vy-badge--brand`                          |
| `.form-control`   | `.vy-field__control`                                 |
| `.dashboard-card` | `.vy-stat`                                           |
| `.loyalty-card`   | `.vy-loyalty-card`                                   |

## Etapa 3 — React/Next.js

1. Criar `app/(public)`, `app/(customer)`, `app/(business)` e `app/admin`.
2. Mover elementos repetidos para componentes do design system.
3. Manter operações de pontos no backend; componentes apenas recolhem e apresentam dados.
4. Adicionar Storybook ou Ladle quando o conjunto ultrapassar 15 componentes.
5. Introduzir testes visuais antes de remover o protótipo HTML.

## Ordem recomendada

1. Botões e formulários.
2. Cartões e badges.
3. Header e navegação.
4. Dashboard e tabelas.
5. Cartão de fidelização e fluxo POS.
6. Modais, alertas e empty states.
