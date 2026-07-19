import api from "./api";

// ── Cache management and fetch wrapper ────────────────────────────────
let snapshotCache = null;
let cacheTime = null;

const getCachedSnapshot = async (forceRefresh = false) => {
  if (!forceRefresh && snapshotCache && cacheTime && (Date.now() - cacheTime < 5000)) {
    return snapshotCache;
  } 
  try {
    const url = forceRefresh ? "/analytics/meta/facebook?forceRefresh=true" : "/analytics/meta/facebook";
    const response = await api.get(url);
    snapshotCache = response.data?.data || null;
    cacheTime = Date.now();
    return snapshotCache;
  } catch (err) {
    console.warn("Failed to fetch Facebook analytics from API:", err.message);
    return null;
  }
};

const getFbSnapshotData = async (forceRefresh = false) => {
  const snapshot = await getCachedSnapshot(forceRefresh);
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

      if (!isConnected) {
        return { isConnected: false, profile: null };
      }

      const data = await getFbSnapshotData();
      const fb = data.rawPlatformData?.facebook || {};

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
          totalPosts: fb.posts?.length || 0,
        },
      };
    } catch (err) {
      console.error("Failed to fetch Facebook profile:", err);
      throw err;
    }
  },

  getOverviewMetrics: async (dateRange = null, forceRefresh = false) => {
    const fb = await getFbSnapshotData(forceRefresh);
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
    }

    let finalEngRateData = filteredEngRate;
    if (finalEngRateData.length === 0) {
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
      },
      charts: {
        reachOverTime,
        engagementsOverTime,
        engagementRate: {
          rate: avgEngRate,
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
    if (engagementTrend.length === 0) {
      engagementTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
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
    };
  },

  getPageLikesMetrics: async () => {
    const fb = await getFbSnapshotData();
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
      followerGrowthTimeline,
    };
  },

  getReachViewsMetrics: async () => {
    const fb = await getFbSnapshotData();
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
      },
      timeline,
    };
  },

  getVideosMetrics: async () => {
    const fb = await getFbSnapshotData();
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
        avgWatchTime: "0:00",
        topRetention: "0%",
      },
      videos,
    };
  },

  getStoriesMetrics: async () => {
    const fb = await getFbSnapshotData();
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
      },
      stories,
    };
  },

  getGroupsMetrics: async () => {
    // Groups data is not available through the current Graph API calls
    return {
      kpis: {
        totalMembers: 0,
        activeMembers: 0,
        postsCount: 0,
      },
      growthTimeline: [],
      recentPosts: [],
    };
  },

  getAdsMetrics: async () => {
    const fb = await getFbSnapshotData();
    const adsData = fb.ads || {};

    return {
      kpis: {
        totalSpend: { value: `₹${(adsData.totalSpend || 0).toLocaleString()}`, change: 0 },
        impressions: { value: adsData.adImpressions || 0, change: 0 },
        linkClicks: { value: 0, change: 0 },
        avgCpc: { value: `₹${(adsData.costPerClick || 0).toFixed(2)}`, change: 0 },
      },
      campaigns: [],
    };
  },

  getReportsData: async () => {
    // No report generation system exists yet
    return {
      recentExports: [],
    };
  },

  getInsightsData: async () => {
    const fb = await getFbSnapshotData();
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
    };
  },

  revokeAccess: async () => {
    const res = await api.delete("/auth/facebook/revoke");
    return res.data;
  },
};

export default fbapi;
