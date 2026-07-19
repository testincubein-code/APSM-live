import api from "./api";

// ── Cache management and fetch wrapper ────────────────────────────────
let snapshotCache = null;
let cacheTime = null;

<<<<<<< HEAD
const getCachedSnapshot = async () => {
  if (snapshotCache && cacheTime && (Date.now() - cacheTime < 5000)) {
    return snapshotCache;
  }
  try {
    const response = await api.get("/analytics/facebook");
=======
const getCachedSnapshot = async (forceRefresh = false) => {
  if (!forceRefresh && snapshotCache && cacheTime && (Date.now() - cacheTime < 5000)) {
    return snapshotCache;
  } 
  try {
    const url = forceRefresh ? "/analytics/meta/facebook?forceRefresh=true" : "/analytics/meta/facebook";
    const response = await api.get(url);
>>>>>>> origin/main
    snapshotCache = response.data?.data || null;
    cacheTime = Date.now();
    return snapshotCache;
  } catch (err) {
    console.warn("Failed to fetch Facebook analytics from API:", err.message);
    return null;
  }
};

<<<<<<< HEAD
const getFbSnapshotData = async () => {
  const snapshot = await getCachedSnapshot();
=======
const getFbSnapshotData = async (forceRefresh = false) => {
  const snapshot = await getCachedSnapshot(forceRefresh);
>>>>>>> origin/main
  return snapshot || {};
};

// ── Utility: Number formatter (compact notation) ──────────────────────────────
export const formatNumber = (num) => {
  if (num === undefined || num === null) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(num);
};

// ── Utility: Date filtering helper ────────────────────────────────────────────
const filterByDateRange = (arr, dateRange) => {
  if (!dateRange || !arr) return arr || [];
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  return arr.filter((item) => {
    const d = new Date(
      item.date || item.end_time?.split("T")[0] || item.day
    );
    return d >= start && d <= end;
  });
};

const fbapi = {
  getProfile: async () => {
    try {
      const res = await api.get("/auth/status");
      const statusArr = res.data?.status ?? [];
      const fbStatus = statusArr.find((s) => s.platform === "facebook");
      const isConnected = !!(fbStatus?.connected && !fbStatus?.isExpired);
<<<<<<< HEAD
      
      if (!isConnected) {
        return { isConnected: false, profile: null };
      }
      
      const data = await getFbSnapshotData();
      const fb = data.rawPlatformData?.facebook || {};
      
=======

      if (!isConnected) {
        return { isConnected: false, profile: null };
      }

      const data = await getFbSnapshotData();
      const fb = data.rawPlatformData?.facebook || {};

>>>>>>> origin/main
      return {
        isConnected,
        profile: {
          name: fbStatus.username || fb.pageName || "Facebook Page",
          pageId: fb.pageId || "fb_page",
          handle: "@facebookpage",
          category: "Business",
          avatar: "",
          pageLikes: data.metrics?.followers || fb.fanCount || 0,
          followers: data.metrics?.followers || 0,
          reach: data.metrics?.reach || 0,
<<<<<<< HEAD
          totalPosts: (data.extended?.contentData?.posts?.length || 0) + (data.extended?.contentData?.videos?.length || 0),
=======
          totalPosts: fb.posts?.length || 0,
>>>>>>> origin/main
        },
      };
    } catch (err) {
      console.error("Failed to fetch Facebook profile:", err);
      throw err;
    }
  },

<<<<<<< HEAD
  getOverviewMetrics: async (dateRange = null) => {
    const fb = await getFbSnapshotData();
=======
  getOverviewMetrics: async (dateRange = null, forceRefresh = false) => {
    const fb = await getFbSnapshotData(forceRefresh);
>>>>>>> origin/main
    const insights = fb.rawPlatformData?.facebook?.insights || [];

    const sumMetric = (name) =>
      insights
        .find((m) => m.name === name)
        ?.values?.reduce((a, b) => a + (b.value || 0), 0) || 0;

    const chartSeries = (name) => {
      const metric = insights.find((m) => m.name === name);
      if (!metric?.values) return [];
      const raw = metric.values.map((v) => ({
        date: v.end_time?.split("T")[0] || "",
        value: v.value || 0,
      }));
      return dateRange ? filterByDateRange(raw, dateRange) : raw;
    };

    const engagements = insights.find((m) => m.name === "page_post_engagements")?.values || [];
    const impressions = insights.find((m) => m.name === "page_impressions")?.values || [];
    const engagementRateData = engagements.map((e, i) => ({
      date: e.end_time?.split("T")[0] || "",
      rate: impressions[i]?.value
        ? +((e.value / impressions[i].value) * 100).toFixed(2)
        : 0,
    }));
    const filteredEngRate = dateRange
      ? filterByDateRange(engagementRateData, dateRange)
      : engagementRateData;
<<<<<<< HEAD
    const avgEngRate =
      filteredEngRate.length > 0
        ? (
            filteredEngRate.reduce((a, b) => a + b.rate, 0) /
            filteredEngRate.length
          ).toFixed(2) + "%"
        : "N/A";

    const allPosts = fb.extended?.contentData?.posts || [];
    const allVideos = fb.extended?.contentData?.videos || [];
=======

    const rawPosts = fb.rawPlatformData?.facebook?.posts || [];
    const followers = fb.metrics?.followers || fb.rawPlatformData?.facebook?.fanCount || 1;

    const formattedPosts = rawPosts.map((p) => {
      const attachType = p.attachments?.data?.[0]?.type || "";
      const isVideo = attachType.includes("video") || p.attachments?.data?.[0]?.media_type === "video";
      const isLink = attachType === "share" || attachType === "link" || p.attachments?.data?.[0]?.url;
      const type = isVideo ? "Videos" : (isLink ? "Links" : (p.full_picture ? "Photos" : "Text"));
      const postLikes = p.likes?.summary?.total_count || 0;
      const postComments = p.comments?.summary?.total_count || 0;
      const postShares = p.shares?.count || 0;
      const postEngagements = postLikes + postComments + postShares;
      return {
        id: p.id,
        title: p.message || (isVideo ? "Untitled Video" : "Untitled Post"),
        image: p.full_picture || "https://placehold.co/150",
        date: p.created_time ? new Date(p.created_time).toISOString().split("T")[0] : "",
        reach: 0,
        impressions: 0,
        engagements: postEngagements,
        reactions: postLikes,
        likes: postLikes,
        comments: postComments,
        shares: postShares,
        type: type,
        rate: followers ? `${((postEngagements / followers) * 100).toFixed(1)}%` : "0%",
        duration: isVideo ? "0:00" : undefined,
        views: 0,
        watchTime: "0:00"
      };
    });

    const allPosts = formattedPosts.filter(p => p.type !== "Videos");
    const allVideos = formattedPosts.filter(p => p.type === "Videos");
>>>>>>> origin/main
    const topPosts = dateRange
      ? filterByDateRange(allPosts, dateRange)
      : allPosts;
    const topVideos = dateRange
      ? filterByDateRange(allVideos, dateRange)
      : allVideos;

    let reachOverTime = chartSeries("page_impressions");
    if (reachOverTime.length === 0) {
      reachOverTime = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { date: d.toISOString().split("T")[0], value: 0 };
      });
    }

    let engagementsOverTime = chartSeries("page_post_engagements");
    if (engagementsOverTime.length === 0) {
<<<<<<< HEAD
      engagementsOverTime = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { date: d.toISOString().split("T")[0], value: 0 };
      });
=======
      const byDate = {};
      const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
      dates.forEach(d => { byDate[d] = 0; });

      formattedPosts.forEach(p => {
        if (p.date && byDate[p.date] !== undefined) {
          byDate[p.date] += p.engagements;
        }
      });
      engagementsOverTime = Object.entries(byDate).map(([date, value]) => ({ date, value }));
>>>>>>> origin/main
    }

    let finalEngRateData = filteredEngRate;
    if (finalEngRateData.length === 0) {
<<<<<<< HEAD
      finalEngRateData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { date: d.toISOString().split("T")[0], rate: 0 };
      });
    }

    return {
      kpis: {
        pageLikes:       { value: fb.metrics?.followers || 0,                            change: 0  },
        postReach:       { value: fb.metrics?.reach || 0,                                change: 0  },
        postEngagements: { value: fb.metrics?.totalEngagement || sumMetric("page_post_engagements"), change: 0 },
        reactions:       { value: Math.round((fb.metrics?.totalEngagement || sumMetric("page_post_engagements")) * 0.6), change: 0 },
        comments:        { value: Math.round((fb.metrics?.totalEngagement || sumMetric("page_post_engagements")) * 0.2), change: 0 },
        shares:          { value: Math.round((fb.metrics?.totalEngagement || sumMetric("page_post_engagements")) * 0.2), change: 0 },
=======
      const byDate = {};
      const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
      dates.forEach(d => { byDate[d] = 0; });

      formattedPosts.forEach(p => {
        if (p.date && byDate[p.date] !== undefined) {
          byDate[p.date] += p.engagements;
        }
      });
      finalEngRateData = Object.entries(byDate).map(([date, eng]) => ({
        date,
        rate: +((eng / followers) * 100).toFixed(2)
      }));
    }

    const totalPostLikes = rawPosts.reduce((sum, p) => sum + (p.likes?.summary?.total_count || 0), 0);
    const totalPostComments = rawPosts.reduce((sum, p) => sum + (p.comments?.summary?.total_count || 0), 0);
    const totalPostShares = rawPosts.reduce((sum, p) => sum + (p.shares?.count || 0), 0);
    const totalPostEngagement = totalPostLikes + totalPostComments + totalPostShares;

    const avgEngRate =
      filteredEngRate.length > 0
        ? (
          filteredEngRate.reduce((a, b) => a + b.rate, 0) /
          filteredEngRate.length
        ).toFixed(2) + "%"
        : (followers && totalPostEngagement ? ((totalPostEngagement / followers) * 100).toFixed(2) + "%" : "0.00%");

    return {
      kpis: {
        pageLikes: { value: fb.metrics?.followers || fb.rawPlatformData?.facebook?.fanCount || 0, change: 0 },
        postReach: { value: fb.metrics?.reach || 0, change: 0 },
        postEngagements: { value: fb.metrics?.totalEngagement || totalPostEngagement || sumMetric("page_post_engagements"), change: 0 },
        reactions: { value: totalPostLikes || Math.round((fb.metrics?.totalEngagement || sumMetric("page_post_engagements")) * 0.6), change: 0 },
        comments: { value: totalPostComments || Math.round((fb.metrics?.totalEngagement || sumMetric("page_post_engagements")) * 0.2), change: 0 },
        shares: { value: totalPostShares || Math.round((fb.metrics?.totalEngagement || sumMetric("page_post_engagements")) * 0.2), change: 0 },
>>>>>>> origin/main
      },
      charts: {
        reachOverTime,
        engagementsOverTime,
        engagementRate: {
<<<<<<< HEAD
          rate: avgEngRate !== "N/A" ? avgEngRate : "0%",
=======
          rate: avgEngRate,
>>>>>>> origin/main
          change: 0,
          data: finalEngRateData,
        },
      },
      tables: {
        topPosts,
        topVideos,
      },
      reachBySource: [],
      audience: {
        ageGender: (fb.demographics?.ageAndGender || []).map((a) => ({
          group: a.group,
          value: a.count,
        })),
        topCountries: (fb.demographics?.topCountries || []).map((c) => ({
          country: c.name,
          value: Math.round(
            (c.count / (fb.metrics?.followers || 1)) * 100
          ),
        })),
      },
    };
  },

  getAudienceMetrics: async () => {
    const fb = await getFbSnapshotData();
    const demographics = fb.demographics || {};
    const details = fb.extended?.audienceDetails || {};
<<<<<<< HEAD
    
    return {
      totalGrowth: details.totalGrowth || "",
      ageAndGender: demographics.ageAndGender?.length > 0 
        ? demographics.ageAndGender.map(a => ({ group: a.group, value: a.count }))
        : [],
      topLocations: demographics.topCountries?.length > 0
        ? demographics.topCountries.map(c => ({ name: c.name, value: c.count }))
        : [],
      topInterests: details.topInterests || [],
    };
  },

  getEngagementMetrics: async () => {
    const fb = await getFbSnapshotData();
    const details = fb.extended?.engagementDetails || {};
    const metrics = fb.metrics || {};
    
    let engagementTrend = details.engagementTrend || [];
=======

    // Process Age & Gender: split "F.18-24" into female/male properties for Recharts side-by-side bars
    let ageAndGender = [];
    if (demographics.ageAndGender?.length > 0) {
      const groups = {};
      demographics.ageAndGender.forEach(item => {
        const [gender, bracket] = item.group.split('.'); // e.g., F, 18-24
        const ageBracket = bracket || item.group;
        if (!groups[ageBracket]) {
          groups[ageBracket] = { group: ageBracket, female: 0, male: 0 };
        }
        if (gender === 'F') {
          groups[ageBracket].female = item.count;
        } else if (gender === 'M') {
          groups[ageBracket].male = item.count;
        } else {
          groups[ageBracket].female = item.count;
        }
      });
      ageAndGender = Object.values(groups);
    }

    // Process Top Locations: compute percentage and return key "location" expected by FacebookAudience.jsx
    const totalCount = demographics.topCountries?.reduce((sum, c) => sum + (c.count || 0), 0) || 1;
    let topLocations = [];
    if (demographics.topCountries?.length > 0) {
      topLocations = demographics.topCountries.map(c => ({
        location: c.name === 'IN' ? 'India' : (c.name === 'US' ? 'United States' : c.name),
        value: Math.round((c.count / totalCount) * 100)
      }));
    }

    return {
      totalGrowth: details.totalGrowth || "",
      ageAndGender,
      topLocations,
      topInterests: details.topInterests || [],
    };
  },
  getEngagementMetrics: async () => {
    const fb = await getFbSnapshotData();
    const metrics = fb.metrics || {};
    const posts = fb.rawPlatformData?.facebook?.posts || [];

    // Derive engagement trend by grouping posts by date
    const byDate = {};
    posts.forEach(p => {
      const date = p.created_time ? new Date(p.created_time).toISOString().split("T")[0] : null;
      if (!date) return;
      if (!byDate[date]) byDate[date] = { date, likes: 0, comments: 0, shares: 0, total: 0 };
      const likes = p.likes?.summary?.total_count || 0;
      const comments = p.comments?.summary?.total_count || 0;
      const shares = p.shares?.count || 0;
      byDate[date].likes += likes;
      byDate[date].comments += comments;
      byDate[date].shares += shares;
      byDate[date].total += likes + comments + shares;
    });

    let engagementTrend = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
>>>>>>> origin/main
    if (engagementTrend.length === 0) {
      engagementTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
<<<<<<< HEAD
        return {
          date: d.toISOString().split("T")[0],
          likes: 0,
          comments: 0,
          shares: 0
        };
      });
    }

    return {
      kpis: {
        totalLikes: Math.round((metrics.totalEngagement || 0) * 0.6),
        totalComments: Math.round((metrics.totalEngagement || 0) * 0.2),
        totalShares: Math.round((metrics.totalEngagement || 0) * 0.2),
      },
      engagementTrend,
      reactionTypes: details.reactionTypes || [],
=======
        return { date: d.toISOString().split("T")[0], likes: 0, comments: 0, shares: 0, total: 0 };
      });
    }

    // Compute real totals from posts
    const totalLikes = posts.reduce((a, p) => a + (p.likes?.summary?.total_count || 0), 0);
    const totalComments = posts.reduce((a, p) => a + (p.comments?.summary?.total_count || 0), 0);
    const totalShares = posts.reduce((a, p) => a + (p.shares?.count || 0), 0);

    // Derive reaction types from actual counts
    const reactionTypes = [];
    if (totalLikes > 0) reactionTypes.push({ name: "Likes", value: totalLikes });
    if (totalComments > 0) reactionTypes.push({ name: "Comments", value: totalComments });
    if (totalShares > 0) reactionTypes.push({ name: "Shares", value: totalShares });

    return {
      kpis: {
        totalLikes: totalLikes || Math.round((metrics.totalEngagement || 0) * 0.6),
        totalComments: totalComments || Math.round((metrics.totalEngagement || 0) * 0.2),
        totalShares: totalShares || Math.round((metrics.totalEngagement || 0) * 0.2),
      },
      engagementTrend,
      reactionTypes,
>>>>>>> origin/main
    };
  },

  getPageLikesMetrics: async () => {
    const fb = await getFbSnapshotData();
<<<<<<< HEAD
    const growth = fb.extended?.growth || {};
    const metrics = fb.metrics || {};
    
    let followerGrowthTimeline = growth.followerGrowthTimeline || [];
    if (followerGrowthTimeline.length === 0) {
      followerGrowthTimeline = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return {
          date: d.toISOString().split("T")[0],
          gained: 0,
          lost: 0,
          net: 0
        };
      });
    }
    
    return {
      gained: Math.round((metrics.followers || 0) * 0.05) || growth.gained || 0,
      lost: Math.round((metrics.followers || 0) * 0.01) || growth.lost || 0,
      net: Math.round((metrics.followers || 0) * 0.04) || growth.net || 0,
=======
    const metrics = fb.metrics || {};
    const currentFollowers = metrics.followers || 0;

    // Generate a flat timeline at the current follower count
    // (daily gained/lost data requires page_fan_adds/page_fan_removes insights which aren't fetched)
    const followerGrowthTimeline = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return {
        date: d.toISOString().split("T")[0],
        gained: 0,
        lost: 0,
        unfollows: 0,
        net: 0,
        followers: currentFollowers
      };
    });

    return {
      gained: 0,
      lost: 0,
      net: 0,
>>>>>>> origin/main
      followerGrowthTimeline,
    };
  },

  getReachViewsMetrics: async () => {
    const fb = await getFbSnapshotData();
<<<<<<< HEAD
    let timeline = fb.extended?.reachAndViews || [];
=======
    const insights = fb.rawPlatformData?.facebook?.insights || [];
    const metrics = fb.metrics || {};

    // Derive reach timeline from page_impressions insight daily values
    const impressionsMetric = insights.find(m => m.name === "page_impressions");
    let timeline = [];
    if (impressionsMetric?.values?.length > 0) {
      timeline = impressionsMetric.values.map(v => ({
        date: v.end_time?.split("T")[0] || "",
        organicReach: v.value || 0,
        paidReach: 0,
        threeSecondViews: 0,
        oneMinuteViews: 0
      }));
    }

>>>>>>> origin/main
    if (timeline.length === 0) {
      timeline = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toISOString().split("T")[0],
          organicReach: 0,
          paidReach: 0,
          threeSecondViews: 0,
          oneMinuteViews: 0
        };
      });
    }
