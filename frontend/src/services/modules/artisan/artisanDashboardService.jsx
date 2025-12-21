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

  async getOutOfStockProducts() {
    const response = await axiosClient.get('/artisan/product/out-stock');
    return response.data;
  }

  async getTopProducts({ metric = 'revenue', year, month } = {}) {
    const basePath = metric === 'totalSold'
      ? '/artisan/product/top-product/total-sold'
      : '/artisan/product/top-product/revenue';

    const params = {};
    if (year) {
      params.year = year;
    }
    if (month) {
      params.month = month;
    }

    const response = await axiosClient.get(basePath, { params });
    return response.data;
  }

  async getRevenuePercentage({ year, month } = {}) {
    const params = {};
    if (year) {
      params.year = year;
    }
    if (month) {
      params.month = month;
    }

    const response = await axiosClient.get('/artisan/revenue-percentage', { params });
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

  async confirmOrderByArtisan(orderNumber) {
    if (!orderNumber) {
      throw new Error('Missing order number');
    }
    const response = await axiosClient.post(`/api/Order/orders/${orderNumber}/confirm-artisan`);
    return response.data;
  }
}

export const ArtisanDashboardServiceInstance = new ArtisanDashboardService();
export default ArtisanDashboardServiceInstance;
