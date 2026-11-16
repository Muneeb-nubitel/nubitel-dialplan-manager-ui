import https from "node:https";

export type QueueMemberStat = {
  campaign_id?: string;
  queue?: string;
  queue_extension?: string;
  state?: string;
};

type QueueMemberStatsResponse = { records?: QueueMemberStat[] };
type QueueAgentAvailabilityResponse = { available_count?: number };

function getJson<T>(url: URL, body?: string) {
  return new Promise<T>((resolve, reject) => {
    const request = https.request(url, {
      method: "GET",
      headers: body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : undefined,
      timeout: 10_000,
    }, (response) => {
      let json = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { json += chunk; });
      response.on("end", () => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Queue stats request failed (${response.statusCode ?? 0})`));
          return;
        }
        try { resolve(JSON.parse(json) as T); } catch (error) { reject(error); }
      });
    });
    request.on("timeout", () => request.destroy(new Error("Queue stats request timed out")));
    request.on("error", reject);
    request.end(body);
  });
}

export function getQueueMemberStats(domain: string, campaignIds: string[]) {
  if (campaignIds.length === 0) return Promise.resolve([]);
  const url = new URL("https://cxdev-dialplan-stats-api.nubitel.io/call-center-stats/api/v1/queues/queue-members-stats");
  url.searchParams.set("domain_name", domain);
  return getJson<QueueMemberStatsResponse>(url, JSON.stringify({ campaign_ids: campaignIds }))
    .then((parsed) => Array.isArray(parsed.records) ? parsed.records : []);
}

export async function getQueueAvailableAgents(domain: string, extension: string) {
  const url = new URL("https://cxdev-dialplan-stats-api.nubitel.io/call-center-stats/api/v1/queues/agent-availability");
  url.searchParams.set("domain_name", domain);
  url.searchParams.set("extension", extension);
  const result = await getJson<QueueAgentAvailabilityResponse>(url);
  return Number(result.available_count ?? 0);
}
