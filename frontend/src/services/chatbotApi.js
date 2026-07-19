import api from './api';

const chatbotApi = {
  /**
   * Send a message to the AI Assistant
   * Backend expects: { message, platform?, context? }
   * @param {string} text - The user's message
   * @param {string} platform - Optional platform context
   */
  sendMessage: async (text, platform = null) => {
    const response = await api.post('/chatbot/chat', {
      message: text,
      ...(platform ? { platform } : {}),
    });
    return response.data;
  }
};

export default chatbotApi;
