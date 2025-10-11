export default function About() {
  return (
    <div className="p-8 text-center max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-cyan-400 mb-4">Обо мне</h2>
      <p className="text-gray-400">
        Привет! Я Артём Иванов — DevOps-инженер и разработчик. Занимаюсь
        автоматизацией и инфраструктурой: Kubernetes, Docker, PostgreSQL, Telegram-боты и мониторинг.
        Все сервисы развернуты в моём домашнем k3s-кластере на Ryzen 7.
      </p>
      <div className="mt-6 text-sm text-gray-500">
        <p>🔗 Telegram: <a href="https://t.me/sk1bid" className="text-cyan-400 hover:underline">@sk1bid</a></p>
        <p>💾 GitHub: <a href="https://github.com/sk1bid" className="text-cyan-400 hover:underline">github.com/sk1bid</a></p>
      </div>
    </div>
  );
}
