import { useEffect, useMemo, useState } from "react";

function createInitialState() {
  return { loading: true, error: null, payload: null };
}

export default function Home() {
  const [state, setState] = useState(createInitialState);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const res = await fetch("/api/status");
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || `Request failed with ${res.status}`);
        }

        if (!active) return;

        setState({ loading: false, error: null, payload: json });
      } catch (err) {
        console.error("Failed to fetch status:", err);
        if (!active) return;
        setState({
          loading: false,
          error: "Status data is temporarily unavailable. Please try again shortly.",
          payload: null,
        });
      }
    };

    fetchData();
    const i = setInterval(fetchData, 5000);
    return () => {
      active = false;
      clearInterval(i);
    };
  }, [reloadToken]);

  if (state.loading) {
    return <p className="text-gray-400 text-center mt-10">Loading...</p>;
  }

  if (state.error) {
    return (
      <div className="mt-12 flex flex-col items-center gap-4 text-center text-slate-200">
        <p className="text-lg font-semibold text-rose-300">Something went wrong</p>
        <p className="max-w-sm text-sm text-slate-300/80">{state.error}</p>
        <button
          type="button"
          className="rounded-full border border-cyan-400/60 px-5 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200"
          onClick={() => {
            setState(createInitialState());
            setReloadToken((token) => token + 1);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  const { system, metrics, services, hardware } = state.payload || {};

  const cpuDetails = [
    hardware?.cpu?.model ? `Model: ${hardware.cpu.model}` : null,
    Number.isFinite(hardware?.cpu?.cores) ? `Cores: ${hardware.cpu.cores}` : null,
  ].filter(Boolean);

  const totalMemory = hardware?.memory?.totalGB;
  const memoryDetails = [
    Number.isFinite(totalMemory) ? `Total: ${totalMemory} GB` : null,
  ].filter(Boolean);
  const memUsagePercent = Number(metrics?.mem);
  if (Number.isFinite(totalMemory) && Number.isFinite(memUsagePercent)) {
    const usedMemory = Number(((memUsagePercent / 100) * totalMemory).toFixed(1));
    memoryDetails.push(`Used: ${usedMemory} GB`);
  }

  const diskDetails = (hardware?.disks || []).map((disk) =>
    `Drive ${disk.id}: ${disk.usedGB}/${disk.sizeGB} GB`
  );
  const motherboardDetails = hardware?.motherboard
    ? [`Board: ${hardware.motherboard}`]
    : [];
  const tempDetails = [];
  if (Number.isFinite(metrics?.temp)) {
    tempDetails.push(`Now: ${metrics.temp} °C`);
  }
  if (motherboardDetails.length > 0) {
    tempDetails.push(...motherboardDetails);
  } else if (cpuDetails.length > 0) {
    tempDetails.push(...cpuDetails);
  }

  const hardwareGroups = [
    { title: "Processor", items: cpuDetails },
    { title: "Memory", items: memoryDetails },
    { title: "Thermals", items: tempDetails },
    { title: "Storage", items: diskDetails },
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (line, idx, arr) => typeof line === "string" && arr.indexOf(line) === idx
      ),
    }))
    .filter((group) => group.items.length > 0);
  const hasHardwareGroups = hardwareGroups.length > 0;

  const desktopSummary = hardwareGroups
    .map((group) => {
      const [label, ...rest] = (group.items[0] ?? "").split(":");
      if (!group.items[0]) {
        return null;
      }
      if (rest.length === 0) {
        return { title: group.title, value: group.items[0].trim() };
      }
      const value = rest.join(":").trim();
      return { title: group.title, value: value || group.items[0].trim() };
    })
    .filter(Boolean);

  if (!system || !metrics || !Array.isArray(services)) {
    return (
      <div className="mt-12 flex flex-col items-center gap-4 text-center text-slate-200">
        <p className="text-lg font-semibold text-amber-200">Data temporarily unavailable</p>
        <p className="max-w-sm text-sm text-slate-300/80">
          The API response was missing expected fields. Please refresh the page or check back later.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center mt-12 px-4 space-y-12 md:space-y-8 lg:mx-auto lg:max-w-6xl lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-8 lg:space-y-0"
    >
      {/* ===== System overview ===== */}
      <section className="glass-panel p-8 max-w-5xl w-full text-left lg:col-start-1 lg:row-start-1 lg:max-w-none">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.42em] text-cyan-200/70">Home lab uptime</p>
            <h2 className="text-cyan-100 text-3xl font-semibold tracking-wide">System overview</h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Running for <span className="text-cyan-200 font-semibold">{system.uptime}</span> with live hardware
              telemetry below.
            </p>
          </header>
          {desktopSummary.length > 0 && (
            <dl className="hidden md:grid md:grid-cols-2 gap-x-8 gap-y-4">
              {desktopSummary.map((item) => (
                <div key={item.title} className="flex flex-col gap-1">
                  <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-cyan-200/60">{item.title}</dt>
                  <dd className="text-slate-50 text-base font-semibold leading-snug">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        {hasHardwareGroups && (
          <div className="mt-8 grid gap-4 md:hidden">
            {hardwareGroups.map((group) => (
              <article
                key={group.title}
                className="rounded-3xl border border-cyan-400/15 bg-slate-900/50 px-5 py-5 shadow-[0_18px_40px_rgba(8,15,35,0.4)] backdrop-blur">
                <h3 className="text-slate-200 text-sm font-semibold tracking-[0.28em] uppercase">
                  {group.title}
                </h3>
                <ul className="mt-3 space-y-1.5 text-slate-300 text-sm leading-relaxed">
                  {group.items.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ===== Live metrics + services ===== */}
      <section className="grid w-full max-w-5xl gap-6 md:grid-cols-2 lg:col-span-2 lg:row-start-2 lg:max-w-none lg:grid-cols-4">
        <Stat
          label="CPU"
          value={metrics.cpu}
          color="bg-cyan-500"
          unit="%"
          details={cpuDetails}
        />
        <Stat
          label="Memory"
          value={metrics.mem}
          color="bg-purple-500"
          unit="%"
          details={memoryDetails}
        />
        <Stat
          label="Temp"
          value={metrics.temp}
          color="bg-orange-500"
          unit="°C"
          details={tempDetails}
        />
        <Stat
          label="Storage"
          value={metrics.disk}
          color="bg-green-500"
          unit="%"
          details={diskDetails}
        />
      </section>

      <section className="glass-panel p-6 w-full max-w-5xl text-left lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:flex lg:h-full lg:max-w-none lg:flex-col lg:p-8">
        <h3 className="text-cyan-100 text-2xl font-semibold mb-5 tracking-wide">Services</h3>
        <div className="grid gap-4 text-slate-200 sm:grid-cols-2 lg:flex-1">
          {services.map((s) => (
            <Service key={s.name} {...s} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, color, unit, details = [] }) {
  const parsedValue = Number.parseFloat(value);
  const numericValue = Number.isFinite(parsedValue) ? parsedValue : null;
  const width = numericValue !== null ? `${Math.min(Math.max(numericValue, 0), 100)}%` : "0%";
  const lines = details.filter(
    (line, idx, arr) => typeof line === "string" && arr.indexOf(line) === idx
  );
  const hasDetails = lines.length > 0;

  const parsedDetails = lines.map((line) => {
    const [rawTitle, ...rawRest] = line.split(":");
    if (rawRest.length === 0) {
      return { id: line, title: null, value: line.trim() };
    }
    const title = rawTitle.trim();
    const value = rawRest.join(":").trim();
    return {
      id: `${title}-${value}`,
      title,
      value,
    };
  });

  const popoverCopy = {
    CPU: "Processor details",
    Memory: "Memory utilisation",
    Temp: "Thermal snapshot",
    Storage: "Storage usage",
  };

  const popoverIcon = {
    CPU: "🧠",
    Memory: "💾",
    Temp: "🌡️",
    Storage: "🗄️",
  };

  return (
    <div className="group relative md:hover:z-40 md:focus-within:z-40">
      <div
        className={`glass-panel stat-card p-6 text-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          hasDetails
            ? "md:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 md:hover:-translate-y-3 focus-visible:-translate-y-3"
            : ""
        }`}
        tabIndex={hasDetails ? 0 : undefined}
      >
        <h3 className="text-cyan-200 font-semibold text-xl mb-3 tracking-wide">{label}</h3>
        <div className="relative w-full overflow-hidden rounded-full bg-slate-900/60 ring-1 ring-white/10 h-3">
          <div
            className={`${color} stat-bar h-3 rounded-full shadow-[0_0_18px_rgba(148,163,184,0.35)]`}
            style={{ width }}
          ></div>
        </div>
        <p className="mt-3 text-slate-300 text-sm font-medium">
          {numericValue !== null
            ? Number.isInteger(numericValue)
              ? numericValue
              : numericValue.toFixed(1)
            : "—"}
          {unit}
        </p>
      </div>
      {hasDetails && (
        <div className="stat-popover pointer-events-none absolute left-1/2 bottom-full hidden w-80 -translate-x-1/2 translate-y-5 md:flex md:flex-col md:opacity-0 md:group-hover:-translate-y-4 md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-focus-within:-translate-y-4 md:group-focus-within:opacity-100 md:group-focus-within:pointer-events-auto">
          <header className="flex items-center gap-3 text-left">
            <div className="stat-popover__icon" aria-hidden>{popoverIcon[label] ?? "ℹ️"}</div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.26em] text-cyan-200/80">{label}</p>
              <p className="text-sm font-semibold text-slate-50">
                {popoverCopy[label] ?? "Additional details"}
              </p>
            </div>
          </header>
          <dl className="mt-4 space-y-2 text-left text-sm text-slate-100">
            {parsedDetails.map((item) => (
              <div key={item.id} className="stat-detail">
                {item.title ? (
                  <dt className="stat-detail__label">{item.title}</dt>
                ) : null}
                <dd className="stat-detail__value">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function Service({ name, online, responseTime, players, supportsPlayers }) {
  const latency =
    online && typeof responseTime === "number"
      ? ` (${Math.max(1, Math.round(responseTime))} ms)`
      : "";
  const statusText = online ? `🟢 Online${latency}` : "🔴 Offline";
  const hasPlayers =
    supportsPlayers && players && typeof players.current === "number";
  const playerCount = hasPlayers
    ? `${players.current}/${players.max ?? 10}`
    : null;
  const playerNames = hasPlayers ? players.list?.filter(Boolean) ?? [] : [];

  const renderPlayersInfo = () => {
    if (!supportsPlayers) {
      return null;
    }

    if (!online) {
      return "Players: server unavailable";
    }

    if (hasPlayers) {
      return `Players: ${playerCount}`;
    }

    return "Players: data unavailable";
  };

  return (
    <div className="glass-chip px-4 py-4 text-left">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold tracking-wide text-slate-100">{name}</span>
        <span className={online ? "text-emerald-300" : "text-rose-400"}>{statusText}</span>
      </div>
      {supportsPlayers && (
        <p className="mt-2 text-slate-300 text-sm font-medium">{renderPlayersInfo()}</p>
      )}
      {supportsPlayers && online && playerNames.length > 0 && (
        <p className="mt-1 text-slate-400 text-xs">Online: {playerNames.join(", ")}</p>
      )}
    </div>
  );
}
