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

  const { system, metrics, services, hardware } = data;

  const cpuDetails = [
    hardware?.cpu?.model ? `Модель: ${hardware.cpu.model}` : null,
    Number.isFinite(hardware?.cpu?.cores) ? `Потоков: ${hardware.cpu.cores}` : null,
  ].filter(Boolean);

  const totalMemory = hardware?.memory?.totalGB;
  const memoryDetails = [
    Number.isFinite(totalMemory) ? `Всего: ${totalMemory} ГБ` : null,
  ].filter(Boolean);
  const memUsagePercent = Number(metrics?.mem);
  if (Number.isFinite(totalMemory) && Number.isFinite(memUsagePercent)) {
    const usedMemory = Number(((memUsagePercent / 100) * totalMemory).toFixed(1));
    memoryDetails.push(`Использовано: ${usedMemory} ГБ`);
  }

  const diskDetails = (hardware?.disks || []).map((disk) =>
    `Диск ${disk.id}: ${disk.usedGB}/${disk.sizeGB} ГБ`
  );
  const motherboardDetails = hardware?.motherboard
    ? [`Плата: ${hardware.motherboard}`]
    : [];
  const tempDetails = [];
  if (Number.isFinite(metrics?.temp)) {
    tempDetails.push(`Сейчас: ${metrics.temp} °C`);
  }
  if (motherboardDetails.length > 0) {
    tempDetails.push(...motherboardDetails);
  } else if (cpuDetails.length > 0) {
    tempDetails.push(...cpuDetails);
  }

  const hardwareGroups = [
    { title: "Процессор", items: cpuDetails },
    { title: "Память", items: memoryDetails },
    { title: "Температуры", items: tempDetails },
    { title: "Накопители", items: diskDetails },
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (line, idx, arr) => typeof line === "string" && arr.indexOf(line) === idx
      ),
    }))
    .filter((group) => group.items.length > 0);
  const hasHardwareGroups = hardwareGroups.length > 0;

  return (
    <div className="flex flex-col items-center text-center mt-12 px-4 space-y-10">
      {/* ===== Секция: железо ===== */}
      <section className="glass-panel p-8 max-w-4xl w-full text-left">
        <h2 className="text-cyan-300 text-2xl font-bold mb-3 tracking-wide">System</h2>
        <p className="text-slate-400 text-sm uppercase tracking-[0.2em]">
          Uptime: {system.uptime}
        </p>
        {hasHardwareGroups && (
          <div className="mt-6 space-y-4 md:hidden">
            {hardwareGroups.map((group) => (
              <article
                key={group.title}
                className="rounded-3xl border border-cyan-400/15 bg-slate-900/40 px-5 py-4 shadow-[0_18px_40px_rgba(8,15,35,0.45)] backdrop-blur"
              >
                <h3 className="text-slate-200 text-sm font-semibold tracking-[0.24em] uppercase">
                  {group.title}
                </h3>
                <ul className="mt-2 space-y-1 text-slate-300 text-sm">
                  {group.items.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ===== Секция: ресурсы ===== */}
      <section className="grid md:grid-cols-4 gap-6 w-full max-w-5xl">
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
          label="Disk"
          value={metrics.disk}
          color="bg-green-500"
          unit="%"
          details={diskDetails}
        />
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

function Stat({ label, value, color, unit, details = [] }) {
  const width = `${Math.min(value, 100)}%`;
  const lines = details.filter(
    (line, idx, arr) => typeof line === "string" && arr.indexOf(line) === idx
  );
  const hasDetails = lines.length > 0;

  return (
    <div className="group relative md:hover:z-40 md:focus-within:z-40">
      <div
        className={`glass-panel stat-card p-6 text-left transition-transform duration-300 ease-out ${
          hasDetails
            ? "md:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 md:hover:-translate-y-2 focus-visible:-translate-y-2"
            : ""
        }`}
        tabIndex={hasDetails ? 0 : undefined}
      >
        <h3 className="text-cyan-200 font-semibold text-xl mb-3 tracking-wide">{label}</h3>
        <div className="relative w-full bg-slate-900/60 ring-1 ring-white/10 rounded-full h-3 overflow-hidden">
          <div
            className={`${color} h-3 rounded-full transition-all duration-700 ease-out shadow-[0_0_18px_rgba(148,163,184,0.35)]`}
            style={{ width }}
          ></div>
        </div>
        <p className="mt-3 text-slate-300 text-sm font-medium">
          {value}
          {unit}
        </p>
      </div>
      {hasDetails && (
        <div className="pointer-events-none absolute left-1/2 bottom-full hidden w-72 -translate-x-1/2 translate-y-4 rounded-3xl border border-cyan-400/20 bg-slate-950/95 px-6 py-5 text-xs text-slate-100 shadow-[0_35px_80px_rgba(8,15,35,0.75)] transition-all duration-300 md:flex md:flex-col md:opacity-0 md:group-hover:-translate-y-3 md:group-hover:opacity-100 md:group-focus-within:-translate-y-3 md:group-focus-within:opacity-100">
          <ul className="space-y-1 text-left">
            {lines.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
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
      return "Игроки: сервер недоступен";
    }

    if (hasPlayers) {
      return `Игроки: ${playerCount}`;
    }

    return "Игроки: данные недоступны";
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
        <p className="mt-1 text-slate-400 text-xs">Онлайн: {playerNames.join(", ")}</p>
      )}
    </div>
  );
}
