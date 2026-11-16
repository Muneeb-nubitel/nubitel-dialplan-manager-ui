import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  const env = {};
  for (const line of readFileSync(fullPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function runScript(filterPackage, script, env) {
  const result = spawnSync(
    "corepack",
    ["pnpm@10.32.0", "--filter", filterPackage, "run", script],
    { cwd: rootDir, shell: true, env, stdio: "inherit" },
  );
  if (result.status !== 0) {
    console.error(`${filterPackage} '${script}' failed with code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

function startService(name, filterPackage, envFile, setupScripts, runScriptName) {
  const env = { ...process.env, NODE_ENV: "development", ...loadEnvFile(envFile) };

  for (const script of setupScripts) runScript(filterPackage, script, env);

  const child = spawn(
    `corepack pnpm@10.32.0 --filter ${filterPackage} run ${runScriptName}`,
    { cwd: rootDir, shell: true, env, stdio: ["ignore", "pipe", "pipe"] },
  );

  const prefix = `[${name}] `;
  const pipe = (stream, out) => {
    stream.on("data", (chunk) => {
      for (const line of chunk.toString().split("\n")) {
        if (line.trim().length > 0) out.write(prefix + line + "\n");
      }
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);

  child.on("exit", (code) => {
    console.log(`${prefix}exited with code ${code}`);
  });

  return child;
}

const children = [
  startService(
    "api-server",
    "@workspace/api-server",
    "artifacts/api-server/.env",
    ["build"],
    "start",
  ),
  startService(
    "ui",
    "@workspace/nubitel-call-center",
    "artifacts/nubitel-call-center/.env",
    [],
    "dev",
  ),
];

function shutdown() {
  for (const child of children) child.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
