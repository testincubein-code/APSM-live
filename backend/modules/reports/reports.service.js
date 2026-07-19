import { Parser } from 'json2csv';
import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateCSV = async (snapshots, platform) => {
  // Flatten data for CSV
  const data = snapshots.map(snap => {
    const flat = {
      Date: snap.snapshotDate ? new Date(snap.snapshotDate).toISOString().split('T')[0] : '',
      Platform: snap.platform,
      Followers: snap.metrics?.followers || 0,
      Impressions: snap.metrics?.impressions || 0,
      Reach: snap.metrics?.reach || 0,
      ProfileViews: snap.metrics?.profileViews || 0,
      TotalEngagement: snap.metrics?.totalEngagement || 0,
    };
    
    // Ads data if any
    if (snap.ads && snap.ads.totalSpend) {
      flat.AdSpend = snap.ads.totalSpend;
      flat.AdImpressions = snap.ads.adImpressions;
      flat.CostPerClick = snap.ads.costPerClick;
    }
    
    return flat;
  });

  const parser = new Parser();
  return parser.parse(data);
};

const generatePDF = async (snapshots, platform, user) => {
  // Prepare data for the template
  // Normalize latest metrics — guarantee all keys exist so EJS never crashes
  const rawLatest = snapshots[snapshots.length - 1]?.metrics;
  const latestMetrics = {
    followers:       rawLatest?.followers       ?? 0,
    reach:           rawLatest?.reach           ?? 0,
    impressions:     rawLatest?.impressions     ?? 0,
    totalEngagement: rawLatest?.totalEngagement ?? 0,
  };

  const templateData = {
    platform: platform.charAt(0).toUpperCase() + platform.slice(1),
    user: user.name || 'User',
    dateRange: '',
    snapshots: snapshots.map(s => ({
      date:        new Date(s.snapshotDate).toLocaleDateString(),
      followers:   s.metrics?.followers       ?? 0,
      impressions: s.metrics?.impressions     ?? 0,
      reach:       s.metrics?.reach           ?? 0,
      engagement:  s.metrics?.totalEngagement ?? 0,
    })),
    latestMetrics,
    chartLabels:          JSON.stringify(snapshots.map(s => new Date(s.snapshotDate).toLocaleDateString())),
    chartDataFollowers:   JSON.stringify(snapshots.map(s => s.metrics?.followers       ?? 0)),
    chartDataEngagement:  JSON.stringify(snapshots.map(s => s.metrics?.totalEngagement ?? 0)),
  };

  if (snapshots.length > 0) {
    const start = new Date(snapshots[0].snapshotDate).toLocaleDateString();
    const end = new Date(snapshots[snapshots.length - 1].snapshotDate).toLocaleDateString();
    templateData.dateRange = `${start} - ${end}`;
  }

  // Render HTML via EJS
  const templatePath = path.join(__dirname, 'templates', 'report.ejs');
  const html = await ejs.renderFile(templatePath, templateData);

  // Launch Puppeteer to create PDF
  // NOTE: headless: "new" was removed in Puppeteer v22+; use headless: true
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set viewport so the chart renders at a sensible size
  await page.setViewport({ width: 1200, height: 900 });

  // 'load' waits for all sub-resources (including Chart.js CDN script) to finish
  // timeout:0 disables the 30s default so slow CDNs don't crash the request
  await page.setContent(html, { waitUntil: 'load', timeout: 60000 });

  // Allow Chart.js time to paint after window.onload fires
  await new Promise(resolve => setTimeout(resolve, 800));

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
  });

  await browser.close();
  return pdfBuffer;
};

export default { generateCSV, generatePDF };
