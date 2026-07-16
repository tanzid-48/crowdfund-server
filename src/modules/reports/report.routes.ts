import { Router } from "express";
import {
  createReport,
  getAllReports,
  suspendReportedCampaign,
  dismissReport,
} from "./report.controller";
import { verifyToken } from "../../middlewares/verifyToken";
import { verifyRole } from "../../middlewares/verifyRole";

const router = Router();

router.post("/", verifyToken, createReport);
router.get("/", verifyToken, verifyRole(["admin"]), getAllReports);
router.patch(
  "/:id/suspend",
  verifyToken,
  verifyRole(["admin"]),
  suspendReportedCampaign,
);
router.patch("/:id/dismiss", verifyToken, verifyRole(["admin"]), dismissReport);

export default router;
