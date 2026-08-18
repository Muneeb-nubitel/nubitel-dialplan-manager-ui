import { Router, type IRouter } from "express";
import { getRedisClient } from "../lib/redis";
import { getQueueMemberStats } from "../lib/queue-stats";

const router: IRouter = Router();
const domainPattern = /^[a-z0-9.-]+$/i;

type RedisQueue = Record<string, unknown>;

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

router.get("/campaigns", async (req, res) => {
  const domain = String(req.query["domain_name"] ?? "").trim();
  if (!domain || !domainPattern.test(domain)) {
    res.status(400).json({ message: "A valid domain_name is required" });
    return;
  }

  try {
    const redis = await getRedisClient();
    const records = await redis.hGetAll(`DIALPLAN_BACKEND:queues:${domain}`);
    const campaigns = Object.entries(records).map(([extension, json]) => {
      let queue: RedisQueue = {};
      try {
        queue = JSON.parse(json) as RedisQueue;
      } catch {
        // Keep the extension visible even when an individual value is malformed.
      }

      const campaignId = String(queue["campaign_id"] ?? queue["campaignId"] ?? queue["uuid"] ?? queue["call_center_queue_uuid"] ?? extension);
      return {
        extension,
        campaignId,
        name: String(queue["name"] ?? `Campaign ${extension}`),
        uuid: String(queue["uuid"] ?? queue["call_center_queue_uuid"] ?? extension),
        domain_name: domain,
        strategy: String(queue["strategy"] ?? "unknown"),
        record: Boolean(queue["record"]),
        waiting: numberValue(queue["waiting"]),
        trying: numberValue(queue["trying"]),
        receiving: numberValue(queue["receiving"]),
        answered: numberValue(queue["answered"]),
        inQueue: numberValue(queue["inQueue"] ?? queue["in_queue"]),
        tierCount: numberValue(queue["tierCount"] ?? queue["tier_count"]),
        status: String(queue["status"] ?? "configured"),
      };
    });

    try {
      // Dialplan identifies a live queue by its Redis key identifier,
      // `extension@domain`, not by the campaign UUID stored on the queue.
      const stats = await getQueueMemberStats(
        domain,
        campaigns.map((campaign) => `${campaign.extension}@${domain}`),
      );
      for (const campaign of campaigns) {
        campaign.waiting = 0;
        campaign.trying = 0;
        campaign.receiving = 0;
        campaign.answered = 0;
        campaign.inQueue = 0;
      }
      const byCampaign = new Map(
        campaigns.flatMap((campaign) => [
          [`${campaign.extension}@${domain}`, campaign] as const,
          [campaign.extension, campaign] as const,
          [campaign.campaignId, campaign] as const,
        ]),
      );
      const answeredByCampaign = new Map<(typeof campaigns)[number], number>();
      for (const record of stats) {
        const campaign = byCampaign.get(
          String(record.queue ?? record.queue_extension ?? record.campaign_id ?? ""),
        );
        if (!campaign) continue;
        const state = String(record.state ?? "").trim().toLowerCase();
        if (state === "waiting") campaign.waiting += 1;
        if (state === "trying") campaign.trying += 1;
        if (state === "receiving") campaign.receiving += 1;
        if (state === "in a queue call" || state === "answered") {
          answeredByCampaign.set(
            campaign,
            (answeredByCampaign.get(campaign) ?? 0) + 1,
          );
        }
      }
      for (const campaign of campaigns) {
        const answered = answeredByCampaign.get(campaign) ?? 0;
        campaign.answered = answered;
        // The upstream service uses both labels for the same queue-call state.
        // Keep both response fields aligned until consumers migrate to one name.
        campaign.inQueue = answered;
      }
    } catch (error) {
      req.log.warn({ err: error }, "Campaigns loaded without live queue statistics");
    }

    campaigns.sort((a, b) => a.extension.localeCompare(b.extension, undefined, { numeric: true }));
    res.json(campaigns);
  } catch (error) {
    req.log.error({ err: error }, "Unable to read campaigns from Redis");
    res.status(503).json({ message: "Campaign storage is unavailable" });
  }
});

router.get("/campaign-selection-scores", async (req, res) => {
  const domain = String(req.query["domain_name"] ?? "").trim();
  const extension = String(req.query["extension"] ?? "").trim();
  if (!domain || !domainPattern.test(domain) || !extension || !/^[a-z0-9_-]+$/i.test(extension)) {
    res.status(400).json({ message: "Valid domain_name and extension values are required" });
    return;
  }

  try {
    const redis = await getRedisClient();
    const entries = await redis.zRangeWithScores(`DIALPLAN_BACKEND:campaign:${extension}@${domain}:queue`, 0, -1);
    res.json(entries.map((entry, index) => ({
      agentUuid: entry.value,
      score: entry.score,
      rank: index + 1,
      label: `Candidate #${index + 1}`,
    })));
  } catch (error) {
    req.log.error({ err: error }, "Unable to read campaign selection scores from Redis");
    res.status(503).json({ message: "Campaign selection scores are unavailable" });
  }
});

export default router;
