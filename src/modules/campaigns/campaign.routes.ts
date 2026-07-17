import { Router } from "express";
import {
  getTopFundedCampaigns,
  getAllApprovedCampaigns,
  getCampaignById,
  createCampaign,
  getMyCampaigns,
  updateCampaign,
  deleteCampaign,
  getPendingCampaigns,
  approveCampaign,
  rejectCampaign,
  getAllCampaignsForAdmin,
  adminDeleteCampaign,
} from "./campaign.controller";
import { verifyToken } from "../../middlewares/verifyToken";
import { verifyRole } from "../../middlewares/verifyRole";
import { getCreatorStats } from "./campaign.controller";

const router = Router();
router.get("/top-funded", getTopFundedCampaigns);
router.get("/stats", verifyToken, verifyRole(["creator"]), getCreatorStats);
router.get(
  "/my-campaigns",
  verifyToken,
  verifyRole(["creator"]),
  getMyCampaigns,
);
router.get("/pending", verifyToken, verifyRole(["admin"]), getPendingCampaigns);
router.get(
  "/admin-all",
  verifyToken,
  verifyRole(["admin"]),
  getAllCampaignsForAdmin,
);
router.post("/", verifyToken, verifyRole(["creator"]), createCampaign);
router.patch(
  "/:id/approve",
  verifyToken,
  verifyRole(["admin"]),
  approveCampaign,
);
router.patch("/:id/reject", verifyToken, verifyRole(["admin"]), rejectCampaign);
router.patch("/:id", verifyToken, verifyRole(["creator"]), updateCampaign);
router.delete(
  "/:id/admin",
  verifyToken,
  verifyRole(["admin"]),
  adminDeleteCampaign,
);
router.delete("/:id", verifyToken, verifyRole(["creator"]), deleteCampaign);
router.get("/:id", getCampaignById);
router.get("/", getAllApprovedCampaigns);

export default router;
