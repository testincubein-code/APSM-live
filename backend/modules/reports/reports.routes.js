import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import reportsController from './reports.controller.js';

const router = express.Router();

// GET /reports/export?platform=instagram&format=pdf&startDate=2023-01-01&endDate=2023-12-31
router.get('/export', requireAuth, reportsController.exportAnalytics);

export default router;
