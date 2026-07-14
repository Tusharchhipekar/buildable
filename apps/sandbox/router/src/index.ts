import { config } from "./config/config";
import express from "express";
import {
  createProxyMiddleware,
  type RequestHandler,
} from "http-proxy-middleware";

import morgan from "morgan";

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
  }

  if (!sandboxId) {
    return res
      .status(400)
      .json({ error: "Unable to resolve sandboxId from host" });
  }

  return getProxy(sandboxId)(req, res, next);
});

app.listen(config.ROUTER_PORT, () => {
  console.log(
    `sandbox router server is running at http://localhost:${config.ROUTER_PORT}`,
  );
});
