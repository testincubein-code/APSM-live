// ── YouTube Analytics API Service ───────────────────────────────────
// Centralised service for all YouTube analytics data fetching.
// Uses the shared Axios instance from lib/api.js (with JWT + proxy).
// All YouTube API integrations MUST go through this file.

// ── Imports ──────────────────────────────────────────────────────────
import api from "@/services/api";
// ── Connection Status ───────────────────────────────────────────────
// Check whether the user's YouTube account is connected via OAuth.
export const fetchYouTubeStatus = async () => {
  const res = await api.get("/auth/status");
  const status = res.data.status?.find((p) => p.platform === "youtube");
  return {
    connected: status?.connected ?? false,
    username: status?.username ?? "",
    expiresAt: status?.expiresAt ?? null,
    isExpired: status?.isExpired ?? false,
  };
};

let snapshotCache = null;
let cacheTime = null;

const getCachedSnapshot = async (force = false) => {
  if (!force && snapshotCache && cacheTime && (Date.now() - cacheTime < 5000)) {
    return snapshotCache;
  }
  const url = force ? "/analytics/youtube?forceRefresh=true" : "/analytics/youtube";
  const response = await api.get(url);
  snapshotCache = response.data?.data || null;
  cacheTime = Date.now();
  return snapshotCache;
};

// ── Fetch Full YouTube Analytics Snapshot ────────────────────────────
// Calls GET /analytics/youtube which triggers a fresh YouTube API fetch
// on the backend, or returns the latest cached snapshot.
export const fetchYouTubeAnalytics = async (force = false, options = null) => {
  try {
    const snapshot = await getCachedSnapshot(force);
    if (!snapshot) return null;
    return snapshot;
  } catch (err) {
    console.error("Failed to fetch YouTube analytics:", err);
    throw err;
  }
};

// ── Connect YouTube (OAuth redirect) ────────────────────────────────
// Redirects the browser to the backend OAuth initiation endpoint.
export const connectYouTube = () => {
  const token = localStorage.getItem("incubein_token");
  const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
  // Save current path to localStorage so Settings trampoline can route back
  localStorage.setItem("returnPath", window.location.pathname);
  window.location.href = `${baseUrl}/auth/youtube?token=${token}`;
};

// ── Revoke YouTube Access ───────────────────────────────────────────
// Disconnects the YouTube account from the user's profile.
export const revokeYouTube = async () => {
  await api.delete("/auth/youtube/revoke");
};

// ─────────────────────────────────────────────────────────────────────
// DATA PARSERS — Transform raw API snapshot into UI-ready structures
// ─────────────────────────────────────────────────────────────────────

// ── Parse Channel Information ───────────────────────────────────────
// Extracts channel name, thumbnail, and description from rawPlatformData.
export const parseChannelInfo = (snapshot) => {
  const channel = snapshot?.rawPlatformData?.channelDetails;
  const snippet = channel?.snippet || {};
  const statistics = channel?.statistics || {};

  return {
    title: snippet.title || "YouTube Channel",
    description: snippet.description || "",
    thumbnail: snippet.thumbnails?.default?.url || snippet.thumbnails?.medium?.url || "",
    customUrl: snippet.customUrl || "",
    publishedAt: snippet.publishedAt || "",
    country: snippet.country || "",
    subscriberCount: parseInt(statistics.subscriberCount) || 0,
    viewCount: parseInt(statistics.viewCount) || 0,
    videoCount: parseInt(statistics.videoCount) || 0,
    hiddenSubscriberCount: statistics.hiddenSubscriberCount || false,
  };
};

// ── Parse Core KPI Metrics ──────────────────────────────────────────
// Returns the main KPI values: subscribers, views, impressions, engagement.
export const parseCoreMetrics = (snapshot) => {
  const metrics = snapshot?.metrics || {};
  const channelStats = snapshot?.rawPlatformData?.channelDetails?.statistics || {};

  // Calculate watch time from daily report if available
  let totalWatchTimeMinutes = 0;
  const daily = snapshot?.rawPlatformData?.analyticsReports?.daily;
  if (daily?.rows && Array.isArray(daily.rows) && daily?.columnHeaders) {
    const watchIdx = daily.columnHeaders.findIndex((h) => h?.name === "estimatedMinutesWatched");
    if (watchIdx !== -1) {
      for (const row of daily.rows) {
        if (Array.isArray(row)) {
          totalWatchTimeMinutes += parseInt(row[watchIdx]) || 0;
        }
      }
    }
  }

  // Calculate engagement rate: (totalEngagement / impressions) * 100
  const impressions = parseFloat(metrics.impressions) || 0;
  const totalEngagement = parseFloat(metrics.totalEngagement) || 0;
  const engagementRate =
    impressions > 0
      ? ((totalEngagement / impressions) * 100).toFixed(2)
      : "0.00";

  return {
    subscribers: parseInt(channelStats.subscriberCount) || parseInt(metrics.followers) || 0,
    totalViews: parseInt(channelStats.viewCount) || 0,
    impressions,
    reach: metrics.reach || 0,
    totalEngagement,
    watchTimeHours: Math.round(totalWatchTimeMinutes / 60),
    watchTimeMinutes: totalWatchTimeMinutes,
    engagementRate: parseFloat(engagementRate) || 0,
    videoCount: parseInt(channelStats.videoCount) || 0,
  };
};

