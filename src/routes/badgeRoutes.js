import express from 'express';
import * as badgeController from '../controllers/badgeController.js';

const router = express.Router();

router.get('/user/:username/downloads', badgeController.getDownloads);
router.get('/user/:username/projects', badgeController.getProjects);
router.get('/user/:username/followers', badgeController.getFollowers);

export default router;
    