import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

router.get("/collection/:id", cardController.getCollection);

router.get("/collection/:id/downloads", badgeController.getCollectionDownloads);
router.get("/collection/:id/projects", badgeController.getCollectionProjects);
router.get("/collection/:id/followers", badgeController.getCollectionFollowers);

export default router;
