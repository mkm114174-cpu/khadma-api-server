import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import providersRouter from "./providers";
import skillsRouter from "./skills";
import requestsRouter from "./requests";
import offersRouter from "./offers";
import reviewsRouter from "./reviews";
import notificationsRouter from "./notifications";
import messagesRouter from "./messages";
import chatRouter from "./chat";
import storageRouter from "./storage";
import commissionRouter from "./commission";
import presenceRouter from "./presence";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(providersRouter);
router.use(skillsRouter);
router.use(requestsRouter);
router.use(offersRouter);
router.use(reviewsRouter);
router.use(notificationsRouter);
router.use(messagesRouter);
router.use(chatRouter);
router.use(storageRouter);
router.use(commissionRouter);
router.use(presenceRouter);

export default router;
