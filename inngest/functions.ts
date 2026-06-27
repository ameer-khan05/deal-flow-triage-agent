import { inngest } from "./client";

/**
 * Pipeline orchestration — collect -> enrich -> score -> notify
 *
 * TODO: Implement as durable Inngest steps:
 * 1. collect: fan out to all enabled collectors, each as a step with retries
 * 2. enrich: entity resolution + profile building
 * 3. score: feature scoring + LLM triage
 * 4. notify: Slack digest + CRM sync
 *
 * A failing collector should NOT fail the whole run (other steps proceed).
 */
const pipelineRun = inngest.createFunction(
  {
    id: "pipeline-run",
    name: "Deal Flow Pipeline",
  },
  { cron: "0 6 * * *" }, // daily at 6am UTC — configurable
  async ({ step }) => {
    // Step 1: Collect
    await step.run("collect", async () => {
      // TODO: run all collectors
      return { collected: 0 };
    });

    // Step 2: Enrich
    await step.run("enrich", async () => {
      // TODO: entity resolution + profile building
      return { enriched: 0 };
    });

    // Step 3: Score
    await step.run("score", async () => {
      // TODO: feature scoring + LLM triage
      return { scored: 0 };
    });

    // Step 4: Notify
    await step.run("notify", async () => {
      // TODO: Slack digest + CRM sync
      return { notified: 0 };
    });

    return { status: "complete" };
  }
);

export const functions = [pipelineRun];
