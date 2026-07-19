import api from './api';

const exportAnalytics = async (platform, format = 'pdf', startDate = null, endDate = null) => {
  try {
    let url = `/reports/export?platform=${platform}&format=${format}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const response = await api.get(url, {
      responseType: 'blob', // Important for downloading files
    });

    const blob = new Blob([response.data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${platform}_analytics_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Failed to export analytics:', error);
    throw error;
  }
};

export default { exportAnalytics };
