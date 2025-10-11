import { useEffect, useState } from "react";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // каждые 5 секунд
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return <div className="text-center text-gray-400 mt-10">Загрузка данных...</div>;
  }

  return (
    <div className="flex flex-col items-center text-center mt-10 px-4 space-y-8">
      {/* ====== Секция 1: Характеристики ====== */}
      <section>
        <p className="text-gray-400">
          Ryzen 7 2700 • 16 GB RAM • Ubuntu 24.04 • K3s 1.33 • Traefik • PostgreSQL 16
        </p>
      </section>

      {/* ====== Секция 2: Мониторинг ====== */}
      <section className="grid md:grid-cols-3 gap-6 w-full max-w-4xl">
        <StatCard label="CPU Usage" color="bg-cyan-500" value={stats.cpu} unit="%" />
        <StatCard label="Memory Usage" color="bg-purple-500" value={stats.mem} unit="%" />
        <StatCard label="Temperature" color="bg-orange-500" value={stats.temp || 0} unit="°C" />
      </section>

      {/* ====== Секция 3: Активные сервисы ====== */}
      <section className="bg-gray-900 rounded-2xl p-6 shadow-lg w-full max-w-4xl">
        <h3 className="text-cyan-400 text-2xl font-bold mb-4">Активные сервисы</h3>
        <div className="grid md:grid-cols-2 gap-4 text-gray-300">
          {stats.services.map((s) => (
            <Service
              key={s.name}
              name={s.name}
              status={s.online ? "✅ Онлайн" : "❌ Оффлайн"}
            />
          ))}
        </div>
      </section>

      {/* ====== Секция 4: Системная информация ====== */}
      <section className="text-sm text-gray-500 mt-4">
        <p>Uptime: {stats.uptime} • Kubernetes: k3s • IP: 192.168.0.120</p>
      </section>
    </div>
  );
}

function StatCard({ label, color, value, unit }) {
  const width = `${Math.min(Number(value), 100)}%`;
  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
      <h3 className="text-cyan-400 font-semibold text-xl mb-2">{label}</h3>
      <div className="w-full bg-gray-800 rounded-full h-4">
        <div className={`${color} h-4 rounded-full transition-all duration-500`} style={{ width }}></div>
      </div>
      <p className="mt-2 text-gray-400 text-sm">{value}{unit}</p>
    </div>
  );
}

function Service({ name, status }) {
  return (
    <div className="flex justify-between bg-gray-800 px-4 py-2 rounded-lg">
      <span className="font-semibold">{name}</span>
      <span className={status.includes("✅") ? "text-cyan-400" : "text-red-400"}>{status}</span>
    </div>
  );
}
