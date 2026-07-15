import { Router } from "express";
import {
  createWithdrawal,
  getWithdrawalsForCreator,
  getAvailableCredits,
} from "./withdrawal.controller";
import { verifyToken } from "../../middlewares/verifyToken";
import { verifyRole } from "../../middlewares/verifyRole";

const router = Router();

router.post("/", verifyToken, verifyRole(["creator"]), createWithdrawal);
router.get(
  "/available-credits",
  verifyToken,
  verifyRole(["creator"]),
  getAvailableCredits,
);
router.get("/", verifyToken, verifyRole(["creator"]), getWithdrawalsForCreator);

export default router;
