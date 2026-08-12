# Checklist de acessibilidade

## Geral

- [ ] Contraste AA validado em todos os temas.
- [ ] Ordem de tabulação corresponde à ordem visual.
- [ ] Foco não é removido por CSS.
- [ ] Alvos interactivos possuem no mínimo 44 × 44 px.
- [ ] Zoom a 200% não remove conteúdo ou funcionalidades.
- [ ] Interface permanece utilizável a 320 px de largura.

## Formulários

- [ ] Cada controlo possui label programaticamente associada.
- [ ] Erros utilizam `aria-invalid` e `aria-describedby`.
- [ ] Mensagens explicam correcção, não apenas o problema.
- [ ] Campos obrigatórios são indicados por texto ou semântica.

## Fidelização e pagamentos

- [ ] Saldo de pontos é anunciado com estabelecimento e equivalente em MZN.
- [ ] Operação de utilização possui confirmação clara.
- [ ] QR Code possui opção de código manual.
- [ ] Estado pendente não é apresentado como concluído.

## Modais e menus

- [ ] Modal possui `role="dialog"` e `aria-modal="true"`.
- [ ] Escape fecha o modal.
- [ ] Foco retorna ao elemento que abriu o modal.
- [ ] Menu mobile informa `aria-expanded`.

## Movimento

- [ ] `prefers-reduced-motion` é respeitado.
- [ ] Nenhuma animação de feedback bloqueia a próxima acção.
- [ ] Conteúdo importante não depende de animação para aparecer.
