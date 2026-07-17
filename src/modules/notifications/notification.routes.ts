import { Router } from "express";
import {
  getNotificationsForUser,
  markNotificationSeen,
  markAllSeen,
} from "./notification.controller";
import { verifyToken } from "../../middlewares/verifyToken";

const router = Router();

router.get("/", verifyToken, getNotificationsForUser);
router.patch("/:id/seen", verifyToken, markNotificationSeen);
router.patch("/mark-all-seen", verifyToken, markAllSeen);

export default router;
