import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

router.get("/user/:username", cardController.getUser);
router.get("/card/summary/:username", (req, res) => res.redirect("/")); // Deprecated
router.get("/card/user/:username", (req, res) => res.redirect("/")); // Deprecated

router.get("/user/:username/downloads", badgeController.getUserDownloads);
router.get("/user/:username/projects", badgeController.getUserProjects);
router.get("/user/:username/followers", badgeController.getUserFollowers);

export default router;
