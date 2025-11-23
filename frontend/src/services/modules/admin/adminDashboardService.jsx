import axiosClient from '../../api/axiosConfig';
import { UserService } from '../users/userService';

class AdminDashboardService {
  /**
   * Get all orders with pagination
   * @returns Promise<{items: [], totalCount: number, ...}>
   */
  async getAllOrders() {
    try {
      const response = await axiosClient.get('/api/Order/orders');
      return response.data;
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  }

  /**
   * Get all artisans
   * @returns Promise<{items: [], totalCount: number, ...}>
   */
  async getAllArtisans() {
    try {
      const response = await axiosClient.get('/users/artisans');
      return response.data;
    } catch (error) {
      console.error('Get artisans error:', error);
      throw error;
    }
  }

  /**
   * Get all customers
   * @returns Promise<{items: [], totalCount: number, ...}>
   */
  async getAllCustomers() {
    try {
      const response = await axiosClient.get('/users/customers');
      return response.data;
    } catch (error) {
      console.error('Get customers error:', error);
      throw error;
    }
  }

  /**
   * Get newest orders (top 7)
   * @returns Promise<[]>
   */
  async getNewestOrders() {
    try {
      const response = await axiosClient.get('/newest-orders');
      console.log('getNewestOrders response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get newest orders error:', error);
      throw error;
    }
  }

  /**
   * Get top selling products
   * @returns Promise<[]>
   */
  async getTopProducts() {
    try {
      const response = await axiosClient.get('/top-products');
      return response.data;
    } catch (error) {
      console.error('Get top products error:', error);
      throw error;
    }
  }

  /**
   * Calculate total revenue from all orders
   * @param orders Array of orders
   * @returns number
   */
  calculateTotalRevenue(orders) {
    return orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  }

  /**
   * Get order detail by order number
   * @param orderNumber 
   * @returns Promise<order detail>
   */
  async getOrderDetail(orderNumber) {
    try {
      const response = await axiosClient.get(`/api/Order/orders/${orderNumber}`);
      return response.data;
    } catch (error) {
      console.error('Get order detail error:', error);
      return null;
    }
  }

  /**
   * Get customer info from order (for display purposes)
   * @param customerId 
   * @returns Promise<customer info>
   */
  async getCustomerInfo(customerId) {
    try {
      const response = await axiosClient.get(`/users/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Get customer info error:', error);
      return null;
    }
  }

  /**
   * Get user by ID using UserService
   * @param userId 
   * @returns Promise<user info>
   */
  async getUserInfo(userId) {
    try {
      const user = await UserService.getById(userId);
      return user;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  /**
   * Get monthly revenue data
   * @param year 
   * @returns Promise<monthly revenue data>
   */
  async getMonthlyRevenue(year) {
    try {
      const response = await axiosClient.get('/admin/monthly-revenue', {
        params: { year }
      });
      return response.data;
    } catch (error) {
      console.error('Get monthly revenue error:', error);
      throw error;
    }
  }
}

export const AdminDashboardServiceInstance = new AdminDashboardService();
export default AdminDashboardServiceInstance;
