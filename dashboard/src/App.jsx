import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3,
  BrainCircuit, CalendarRange, ChevronRight, CloudRain, Gauge,
  Navigation, PackageCheck, RefreshCw, Settings2, ShieldAlert,
  Sparkles, Store, Timer, TrendingUp, Truck, Users, UtensilsCrossed,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';

const tabs = [
  ['overview', 'Command Center', Activity],
  ['risk', 'Risk Board', ShieldAlert],
  ['model', 'Model Lab', BrainCircuit],
  ['simulator', 'What-if Simulator', Settings2],
];

const areaPositions = {
  Gachibowli: [18, 63],
  Madhapur: [38, 55],
  'HITEC City': [30, 47],
  'Banjara Hills': [59, 65],
  'Jubilee Hills': [50, 52],
  Kukatpally: [34, 28],
  Kondapur: [18, 42],
  Ameerpet: [67, 48],
  Begumpet: [76, 38],
  Secunderabad: [86, 23],
};

function App() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedArea, setSelectedArea] = useState('All Hyderabad');

  useEffect(() => {
    fetch('/data/pulse_data.json').then((response) => response.json()).then(setData);
  }, []);

  if (!data) {
    return <div className="loading"><RefreshCw className="spin" /> Loading Hyderabad pulse...</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main">
        <Header selectedArea={selectedArea} setSelectedArea={setSelectedArea} areas={data.area_metrics} />
        {activeTab === 'overview' && <Overview data={data} />}
        {activeTab === 'risk' && <RiskBoard data={data} />}
        {activeTab === 'model' && <ModelLab data={data} />}
        {activeTab === 'simulator' && <Simulator data={data} />}
      </main>
    </div>
  );
}

