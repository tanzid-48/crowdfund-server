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

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const {
      campaign_title,
      campaign_story,
      category,
      funding_goal,
      minimum_contribution,
      deadline,
      reward_info,
      campaign_image_url,
      creator_name,
      creator_email,
    } = req.body;

    if (!campaign_title || !campaign_story || !funding_goal || !creator_email) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const newCampaign = {
      campaign_title,
      campaign_story,
      category,
      funding_goal: Number(funding_goal),
      minimum_contribution: Number(minimum_contribution),
      deadline: new Date(deadline),
      reward_info: reward_info || "",
      campaign_image_url,
      amount_raised: 0,
      status: "pending" as const,
      creator_name,
      creator_email,
      createdAt: new Date(),
    };

    const result = await db.collection("campaigns").insertOne(newCampaign);
    res.status(201).send({ insertedId: result.insertedId, ...newCampaign });
  } catch (err) {
    res.status(500).send({ message: "Failed to create campaign" });
  }
};

export const getMyCampaigns = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).send({ message: "creatorEmail is required" });
    }

    const campaigns = await db
      .collection("campaigns")
      .find({ creator_email: email })
      .sort({ deadline: -1 })
      .toArray();

    res.send(campaigns);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch your campaigns" });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const id = req.params.id as string;
    const { campaign_title, campaign_story, reward_info } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid campaign id" });
    }

    const result = await db
      .collection("campaigns")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { campaign_title, campaign_story, reward_info } },
      );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Campaign not found" });
    }

    res.send({ message: "Campaign updated" });
  } catch (err) {
    res.status(500).send({ message: "Failed to update campaign" });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid campaign id" });
    }

    //  approved contribution
    const approvedContributions = await db
      .collection("contributions")
      .find({ campaign_id: id, status: "approved" })
      .toArray();

    //  supporter  credit
    for (const contribution of approvedContributions) {
      await db
        .collection("user")
        .updateOne(
          { email: contribution.supporter_email },
          { $inc: { credits: contribution.contribution_amount } },
        );
    }

    await db.collection("campaigns").deleteOne({ _id: new ObjectId(id) });
    await db.collection("contributions").deleteMany({ campaign_id: id });

    res.send({
      message: "Campaign deleted and supporters refunded",
      refundedCount: approvedContributions.length,
    });
  } catch (err) {
    res.status(500).send({ message: "Failed to delete campaign" });
  }
};
export const getCreatorStats = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).send({ message: "creatorEmail is required" });
    }

    const campaigns = await db
      .collection("campaigns")
      .find({ creator_email: email })
      .toArray();

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(
      (c) => c.status === "approved" && new Date(c.deadline) >= new Date(),
    ).length;
    const totalRaised = campaigns.reduce(
      (sum, c) => sum + (c.amount_raised || 0),
      0,
    );

    const campaignBreakdown = campaigns.map((c) => ({
      name: c.campaign_title,
      raised: c.amount_raised || 0,
      goal: c.funding_goal || 0,
      percent: c.funding_goal
        ? Math.round(((c.amount_raised || 0) / c.funding_goal) * 100)
        : 0,
    }));

    res.send({
      totalCampaigns,
      activeCampaigns,
      totalRaised,
      campaignBreakdown,
    });
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch stats" });
  }
};
