import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../../config/db";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const users = await db
      .collection("user")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(users);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch users" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const id = req.params.id as string;
    const { role } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid user id" });
    }

    if (!["supporter", "creator", "admin"].includes(role)) {
      return res.status(400).send({ message: "Invalid role" });
    }

    await db
      .collection("user")
      .updateOne({ _id: new ObjectId(id) }, { $set: { role } });
    res.send({ message: "Role updated" });
  } catch (err) {
    res.status(500).send({ message: "Failed to update role" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid user id" });
    }

    await db.collection("user").deleteOne({ _id: new ObjectId(id) });
    res.send({ message: "User removed" });
  } catch (err) {
    res.status(500).send({ message: "Failed to remove user" });
  }
};

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const db = getDB();

    const users = await db.collection("user").find({}).toArray();
    const totalSupporters = users.filter((u) => u.role === "supporter").length;
    const totalCreators = users.filter((u) => u.role === "creator").length;
    const totalAdmins = users.filter((u) => u.role === "admin").length;
    const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);

    const payments = await db.collection("payments").find({}).toArray();
    const totalPaymentsProcessed = payments.length;

    //  campaign status breakdown
    const campaigns = await db.collection("campaigns").find({}).toArray();
    const campaignStatusBreakdown = [
      {
        name: "Pending",
        value: campaigns.filter((c) => c.status === "pending").length,
      },
      {
        name: "Approved",
        value: campaigns.filter((c) => c.status === "approved").length,
      },
      {
        name: "Rejected",
        value: campaigns.filter((c) => c.status === "rejected").length,
      },
      {
        name: "Suspended",
        value: campaigns.filter((c) => c.status === "suspended").length,
      },
    ];

    // ⬇ — user role breakdown
    const userRoleBreakdown = [
      { name: "Supporters", value: totalSupporters },
      { name: "Creators", value: totalCreators },
      { name: "Admins", value: totalAdmins },
    ];

    res.send({
      totalSupporters,
      totalCreators,
      totalCredits,
      totalPaymentsProcessed,
      campaignStatusBreakdown,
      userRoleBreakdown,
    });
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch admin stats" });
  }
};
