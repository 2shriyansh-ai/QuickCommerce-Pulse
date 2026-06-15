import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, BarChart3, BrainCircuit,
  ChevronRight, CloudRain, Database, Gauge, Navigation, PackageCheck,
  RefreshCw, Settings2, ShieldAlert, Sparkles, Star, Store, Timer,
  TrafficCone, Truck, UtensilsCrossed,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';

const tabs = [
  ['overview', 'Data Command Center', Activity],
  ['risk', 'Restaurant Attention', ShieldAlert],
  ['model', 'Model Lab', BrainCircuit],
  ['simulator', 'Delivery Simulator', Settings2],
];

function App() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch('/data/pulse_data.json').then((response) => response.json()).then(setData);
  }, []);

  if (!data) {
    return <div className="loading"><RefreshCw className="spin" /> Loading real-data analysis...</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} data={data} />
      <main className="main">
        <Header data={data} />
        {activeTab === 'overview' && <Overview data={data} />}
        {activeTab === 'risk' && <AttentionBoard data={data} />}
        {activeTab === 'model' && <ModelLab data={data} />}
        {activeTab === 'simulator' && <Simulator data={data} />}
      </main>
    </div>
  );
}

function Sidebar({ activeTab, onTabChange, data }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Navigation /></div>
        <div><strong>QuickCommerce</strong><span>Pulse</span></div>
      </div>
      <p className="nav-label">Real-data intelligence</p>
      <nav>
        {tabs.map(([id, label, Icon]) => (
          <button key={id} onClick={() => onTabChange(id)} className={activeTab === id ? 'active' : ''}>
            <Icon size={18} /><span>{label}</span>{activeTab === id && <ChevronRight size={16} />}
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <Database size={18} />
        <strong>Two honest data tracks</strong>
        <span>Delivery benchmarking and Hyderabad restaurant analysis remain separate because no shared key exists.</span>
      </div>
      <div className="data-status"><span /> Public Kaggle data<br /><small>{data.metadata.delivery_records} deliveries · {data.metadata.hyderabad_restaurants} restaurants</small></div>
    </aside>
  );
}

function Header({ data }) {
  return (
    <header className="topbar">
      <div>
        <p className="overline">Delivery benchmark + Hyderabad restaurant listings</p>
        <h1>Real-Data Intelligence Center</h1>
      </div>
      <div className="topbar-actions">
        <div className="live-pill"><span /> Real public data</div>
        <div className="model-badge"><BrainCircuit /><span><small>Best model</small><strong>{data.metadata.best_model}</strong></span></div>
      </div>
    </header>
  );
}

function Overview({ data }) {
  const areas = data.area_metrics.slice(0, 10);
  return (
    <div className="page">
      <section className="hero-strip">
        <div>
          <p><Sparkles size={15} /> Executive data brief</p>
          <h2>Real delivery behavior and real Hyderabad restaurant listings.</h2>
          <span>{data.executive_summary}</span>
        </div>
        <div className="hero-model"><Database /><strong>Separate tracks</strong><small>No invented row-level join</small></div>
      </section>

      <section className="kpi-grid">
        <Kpi icon={PackageCheck} label="Delivery records" value={data.kpis.delivery_records.toLocaleString()} detail="Prediction benchmark" color="blue" />
        <Kpi icon={Store} label="Hyderabad restaurants" value={data.kpis.hyderabad_restaurants.toLocaleString()} detail="Real Swiggy listings" color="cyan" />
        <Kpi icon={Timer} label="Average delivery" value={`${data.kpis.avg_delivery_time_min.toFixed(1)} min`} detail={`${data.kpis.under_60_rate_pct.toFixed(1)}% within 60 min`} color="amber" />
        <Kpi icon={AlertTriangle} label="Priority listings" value={data.kpis.priority_restaurants} detail="Cross-sectional attention tier" color="coral" />
      </section>

      <section className="overview-grid">
        <div className="panel">
          <PanelTitle eyebrow="Hyderabad listing intelligence" title="Areas with longest listed delivery time" action="Areas with 5+ restaurants" />
          <ResponsiveContainer width="100%" height={335}>
            <BarChart data={areas} layout="vertical" margin={{ left: 35 }}>
              <CartesianGrid stroke="#dce7ee" strokeDasharray="4 5" horizontal={false} />
              <XAxis type="number" domain={[35, 80]} tick={{ fontSize: 10, fill: '#71879a' }} />
              <YAxis type="category" dataKey="area" width={145} tick={{ fontSize: 9, fill: '#516b7d' }} />
              <Tooltip />
              <Bar dataKey="avg_delivery_time_min" fill="#f46f5e" radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel">
          <PanelTitle eyebrow="Area snapshot" title="Restaurant market view" action="Listings" />
          <div className="area-list">
            {areas.slice(0, 7).map((area, index) => (
              <div className="area-row" key={area.area}>
                <span className="rank">{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{area.area}</strong><small>{area.restaurants} restaurants · ₹{area.median_price.toFixed(0)} median</small></div>
                <div className="mini-bar"><i style={{ width: `${area.avg_rating / 5 * 100}%` }} /></div>
                <strong className={index < 3 ? 'danger-text' : ''}>{area.avg_delivery_time_min.toFixed(1)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="panel">
          <PanelTitle eyebrow="Delivery benchmark" title="Weather effect" action="Average minutes" />
          <CategoryChart data={data.weather_metrics} dataKey="weather" />
        </div>
        <div className="panel event-panel">
          <PanelTitle eyebrow="Traffic evidence" title="Delivery by traffic level" action="Observed result" />
          {data.traffic_metrics.sort((a, b) => b.avg_delivery_time_min - a.avg_delivery_time_min).map((item) => (
            <div className="event-row" key={item.traffic_level}>
              <div className={`event-icon ${item.traffic_level.toLowerCase()}`}><TrafficCone /></div>
              <div><strong>{item.traffic_level} traffic</strong><small>{item.records} records</small></div>
              <div><strong>{item.avg_delivery_time_min.toFixed(1)} min</strong><small>{item.under_60_rate_pct.toFixed(1)}% under 60</small></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, detail, color }) {
  return <article className="kpi-card"><div className={`kpi-icon ${color}`}><Icon /></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function PanelTitle({ eyebrow, title, action }) {
  return <div className="panel-title"><div><span>{eyebrow}</span><h3>{title}</h3></div><small>{action}</small></div>;
}

function CategoryChart({ data, dataKey }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={255}>
        <LineChart data={data}>
          <CartesianGrid stroke="#dce7ee" strokeDasharray="4 5" vertical={false} />
          <XAxis dataKey={dataKey} tick={{ fill: '#71879a', fontSize: 10 }} />
          <YAxis tick={{ fill: '#71879a', fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
          <Tooltip />
          <Line type="monotone" dataKey="avg_delivery_time_min" stroke="#18b6a4" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AttentionBoard({ data }) {
  const [filter, setFilter] = useState('All');
  const rows = filter === 'All' ? data.restaurant_attention : data.restaurant_attention.filter((item) => item.attention_tier === filter);
  return (
    <div className="page">
      <section className="page-heading">
        <div><p className="overline">Cross-sectional listing analysis</p><h2>Restaurant Attention Board</h2><span>Prioritizes slow delivery, low ratings, and weak review confidence. It does not predict churn.</span></div>
        <div className="segment">{['All', 'Priority', 'Watch', 'Stable'].map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
      </section>
      <div className="risk-layout">
        <div className="panel risk-table-panel">
          <div className="table-head"><span>Restaurant</span><span>Rating</span><span>Reviews</span><span>Delivery</span><span>Attention</span></div>
          {rows.map((row) => (
            <div className="risk-row" key={row.restaurant_id}>
              <div className="restaurant-name"><div><UtensilsCrossed /></div><span><strong>{row.name}</strong><small>{row.area} · {row.primary_cuisine}</small></span></div>
              <div><strong>{row.avg_rating.toFixed(1)} / 5</strong><small>listed rating</small></div>
              <div><strong>{row.total_ratings.toLocaleString()}</strong><small>rating count</small></div>
              <div><strong>{row.delivery_time_min.toFixed(0)} min</strong><small>₹{row.price.toFixed(0)} price</small></div>
              <div><div className={`risk-score ${row.attention_tier.toLowerCase()}`}>{row.attention_score.toFixed(0)}</div><small>{row.attention_tier}</small></div>
            </div>
          ))}
        </div>
        <aside className="panel action-panel">
          <PanelTitle eyebrow="How to read this" title="Attention score logic" action="Heuristic" />
          <Action icon={Truck} title="45% delivery pressure" detail="Higher listed delivery time increases attention." />
          <Action icon={Star} title="35% rating weakness" detail="Lower-rated restaurants receive more attention." />
          <Action icon={BarChart3} title="20% review uncertainty" detail="Low review volume reduces confidence and raises attention." />
          <Action icon={ShieldAlert} title="Not a churn model" detail="No historical order trend exists in the supplied restaurant data." />
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
        <div><p className="overline">Delivery benchmark</p><h2>Prediction Model Lab</h2><span>Three models trained on 1,000 cleaned delivery records using a fixed holdout split.</span></div>
        <div className="model-badge"><BrainCircuit /><span><small>Selected model</small><strong>{data.metadata.best_model}</strong></span></div>
      </section>
      <section className="kpi-grid three">
        <Kpi icon={Gauge} label="Best R2" value={data.model_metrics[0].r2.toFixed(3)} detail="Holdout variance explained" color="blue" />
        <Kpi icon={Timer} label="Mean absolute error" value={`${data.model_metrics[0].mae.toFixed(2)} min`} detail="Typical prediction error" color="cyan" />
        <Kpi icon={BarChart3} label="RMSE" value={`${data.model_metrics[0].rmse.toFixed(2)} min`} detail="Penalizes larger errors" color="amber" />
      </section>
      <section className="model-grid">
        <div className="panel">
          <PanelTitle eyebrow="Holdout benchmark" title="Model comparison" action="Higher R2 is better" />
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={data.model_metrics} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="#dce7ee" strokeDasharray="4 5" horizontal={false} />
              <XAxis type="number" domain={[0.7, 0.9]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="model" width={120} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="r2" radius={[0, 8, 8, 0]}>
                {data.model_metrics.map((_, index) => <Cell key={index} fill={index === 0 ? '#18b6a4' : '#9fb3c3'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel">
          <PanelTitle eyebrow="Explainability" title="Prediction drivers" action="Permutation importance" />
          <div className="importance-list">
            {data.feature_importance.map((item, index) => (
              <div key={item.feature}><span><b>{index + 1}</b>{item.feature.replaceAll('_', ' ')}</span><div><i style={{ width: `${Math.max(4, item.importance / data.feature_importance[0].importance * 100)}%` }} /></div><strong>{item.importance.toFixed(3)}</strong></div>
            ))}
          </div>
        </div>
      </section>
      <section className="panel stat-panel">
        <PanelTitle eyebrow="Statistical validation" title="What the data supports" action="P-value < 0.05" />
        <div className="stat-grid">
          {data.statistical_tests.map((test) => (
            <div className="stat-card" key={test.test}>
              <span className="significant">{test.conclusion}</span><strong>{test.test}</strong><small>{test.method}</small>
              <div><span>{test.method.includes('correlation') ? 'Correlation' : 'Measured difference'}</span><b>{test.effect_min.toFixed(2)}{test.method.includes('correlation') ? '' : ' min'}</b></div>
              <div><span>P-value</span><b>{test.p_value < 0.001 ? '< 0.001' : test.p_value.toFixed(3)}</b></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Simulator({ data }) {
  const simulation = data.simulator;
  const [weather, setWeather] = useState('Clear');
  const [traffic, setTraffic] = useState('Low');
  const [time, setTime] = useState('Morning');
  const [distance, setDistance] = useState(Math.round(simulation.mean_distance_km));
  const [prep, setPrep] = useState(Math.round(simulation.mean_preparation_min));
  const [experience, setExperience] = useState(Math.round(simulation.mean_experience_yrs));

  const projected = useMemo(() => Math.max(8,
    simulation.base_minutes
    + (simulation.weather_effects[weather] || 0)
    + (simulation.traffic_effects[traffic] || 0)
    + (simulation.time_effects[time] || 0)
    + (distance - simulation.mean_distance_km) * simulation.distance_slope
    + (prep - simulation.mean_preparation_min) * simulation.preparation_slope
    + (experience - simulation.mean_experience_yrs) * simulation.experience_slope
  ), [simulation, weather, traffic, time, distance, prep, experience]);

  return (
    <div className="page">
      <section className="page-heading">
        <div><p className="overline">Evidence-based scenario</p><h2>Delivery Condition Simulator</h2><span>Uses observed category differences and simple slopes from the real delivery benchmark.</span></div>
      </section>
      <section className="simulator-grid">
        <div className="panel controls">
          <PanelTitle eyebrow="Scenario inputs" title="Describe one delivery" action="Adjust controls" />
          <label>Weather<select value={weather} onChange={(event) => setWeather(event.target.value)}>{Object.keys(simulation.weather_effects).map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Traffic<select value={traffic} onChange={(event) => setTraffic(event.target.value)}>{Object.keys(simulation.traffic_effects).map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Time of day<select value={time} onChange={(event) => setTime(event.target.value)}>{Object.keys(simulation.time_effects).map((item) => <option key={item}>{item}</option>)}</select></label>
          <Slider label="Distance" value={distance} setValue={setDistance} min={1} max={20} suffix=" km" />
          <Slider label="Preparation time" value={prep} setValue={setPrep} min={5} max={30} suffix=" min" />
          <Slider label="Courier experience" value={experience} setValue={setExperience} min={0} max={9} suffix=" yrs" />
        </div>
        <div className="projection-card">
          <p>Estimated delivery time</p>
          <strong>{projected.toFixed(1)}<small> min</small></strong>
          <div className="gauge-ring" style={{ '--progress': `${Math.min(100, projected / 100 * 100)}%` }}><span>{projected <= 45 ? 'Fast' : projected <= 65 ? 'Typical' : 'Slow'}</span></div>
          <div className="projection-stats">
            <div><span>Dataset average</span><strong>{simulation.base_minutes.toFixed(1)} min</strong></div>
            <div><span>Scenario difference</span><strong className={projected < simulation.base_minutes ? 'positive' : 'negative'}>{projected >= simulation.base_minutes ? '+' : ''}{(projected - simulation.base_minutes).toFixed(1)} min</strong></div>
            <div><span>Distance</span><strong>{distance} km</strong></div>
          </div>
        </div>
        <div className="panel recommendation">
          <CloudRain /><p>Scenario interpretation</p>
          <h3>{projected > 65 ? 'This delivery has a high delay profile.' : projected < 45 ? 'This delivery has a favorable profile.' : 'This delivery is near the benchmark average.'}</h3>
          <span>Distance and preparation time are the strongest controllable inputs. Weather and traffic effects come from observed group averages. This simulator is explanatory and does not call the trained model directly.</span>
        </div>
      </section>
    </div>
  );
}

function Slider({ label, value, setValue, min, max, suffix }) {
  return <label>{label} <strong>{value}{suffix}</strong><input type="range" min={min} max={max} value={value} onChange={(event) => setValue(Number(event.target.value))} /></label>;
}

export default App;
