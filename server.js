/* eslint-env node */
/* global process, Buffer */

import express from "express";
import os from "os";
import si from "systeminformation";
import path from "path";
import net from "net";
import dgram from "dgram";
import fs from "fs";
import { execSync, spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.STATUS_HOST || "192.168.0.120";
const FACTORIO_RCON_HOST = process.env.FACTORIO_RCON_HOST || HOST;
const FACTORIO_RCON_PORT = Number(process.env.FACTORIO_RCON_PORT || 27015);
const FACTORIO_RCON_PASSWORD = process.env.FACTORIO_RCON_PASSWORD || "";
const FACTORIO_RCON_SCRIPT = path.join(
  __dirname,
  "scripts",
  "factorio_online.py"
);

// ====== Serve the frontend bundle ======
app.use(express.static(path.join(__dirname, "dist")));

// ====== Uptime formatting ======
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.join(" ") || "under a minute";
}

// ====== TCP / UDP port check ======
function checkPort(port, host = HOST, timeout = 1000, protocol = "tcp") {
  return new Promise((resolve) => {
    const start = Date.now();

    if (protocol === "udp") {
      const socket = dgram.createSocket("udp4");
      const msg = Buffer.from("ping");
      let done = false;

      socket.on("error", () => {
        if (!done) resolve({ online: false, responseTime: null });
        done = true;
        socket.close();
      });

      socket.send(msg, 0, msg.length, port, host, (err) => {
        if (err) {
          if (!done) resolve({ online: false, responseTime: null });
          done = true;
          socket.close();
          return;
        }
        const ms = Date.now() - start;
        if (!done) resolve({ online: true, responseTime: ms });
        done = true;
        socket.close();
      });

      setTimeout(() => {
        if (!done) {
          resolve({ online: false, responseTime: null });
          done = true;
          socket.close();
        }
      }, timeout);
    } else {
      const socket = new net.Socket();
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
    }
  });
}

// ====== systemd uptime helper (if the service is managed by systemctl) ======
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

// ====== Minecraft ping (TCP status) ======
function writeVarInt(value) {
  let num = value;
  if (num < 0) {
    num = 0xffffffff + num + 1;
  }

  const bytes = [];
  do {
    let temp = num & 0x7f;
    num >>>= 7;
    if (num !== 0) {
      temp |= 0x80;
    }
    bytes.push(temp);
  } while (num !== 0);

  return Buffer.from(bytes);
}

function readVarInt(buffer, offset = 0) {
  let num = 0;
  let shift = 0;
  let bytesRead = 0;

  while (true) {
    if (offset + bytesRead >= buffer.length) {
      return null;
    }
    const byte = buffer[offset + bytesRead];
    num |= (byte & 0x7f) << shift;
    bytesRead += 1;

    if ((byte & 0x80) === 0) {
      break;
    }

    shift += 7;
    if (shift > 35) {
      throw new Error("VarInt too big");
    }
  }

  return { value: num, size: bytesRead };
}

function queryMinecraftStatus(host, port, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let resolved = false;
    let buffer = Buffer.alloc(0);

    const cleanup = (err, data) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    };

    socket.setTimeout(timeout, () => cleanup(new Error("timeout")));
    socket.once("error", (err) => cleanup(err));

    socket.on("connect", () => {
      try {
        const hostBuf = Buffer.from(host, "utf8");
        const handshakeData = Buffer.concat([
          writeVarInt(0x00),
          writeVarInt(-1),
          writeVarInt(hostBuf.length),
          hostBuf,
          Buffer.from([(port >> 8) & 0xff, port & 0xff]),
          writeVarInt(0x01),
        ]);

        const handshake = Buffer.concat([
          writeVarInt(handshakeData.length),
          handshakeData,
        ]);

        const request = Buffer.concat([
          writeVarInt(0x01),
          writeVarInt(0x00),
        ]);

        socket.write(handshake);
        socket.write(request);
      } catch (err) {
        cleanup(err);
      }
    });

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      try {
        const lengthData = readVarInt(buffer, 0);
        if (!lengthData) return;
        const totalLength = lengthData.value;
        if (buffer.length < totalLength + lengthData.size) return;

        const idData = readVarInt(buffer, lengthData.size);
        if (!idData) return;

        const jsonLengthData = readVarInt(
          buffer,
          lengthData.size + idData.size
        );
        if (!jsonLengthData) return;

        const jsonStart =
          lengthData.size + idData.size + jsonLengthData.size;
        const jsonEnd = jsonStart + jsonLengthData.value;
        if (buffer.length < jsonEnd) return;

        const jsonString = buffer.toString("utf8", jsonStart, jsonEnd);
        const status = JSON.parse(jsonString);
        cleanup(null, status);
      } catch (err) {
        cleanup(err);
      }
    });
  });
}

