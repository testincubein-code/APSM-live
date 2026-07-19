import axios from 'axios';
import { getValidToken } from '../../utils/tokenManager.js';
import { AnalyticsSnapshot } from './analytics.model.js';
export const fetchAndSaveFacebookAnalytics = async (userId) => {
  let facebookData = null;
  let hasRealData = false;
  let followers = 0;
  let impressions = 0;
  let reach = 0;
  let profileViews = 0;
  let totalEngagement = 0;
  let topCountries = [];
  let ageAndGender = [];

  try {
    console.log(`[meta.analytics] Checking Facebook connection for user ${userId}...`);
    const fbToken = await getValidToken(userId, 'facebook');

    console.log(`[DEBUG-FB] Token received: ${fbToken ? 'YES (length: ' + fbToken.length + ')' : 'NO/NULL'}`);

    if (fbToken) {
      // DEBUG: Check what permissions the token actually has
      try {
        const permRes = await axios.get('https://graph.facebook.com/v18.0/me/permissions', {
          params: { access_token: fbToken }
        });
        console.log(`[DEBUG-FB] Token permissions:`, JSON.stringify(permRes.data, null, 2));
      } catch (permErr) {
        console.error(`[DEBUG-FB] Failed to check permissions:`, permErr.response?.data || permErr.message);
      }

      // DEBUG: Check who this token belongs to
      try {
        const meRes = await axios.get('https://graph.facebook.com/v18.0/me', {
          params: { fields: 'id,name', access_token: fbToken }
        });
        console.log(`[DEBUG-FB] Token belongs to:`, JSON.stringify(meRes.data, null, 2));
      } catch (meErr) {
        console.error(`[DEBUG-FB] Failed /me call:`, meErr.response?.data || meErr.message);
      }

      console.log(`[meta.analytics] Fetching Facebook Pages for user ${userId}...`);
      const pagesRes = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
        params: { access_token: fbToken }
      });

      console.log(`[DEBUG-FB] /me/accounts response:`, JSON.stringify(pagesRes.data, null, 2));

      const page = pagesRes.data.data?.[0];
      if (page) {
        const pageId = page.id;
        const pageToken = page.access_token;
        console.log(`[meta.analytics] Fetching FB Page stats for page ${page.name} (${pageId})...`);
        console.log(`[DEBUG-FB] Page token received: ${pageToken ? 'YES' : 'NO'}`);

        const detailRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
          params: { fields: 'fan_count,name', access_token: pageToken }
        });

        console.log(`[DEBUG-FB] Page details:`, JSON.stringify(detailRes.data, null, 2));

        facebookData = {
          pageName: detailRes.data.name,
          pageId,
          fanCount: detailRes.data.fan_count || 0,
          insights: []
        };
        hasRealData = true; // We successfully retrieved the real Page metadata!
        followers += facebookData.fanCount;

        try {
          const insightsRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/insights`, {
            params: {
              metric: 'page_impressions,page_post_engagements,page_views_total',
              period: 'day',
              access_token: pageToken
            }
          });

          console.log(`[DEBUG-FB] Insights response received: ${insightsRes.data.data?.length || 0} metrics`);
          facebookData.insights = insightsRes.data.data || [];

          const getVal = (metricName) => {
            const met = facebookData.insights.find(m => m.name === metricName);
            return met?.values?.reduce((acc, v) => acc + (v.value || 0), 0) || 0;
          };
          impressions += getVal('page_impressions');
          totalEngagement += getVal('page_post_engagements');
          profileViews += getVal('page_views_total');
          reach += Math.round(getVal('page_impressions') * 0.75);
        } catch (insightsErr) {
          console.warn(`⚠️ [meta.analytics] Failed to fetch Page Insights (metrics might be deprecated or empty):`, insightsErr.message);
          // Non-blocking: keep metrics as 0
        }

        try {
          const postsRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/published_posts`, {
            params: {
              fields: 'id,message,created_time,full_picture,attachments,shares,comments.summary(total_count),likes.summary(total_count)',
              limit: 20,
              access_token: pageToken
            }
          });
          facebookData.posts = postsRes.data.data || [];
        } catch (postsErr) {
          console.warn(`⚠️ [meta.analytics] Failed to fetch Page Posts:`, postsErr.message);
        }

        try {
          console.log(`[meta.analytics] Fetching FB Page stories for page ${pageId}...`);
          const storiesRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/stories`, {
            params: {
              fields: 'id,creation_time,media_type,media_url',
              access_token: pageToken
            }
          });
          facebookData.stories = storiesRes.data.data || [];
        } catch (storiesErr) {
          console.warn(`⚠️ [meta.analytics] Failed to fetch Page Stories:`, storiesErr.message);
        }

        try {
          console.log(`[meta.analytics] Fetching FB Page demographics for page ${pageId}...`);
          const demoRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/insights`, {
            params: {
              metric: 'page_fans_gender_age,page_fans_country',
              period: 'lifetime',
              access_token: pageToken
            }
          });
          
          console.log(`[DEBUG-FB] Demographics response data:`, JSON.stringify(demoRes.data, null, 2));

          const countryMetric = demoRes.data?.data?.find(m => m.name === 'page_fans_country');
          if (countryMetric?.values?.[0]?.value) {
            const valObj = countryMetric.values[0].value;
            topCountries = Object.entries(valObj).map(([name, count]) => ({
              name,
              count: parseInt(count) || 0
            })).sort((a, b) => b.count - a.count).slice(0, 5);
          }

          const ageGenderMetric = demoRes.data?.data?.find(m => m.name === 'page_fans_gender_age');
          if (ageGenderMetric?.values?.[0]?.value) {
            const valObj = ageGenderMetric.values[0].value;
            ageAndGender = Object.entries(valObj).map(([group, count]) => ({
              group,
              count: parseFloat(count) || 0
            }));
          }
        } catch (demoErr) {
          console.warn(`⚠️ [meta.analytics] Failed to fetch Page demographics:`, demoErr.message);
        }
      } else {
        console.warn(`[DEBUG-FB] ❌ No pages returned! Full response data:`, JSON.stringify(pagesRes.data, null, 2));
      }
    } else {
      console.warn(`[DEBUG-FB] ❌ No token returned from getValidToken!`);
    }
  } catch (err) {
    console.error(`⚠️ [meta.analytics] Facebook API fetch FAILED for user ${userId}:`);
    console.error(`[DEBUG-FB] Error message:`, err.message);
    console.error(`[DEBUG-FB] Error response data:`, JSON.stringify(err.response?.data, null, 2));
    console.error(`[DEBUG-FB] Error response status:`, err.response?.status);
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  if (hasRealData) {
    const snapshot = await AnalyticsSnapshot.findOneAndUpdate(
      {
        incubationCenterId: userId,
        platform: 'facebook',
        snapshotDate: { $gte: startOfDay, $lte: endOfDay }
      },
      {
        incubationCenterId: userId,
        platform: 'facebook',
        snapshotDate: new Date(),
        metrics: {
          followers,
          impressions,
          reach,
          profileViews,
          totalEngagement
        },
        demographics: {
          topCountries,
          topCities: [],
          ageAndGender
        },
        rawPlatformData: { facebook: facebookData }
      },
      { upsert: true, new: true }
    );
    console.log(`✅ [meta.analytics] Successfully saved Facebook analytics for user ${userId}`);
    return snapshot;
  } else {
    console.warn(`[meta.analytics] No valid Facebook connections found. Generating mock Facebook snapshot for user ${userId}...`);
    const snapshot = await AnalyticsSnapshot.findOneAndUpdate(
      {
        incubationCenterId: userId,
        platform: 'facebook',
        snapshotDate: { $gte: startOfDay, $lte: endOfDay }
      },
      {
        incubationCenterId: userId,
        platform: 'facebook',
        snapshotDate: new Date(),
        metrics: {
          followers: 0,
          impressions: 0,
          reach: 0,
          profileViews: 0,
          totalEngagement: 0
        },
        demographics: {
          topCountries: [],
          topCities: [],
          ageAndGender: []
        },
        ads: {
          activeCampaigns: 0,
          totalSpend: 0,
          currency: 'INR',
          adImpressions: 0,
          costPerClick: 0
        },
        rawPlatformData: {
          mock: true,
          facebook: { pageName: 'Not Connected / Data Unavailable', likes: 0 }
        }
      },
      { upsert: true, new: true }
    );
    return snapshot;
  }
};

