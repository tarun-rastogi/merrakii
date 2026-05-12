#!/usr/bin/env node
/**
 * Used as @dam/web prestart: fail fast with a clear message if the web port is
 * already taken (common cause of "Internal Server Error" in the browser when
 * a zombie `next-server` is still bound to 3001).
 */
import net from "node:net";

const port = Number(process.env.PORT || 3002);

await new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once("error", (err) => {
    if (err && "code" in err && err.code === "EADDRINUSE") {
      console.error(
        `\n[@dam/web] Port ${port} is already in use.\n\n` +
          `From the repo root, free dev/prod ports and restart:\n` +
          `  npm run ports:free\n` +
          `  npm run build -w @dam/web && npm run start -w @dam/web\n\n` +
          `If the site shows HTTP 500 after that, reset the Next cache and rebuild:\n` +
          `  npm run fix:web\n\n` +
          `Or use dev mode (also frees ports if you run the full restart script):\n` +
          `  npm run dev:restart\n`,
      );
      process.exit(1);
    }
    reject(err);
  });
  server.listen(port, "0.0.0.0", () => {
    server.close(() => resolve());
  });
});
