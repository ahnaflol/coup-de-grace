import { spawn } from "child_process";
import { createConnection } from "net";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export function isPortInUse(port: number): Promise<boolean> {
  return new Promise((res) => {
    const socket = createConnection({ host: "127.0.0.1", port });

    socket.setTimeout(2000, () => {
      socket.destroy();
      res(false);
    });

    socket.on("connect", () => {
      socket.destroy();
      res(true);
    });

    socket.on("error", () => {
      socket.destroy();
      res(false);
    });
  });
}

export async function ensureDevServer(port: number): Promise<void> {
  const alreadyRunning = await isPortInUse(port);
  if (alreadyRunning) {
    console.log(`  Dev server already running on port ${port}`);
    return;
  }

  console.log(`  Starting dev server on port ${port}...`);

  const currentDir =
    typeof import.meta.dirname === "string"
      ? import.meta.dirname
      : dirname(fileURLToPath(import.meta.url));
  const coreDir = resolve(currentDir, "../..");

  const child = spawn("bun", ["dev"], {
    cwd: coreDir,
    detached: true,
    stdio: "ignore",
    env: { ...process.env, PORT: String(port) },
  });

  child.unref();

  const timeoutMs = 30_000;
  const intervalMs = 500;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const ready = await isPortInUse(port);
    if (ready) {
      console.log(`  Dev server is ready on port ${port}`);
      return;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(
    `Dev server failed to start within ${timeoutMs / 1000} seconds`,
  );
}
