import https from "node:https";

export type QueueMemberStat = {
  campaign_id?: string;
  queue?: string;
  queue_extension?: string;
  state?: string;
};

type QueueMemberStatsResponse = { records?: QueueMemberStat[] };

export function getQueueMemberStats(domain: string, campaignIds: string[]) {
  return new Promise<QueueMemberStat[]>((resolve, reject) => {
    if (campaignIds.length === 0) {
      resolve([]);
      return;
    }

    const body = JSON.stringify({ campaign_ids: campaignIds });
    const url = new URL("https://cxdev-dialplan-api.nubitel.io/call-center/api/v1/queues/queue-members-stats");
    url.searchParams.set("domain_name", domain);
    const request = https.request(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
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
        try {
          const parsed = JSON.parse(json) as QueueMemberStatsResponse;
          resolve(Array.isArray(parsed.records) ? parsed.records : []);
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("timeout", () => request.destroy(new Error("Queue stats request timed out")));
    request.on("error", reject);
    request.end(body);
  });
}
