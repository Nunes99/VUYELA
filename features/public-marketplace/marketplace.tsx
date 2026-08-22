import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarClock,
  Gift,
  Globe,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Store,
  Tag
} from "lucide-react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { joinBusinessLoyaltyProgramAction } from "./actions";
import {
  getBusinessCityLabel,
  getBusinessPrimaryCity,
  getExpiryLabel,
  getPointValueLabel,
  getProgramEarnRateLabel
} from "./model";
import type {
  MarketplaceBreadcrumb,
  MarketplaceBusiness,
  MarketplaceDetailViewModel,
  MarketplaceListViewModel,
  MarketplaceOffer,
  MarketplaceOfferViewModel
} from "./model";
import { LocationSearchButton } from "./location-search-button";
import type { MarketplaceSearchViewModel } from "./search";

export function MarketplaceListPage({ viewModel }: { viewModel: MarketplaceListViewModel }) {
  return (
    <main className="marketplace-page">
      <MarketplaceHeader />
      <MarketplaceHero
        eyebrow="Descoberta pública"
        title={viewModel.title}
        description={viewModel.description}
        breadcrumbs={viewModel.breadcrumbs}
      />
      <section className="marketplace-section" aria-labelledby="marketplace-results-title">
        <div className="vy-container marketplace-results">
          <div className="marketplace-results__main">
            <SectionHeader
              eyebrow="Estabelecimentos"
              title={
                viewModel.businesses.length > 0
                  ? `${viewModel.businesses.length.toLocaleString("pt-MZ")} negócios encontrados`
                  : "Ainda sem estabelecimentos para publicar"
              }
              description={
                viewModel.businesses.length > 0
                  ? "Cada perfil mostra pontos, benefícios, localização e ofertas públicas ativas."
                  : "Esta página fica fora do índice enquanto não houver conteúdo público suficiente."
              }
              id="marketplace-results-title"
            />
            {viewModel.businesses.length > 0 ? (
              <div className="marketplace-business-grid">
                {viewModel.businesses.map((business) => (
                  <BusinessCard business={business} key={business.id} />
                ))}
              </div>
            ) : (
              <MarketplaceEmptyState />
            )}
          </div>
          <aside className="marketplace-sidebar" aria-label="Explorar marketplace">
            <MarketplaceFacetSection
              title="Categorias"
              items={viewModel.categories.map((category) => ({
                href: `/categorias/${category.slug}`,
                label: category.name,
                meta: `${category.businessCount.toLocaleString("pt-MZ")} negócios`
              }))}
            />
            <MarketplaceFacetSection
              title="Cidades"
              items={viewModel.cities.map((city) => ({
                href: `/locais/${city.slug}`,
                label: city.name,
                meta: `${city.businessCount.toLocaleString("pt-MZ")} negócios`
              }))}
            />
          </aside>
        </div>
      </section>
      <OffersBand offers={viewModel.offers} />
    </main>
  );
}

