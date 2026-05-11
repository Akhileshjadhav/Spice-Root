import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(rootDir, "client");
const eslintBin = path.join(clientDir, "node_modules", "eslint", "bin", "eslint.js");

const child = spawn(process.execPath, [eslintBin, "."], {
  cwd: clientDir,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
