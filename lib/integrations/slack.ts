import type { SlackDigestItem, Tier } from "@/lib/core/types";

export interface SlackClient {
  sendDigest(items: SlackDigestItem[]): Promise<void>;
  sendBreakoutAlert(item: SlackDigestItem): Promise<void>;
}

export function buildDigestBlocks(items: SlackDigestItem[]): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Deal Flow Digest",
      },
    },
    { type: "divider" },
  ];

  for (const item of items) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<${item.dashboardUrl}|${item.companyName}>* — Score: ${item.score} | Tier: \`${item.tier}\`\n${item.rationale}`,
      },
    });
  }

  return blocks;
}

export function buildBreakoutBlocks(item: SlackDigestItem): Record<string, unknown>[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Breakout Alert",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<${item.dashboardUrl}|${item.companyName}>* just crossed into \`hot\`!\nScore: ${item.score}\n${item.rationale}`,
      },
    },
  ];
}

export class MockSlackClient implements SlackClient {
  async sendDigest(items: SlackDigestItem[]): Promise<void> {
    const payload = buildDigestBlocks(items);
    console.info("[Slack:Mock] Digest payload:", JSON.stringify(payload, null, 2));
  }

  async sendBreakoutAlert(item: SlackDigestItem): Promise<void> {
    const payload = buildBreakoutBlocks(item);
    console.info("[Slack:Mock] Breakout alert:", JSON.stringify(payload, null, 2));
  }
}

export function createSlackClient(): SlackClient {
  if (!process.env.SLACK_BOT_TOKEN) {
    console.warn("[Slack] No SLACK_BOT_TOKEN — using MockSlackClient (payloads logged to console)");
    return new MockSlackClient();
  }
  // TODO: implement real Slack client using @slack/web-api
  return new MockSlackClient();
}
