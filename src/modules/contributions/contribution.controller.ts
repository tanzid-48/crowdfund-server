import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../../config/db";

export const getContributionsForCreator = async (
  req: Request,
  res: Response,
) => {
  try {
    const db = getDB();
    const { creatorEmail, status } = req.query;

    if (!creatorEmail || typeof creatorEmail !== "string") {
      return res.status(400).send({ message: "creatorEmail is required" });
    }

    const filter: Record<string, unknown> = { creator_email: creatorEmail };
    if (status && typeof status === "string") {
      filter.status = status;
    }

    const contributions = await db
      .collection("contributions")
      .find(filter)
      .sort({ current_date: -1 })
      .toArray();

    res.send(contributions);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch contributions" });
  }
};

export const approveContribution = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid contribution id" });
    }

    const contribution = await db
      .collection("contributions")
      .findOne({ _id: new ObjectId(id) });

    if (!contribution) {
      return res.status(404).send({ message: "Contribution not found" });
    }

    if (contribution.status !== "pending") {
      return res
        .status(400)
        .send({ message: "Contribution already processed" });
    }

    // campaign এর amount_raised বাড়াও
    await db
      .collection("campaigns")
      .updateOne(
        { _id: new ObjectId(contribution.campaign_id) },
        { $inc: { amount_raised: contribution.contribution_amount } },
      );

    // contribution status
    await db
      .collection("contributions")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status: "approved" } });

    // notification
    await db.collection("notifications").insertOne({
      message: `Your contribution of ${contribution.contribution_amount} credits to ${contribution.campaign_title} was approved by ${contribution.creator_name}`,
      toEmail: contribution.supporter_email,
      actionRoute: "/dashboard/supporter-home",
      time: new Date(),
      seen: false,
    });

    res.send({ message: "Contribution approved" });
  } catch (err) {
    res.status(500).send({ message: "Failed to approve contribution" });
  }
};

export const rejectContribution = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid contribution id" });
    }

    const contribution = await db
      .collection("contributions")
      .findOne({ _id: new ObjectId(id) });

    if (!contribution) {
      return res.status(404).send({ message: "Contribution not found" });
    }

    if (contribution.status !== "pending") {
      return res
        .status(400)
        .send({ message: "Contribution already processed" });
    }

    // supporter কে credit
    await db
      .collection("user")
      .updateOne(
        { email: contribution.supporter_email },
        { $inc: { credits: contribution.contribution_amount } },
      );

    // contribution status
    await db
      .collection("contributions")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status: "rejected" } });

    // notification পাঠাও
    await db.collection("notifications").insertOne({
      message: `Your contribution of ${contribution.contribution_amount} credits to ${contribution.campaign_title} was rejected. Your credits have been refunded.`,
      toEmail: contribution.supporter_email,
      actionRoute: "/dashboard/supporter-home",
      time: new Date(),
      seen: false,
    });

    res.send({ message: "Contribution rejected and refunded" });
  } catch (err) {
    res.status(500).send({ message: "Failed to reject contribution" });
  }
};

// Supporter
export const createContribution = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const {
      campaign_id,
      campaign_title,
      contribution_amount,
      supporter_email,
      supporter_name,
      creator_name,
      creator_email,
      message,
    } = req.body;

    if (!campaign_id || !contribution_amount || !supporter_email) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    // supporter এর credit
    const user = await db
      .collection("user")
      .findOne({ email: supporter_email });
    if (!user || user.credits < contribution_amount) {
      return res.status(400).send({ message: "Insufficient credits" });
    }

    // credit deduct
    await db
      .collection("user")
      .updateOne(
        { email: supporter_email },
        { $inc: { credits: -contribution_amount } },
      );

    const newContribution = {
      campaign_id,
      campaign_title,
      contribution_amount: Number(contribution_amount),
      supporter_email,
      supporter_name,
      creator_name,
      creator_email,
      message: message || "",
      status: "pending" as const,
      current_date: new Date(),
    };

    const result = await db
      .collection("contributions")
      .insertOne(newContribution);

    // creator কে notification
    await db.collection("notifications").insertOne({
      message: `${supporter_name} contributed ${contribution_amount} credits to ${campaign_title}`,
      toEmail: creator_email,
      actionRoute: "/dashboard/creator-home/contributions",
      time: new Date(),
      seen: false,
    });

    res.status(201).send({ insertedId: result.insertedId, ...newContribution });
  } catch (err) {
    res.status(500).send({ message: "Failed to create contribution" });
  }
};

export const getApprovedContributionsForSupporter = async (
  req: Request,
  res: Response,
) => {
  try {
    const db = getDB();
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).send({ message: "supporterEmail is required" });
    }

    const contributions = await db
      .collection("contributions")
      .find({ supporter_email: email, status: "approved" })
      .sort({ current_date: -1 })
      .toArray();

    res.send(contributions);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch approved contributions" });
  }
};

export const getMyContributionsPaginated = async (
  req: Request,
  res: Response,
) => {
  try {
    const db = getDB();
    const { email, page = "1", limit = "5" } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).send({ message: "supporterEmail is required" });
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter = { supporter_email: email };

    const [contributions, total] = await Promise.all([
      db
        .collection("contributions")
        .find(filter)
        .sort({ current_date: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      db.collection("contributions").countDocuments(filter),
    ]);

    res.send({
      contributions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch contributions" });
  }
};

export const getSupporterStats = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).send({ message: "supporterEmail is required" });
    }

    const contributions = await db
      .collection("contributions")
      .find({ supporter_email: email })
      .toArray();

    const totalContributions = contributions.length;
    const pendingCount = contributions.filter(
      (c) => c.status === "pending",
    ).length;
    const approvedCount = contributions.filter(
      (c) => c.status === "approved",
    ).length;
    const rejectedCount = contributions.filter(
      (c) => c.status === "rejected",
    ).length;
    const totalAmountContributed = contributions
      .filter((c) => c.status === "approved")
      .reduce((sum, c) => sum + (c.contribution_amount || 0), 0);

    res.send({
      totalContributions,
      pendingContributions: pendingCount,
      totalAmountContributed,
      statusBreakdown: [
        { name: "Approved", value: approvedCount },
        { name: "Pending", value: pendingCount },
        { name: "Rejected", value: rejectedCount },
      ],
    });
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch stats" });
  }
};
