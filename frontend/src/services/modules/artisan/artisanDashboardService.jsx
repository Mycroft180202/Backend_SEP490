import axiosClient from '../../api/axiosConfig';

class ArtisanDashboardService {
  async getProducts({ pageIndex = 1, pageSize = 50 } = {}) {
    const response = await axiosClient.get('/products-dashboard', {
      params: { pageIndex, pageSize },
    });
    return response.data;
  }

  async getMonthlyRevenue(year) {
    const targetYear = year || new Date().getFullYear();
    const response = await axiosClient.get('/artisan/monthly-revenue', {
      params: { year: targetYear },
    });
    return response.data;
  }

  async getWeeklyRevenue(year, month) {
    const now = new Date();
    const response = await axiosClient.get('/artisan/weekly-revenue', {
      params: {
        year: year || now.getFullYear(),
        month: month || (now.getMonth() + 1),
      },
    });
    return response.data;
  }
}

export const ArtisanDashboardServiceInstance = new ArtisanDashboardService();
export default ArtisanDashboardServiceInstance;
