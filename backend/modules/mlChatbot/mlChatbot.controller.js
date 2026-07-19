import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { AnalyticsSnapshot } from '../analytics/analytics.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');
const bridgePath = path.join(projectRoot, 'ml_engine', 'ml_chatbot_bridge.py');

const PLATFORM_ALIASES = {
  youtube: ['youtube', 'yt', 'shorts', 'short'],
  instagram: ['instagram', 'insta', 'reel', 'reels'],
  facebook: ['facebook', 'fb'],
  linkedin: ['linkedin', 'linked in'],
};

function getConnectedPlatforms(user) {
  return [...new Set(
    (user.socialAccounts || [])
      .filter((account) => account.isActive)
      .map((account) => account.platform)
  )];
}

function detectPlatform(message = '', fallbackPlatform = null) {
  const text = message.toLowerCase();
  for (const [platform, aliases] of Object.entries(PLATFORM_ALIASES)) {
    if (aliases.some((alias) => text.includes(alias))) return platform;
  }
  return fallbackPlatform;
}

function hasUsefulMetrics(snapshot) {
  if (!snapshot) return false;
  const metrics = snapshot.metrics || {};
  const rawStats = snapshot.rawPlatformData?.channelDetails?.statistics || {};
  const values = [
    metrics.followers,
    metrics.impressions,
    metrics.reach,
    metrics.profileViews,
    metrics.totalEngagement,
    rawStats.viewCount,
    rawStats.subscriberCount,
    rawStats.videoCount,
  ];

  return values.some((value) => Number(value) > 0);
}

async function getLatestSnapshot(userId, platform) {
  return AnalyticsSnapshot.findOne({
    incubationCenterId: userId,
    platform,
  }).sort({ snapshotDate: -1 });
}

function callPythonSuggestion(message, context) {
  return new Promise((resolve, reject) => {
    const pythonCommand = process.env.PYTHON_COMMAND || 'python';
    const child = spawn(pythonCommand, [bridgePath], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      try {
        const parsed = JSON.parse(stdout || '{}');
        if (code !== 0 && !parsed.reply) {
          reject(new Error(stderr || `ML bridge exited with code ${code}`));
          return;
        }
        resolve(parsed);
      } catch (error) {
        reject(new Error(stderr || error.message));
      }
    });

    child.stdin.write(JSON.stringify({ message, context }));
    child.stdin.end();
  });
}

const getStatus = async (req, res, next) => {
  try {
    const connectedPlatforms = getConnectedPlatforms(req.user);
    const snapshotCounts = {};
    const platformsWithAnalytics = [];

    for (const platform of connectedPlatforms) {
      const count = await AnalyticsSnapshot.countDocuments({
        incubationCenterId: req.user._id,
        platform,
      });
      snapshotCounts[platform] = count;
      if (count > 0) platformsWithAnalytics.push(platform);
    }

    res.json({
      visible: connectedPlatforms.length > 0,
      connectedPlatforms,
      platformsWithAnalytics,
      snapshotCounts,
    });
  } catch (error) {
    next(error);
  }
};

const chat = async (req, res, next) => {
  try {
    const message = req.body?.message || '';
    const requestedPlatform = detectPlatform(message, req.body?.platform || req.body?.context?.platform);
    const connectedPlatforms = getConnectedPlatforms(req.user);

    if (connectedPlatforms.length === 0) {
      return res.status(200).json({
        reply: 'Please connect a social media account first so I can analyze your performance and give accurate suggestions.',
        state: 'no_connected_platforms',
        connectedPlatforms,
      });
    }

    const platform = requestedPlatform || connectedPlatforms[0];
    if (!connectedPlatforms.includes(platform)) {
      return res.status(200).json({
        reply: `${platform[0].toUpperCase() + platform.slice(1)} is not connected yet. Please connect your ${platform} account first so I can analyze it.`,
        state: 'platform_not_connected',
        connectedPlatforms,
        requestedPlatform: platform,
      });
    }

    const snapshot = await getLatestSnapshot(req.user._id, platform);
    if (!snapshot) {
      return res.status(200).json({
        reply: `${platform[0].toUpperCase() + platform.slice(1)} is connected, but analytics have not been collected yet. Please open or refresh the ${platform} analytics page first, then I can provide model-backed suggestions.`,
        state: 'no_analytics',
        connectedPlatforms,
        requestedPlatform: platform,
      });
    }

    const result = await callPythonSuggestion(message, {
      ...(req.body?.context || {}),
      platform,
      connectedPlatforms,
      hasUsefulMetrics: hasUsefulMetrics(snapshot),
    });

    const dataWarning = hasUsefulMetrics(snapshot)
      ? null
      : `Your ${platform} account is connected, but the available analytics are still mostly zero. I can show model-backed suggestions now, and they will become stronger as more engagement data is collected.`;

    return res.json({
      ...result,
      state: dataWarning ? 'limited_analytics' : 'ready',
      requestedPlatform: platform,
      connectedPlatforms,
      dataWarning,
    });
  } catch (error) {
    next(error);
  }
};

export default { getStatus, chat };
