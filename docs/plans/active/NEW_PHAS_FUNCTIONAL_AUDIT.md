# Auditoria funcional dos desenhos NEW PHAS

## Objetivo

Cruzar os desenhos NEW PHAS mais recentes com a aplicação, a base de dados e as operações de
servidor existentes. Um ecrã visualmente implementado não é considerado funcional enquanto os
seus controlos não tiverem validação, persistência, permissões, estados de erro e testes.

## Âmbito revisto

- páginas públicas desktop e mobile;
- área do cliente e cartão digital;
- portal de gestão do negócio;
- fluxo transacional e definições do POS;
- administração da plataforma;
- tabelas, RLS, RPCs, ações de servidor e testes associados.

## Resultado executivo

O núcleo da VUYELA está funcional: autenticação, MFA administrativo, cartões e QR privados,
consulta de saldos, ledger, acumulação e resgate de pontos, dashboard do negócio, campanhas,
notificações in-app/e-mail, indicações, subscrições e operações administrativas principais.

Os desenhos mais recentes, porém, introduzem operações que ainda não estão completas. As maiores
lacunas são a gestão de filiais e equipa, o catálogo de serviços, a configuração persistente do
terminal, a autorização financeira dos pagamentos, ações avançadas do cliente e controlos
administrativos de identidade, suporte, fraude e configurações globais.

## Matriz por área

### Páginas públicas

**Implementado**

- navegação desktop/mobile, autenticação e registo;
- páginas Início, Como funciona, Clientes, Negócios, Preços e Ajuda;
- dados públicos de estabelecimentos, categorias, locais e ofertas vindos do Supabase;
- pesquisa e categorias do FAQ;
- seleção mensal/anual de preços;
- SEO, sitemap, metadados e estados vazios.

**Parcial ou em falta**

- contactos e redes sociais ainda não possuem gestão de conteúdo no admin;
- o plano selecionado não é transportado para o onboarding nem existe contratação self-service;
- os ícones das redes sociais no rodapé não têm destino configurado;
- não existe CMS para os textos institucionais apresentados nos desenhos.

### Área do cliente

**Implementado**

- início, cartões, detalhe, frente/verso, QR, atividade, ofertas, notificações e perfil;
- atualização de nome, telefone e consentimento de marketing;
- pesquisa e filtros do histórico de pontos;
- filtros reais de ofertas por categoria;
- leitura individual de notificações;
- acesso condicionado às áreas Negócio e POS;
- identificação no POS por QR, número do cartão ou telefone.

**Parcial ou em falta**

- os filtros Parceiros, Lojas e Favoritos da gestão de cartões são apenas visuais;
- não existe persistência de cartões ou negócios favoritos;
- os filtros Transações, Ofertas e Sistema nas notificações são apenas visuais;
- Marcar todas como lidas está desativado;
- Mais opções no detalhe do cartão está desativado;
- data de nascimento não existe no perfil e o campo está desativado;
- PIN, biometria/WebAuthn, idioma e preferências de segurança do desenho não estão modelados;
- a oferta pode ser consultada, mas não existe ativação, reserva ou utilização auditável do
  benefício;
- a meta Próxima recompensa é estimada visualmente e não está ligada a uma recompensa configurada.

### Portal do negócio

**Implementado**

- visão geral, cartões, clientes, fidelização, analítica, transações e visão do POS com dados reais;
- seleção segura de negócio e filial;
- exportação CSV dos dados autorizados;
- edição do perfil público, regras de fidelização e filial principal;
- criação de campanhas e audiências no servidor;
- notificações in-app e e-mail para campanhas configuradas;
- configuração e histórico do programa de indicações;
- consulta de subscrição, utilização e catálogo de planos.
- criação, edição, suspensão, reativação e remoção condicionada de filiais;
- convites privados, funções, filiais e estado da equipa;
- catálogo persistente de serviços e produtos para utilização no POS;
- detalhe operacional e suspensão, reativação ou arquivo de cartões;
- ciclo de campanhas com edição de calendário, duplicação, pausa, retoma e cancelamento;
- criação, edição, publicação, suspensão e remoção condicionada de ofertas.

**Parcial ou em falta**

- a mudança de plano não pode ser solicitada ou contratada pelo negócio;
- os relatórios não têm intervalos, filtros e exportação PDF reais;
- alguns estados de terminal são inferidos na interface e não provêm de um terminal registado.

### POS

**Implementado**

- contexto multi-negócio e multi-filial validado;
- leitura de QR com câmara e alternativas por cartão ou telefone;
- cálculo de valor, desconto, pontos ganhos e pontos utilizados;
- autorização explícita do cliente;
- RPC transacional, ledger obrigatório e proteção contra duplicação;
- cinco etapas do fluxo e estados de erro/sucesso;
- método escolhido e descrição guardados nos metadados da transação.

