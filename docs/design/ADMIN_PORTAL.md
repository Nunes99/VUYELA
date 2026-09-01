# Portal de administracao VUYELA

## Objetivo

O portal de administracao apresenta a operacao global da VUYELA sem misturar os fluxos do cliente, do negocio ou do POS. A composicao segue a referencia do painel Figma: navegacao lateral persistente, cabecalho de identidade e uma visao geral orientada para operacao.

## Estrutura da visao geral

- Indicadores de negocios, utilizadores, transacoes, volume, subscricoes e aprovacoes.
- Evolucao transacional de seis meses e distribuicao por metodo de pagamento.
- Operacao acumulada, estado dos servicos, negocios e categorias com maior volume.
- Churn, resposta ao suporte, mapa de calor por hora e funil de conversao.
- Atividade administrativa recente proveniente dos registos imutaveis de auditoria.

## Contrato de dados

- Os dados administrativos sao carregados exclusivamente no servidor com o cliente service-role, depois da validacao de funcao, capacidade e MFA.
- As metricas operacionais usam `transactions`, `transaction_payments`, `profiles`, `customer_cards`, `business_payment_channels`, `pos_terminals`, `support_tickets` e os RPC administrativos protegidos.
- Valores monetarios sao guardados em unidades menores e apresentados sempre com a abreviatura `MZN`.
- A interface nao inventa dados de trafego ou pesquisa. Esses blocos apresentam um estado indisponivel ate existir uma integracao de telemetria consentida.
- As operacoes privilegiadas continuam a ser executadas por Server Actions e funcoes PostgreSQL auditadas; o painel e apenas a superficie de leitura e comando.

## Responsividade

- Em desktop, a barra lateral permanece fixa e o conteudo usa uma grelha de 12 colunas visuais.
- Em ecras intermedios, graficos e paineis passam para uma coluna sem perder rotulos.
- Em mobile, a navegacao transforma-se numa grelha compacta, os indicadores ficam numa coluna e nenhum bloco pode aumentar a largura da pagina.

## Pre-visualizacao local

A rota `/dev/admin` fornece dados de demonstracao apenas em desenvolvimento para comparacao visual e testes automatizados. Em producao, a rota responde com `404`; `/admin` usa sempre dados reais e as protecoes de acesso da plataforma.
