import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
const port = process.argv[2];
const stage = process.env.FLUID_CAPTURE_STAGE ?? "current";
if (!/^[a-z0-9-]+$/.test(stage)) throw new Error("Identificador de captura inválido.");

if (!port || !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error("Informe uma porta local válida para o servidor Playwright.");
}

// Public variables are embedded during compilation: isolate both build and runtime.
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  SUPABASE_SECRET_KEY: "",
  NEXT_PUBLIC_PWA_TEST: "true",
  NEXT_TELEMETRY_DISABLED: "1",
  VERCEL: "",
  VERCEL_ENV: "development"
};

let child;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child?.kill(signal));
}

async function recordProductionAssets(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await recordProductionAssets(file)));
    else if (/\.(css|js)$/.test(entry.name)) {
      const content = await readFile(file);
      files.push({
        file: relative(process.cwd(), file).replaceAll("\\", "/"),
        bytes: content.length,
        gzipBytes: gzipSync(content).length
      });
    }
  }
  return files;
}

function run(args) {
  return new Promise((resolve, reject) => {
    // Direct Node invocation avoids nested shell quoting on Windows.
    child = spawn(process.execPath, [nextCli, ...args], { env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      child = undefined;
      if (code === 0) resolve();
      else reject(new Error(`Next ${args[0]} terminou: ${signal ?? code}.`));
    });
  });
}

try {
  if (!process.argv.includes("--dev-only")) {
    console.log("[E2E] A compilar a aplicação isolada antes de iniciar os testes.");
    await run(["build"]);
    const files = await recordProductionAssets(join(process.cwd(), ".next", "static"));
    const totals = ["css", "js"].map((type) => {
      const assets = files.filter((file) => file.file.endsWith(`.${type}`));
      return {
        type,
        files: assets.length,
        bytes: assets.reduce((sum, file) => sum + file.bytes, 0),
        gzipBytes: assets.reduce((sum, file) => sum + file.gzipBytes, 0)
      };
    });
    const output = join("playwright-report", "fluid-evidence", stage);
    await mkdir(output, { recursive: true });
    await writeFile(
      join(output, "bundle-metrics.json"),
      JSON.stringify(
        {
          scope: "All emitted CSS/JS assets; gzip estimate, not per-page transfer sizes.",
          totals,
          files
        },
        null,
        2
      )
    );
    console.log(`[E2E assets] ${JSON.stringify(totals)}`);
    console.log("[E2E] Build de produção concluído.");
  }
  console.log("[E2E] A iniciar o servidor dos demonstradores locais.");
  await run(["dev", "--turbopack", "--hostname", "127.0.0.1", "--port", port]);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
