import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaCheck, FaTimes, FaBan, FaUnlock, FaSearch, FaStore, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AdminSellerService } from '../../services/modules/admin/adminSellerService';
import SellerDetailModal from './SellerDetailModal';

const SellerManagement = () => {
  const [sellers, setSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Temporary search input
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Fetch sellers data
  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AdminSellerService.getArtisans(
        currentPage,
        pageSize,
        searchTerm,
        sortBy,
        sortOrder
      );

      // Transform API response to match frontend format
      const transformedSellers = response.items.map((item, index) => ({
        id: item.userID || `artisan-${index}`,
        name: item.displayName || 'N/A',
        shopName: item.shopName || item.displayName || 'N/A',
        email: item.email || 'N/A',
        phone: item.phoneNumber || 'N/A',
        products: 0, // Not in current API response, needs backend endpoint
        revenue: item.totalRevenue || 0,
        joinDate: new Date().toISOString().split('T')[0], // Not in current API response
        status: 'approved', // Default, needs isActive field from backend
        verified: true,
        rating: item.rating || 0,
        bio: item.bio || '',
        avatarUrl: item.shopUrlImage || '',
      }));

      setSellers(transformedSellers);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Lỗi khi tải dữ liệu người bán');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortBy, sortOrder]);

  // Load sellers when component mounts or filters change
  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleViewDetails = (seller) => {
    setSelectedSeller(seller);
    setDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setDetailModalOpen(false);
    setSelectedSeller(null);
  };

  const handleStatusChange = (sellerId, newStatus) => {
    // Update the seller in the list with the new status
    setSellers(sellers.map(seller => 
      seller.id === sellerId 
        ? { ...seller, status: newStatus ? 'approved' : 'blocked' }
        : seller
    ));
  };

  const handleQuickToggleStatus = async (seller) => {
    try {
      // Determine new status based on current status
      const newIsActive = seller.status === 'blocked' || seller.status === 'suspended';
      
      // Call API to update status
      await AdminSellerService.updateUserStatus(seller.id, newIsActive);
      
      // Update local state
      setSellers(sellers.map(s =>
        s.id === seller.id
          ? { ...s, status: newIsActive ? 'approved' : 'blocked' }
          : s
      ));

      // Show success message
      toast.success(newIsActive ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản');
    } catch (error) {
      console.error('Error updating seller status:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to page 1 when searching
    setSearchTerm(searchInput);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Đã duyệt';
      case 'pending':
        return 'Chờ duyệt';
      case 'blocked':
      case 'suspended':
        return 'Đã khóa';
      case 'inactive':
        return 'Vô hiệu';
      default:
        return status;
    }
  };

  // Filter sellers based on search and status
  const filteredSellers = sellers.filter(seller => {
    const matchSearch = seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       seller.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       seller.phone.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || seller.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: totalCount,
    approved: sellers.filter(s => s.status === 'approved').length,
    pending: sellers.filter(s => s.status === 'pending').length,
    blocked: sellers.filter(s => s.status === 'blocked' || s.status === 'suspended').length,
    totalRevenue: sellers.reduce((sum, s) => sum + (s.revenue || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tổng nghệ nhân</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Đã duyệt</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Chờ duyệt</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Đã khóa</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.blocked}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Tổng doanh thu</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{formatCurrency(stats.totalRevenue)}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý nghệ nhân</h2>
            <p className="text-sm text-gray-600 mt-1">Quản lý và phê duyệt tài khoản nghệ nhân</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2 flex gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tên nghệ nhân, tên cửa hàng, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Tìm kiếm
            </button>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
            <option value="blocked">Đã khóa</option>
          </select>
        </div>

        {/* Sellers Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <FaSpinner className="animate-spin text-primary text-2xl" />
              <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : filteredSellers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Không tìm thấy người bán phù hợp</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Nghệ nhân</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Cửa hàng</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Liên hệ</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Doanh thu</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellers.map((seller, index) => (
                  <tr key={seller.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-semibold text-gray-700">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold">{seller.name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FaStore className="text-primary" />
                        <p className="text-sm font-semibold">{seller.shopName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-xs text-gray-500">{seller.email}</p>
                        <p className="text-xs text-gray-500">{seller.phone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-green-600">{formatCurrency(seller.revenue)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(seller.status)}`}>
                        {getStatusText(seller.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewDetails(seller)}
                          className="text-blue-600 hover:text-blue-800 transition-colors" 
                          title="Xem chi tiết"
                        >
                          <FaEye />
                        </button>
                        {seller.status === 'pending' && (
                          <>
                            <button className="text-green-600 hover:text-green-800 transition-colors" title="Phê duyệt">
                              <FaCheck />
                            </button>
                            <button className="text-red-600 hover:text-red-800 transition-colors" title="Từ chối">
                              <FaTimes />
                            </button>
                          </>
                        )}
                        {seller.status === 'approved' && (
                          <button 
                            onClick={() => handleQuickToggleStatus(seller)}
                            className="text-red-600 hover:text-red-800 transition-colors" 
                            title="Khóa tài khoản"
                          >
                            <FaBan />
                          </button>
                        )}
                        {(seller.status === 'blocked' || seller.status === 'suspended') && (
                          <button 
                            onClick={() => handleQuickToggleStatus(seller)}
                            className="text-green-600 hover:text-green-800 transition-colors" 
                            title="Mở khóa"
                          >
                            <FaUnlock />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && sellers.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Hiển thị {filteredSellers.length} trên tổng {totalCount} người bán
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Seller Detail Modal */}
      <SellerDetailModal
        isOpen={detailModalOpen}
        seller={selectedSeller}
        onClose={handleCloseModal}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default SellerManagement;
