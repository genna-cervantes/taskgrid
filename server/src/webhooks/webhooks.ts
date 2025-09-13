import { createNodeMiddleware, Webhooks } from "@octokit/webhooks";
import dotenv from "dotenv";
import { pool } from "../db/db.js";
import { tryCatch } from "../lib/utils.js";
import { insertTriageTask } from "../db/queries/triage.js";
import { addInstallation, getProjectIdFromInstallationId, getProjectIdFromRepositoryId } from "../db/queries/github.js";

dotenv.config();

export const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
});

export const webhookMiddleware = createNodeMiddleware(webhooks, { path: "/webhooks/github" });

// Listen for installation events
webhooks.on("installation.created", async ({ payload }) => {

  // find intialized installation
  const result = await tryCatch(getProjectIdFromInstallationId(pool, payload.installation.id))
  if (result.error != null) {
    console.error(result.error)
    return
  }
  const connectedProjectIds = result.data;

  let successInstallations = 0;
  for (let i = 0; i < connectedProjectIds.length; i++) {
    const cpi = connectedProjectIds[i];
    const installationToInsert = {
      installation_id: payload.installation.id,
      project_id: cpi,
      account_type: payload.sender.type as "User" | "Organization",
      account_login: payload.sender.login,
      repository_ids: {repositoryIds: payload.repositories?.map((repository: any) => repository.id) ?? []},
      access_token_url: payload.installation.access_tokens_url,
      installed_at: new Date(payload.installation.created_at)
    }
  
    const result = await tryCatch(addInstallation(pool, installationToInsert))
    if (result.error != null) {
      console.error(result.error)
      continue
    }
    successInstallations++;
  };
  
  if (successInstallations === connectedProjectIds.length) {
    console.log("🎉 GitHub App installed!");
  }
});

webhooks.on("issues.opened", async ({ payload }) => {
  const issue = payload.issue;

  // get project id of connected repository
  const result = await tryCatch(getProjectIdFromRepositoryId(pool, payload.repository.id))
  if (result.error != null) {
    console.error(result.error)
    return
  }
  if (result.data.length === 0) {
    console.error("No project id found for repository")
    return
  }

  const projectIds = result.data;

  for (let i = 0; i < projectIds.length; i++) {
    const projectId = projectIds[i];

    const issueToInsert = {
      title: issue.title,
      description: issue.body ?? '',
      priority: "low" as const,
      assignTo: issue.assignees.map((assignee: any) => assignee.login),
      category: issue.labels?.[0]?.name ?? undefined,
    }
    const result = await tryCatch(insertTriageTask(pool, issueToInsert, projectId))
    if (result.error != null) {
      console.error(result.error)
      continue
    }
    
  }
  console.log("🔴 GitHub App issue opened!");
});


// Handle webhook errors
webhooks.onError((error) => {
  console.error("GitHub webhook error:", error);
});
