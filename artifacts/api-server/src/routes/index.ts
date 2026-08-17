import { Router, type IRouter } from "express";
import healthRouter from "./health";
import campaignsRouter from "./campaigns";
import cdrRouter from "./cdr";

const router: IRouter = Router();

router.use(healthRouter);
router.use(campaignsRouter);
router.use(cdrRouter);

export default router;
