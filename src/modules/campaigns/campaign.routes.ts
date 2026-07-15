import { Router } from "express";
import {
  getTopFundedCampaigns,
  getAllApprovedCampaigns,
  getCampaignById,
  createCampaign,
  getMyCampaigns,
  updateCampaign,
  deleteCampaign,
} from "./campaign.controller";
import { verifyToken } from "../../middlewares/verifyToken";
import { verifyRole } from "../../middlewares/verifyRole";
import { getCreatorStats } from "./campaign.controller";

const router = Router();

// public
router.get("/top-funded", getTopFundedCampaigns);
router.get("/stats", verifyToken, verifyRole(["creator"]), getCreatorStats);

// protected — creator only
router.get(
  "/my-campaigns",
  verifyToken,
  verifyRole(["creator"]),
  getMyCampaigns,
);
router.post("/", verifyToken, verifyRole(["creator"]), createCampaign);
router.patch("/:id", verifyToken, verifyRole(["creator"]), updateCampaign);
router.delete("/:id", verifyToken, verifyRole(["creator"]), deleteCampaign);

router.get("/:id", getCampaignById);
router.get("/", getAllApprovedCampaigns);

export default router;