// ====== Factorio (Source query protocol) ======
function querySourceServer(host, port, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    let resolved = false;

    const cleanup = (err, data) => {
      if (resolved) return;
      resolved = true;
      socket.close();
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    };

    const baseHeader = Buffer.from([0xff, 0xff, 0xff, 0xff, 0x54]);
    const baseQuery = Buffer.from("Source Engine Query\0", "ascii");

    const sendQuery = (challenge) => {
      const payload = challenge
        ? Buffer.concat([baseHeader, baseQuery, challenge])
        : Buffer.concat([baseHeader, baseQuery]);
      socket.send(payload, port, host, (err) => {
        if (err) cleanup(err);
      });
    };

    socket.on("message", (msg) => {
      if (resolved) return;
      if (msg.length < 5) {
        cleanup(new Error("Invalid response"));
        return;
      }

      const type = msg[4];
      if (type === 0x41) {
        const challenge = msg.slice(5);
        sendQuery(challenge);
        return;
      }

      if (type !== 0x49) {
        cleanup(new Error("Unexpected response"));
        return;
      }

      let offset = 5;
      offset += 1; // protocol byte

      const readString = () => {
        let end = offset;
        while (end < msg.length && msg[end] !== 0) end += 1;
        const str = msg.toString("utf8", offset, end);
        offset = end + 1;
        return str;
      };

      const name = readString();
      readString(); // map
      readString(); // folder
      readString(); // game

      if (offset + 2 > msg.length) {
        cleanup(new Error("Invalid payload"));
        return;
      }
      offset += 2; // appId

      if (offset + 3 > msg.length) {
        cleanup(new Error("Invalid payload"));
        return;
      }

      const players = msg.readUInt8(offset);
      const maxPlayers = msg.readUInt8(offset + 1);
      const bots = msg.readUInt8(offset + 2);

      cleanup(null, { name, players, maxPlayers, bots });
    });

    socket.once("error", (err) => cleanup(err));
    socket.setTimeout(timeout, () => cleanup(new Error("timeout")));

    sendQuery();
  });
}

function queryFactorioPlayers(rconConfig, timeout = 2000) {
  if (!rconConfig || !rconConfig.password) {
    return Promise.reject(new Error("Factorio RCON is not configured"));
  }

  if (!fs.existsSync(FACTORIO_RCON_SCRIPT)) {
    return Promise.reject(new Error("Factorio RCON helper script is missing"));
  }

  return new Promise((resolve, reject) => {
    const start = Date.now();
    const args = [
      FACTORIO_RCON_SCRIPT,
      rconConfig.host,
      String(rconConfig.port),
    ];

    const child = spawn("python3", args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        FACTORIO_RCON_PASSWORD: rconConfig.password,
      },
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill("SIGKILL");
      reject(new Error("Factorio RCON timeout"));
    }, timeout);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.once("error", (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(err);
    });

    child.once("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);

      if (code !== 0) {
        reject(new Error(stderr.trim() || "Factorio RCON exited with error"));
        return;
      }

      const trimmed = stdout.trim();
      const count = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(count) || count < 0) {
        reject(new Error(`Unexpected Factorio RCON output: ${trimmed}`));
        return;
      }

      resolve({
        players: count,
        responseTime: Date.now() - start,
      });
    });
  });
}

