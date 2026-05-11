import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(rootDir, "client");
const viteBin = path.join(clientDir, "node_modules", "vite", "bin", "vite.js");

const child = spawn(process.execPath, [viteBin, "build", "--configLoader", "native", "--emptyOutDir", "false"], {
  cwd: clientDir,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
