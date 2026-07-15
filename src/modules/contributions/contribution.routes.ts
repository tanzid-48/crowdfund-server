import { Router } from "express";
import {
  getContributionsForCreator,
  approveContribution,
  rejectContribution,
  createContribution,
  getApprovedContributionsForSupporter,
  getMyContributionsPaginated,
  getSupporterStats,
} from "./contribution.controller";
import { verifyToken } from "../../middlewares/verifyToken";
import { verifyRole } from "../../middlewares/verifyRole";

const router = Router();

router.get(
  "/",
  verifyToken,
  verifyRole(["creator"]),
  getContributionsForCreator,
);
router.get(
  "/approved",
  verifyToken,
  verifyRole(["supporter"]),
  getApprovedContributionsForSupporter,
);
router.get(
  "/my-contributions",
  verifyToken,
  verifyRole(["supporter"]),
  getMyContributionsPaginated,
);
router.get("/stats", verifyToken, verifyRole(["supporter"]), getSupporterStats);
router.post("/", verifyToken, verifyRole(["supporter"]), createContribution);
router.patch(
  "/:id/approve",
  verifyToken,
  verifyRole(["creator"]),
  approveContribution,
);
router.patch(
  "/:id/reject",
  verifyToken,
  verifyRole(["creator"]),
  rejectContribution,
);

export default router;
