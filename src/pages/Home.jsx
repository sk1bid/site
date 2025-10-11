export default function Home() {
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
        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
          <h3 className="text-cyan-400 font-semibold text-xl mb-2">CPU Usage</h3>
          <div className="w-full bg-gray-800 rounded-full h-4">
            <div className="bg-cyan-500 h-4 rounded-full w-[42%]"></div>
          </div>
          <p className="mt-2 text-gray-400 text-sm">42%</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
          <h3 className="text-cyan-400 font-semibold text-xl mb-2">Memory Usage</h3>
          <div className="w-full bg-gray-800 rounded-full h-4">
            <div className="bg-purple-500 h-4 rounded-full w-[63%]"></div>
          </div>
          <p className="mt-2 text-gray-400 text-sm">63%</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
          <h3 className="text-cyan-400 font-semibold text-xl mb-2">Temperature</h3>
          <div className="w-full bg-gray-800 rounded-full h-4">
            <div className="bg-orange-500 h-4 rounded-full w-[55%]"></div>
          </div>
          <p className="mt-2 text-gray-400 text-sm">55°C</p>
        </div>
      </section>

      {/* ====== Секция 3: Активные сервисы ====== */}
      <section className="bg-gray-900 rounded-2xl p-6 shadow-lg w-full max-w-4xl">
        <h3 className="text-cyan-400 text-2xl font-bold mb-4">Активные сервисы</h3>
        <div className="grid md:grid-cols-2 gap-4 text-gray-300">
          <Service name="GymBot" status="✅ Работает" />
          <Service name="Factorio" status="✅ Онлайн" />
          <Service name="Minecraft" status="✅ Онлайн" />
          <Service name="PostgreSQL" status="✅ Активен" />
        </div>
      </section>

      {/* ====== Секция 4: Системная информация ====== */}
      <section className="text-sm text-gray-500 mt-4">
        <p>IP: 192.168.0.120 • Uptime: 2 дня 13 часов • Kubernetes: k3s</p>
      </section>

    </div>
  );
}

function Service({ name, status }) {
  return (
    <div className="flex justify-between bg-gray-800 px-4 py-2 rounded-lg">
      <span className="font-semibold">{name}</span>
      <span className="text-cyan-400">{status}</span>
    </div>
  );
}