function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Navigation /></div>
        <div><strong>QuickCommerce</strong><span>Pulse</span></div>
      </div>
      <p className="nav-label">Operations intelligence</p>
      <nav>
        {tabs.map(([id, label, Icon]) => (
          <button key={id} onClick={() => onTabChange(id)} className={activeTab === id ? 'active' : ''}>
            <Icon size={18} /><span>{label}</span>{activeTab === id && <ChevronRight size={16} />}
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <Sparkles size={18} />
        <strong>AI Ops Brief</strong>
        <span>Metrics translated into executive action.</span>
      </div>
      <div className="data-status"><span /> Demo operations data<br /><small>24,000 orders analyzed</small></div>
    </aside>
  );
}

function Header({ selectedArea, setSelectedArea, areas }) {
  return (
    <header className="topbar">
      <div>
        <p className="overline">Hyderabad delivery network</p>
        <h1>Operations Command Center</h1>
      </div>
      <div className="topbar-actions">
        <div className="live-pill"><span /> Live model</div>
        <select value={selectedArea} onChange={(event) => setSelectedArea(event.target.value)}>
          <option>All Hyderabad</option>
          {areas.map((item) => <option key={item.restaurant_area}>{item.restaurant_area}</option>)}
        </select>
        <button className="icon-button"><RefreshCw size={17} /></button>
      </div>
    </header>
  );
}

function Overview({ data }) {
  const sortedAreas = [...data.area_metrics].sort((a, b) => b.avg_delivery_time_min - a.avg_delivery_time_min);
  const critical = data.restaurant_risk.filter((item) => item.risk_tier === 'Critical').length;
  return (
    <div className="page">
      <section className="hero-strip">
        <div>
          <p><Sparkles size={15} /> AI executive pulse</p>
          <h2>Where the network needs attention, before the next rush.</h2>
          <span>{data.executive_summary}</span>
        </div>
        <div className="hero-model"><BrainCircuit /><strong>{data.metadata.best_model}</strong><small>Production candidate</small></div>
      </section>

      <section className="kpi-grid">
        <Kpi icon={PackageCheck} label="Orders analyzed" value={data.kpis.total_orders.toLocaleString('en-IN')} detail="Full-year operating sample" color="blue" />
        <Kpi icon={Timer} label="Avg delivery time" value={`${data.kpis.avg_delivery_time_min.toFixed(1)} min`} detail="Across 10 localities" color="cyan" />
        <Kpi icon={Gauge} label="On-time rate" value={`${data.kpis.on_time_rate_pct.toFixed(1)}%`} detail="Against dynamic promise" color="amber" />
        <Kpi icon={AlertTriangle} label="Critical restaurants" value={critical} detail={`${data.restaurant_risk.filter((item) => item.risk_tier === 'Watch').length} more on watch`} color="coral" />
      </section>

      <section className="overview-grid">
        <div className="panel map-panel">
          <PanelTitle eyebrow="Locality intelligence" title="Hyderabad pressure map" action="Avg delivery minutes" />
          <div className="city-map">
            <div className="map-roads road-one" /><div className="map-roads road-two" /><div className="map-roads road-three" />
            {sortedAreas.map((area, index) => {
              const [left, top] = areaPositions[area.restaurant_area];
              const severity = index < 3 ? 'high' : index < 7 ? 'medium' : 'low';
              return (
                <div className={`map-node ${severity}`} key={area.restaurant_area} style={{ left: `${left}%`, top: `${top}%` }}>
                  <span>{area.avg_delivery_time_min.toFixed(1)}</span>
                  <label>{area.restaurant_area}</label>
                </div>
              );
            })}
            <div className="map-legend"><span className="low" /> Stable <span className="medium" /> Watch <span className="high" /> High pressure</div>
          </div>
        </div>

        <div className="panel">
          <PanelTitle eyebrow="Network ranking" title="Locality performance" action="Minutes" />
          <div className="area-list">
            {sortedAreas.slice(0, 6).map((area, index) => (
              <div className="area-row" key={area.restaurant_area}>
                <span className="rank">{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{area.restaurant_area}</strong><small>{area.orders.toLocaleString()} orders</small></div>
                <div className="mini-bar"><i style={{ width: `${area.on_time_rate_pct}%` }} /></div>
                <strong className={index < 3 ? 'danger-text' : ''}>{area.avg_delivery_time_min.toFixed(1)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="panel">
          <PanelTitle eyebrow="Hourly demand" title="Network pulse by hour" action="Orders & delivery time" />
          <HourlyChart data={data.hourly_metrics} />
        </div>
        <div className="panel event-panel">
          <PanelTitle eyebrow="Surge intelligence" title="Events change the promise" action="Impact" />
          {data.event_metrics.map((event) => (
            <div className="event-row" key={event.period_type}>
              <div className={`event-icon ${event.period_type.toLowerCase().replace(' ', '-')}`}>
                {event.period_type === 'Cricket' ? <TrendingUp /> : event.period_type === 'Festival' ? <CalendarRange /> : <Activity />}
              </div>
              <div><strong>{event.period_type}</strong><small>{event.orders.toLocaleString()} orders</small></div>
              <div><strong>{event.avg_delivery_time_min.toFixed(1)} min</strong><small>{event.on_time_rate_pct.toFixed(1)}% on-time</small></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, detail, color }) {
  return (
    <article className="kpi-card">
      <div className={`kpi-icon ${color}`}><Icon /></div>
      <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
    </article>
  );
}

function PanelTitle({ eyebrow, title, action }) {
  return (
    <div className="panel-title">
      <div><span>{eyebrow}</span><h3>{title}</h3></div>
      <small>{action}</small>
    </div>
  );
}

function HourlyChart({ data }) {
  const chartData = useMemo(() => {
    const groups = {};
    data.forEach((row) => {
      groups[row.order_hour] ??= { hour: `${String(row.order_hour).padStart(2, '0')}:00`, orders: 0, weightedTime: 0 };
      groups[row.order_hour].orders += row.orders;
      groups[row.order_hour].weightedTime += row.avg_delivery_time_min * row.orders;
    });
    return Object.values(groups).map((item) => ({
      ...item,
      delivery: item.weightedTime / item.orders,
    }));
  }, [data]);
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={255}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="#dce7ee" strokeDasharray="4 5" vertical={false} />
          <XAxis dataKey="hour" tick={{ fill: '#71879a', fontSize: 11 }} interval={2} />
          <YAxis tick={{ fill: '#71879a', fontSize: 11 }} domain={[30, 55]} />
          <Tooltip contentStyle={{ borderRadius: 12, border: 0, boxShadow: '0 12px 32px #102a4320' }} />
          <Line type="monotone" dataKey="delivery" stroke="#18b6a4" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function RiskBoard({ data }) {
  const [filter, setFilter] = useState('All');
  const rows = filter === 'All' ? data.restaurant_risk : data.restaurant_risk.filter((item) => item.risk_tier === filter);
  return (
    <div className="page">
      <section className="page-heading">
        <div><p className="overline">Proactive retention intelligence</p><h2>Restaurant Risk Board</h2><span>Composite risk blends order decline, rating movement, delay pressure, and reliability.</span></div>
        <div className="segment">{['All', 'Critical', 'Watch', 'Stable'].map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
      </section>
      <div className="risk-layout">
        <div className="panel risk-table-panel">
          <div className="table-head"><span>Restaurant</span><span>Orders trend</span><span>Rating</span><span>Delay</span><span>Risk</span></div>
          {rows.map((row) => (
            <div className="risk-row" key={row.restaurant_id}>
              <div className="restaurant-name"><div><UtensilsCrossed /></div><span><strong>{row.name}</strong><small>{row.area} · {row.cuisine_type}</small></span></div>
              <div className={row.order_growth_pct < 0 ? 'negative' : 'positive'}>{row.order_growth_pct < 0 ? <ArrowDownRight /> : <ArrowUpRight />}{Math.abs(row.order_growth_pct).toFixed(1)}%</div>
              <div><strong>{row.recent_rating.toFixed(1)}</strong><small className={row.rating_change < 0 ? 'negative' : 'positive'}>{row.rating_change > 0 ? '+' : ''}{row.rating_change.toFixed(2)}</small></div>
              <div><strong>{row.recent_delay.toFixed(1)} min</strong><small>{(row.recent_on_time * 100).toFixed(0)}% reliable</small></div>
              <div><div className={`risk-score ${row.risk_tier.toLowerCase()}`}>{row.risk_score.toFixed(0)}</div><small>{row.risk_tier}</small></div>
            </div>
          ))}
        </div>
        <aside className="panel action-panel">
          <PanelTitle eyebrow="Recommended action" title="Intervention playbook" action="This week" />
          <Action icon={Users} title="Partner rebalancing" detail="Shift 2 riders toward Kukatpally between 19:00 and 21:00." />
          <Action icon={CloudRain} title="Rain readiness" detail="Pre-position riders before forecast rain; the measured effect is statistically significant." />
          <Action icon={Store} title="Restaurant outreach" detail="Prioritize critical accounts with both declining volume and ratings." />
          <Action icon={Truck} title="Batching guardrail" detail="Cap multi-order batches during events to protect promise accuracy." />
        </aside>
      </div>
    </div>
  );
}

function Action({ icon: Icon, title, detail }) {
  return <div className="action"><div><Icon /></div><span><strong>{title}</strong><small>{detail}</small></span></div>;
}

function ModelLab({ data }) {
  return (
    <div className="page">
      <section className="page-heading">
        <div><p className="overline">Predictive intelligence</p><h2>Delivery Model Lab</h2><span>Transparent holdout metrics and permutation importance, not a black-box score.</span></div>
        <div className="model-badge"><BrainCircuit /><span><small>Selected model</small><strong>{data.metadata.best_model}</strong></span></div>
      </section>
      <section className="kpi-grid three">
        <Kpi icon={Gauge} label="Best R²" value={data.model_metrics[0].r2.toFixed(3)} detail="Holdout variance explained" color="blue" />
        <Kpi icon={Timer} label="Mean absolute error" value={`${data.model_metrics[0].mae.toFixed(2)} min`} detail="Typical prediction miss" color="cyan" />
        <Kpi icon={BarChart3} label="RMSE" value={`${data.model_metrics[0].rmse.toFixed(2)} min`} detail="Penalizes larger misses" color="amber" />
      </section>
      <section className="model-grid">
        <div className="panel">
          <PanelTitle eyebrow="Benchmark" title="Model comparison" action="Higher R² is better" />
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={data.model_metrics} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="#dce7ee" strokeDasharray="4 5" horizontal={false} />
              <XAxis type="number" domain={[0.85, 0.95]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="model" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="r2" radius={[0, 8, 8, 0]}>
                {data.model_metrics.map((_, index) => <Cell key={index} fill={index === 0 ? '#18b6a4' : '#9fb3c3'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel">
          <PanelTitle eyebrow="Explainability" title="Top prediction drivers" action="Permutation importance" />
          <div className="importance-list">
            {data.feature_importance.slice(0, 8).map((item, index) => (
              <div key={item.feature}><span><b>{index + 1}</b>{item.feature.replaceAll('_', ' ')}</span><div><i style={{ width: `${Math.max(5, item.importance / data.feature_importance[0].importance * 100)}%` }} /></div><strong>{item.importance.toFixed(3)}</strong></div>
            ))}
          </div>
        </div>
      </section>
      <section className="panel stat-panel">
        <PanelTitle eyebrow="Statistical rigor" title="Operational hypotheses" action="95% confidence threshold" />
        <div className="stat-grid">
          {data.statistical_tests.map((test) => (
            <div className="stat-card" key={test.test}>
              <span className="significant">Significant</span><strong>{test.test}</strong><small>{test.method}</small>
              <div><span>Measured effect</span><b>+{test.effect_min.toFixed(1)} min</b></div>
              <div><span>P-value</span><b>{test.p_value < 0.001 ? '< 0.001' : test.p_value.toFixed(3)}</b></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Simulator({ data }) {
  const [area, setArea] = useState('Madhapur');
  const [weather, setWeather] = useState('Clear');
  const [peak, setPeak] = useState(true);
  const [event, setEvent] = useState(false);
  const [partners, setPartners] = useState(0);
  const areaBase = data.area_metrics.find((item) => item.restaurant_area === area)?.avg_delivery_time_min || data.simulator.base_minutes;
  const projected = Math.max(
    data.simulator.minimum_minutes,
    areaBase
      + (weather === 'Light Rain' ? data.simulator.rain_penalty : weather === 'Heavy Rain' ? data.simulator.heavy_rain_penalty : 0)
      + (peak ? data.simulator.peak_penalty : 0)
      + (event ? data.simulator.event_penalty : 0)
      - partners * data.simulator.partner_reduction_per_person,
  );
  const reduction = areaBase + (peak ? data.simulator.peak_penalty : 0) - projected;
  return (
    <div className="page">
      <section className="page-heading">
        <div><p className="overline">Decision sandbox</p><h2>Capacity What-if Simulator</h2><span>Translate staffing and operating choices into an estimated delivery-time impact.</span></div>
      </section>
      <section className="simulator-grid">
        <div className="panel controls">
          <PanelTitle eyebrow="Scenario inputs" title="Design the operating condition" action="Adjust controls" />
          <label>Locality<select value={area} onChange={(eventValue) => setArea(eventValue.target.value)}>{data.area_metrics.map((item) => <option key={item.restaurant_area}>{item.restaurant_area}</option>)}</select></label>
          <label>Weather<select value={weather} onChange={(eventValue) => setWeather(eventValue.target.value)}><option>Clear</option><option>Light Rain</option><option>Heavy Rain</option></select></label>
          <div className="switch-row"><span><strong>Peak-hour demand</strong><small>19:00-21:00 pressure window</small></span><button onClick={() => setPeak(!peak)} className={peak ? 'on' : ''}><i /></button></div>
          <div className="switch-row"><span><strong>Festival or cricket event</strong><small>Observed surge effect</small></span><button onClick={() => setEvent(!event)} className={event ? 'on' : ''}><i /></button></div>
          <label>Additional delivery partners <strong>+{partners}</strong><input type="range" min="0" max="8" value={partners} onChange={(eventValue) => setPartners(Number(eventValue.target.value))} /></label>
        </div>
        <div className="projection-card">
          <p>Projected delivery time</p>
          <strong>{projected.toFixed(1)}<small> min</small></strong>
          <div className="gauge-ring" style={{ '--progress': `${Math.min(100, projected / 65 * 100)}%` }}><span>{projected < 38 ? 'Stable' : projected < 48 ? 'Watch' : 'Critical'}</span></div>
          <div className="projection-stats">
            <div><span>Area baseline</span><strong>{areaBase.toFixed(1)} min</strong></div>
            <div><span>Partner impact</span><strong>-{(partners * data.simulator.partner_reduction_per_person).toFixed(1)} min</strong></div>
            <div><span>Net improvement</span><strong className={reduction > 0 ? 'positive' : ''}>{reduction > 0 ? '-' : '+'}{Math.abs(reduction).toFixed(1)} min</strong></div>
          </div>
        </div>
        <div className="panel recommendation">
          <Sparkles /><p>Recommended operating move</p>
          <h3>{partners >= 2 ? `Deploy ${partners} extra partners in ${area}.` : `Add at least 2 partners before the ${peak ? 'peak window' : 'next surge'}.`}</h3>
          <span>
            {weather.includes('Rain') ? 'Rain increases route friction; reduce batching and pre-position riders near demand clusters. ' : ''}
            {event ? 'Event demand compounds delays, so activate surge staffing 45 minutes early.' : 'Use normal dispatch thresholds unless live demand exceeds forecast.'}
          </span>
        </div>
      </section>
    </div>
  );
}

export default App;