// ── Parse Daily Analytics (for line/area charts) ────────────────────
// Converts the daily analytics report rows into chart-friendly objects.
export const parseDailyAnalytics = (snapshot) => {
  const daily = snapshot?.rawPlatformData?.analyticsReports?.daily;
  if (!daily?.rows || !Array.isArray(daily.rows) || !daily?.columnHeaders || !Array.isArray(daily.columnHeaders)) return [];

  // Build column index map for fast lookup
  const colMap = {};
  daily.columnHeaders.forEach((h, i) => {
    if (h && h.name) {
      colMap[h.name] = i;
    }
  });

  return daily.rows
    .map((row) => {
      if (!Array.isArray(row)) return null;
      const dateStr = row[colMap["day"]] || "";
      // Format date for display: "Jun 15"
      const date = dateStr ? new Date(dateStr) : new Date();
      const label = dateStr ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

      return {
        date: label,
        rawDate: dateStr,
        views: parseInt(row[colMap["views"]]) || 0,
        likes: parseInt(row[colMap["likes"]]) || 0,
        comments: parseInt(row[colMap["comments"]]) || 0,
        shares: parseInt(row[colMap["shares"]]) || 0,
        watchTime: parseInt(row[colMap["estimatedMinutesWatched"]]) || 0,
        avgViewDuration: parseInt(row[colMap["averageViewDuration"]]) || 0,
        avgViewPercentage: parseFloat(row[colMap["averageViewPercentage"]]) || 0,
        subscribersGained: parseInt(row[colMap["subscribersGained"]]) || 0,
        subscribersLost: parseInt(row[colMap["subscribersLost"]]) || 0,
      };
    })
    .filter(Boolean);
};

