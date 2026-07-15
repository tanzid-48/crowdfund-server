import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import campaignRoutes from "./modules/campaigns/campaign.routes";
import contributionRoutes from "./modules/contributions/contribution.routes";
import withdrawalRoutes from "./modules/withdrawals/withdrawal.routes";


const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());

app.use("/campaigns", campaignRoutes);
app.use("/contributions", contributionRoutes);
app.use("/withdrawals", withdrawalRoutes);

app.get("/", (req, res) => {
  res.send({ status: "ok", message: "Crowdfunding server is running" });
});

const start = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
};

start();
