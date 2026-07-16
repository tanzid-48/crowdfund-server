import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../../config/db";

export const createReport = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const {
      campaign_id,
      campaign_title,
      reporter_name,
      reporter_email,
      reason,
    } = req.body;

    if (!campaign_id || !reason) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const newReport = {
      campaign_id,
      campaign_title,
      reporter_name,
      reporter_email,
      reason,
      date: new Date(),
      status: "pending" as const,
    };

    const result = await db.collection("reports").insertOne(newReport);
    res.status(201).send({ insertedId: result.insertedId, ...newReport });
  } catch (err) {
    res.status(500).send({ message: "Failed to submit report" });
  }
};

export const getAllReports = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const reports = await db
      .collection("reports")
      .find({})
      .sort({ date: -1 })
      .toArray();
    res.send(reports);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch reports" });
  }
};

export const suspendReportedCampaign = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid report id" });
    }

    const report = await db
      .collection("reports")
      .findOne({ _id: new ObjectId(id) });
    if (!report) {
      return res.status(404).send({ message: "Report not found" });
    }

    await db
      .collection("campaigns")
      .updateOne(
        { _id: new ObjectId(report.campaign_id) },
        { $set: { status: "suspended" } },
      );

    await db
      .collection("reports")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status: "resolved" } });

    res.send({ message: "Campaign suspended and report resolved" });
  } catch (err) {
    res.status(500).send({ message: "Failed to suspend campaign" });
  }
};

export const dismissReport = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid report id" });
    }

    await db
      .collection("reports")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status: "resolved" } });

    res.send({ message: "Report dismissed" });
  } catch (err) {
    res.status(500).send({ message: "Failed to dismiss report" });
  }
};
