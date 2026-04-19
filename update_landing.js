const fs = require('fs');

const path = 'c:\\Users\\akula\\Desktop\\PROJECTS\\UrbanEye\\frontend\\src\\components\\LandingPage.jsx';
let content = fs.readFileSync(path, 'utf8');

const splitToken = '      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n          SECTION 1 — CITY STATS TICKER\r\n      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}';
const splitTokenLF = '      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n          SECTION 1 — CITY STATS TICKER\n      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}';

let parts = content.split(splitToken);
if (parts.length === 1) {
  parts = content.split(splitTokenLF);
}

if (parts.length > 1) {
  const before = parts[0];
  const newContent = `      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — WHAT WE MONITOR
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-transparent to-slate-50" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-[0.3em] text-blue-600 uppercase mb-3 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50">
              Real-Time Monitoring
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mt-3 text-slate-800">
              Vijayawada at a{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                Glance
              </span>
            </h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto text-base leading-relaxed">
              Four live data layers streaming directly from sensors and APIs across the city — all on one interactive map.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value="🌤️"  label="Weather Stations"     icon="🌡️" />
            <StatCard value="💨"   label="AQI Sensors"          icon="📡" />
            <StatCard value="📍"   label="Live Events"          icon="🗓️" />
            <StatCard value="🚗"   label="Traffic Coverage"     icon="🛣️" />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — FOUR DATA LAYERS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative py-24 px-6">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] bg-blue-200/30 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold tracking-[0.3em] text-blue-600 uppercase mb-3 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50">
              Data Layers
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mt-3 text-slate-800">
              Everything on{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                One Map
              </span>
            </h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto text-base leading-relaxed">
              Urban Eye overlays four real-time data streams on an interactive city map — toggle each layer on or off from the dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FeatureCard
              icon="🌤️"
              title="Live Weather"
              description="Real-time temperature, humidity, wind speed, cloud cover, and atmospheric pressure streamed from multiple weather stations across Vijayawada via OpenWeatherMap."
              accent="cyan"
            />
            <FeatureCard
              icon="💨"
              title="Air Quality & Pollution"
              description="AQI index with detailed pollutant breakdown — PM2.5, PM10, NO₂, O₃, CO, SO₂, and NH₃ levels averaged across monitoring points and color-coded by severity."
              accent="blue"
            />
            <FeatureCard
              icon="📍"
              title="City Events"
              description="Citizens and officials register events pinned to the map — festivals, road closures, community drives, and more. Each event shows organiser, schedule, and live status."
              accent="amber"
            />
            <FeatureCard
              icon="🚦"
              title="Traffic Intelligence"
              description="Live congestion data from Mapbox traffic tiles overlaid on every road — color-coded from green (free flow) to red (severe) with hover details at any intersection."
              accent="emerald"
            />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — LIVE DATA MODULES
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/50 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(59,130,246,0.04),transparent)] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-start">

            {/* Left — sticky label */}
            <div className="lg:w-80 flex-shrink-0 lg:sticky lg:top-24">
              <span className="inline-block text-xs font-bold tracking-[0.3em] text-emerald-600 uppercase mb-4 px-4 py-1.5 rounded-full border border-emerald-200 bg-emerald-50">
                Live Modules
              </span>
              <h2 className="text-4xl font-black tracking-tight leading-[1.1] mt-2 text-slate-800">
                What the{' '}
                <span className="bg-gradient-to-br from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Dashboard Shows
                </span>
              </h2>
              <p className="text-slate-500 mt-5 text-sm leading-relaxed">
                Each module streams live data into Urban Eye — weather conditions, pollution levels, citizen events, and traffic congestion updated in real time.
              </p>
              <div className="mt-8 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600 text-xs font-semibold tracking-wide uppercase">All systems nominal</span>
              </div>
            </div>

            {/* Right — module cards */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ModuleCard
                title="Weather Monitoring"
                tag="Climate"
                color="cyan"
                description="Live weather data from OpenWeatherMap stations positioned across Vijayawada, displayed as blue pins on the map."
                metrics={[
                  { label: 'Temperature',    value: 'Live °C', pct: '70%' },
                  { label: 'Humidity',        value: 'Live %',  pct: '55%' },
                  { label: 'Wind Speed',      value: 'Live m/s', pct: '40%' },
                ]}
              />
              <ModuleCard
                title="Air Quality Index"
                tag="Pollution"
                color="amber"
                description="AQI and individual pollutant concentrations averaged across all monitoring stations — visualised as color-coded heatmap circles."
                metrics={[
                  { label: 'PM2.5 Levels',    value: 'Live µg/m³', pct: '45%' },
                  { label: 'NO₂ / O₃',        value: 'Live ppb',   pct: '30%' },
                  { label: 'Overall AQI',      value: 'Averaged',   pct: '60%' },
                ]}
              />
              <ModuleCard
                title="City Events"
                tag="Community"
                color="emerald"
                description="Registered events pinned as red markers on the map — with name, organiser, category, schedule, and live status on hover."
                metrics={[
                  { label: 'Active Events',    value: 'Live',       pct: '35%' },
                  { label: 'Categories',       value: '9 types',    pct: '50%' },
                  { label: 'Map Pins',         value: 'Real-time',  pct: '40%' },
                ]}
              />
              <ModuleCard
                title="Traffic Flow"
                tag="Mobility"
                color="violet"
                description="Mapbox traffic vector tiles showing real-time congestion levels on every road — from free flow (green) to severe (red)."
                metrics={[
                  { label: 'Road Coverage',    value: 'Full city',  pct: '95%' },
                  { label: 'Congestion Levels',value: '5 tiers',    pct: '50%' },
                  { label: 'Update Frequency', value: 'Live',       pct: '90%' },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — CALL TO ACTION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[380px] rounded-full bg-blue-200/30 blur-[80px]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-bold tracking-[0.3em] text-blue-600 uppercase mb-6 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50">
            Explore the Dashboard
          </span>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6 text-slate-800">
            See Your City{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-violet-500 bg-clip-text text-transparent">
              Come Alive
            </span>
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Weather, pollution, events, and traffic — all streaming live on one interactive map. Open the dashboard or register a city event.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGoToCity}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>Open City Dashboard</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </button>

            <button
              onClick={handleRegister}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-base border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:-translate-y-0.5 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm"
            >
              <span>📌</span>
              <span>Register an Event</span>
            </button>
          </div>

          <p className="mt-8 text-slate-400 text-xs tracking-wide">
            Vijayawada Smart City Initiative · Powered by Urban Eye Platform
          </p>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FOOTER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="border-t border-slate-200 py-10 px-6 bg-white/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">
              UE
            </div>
            <div>
              <span className="text-slate-800 font-bold tracking-wider text-sm">URBAN EYE</span>
              <p className="text-slate-400 text-xs">Smart City Dashboard · Vijayawada</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {['Dashboard', 'Register Event'].map((link) => (
              <span
                key={link}
                className="text-slate-400 text-xs hover:text-blue-600 transition-colors duration-200 cursor-pointer tracking-wide"
              >
                {link}
              </span>
            ))}
          </div>

          <p className="text-slate-400 text-xs tracking-wide">
            © {new Date().getFullYear()} Urban Eye. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
`;
  fs.writeFileSync(path, before + newContent);
  console.log('Successfully updated LandingPage.jsx');
} else {
  console.log('Could not find split token');
}
