// server/src/server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../trpc/router.js";
import { createContext } from "../trpc/trpc.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/trpc", 
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});