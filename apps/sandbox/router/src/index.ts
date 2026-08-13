import { config } from "./config/config";
import express from "express";
import {
  createProxyMiddleware,
  type RequestHandler,
} from "http-proxy-middleware";
import http from "http";
import morgan from "morgan";
import type { Socket } from "net";
import { createProxyServer } from "httpxy";
import { isAuthorizedForAgent } from "./auth";

export const app = express();
app.use(morgan("combined"));

app.get("/api/status/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
  });
});

app.get("/api/status/ready", (req, res) => {
  return res.status(200).json({
    status: "ok",
  });
});

const proxies: Record<string, RequestHandler> = {};
const agentProxies: Record<string, RequestHandler> = {};

function getProxy(sandboxId: string): RequestHandler {
  // construct target url based on sandboxId
  const target = `http://sandbox-service-${sandboxId}`;

  if (!proxies[sandboxId]) {
    proxies[sandboxId] = createProxyMiddleware({
      target,
      changeOrigin: true,
    });
  }
  return proxies[sandboxId];
}

function getAgentProxy(sandboxId: string): RequestHandler {
  // construct target url based on sandboxId
  const target = `http://sandbox-service-${sandboxId}:3000`;

  if (!agentProxies[sandboxId]) {
    agentProxies[sandboxId] = createProxyMiddleware({
      target,
      changeOrigin: true,
    });
  }
  return agentProxies[sandboxId];
}

// Single httpxy proxy server for all WebSocket upgrades
const wsProxy = createProxyServer({ changeOrigin: true });
wsProxy.on("error", (err, req, socket) => {
  console.error("WS proxy error:", err.message);
  socket?.destroy();
});

app.use(async (req, res, next) => {
  const host: string | undefined = req.headers.host;
  // Extract sandboxId from subdomain
  // Eg : https://regex.localhost:3000 -> sandboxId = regex
  const sandboxId: string | undefined = host?.split(".")[0];
  const type = host?.split(".")[1];

  /**
   * pod1.preview.localhost -> template
   * pod1.agent.localhost -> agent
   **/

  if (!sandboxId || !type) {
    return next();
  }

  if (type === "agent") {
    // .agent exposes file read/write and a shell into the sandbox pod —
    // only the project owner (verified via JWT + the userId recorded on
    // the sandbox at creation time) may reach it.
    if (!(await isAuthorizedForAgent(req, sandboxId))) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return getAgentProxy(sandboxId)(req, res, next);
  }

  if (type === "preview") {
    return getProxy(sandboxId)(req, res, next);
  }

  next();
});

export const server = http.createServer(app);

server.on("upgrade", async (req, socket, head) => {
  const host = req.headers.host;

  if (!host) {
    socket.destroy();
    return;
  }

  // Prevent EPIPE and connection-reset errors from crashing the process
  // during the active piped session (after ws() Promise has resolved)
  socket.on("error", () => socket.destroy());

  const sandboxId = host?.split(".")[0];
  const type = host?.split(".")[1];

  console.log(
    `WS upgrade request: ${host}, sandboxId: ${sandboxId}, type: ${type}`,
  );

  if (type === "agent") {
    if (!sandboxId || !(await isAuthorizedForAgent(req, sandboxId))) {
      socket.destroy();
      return;
    }
    wsProxy
      .ws(
        req,
        socket as Socket,
        { target: `http://sandbox-service-${sandboxId}:3000` },
        head,
      )
      .catch(() => socket.destroy());
  } else if (type === "preview") {
    // const proxy = getProxy(sandboxId!);
    //proxy.upgrade(req, socket as Socket, head);
    wsProxy
      .ws(
        req,
        socket as Socket,
        { target: `http://sandbox-service-${sandboxId}` },
        head,
      )
      .catch(() => socket.destroy());
  } else {
    socket.destroy();
  }
});

server.listen(config.ROUTER_PORT, () => {
  console.log(
    `sandbox router server is running at http://localhost:${config.ROUTER_PORT}`,
  );
});
