const foundationItems = [
  {
    title: "Fundacao tecnica",
    body: "Next.js, TypeScript strict mode, Tailwind, testes e scripts de qualidade."
  },
  {
    title: "Design system",
    body: "Tokens VUYELA preservados como pacote de workspace reutilizavel."
  },
  {
    title: "Seguranca preparada",
    body: "Estrutura Supabase pronta para migrations, RLS, auditoria e isolamento por negocio."
  }
];

export default function HomePage() {
  return (
    <main className="foundation-page">
      <section className="vy-container foundation-shell" aria-labelledby="foundation-title">
        <div>
          <p className="foundation-kicker">VUYELA by LEMOTE</p>
          <h1 className="foundation-title" id="foundation-title">
            Cada compra cria uma razao para voltar.
          </h1>
          <p className="foundation-copy">
            Este e o ponto de partida tecnico da plataforma VUYELA. A homepage comercial,
            dashboards, POS e motor de pontos entram nas fases seguintes do plano.
          </p>
          <div className="foundation-grid" aria-label="Estado da fundacao">
            {foundationItems.map((item) => (
              <article className="foundation-card" key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
