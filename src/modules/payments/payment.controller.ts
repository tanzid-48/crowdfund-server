import { Request, Response } from "express";
import Stripe from "stripe";
import { getDB } from "../../config/db";
import { PURCHASE_RATE } from "../../utils/creditMath";

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    stripe = new Stripe(key);
  }
  return stripe;
}

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).send({ message: "Invalid amount" });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).send({ message: "Failed to create payment intent" });
  }
};

export const savePayment = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { email, amount, transactionId } = req.body;

    if (!email || !amount || !transactionId) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const credits = amount * PURCHASE_RATE;

    const payment = {
      email,
      amount: Number(amount),
      credits,
      transactionId,
      date: new Date(),
    };

    await db.collection("payments").insertOne(payment);
    await db.collection("user").updateOne({ email }, { $inc: { credits } });

    res.status(201).send({ message: "Payment recorded", credits });
  } catch (err) {
    res.status(500).send({ message: "Failed to save payment" });
  }
};

export const getPaymentsForUser = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).send({ message: "email is required" });
    }

    const payments = await db
      .collection("payments")
      .find({ email })
      .sort({ date: -1 })
      .toArray();

    res.send(payments);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch payments" });
  }
};
