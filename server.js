import express from "express";
import os from "os";
import si from "systeminformation";
import path from "path";
import net from "net";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// ===== Раздаём React билд =====
app.use(express.static(path.join(__dirname, "dist")));

// ===== Форматирование аптайма =====
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

// ===== Проверка TCP-порта =====
function checkPort(port, host = "192.168.0.120", timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const start = Date.now();

    socket.setTimeout(timeout);
    socket
      .once("connect", () => {
        const ms = Date.now() - start;
        socket.destroy();
        resolve({ online: true, responseTime: ms });
      })
      .once("timeout", () => {
        socket.destroy();
        resolve({ online: false, responseTime: null });
      })
      .once("error", () => {
        resolve({ online: false, responseTime: null });
      })
      .connect(port, host);
  });
}

// ===== Получение аптайма из systemctl (если доступно) =====
function getServiceUptime(name) {
  try {
    const out = execSync(
      `systemctl show ${name} --property=ActiveEnterTimestampMonotonic --value`,
      { encoding: "utf-8" }
    ).trim();

    if (!out) return null;
    const activeMs = Number(out);
    const uptimeSec = (Date.now() * 1000 - activeMs) / 1e6;
    return formatUptime(uptimeSec);
  } catch {
    return null;
  }
}

// ======= API =======
app.get("/api/status", async (req, res) => {
  try {
    const [cpuLoad, mem, temp, baseboard, disks, graphics] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.cpuTemperature(),
      si.baseboard(),
      si.fsSize(),
      si.graphics(),
    ]);

    const uptime = formatUptime(os.uptime());
    const totalDisk = disks.reduce((a, d) => a + d.size, 0);
    const usedDisk = disks.reduce((a, d) => a + d.used, 0);

    const services = [
      { name: "GymBot", port: 30081, systemd: "gym-bot" },
      { name: "Factorio", port: 34197, systemd: "factorio-server" },
      { name: "Minecraft", port: 25565, systemd: "minecraft-server" },
      { name: "PostgreSQL", port: 5432, systemd: "postgresql" },
    ];

    const checks = await Promise.all(
      services.map(async (s) => {
        const net = await checkPort(s.port);
        const uptime = getServiceUptime(s.systemd);
        return { ...s, ...net, uptime };
      })
    );

    res.json({
      system: {
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

// ======= SPA fallback =======
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ======= Старт =======
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