**Parcial ou em falta**

- o serviço/produto é texto livre; não existe catálogo, preço, categoria ou disponibilidade;
- M-Pesa, e-Mola, mKesh e cartão são seleções locais, sem pedido ao provedor, callback ou estado;
- a tabela `transaction_payments` existe, mas o fluxo atual não cria o respetivo registo;
- a transação de fidelização pode ser concluída antes de existir confirmação financeira externa;
- Geral, Dispositivos, Impressora, Rede, Utilizadores e Segurança são vistas de consulta;
- os métodos de pagamento apresentam identificadores mascarados de demonstração;
- não há registo de terminal, ativação, revogação, health check ou associação de dispositivo;
- não há impressão ESC/POS nem comprovativo digital descarregável;
- não existe política persistida de métodos disponíveis por negócio/filial/terminal.

### Administração

**Implementado**

- MFA e capacidades separadas por função;
- aprovação, devolução, suspensão e reativação de negócios com auditoria;
- criação e edição de categorias;
- alteração controlada de funções de utilizadores;
- configuração e atribuição de planos;
- atualização do estado, prioridade e responsável de tickets;
- resolução e reabertura de alertas de fraude;
- auditoria imutável, pesquisa e filtros básicos;
- analítica real e exportação CSV;
- detalhe de negócio e utilizador com dados reais.

**Parcial ou em falta**

- Enviar notificação no detalhe do negócio não está implementado;
- Suspender conta e Repor palavra-passe no detalhe do utilizador não estão implementados;
- o suporte guarda resolução, mas não mantém uma conversa nem envia a resposta ao requerente;
- fraude só permite resolver/reabrir; faltam investigar, ignorar e bloquear conta com estados
  distintos;
- os períodos 30D e 90D da analítica são apenas visuais;
- Exportar PDF/CSV produz apenas CSV;
- paginação apresentada nos desenhos não está implementada em todas as listas;
- configurações globais são leitura de ambiente; os switches e campos não persistem alterações;
- não existe gestão segura de webhook, rotação de chave ou histórico de configuração.

## Modelo de dados necessário

As novas funcionalidades devem ser adicionadas por migrations descritivas e na ordem documentada.
O modelo deve incluir, depois de validação detalhada:

1. `business_catalog_items` para serviços e produtos usados no POS;
2. `pos_terminals` e `pos_terminal_settings` para identidade, filial, estado e políticas;
3. `pos_terminal_devices` para impressoras e dispositivos revogáveis;
4. `business_payment_channels` para ativação e configuração sem expor segredos ao navegador;
5. `payment_attempts` para estado, referência, callback e idempotência dos provedores;
6. utilização efetiva de `transaction_payments` após confirmação financeira;
7. `business_member_invitations` ou RPC equivalente para convites seguros de equipa;
8. `customer_business_preferences` para favoritos e preferências por programa;
9. `offer_claims` para ativação e utilização auditável de benefícios;
10. campos de perfil estritamente necessários, incluindo data de nascimento opcional;
11. `support_ticket_messages` para conversa e entrega de respostas;
12. `platform_settings` para opções não secretas, com histórico de auditoria;
13. estado de conta e RPCs administrativos para suspensão e recuperação controladas.

Credenciais de provedores não devem ser guardadas em texto simples nem devolvidas ao browser. A
base de dados deve guardar apenas referências seguras, estado, identificação mascarada e dados de
auditoria quando os segredos forem geridos por um cofre ou variável de servidor.

## Dependências externas

O fluxo pode ser preparado com adaptadores e modo de confirmação manual, mas a integração real
exige dados externos:

- contrato, ambiente de testes, credenciais e documentação de callback do M-Pesa;
- equivalentes do e-Mola e mKesh;
- decisão sobre cartões: terminal externo com confirmação manual ou adquirente integrado;
- configuração de SMS/WhatsApp/push, caso esses canais sejam ativados;
- modelo de impressora e estratégia compatível com o navegador ou aplicação instalada.

Sem estes elementos, a interface deve identificar honestamente o método como manual ou não
configurado. Não deve apresentar um provedor como operacional.

## Ordem recomendada de implementação

### Fase 26 — Contratos e fundação de dados

**Estado no repositório: concluída em 24/08/2026.** As migrations estão prontas para aplicação no
Supabase e as fases seguintes devem usar estes contratos em vez de criar estruturas paralelas.

- fechar regras funcionais dos novos controlos;
- criar tabelas, enums, RLS, RPCs e testes de isolamento;
- preservar as operações de saldo existentes;
- remover estados demonstrativos que pareçam integrações reais.

### Fase 27 — Gestão operacional do negócio

