import axiosClient from '../../api/axiosConfig';

const applicationCache = new Map();

export const ArtisanApplicationService = {
  /**
   * Submit artisan application (register as seller)
   * @param {Object} formData - Form data with user information
   * @returns {Promise<Object>} Application object
   */
  async submitApplication(formData) {
    try {
      if (!formData) {
        throw new Error('Missing application data');
      }

      // Create FormData for file uploads
      const data = new FormData();

      // Add text fields
      if (formData.fullName) data.append('FullName', formData.fullName);
      if (formData.email) data.append('Email', formData.email);
      if (formData.phoneNumber) data.append('PhoneNumber', formData.phoneNumber);
      if (formData.dateOfBirth) data.append('DateOfBirth', formData.dateOfBirth);
      if (formData.identityNumber) data.append('IdentityNumber', formData.identityNumber);
      if (formData.skillDescription) data.append('SkillDescription', formData.skillDescription);
      if (formData.workshopAddress) data.append('WorkshopAddress', formData.workshopAddress);
      
      // Optional fields
      if (formData.yearsOfExperience !== undefined && formData.yearsOfExperience !== null) {
        data.append('YearsOfExperience', formData.yearsOfExperience);
      }
      if (formData.shopName) data.append('ShopName', formData.shopName);
      if (formData.bio) data.append('Bio', formData.bio);

      // Add file fields
      if (formData.identityFrontImageFile) {
        data.append('IdentityFrontImageFile', formData.identityFrontImageFile);
      }
      if (formData.identityBackImageFile) {
        data.append('IdentityBackImageFile', formData.identityBackImageFile);
      }

      const response = await axiosClient.post('/api/ArtisanApplication', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Clear cache after submission
      applicationCache.clear();

      return response.data;
    } catch (error) {
      console.error('Error submitting artisan application:', error);
      throw error;
    }
  },

  /**
   * Get current user's artisan application
   * @returns {Promise<Object|null>} Application object or null if not exists
   */
  async getMyApplication() {
    try {
      if (applicationCache.has('my-application')) {
        return applicationCache.get('my-application');
      }

      const response = await axiosClient.get('/api/ArtisanApplication/me');
      const data = response.data;

      if (data) {
        applicationCache.set('my-application', data);
      }

      return data;
    } catch (error) {
      console.error('Error fetching artisan application:', error);
      // Return null if not found (404) instead of throwing
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getApplications({
    statusKeyword,
    keyword,
    pageIndex = 1,
    pageSize = 10,
  } = {}) {
    const params = {
      PageIndex: pageIndex,
      PageSize: pageSize,
    };
    if (statusKeyword && statusKeyword !== 'ALL') {
      params['Status.Keyword'] = statusKeyword;
    }
    if (keyword) {
      params.Keyword = keyword;
    }
    const response = await axiosClient.get('/api/ArtisanApplication', { params });
    return response.data;
  },

  async reviewApplication(id, { approve, adminNote, rejectReason }) {
    if (!id) throw new Error('Missing application id');
    const payload = {
      approve,
      adminNote,
      rejectReason,
    };
    const response = await axiosClient.put(`/api/ArtisanApplication/${id}/review`, payload);
    return response.data;
  },

  /**
   * Clear application cache
   */
  clearCache() {
    applicationCache.clear();
  },
};
