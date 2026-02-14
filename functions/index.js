import { onRequest } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import app from "../app.js";
import { connectDB } from "../config/database.js";

// Ensure DB connects when function starts (cold start)
connectDB().then(() => {
    logger.info("Database connected in Cloud Function");
}).catch(err => {
    logger.error("Database connection failed", err);
});

export const api = onRequest({ region: "asia-south1" }, app);
