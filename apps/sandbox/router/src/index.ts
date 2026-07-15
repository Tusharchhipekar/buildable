import { config } from "./config/config";
import express from "express";
import {
  createProxyMiddleware,
  type RequestHandler,
} from "http-proxy-middleware";
import http from "http";
import morgan from "morgan";
import type { Socket } from "net";

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
      ws: true,
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
      ws: true,
    });
  }
  return agentProxies[sandboxId];
}

app.use((req, res, next) => {
  const host: string | undefined = req.headers.host;
  // Extract sandboxId from subdomain
  // Eg : https://regex.localhost:3000 -> sandboxId = regex
  const sandboxId: string | undefined = host?.split(".")[0];

  /**
   * pod1.preview.localhost -> template
   * pod1.agent.localhost -> agent
   **/

  if (host?.split(".")[1] == "agent") {
    return getAgentProxy(sandboxId!)(req, res, next);
  } else if (host?.split(".")[1] == "preview") {
    return getProxy(sandboxId!)(req, res, next);
  } else {
    next();
  }

  if (!sandboxId) {
    return res
      .status(400)
      .json({ error: "Unable to resolve sandboxId from host" });
  }
});

export const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  const host = req.headers.host;
  const sandboxId = host?.split(".")[0];
  const type = host?.split(".")[1];

  console.log(
    `WS upgrade request: ${host}, sandboxId: ${sandboxId}, type: ${type}`,
  );

  if (type === "agent") {
    const proxy = getAgentProxy(sandboxId!);
    proxy.upgrade(req, socket as Socket, head);
  } else if (type === "preview") {
    const proxy = getProxy(sandboxId!);
    proxy.upgrade(req, socket as Socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(config.ROUTER_PORT, () => {
  console.log(
    `sandbox router server is running at http://localhost:${config.ROUTER_PORT}`,
  );
});
