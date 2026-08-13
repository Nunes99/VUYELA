export default function CustomerAreaLoading() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-shell" aria-label="A carregar dashboard do cliente">
        <span className="auth-kicker">Area protegida</span>
        <h1>Dashboard do cliente</h1>
        <div className="customer-cards-loading" role="status">
          <span />
          <span />
          <span />
          <p>A carregar o seu dashboard...</p>
        </div>
      </section>
    </main>
  );
}
