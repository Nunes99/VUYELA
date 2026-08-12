"use client";

import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  BottomNavigation,
  Breadcrumb,
  BusinessCard,
  Button,
  Checkbox,
  Chip,
  DataTable,
  Drawer,
  DropdownMenu,
  EmptyState,
  FilterBar,
  IconButton,
  Input,
  LoyaltyCard,
  Navbar,
  OfferCard,
  Pagination,
  PointsBalance,
  Popover,
  QRDisplay,
  QRScanner,
  Radio,
  RewardBadge,
  SearchInput,
  Select,
  Sidebar,
  Skeleton,
  StatCard,
  Switch,
  Tabs,
  Textarea,
  Toast,
  Tooltip,
  TransactionItem
} from "@lemote/vuyela-design-system";
import {
  Check,
  CreditCard,
  Download,
  Home,
  Menu,
  MoreHorizontal,
  Settings,
  Sparkles,
  Store,
  Ticket,
  Users
} from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Fundacao", href: "#fundacao", active: true },
  { label: "Componentes", href: "#componentes" },
  { label: "Fidelizacao", href: "#fidelizacao" },
  { label: "Dados", href: "#dados" }
];

const transactions = [
  { id: "txn-1", customer: "Maria da Silva", value: "1.250 MZN", points: "+63" },
  { id: "txn-2", customer: "Amilcar M.", value: "800 MZN", points: "+40" },
  { id: "txn-3", customer: "Rosa C.", value: "300 MZN", points: "-120" }
];

const transactionColumns = [
  {
    key: "customer",
    header: "Cliente",
    render: (row: (typeof transactions)[number]) => row.customer
  },
  {
    key: "value",
    header: "Compra",
    render: (row: (typeof transactions)[number]) => row.value,
    align: "right" as const
  },
  {
    key: "points",
    header: "Pontos",
    render: (row: (typeof transactions)[number]) => row.points,
    align: "right" as const
  }
];

