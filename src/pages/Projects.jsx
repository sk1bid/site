import { useState } from "react";

const projects = [
  {
    name: "GymAssistant",
    desc: "Telegram bot for gym scheduling powered by PostgreSQL + asyncpg",
    glow: "rgba(56, 189, 248, 0.55)",
    href: "https://github.com/sk1bid/gymassistant",
    cta: "View repository",
  },
  {
    name: "Factorio Server",
    desc: "Dockerized server with automated saves and RCON management",
    glow: "rgba(251, 191, 36, 0.45)",
  },
  {
    name: "Minecraft Server",
    desc: "Kubernetes-hosted Minecraft using NodePort networking",
    glow: "rgba(45, 212, 191, 0.45)",
    copy: "mc.sk1bid.ru",
  },
  {
    name: "Monitoring Stack",
    desc: "Prometheus + Grafana + Loki (in progress)",
    glow: "rgba(192, 132, 252, 0.5)",
  },
];

export default function Projects() {
  const [copiedProject, setCopiedProject] = useState(null);

  const handleCopy = async (projectName, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedProject(projectName);
      setTimeout(() => setCopiedProject(null), 2200);
    } catch (error) {
      console.error("Unable to copy domain", error);
    }
  };

  return (
    <div className="px-6 py-16 flex flex-col items-center space-y-12">
      <div className="glass-panel max-w-3xl w-full px-10 py-8 text-center">
        <h2 className="text-3xl font-bold text-cyan-300 tracking-wide">Projects</h2>
        <p className="mt-4 text-sm text-slate-300">
          A collection of services and experiments that I maintain and iterate on inside my home lab cluster.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {projects.map((p) => {
          const cardContent = (
            <article className="glass-panel project-card p-8 text-left">
              <span
                className="project-card__glow"
                style={{ background: `radial-gradient(circle at 30% 20%, ${p.glow} 0%, transparent 65%)` }}
              />
              <h3 className="text-2xl font-semibold text-slate-100">{p.name}</h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">{p.desc}</p>
              {p.href && (
                <span className="inline-flex items-center gap-2 mt-6 text-cyan-200 text-sm font-medium">
                  <span>→</span>
                  {p.cta}
                </span>
              )}
              {p.copy && (
                <button
                  type="button"
                  onClick={() => handleCopy(p.name, p.copy)}
                  className="glass-chip copy-chip mt-6 inline-flex items-center gap-2"
                >
                  <span className="copy-dot" aria-hidden />
                  {copiedProject === p.name ? "Copied!" : `Copy ${p.copy}`}
                </button>
              )}
            </article>
          );

          return p.href ? (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="project-link"
              aria-label={`${p.name}: open in a new tab`}
            >
              {cardContent}
            </a>
          ) : (
            <div key={p.name} className="project-link--static">
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