export function BusinessDetailPage({ viewModel }: { viewModel: MarketplaceDetailViewModel }) {
  const { business } = viewModel;
  const primaryBranch =
    business.branches.find((branch) => branch.isPrimary) ?? business.branches[0];

  return (
    <main className="marketplace-page">
      <MarketplaceHeader />
      <MarketplaceHero
        eyebrow={business.category?.name ?? "Estabelecimento VUYELA"}
        title={business.name}
        description={getBusinessDescription(business)}
        breadcrumbs={viewModel.breadcrumbs}
        imageUrl={business.coverUrl}
      />
      <section className="marketplace-section marketplace-section--detail">
        <div className="vy-container marketplace-detail-layout">
          <article className="marketplace-detail">
            <div className="marketplace-detail__identity">
              <BusinessLogo business={business} />
              <div>
                <span>{business.category?.name ?? "Negócio VUYELA"}</span>
                <h2>{business.name}</h2>
                <p>
                  {getBusinessCityLabel(business)} · {getProgramEarnRateLabel(business.program)}
                </p>
              </div>
            </div>

            <div className="marketplace-benefit-grid" aria-label="Benefícios publicados">
              <BenefitTile
                icon={<Gift size={20} />}
                title={getProgramEarnRateLabel(business.program)}
                body="Pontos promocionais acumulados no próprio negócio."
              />
              <BenefitTile
                icon={<ShieldCheck size={20} />}
                title={getPointValueLabel(business.program)}
                body="O saldo tem valor promocional claro no emissor."
              />
              <BenefitTile
                icon={<CalendarClock size={20} />}
                title={getExpiryLabel(business.program)}
                body="As regras publicadas ajudam o cliente a saber quando voltar."
              />
            </div>

            <DetailSection title="Sobre">
              <p>{getBusinessDescription(business)}</p>
            </DetailSection>

            {business.program?.terms ? (
              <DetailSection title="Regras do programa">
                <p>{business.program.terms}</p>
              </DetailSection>
            ) : null}

            <DetailSection title="Filiais">
              <div className="marketplace-branch-list">
                {business.branches.map((branch) => (
                  <article key={branch.id}>
                    <h3>{branch.name}</h3>
                    <p>
                      {branch.addressLine ? `${branch.addressLine}, ` : ""}
                      {branch.city}
                      {branch.province ? `, ${branch.province}` : ""}
                    </p>
                    <div>
                      {branch.phone ? (
                        <a href={`tel:${branch.phone}`}>
                          <Phone size={16} />
                          {branch.phone}
                        </a>
                      ) : null}
                      {branch.email ? (
                        <a href={`mailto:${branch.email}`}>
                          <Mail size={16} />
                          {branch.email}
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </DetailSection>

            <DetailSection title="Perguntas frequentes">
              <div className="marketplace-faq">
                <details>
                  <summary>Posso usar estes pontos noutro negócio?</summary>
                  <p>Não. Os pontos são promocionais e pertencem ao negócio que os emitiu.</p>
                </details>
                <details>
                  <summary>Os pontos podem ser levantados em dinheiro?</summary>
                  <p>
                    Não. Pontos VUYELA não são saldo bancário, dinheiro eletrónico ou valor
                    transferível.
                  </p>
                </details>
              </div>
            </DetailSection>
          </article>

          <aside className="marketplace-detail-aside" aria-label="Resumo do estabelecimento">
            <div className="marketplace-action-panel">
              <h2>Adesão ao programa</h2>
              <p>
                {business.program
                  ? "Entre ou crie uma conta para emitir o seu cartão digital deste negócio."
                  : "O programa de pontos deste negócio está a ser preparado."}
              </p>
              {business.program ? (
                <form action={joinBusinessLoyaltyProgramAction}>
                  <input name="businessId" type="hidden" value={business.id} />
                  <input name="businessSlug" type="hidden" value={business.slug} />
                  <button className="marketplace-button marketplace-button--reward" type="submit">
                    Quero aderir
                    <ArrowRight size={18} />
                  </button>
                </form>
              ) : null}
              <Link className="marketplace-button marketplace-button--ghost" href="/entrar">
                Já tenho conta
              </Link>
            </div>

            {primaryBranch ? (
              <div className="marketplace-map-box">
                <MapPin size={22} />
                <h2>{primaryBranch.city}</h2>
                <p>
                  {primaryBranch.addressLine ?? primaryBranch.name}
                  {primaryBranch.province ? `, ${primaryBranch.province}` : ""}
                </p>
                {business.websiteUrl ? (
                  <a href={business.websiteUrl} rel="noreferrer" target="_blank">
                    <Globe size={16} />
                    Site do negócio
                  </a>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </section>
      <OffersBand offers={viewModel.relatedOffers} />
      <RelatedBusinesses businesses={viewModel.relatedBusinesses} />
    </main>
  );
}

export function OfferDetailPage({ viewModel }: { viewModel: MarketplaceOfferViewModel }) {
  return (
    <main className="marketplace-page">
      <MarketplaceHeader />
      <MarketplaceHero
        eyebrow="Oferta ativa"
        title={viewModel.offer.title}
        description={viewModel.offer.description}
        breadcrumbs={viewModel.breadcrumbs}
        imageUrl={viewModel.business.coverUrl}
      />
      <section className="marketplace-section marketplace-section--detail">
        <div className="vy-container marketplace-detail-layout">
          <article className="marketplace-detail">
            <div className="marketplace-detail__identity">
              <BusinessLogo business={viewModel.business} />
              <div>
                <span>{viewModel.business.name}</span>
                <h2>{viewModel.offer.title}</h2>
                <p>{getOfferMeta(viewModel.offer)}</p>
              </div>
            </div>
            <DetailSection title="Descrição da oferta">
              <p>{viewModel.offer.description}</p>
            </DetailSection>
            <DetailSection title="Onde aproveitar">
              <BusinessCard business={viewModel.business} />
            </DetailSection>
          </article>
          <aside className="marketplace-detail-aside" aria-label="Ação da oferta">
            <div className="marketplace-action-panel">
              <h2>Ver estabelecimento</h2>
              <p>Consulte as regras de pontos e as filiais onde esta oferta pode ser relevante.</p>
              <Link
                className="marketplace-button marketplace-button--reward"
                href={`/estabelecimentos/${viewModel.business.slug}`}
              >
                Abrir perfil
                <ArrowRight size={18} />
              </Link>
            </div>
          </aside>
        </div>
      </section>
      <OffersBand offers={viewModel.relatedOffers} />
    </main>
  );
}

export function MarketplaceSearchPage({ viewModel }: { viewModel: MarketplaceSearchViewModel }) {
  const resultCount = viewModel.businesses.length + viewModel.offers.length;

  return (
    <main className="marketplace-page">
      <MarketplaceHeader />
      <MarketplaceHero
        eyebrow="Busca pública"
        title={viewModel.title}
        description={viewModel.description}
        breadcrumbs={[
          { name: "Início", path: "/" },
          { name: "Pesquisar", path: "/pesquisar" }
        ]}
      />
      <section className="marketplace-section" aria-labelledby="marketplace-search-title">
        <div className="vy-container marketplace-search-layout">
          <aside className="marketplace-search-panel" aria-label="Filtros de busca">
            <form action="/pesquisar" className="marketplace-filter-form">
              <div>
                <label htmlFor="search-q">Texto</label>
                <input
                  defaultValue={viewModel.params.q}
                  id="search-q"
                  maxLength={80}
                  name="q"
                  placeholder="Nome, oferta ou bairro"
                  type="search"
                />
              </div>
              <div>
                <label htmlFor="search-category">Categoria</label>
                <select
                  defaultValue={viewModel.params.category}
                  id="search-category"
                  name="category"
                >
                  <option value="">Todas</option>
                  {viewModel.categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="search-city">Cidade</label>
                <select defaultValue={viewModel.params.city} id="search-city" name="city">
                  <option value="">Todas</option>
                  {viewModel.cities.map((city) => (
                    <option key={city.slug} value={city.slug}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="marketplace-filter-check">
                <input
                  defaultChecked={viewModel.params.offersOnly}
                  name="ofertas"
                  type="checkbox"
                  value="1"
                />
                <span>Com ofertas ativas</span>
              </label>
              <label
                className={
                  viewModel.supportsOpenNow
                    ? "marketplace-filter-check"
                    : "marketplace-filter-check marketplace-filter-check--disabled"
                }
              >
                <input
                  defaultChecked={viewModel.params.openNow && viewModel.supportsOpenNow}
                  disabled={!viewModel.supportsOpenNow}
                  name="aberto"
                  type="checkbox"
                  value="1"
                />
                <span>Aberto agora</span>
              </label>
              {viewModel.params.latitude !== null && viewModel.params.longitude !== null ? (
                <>
                  <input name="lat" type="hidden" value={viewModel.params.latitude.toFixed(5)} />
                  <input name="lng" type="hidden" value={viewModel.params.longitude.toFixed(5)} />
                </>
              ) : null}
              <button className="marketplace-button marketplace-button--reward" type="submit">
                Filtrar resultados
              </button>
            </form>
            <LocationSearchButton />
            {viewModel.activeFilters.length > 0 ? (
              <div className="marketplace-active-filters" aria-label="Filtros ativos">
                {viewModel.activeFilters.map((filter) => (
                  <Link href={filter.href} key={`${filter.key}-${filter.label}`}>
                    {filter.label}
                  </Link>
                ))}
              </div>
            ) : null}
            {viewModel.seoLinks.length > 0 ? (
              <div className="marketplace-seo-links">
                <h2>Páginas relacionadas</h2>
                {viewModel.seoLinks.map((link) => (
                  <Link href={link.href} key={link.href}>
                    <span>{link.label}</span>
                    <small>{link.description}</small>
                  </Link>
                ))}
              </div>
            ) : null}
          </aside>
          <div className="marketplace-search-results">
            <SectionHeader
              eyebrow="Resultados"
              title={
                resultCount > 0
                  ? `${resultCount.toLocaleString("pt-MZ")} resultados encontrados`
                  : "Sem resultados para estes filtros"
              }
              description={
                viewModel.supportsLocation
                  ? "Resultados com coordenadas publicadas aparecem ordenados por proximidade."
                  : "Use filtros ou permita localização para refinar os resultados públicos."
              }
              id="marketplace-search-title"
            />
            {viewModel.businesses.length > 0 ? (
              <div className="marketplace-business-grid">
                {viewModel.businesses.map((business) => (
                  <BusinessCard business={business} key={business.id} />
                ))}
              </div>
            ) : (
              <MarketplaceNoSearchResults />
            )}
            {viewModel.offers.length > 0 ? (
              <div className="marketplace-search-offers">
                <SectionHeader
                  eyebrow="Ofertas"
                  title="Ofertas encontradas"
                  description="Ofertas públicas que combinam com a sua busca."
                  id="marketplace-search-offers-title"
                />
                <div className="marketplace-offer-grid">
                  {viewModel.offers.map((offer) => (
                    <OfferCard offer={offer} key={offer.id} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export function MarketplaceJsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

export function MarketplaceHeader() {
  return (
    <header className="marketplace-header">
      <div className="vy-container marketplace-header__inner">
        <VuyelaLogo className="marketplace-logo" />
        <nav className="marketplace-desktop-nav" aria-label="Navegação pública">
          <Link href="/estabelecimentos">Estabelecimentos</Link>
          <Link href="/categorias">Categorias</Link>
          <Link href="/locais">Locais</Link>
          <Link href="/ofertas">Ofertas</Link>
          <Link href="/pesquisar">Pesquisar</Link>
        </nav>
        <Link className="marketplace-header__cta" href="/entrar">
          Entrar
        </Link>
        <details className="marketplace-mobile-menu">
          <summary aria-label="Abrir navegação pública">
            <Menu aria-hidden="true" size={20} />
          </summary>
          <nav aria-label="Navegação pública mobile">
            <Link href="/estabelecimentos">Estabelecimentos</Link>
            <Link href="/categorias">Categorias</Link>
            <Link href="/locais">Locais</Link>
            <Link href="/ofertas">Ofertas</Link>
            <Link href="/pesquisar">Pesquisar</Link>
            <Link href="/entrar">Entrar</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function MarketplaceHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  imageUrl
}: {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbs: MarketplaceBreadcrumb[];
  imageUrl?: string | null;
}) {
  return (
    <section className="marketplace-hero" aria-labelledby="marketplace-title">
      {imageUrl ? (
        <Image
          className="marketplace-hero__image"
          src={imageUrl}
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          unoptimized
        />
      ) : null}
      <div className="vy-container marketplace-hero__inner">
        <Breadcrumbs items={breadcrumbs} />
        <span>{eyebrow}</span>
        <h1 id="marketplace-title">{title}</h1>
        <p>{description}</p>
        <div className="marketplace-hero__links" aria-label="Atalhos de descoberta">
          <Link href="/estabelecimentos">Estabelecimentos</Link>
          <Link href="/categorias">Categorias</Link>
          <Link href="/locais">Locais</Link>
          <Link href="/ofertas">Ofertas</Link>
          <Link href="/pesquisar">Pesquisar</Link>
        </div>
      </div>
    </section>
  );
}

export function BusinessCard({ business }: { business: MarketplaceBusiness }) {
  const primaryCity = getBusinessPrimaryCity(business) ?? "Moçambique";
  const searchBusiness = business as MarketplaceBusiness & {
    distanceKm?: number | null;
    isOpenNow?: boolean | null;
  };

  return (
    <article className="marketplace-business-card">
      <Link href={`/estabelecimentos/${business.slug}`} aria-label={`Abrir ${business.name}`}>
        <div className="marketplace-business-card__media">
          {business.coverUrl ? (
            <Image
              src={business.coverUrl}
              alt=""
              fill
              sizes="(max-width: 760px) 100vw, (max-width: 1080px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <BusinessLogo business={business} />
          )}
        </div>
        <div className="marketplace-business-card__body">
          <span>{business.category?.name ?? "Estabelecimento"}</span>
          <h2>{business.name}</h2>
          <p>{getBusinessDescription(business)}</p>
          <div className="marketplace-business-card__meta">
            <span>
              <MapPin size={15} />
              {searchBusiness.distanceKm !== undefined && searchBusiness.distanceKm !== null
                ? `${searchBusiness.distanceKm.toLocaleString("pt-MZ")} km`
                : primaryCity}
            </span>
            <span>
              <Gift size={15} />
              {searchBusiness.isOpenNow === true
                ? "Aberto agora"
                : getProgramEarnRateLabel(business.program)}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function getBusinessDescription(business: MarketplaceBusiness): string {
  return (
    business.description ||
    `${business.name} é um estabelecimento VUYELA com benefícios digitais para clientes.`
  );
}

function BusinessLogo({ business }: { business: MarketplaceBusiness }) {
  if (business.logoUrl) {
    return (
      <Image
        className="marketplace-business-logo"
        src={business.logoUrl}
        alt=""
        width={72}
        height={72}
        unoptimized
      />
    );
  }

  return (
    <span className="marketplace-business-logo marketplace-business-logo--fallback">
      {business.name.slice(0, 2).toLocaleUpperCase("pt-MZ")}
    </span>
  );
}

function OffersBand({ offers }: { offers: MarketplaceOffer[] }) {
  if (offers.length === 0) {
    return null;
  }

  return (
    <section
      className="marketplace-section marketplace-section--offers"
      aria-labelledby="offers-title"
    >
      <div className="vy-container">
        <SectionHeader
          eyebrow="Ofertas"
          title="Ofertas públicas ativas"
          description="Promoções publicadas pelos negócios participantes."
          id="offers-title"
        />
        <div className="marketplace-offer-grid">
          {offers.map((offer) => (
            <OfferCard offer={offer} key={offer.id} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function OfferCard({ offer }: { offer: MarketplaceOffer }) {
  const href = offer.uniquePublicSlug
    ? `/ofertas/${offer.slug}`
    : `/estabelecimentos/${offer.businessSlug}`;

  return (
    <article className="marketplace-offer-card">
      <Link href={href}>
        <span>
          <Tag size={16} />
          {offer.categoryName ?? "Oferta VUYELA"}
        </span>
        <h3>{offer.title}</h3>
        <p>{offer.description}</p>
        <small>{offer.businessName}</small>
      </Link>
    </article>
  );
}

function MarketplaceFacetSection({
  title,
  items
}: {
  title: string;
  items: Array<{ href: string; label: string; meta: string }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2>{title}</h2>
      <div>
        {items.map((item) => (
          <Link href={item.href} key={item.href}>
            <span>{item.label}</span>
            <small>{item.meta}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RelatedBusinesses({ businesses }: { businesses: MarketplaceBusiness[] }) {
  if (businesses.length === 0) {
    return null;
  }

  return (
    <section className="marketplace-section" aria-labelledby="related-businesses-title">
      <div className="vy-container">
        <SectionHeader
          eyebrow="Tambem pode gostar"
          title="Estabelecimentos relacionados"
          description="Outras opções com benefícios VUYELA."
          id="related-businesses-title"
        />
        <div className="marketplace-business-grid marketplace-business-grid--compact">
          {businesses.map((business) => (
            <BusinessCard business={business} key={business.id} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitTile({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article>
      {icon}
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="marketplace-detail-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  id
}: {
  eyebrow: string;
  title: string;
  description: string;
  id: string;
}) {
  return (
    <div className="marketplace-section-header">
      <span>{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function Breadcrumbs({ items }: { items: MarketplaceBreadcrumb[] }) {
  return (
    <nav className="marketplace-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={item.path}>
            {index < items.length - 1 ? (
              <Link href={item.path}>{item.name}</Link>
            ) : (
              <span>{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function MarketplaceEmptyState() {
  return (
    <div className="marketplace-empty">
      <Store size={24} />
      <h2>Conteúdo público em preparação</h2>
      <p>
        Assim que houver estabelecimentos ativos com categoria, programa de pontos e filial
        publicada, esta página passa a ser indexavel.
      </p>
      <Link className="marketplace-button marketplace-button--reward" href="/onboarding/negocio">
        Registar negócio
      </Link>
    </div>
  );
}

function MarketplaceNoSearchResults() {
  return (
    <div className="marketplace-empty">
      <Store size={24} />
      <h2>Nenhum resultado encontrado</h2>
      <p>Remova algum filtro ou procure por outra cidade, categoria, negócio ou oferta.</p>
      <Link className="marketplace-button marketplace-button--ghost" href="/pesquisar">
        Limpar busca
      </Link>
    </div>
  );
}

function getOfferMeta(offer: MarketplaceOffer): string {
  const pieces = [offer.businessName];

  if (offer.city) {
    pieces.push(offer.city);
  }

  if (offer.endsAt) {
    pieces.push(`ativa até ${new Date(offer.endsAt).toLocaleDateString("pt-MZ")}`);
  }

  return pieces.join(" · ");
}
