import axiosClient from '../../api/axiosConfig';

class ArtisanDashboardService {
  async getTodaySummary() {
    const response = await axiosClient.get('/artisan/today-revenue');
    return response.data;
  }

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

  async getOutOfStockProducts() {
    const response = await axiosClient.get('/artisan/product/out-stock');
    return response.data;
  }

  async getTopProducts({ metric = 'revenue', period = 'month', year, month } = {}) {
    const basePath = metric === 'totalSold'
      ? '/artisan/product/top-product/total-sold'
      : '/artisan/product/top-product/revenue';

    let endpoint = basePath;
    if (period === 'year' && year) {
      endpoint = `${basePath}/${year}`;
    } else if (period === 'month' && year && month) {
      endpoint = `${basePath}/${year}/${month}`;
    }

    const response = await axiosClient.get(endpoint);
    return response.data;
  }

  async getLatestOrders() {
    const response = await axiosClient.get('/newest-orders');
    return response.data;
  }

  async getOrders({ pageIndex = 1, pageSize = 10 } = {}) {
    const response = await axiosClient.get('/artisan/orders', {
      params: { pageIndex, pageSize },
    });
    return response.data;
  }

  async markOrderAsShipping(orderNumber) {
    if (!orderNumber) {
      throw new Error('Missing order number');
    }
    const response = await axiosClient.post(`/api/Order/orders/${orderNumber}/mark-shipping`);
    return response.data;
  }
}

export const ArtisanDashboardServiceInstance = new ArtisanDashboardService();
export default ArtisanDashboardServiceInstance;
