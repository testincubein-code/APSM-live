import cron from 'node-cron';
import { User } from '../auth/auth.model.js';
import { fetchAndSaveFacebookAnalytics, fetchAndSaveInstagramAnalytics } from './meta.analytics.js';
import { fetchAndSaveYouTubeAnalytics } from './youtube.analytics.js';

export const startAnalyticsCron = () => {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 [CRON] Starting periodic analytics refresh for all platforms...');
    try {
      const users = await User.find({});
      for (const user of users) {
        if (!user.socialAccounts) continue;
        const activePlatforms = user.socialAccounts.filter(acc => acc.isActive).map(acc => acc.platform);
        
        for (const platform of activePlatforms) {
          try {
            if (platform === 'facebook') await fetchAndSaveFacebookAnalytics(user._id);
            if (platform === 'instagram') await fetchAndSaveInstagramAnalytics(user._id);
            if (platform === 'youtube') await fetchAndSaveYouTubeAnalytics(user._id);
          } catch (err) {
            console.error(`❌ [CRON] Failed to refresh ${platform} for user ${user._id}:`, err.message);
          }
        }
      }
      console.log('✅ [CRON] Periodic analytics refresh completed.');
    } catch (err) {
      console.error('❌ [CRON] Error during analytics refresh:', err.message);
    }
  });
};
