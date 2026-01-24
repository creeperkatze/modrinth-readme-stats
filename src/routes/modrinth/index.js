import express from "express";
import userRoutes from "./userRoutes.js";
import projectRoutes from "./projectRoutes.js";
import organizationRoutes from "./organizationRoutes.js";
import collectionRoutes from "./collectionRoutes.js";

const router = express.Router();

router.use(userRoutes);
router.use(projectRoutes);
router.use(organizationRoutes);
router.use(collectionRoutes);

export default router;