export function DesignSystemShowcase() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <main className="ds-page">
      <section className="ds-hero" id="fundacao">
        <div className="vy-container ds-hero__inner">
          <div>
            <Badge tone="reward">FASE 01</Badge>
            <h1>VUYELA Design System</h1>
            <p>
              Fundacao visual e componentes reutilizaveis para construir fluxos moveis, acessiveis e
              consistentes da plataforma VUYELA by LEMOTE.
            </p>
            <div className="ds-actions">
              <Button variant="reward" leadingIcon={<CreditCard size={18} />}>
                Quero um cartao
              </Button>
              <Button variant="outline" leadingIcon={<Store size={18} />}>
                Sou um negocio
              </Button>
            </div>
          </div>
          <LoyaltyCard
            businessName="Restaurante Mares"
            points={250}
            valueMzn={250}
            customerName="Maria da Silva"
            cardNumber="VY-2408-0025"
          />
        </div>
      </section>

      <section className="vy-container ds-section" aria-labelledby="tokens-heading">
        <div className="ds-section__header">
          <span>Tokens</span>
          <h2 id="tokens-heading">Marca, tema e estados</h2>
        </div>
        <div className="ds-token-grid">
          {[
            ["Indigo", "#073B4C"],
            ["Teal", "#00A6A6"],
            ["Gold", "#F2B544"],
            ["Coral", "#D95D4F"],
            ["Sand", "#F7F2E8"],
            ["Graphite", "#172126"]
          ].map(([name, value]) => (
            <article className="ds-token" key={name}>
              <span style={{ background: value }} />
              <strong>{name}</strong>
              <code>{value}</code>
            </article>
          ))}
        </div>
        <div className="ds-theme-grid">
          <Alert title="Tema claro" tone="success" icon={<Check size={18} />}>
            Superficies limpas para operacao diaria, POS e dashboards.
          </Alert>
          <div data-theme="dark" className="ds-dark-sample">
            <Alert title="Tema escuro" tone="info" icon={<Sparkles size={18} />}>
              Base pronta para superficies premium e alto contraste.
            </Alert>
          </div>
        </div>
      </section>

      <section
        className="vy-container ds-section"
        id="componentes"
        aria-labelledby="controls-heading"
      >
        <div className="ds-section__header">
          <span>Componentes</span>
          <h2 id="controls-heading">Acoes, formularios e feedback</h2>
        </div>
        <div className="ds-component-grid">
          <article className="ds-example">
            <h3>Botoes</h3>
            <div className="ds-inline">
              <Button variant="primary">Guardar</Button>
              <Button variant="reward">Emitir pontos</Button>
              <Button variant="outline">Cancelar</Button>
              <Button variant="danger">Suspender</Button>
              <IconButton label="Abrir menu" icon={<Menu />} variant="outline" />
              <Tooltip content="Descarregar relatorio">
                <IconButton label="Descarregar" icon={<Download />} variant="ghost" />
              </Tooltip>
              <Avatar name="VUYELA LEMOTE" />
            </div>
          </article>
          <article className="ds-example">
            <h3>Campos</h3>
            <div className="ds-form-grid">
              <Input label="Nome do negocio" placeholder="Ex.: Restaurante Mares" requiredMark />
              <Select label="Categoria" defaultValue="restaurante">
                <option value="restaurante">Restaurante</option>
                <option value="ginasio">Ginasio</option>
                <option value="farmacia">Farmacia</option>
              </Select>
              <Textarea
                label="Mensagem da campanha"
                placeholder="Volte esta semana e ganhe pontos extra."
              />
              <Input label="NUIT" error="Informe um NUIT valido." defaultValue="123" />
            </div>
          </article>
          <article className="ds-example">
            <h3>Selecao</h3>
            <div className="ds-stack">
              <Checkbox
                label="Enviar comprovativo por email"
                hint="Cliente recebe os pontos e o resumo."
                defaultChecked
              />
              <Radio label="Plano mensal" name="billing" defaultChecked />
              <Radio label="Plano anual" name="billing" />
              <Switch
                label="Campanha activa"
                hint="Pode ser pausada a qualquer momento."
                defaultChecked
              />
              <div className="ds-inline">
                <Chip selected icon={<Ticket size={14} />}>
                  Ofertas
                </Chip>
                <Chip>Maputo</Chip>
                <Chip>Aberto agora</Chip>
              </div>
            </div>
          </article>
          <article className="ds-example">
            <h3>Feedback</h3>
            <div className="ds-stack">
              <Alert title="Pontos creditados" tone="success" icon={<Check size={18} />}>
                O cliente recebeu 50 pontos neste estabelecimento.
              </Alert>
              <Toast title="QR gerado" description="O codigo expira em 2 minutos." tone="info" />
              <EmptyState
                title="Ainda nao existem campanhas"
                description="Crie a primeira campanha depois de configurar o programa de fidelizacao."
                icon={<Sparkles size={20} />}
                action={<Button size="sm">Criar campanha</Button>}
              />
            </div>
          </article>
        </div>
      </section>

      <section className="vy-container ds-section" aria-labelledby="navigation-heading">
        <div className="ds-section__header">
          <span>Navegacao</span>
          <h2 id="navigation-heading">Estruturas para publico e dashboards</h2>
        </div>
        <div className="ds-component-grid">
          <article className="ds-example ds-wide">
            <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Design System" }]} />
            <Navbar
              brand="VUYELA"
              links={navLinks}
              actions={
                <Button size="sm" variant="outline">
                  Entrar
                </Button>
              }
            />
          </article>
          <article className="ds-example">
            <Sidebar
              title="Negocio"
              items={[
                { label: "Dashboard", href: "#", active: true, icon: <Home size={16} /> },
                { label: "Clientes", href: "#", icon: <Users size={16} /> },
                { label: "Programa", href: "#", icon: <Settings size={16} /> }
              ]}
              footer={<Badge tone="brand">Crescimento</Badge>}
            />
          </article>
          <article className="ds-example">
            <BottomNavigation
              items={[
                { label: "Inicio", href: "#", active: true, icon: <Home size={16} /> },
                { label: "Cartoes", href: "#", icon: <CreditCard size={16} /> },
                { label: "Ofertas", href: "#", icon: <Ticket size={16} /> },
                { label: "Perfil", href: "#", icon: <Users size={16} /> }
              ]}
            />
          </article>
        </div>
      </section>

      <section className="vy-container ds-section" aria-labelledby="overlays-heading">
        <div className="ds-section__header">
          <span>Interacao</span>
          <h2 id="overlays-heading">Overlays e organizacao de conteudo</h2>
        </div>
        <div className="ds-component-grid">
          <article className="ds-example">
            <h3>Menus</h3>
            <div className="ds-inline">
              <Popover trigger={<span>Detalhes</span>} title="Regra de pontos">
                <p>1 ponto equivale a 1 MZN promocional neste estabelecimento.</p>
              </Popover>
              <DropdownMenu
                label="Mais"
                items={[
                  { label: "Editar" },
                  { label: "Duplicar" },
                  { label: "Remover", tone: "danger" }
                ]}
              />
              <IconButton
                label="Abrir drawer"
                icon={<MoreHorizontal />}
                onClick={() => setDrawerOpen(true)}
              />
            </div>
          </article>
          <article className="ds-example">
            <h3>Tabs e accordion</h3>
            <Tabs
              tabs={[
                {
                  value: "cliente",
                  label: "Cliente",
                  content: <p>Saldo, cartoes e actividade recente.</p>
                },
                {
                  value: "negocio",
                  label: "Negocio",
                  content: <p>Clientes, campanhas e programa.</p>
                }
              ]}
            />
            <Accordion
              items={[
                {
                  title: "Os pontos podem ser levantados?",
                  content: "Nao. Sao valor promocional do negocio emissor."
                },
                {
                  title: "Os pontos expiram?",
                  content: "Podem expirar conforme regras do estabelecimento."
                }
              ]}
            />
          </article>
        </div>
      </section>

      <section
        className="vy-container ds-section"
        id="fidelizacao"
        aria-labelledby="loyalty-heading"
      >
        <div className="ds-section__header">
          <span>Fidelizacao</span>
          <h2 id="loyalty-heading">Pontos, QR e ofertas</h2>
        </div>
        <div className="ds-component-grid">
          <article className="ds-example">
            <PointsBalance businessName="Restaurante Mares" points={250} />
            <RewardBadge label="Bons clientes voltam" points={50} />
            <TransactionItem
              title="Compra registada"
              description="Restaurante Mares"
              points={50}
              timestamp="Hoje"
            />
            <TransactionItem
              title="Uso de pontos"
              description="Desconto aplicado"
              points={-100}
              timestamp="Ontem"
            />
          </article>
          <BusinessCard
            name="Restaurante Mares"
            category="Restaurante"
            location="Maputo"
            rewardRate="5% em pontos"
            action={<Button size="sm">Aderir</Button>}
          />
          <OfferCard
            title="Pontos em dobro ao almoco"
            businessName="Restaurante Mares"
            description="Ganhe beneficios extra em compras validas de segunda a sexta."
            badge={<Badge tone="reward">Campanha</Badge>}
            action={
              <Button size="sm" variant="outline">
                Ver oferta
              </Button>
            }
          />
          <QRDisplay code="VY-8F2K-91M" expiresAt="02:00" />
          <QRScanner action={<Button size="sm">Activar camara</Button>} />
        </div>
      </section>

      <section className="vy-container ds-section" id="dados" aria-labelledby="data-heading">
        <div className="ds-section__header">
          <span>Dados</span>
          <h2 id="data-heading">Filtros, tabelas e estados</h2>
        </div>
        <div className="ds-stack">
          <FilterBar
            actions={
              <Button size="sm" variant="outline">
                Exportar
              </Button>
            }
          >
            <SearchInput label="Pesquisar cliente" />
            <Chip selected>30 dias</Chip>
            <Chip>Campanhas</Chip>
          </FilterBar>
          <DataTable
            title="Transaccoes recentes"
            description="Exemplo visual sem ligacao a base de dados."
            columns={transactionColumns}
            rows={transactions}
            getRowKey={(row) => row.id}
            toolbar={<Badge tone="info">Demo</Badge>}
          />
          <div className="ds-skeleton-grid">
            <StatCard
              label="Clientes activos"
              value="1.284"
              delta="+12% vs. 30 dias"
              direction="up"
              icon={<Users size={18} />}
            />
            <StatCard
              label="Pontos emitidos"
              value="85.000"
              helperText="Equivalente promocional por estabelecimento."
              icon={<Sparkles size={18} />}
            />
            <StatCard
              label="Taxa de retorno"
              value="42%"
              delta="estavel"
              icon={<Store size={18} />}
            />
          </div>
          <Pagination page={1} pageCount={4} />
          <div className="ds-skeleton-grid">
            <Skeleton height="4rem" />
            <Skeleton height="4rem" />
            <Skeleton height="4rem" />
          </div>
        </div>
      </section>

      <Drawer
        open={drawerOpen}
        title="Drawer de exemplo"
        onClose={() => setDrawerOpen(false)}
        footer={
          <Button size="sm" variant="outline" onClick={() => setDrawerOpen(false)}>
            Fechar
          </Button>
        }
      >
        <p>
          Use drawers para tarefas curtas, revisoes e configuracoes leves sem perder o contexto da
          pagina.
        </p>
      </Drawer>
    </main>
  );
}
