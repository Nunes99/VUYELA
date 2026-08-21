export default function CustomerAreaLoading() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-shell" aria-label="A carregar painel do cliente">
        <span className="auth-kicker">Área protegida</span>
        <h1>Painel do cliente</h1>
        <div className="customer-cards-loading" role="status">
          <span />
          <span />
          <span />
          <p>A carregar o seu painel...</p>
        </div>
      </section>
    </main>
  );
}
