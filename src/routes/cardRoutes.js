import express from 'express';
import * as cardController from '../controllers/cardController.js';

const router = express.Router();

router.get('/card/summary/:username', cardController.getUser); // Deprecated
router.get('/card/user/:username', cardController.getUser); // Deprecated
router.get('/user/:username', cardController.getUser);
router.get('/project/:slug', cardController.getProject);

export default router;
