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

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://taskan.cloud",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST", "PUT"],
    credentials: true, 
  })
);

app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json({ limit: "10mb" })); // ⬅️ increase from default 100kb
app.use(express.urlencoded({ limit: "10mb", extended: true }));

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

app.use("/ai-chat", chatRouter)

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
