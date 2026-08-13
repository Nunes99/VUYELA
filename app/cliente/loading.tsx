export default function CustomerAreaLoading() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-shell" aria-label="A carregar cartoes digitais">
        <span className="auth-kicker">Area protegida</span>
        <h1>Cartoes digitais</h1>
        <div className="customer-cards-loading" role="status">
          <span />
          <span />
          <span />
          <p>A carregar os seus cartoes...</p>
        </div>
      </section>
    </main>
  );
}
