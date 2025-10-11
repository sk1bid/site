export default function Navbar() {
  return (
    <nav className="glass-panel text-slate-100 px-6 py-4 mx-4 mt-4 flex justify-between items-center shadow-xl">
      <a href="/" className="text-2xl font-bold tracking-tight transition-colors hover:text-cyan-300">
        sk1bid
      </a>
      <div className="space-x-6 text-sm font-medium">
        <a href="/projects" className="transition-colors hover:text-cyan-300">
          Проекты
        </a>
        <a href="/about" className="transition-colors hover:text-cyan-300">
          Обо мне
        </a>
      </div>
    </nav>
  );
}
