import axios from 'axios';
import { getValidToken } from '../../utils/tokenManager.js';
import { AnalyticsSnapshot } from './analytics.model.js';

export const fetchAndSaveYouTubeAnalytics = async (userId) => {
  let hasRealData = false;
  let channel = null;
  let stats = {};
  let recentVideos = [];
  let dailyReport = null;
  let countryReport = null;
  let deviceReport = null;
  let ageGenderReport = null;
  let playlists = [];

  try {
    // 1. Get valid access token
    const accessToken = await getValidToken(userId, 'youtube');

    // 2. Fetch complete channel details
    console.log(`[youtube.analytics] Fetching channel details for user ${userId}...`);
    const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { 
        part: 'id,snippet,statistics,contentDetails,brandingSettings,status,topicDetails', 
        mine: true 
      }
    });

    channel = channelResponse.data.items?.[0];
    if (!channel) {
      throw new Error('No YouTube channel found for the authenticated account.');
    }

    stats = channel.statistics || {};
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    // 3. Fetch recent uploads (videos) details
    if (uploadsPlaylistId) {
      try {
        console.log(`[youtube.analytics] Fetching recent uploads from playlist: ${uploadsPlaylistId}`);
        const playlistResponse = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            part: 'snippet,contentDetails',
            playlistId: uploadsPlaylistId,
            maxResults: 5
          }
        });

        const playlistItems = playlistResponse.data.items || [];
        const videoIds = playlistItems.map(item => item.contentDetails?.videoId).filter(Boolean);

        if (videoIds.length > 0) {
          console.log(`[youtube.analytics] Fetching video stats for video IDs: ${videoIds.join(', ')}`);
          const videosResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
              part: 'snippet,statistics,contentDetails,status,topicDetails',
              id: videoIds.join(',')
            }
          });
          recentVideos = videosResponse.data.items || [];
        }
      } catch (err) {
        console.error(`⚠️ [youtube.analytics] Failed to fetch recent video details:`, err.message);
      }
    }

    // 3b. Fetch playlists
    try {
      console.log(`[youtube.analytics] Fetching playlists for user ${userId}...`);
      const playlistsResponse = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          part: 'snippet,contentDetails',
          mine: true,
          maxResults: 50
        }
      });
      playlists = playlistsResponse.data.items || [];
    } catch (err) {
      console.error(`⚠️ [youtube.analytics] Failed to fetch playlists:`, err.message);
    }

    // 4. Fetch YouTube Analytics reports (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const fetchAnalyticsReport = async (dimensions, metrics, sort = null) => {
      const params = {
        ids: 'channel==MINE',
        startDate,
        endDate,
        metrics,
      };
      if (dimensions) params.dimensions = dimensions;
      if (sort) params.sort = sort;

      const res = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });
      return res.data;
    };

    try {
      console.log(`[youtube.analytics] Fetching daily performance report...`);
      dailyReport = await fetchAnalyticsReport(
        'day',
        'views,comments,likes,dislikes,shares,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost',
        'day'
      );
    } catch (err) {
      console.error(`⚠️ [youtube.analytics] Failed to fetch daily analytics report:`, err.message);
    }

    try {
      console.log(`[youtube.analytics] Fetching country demographics report...`);
      countryReport = await fetchAnalyticsReport(
        'country',
        'views,likes,comments,shares,estimatedMinutesWatched',
        '-views'
      );
    } catch (err) {
      console.error(`⚠️ [youtube.analytics] Failed to fetch country analytics report:`, err.message);
    }

    try {
      console.log(`[youtube.analytics] Fetching device type report...`);
      deviceReport = await fetchAnalyticsReport(
        'deviceType',
        'views,estimatedMinutesWatched',
        '-views'
      );
    } catch (err) {
      console.error(`⚠️ [youtube.analytics] Failed to fetch device type report:`, err.message);
    }

    try {
      console.log(`[youtube.analytics] Fetching age/gender demographics report...`);
      ageGenderReport = await fetchAnalyticsReport(
        'ageGroup,gender',
        'viewerPercentage'
      );
    } catch (err) {
      console.error(`⚠️ [youtube.analytics] Failed to fetch age/gender report:`, err.message);
    }

    hasRealData = true;
  } catch (error) {
    console.warn(`⚠️ [youtube.analytics] YouTube API fetch skipped/failed for user ${userId}:`, error.message);
  }

  if (hasRealData) {
    // 5. Compute 30-day views and total engagement
    let totalViews30Days = 0;
    let totalEngagement = 0;

    if (dailyReport && dailyReport.rows && dailyReport.columnHeaders) {
      const viewsIdx = dailyReport.columnHeaders.findIndex(h => h.name === 'views');
      const likesIdx = dailyReport.columnHeaders.findIndex(h => h.name === 'likes');
      const commentsIdx = dailyReport.columnHeaders.findIndex(h => h.name === 'comments');
      const sharesIdx = dailyReport.columnHeaders.findIndex(h => h.name === 'shares');

      for (const row of dailyReport.rows) {
        if (viewsIdx !== -1) totalViews30Days += parseInt(row[viewsIdx]) || 0;
        if (likesIdx !== -1) totalEngagement += parseInt(row[likesIdx]) || 0;
        if (commentsIdx !== -1) totalEngagement += parseInt(row[commentsIdx]) || 0;
        if (sharesIdx !== -1) totalEngagement += parseInt(row[sharesIdx]) || 0;
      }
    }

    if (totalEngagement === 0 && recentVideos.length > 0) {
      for (const video of recentVideos) {
        const vStats = video.statistics || {};
        totalEngagement += (parseInt(vStats.likeCount) || 0) + (parseInt(vStats.commentCount) || 0);
      }
    }

    // 6. Process demographics mapping
    let topCountries = [];
    if (countryReport && countryReport.rows && countryReport.columnHeaders) {
      const countryIdx = countryReport.columnHeaders.findIndex(h => h.name === 'country');
      const viewsIdx = countryReport.columnHeaders.findIndex(h => h.name === 'views');
      if (countryIdx !== -1 && viewsIdx !== -1) {
        topCountries = countryReport.rows.map(row => ({
          name: row[countryIdx],
          count: parseInt(row[viewsIdx]) || 0
        })).sort((a, b) => b.count - a.count);
      }
    }

    let ageAndGender = [];
    if (ageGenderReport && ageGenderReport.rows && ageGenderReport.columnHeaders) {
      const ageIdx = ageGenderReport.columnHeaders.findIndex(h => h.name === 'ageGroup');
      const genderIdx = ageGenderReport.columnHeaders.findIndex(h => h.name === 'gender');
      const percentIdx = ageGenderReport.columnHeaders.findIndex(h => h.name === 'viewerPercentage');
      if (ageIdx !== -1 && genderIdx !== -1 && percentIdx !== -1) {
        ageAndGender = ageGenderReport.rows.map(row => ({
          group: `${row[ageIdx]}_${row[genderIdx]}`,
          // Estimate view count for this demographic based on percentage of 30-day views
          count: Math.round((parseFloat(row[percentIdx]) / 100) * totalViews30Days) || 0
        }));
      }
    }

    // 7. Save to database
    const rawPlatformData = {
      channelDetails: channel,
      recentVideos,
      playlists,
      analyticsReports: {
        daily: dailyReport,
        country: countryReport,
        device: deviceReport,
        ageGender: ageGenderReport
      }
    };

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await AnalyticsSnapshot.findOneAndUpdate(
      {
        incubationCenterId: userId,
        platform: 'youtube',
        snapshotDate: { $gte: startOfDay, $lte: endOfDay }
      },
      {
        incubationCenterId: userId,
        platform: 'youtube',
        snapshotDate: new Date(),
        metrics: {
          followers: parseInt(stats.subscriberCount) || 0,
          impressions: totalViews30Days,
          reach: totalViews30Days,
          profileViews: 0,
          totalEngagement
        },
        demographics: {
          topCountries,
          topCities: [],
          ageAndGender
        },
        rawPlatformData
      },
      { upsert: true, new: true }
    );

    console.log(`✅ [youtube.analytics] Full YouTube data saved for user ${userId}`);
    return snapshot;
  } else {
    throw new Error('Failed to fetch valid YouTube data or no YouTube account connected.');
  }
};