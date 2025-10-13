import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/status");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Ошибка загрузки:", err);
      }
    };
    fetchData();
    const i = setInterval(fetchData, 5000);
    return () => clearInterval(i);
  }, []);

  if (!data) return <p className="text-gray-400 text-center mt-10">Download...</p>;

  const { system, metrics, services } = data;

  return (
    <div className="flex flex-col items-center text-center mt-12 px-4 space-y-10">
      {/* ===== Секция: железо ===== */}
      <section className="glass-panel p-8 max-w-4xl w-full text-left">
        <h2 className="text-cyan-300 text-2xl font-bold mb-3 tracking-wide">System</h2>
        <p className="text-slate-300 text-sm">
          {system.cpu} • {system.cores} threads • {system.ramGB} GB RAM
        </p>
        <p className="text-slate-400 text-sm mt-3 uppercase tracking-[0.2em]">
          Uptime: {system.uptime}
        </p>
      </section>

      {/* ===== Секция: ресурсы ===== */}
      <section className="grid md:grid-cols-4 gap-6 w-full max-w-5xl">
        <Stat label="CPU" value={metrics.cpu} color="bg-cyan-500" unit="%" />
        <Stat label="Memory" value={metrics.mem} color="bg-purple-500" unit="%" />
        <Stat label="Temp" value={metrics.temp} color="bg-orange-500" unit="°C" />
        <Stat label="Disk" value={metrics.disk} color="bg-green-500" unit="%" />
      </section>

      {/* ===== Секция: сервисы ===== */}
      <section className="glass-panel p-8 w-full max-w-5xl text-left">
        <h3 className="text-cyan-300 text-2xl font-bold mb-6 tracking-wide">Сервисы</h3>
        <div className="grid md:grid-cols-2 gap-4 text-slate-200">
          {services.map((s) => (
            <Service key={s.name} {...s} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, color, unit }) {
  const width = `${Math.min(value, 100)}%`;
  return (
    <div className="glass-panel p-6 text-left">
      <h3 className="text-cyan-200 font-semibold text-xl mb-3 tracking-wide">{label}</h3>
      <div className="relative w-full bg-slate-900/60 ring-1 ring-white/10 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-3 rounded-full transition-all duration-700 ease-out shadow-[0_0_18px_rgba(148,163,184,0.35)]`}
          style={{ width }}
        ></div>
      </div>
      <p className="mt-3 text-slate-300 text-sm font-medium">{value}{unit}</p>
    </div>
  );
}

function Service({ name, online, responseTime, players }) {
  const latency =
    online && typeof responseTime === "number"
      ? ` (${Math.max(1, Math.round(responseTime))} ms)`
      : "";
  const statusText = online ? `🟢 Online${latency}` : "🔴 Offline";
  const hasPlayers = players && typeof players.current === "number";
  const playerCount = hasPlayers
    ? `${players.current}/${players.max ?? "?"}`
    : null;
  const playerNames = players?.list?.filter(Boolean) ?? [];

  return (
    <div className="glass-chip px-4 py-4 text-left">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold tracking-wide text-slate-100">{name}</span>
        <span className={online ? "text-emerald-300" : "text-rose-400"}>{statusText}</span>
      </div>
      <p className="mt-2 text-slate-300 text-sm font-medium">
        {online
          ? hasPlayers
            ? `Игроки: ${playerCount}`
            : "Игроки: данные недоступны"
          : "Игроки: сервер недоступен"}
      </p>
      {online && playerNames.length > 0 && (
        <p className="mt-1 text-slate-400 text-xs">Онлайн: {playerNames.join(", ")}</p>
      )}
    </div>
  );
}
