import type { AdminAnalyticsPoint, AdminAnalyticsShare, AdminHeatmapPoint } from "./model";

export function AdminLineChart({
  data,
  value = "volumeMznMinor"
}: {
  data: AdminAnalyticsPoint[];
  value?: "volumeMznMinor" | "transactions";
}) {
  const values = data.map((point) => point[value]);
  const max = Math.max(...values, 1);
  const points = values
    .map((item, index) => {
      const x = data.length === 1 ? 50 : (index / Math.max(data.length - 1, 1)) * 100;
      const y = 92 - (item / max) * 76;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="admin-line-chart">
      <svg
        aria-label="Evolução dos indicadores no período"
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id={`admin-chart-${value}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#0d9488" stopOpacity="0.22" />
            <stop offset="1" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 92 H100 M0 66 H100 M0 40 H100 M0 16 H100" className="admin-line-chart__grid" />
        <polygon fill={`url(#admin-chart-${value})`} points={`0,100 ${points} 100,100`} />
        <polyline className="admin-line-chart__line" points={points} />
        {points.split(" ").map((point, index) => {
          const [cx, cy] = point.split(",");
          return <circle cx={cx} cy={cy} key={`${point}-${index}`} r="1.8" />;
        })}
      </svg>
      <div
        className="admin-line-chart__labels"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
      >
        {data.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
      <div
        aria-label="Evolução dos indicadores no período"
        className="admin-bar-chart"
        role="img"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
      >
        {data.map((point, index) => (
          <span aria-hidden="true" key={`${point.label}-${index}`}>
            <i style={{ height: `${Math.max((point[value] / max) * 100, 8)}%` }} />
            <small>{point.label}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminShareBars({
  data,
  money = false
}: {
  data: AdminAnalyticsShare[];
  money?: boolean;
}) {
  if (data.length === 0) {
    return <p className="admin-empty-copy">Sem dados no período selecionado.</p>;
  }

  return (
    <div className="admin-share-bars">
      {data.map((item) => (
        <div className="admin-share-bars__row" key={item.label}>
          <span>{item.label}</span>
          <div aria-hidden="true">
            <span style={{ width: `${Math.max(item.percentage, 2)}%` }} />
          </div>
          <strong>{item.percentage}%</strong>
          {money ? <small>{formatCompactMzn(item.value)}</small> : null}
        </div>
      ))}
    </div>
  );
}

export function AdminDonut({ data, total }: { data: AdminAnalyticsShare[]; total?: number }) {
  let cursor = 0;
  const stops = data.map((item, index) => {
    const start = cursor;
    cursor += item.percentage;
    return `${donutColor(item.label, index)} ${start}% ${cursor}%`;
  });

  return (
    <div className="admin-donut-layout">
      <div
        aria-label="Distribuição por método de pagamento"
        className="admin-donut"
        role="img"
        style={{
          background:
            stops.length > 0
              ? `conic-gradient(${stops.join(",")})`
              : "conic-gradient(#d9e2e8 0 100%)"
        }}
      >
        <span>
          {typeof total === "number" ? (
            <small>{total.toLocaleString("pt-MZ")} transações</small>
          ) : null}
          <strong>100%</strong>
        </span>
      </div>
      <div className="admin-donut-legend">
        {data.length > 0 ? (
          data.map((item, index) => (
            <div key={item.label}>
              <i aria-hidden="true" style={{ backgroundColor: donutColor(item.label, index) }} />
              <span>{item.label}</span>
              <strong>{item.percentage}%</strong>
              <span aria-hidden="true" className="admin-donut-legend__track">
                <span
                  style={{
                    backgroundColor: donutColor(item.label, index),
                    width: `${Math.max(item.percentage, 2)}%`
                  }}
                />
              </span>
            </div>
          ))
        ) : (
          <p className="admin-empty-copy">Sem pagamentos no período.</p>
        )}
      </div>
    </div>
  );
}

export function AdminHeatmap({ data }: { data: AdminHeatmapPoint[] }) {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const hours = [0, 3, 6, 9, 12, 15, 18, 21];
  const maximum = Math.max(...data.map((item) => item.transactions), 1);
  const byKey = new Map(data.map((item) => [`${item.day}-${item.hour}`, item.transactions]));

  return (
    <div
      className="admin-hourly-heatmap"
      role="img"
      aria-label="Transações por dia da semana e hora"
    >
      <span aria-hidden="true" />
      {days.map((day) => (
        <strong key={day}>{day}</strong>
      ))}
      {hours.map((hour) => (
        <div className="admin-hourly-heatmap__row" key={hour}>
          <span>{hour}</span>
          {days.map((day) => {
            const value = byKey.get(`${day}-${hour}`) ?? 0;
            return (
              <i
                aria-label={`${day}, ${hour} horas: ${value} transações`}
                key={day}
                style={{ opacity: value === 0 ? 0.12 : 0.28 + (value / maximum) * 0.72 }}
                title={`${value} transações`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function AdminMiniAreaChart({ data }: { data: AdminAnalyticsPoint[] }) {
  const values = data.map((point) => point.transactions);
  const maximum = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = data.length === 1 ? 50 : (index / Math.max(data.length - 1, 1)) * 100;
      const y = 92 - (value / maximum) * 76;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="admin-mini-area-chart">
      <svg
        aria-label="Registos diários"
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 100 100"
      >
        <path d="M0 16 H100 M0 54 H100 M0 92 H100" />
        <polygon points={`0,100 ${points} 100,100`} />
        <polyline points={points} />
      </svg>
      <div>
        <span>Há 30 dias</span>
        <span>Há 15 dias</span>
        <span>Hoje</span>
      </div>
    </div>
  );
}

function donutColor(label: string, index: number): string {
  const colors: Record<string, string> = {
    "M-Pesa": "#ef4444",
    "e-Mola": "#f59e0b",
    Dinheiro: "#10b981",
    mKesh: "#2563eb",
    Cartão: "#7c3aed",
    Transferência: "#64748b"
  };
  const fallback = ["#0d9488", "#f59e0b", "#ef4444", "#2563eb", "#7c3aed"];
  return colors[label] ?? fallback[index % fallback.length];
}

function formatCompactMzn(value: number): string {
  return `${new Intl.NumberFormat("pt-MZ", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value / 100)} MZN`;
}
