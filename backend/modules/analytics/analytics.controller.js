import { AnalyticsSnapshot } from './analytics.model.js';
import { fetchAndSaveYouTubeAnalytics } from './youtube.analytics.js';
import { fetchAndSaveFacebookAnalytics, fetchAndSaveInstagramAnalytics } from './meta.analytics.js';

const getAnalyticsSummary = async (req, res, next) => {
  try {
    let { platform, startDate, endDate } = req.query;

    // Automatically detect platform from URL path if not provided as a query param
    // e.g. GET /analytics/youtube       -> platform = 'youtube'
    //      GET /analytics/meta/facebook -> platform = 'facebook'
    if (!platform) {
      const pathParts = req.path.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (['youtube', 'meta', 'linkedin', 'facebook', 'instagram'].includes(lastPart)) {
        platform = lastPart;
      }
    }

    const userId = req.user._id;

    // ─────────────────────────────────────────────────────────────────────────
    // HELPER: fetch-or-cache for a single platform
    // Returns the snapshot document directly (not wrapped in any extra object).
    // On success → the fresh or cached snapshot
    // On live-fetch failure → falls back to the most recent snapshot in the DB
    // ─────────────────────────────────────────────────────────────────────────
    const fetchOrCache = async (platformName, fetchFn) => {
      const { forceRefresh } = req.query;

      // 1. Return cached snapshot if it is less than 24 h old and not forcing refresh
      if (forceRefresh !== 'true') {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const cached = await AnalyticsSnapshot.findOne({
          incubationCenterId: userId,
          platform: platformName,
          snapshotDate: { $gte: oneDayAgo },
        }).sort({ snapshotDate: -1 });

        if (cached) {
          console.log(`[analytics.controller] Returning cached ${platformName} snapshot for user ${userId}`);
          return { snapshot: cached, fromCache: true };
        }
      }

      // 2. Fetch fresh data from the platform API
      console.log(`[analytics.controller] Fetching fresh ${platformName} data for user ${userId}...`);
      try {
        const snapshot = await fetchFn(userId);

        // DB hygiene: keep only the 30 most recent snapshots per user/platform
        const toDelete = await AnalyticsSnapshot.find({ incubationCenterId: userId, platform: platformName })
          .sort({ snapshotDate: -1 })
          .skip(30)
          .select('_id');
        if (toDelete.length > 0) {
          await AnalyticsSnapshot.deleteMany({ _id: { $in: toDelete.map(d => d._id) } });
        }

        return { snapshot, fromCache: false };
      } catch (fetchErr) {
        // 3. Live fetch failed — fall back to the most recent snapshot in the DB
        console.error(
          `⚠️ [analytics.controller] Live ${platformName} fetch failed, returning latest snapshot:`,
          fetchErr.message
        );
        const fallback = await AnalyticsSnapshot.findOne({ incubationCenterId: userId, platform: platformName })
          .sort({ snapshotDate: -1 });

        if (!fallback) {
          throw new Error(
            `Failed to fetch live ${platformName} analytics and no saved snapshot found: ${fetchErr.message}`
          );
        }
        return { snapshot: fallback, fromCache: true, failedLiveFetch: true };
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // YOUTUBE — returns a single snapshot object
    // Frontend (ytapi.js): `return res.data?.data ?? null`  → expects single object
    // ─────────────────────────────────────────────────────────────────────────
    if (platform === 'youtube') {
      try {
        const { snapshot, fromCache, failedLiveFetch } = await fetchOrCache(
          'youtube',
          fetchAndSaveYouTubeAnalytics
        );
        return res.json({
          message: failedLiveFetch
            ? 'Retrieved latest cached YouTube analytics (live fetch failed)'
            : fromCache
              ? 'YouTube analytics retrieved from cache'
              : 'YouTube analytics retrieved successfully',
          data: snapshot,          // ← single object (not an array)
        });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FACEBOOK (individual endpoint) — returns a single snapshot object
    // ─────────────────────────────────────────────────────────────────────────
    if (platform === 'facebook') {
      try {
        const { snapshot, fromCache, failedLiveFetch } = await fetchOrCache(
          'facebook',
          fetchAndSaveFacebookAnalytics
        );
        return res.json({
          message: failedLiveFetch
            ? 'Retrieved latest cached Facebook analytics (live fetch failed)'
            : fromCache
              ? 'Facebook analytics retrieved from cache'
              : 'Facebook analytics retrieved successfully',
          data: snapshot,          // ← single object
        });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INSTAGRAM (individual endpoint) — returns a single snapshot object
    // ─────────────────────────────────────────────────────────────────────────
    if (platform === 'instagram') {
      try {
        const { snapshot, fromCache, failedLiveFetch } = await fetchOrCache(
          'instagram',
          fetchAndSaveInstagramAnalytics
        );
        const history = await AnalyticsSnapshot.find({ incubationCenterId: userId, platform: 'instagram' })
          .sort({ snapshotDate: 1 })
          .limit(30);
        return res.json({
          message: failedLiveFetch
            ? 'Retrieved latest cached Instagram analytics (live fetch failed)'
            : fromCache
              ? 'Instagram analytics retrieved from cache'
              : 'Instagram analytics retrieved successfully',
          data: snapshot,
          history: history,
        });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // META (combined Facebook + Instagram) — returns an ARRAY of two snapshots
    // Frontend (metaApi.js): `const snapshots = response.data?.data || []`
    //   then `.find(s => s.platform === 'facebook')` and `.find(s => s.platform === 'instagram')`
    // ─────────────────────────────────────────────────────────────────────────
    if (platform === 'meta') {
      try {
        const [fbResult, igResult] = await Promise.allSettled([
          fetchOrCache('facebook', fetchAndSaveFacebookAnalytics),
          fetchOrCache('instagram', fetchAndSaveInstagramAnalytics),
        ]);

        const fbSnapshot = fbResult.status === 'fulfilled' ? fbResult.value.snapshot : null;
        const igSnapshot = igResult.status === 'fulfilled' ? igResult.value.snapshot : null;

        const anyFailedLive =
          (fbResult.status === 'fulfilled' && fbResult.value.failedLiveFetch) ||
          (igResult.status === 'fulfilled' && igResult.value.failedLiveFetch);

        return res.json({
          message: anyFailedLive
            ? 'Retrieved latest cached Meta analytics (some live fetches failed)'
            : 'Meta analytics retrieved successfully',
          data: [fbSnapshot, igSnapshot].filter(Boolean),   // ← array of up to 2 snapshots
        });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUMMARY / GENERAL — no specific platform specified
    // Run an initial fetch for any active platform that has no snapshots yet,
    // then return all snapshots for this user from the DB.
    // ─────────────────────────────────────────────────────────────────────────
    let activePlatforms = platform
      ? [platform]
      : (req.user.socialAccounts || [])
          .filter(acc => acc.isActive)
          .map(acc => acc.platform);

    // Expand 'meta' into its two constituent platforms
    if (activePlatforms.includes('meta')) {
      activePlatforms = activePlatforms.filter(p => p !== 'meta');
      activePlatforms.push('facebook', 'instagram');
    }

    // Initial fetch for platforms with zero stored snapshots
    for (const p of activePlatforms) {
      const count = await AnalyticsSnapshot.countDocuments({ incubationCenterId: userId, platform: p });
      if (count === 0) {
        try {
          if (p === 'youtube')   await fetchAndSaveYouTubeAnalytics(userId);
          if (p === 'facebook')  await fetchAndSaveFacebookAnalytics(userId);
          if (p === 'instagram') await fetchAndSaveInstagramAnalytics(userId);
        } catch (err) {
          console.error(`❌ Initial fetch failed for ${p}:`, err.message);
        }
      }
    }

    // Build DB query with optional date filtering
    const query = { incubationCenterId: userId };
    if (platform && platform !== 'meta') {
      query.platform = platform;
    } else if (platform === 'meta') {
      query.platform = { $in: ['facebook', 'instagram', 'meta'] };
    }

    if (startDate || endDate) {
      query.snapshotDate = {};
      if (startDate) query.snapshotDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.snapshotDate.$lte = end;
      }
    }

    const data = await AnalyticsSnapshot.find(query)
      .sort({ snapshotDate: -1 })
      .limit(30);

    return res.json({
      message: 'Analytics retrieved successfully',
      data,                        // ← array for the general summary view
    });

  } catch (err) {
    next(err);
  }
};

const getCombinedAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Fetch all snapshots for the past 7 days for the user
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const snapshots = await AnalyticsSnapshot.find({
      incubationCenterId: userId,
      snapshotDate: { $gte: sevenDaysAgo }
    }).sort({ snapshotDate: 1 }); // Ascending for timeline processing

    const activePlatforms = (req.user.socialAccounts || [])
      .filter(acc => acc.isActive)
      .map(acc => acc.platform);

    const platforms = ['youtube', 'linkedin', 'facebook', 'instagram'].filter(p => {
      if (p === 'facebook' || p === 'instagram') return activePlatforms.includes('meta') || activePlatforms.includes(p);
      return activePlatforms.includes(p);
    });
    
    // 1. Current Totals & Platform specific latest metrics
    const platformLatest = {};
    const platformHistory = { youtube: [], linkedin: [], facebook: [], instagram: [] };

    // Group by platform and build history
    snapshots.forEach(snapshot => {
      const p = snapshot.platform;
      if (!platforms.includes(p)) return;
      
      const dateStr = snapshot.snapshotDate.toISOString().split('T')[0];
      
      let reach = 0;
      let engagement = 0;
      
      if (p === 'youtube') {
        reach = snapshot.metrics.views || 0;
        engagement = snapshot.metrics.likes + snapshot.metrics.comments + snapshot.metrics.shares;
      } else if (p === 'linkedin') {
        reach = snapshot.metrics.impressions || 0;
        engagement = snapshot.metrics.reactions + snapshot.metrics.comments + snapshot.metrics.shares;
      } else if (p === 'facebook') {
        reach = snapshot.metrics.page_impressions || 0;
        engagement = snapshot.metrics.page_engaged_users || 0;
      } else if (p === 'instagram') {
        reach = snapshot.metrics.reach || 0;
        engagement = snapshot.metrics.total_interactions || 0;
      }

      platformHistory[p].push({
        date: dateStr,
        reach,
        engagement,
        followers: snapshot.metrics.subscribers || snapshot.metrics.follower_count || snapshot.metrics.followers_count || 0
      });
      
      // Keep replacing with the latest to get the most recent metrics at the end
      platformLatest[p] = snapshot;
    });

    // 2. Aggregate Totals
    let totalFollowers = 0;
    let totalReach = 0;
    let totalImpressions = 0;
    let totalEngagement = 0;
    let totalPosts = 0;
    let totalProfileViews = 0;
    let totalClicks = 0;

    const platformSummaries = {};

    platforms.forEach(p => {
      const latest = platformLatest[p];
      let followers = 0, reach = 0, impressions = 0, engagement = 0, posts = 0;
      
      if (latest) {
        if (p === 'youtube') {
          followers = latest.metrics.subscribers || 0;
          reach = latest.metrics.views || 0;
          impressions = latest.metrics.views || 0; // fallback
          engagement = (latest.metrics.likes || 0) + (latest.metrics.comments || 0) + (latest.metrics.shares || 0);
          posts = latest.metrics.videoCount || 0;
        } else if (p === 'linkedin') {
          followers = latest.metrics.follower_count || 0;
          reach = latest.metrics.impressions || 0; // fallback
          impressions = latest.metrics.impressions || 0;
          engagement = (latest.metrics.reactions || 0) + (latest.metrics.comments || 0) + (latest.metrics.shares || 0);
        } else if (p === 'facebook') {
          followers = latest.metrics.followers_count || 0;
          reach = latest.metrics.page_impressions || 0;
          impressions = latest.metrics.page_impressions || 0;
          engagement = latest.metrics.page_engaged_users || 0;
          posts = latest.metrics.posts_count || 0;
        } else if (p === 'instagram') {
          followers = latest.metrics.followers_count || 0;
          reach = latest.metrics.reach || 0;
          impressions = latest.metrics.impressions || 0;
          engagement = latest.metrics.total_interactions || 0;
          posts = latest.metrics.media_count || 0;
          totalProfileViews += latest.metrics.profile_views || 0;
        }

        totalFollowers += followers;
        totalReach += reach;
        totalImpressions += impressions;
        totalEngagement += engagement;
        totalPosts += posts;
      }
      
      platformSummaries[p] = { followers, reach, engagement, posts };
    });

    const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) : 0;

    // 3. Build Timeline Array for Recharts
    // Generate an array of the last 7 dates
    const timeline = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayData = { date: dateStr };
      platforms.forEach(p => {
        // Find the closest snapshot on or before this date
        const hist = platformHistory[p].filter(h => h.date <= dateStr);
        const closest = hist[hist.length - 1] || { reach: 0, engagement: 0 };
        dayData[`${p}Reach`] = closest.reach;
        dayData[`${p}Engagement`] = closest.engagement;
      });
      
      timeline.push(dayData);
    }

    return res.json({
      message: 'Combined analytics retrieved successfully',
      data: {
        totals: {
          followers: totalFollowers,
          reach: totalReach,
          impressions: totalImpressions,
          engagement: totalEngagement,
          posts: totalPosts,
          profileViews: totalProfileViews,
          clicks: totalClicks,
          engagementRate
        },
        platformSummaries,
        timeline,
        sparklines: platformHistory // For mini sparkline charts
      }
    });

  } catch (err) {
    next(err);
  }
};

export default { getAnalyticsSummary, getCombinedAnalytics };