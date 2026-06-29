/**
 * Local-dev-only stand-in for the Azure Static Web Apps API.
 *
 * `astro dev` serves the frontend through Vite; Azure SWA serves /api/*
 * through a paired Azure Functions app (see /api). Locally we don't want
 * to require the Azure Functions Core Tools + SWA CLI just to click
 * through the password gate, so this Vite plugin intercepts the same two
 * routes and calls the identical core logic in src/server/*.
 *
 * This file is never built into the static site — Astro's build step
 * only emits src/pages, src/components, etc. into dist/; Vite plugins
 * configured here run only inside the dev server process.
 */
import type { Plugin, Connect } from "vite";
import { handleUnlock } from "../src/server/unlock";
import { handleProtectedImage } from "../src/server/protectedImage";

function readJsonBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export function devApiMiddleware(): Plugin {
  return {
    name: "dev-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";

        if (req.method === "POST" && url === "/api/unlock") {
          try {
            const body = await readJsonBody(req);
            const result = handleUnlock(body as Record<string, unknown>);
            res.statusCode = result.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result.body));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: "Couldn't read that request." }));
          }
          return;
        }

        const imageMatch = url.match(/^\/api\/protected-image\/([^/?]+)\/([^/?]+)(?:\?(.*))?$/);
        if (req.method === "GET" && imageMatch) {
          const [, projectId, assetId, query] = imageMatch;
          const token = new URLSearchParams(query ?? "").get("token");
          const result = await handleProtectedImage(
            decodeURIComponent(projectId),
            decodeURIComponent(assetId),
            token,
          );
          res.statusCode = result.status;
          res.setHeader("Content-Type", result.contentType);
          res.setHeader("Cache-Control", "no-store");
          res.end(result.body);
          return;
        }

        next();
      });
    },
  };
}
