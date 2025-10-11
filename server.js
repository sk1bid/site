import express from "express";
import os from "os";
import si from "systeminformation";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// ====== Статика для фронтенда ======
app.use(express.static(path.join(__dirname, "dist")));

// ====== Формат аптайма ======
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}д`);
  if (h) parts.push(`${h}ч`);
  if (m) parts.push(`${m}м`);
  return parts.join(" ") || "менее минуты";
}

// ====== API endpoint ======
app.get("/api/status", async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const temp = await si.cpuTemperature();

    const uptime = formatUptime(os.uptime());
    const services = [
      { name: "GymBot", port: 30081 },
      { name: "Factorio", port: 34197 },
      { name: "Minecraft", port: 25565 },
      { name: "PostgreSQL", port: 5432 },
    ];

    const checks = await Promise.all(
      services.map(async (s) => {
        const online = await si.inetChecksite(`http://127.0.0.1:${s.port}`).then(() => true).catch(() => false);
        return { ...s, online };
      })
    );

    res.json({
      cpu: cpu.currentLoad.toFixed(1),
      mem: ((mem.active / mem.total) * 100).toFixed(1),
      temp: temp.main ? temp.main.toFixed(1) : null,
      uptime,
      services: checks,
    });
  } catch (err) {
    console.error("❌ Metrics error:", err);
    res.status(500).json({ error: "failed to fetch metrics" });
  }
});

// ====== SPA fallback ======
// 🟢 ВАЖНО: именно /.*/ а не "/*" — это устраняет ошибку path-to-regexp
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ====== Запуск сервера ======
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
