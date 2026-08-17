import { Router, type IRouter } from "express";
import { getCdrPool } from "../lib/cdr-db";

const router: IRouter = Router();
const domainPattern = /^[a-z0-9.-]+$/i;
const ABANDONED_GROUP = "__ABANDONED_GROUP__";

function parseDate(value: unknown): Date | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function buildFilters(req: import("express").Request) {
  const domain = String(req.query["domain_name"] ?? "").trim();
  if (!domain || !domainPattern.test(domain)) return undefined;

  const search = String(req.query["search"] ?? "").trim().slice(0, 100);
  const status = String(req.query["status"] ?? "").trim().slice(0, 60);
  const dateFrom = parseDate(req.query["dateFrom"]);
  const dateTo = parseDate(req.query["dateTo"]);

  const values: unknown[] = [domain];
  const where = ["queue_domain = $1"];
  if (search) {
    values.push(`%${search}%`);
    const parameter = `$${values.length}`;
    where.push(`(customer_number ILIKE ${parameter} OR queue_extension ILIKE ${parameter} OR queue_name ILIKE ${parameter} OR connected_agent_id ILIKE ${parameter} OR call_uuid ILIKE ${parameter})`);
  }
  if (status === ABANDONED_GROUP) {
    where.push(`final_status ILIKE '%ABANDON%'`);
  } else if (status) {
    values.push(status);
    where.push(`final_status ILIKE $${values.length}`);
  }
  if (dateFrom) {
    values.push(dateFrom.toISOString());
    where.push(`completed_at >= $${values.length}`);
  }
  if (dateTo) {
    values.push(dateTo.toISOString());
    where.push(`completed_at <= $${values.length}`);
  }

  return { domain, values, where };
}

router.get("/cdr", async (req, res) => {
  const filters = buildFilters(req);
  if (!filters) {
    res.status(400).json({ message: "A valid domain_name is required" });
    return;
  }
  const { values, where } = filters;

  const page = Math.max(1, Number.parseInt(String(req.query["page"] ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query["limit"] ?? "25"), 10) || 25));

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

router.get("/cdr/summary", async (req, res) => {
  const filters = buildFilters(req);
  if (!filters) {
    res.status(400).json({ message: "A valid domain_name is required" });
    return;
  }
  const { values, where } = filters;
  const whereSql = where.join(" AND ");

  try {
    const db = getCdrPool();
    const [totalsResult, statusResult, reasonResult] = await Promise.all([
      db.query(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE connected_agent_uuid IS NOT NULL)::int AS "withAgent"
         FROM public.mod_call_center_cdr WHERE ${whereSql}`,
        values,
      ),
      db.query(
        `SELECT final_status AS status, COUNT(*)::int AS count
         FROM public.mod_call_center_cdr WHERE ${whereSql}
         GROUP BY final_status ORDER BY count DESC`,
        values,
      ),
      db.query(
        `SELECT COALESCE(final_reason, 'Not recorded') AS reason, COUNT(*)::int AS count
         FROM public.mod_call_center_cdr WHERE ${whereSql}
         GROUP BY COALESCE(final_reason, 'Not recorded') ORDER BY count DESC`,
        values,
      ),
    ]);

    res.json({
      total: Number(totalsResult.rows[0]?.["total"] ?? 0),
      withAgent: Number(totalsResult.rows[0]?.["withAgent"] ?? 0),
      byStatus: statusResult.rows,
      byReason: reasonResult.rows,
    });
  } catch (error) {
    req.log.error({ err: error }, "Unable to summarize CDR records");
    res.status(503).json({ message: "Call record storage is unavailable" });
  }
});

export default router;
