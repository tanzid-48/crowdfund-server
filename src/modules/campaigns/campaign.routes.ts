import { Router } from "express";
import {
  getTopFundedCampaigns,
  getAllApprovedCampaigns,
  getCampaignById,
} from "./campaign.controller";

const router = Router();

router.get("/top-funded", getTopFundedCampaigns);
router.get("/:id", getCampaignById);
router.get("/", getAllApprovedCampaigns);

export default router;
