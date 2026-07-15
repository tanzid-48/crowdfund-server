import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../../config/db";
import type { Campaign } from "../../types";

export const getTopFundedCampaigns = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const campaigns = await db
      .collection<Campaign>("campaigns")
      .find({ status: "approved" })
      .sort({ amount_raised: -1 })
      .limit(6)
      .toArray();

    res.send(campaigns);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch top funded campaigns" });
  }
};

//— Explore Campaigns page
export const getAllApprovedCampaigns = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { category } = req.query;

    const filter: Record<string, unknown> = {
      status: "approved",
      deadline: { $gte: new Date() }, // deadline pass hoy nai emon gulo
    };

    if (category && typeof category === "string") {
      filter.category = category;
    }

    const campaigns = await db
      .collection<Campaign>("campaigns")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.send(campaigns);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch campaigns" });
  }
};

// Campaign Details page

export const getCampaignById = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid campaign id" });
    }

    const campaign = await db
      .collection("campaigns")
      .findOne({ _id: new ObjectId(id) });

    if (!campaign) {
      return res.status(404).send({ message: "Campaign not found" });
    }

    res.send(campaign);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch campaign" });
  }
};
