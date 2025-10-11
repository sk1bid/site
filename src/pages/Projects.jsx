const projects = [
  { name: "GymBot", desc: "Телеграм-бот с PostgreSQL и asyncpg", color: "from-cyan-400 to-blue-500" },
  { name: "Factorio Server", desc: "Dockerized сервер с автосейвами и RCON", color: "from-yellow-400 to-orange-500" },
  { name: "Minecraft Server", desc: "Kubernetes-деплой Minecraft с NodePort", color: "from-green-400 to-emerald-500" },
  { name: "Monitoring Stack", desc: "Prometheus + Grafana + Loki (в разработке)", color: "from-purple-400 to-pink-500" },
];

export default function Projects() {
  return (
    <div className="p-8 text-center">
      <h2 className="text-3xl font-bold mb-8 text-cyan-400">Мои проекты</h2>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {projects.map((p) => (
          <div key={p.name} className={`p-6 rounded-2xl bg-gradient-to-br ${p.color} text-white shadow-lg`}>
            <h3 className="text-2xl font-semibold">{p.name}</h3>
            <p className="mt-2 text-sm">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
