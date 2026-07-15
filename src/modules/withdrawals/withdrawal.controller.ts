import { Request, Response } from "express";
import { getDB } from "../../config/db";
import { WITHDRAW_RATE, MIN_WITHDRAW_CREDIT } from "../../utils/creditMath";

export const createWithdrawal = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const {
      creator_email,
      creator_name,
      withdrawal_credit,
      payment_system,
      account_number,
    } = req.body;

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

// Creator এর available
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
