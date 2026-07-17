import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../../config/db";

export const getNotificationsForUser = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).send({ message: "email is required" });
    }

    const notifications = await db
      .collection("notifications")
      .find({ toEmail: email })
      .sort({ time: -1 })
      .limit(20)
      .toArray();

    res.send(notifications);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch notifications" });
  }
};

export const markNotificationSeen = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid notification id" });
    }

    await db
      .collection("notifications")
      .updateOne({ _id: new ObjectId(id) }, { $set: { seen: true } });

    res.send({ message: "Marked as seen" });
  } catch (err) {
    res.status(500).send({ message: "Failed to update notification" });
  }
};

export const markAllSeen = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ message: "email is required" });
    }

    await db
      .collection("notifications")
      .updateMany({ toEmail: email, seen: false }, { $set: { seen: true } });

    res.send({ message: "All marked as seen" });
  } catch (err) {
    res.status(500).send({ message: "Failed to update notifications" });
  }
};
