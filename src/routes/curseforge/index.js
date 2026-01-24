import express from "express";
import * as curseforgeController from "../../controllers/curseforgeController.js";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";
import curseforgeClient from "../../services/curseforgeClient.js";
import { requireApiKey } from "../../middleware/apiConfig.js";

const router = express.Router();

router.use(requireApiKey("CurseForge", curseforgeClient, "CURSEFORGE_API_KEY"));

// Slug lookup route (resolve CurseForge slugs to IDs)
router.get("/curseforge/lookup/:slug", curseforgeController.getCfSlugLookup);


router.get("/curseforge/project/:modId", cardController.getCfMod);


router.get("/meta/curseforge/:modId", curseforgeController.getCfMeta);

router.get("/curseforge/project/:modId/downloads", badgeController.getCfModDownloads);
router.get("/curseforge/project/:modId/likes", badgeController.getCfModLikes);
router.get("/curseforge/project/:modId/versions", badgeController.getCfModVersions);

export default router;
