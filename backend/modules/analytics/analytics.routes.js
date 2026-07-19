// modules/analytics/analytics.routes.js

import express from 'express';
import analyticsController from './analytics.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

// Get analytics summary across connected platforms
router.get('/combined', requireAuth, analyticsController.getCombinedAnalytics);
router.get('/summary', requireAuth, analyticsController.getAnalyticsSummary);
router.get('/youtube', requireAuth, analyticsController.getAnalyticsSummary);
router.get('/meta', requireAuth, analyticsController.getAnalyticsSummary);
router.get('/meta/facebook', requireAuth, analyticsController.getAnalyticsSummary);
router.get('/meta/instagram', requireAuth, analyticsController.getAnalyticsSummary);
router.get('/linkedin', requireAuth, analyticsController.getAnalyticsSummary);

export default router;
