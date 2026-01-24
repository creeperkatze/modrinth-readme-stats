import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

router.get("/organization/:id", cardController.getOrganization);

router.get("/organization/:id/downloads", badgeController.getOrganizationDownloads);
router.get("/organization/:id/projects", badgeController.getOrganizationProjects);
router.get("/organization/:id/followers", badgeController.getOrganizationFollowers);

export default router;