export const fetchAndSaveInstagramAnalytics = async (userId) => {
  let instagramData = null;
  let hasRealData = false;
  let followers = 0;
  let impressions = 0;
  let reach = 0;
  let profileViews = 0;
  let totalEngagement = 0;
  let topCountries = [];
  let ageAndGender = [];

  try {
    console.log(`[meta.analytics] Checking Instagram connection for user ${userId}...`);
    const igToken = await getValidToken(userId, 'instagram');

    if (igToken) {
      console.log(`[meta.analytics] Fetching FB Page linked to Instagram for user ${userId}...`);
      const pagesRes = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
        params: { access_token: igToken }
      });

      const page = pagesRes.data.data?.[0];
      if (page) {
        console.log(`[meta.analytics] Fetching IG Business Account linked to FB Page ${page.id}...`);
        const igAccountRes = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
          params: { fields: 'instagram_business_account', access_token: igToken }
        });

        const igAccountId = igAccountRes.data.instagram_business_account?.id;
        if (igAccountId) {
          console.log(`[meta.analytics] Fetching IG insights for Business Account ${igAccountId}...`);

          const profileRes = await axios.get(`https://graph.facebook.com/v18.0/${igAccountId}`, {
            params: { fields: 'followers_count,media_count,username', access_token: igToken }
          });

          instagramData = {
            username: profileRes.data.username,
            followers: profileRes.data.followers_count || 0,
            mediaCount: profileRes.data.media_count || 0,
            insights: [],
            demographics: []
          };
          hasRealData = true; // We successfully fetched the Instagram profile details!
          followers += instagramData.followers;

          // Fetch insights (non-blocking)
          try {
            const insightsRes = await axios.get(`https://graph.facebook.com/v18.0/${igAccountId}/insights`, {
              params: {
                metric: 'impressions,reach,website_clicks,email_contacts,phone_call_clicks,get_directions_clicks',
                period: 'day',
                access_token: igToken
              }
            });
            instagramData.insights = insightsRes.data.data || [];

            const getVal = (metricName) => {
              const met = instagramData.insights.find(m => m.name === metricName);
              return met?.values?.reduce((acc, v) => acc + (v.value || 0), 0) || 0;
            };
            impressions += getVal('impressions');
            reach += getVal('reach');
          } catch (insightsErr) {
            console.warn(`⚠️ [meta.analytics] Failed to fetch Instagram insights (metrics might be deprecated or empty):`, insightsErr.message);
          }

          // Fetch demographics (non-blocking)
          try {
            const demoRes = await axios.get(`https://graph.facebook.com/v18.0/${igAccountId}/insights`, {
              params: {
                metric: 'audience_country,audience_gender_age',
                period: 'lifetime',
                access_token: igToken
              }
            });
            instagramData.demographics = demoRes.data.data || [];

            const countryMetric = instagramData.demographics.find(m => m.name === 'audience_country');
            if (countryMetric?.values?.[0]?.value) {
              const valObj = countryMetric.values[0].value;
              topCountries = Object.entries(valObj).map(([name, count]) => ({
                name,
                count: parseInt(count) || 0
              })).sort((a, b) => b.count - a.count).slice(0, 5);
            }

            const ageGenderMetric = instagramData.demographics.find(m => m.name === 'audience_gender_age');
            if (ageGenderMetric?.values?.[0]?.value) {
              const valObj = ageGenderMetric.values[0].value;
              ageAndGender = Object.entries(valObj).map(([group, count]) => ({
                group,
                count: parseFloat(count) || 0
              }));
            }
          } catch (demoErr) {
            console.warn(`⚠️ [meta.analytics] Failed to fetch Instagram demographics (metrics might be deprecated or empty):`, demoErr.message);
          }

          // Fetch media (posts, reels, etc.)
          try {
            const mediaRes = await axios.get(`https://graph.facebook.com/v18.0/${igAccountId}/media`, {
              params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
                limit: 30,
                access_token: igToken
              }
            });
            instagramData.media = mediaRes.data.data || [];
          } catch (mediaErr) {
            console.warn(`⚠️ [meta.analytics] Failed to fetch Instagram media:`, mediaErr.message);
          }
        }
      }
    }
  } catch (err) {
    console.warn(`⚠️ [meta.analytics] Instagram API fetch skipped/failed for user ${userId}:`, err.message);
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  if (hasRealData) {
    const snapshot = await AnalyticsSnapshot.findOneAndUpdate(
      {
        incubationCenterId: userId,
        platform: 'instagram',
        snapshotDate: { $gte: startOfDay, $lte: endOfDay }
      },
      {
        incubationCenterId: userId,
        platform: 'instagram',
        snapshotDate: new Date(),
        metrics: {
          followers,
          impressions,
          reach,
          profileViews,
          totalEngagement
        },
        demographics: {
          topCountries,
          topCities: [],
          ageAndGender
        },
        rawPlatformData: { instagram: instagramData }
      },
      { upsert: true, new: true }
    );
    console.log(`✅ [meta.analytics] Successfully saved Instagram analytics for user ${userId}`);
    return snapshot;
  } else {
    console.warn(`[meta.analytics] No valid Instagram connections found. Generating mock Instagram snapshot for user ${userId}...`);
    const snapshot = await AnalyticsSnapshot.findOneAndUpdate(
      {
        incubationCenterId: userId,
        platform: 'instagram',
        snapshotDate: { $gte: startOfDay, $lte: endOfDay }
      },
      {
        incubationCenterId: userId,
        platform: 'instagram',
        snapshotDate: new Date(),
        metrics: {
          followers: Math.floor(Math.random() * 2000) + 500,
          impressions: Math.floor(Math.random() * 15000) + 4000,
          reach: Math.floor(Math.random() * 10000) + 3000,
          profileViews: Math.floor(Math.random() * 500) + 100,
          totalEngagement: Math.floor(Math.random() * 1000) + 150
        },
        demographics: {
          topCountries: [
            { name: 'IN', count: Math.floor(Math.random() * 1500) + 700 }
          ],
          topCities: [],
          ageAndGender: []
        },
        ads: {
          activeCampaigns: 1,
          totalSpend: 4000,
          currency: 'INR',
          adImpressions: 11000,
          costPerClick: 2.5
        },
        rawPlatformData: {
          mock: true,
          instagram: { username: 'mock_center_instagram', followers: 1650 }
        }
      },
      { upsert: true, new: true }
    );
    return snapshot;
  }
};
