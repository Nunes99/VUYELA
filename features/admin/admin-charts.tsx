import type { AdminAnalyticsPoint, AdminAnalyticsShare } from "./model";

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

export function AdminDonut({ data }: { data: AdminAnalyticsShare[] }) {
  const palette = ["#0d9488", "#f59e0b", "#64748b", "#2dd4bf", "#94a3b8"];
  let cursor = 0;
  const stops = data.map((item, index) => {
    const start = cursor;
    cursor += item.percentage;
    return `${palette[index % palette.length]} ${start}% ${cursor}%`;
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
          <strong>100%</strong>
          <small>Distribuição</small>
        </span>
      </div>
      <AdminShareBars data={data} />
    </div>
  );
}

function formatCompactMzn(value: number): string {
  return `${new Intl.NumberFormat("pt-MZ", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value / 100)} MZN`;
}
