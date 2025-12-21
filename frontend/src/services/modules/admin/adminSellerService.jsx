import axiosClient from '../../api/axiosConfig';

export const AdminSellerService = {
  /**
   * Get all artisans/sellers with pagination
   * @param {number} pageIndex - Page number (1-based)
   * @param {number} pageSize - Items per page
   * @param {string} search - Search by shop name or display name
   * @param {string} sortBy - Sort field: 'displayName', 'totalRevenue', 'rating', 'createdDate'
   * @param {string} sortOrder - 'asc' or 'desc'
   * @param {number} year - Revenue year filter (optional)
   * @param {number} month - Revenue month filter (optional, 1-12)
   * @returns {Promise} Response with items, totalCount, pageIndex, pageSize, totalPages
   */
  async getArtisans(pageIndex = 1, pageSize = 10, search = '', sortBy = '', sortOrder = 'asc', year, month) {
    try {
      const params = {
        pageIndex,
        pageSize,
      };

      if (search) {
        params.search = search;
      }

      if (sortBy) {
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }

      if (Number.isFinite(Number(year)) && Number(year) > 0) {
        params.year = Number(year);
      }

      if (Number.isFinite(Number(month)) && Number(month) >= 1 && Number(month) <= 12) {
        params.month = Number(month);
      }

      const response = await axiosClient.get('/users/artisans', { params });

      return {
        items: response.data?.items || [],
        totalCount: response.data?.totalCount || 0,
        pageIndex: response.data?.pageIndex || pageIndex,
        pageSize: response.data?.pageSize || pageSize,
        totalPages: response.data?.totalPages || 1,
        hasPreviousPage: response.data?.hasPreviousPage || false,
        hasNextPage: response.data?.hasNextPage || false,
      };
    } catch (error) {
      console.error('Error fetching artisans:', error);
      throw error;
    }
  },

  async exportArtisanRevenueReport({ year, month, artisanIds } = {}) {
    const params = {};
    if (Number.isFinite(Number(year)) && Number(year) > 0) {
      params.year = Number(year);
    }
    if (Number.isFinite(Number(month)) && Number(month) >= 1 && Number(month) <= 12) {
      params.month = Number(month);
    }
    if (Array.isArray(artisanIds) && artisanIds.length > 0) {
      params.artisanIds = artisanIds.join(',');
    }

    const response = await axiosClient.get('/admin/artisan-revenue-report', {
      params,
      responseType: 'blob',
    });

    return response;
  },

  /**
   * Get artisan details by ID
   * @param {string} userId - Artisan user ID
   * @returns {Promise} Artisan details with products and orders
   */
  async getArtisanById(userId) {
    try {
      const response = await axiosClient.get(`/users/artisans/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching artisan details:', error);
      throw error;
    }
  },

  /**
   * Get artisan products by artisan ID
   * @param {string} userId - Artisan user ID
   * @param {number} pageIndex - Page number
   * @param {number} pageSize - Items per page
   * @returns {Promise} Artisan's products
   */
  async getArtisanProducts(userId, pageIndex = 1, pageSize = 10) {
    try {
      const params = {
        pageIndex,
        pageSize,
      };

      const response = await axiosClient.get(`/users/artisans/${userId}/products`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching artisan products:', error);
      throw error;
    }
  },

  /**
   * Get artisan orders
   * @param {string} userId - Artisan user ID
   * @param {number} pageIndex - Page number
   * @param {number} pageSize - Items per page
   * @returns {Promise} Artisan's orders
   */
  async getArtisanOrders(userId, pageIndex = 1, pageSize = 10) {
    try {
      const params = {
        pageIndex,
        pageSize,
      };

      const response = await axiosClient.get(`/users/artisans/${userId}/orders`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching artisan orders:', error);
      throw error;
    }
  },

  /**
   * Get user details by ID
   * @param {string} userId - User ID
   * @returns {Promise} User details (userID, username, email, isActive, phoneNumber, displayName, etc.)
   */
  async getUserById(userId) {
    try {
      const response = await axiosClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },

  /**
   * Update user status (activate/deactivate)
   * @param {string} userId - User ID
   * @param {boolean} isActive - True to activate, false to deactivate
   * @returns {Promise} Updated user
   */
  async updateUserStatus(userId, isActive) {
    try {
      const payload = { isActive, rolesId: '' };
      const response = await axiosClient.put('/users', payload, {
        params: { userId },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  /**
   * Update artisan profile
   * @param {string} userId - Artisan user ID
   * @param {object} profileData - Profile data to update
   * @returns {Promise} Updated artisan
   */
  async updateArtisanProfile(userId, profileData) {
    try {
      const response = await axiosClient.put(`/users/artisans/${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating artisan profile:', error);
      throw error;
    }
  },

  /**
   * Get artisan statistics
   * @param {string} userId - Artisan user ID
   * @returns {Promise} Artisan stats (total orders, revenue, products, rating, etc.)
   */
  async getArtisanStats(userId) {
    try {
      const response = await axiosClient.get(`/users/artisans/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching artisan stats:', error);
      throw error;
    }
  },
};
