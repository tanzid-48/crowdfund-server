import { Router } from "express";
import {
  getContributionsForCreator,
  approveContribution,
  rejectContribution,
  createContribution,
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
