import { Router, type Request, type Response } from "express";
import { AIMessage } from "@langchain/core/messages";
import { agent } from "../agent/code.agent";
import { callWithRateLimit } from "../agent/rateLimiter";

const agentRouter = Router();

agentRouter.post("/invoke", async (req: Request, res: Response) => {
  const { message, projectId } = req.body;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  async function runAgentStream() {
    const stream = await agent.stream(
      { messages: [{ role: "user", content: message }] },
      { context: { projectId }, streamMode: "values" },
    );

    let lastState = null;
    for await (const state of stream) {
      lastState = state;
    }
    return lastState;
  }

  try {
    const lastState = await callWithRateLimit(runAgentStream);

    if (lastState?.messages?.length) {
      const msgs = lastState.messages;
      for (let i = msgs.length - 1; i >= 0; i--) {
        const m = msgs[i];
        if (
          m instanceof AIMessage &&
          m.getType() === "ai" &&
          !m.tool_calls?.length
        ) {
          const content =
            typeof m.content === "string"
              ? m.content
              : JSON.stringify(m.content);
          res.write(content + "\n");
          break;
        }
      }
    }

    res.end();
  } catch (error) {
    console.error("Error invoking agent:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (res.headersSent) {
      res.write(`Error: ${message}\n`);
      res.end();
    } else {
      res.status(500).json({ error: "Failed to invoke agent" });
    }
  }
});

export default agentRouter;
