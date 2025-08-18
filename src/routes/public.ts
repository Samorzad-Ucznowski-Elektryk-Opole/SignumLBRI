import express, { Request, Response } from "express";
import * as publicController from "../controllers/public";

const router = express.Router();

/**
 * Publiczny dashboard - główna strona transparentności
 */
router.get("/", publicController.getPublicDashboard);

/**
 * Open Data API endpoints
 */
router.get("/api/opendata", publicController.getOpenDataAPI);
router.get("/api/school/:schoolId", publicController.getSchoolStats);
router.get("/api/timeseries", publicController.getTimeSeriesData);

/**
 * Dokumentacja API
 */
router.get("/docs", (req: Request, res: Response) => {
  res.render("public/docs", {
    title: "API Documentation",
    layout: "public/layout"
  });
});

export default router;
