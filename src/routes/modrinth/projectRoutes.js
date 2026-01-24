import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

router.get("/project/:slug", cardController.getProject);

router.get("/project/:slug/downloads", badgeController.getProjectDownloads);
router.get("/project/:slug/followers", badgeController.getProjectFollowers);
router.get("/project/:slug/versions", badgeController.getProjectVersions);

export default router;
