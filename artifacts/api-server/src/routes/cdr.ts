import { Router, type IRouter } from "express";
import { getCdrPool } from "../lib/cdr-db";

const router: IRouter = Router();
const domainPattern = /^[a-z0-9.-]+$/i;

router.get("/cdr", async (req, res) => {
  const domain = String(req.query["domain_name"] ?? "").trim();
  if (!domain || !domainPattern.test(domain)) {
    res.status(400).json({ message: "A valid domain_name is required" });
    return;
  }

  const page = Math.max(1, Number.parseInt(String(req.query["page"] ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query["limit"] ?? "25"), 10) || 25));
  const search = String(req.query["search"] ?? "").trim().slice(0, 100);
  const status = String(req.query["status"] ?? "").trim().slice(0, 40);
  const days = Math.min(365, Math.max(0, Number.parseInt(String(req.query["days"] ?? "30"), 10) || 0));

  const values: unknown[] = [domain];
  const where = ["queue_domain = $1"];
  if (search) {
    values.push(`%${search}%`);
    const parameter = `$${values.length}`;
    where.push(`(customer_number ILIKE ${parameter} OR queue_extension ILIKE ${parameter} OR queue_name ILIKE ${parameter} OR connected_agent_id ILIKE ${parameter} OR call_uuid ILIKE ${parameter})`);
  }
  if (status) {
    values.push(status);
    where.push(`final_status = $${values.length}`);
  }
  if (days) {
    values.push(days);
    where.push(`completed_at >= NOW() - ($${values.length}::int * INTERVAL '1 day')`);
  }

  const whereSql = where.join(" AND ");
  const offset = (page - 1) * limit;
  values.push(limit, offset);
  const limitParameter = `$${values.length - 1}`;
  const offsetParameter = `$${values.length}`;

  try {
    const db = getCdrPool();
    const [recordsResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, queue_session_uuid, call_uuid, cdr_uuid, customer_number,
          queue_extension, queue_domain, queue_name, campaign_id, direction,
          entered_queue_at, completed_at, final_status, final_reason,
          connected_agent_uuid, connected_agent_id, total_attempts, attempts, events
        FROM public.mod_call_center_cdr
        WHERE ${whereSql}
        ORDER BY completed_at DESC
        LIMIT ${limitParameter} OFFSET ${offsetParameter}`,
        values,
      ),
      db.query(`SELECT COUNT(*)::int AS total FROM public.mod_call_center_cdr WHERE ${whereSql}`, values.slice(0, -2)),
    ]);

    const total = Number(countResult.rows[0]?.["total"] ?? 0);
    res.json({ records: recordsResult.rows, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    req.log.error({ err: error }, "Unable to read CDR records");
    res.status(503).json({ message: "Call record storage is unavailable" });
  }
});

export default router;
