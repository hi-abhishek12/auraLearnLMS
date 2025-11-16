import express from "express";
import { signup, login, logout , getTeachers } from "../controller/authController.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/teachers", getTeachers);

export default router;
