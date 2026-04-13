import { Router, type IRouter } from "express";
import healthRouter from "./health";
import askRouter from "./ask";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(askRouter);
router.use(searchRouter);

export default router;