// Helper: parse ISO 8601 duration to seconds (e.g. PT1M15S)
const parseIsoDuration = (duration) => {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

// ── Parse Recent Videos ─────────────────────────────────────────────
// Extracts video list with thumbnails and per-video statistics.
export const parseRecentVideos = (snapshot) => {
  const videos = snapshot?.rawPlatformData?.recentVideos;
  if (!videos || !Array.isArray(videos)) return [];

  return videos
    .map((video) => {
      if (!video) return null;
      const snippet = video.snippet || {};
      const stats = video.statistics || {};
      const contentDetails = video.contentDetails || {};

      return {
        id: video.id || "",
        title: snippet.title || "Untitled Video",
        description: snippet.description || "",
        thumbnail:
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          "",
        publishedAt: snippet.publishedAt || "",
        duration: contentDetails.duration || "",
        isShort: parseIsoDuration(contentDetails.duration) > 0 && parseIsoDuration(contentDetails.duration) <= 61,
        viewCount: parseInt(stats.viewCount) || 0,
        likeCount: parseInt(stats.likeCount) || 0,
        commentCount: parseInt(stats.commentCount) || 0,
        tags: Array.isArray(snippet.tags) ? snippet.tags : [],
        categoryId: snippet.categoryId || "",
        liveBroadcastContent: snippet.liveBroadcastContent || "none",
        privacyStatus: video.status?.privacyStatus || "public",
      };
    })
    .filter(Boolean);
};

// ── Parse Country Data (for geographic charts) ──────────────────────
// Extracts top countries with view counts from demographics or reports.
export const parseCountryData = (snapshot) => {
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const formatCountryName = (code) => {
    try {
      if (code && code.length === 2) return regionNames.of(code) || code;
    } catch (e) {}
    return code || "Unknown";
  };

  // Try demographics first (pre-processed by backend)
  const topCountries = snapshot?.demographics?.topCountries;
  if (topCountries && Array.isArray(topCountries) && topCountries.length > 0) {
    return topCountries
      .map((c) => {
        if (!c) return null;
        return {
          country: formatCountryName(c.name),
          views: parseInt(c.count) || 0,
        };
      })
      .filter(Boolean);
  }

  // Fallback: parse from raw country report
  const countryReport = snapshot?.rawPlatformData?.analyticsReports?.country;
  if (!countryReport?.rows || !Array.isArray(countryReport.rows) || !countryReport?.columnHeaders || !Array.isArray(countryReport.columnHeaders)) return [];

  const colMap = {};
  countryReport.columnHeaders.forEach((h, i) => {
    if (h && h.name) {
      colMap[h.name] = i;
    }
  });

  return countryReport.rows
    .map((row) => {
      if (!Array.isArray(row)) return null;
      return {
        country: formatCountryName(row[colMap["country"]]),
        views: parseInt(row[colMap["views"]]) || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.views - a.views);
};

// ── Parse Device Data (for donut/pie charts) ────────────────────────
// Extracts device type breakdown from the device analytics report.
export const parseDeviceData = (snapshot) => {
  const deviceReport = snapshot?.rawPlatformData?.analyticsReports?.device;
  if (!deviceReport?.rows || !Array.isArray(deviceReport.rows) || !deviceReport?.columnHeaders || !Array.isArray(deviceReport.columnHeaders)) return [];

  const colMap = {};
  deviceReport.columnHeaders.forEach((h, i) => {
    if (h && h.name) {
      colMap[h.name] = i;
    }
  });

  // Device type label mapping for cleaner UI
  const deviceLabels = {
    MOBILE: "Mobile",
    DESKTOP: "Desktop",
    TABLET: "Tablet",
    TV: "Smart TV",
    GAME_CONSOLE: "Game Console",
    UNKNOWN: "Other",
  };

  return deviceReport.rows
    .map((row) => {
      if (!Array.isArray(row)) return null;
      const raw = row[colMap["deviceType"]] || "UNKNOWN";
      return {
        device: deviceLabels[raw] || raw,
        views: parseInt(row[colMap["views"]]) || 0,
        watchTime: parseInt(row[colMap["estimatedMinutesWatched"]]) || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.views - a.views);
};

// ── Parse Age & Gender Data (for demographics charts) ───────────────
// Splits the combined ageGroup_gender data into separate age and gender datasets.
export const parseAgeGenderData = (snapshot) => {
  const ageAndGender = snapshot?.demographics?.ageAndGender;
  if (!ageAndGender || !Array.isArray(ageAndGender) || ageAndGender.length === 0) return { age: [], gender: [] };

  // Aggregate by age group
  const ageMap = {};
  // Aggregate by gender
  const genderMap = {};

  for (const item of ageAndGender) {
    if (!item) continue;
    const parts = (item.group || "").split("_");
    
    // Format age group from 'age1824' to '18-24' or 'age65_' to '65+'
    let ageGroup = parts[0] || "Unknown";
    if (ageGroup.startsWith('age')) {
      const match = ageGroup.replace('age', '');
      if (match.endsWith('plus') || match.endsWith('_')) {
        ageGroup = match.replace('plus', '+').replace('_', '+');
      } else if (match.length === 4) {
        ageGroup = `${match.slice(0, 2)}-${match.slice(2)}`;
      }
    }

    const gender = parts[1] || "unknown";
    const count = parseInt(item.count) || 0;

    // Age aggregation
    if (!ageMap[ageGroup]) ageMap[ageGroup] = 0;
    ageMap[ageGroup] += count;

    // Gender aggregation
    const genderLabel = gender.toLowerCase() === "male" ? "Male" : gender.toLowerCase() === "female" ? "Female" : "Other";
    if (!genderMap[genderLabel]) genderMap[genderLabel] = 0;
    genderMap[genderLabel] += count;
  }

  // Convert to sorted arrays
  const age = Object.entries(ageMap)
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => {
      // Sort age groups naturally: 13-17, 18-24, 25-34, etc.
      const numA = parseInt(a.group) || 0;
      const numB = parseInt(b.group) || 0;
      return numA - numB;
    });

  const gender = Object.entries(genderMap).map(([label, count]) => ({
    label,
    count,
  }));

  return { age, gender };
};

// ── Parse Subscriber Growth (from daily report) ────────────────────
// Computes cumulative subscriber trend from daily gained/lost data.
export const parseSubscriberGrowth = (snapshot) => {
  const dailyData = parseDailyAnalytics(snapshot);
  if (!Array.isArray(dailyData) || dailyData.length === 0) return [];

  let cumulative = 0;
  return dailyData.map((day) => {
    if (!day) return { date: "", gained: 0, lost: 0, net: 0, cumulative };
    const net = (day.subscribersGained || 0) - (day.subscribersLost || 0);
    cumulative += net;
    return {
      date: day.date || "",
      gained: day.subscribersGained || 0,
      lost: day.subscribersLost || 0,
      net,
      cumulative,
    };
  });
};

// ── Format Number Helpers ───────────────────────────────────────────
// Utility formatters for displaying large numbers in a compact form.

// Format to compact: 1200 → "1.2K", 1500000 → "1.5M"
export const formatCompactNumber = (num) => {
  const n = parseFloat(num);
  if (num === null || num === undefined || isNaN(n)) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
};

// Format watch time: minutes → "1,234h" or "45m"
export const formatWatchTime = (minutes) => {
  const m = parseInt(minutes);
  if (minutes === null || minutes === undefined || isNaN(m)) return "0h";
  if (m < 60) return `${m}m`;
  const hours = Math.round(m / 60);
  return `${hours.toLocaleString()}h`;
};

// Format duration ISO 8601: "PT1H2M30S" → "1:02:30"
export const formatDuration = (isoDuration) => {
  if (!isoDuration || typeof isoDuration !== "string") return "--:--";
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "--:--";

  const h = parseInt(match[1]) || 0;
  const m = parseInt(match[2]) || 0;
  const s = parseInt(match[3]) || 0;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
};

// Format relative time: "2024-01-15T..." → "6 months ago"
export const formatRelativeTime = (dateString) => {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};
