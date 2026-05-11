import ChartCard from "../components/ChartCard";
import { analyticsSummary, channelMix, revenueTrend } from "../data/adminData";

function linePoints(values) {
  const max = Math.max(...values.map((item) => item.value));
  const min = Math.min(...values.map((item) => item.value));
  const range = Math.max(1, max - min);

  return values
    .map((item, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 66 - ((item.value - min) / range) * 54;
      return `${x},${y}`;
    })
    .join(" ");
}

function donutStyle(data) {
  let cursor = 0;
  const colors = {
    amber: "#f59e0b",
    orange: "#f97316",
    green: "#22c55e",
    blue: "#38bdf8",
  };

  const stops = data.map((item) => {
    const start = cursor;
    cursor += item.share;
    return `${colors[item.tone]} ${start}% ${cursor}%`;
  });

  return { background: `conic-gradient(${stops.join(", ")})` };
}

const Analytics = () => {
  return (
    <section className="admin-module-section">
      <div className="admin-page-head">
        <div>
          <h2>Analytics</h2>
          <p>Measure revenue, conversion, and product contribution by category.</p>
        </div>
      </div>

      <div className="admin-summary-strip">
        {analyticsSummary.map((item) => (
          <div key={item.label} className="admin-summary-card">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <small>{item.change}</small>
          </div>
        ))}
      </div>

      <div className="admin-dashboard-grid analytics-grid">
        <ChartCard className="admin-panel-wide" kicker="Revenue Trend" title="Revenue Trend" subtitle="Monthly growth movement.">
          <div className="admin-line-chart">
            <svg className="admin-chart-svg" viewBox="0 0 100 72" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                points={linePoints(revenueTrend)}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="admin-line-labels">
              {revenueTrend.map((item) => (
                <span key={item.day}>{item.day}</span>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard kicker="Category Mix" title="Order Share by Category" subtitle="Current contribution breakdown.">
          <div className="admin-donut-layout">
            <div className="admin-donut" style={donutStyle(channelMix)}>
              <div className="admin-donut-center">
                <strong>100%</strong>
                <span>Order mix</span>
              </div>
            </div>
            <div className="admin-donut-legend">
              {channelMix.map((item) => (
                <div key={item.label}>
                  <span className={`admin-color-dot tone-${item.tone}`} />
                  <strong>{item.label}</strong>
                  <small>{item.share}%</small>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>
    </section>
  );
};

export default Analytics;
