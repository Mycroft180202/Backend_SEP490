import axiosClient from '../../api/axiosConfig';

export const ReportService = {
  async list(params = {}) {
    const {
      status,
      searchTerm,
      pageIndex = 1,
      pageSize = 10,
    } = params;
    const query = {
      pageIndex,
      pageSize,
    };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (searchTerm) {
      query.searchTerm = searchTerm.trim();
    }
    const response = await axiosClient.get('/api/Report', { params: query });
    return response.data;
  },

  async getDetail(reportId) {
    if (!reportId) throw new Error('Missing report id');
    const response = await axiosClient.get(`/api/Report/${reportId}`);
    return response.data;
  },

  async assign(reportId, note) {
    if (!reportId) throw new Error('Missing report id');
    const payload = note ? { note } : {};
    const response = await axiosClient.post(`/api/Report/${reportId}/assign`, payload);
    return response.data;
  },

  async updateStatus(reportId, { newStatus, adminNote }) {
    if (!reportId) throw new Error('Missing report id');
    if (!newStatus) throw new Error('Missing status');
    const response = await axiosClient.put(
      `/api/Report/${reportId}/status`,
      {
        newStatus,
        adminNote: adminNote ?? null,
      },
    );
    return response.data;
  },

  async reportProduct(targetProductId, reason) {
    if (!targetProductId) {
      throw new Error('Missing product id');
    }
    if (!reason || !reason.trim()) {
      throw new Error('Reason is required');
    }
    const payload = {
      targetProductId,
      reason,
    };
    const response = await axiosClient.post('/api/Report/product', payload);
    return response.data;
  },
};
