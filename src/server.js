import express from "express";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import path from "path";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { checkCrawlerMiddleware } from "./middleware/checkCrawler.js";

dotenv.config({ quiet: true });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(process.cwd(), "public")));

app.use(checkCrawlerMiddleware);

app.use("/", userRoutes, projectRoutes, organizationRoutes, collectionRoutes, metaRoutes);

app.use((req, res) =>
{
    res.status(404).json({
        error: "Not Found",
    });
});

app.use(errorHandler);

app.listen(port, () =>
{
    logger.info(`Listening on port ${port}`);
});