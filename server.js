import express from "express";
import os from "os";
import si from "systeminformation";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Отдаём статические файлы React
app.use(express.static(path.join(__dirname, "dist")));

// Форматирование аптайма
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

// ===== API для фронта =====
app.get("/api/status", async (req, res) => {
  try {
    const [cpuLoad, mem, temp, sys, baseboard, disks, graphics] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.cpuTemperature(),
      si.osInfo(),
      si.baseboard(),
      si.fsSize(),
      si.graphics(),
    ]);

    const uptime = formatUptime(os.uptime());
    const totalDisk = disks.reduce((a, d) => a + d.size, 0);
    const usedDisk = disks.reduce((a, d) => a + d.used, 0);

    const services = [
      { name: "GymBot", port: 30081 },
      { name: "Factorio", port: 34197 },
      { name: "Minecraft", port: 25565 },
      { name: "PostgreSQL", port: 5432 },
    ];

    const checks = await Promise.all(
      services.map(async (s) => {
        try {
          const net = await si.inetChecksite(`http://127.0.0.1:${s.port}`);
          return { ...s, online: true, responseTime: net?.ms || null };
        } catch {
          return { ...s, online: false, responseTime: null };
        }
      })
    );

    res.json({
      system: {
        os: `${sys.distro} ${sys.release}`,
        kernel: sys.kernel,
        motherboard: baseboard.model || baseboard.manufacturer,
        cpu: os.cpus()[0].model,
        cores: os.cpus().length,
        gpu: graphics.controllers[0]?.model || "N/A",
        ramGB: (mem.total / 1e9).toFixed(1),
        uptime,
      },
      metrics: {
        cpu: cpuLoad.currentLoad.toFixed(1),
        mem: ((mem.active / mem.total) * 100).toFixed(1),
        temp: temp.main?.toFixed(1) || "0.0",
        disk: ((usedDisk / totalDisk) * 100).toFixed(1),
      },
      services: checks,
    });
  } catch (err) {
    console.error("Ошибка API:", err);
    res.status(500).json({ error: "failed to fetch metrics" });
  }
});

// ===== catch-all для React SPA =====
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ===== запуск сервера =====
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
