import api from "./api";

// ── Cache management and fetch wrapper ────────────────────────────────
let snapshotCache = null;
let cacheTime = null;
let cacheToken = null;

const getCachedSnapshot = async (forceRefresh = false) => {
  const currentToken = localStorage.getItem("incubein_token");
  
  if (!forceRefresh && snapshotCache && cacheTime && cacheToken === currentToken && (Date.now() - cacheTime < 5000)) {
    return snapshotCache;
  }
  try {
    const url = forceRefresh ? "/analytics/meta/instagram?forceRefresh=true" : "/analytics/meta/instagram";
    const response = await api.get(url);
    snapshotCache = response.data?.data || null;
    if (snapshotCache) {
      snapshotCache.history = response.data?.history || [];
    }
    cacheTime = Date.now();
    cacheToken = currentToken;
    return snapshotCache;
  } catch (err) {
    console.warn("Failed to fetch Instagram analytics from API:", err.message);
    return null;
  }
};

const getIgSnapshotData = async (forceRefresh = false) => {
  const snapshot = await getCachedSnapshot(forceRefresh);
  return snapshot || {};
};

const igapi = {
  getProfile: async () => {
    try {
      const res = await api.get("/auth/status");
      const statusArr = res.data?.status ?? [];
      const igStatus = statusArr.find((s) => s.platform === "instagram");
      const isConnected = !!(igStatus?.connected && !igStatus?.isExpired);
      
      if (!isConnected) {
        return { isConnected: false, profile: null };
      }
      
      const data = await getIgSnapshotData();
      const ig = data.rawPlatformData?.instagram || {};
      
      return {
        isConnected,
        profile: {
          name: igStatus.username || ig.username || "Instagram Account",
          handle: igStatus.username ? `@${igStatus.username}` : (ig.username ? `@${ig.username}` : "@instagram"),
          category: "Creator",
          totalFollowers: data.metrics?.followers || 0,
          totalFollowing: ig.followingCount || 0,
          profilePicture: ig.profilePicture || "",
          bio: ig.bio || ""
        }
      };
    } catch (err) {
      console.error("Failed to fetch Instagram profile:", err);
      throw err;
    }
  },

  getOverviewMetrics: async (forceRefresh = false) => {
    const data = await getIgSnapshotData(forceRefresh);
    
    const metrics = data.metrics || {};
    const demographics = data.demographics || {};
    const ig = data.rawPlatformData?.instagram || {};
    
    const kpis = {
      accountsReached: { current: metrics.reach || 0, previous: 0 },
      accountsEngaged: { current: metrics.totalEngagement || 0, previous: 0 },
      totalFollowers: { current: metrics.followers || 0, previous: 0 },
      contentInteractions: { current: Math.round((metrics.totalEngagement || 0) * 0.8), previous: 0 }
    };
    
    const profileViews = { current: metrics.profileViews || 0, previous: 0 };
    const saves = { current: Math.round((metrics.totalEngagement || 0) * 0.12), previous: 0 };
    const totalPosts = ig.mediaCount || data.totalPosts || 0;
    
    const insights = ig.insights || [];
    const reachMetric = insights.find(m => m.name === 'reach')?.values || [];
    const impressionsMetric = insights.find(m => m.name === 'impressions')?.values || [];
    
    let reachTrend = reachMetric.map((v, i) => ({
      date: v.end_time?.split('T')[0] || `Day ${i + 1}`,
      reach: v.value || 0,
      impressions: impressionsMetric[i]?.value || 0
    }));
    
    if (reachTrend.length === 0) {
      reachTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { date: d.toISOString().split("T")[0], reach: 0, impressions: 0 };
      });
    }
    
    const history = data.history || [];
    let followerGrowth = [];
    if (history.length > 0) {
      const recentHistory = history.slice(-7);
      followerGrowth = recentHistory.map((snap, idx) => {
        const currentFollowers = snap.metrics?.followers || 0;
        const prevFollowers = idx > 0 ? recentHistory[idx - 1].metrics?.followers || 0 : currentFollowers;
        const net = currentFollowers - prevFollowers;
        return {
          date: new Date(snap.snapshotDate).toISOString().split("T")[0],
          gained: net > 0 ? net : 0,
          lost: net < 0 ? Math.abs(net) : 0,
          net: net
        };
      });
    }
    
    const engagementTrend = reachTrend.map(r => ({
      date: r.date,
      rate: 0
    }));
    
    const genderMap = { Women: 0, Men: 0 };
    (demographics.ageAndGender || []).forEach(item => {
      const g = item.group.charAt(0).toUpperCase();
      if (g === 'F' || g === 'W') genderMap.Women += item.count;
      if (g === 'M') genderMap.Men += item.count;
    });
    const totalGender = (genderMap.Women + genderMap.Men) || 1;
    
    const ageMap = {};
    (demographics.ageAndGender || []).forEach(item => {
      const agePart = item.group.split('.')[1] || item.group.split('_')[1] || item.group;
      ageMap[agePart] = (ageMap[agePart] || 0) + item.count;
    });
    const totalAge = Object.values(ageMap).reduce((a, b) => a + b, 0) || 1;
    const ageRange = Object.entries(ageMap).map(([age, val]) => ({
      age,
      value: Math.round(val / totalAge * 100)
    }));
    
    let topCountries = (demographics.topCountries || []).map(c => ({
      name: c.name,
      value: c.count
    }));
    
    let topCities = (demographics.topCities || []).map(c => ({
      name: c.name,
      value: c.count
    }));

    const audience = {
      topCities,
      topCountries,
      ageRange,
      gender: [
        { type: "Women", value: Math.round(genderMap.Women / totalGender * 100) || 0 },
        { type: "Men", value: Math.round(genderMap.Men / totalGender * 100) || 0 }
      ]
    };
    
    const rawMedia = ig.media || [];
    const formattedMedia = rawMedia.map(m => {
      const type = m.media_type === "VIDEO" ? "Reel" : (m.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Post");
      const eng = (m.like_count || 0) + (m.comments_count || 0);
      return {
        id: m.id,
        image: m.thumbnail_url || m.media_url || "https://placehold.co/150",
        type,
        caption: m.caption || "Untitled",
        date: m.timestamp ? new Date(m.timestamp).toISOString().split('T')[0] : "",
        likes: m.like_count || 0,
        comments: m.comments_count || 0,
        shares: 0,
        saves: 0,
        reach: 0,
        impressions: 0,
        engagement: eng,
        rate: "N/A",
        views: 0, // Video views are not available in basic media fetch without insights
        watchTime: "0:00"
      };
    });

    const contentPerformance = formattedMedia;
    const topReels = formattedMedia.filter(m => m.type === "Reel");
    
    return {
      kpis,
      profileViews,
      saves,
      totalPosts,
      reachTrend,
      followerGrowth,
      engagementTrend,
      audience,
      contentPerformance,
      topReels
    };
  },

  getMetricHistory: async (metricId) => {
    const data = await getIgSnapshotData();
    const history = data.history || [];
    const metricHistory = history.map(snap => {
      let val = 0;
      if (metricId === 'total-followers') val = snap.metrics?.followers || 0;
      else if (metricId === 'accounts-reached') val = snap.metrics?.reach || 0;
      else if (metricId === 'accounts-engaged') val = snap.metrics?.totalEngagement || 0;
      else if (metricId === 'impressions') val = snap.metrics?.impressions || 0;
      else if (metricId === 'profile-views') val = snap.metrics?.profileViews || 0;
      else if (metricId === 'saves') val = Math.round((snap.metrics?.totalEngagement || 0) * 0.12);

      return {
        date: new Date(snap.snapshotDate).toISOString().split("T")[0],
        value: val
      };
    });
    return { metricId, history: metricHistory };
  },

  getContent: async () => {
    const ov = await igapi.getOverviewMetrics();
    return { posts: ov.contentPerformance || [] };
  },

  getAudience: async () => {
    const data = await getIgSnapshotData();
    const demographics = data.demographics || {};
    
    const genderMap = { Women: 0, Men: 0 };
    (demographics.ageAndGender || []).forEach(item => {
      const g = item.group.charAt(0).toUpperCase();
      if (g === 'F' || g === 'W') genderMap.Women += item.count;
      if (g === 'M') genderMap.Men += item.count;
    });
    const totalGender = (genderMap.Women + genderMap.Men) || 1;
    
    const ageMap = {};
    (demographics.ageAndGender || []).forEach(item => {
      const agePart = item.group.split('.')[1] || item.group.split('_')[1] || item.group;
      ageMap[agePart] = (ageMap[agePart] || 0) + item.count;
    });
    const totalAge = Object.values(ageMap).reduce((a, b) => a + b, 0) || 1;
    const ageRange = Object.entries(ageMap).map(([age, val]) => ({
      age,
      value: Math.round(val / totalAge * 100)
    }));
    
    let topCountries = (demographics.topCountries || []).map(c => ({
      name: c.name,
      value: c.count
    }));
    
    let topCities = (demographics.topCities || []).map(c => ({
      name: c.name,
      value: c.count
    }));

    return {
      demographics: {
        topCities,
        topCountries,
        ageRange,
        gender: [
          { type: "Women", value: Math.round(genderMap.Women / totalGender * 100) || 0 },
          { type: "Men", value: Math.round(genderMap.Men / totalGender * 100) || 0 }
        ]
      },
      activeTimes: []
    };
  },

  getEngagement: async () => {
    const data = await getIgSnapshotData();
    const metrics = data.metrics || {};
    const ig = data.rawPlatformData?.instagram || {};
    const rawMedia = ig.media || [];
    
    const totalLikes = rawMedia.reduce((sum, m) => sum + (m.like_count || 0), 0);
    const totalComments = rawMedia.reduce((sum, m) => sum + (m.comments_count || 0), 0);
    const totalEngagementFromMedia = totalLikes + totalComments;

    const trendMap = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        trendMap[d.toISOString().split('T')[0]] = { eng: 0 };
    }

    rawMedia.forEach(m => {
        if (!m.timestamp) return;
        const dateStr = new Date(m.timestamp).toISOString().split('T')[0];
        if (trendMap[dateStr] !== undefined) {
            trendMap[dateStr].eng += (m.like_count || 0) + (m.comments_count || 0);
        }
    });

    const followers = metrics.followers || 1;
    const trend = Object.keys(trendMap).map(date => {
        const rate = ((trendMap[date].eng / followers) * 100).toFixed(2);
        return {
            date,
            rate: parseFloat(rate)
        };
    });

    return {
      interactions: [
        { name: 'Likes', value: totalLikes || Math.round((metrics.totalEngagement || 0) * 0.7) },
        { name: 'Comments', value: totalComments || Math.round((metrics.totalEngagement || 0) * 0.2) },
        { name: 'Shares', value: 0 },
        { name: 'Saves', value: Math.round((totalEngagementFromMedia || metrics.totalEngagement || 0) * 0.1) }
      ],
      trend
    };
  },

  getStories: async () => { return { items: [] }; },
  getReels: async () => { 
    const ov = await igapi.getOverviewMetrics();
    return { items: ov.topReels || [] };
  },
  getGrowth: async () => { return { history: [] }; },
  getHashtags: async () => { return { tags: [] }; },
  getInsights: async () => { 
    const data = await getIgSnapshotData();
    const insights = data.rawPlatformData?.instagram?.insights || [];
    const getVal = (name) => {
      const metric = insights.find(m => m.name === name);
      // Sum the values in case it returns multiple days (usually it's 2 values for 'day' period)
      return metric?.values?.reduce((acc, v) => acc + (v.value || 0), 0) || 0;
    };
    
    return {
      actions: [
        { id: 'website_clicks', title: "Website Taps", value: getVal('website_clicks') },
        { id: 'email_clicks', title: "Email Button Taps", value: getVal('email_contacts') },
        { id: 'call_clicks', title: "Call Button Taps", value: getVal('phone_call_clicks') },
        { id: 'direction_clicks', title: "Get Directions Taps", value: getVal('get_directions_clicks') }
      ]
    };
  },
  revokeAccess: async () => {
    const response = await api.delete("/auth/instagram/revoke");
    return response.data;
  },
};

export default igapi;
