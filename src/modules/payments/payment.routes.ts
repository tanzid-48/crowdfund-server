import { Router } from "express";
import {
  createPaymentIntent,
  savePayment,
  getPaymentsForUser,
} from "./payment.controller";
import { verifyToken } from "../../middlewares/verifyToken";

const router = Router();

router.post("/create-payment-intent", verifyToken, createPaymentIntent);
router.post("/", verifyToken, savePayment);
router.get("/", verifyToken, getPaymentsForUser);

export default router;
