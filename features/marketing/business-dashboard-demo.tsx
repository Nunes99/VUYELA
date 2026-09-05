"use client";

import { useEffect, useState } from "react";
import { BarChart3, Grid2X2, Megaphone, PackageSearch, UsersRound } from "lucide-react";

const dashboardModes = [
  {
    id: "visits",
    label: "Visitas",
    title: "Frequência de visitas",
    range: "Últimas 8 semanas",
    metrics: [
      ["Clientes que voltaram", "248", "+18%"],
      ["Volume reconhecido", "84.200 MZN", "+12%"],
      ["YELAS em circulação", "32.480 YL", "+8%"]
    ],
    points: "0,174 90,158 180,184 270,120 360,137 450,92 540,110 630,54 720,76 800,28"
  },
  {
    id: "retention",
    label: "Retenção",
    title: "Retenção de clientes",
    range: "Últimos 90 dias",
    metrics: [
      ["Taxa de retorno", "68%", "+9%"],
      ["Clientes recorrentes", "312", "+24"],
      ["Visitas por cliente", "4,7x", "+0,6"]
    ],
    points: "0,187 90,176 180,146 270,158 360,110 450,126 540,83 630,91 720,46 800,58"
  },
  {
    id: "campaigns",
    label: "Campanhas",
    title: "Desempenho de campanhas",
    range: "Últimos 30 dias",
    metrics: [
      ["Campanhas ativas", "12", "+3"],
      ["Benefícios utilizados", "3.480", "+22%"],
      ["Taxa de conversão", "18,5%", "+4,2%"]
    ],
    points: "0,165 90,184 180,128 270,148 360,74 450,96 540,48 630,79 720,36 800,22"
  }
] as const;

export function BusinessDashboardDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const mode = dashboardModes[activeIndex];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % dashboardModes.length);
    }, 4600);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="rv-dashboard" aria-label="Demonstração do painel do negócio">
      <aside aria-label="Secções do painel demonstrativo">
        <div className="rv-dashboard__brand">
          <span>V</span>
          <strong>VUYELA</strong>
        </div>
        <nav>
          <span className="is-active">
            <Grid2X2 aria-hidden="true" size={17} /> Visão geral
          </span>
          <span>
            <UsersRound aria-hidden="true" size={17} /> Clientes
          </span>
          <span>
            <Megaphone aria-hidden="true" size={17} /> Campanhas
          </span>
          <span>
            <PackageSearch aria-hidden="true" size={17} /> Catálogo
          </span>
          <span>
            <BarChart3 aria-hidden="true" size={17} /> Analítica
          </span>
        </nav>
      </aside>

      <div className="rv-dashboard__workspace">
        <header>
          <div>
            <small>BOM DIA, MARIA</small>
            <strong>O seu negócio está a ganhar ritmo.</strong>
          </div>
          <span>Atualizado agora</span>
        </header>

        <div className="rv-dashboard__metrics" aria-live="polite">
          {mode.metrics.map(([label, value, trend]) => (
            <article key={`${mode.id}-${label}`}>
              <small>{label}</small>
              <strong>{value}</strong>
              <b>{trend}</b>
            </article>
          ))}
        </div>

        <div className="rv-dashboard__chart">
          <div className="rv-dashboard__chart-head">
            <span>
              <strong>{mode.title}</strong>
              <small>{mode.range}</small>
            </span>
            <div role="tablist" aria-label="Indicador apresentado">
              {dashboardModes.map((item, index) => (
                <button
                  aria-selected={index === activeIndex}
                  className={index === activeIndex ? "is-active" : undefined}
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  role="tab"
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 800 220">
            <line x1="0" x2="800" y1="55" y2="55" />
            <line x1="0" x2="800" y1="110" y2="110" />
            <line x1="0" x2="800" y1="165" y2="165" />
            <polyline key={mode.id} points={mode.points} />
          </svg>
        </div>
      </div>
    </div>
  );
}
