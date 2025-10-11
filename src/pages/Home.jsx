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

  if (!data) return <p className="text-gray-400 text-center mt-10">Загрузка...</p>;

  const { system, metrics, services } = data;

  return (
    <div className="flex flex-col items-center text-center mt-10 px-4 space-y-8">
      {/* ===== Секция: железо ===== */}
      <section className="bg-gray-900 p-6 rounded-2xl shadow-lg max-w-4xl w-full">
        <h2 className="text-cyan-400 text-2xl font-bold mb-3">Система</h2>
        <p className="text-gray-400 text-sm">
          {system.cpu} • {system.cores} потоков • {system.ramGB} GB RAM
        </p>
        <p className="text-gray-500 text-sm mt-1">
          {system.gpu} • {system.os} ({system.kernel})
        </p>
        <p className="text-gray-500 text-sm">Материнская плата: {system.motherboard}</p>
        <p className="text-gray-500 text-sm mt-1">Аптайм: {system.uptime}</p>
      </section>

      {/* ===== Секция: ресурсы ===== */}
      <section className="grid md:grid-cols-4 gap-6 w-full max-w-5xl">
        <Stat label="CPU" value={metrics.cpu} color="bg-cyan-500" unit="%" />
        <Stat label="Memory" value={metrics.mem} color="bg-purple-500" unit="%" />
        <Stat label="Temp" value={metrics.temp} color="bg-orange-500" unit="°C" />
        <Stat label="Disk" value={metrics.disk} color="bg-green-500" unit="%" />
      </section>

      {/* ===== Секция: сервисы ===== */}
      <section className="bg-gray-900 rounded-2xl p-6 shadow-lg w-full max-w-5xl">
        <h3 className="text-cyan-400 text-2xl font-bold mb-4">Сервисы</h3>
        <div className="grid md:grid-cols-2 gap-4 text-gray-300">
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
    <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
      <h3 className="text-cyan-400 font-semibold text-xl mb-2">{label}</h3>
      <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
        <div
          className={`${color} h-4 rounded-full transition-all duration-700 ease-out`}
          style={{ width }}
        ></div>
      </div>
      <p className="mt-2 text-gray-400 text-sm">{value}{unit}</p>
    </div>
  );
}

function Service({ name, online, responseTime }) {
  return (
    <div className="flex justify-between bg-gray-800 px-4 py-2 rounded-lg">
      <span className="font-semibold">{name}</span>
      <span className={online ? "text-cyan-400" : "text-red-400"}>
        {online ? `✅ Онлайн (${responseTime} мс)` : "❌ Оффлайн"}
      </span>
    </div>
  );
}
