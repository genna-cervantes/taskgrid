import { createNodeMiddleware, Webhooks } from "@octokit/webhooks";
import dotenv from "dotenv";

dotenv.config();

export const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
});

export const webhookMiddleware = createNodeMiddleware(webhooks, { path: "/webhooks/github" });

// Listen for installation events
webhooks.on("installation.created", async ({ payload }) => {
  const installationId = payload.installation.id;
  const accountLogin = payload.installation.account;

  console.log("🎉 GitHub App installed!");
  console.log("Installation ID:", installationId);
  console.log("Account:", accountLogin);
});


// Handle webhook errors
webhooks.onError((error) => {
  console.error("GitHub webhook error:", error);
});
