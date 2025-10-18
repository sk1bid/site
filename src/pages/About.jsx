export default function About() {
  return (
    <div className="px-6 py-16 flex justify-center">
      <article className="glass-panel max-w-3xl w-full px-10 py-12 text-left leading-relaxed">
        <h2 className="text-3xl font-bold text-cyan-300 mb-6 tracking-wide">About</h2>
        <p className="text-slate-300 text-base">
          Hi! I&apos;m Artyom Ivanov — a DevOps engineer and developer focused on automation and resilient
          infrastructure. My toolkit includes Kubernetes, Docker, PostgreSQL, Telegram bots, and full-stack
          observability. Everything you see here runs in my home lab k3s cluster.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 gap-4 text-sm text-slate-200">
          <p>
            🔗 Telegram:{" "}
            <a href="https://t.me/cg_skbid" className="text-cyan-300 hover:text-cyan-200 transition-colors">
              @cg_skbid
            </a>
          </p>
          <p>
            💾 GitHub:{" "}
            <a href="https://github.com/sk1bid" className="text-cyan-300 hover:text-cyan-200 transition-colors">
              github.com/sk1bid
            </a>
          </p>
        </div>
      </article>
    </div>
  );
}
