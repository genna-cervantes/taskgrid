// server/src/server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../trpc/router.js";
import { createContext } from "../trpc/trpc.js";
import { auth } from "../lib/auth.js";
import { toNodeHandler } from "better-auth/node";
import { chatRouter } from "../trpc/routers/chat.js";
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupWebSocket } from "../websocket/handlers.js";
import { bus } from "../websocket/bus.js";
import { getUserMiddleware } from "../lib/middleware.js";
import { getInstallationDetails } from "../integrations/github.js";
import { tryCatch } from "../lib/utils.js";
import { webhookMiddleware, webhooks } from "../webhooks/webhooks.js";
import { aiWorkflowsRouter } from "../ai/router.js";
import { initializeGithubInstallation } from "../db/queries/github.js";
import { pool } from "../db/db.js";

dotenv.config();

const app = express();

// rest api
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://taskan.cloud",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, 
    allowedHeaders: ["Content-Type", "Authorization", "x-trpc-source"],
  })
);

app.all("/api/auth/*", toNodeHandler(auth));

// webhooks - needs to be BEFORE body parsing middleware that would consume the raw body
app.use(webhookMiddleware);

// Parse JSON and URL-encoded bodies AFTER webhook routes
app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// callbacks
app.get("/github/callback", async (req, res) => {
  console.log('CALLBACK CALLED')

  let state = req.query.state;
  if (Array.isArray(state)) {
    state = state[0];
  }

  if (typeof state === 'string') {
    const s = decodeURIComponent(state);
    state = (s.startsWith('{') || s.startsWith('[')) ? JSON.parse(s) : s;
  }
  
  const projectId = (state as any).projectId as string;
  if (!projectId) {
    console.error("Project ID not found in callback")
    return res.redirect('/login?error=missing_project_id');
  }

  const username = (state as any).username as string;
  if (!username) {
    console.error("Username not found in callback")
    return res.redirect('/login?error=missing_username');
  }

  const installationId = req.query.installation_id as string;
  if (!installationId) {
    console.error("Installation ID not found in callback")
    return res.redirect('/login?error=missing_installation_id');
  }

  const result = await tryCatch(initializeGithubInstallation(pool, installationId, projectId, username))
  if (result.error != null) {
    console.error("Failed to store github installation")
    console.error(result.error)
    return res.redirect('/login?error=github_installation_failed');
  }

  // get workspaces and project to return to the og
  return res.redirect('http://localhost:5173/');
});

// set headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// health
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// needs auth
app.use("/ai-chat", chatRouter)

// ai workflows
app.use("/ai-workflows", aiWorkflowsRouter)

// websocket
const httpServer = createServer(app)
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  },
  transports: ['websocket', 'polling']
});

setupWebSocket(io);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
