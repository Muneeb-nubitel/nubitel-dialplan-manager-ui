import { Router, type IRouter } from "express";
import { getRedisClient } from "../lib/redis";
import { getQueueAvailableAgents, getQueueMemberStats } from "../lib/queue-stats";

const router: IRouter = Router();
const domainPattern = /^[a-z0-9.-]+$/i;

router.get("/operations/summary", async (req, res) => {
  const domain = String(req.query["domain_name"] ?? "").trim();
  if (!domain || !domainPattern.test(domain)) {
    res.status(400).json({ message: "A valid domain_name is required" });
    return;
  }
  try {
    const redis = await getRedisClient();
    const queues = await redis.hGetAll(`DIALPLAN_BACKEND:queues:${domain}`);
    const extensions = Object.keys(queues);
    const stats = await getQueueMemberStats(domain, extensions.map((extension) => `${extension}@${domain}`));
    const waiting = new Map<string, number>();
    const totals = { waiting: 0, trying: 0, receiving: 0, active: 0 };
    for (const record of stats) {
      const state = String(record.state ?? "").trim().toLowerCase();
      const queue = String(record.queue ?? record.queue_extension ?? record.campaign_id ?? "").split("@")[0];
      if (state === "waiting") { totals.waiting += 1; waiting.set(queue, (waiting.get(queue) ?? 0) + 1); }
      if (state === "trying") totals.trying += 1;
      if (state === "receiving") totals.receiving += 1;
      if (state === "in a queue call" || state === "answered") totals.active += 1;
    }
    const totalCalls = totals.waiting + totals.trying + totals.receiving + totals.active;
    if (waiting.size === 0) {
      res.json({ callsInFlight: totalCalls, campaignCount: new Set(stats.map((record) => String(record.queue ?? record.queue_extension ?? record.campaign_id ?? ""))).size, states: totals, floor: { state: "stable", message: "No calls are waiting" } });
      return;
    }
    const availability = await Promise.all([...waiting.keys()].map(async (extension) => [extension, await getQueueAvailableAgents(domain, extension)] as const));
    const unavailable = availability.filter(([, count]) => count === 0).map(([extension]) => extension);
    const affected = unavailable.length ? unavailable : [...waiting.keys()];
    res.json({
      callsInFlight: totalCalls,
      campaignCount: new Set(stats.map((record) => String(record.queue ?? record.queue_extension ?? record.campaign_id ?? ""))).size,
      states: totals,
      floor: unavailable.length
        ? { state: "critical", message: `${unavailable.length} waiting queue${unavailable.length === 1 ? "" : "s"} has no available agents`, queues: affected }
        : { state: "attention", message: `${waiting.size} queue${waiting.size === 1 ? " has" : "s have"} calls waiting`, queues: affected },
    });
  } catch (error) {
    req.log.error({ err: error }, "Unable to load operations summary");
    res.status(503).json({ message: "Live operations data is unavailable" });
  }
});

export default router;