**Estado no repositório e no Supabase: concluída em 25/08/2026.** O portal usa uma única camada
operacional para filiais, equipa, catálogo, cartões, clientes, campanhas e ofertas. As operações
privilegiadas validam a pertença ao negócio, usam tokens de convite com hash e criam registos de
auditoria. A aceitação de convites está disponível através de uma ligação privada com prazo.

- CRUD de filiais;
- convites, funções e suspensão da equipa;
- catálogo de serviços/produtos;
- detalhe e controlo de cartões/clientes;
- ciclo completo de campanhas e ofertas.

### Fase 28 — POS transacional completo

**Estado no repositório e no Supabase: concluída em 25/08/2026.** Terminais, definições,
dispositivos e canais de pagamento são persistentes. A confirmação transacional é idempotente,
regista a tentativa e o pagamento, executa o movimento de fidelização no servidor e produz o
recibo reconciliado. Provedores externos permanecem indisponíveis enquanto não houver credenciais.

- terminais e definições persistentes;
- seleção de itens do catálogo;
- canais permitidos por terminal;
- estado de pagamento, confirmação manual segura e adaptadores de provedores;
- `transaction_payments`, recibo e reconciliação.

### Fase 29 — Fluxo completo do cliente

**Estado no repositório e no Supabase: concluída em 25/08/2026.** Favoritos, avisos por negócio e
ativações de ofertas são persistentes, validados por cartão ativo e ligados ao catálogo público
vigente. Os códigos de utilização são gerados no servidor e todas as alterações são auditadas.

- favoritos e filtros reais;
- filtros e leitura em massa de notificações;
- perfil alargado e preferências;
- ativação/utilização de ofertas;
- recompensa seguinte baseada em regras reais.

### Fase 30 — Operações administrativas completas

**Estado no repositório e no Supabase: concluída em 25/08/2026.** O painel permite suspender e
reativar contas com efeito imediato no acesso, responder e adicionar notas a pedidos de suporte,
atribuir e decidir triagens de fraude, editar definições globais não secretas e exportar dados com
registo de auditoria. Filtros e paginação deixam de ser apenas visuais.

- suspensão/recuperação de conta;
- notificações administrativas;
- conversa de suporte;
- triagem de fraude com estados completos;
- analítica parametrizada, paginação e exportação;
- configurações globais persistentes e auditadas.

### Fase 31 — Convergência e produção

**Estado: em implementação desde 28/08/2026.** A primeira entrega corrige a recuperação de acesso
por portal, substitui filtros decorativos do cliente por controlos reais, pagina histórico e
notificações no servidor, permite guardar a data de nascimento, adiciona leitura em massa de
avisos, estados globais de erro, health check e uma porta de qualidade em GitHub Actions.

- testes unitários, integração, RLS e E2E dos fluxos completos;
- comparação visual Figma em mobile e desktop;
- acessibilidade, desempenho e revisão ortográfica;
- build, migração de produção, monitorização e plano de reversão.

Para concluir a fase ainda é necessário configurar as contas E2E dedicadas no GitHub, executar a
suite autenticada contra um ambiente isolado, fechar os avisos live de segurança do Supabase e
validar os quatro portais em produção. A monitorização externa do health check está configurada
para testar aplicação e Supabase a cada cinco minutos, abrir um único incidente no GitHub e
fechá-lo automaticamente após recuperação.

Auditoria live de 28/08/2026: o advisor de desempenho não apresentou avisos ou erros, apenas
índices ainda sem utilização num projeto com pouco tráfego. O advisor de segurança continua a
indicar a proteção contra palavras-passe expostas como desativada, uma tabela administrativa com
RLS sem política direta e funções `SECURITY DEFINER` executáveis pelos papéis públicos. Estas
funções devem ser classificadas entre RPCs intencionalmente expostas e helpers internos antes de
qualquer revogação, para não interromper RLS, adesões, POS ou movimentos de YELAS.

Gate local de 28/08/2026: lint e typecheck aprovados, 252 testes unitários/integração aprovados,
build de produção aprovado e Playwright determinístico com 86 testes aprovados e 2 ignorados por
serem específicos do outro dispositivo. O teste responsivo que falhou uma vez no primeiro CI foi
estabilizado e aprovado em cinco repetições adicionais. A suite autenticada permanece dependente
das contas E2E dedicadas descritas em `.env.e2e.example`.

## Critério de conclusão

Cada controlo dos desenhos deve terminar num destes estados explícitos:

- ação real concluída e confirmada;
- ação manual claramente identificada e auditada;
- indisponível por configuração, com indicação verdadeira;
- removido do ecrã por não pertencer ao produto atual.

Não devem permanecer botões desativados sem explicação, filtros decorativos, credenciais fictícias
ou estados “online” que não venham de uma verificação real.
