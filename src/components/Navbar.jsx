export default function Navbar() {
  return (
    <nav className="glass-panel text-slate-100 px-6 py-4 mx-4 mt-4 flex justify-between items-center shadow-xl">
      <span className="text-2xl font-black tracking-wide uppercase">sk1bid</span>
      <div className="space-x-6 text-sm font-medium">
        <a href="/" className="transition-colors hover:text-cyan-300">
          Главная
        </a>
        <a href="/projects" className="transition-colors hover:text-cyan-300">
          Проекты
        </a>
        <a href="/about" className="transition-colors hover:text-cyan-300">
          Обо мне
        </a>
        <a href="/monitoring" className="transition-colors hover:text-cyan-300">
          Мониторинг
        </a>
      </div>
    </nav>
  );
}
