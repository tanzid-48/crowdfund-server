import { Request, Response } from "express";
import { getDB } from "../../config/db";
import { WITHDRAW_RATE, MIN_WITHDRAW_CREDIT } from "../../utils/creditMath";
import { ObjectId } from "mongodb";

export const createWithdrawal = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const requesterEmail = req.decoded?.email;
    const { creator_name, withdrawal_credit, payment_system, account_number } =
      req.body;

    const creator_email = requesterEmail;

    if (
      !creator_email ||
      !withdrawal_credit ||
      !payment_system ||
      !account_number
    ) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    if (withdrawal_credit < MIN_WITHDRAW_CREDIT) {
      return res.status(400).send({
        message: `Minimum withdrawal is ${MIN_WITHDRAW_CREDIT} credits`,
      });
    }

    const campaigns = await db
      .collection("campaigns")
      .find({ creator_email })
      .toArray();
    const totalRaised = campaigns.reduce(
      (sum, c) => sum + (c.amount_raised || 0),
      0,
    );

    const previousWithdrawals = await db
      .collection("withdrawals")
      .find({ creator_email, status: { $in: ["pending", "approved"] } })
      .toArray();
    const totalWithdrawn = previousWithdrawals.reduce(
      (sum, w) => sum + (w.withdrawal_credit || 0),
      0,
    );

    const availableCredits = totalRaised - totalWithdrawn;

    if (withdrawal_credit > availableCredits) {
      return res.status(400).send({ message: "Insufficient raised credits" });
    }

    const withdrawal_amount = withdrawal_credit / WITHDRAW_RATE;

    const newWithdrawal = {
      creator_email,
      creator_name,
      withdrawal_credit: Number(withdrawal_credit),
      withdrawal_amount,
      payment_system,
      account_number,
      withdraw_date: new Date(),
      status: "pending" as const,
    };

    const result = await db.collection("withdrawals").insertOne(newWithdrawal);
    res.status(201).send({ insertedId: result.insertedId, ...newWithdrawal });
  } catch (err) {
    res.status(500).send({ message: "Failed to create withdrawal request" });
  }
};

export const getWithdrawalsForCreator = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).send({ message: "creatorEmail is required" });
    }

    const withdrawals = await db
      .collection("withdrawals")
      .find({ creator_email: email })
      .sort({ withdraw_date: -1 })
      .toArray();

    res.send(withdrawals);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch withdrawals" });
  }
};

export const getAvailableCredits = async (req: Request, res: Response) => {
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
    const totalRaised = campaigns.reduce(
      (sum, c) => sum + (c.amount_raised || 0),
      0,
    );

    const previousWithdrawals = await db
      .collection("withdrawals")
      .find({ creator_email: email, status: { $in: ["pending", "approved"] } })
      .toArray();
    const totalWithdrawn = previousWithdrawals.reduce(
      (sum, w) => sum + (w.withdrawal_credit || 0),
      0,
    );

    res.send({
      availableCredits: totalRaised - totalWithdrawn,
      totalRaised,
      totalWithdrawn,
    });
  } catch (err) {
    res.status(500).send({ message: "Failed to calculate available credits" });
  }
};

export const getPendingWithdrawals = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const withdrawals = await db
      .collection("withdrawals")
      .find({ status: "pending" })
      .sort({ withdraw_date: -1 })
      .toArray();
    res.send(withdrawals);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch pending withdrawals" });
  }
};

export const approveWithdrawal = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid withdrawal id" });
    }

    const withdrawal = await db
      .collection("withdrawals")
      .findOne({ _id: new ObjectId(id) });
    if (!withdrawal) {
      return res.status(404).send({ message: "Withdrawal not found" });
    }

    const campaigns = await db
      .collection("campaigns")
      .find({ creator_email: withdrawal.creator_email })
      .toArray();
    if (campaigns.length > 0) {
      await db
        .collection("campaigns")
        .updateOne(
          { _id: campaigns[0]._id },
          { $inc: { amount_raised: -withdrawal.withdrawal_credit } },
        );
    }

    await db
      .collection("withdrawals")
      .updateOne({ _id: withdrawal._id }, { $set: { status: "approved" } });

    res.send({ message: "Withdrawal approved" });
  } catch (err) {
    res.status(500).send({ message: "Failed to approve withdrawal" });
  }
};
