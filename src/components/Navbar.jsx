export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between">
      <span className="font-bold text-xl">sk1bid.devops</span>
      <div className="space-x-4">
        <a href="/" className="hover:text-blue-400">Главная</a>
        <a href="/projects" className="hover:text-blue-400">Проекты</a>
        <a href="/about" className="hover:text-blue-400">Обо мне</a>
      </div>
    </nav>
  );
}