<<<<<<< HEAD
    const metrics = fb.metrics || {};
    
    const totals = timeline.reduce(
      (acc, d) => {
        acc.totalReach    += d.organicReach + d.paidReach;
        acc.organicReach  += d.organicReach;
        acc.paidReach     += d.paidReach;
        acc.total3s       += d.threeSecondViews;
        acc.total1m       += d.oneMinuteViews;
        return acc;
      },
      { totalReach: 0, organicReach: 0, paidReach: 0, total3s: 0, total1m: 0 }
    );
    return {
      kpis: {
        totalReach:    { value: metrics.reach || totals.totalReach,   change: 0 },
        organicReach:  { value: Math.round((metrics.reach || totals.totalReach) * 0.8) || totals.organicReach, change: 0 },
        videoViews:    { value: Math.round((metrics.impressions || totals.totalReach) * 0.3) || totals.total3s,      change: 0 },
=======

    const totals = timeline.reduce(
      (acc, d) => {
        acc.totalReach += (d.organicReach || 0) + (d.paidReach || 0);
        acc.organicReach += d.organicReach || 0;
        return acc;
      },
      { totalReach: 0, organicReach: 0 }
    );

    return {
      kpis: {
        totalReach: { value: metrics.reach || totals.totalReach, change: 0 },
        organicReach: { value: metrics.reach || totals.organicReach, change: 0 },
        videoViews: { value: metrics.impressions || 0, change: 0 },
>>>>>>> origin/main
      },
      timeline,
    };
  },

  getVideosMetrics: async () => {
    const fb = await getFbSnapshotData();
<<<<<<< HEAD
    const videos = fb.extended?.contentData?.videos || [];
    return {
      kpis: {
        totalVideos:  videos.length,
        totalPlays:   videos.reduce((a, v) => a + (v.plays || 0), 0),
=======
    const posts = fb.rawPlatformData?.facebook?.posts || [];

    // Extract video posts from raw posts data
    const videos = posts
      .filter(p => {
        const type = p.attachments?.data?.[0]?.type;
        return type === "video_inline" || type === "video_autoplay";
      })
      .map(p => ({
        id: p.id,
        title: p.message || "Untitled Video",
        image: p.full_picture || "",
        date: p.created_time ? new Date(p.created_time).toISOString().split("T")[0] : "",
        plays: 0,
        watchTime: "0:00",
        threeSecondViews: 0,
        oneMinuteViews: 0,
        rate: "N/A",
        likes: p.likes?.summary?.total_count || 0,
        comments: p.comments?.summary?.total_count || 0,
        shares: p.shares?.count || 0,
      }));

    return {
      kpis: {
        totalVideos: videos.length,
        totalPlays: videos.reduce((a, v) => a + (v.plays || 0), 0),
>>>>>>> origin/main
        avgWatchTime: "0:00",
        topRetention: "0%",
      },
      videos,
    };
  },

  getStoriesMetrics: async () => {
    const fb = await getFbSnapshotData();
<<<<<<< HEAD
    const stories = fb.extended?.contentData?.stories || [];
    return {
      kpis: {
        activeStories:    stories.length,
        avgReach:         Math.round(stories.reduce((a, s) => a + (s.reach || 0), 0) / Math.max(stories.length, 1)),
        completionRate:   "0%",
        totalReplies:     stories.reduce((a, s) => a + (s.replies || 0), 0),
=======
    const rawStories = fb.rawPlatformData?.facebook?.stories || [];

    const stories = rawStories.map(s => ({
      id: s.id,
      title: `Story (${s.media_type || "Image"})`,
      image: s.media_url || "https://placehold.co/150",
      date: s.creation_time ? new Date(s.creation_time).toISOString().split("T")[0] : "",
      opens: 0,
      reach: 0,
      exits: 0,
      replies: 0,
      completionRate: "N/A"
    }));

    return {
      kpis: {
        activeStories: stories.length,
        avgReach: 0,
        completionRate: "0%",
        totalReplies: 0,
>>>>>>> origin/main
      },
      stories,
    };
  },

  getGroupsMetrics: async () => {
<<<<<<< HEAD
    const fb = await getFbSnapshotData();
    const groups = fb.extended?.groups || {};
    return {
      kpis: {
        totalMembers:  groups.totalMembers  || 0,
        activeMembers: Math.round((groups.totalMembers || 0) * 0.45),
        postsCount:    groups.postsCount    || 0,
=======
    // Groups data is not available through the current Graph API calls
    return {
      kpis: {
        totalMembers: 0,
        activeMembers: 0,
        postsCount: 0,
>>>>>>> origin/main
      },
      growthTimeline: [],
      recentPosts: [],
    };
  },

  getAdsMetrics: async () => {
    const fb = await getFbSnapshotData();
<<<<<<< HEAD
    const ads = fb.extended?.ads || [];
    const totals = ads.reduce(
      (acc, a) => {
        acc.spend       += a.spend       || 0;
        acc.clicks      += a.clicks      || 0;
        acc.impressions += a.impressions || 0;
        return acc;
      },
      { spend: 0, clicks: 0, impressions: 0 }
    );
    const avgCpc = totals.clicks > 0
      ? (totals.spend / totals.clicks).toFixed(2)
      : "0.00";
    return {
      kpis: {
        totalSpend:   { value: `₹${totals.spend.toLocaleString()}`, change: 0 },
        impressions:  { value: totals.impressions,                   change: 0 },
        linkClicks:   { value: totals.clicks,                        change: 0 },
        avgCpc:       { value: `₹${avgCpc}`,                         change: 0 },
      },
      campaigns: ads.map((a) => ({
        campaignName: a.name,
        status:       a.status === "ACTIVE" ? "Active" : "Paused",
        spend:        `₹${(a.spend || 0).toLocaleString()}`,
        impressions:  (a.impressions || 0).toLocaleString(),
        ctr:          a.clicks && a.impressions
          ? `${((a.clicks / a.impressions) * 100).toFixed(2)}%`
          : "N/A",
        cpc:          a.clicks
          ? `₹${((a.spend || 0) / a.clicks).toFixed(2)}`
          : "N/A",
      })),
=======
    const adsData = fb.ads || {};

    return {
      kpis: {
        totalSpend: { value: `₹${(adsData.totalSpend || 0).toLocaleString()}`, change: 0 },
        impressions: { value: adsData.adImpressions || 0, change: 0 },
        linkClicks: { value: 0, change: 0 },
        avgCpc: { value: `₹${(adsData.costPerClick || 0).toFixed(2)}`, change: 0 },
      },
      campaigns: [],
>>>>>>> origin/main
    };
  },

  getReportsData: async () => {
<<<<<<< HEAD
    const fb = await getFbSnapshotData();
    const exports_ = fb.extended?.utilityData?.recentExports || [];
    return {
      recentExports: exports_.map((e) => ({
        ...e,
        type:   e.name?.endsWith(".pdf") ? "PDF" : "XLSX",
        status: "Ready",
        report: e.name,
      })),
=======
    // No report generation system exists yet
    return {
      recentExports: [],
>>>>>>> origin/main
    };
  },

  getInsightsData: async () => {
    const fb = await getFbSnapshotData();
<<<<<<< HEAD
    const insights = fb.extended?.insights || [];
    return {
      highlights: {
        bestTimeToPost:        "N/A",
        topPerformingFormat:   "N/A",
        topAudienceSegment:    "N/A",
        recommendedContentType:"N/A",
      },
      recommendations: insights.map((i) => ({
        type:           i.type,
        recommendation: i.recommendation,
      })),
=======
    const posts = fb.rawPlatformData?.facebook?.posts || [];
    const demographics = fb.demographics || {};

    // Compute best time to post from actual post timestamps
    let bestTimeToPost = "N/A";
    if (posts.length > 0) {
      const hourCounts = {};
      posts.forEach(p => {
        if (!p.created_time) return;
        const date = new Date(p.created_time);
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getUTCDay()];
        const hour = date.getUTCHours();
        const ampm = hour >= 12 ? "PM" : "AM";
        const h12 = hour % 12 || 12;
        const key = `${dayName} ${h12}:00 ${ampm}`;
        const eng = (p.likes?.summary?.total_count || 0) + (p.comments?.summary?.total_count || 0);
        hourCounts[key] = (hourCounts[key] || 0) + eng;
      });
      const sorted = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) bestTimeToPost = sorted[0][0];
    }

    // Compute top performing format
    let topPerformingFormat = "N/A";
    if (posts.length > 0) {
      const formatCounts = { Photos: 0, Videos: 0, Text: 0 };
      posts.forEach(p => {
        const type = p.attachments?.data?.[0]?.type;
        if (type === "video_inline" || type === "video_autoplay") formatCounts.Videos++;
        else if (p.full_picture) formatCounts.Photos++;
        else formatCounts.Text++;
      });
      const sorted = Object.entries(formatCounts).sort((a, b) => b[1] - a[1]);
      if (sorted[0][1] > 0) topPerformingFormat = sorted[0][0];
    }

    // Compute top audience segment from demographics
    let topAudienceSegment = "N/A";
    if (demographics.ageAndGender?.length > 0) {
      const sorted = [...demographics.ageAndGender].sort((a, b) => (b.count || 0) - (a.count || 0));
      if (sorted[0]) topAudienceSegment = sorted[0].group;
    }

    // Generate actionable recommendations from real data
    const recommendations = [];
    if (posts.length > 0) {
      const totalEng = posts.reduce((a, p) => a + (p.likes?.summary?.total_count || 0) + (p.comments?.summary?.total_count || 0) + (p.shares?.count || 0), 0);
      const avgEng = totalEng / posts.length;

      if (avgEng < 5) {
        recommendations.push({ type: "ENGAGEMENT", recommendation: "Your average engagement per post is low. Try posting more visual content like photos and short videos." });
      }
      if (bestTimeToPost !== "N/A") {
        recommendations.push({ type: "TIME", recommendation: `Your posts get the most engagement around ${bestTimeToPost}. Consider scheduling future posts at this time.` });
      }
      if (topPerformingFormat !== "N/A") {
        recommendations.push({ type: "CONTENT", recommendation: `${topPerformingFormat} are your most-posted format. Diversify your content mix for broader reach.` });
      }
    }
    if (recommendations.length === 0) {
      recommendations.push({ type: "GENERAL", recommendation: "Start posting regularly to generate insights and recommendations for your page." });
    }

    return {
      highlights: {
        bestTimeToPost,
        topPerformingFormat,
        topAudienceSegment,
        recommendedContentType: topPerformingFormat === "Photos" ? "Videos" : "Photos",
      },
      recommendations,
>>>>>>> origin/main
    };
  },

  revokeAccess: async () => {
    const res = await api.delete("/auth/facebook/revoke");
    return res.data;
  },
};

export default fbapi;
