import { AnalyticsSnapshot } from '../analytics/analytics.model.js';
import reportsService from './reports.service.js';

const exportAnalytics = async (req, res, next) => {
  try {
    const { platform, format, startDate, endDate } = req.query;
    const userId = req.user._id;

    if (!platform || !format) {
      return res.status(400).json({ error: "platform and format are required" });
    }

    // Build query
    const query = { incubationCenterId: userId, platform };
    if (startDate || endDate) {
      query.snapshotDate = {};
      if (startDate) query.snapshotDate.$gte = new Date(startDate);
      if (endDate) query.snapshotDate.$lte = new Date(endDate);
    }

    // Fetch data
    const snapshots = await AnalyticsSnapshot.find(query).sort({ snapshotDate: 1 }).lean();

    if (snapshots.length === 0) {
      return res.status(404).json({ error: "No analytics data found for the selected period." });
    }

    if (format === 'csv') {
      const csvData = await reportsService.generateCSV(snapshots, platform);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${platform}_analytics_${Date.now()}.csv"`);
      return res.status(200).send(csvData);
    } 
    
    if (format === 'pdf') {
      const pdfBuffer = await reportsService.generatePDF(snapshots, platform, req.user);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${platform}_analytics_${Date.now()}.pdf"`);
      return res.status(200).send(pdfBuffer);
    }

    return res.status(400).json({ error: "Invalid format. Use 'csv' or 'pdf'." });

  } catch (error) {
    console.error('[reports.controller] exportAnalytics error:', error);
    next(error);
  }
};

export default { exportAnalytics };
