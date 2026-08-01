import api from './api';

/**
 * AI APIs for generating insights, content, and advanced analytics
 */
const Aiapis = {
  /**
   * Generates caption ideas based on an image or topic
   * @param {string} topic 
   * @param {string} platform 
   */
  generateCaption: async (topic, platform = 'general') => {
    const response = await api.post('/ai/generate-caption', { topic, platform });
    return response.data;
  },

  /**
   * Analyzes sentiment of recent comments
   * @param {Array<string>} comments 
   */
  analyzeSentiment: async (comments) => {
    const response = await api.post('/ai/analyze-sentiment', { comments });
    return response.data;
  },

  /**
   * Predicts future engagement based on historical data
   * @param {Object} historicalData 
   */
  predictEngagement: async (historicalData) => {
    const response = await api.post('/ai/predict-engagement', { data: historicalData });
    return response.data;
  },
  
  /**
   * Generates a comprehensive performance report summary
   * @param {Object} metricsData 
   */
  generateReportSummary: async (metricsData) => {
    const response = await api.post('/ai/report-summary', { metrics: metricsData });
    return response.data;
  }
};

export default Aiapis;
