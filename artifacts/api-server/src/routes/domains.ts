import { Router, type IRouter } from "express";
import { getCdrPool } from "../lib/cdr-db";

const router: IRouter = Router();

// Keep database access on the server: clients only receive the domain id and name.
router.get("/domains", async (req, res) => {
  try {
    const db = getCdrPool();
    const result = await db.query(
      `SELECT domain_uuid AS uuid, domain_name AS value, domain_name AS label
       FROM public.v_domains
       WHERE COALESCE(domain_enabled, 'true') <> 'false'
       ORDER BY domain_name ASC`,
    );
    res.json({ domains: result.rows });
  } catch (error) {
    req.log.error({ err: error }, "Unable to list domains");
    res.status(503).json({ message: "Domain storage is unavailable" });
  }
});

export default router;
