export default function Navbar() {
  return (
    <nav className="glass-panel text-slate-100 px-6 py-4 mx-4 mt-4 flex justify-between items-center shadow-xl">
      <a href="/" className="text-2xl font-bold tracking-tight transition-colors hover:text-cyan-300">
        sk1bid
      </a>
      <div className="flex items-center gap-6 text-sm font-medium">
        <a href="/projects" className="transition-colors hover:text-cyan-300">
          Проекты
        </a>
        <a href="/about" className="transition-colors hover:text-cyan-300">
          Обо мне
        </a>
        <a
          href="/"
          className="inline-flex items-center rounded-full border border-cyan-400/60 px-4 py-2 text-cyan-100 transition-all hover:border-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200"
        >
          Главная
        </a>
      </div>
    </nav>
  );
}
