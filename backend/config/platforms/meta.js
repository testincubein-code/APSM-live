import axios from 'axios';

export default {
  facebook: {
    name:         'Facebook',
    get clientId() { return process.env.FACEBOOK_APP_ID; },
    get clientSecret() { return process.env.FACEBOOK_APP_SECRET; },
    get redirectUri() {
      const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
      return `${BASE_URL}/auth/facebook/callback`;
    },

    authUrl:  'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',

    scopes: [
      'email',
      'public_profile',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'publish_video',
      'business_management',
    ],

    authParams: {},

    async getProfile(accessToken) {
      const res = await axios.get('https://graph.facebook.com/me', {
        params: { fields: 'id,name,email', access_token: accessToken },
      });
      return {
        platformUserId:   res.data.id,
        platformUsername: res.data.name,
      };
    },

    // Meta gives a short-lived token (1h) — must exchange for long-lived (60 days)
    async normalizeTokens(tokenData) {
      const res = await axios.get(
        'https://graph.facebook.com/v18.0/oauth/access_token',
        {
          params: {
            grant_type:        'fb_exchange_token',
            client_id:         process.env.FACEBOOK_APP_ID,
            client_secret:     process.env.FACEBOOK_APP_SECRET,
            fb_exchange_token: tokenData.access_token,
          },
        }
      );
      return {
        accessToken:  res.data.access_token,
        refreshToken: null, // Meta does not issue refresh tokens
        expiresAt:    new Date(Date.now() + (res.data.expires_in ?? 5184000) * 1000),
        scopes:       [],
      };
    },

    // Meta has no refresh token — user must reconnect after 60 days
    async refreshAccessToken() {
      throw new Error('Facebook tokens cannot be refreshed. User must reconnect.');
    },
  },

  // ── Instagram ─────────────────────────────────────────────────────────────
  // Uses the same Meta developer app as Facebook.
  // IMPORTANT: only works with Instagram Business or Creator accounts
  // that are linked to a Facebook Page. Personal accounts will fail.
  instagram: {
    name:         'Instagram',
    get clientId() { return process.env.FACEBOOK_APP_ID; },
    get clientSecret() { return process.env.FACEBOOK_APP_SECRET; },
    get redirectUri() {
      const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
      return `${BASE_URL}/auth/instagram/callback`;
    },

    authUrl:  'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',

    scopes: [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
      'business_management',
    ],

    authParams: {},

    // Instagram Graph API: FB Page → Instagram Business Account → username
    async getProfile(accessToken) {
      // Step 1 — get Facebook Pages this user manages
      const pagesRes = await axios.get(
        'https://graph.facebook.com/me/accounts',
        { params: { access_token: accessToken } }
      );
      const page = pagesRes.data.data?.[0];
      if (!page) {
        throw new Error(
          'No Facebook Page found. Instagram requires a Business or Creator account linked to a Facebook Page.'
        );
      }

      // Step 2 — get the Instagram Business Account linked to that page
      const igRes = await axios.get(
        `https://graph.facebook.com/v18.0/${page.id}`,
        { params: { fields: 'instagram_business_account', access_token: accessToken } }
      );
      const igAccount = igRes.data.instagram_business_account;
      if (!igAccount) {
        throw new Error(
          'No Instagram Business account linked to your Facebook Page. Please link one in Facebook Settings.'
        );
      }

      // Step 3 — get the Instagram username
      const profileRes = await axios.get(
        `https://graph.facebook.com/v18.0/${igAccount.id}`,
        { params: { fields: 'id,username', access_token: accessToken } }
      );
      return {
        platformUserId:   profileRes.data.id,
        platformUsername: profileRes.data.username,
      };
    },

    // Same as Facebook — short-lived → long-lived exchange
    async normalizeTokens(tokenData) {
      const res = await axios.get(
        'https://graph.facebook.com/v18.0/oauth/access_token',
        {
          params: {
            grant_type:        'fb_exchange_token',
            client_id:         process.env.FACEBOOK_APP_ID,
            client_secret:     process.env.FACEBOOK_APP_SECRET,
            fb_exchange_token: tokenData.access_token,
          },
        }
      );
      return {
        accessToken:  res.data.access_token,
        refreshToken: null,
        expiresAt:    new Date(Date.now() + (res.data.expires_in ?? 5184000) * 1000),
        scopes:       [],
      };
    },

    async refreshAccessToken() {
      throw new Error('Instagram tokens cannot be refreshed. User must reconnect.');
    },
  },
};