// ====== API: system status ======
app.get("/api/status", async (req, res) => {
  try {
    const [cpuLoad, mem, temp, baseboard, disks] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.cpuTemperature(),
      si.baseboard(),
      si.fsSize(),
    ]);

    const uptime = formatUptime(os.uptime());
    const totalDisk = disks.reduce((a, d) => a + d.size, 0);
    const usedDisk = disks.reduce((a, d) => a + d.used, 0);

    const services = [
      { name: "GymBot", port: 30081, protocol: "tcp", systemd: "gym-bot", host: HOST },
      {
        name: "Factorio",
        port: 34197,
        protocol: "udp",
        systemd: "factorio-server",
        host: HOST,
        queryType: "factorio",
        rcon: {
          host: FACTORIO_RCON_HOST,
          port: FACTORIO_RCON_PORT,
          password: FACTORIO_RCON_PASSWORD,
        },
      },
      {
        name: "Minecraft",
        port: 25565,
        protocol: "tcp",
        systemd: "minecraft-server",
        host: HOST,
        queryType: "minecraft",
      },
    ];

    const cpuInfo = os.cpus();
    const primaryCpu = cpuInfo[0] || {};
    const hardware = {
      cpu: {
        model: primaryCpu.model || "Unknown CPU",
        cores: cpuInfo.length,
      },
      memory: {
        totalGB: Number((mem.total / 1e9).toFixed(1)),
      },
      motherboard: baseboard.model || baseboard.manufacturer || "Unknown board",
      disks: disks.map((disk) => ({
        id: disk.fs || disk.mount || disk.name || "disk",
        sizeGB: Number((disk.size / 1e9).toFixed(1)),
        usedGB: Number((disk.used / 1e9).toFixed(1)),
      })),
    };

    const checks = await Promise.all(
      services.map(async (service) => {
        const { rcon, ...serviceInfo } = service;
        let players = null;
        let netInfo = { online: false, responseTime: null };
        const supportsPlayers = ["minecraft", "factorio"].includes(
          serviceInfo.queryType
        );

        if (serviceInfo.queryType === "minecraft") {
          try {
            const start = Date.now();
            const status = await queryMinecraftStatus(
              serviceInfo.host,
              serviceInfo.port,
              2000
            );
            const responseTime = Date.now() - start;
            netInfo = { online: true, responseTime };
            players = {
              current: status.players?.online ?? 0,
              max: status.players?.max ?? 0,
              list:
                status.players?.sample?.map((p) => p.name).filter(Boolean) ?? [],
            };
          } catch {
            netInfo = await checkPort(
              serviceInfo.port,
              serviceInfo.host,
              1000,
              serviceInfo.protocol
            );
          }
        } else if (serviceInfo.queryType === "factorio") {
          let rconPlayers = null;
          if (rcon?.password) {
            try {
              rconPlayers = await queryFactorioPlayers(rcon, 2000);
            } catch (err) {
              console.warn("Factorio RCON query failed:", err.message);
            }
          }

          if (rconPlayers) {
            netInfo = await checkPort(
              serviceInfo.port,
              serviceInfo.host,
              1000,
              serviceInfo.protocol
            );
            players = {
              current: rconPlayers.players,
              max: null,
              list: [],
            };
          } else {
            netInfo = await checkPort(
              serviceInfo.port,
              serviceInfo.host,
              1000,
              serviceInfo.protocol
            );
          }
        } else {
          netInfo = await checkPort(
            serviceInfo.port,
            serviceInfo.host,
            1000,
            serviceInfo.protocol
          );
        }

        const uptime = getServiceUptime(serviceInfo.systemd);
        return { ...serviceInfo, ...netInfo, uptime, players, supportsPlayers };
      })
    );

    res.json({
      system: {
        uptime,
      },
      metrics: {
        cpu: cpuLoad.currentLoad.toFixed(1),
        mem: ((mem.active / mem.total) * 100).toFixed(1),
        temp: temp.main?.toFixed(1) || "0.0",
        disk: ((usedDisk / totalDisk) * 100).toFixed(1),
      },
      services: checks,
      hardware,
    });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "failed to fetch metrics" });
  }
});

// ====== SPA fallback ======
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ====== Boot ======
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
