import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(rootDir, "client");
const serverDir = path.join(rootDir, "server");
const viteBin = path.join(clientDir, "node_modules", "vite", "bin", "vite.js");

function start(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });

  return child;
}

const server = start("server", process.execPath, ["--watch", "index.js"], serverDir);
const client = start("client", process.execPath, [viteBin, "--host", "0.0.0.0", "--configLoader", "native"], clientDir);

function shutdown() {
  server.kill();
  client.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
