import express from "express";
import { ranking } from "../controllers/ranking.controller.js";

const router = express.Router();

router.get("/", ranking);

export default router;