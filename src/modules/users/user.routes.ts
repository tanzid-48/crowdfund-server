import { Router } from "express";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminStats,
} from "./user.controller";
import { verifyToken } from "../../middlewares/verifyToken";
import { verifyRole } from "../../middlewares/verifyRole";

const router = Router();

router.get("/stats", verifyToken, verifyRole(["admin"]), getAdminStats);
router.get("/", verifyToken, verifyRole(["admin"]), getAllUsers);
router.patch("/:id/role", verifyToken, verifyRole(["admin"]), updateUserRole);
router.delete("/:id", verifyToken, verifyRole(["admin"]), deleteUser);

export default router;
