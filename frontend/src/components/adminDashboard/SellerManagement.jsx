import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaCheck, FaTimes, FaBan, FaUnlock, FaSearch, FaStore, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AdminSellerService } from '../../services/modules/admin/adminSellerService';
import SellerDetailModal from './SellerDetailModal';
import { ArtisanApplicationService } from '../../services/modules/artisan/artisanApplicationService';
import { UserService } from '../../services/modules/users/userService';

const SellerManagement = () => {
  const [sellers, setSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Temporary search input with debounce
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortBy] = useState('');
  const [sortOrder] = useState('asc');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('ALL');
  const [applicationPage, setApplicationPage] = useState(1);
  const [applicationPageSize] = useState(10);
  const [applicationTotalPages, setApplicationTotalPages] = useState(1);
  const [applicationTotalCount, setApplicationTotalCount] = useState(0);
  const [applicationSearchInput, setApplicationSearchInput] = useState('');
  const [applicationKeyword, setApplicationKeyword] = useState('');
  const [applicationDetailOpen, setApplicationDetailOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState('approve');
  const [reviewAdminNote, setReviewAdminNote] = useState('');
  const [reviewRejectReason, setReviewRejectReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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
        status: item.isActive === false ? 'blocked' : 'approved',
        verified: true,
        rating: item.rating || 0,
        bio: item.bio || '',
        avatarUrl: item.shopUrlImage || '',
        isActive: item.isActive,
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

  useEffect(() => {
    const handler = setTimeout(() => {
      const normalized = searchInput.trim();
      setCurrentPage((prev) => (prev === 1 ? prev : 1));
      setSearchTerm((prev) => (prev === normalized ? prev : normalized));
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput]);

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
          ? { ...s, status: newIsActive ? 'approved' : 'blocked', isActive: newIsActive }
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
    const normalized = searchInput.trim();
    setCurrentPage(1);
    setSearchInput(normalized);
    setSearchTerm(normalized);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
    return `${new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount)} VND`;
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

  const statusOptions = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Đã từ chối' },
  ];

  const getApplicationStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ duyệt';
      case 'APPROVED':
      case 'DONE':
        return 'Đã chấp thuận';
      case 'REJECTED':
        return 'Đã từ chối';
      default:
        return status || 'Không rõ';
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-700 bg-yellow-100';
      case 'APPROVED':
      case 'DONE':
        return 'text-green-700 bg-green-100';
      case 'REJECTED':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const resolveApplicantUserId = (application) => (
    application?.userId
    || application?.userID
    || application?.accountId
    || application?.accountID
    || application?.applicantId
    || application?.customerId
    || application?.user?.id
    || application?.user?.userId
    || null
  );

  const resolveApplicantDisplayName = (application) => (
    application?.fullName
    || application?.shopName
    || application?.email
    || application?.phoneNumber
    || 'ứng viên'
  );

  const fetchApplications = useCallback(async () => {
    try {
      setApplicationLoading(true);
      const response = await ArtisanApplicationService.getApplications({
        statusKeyword: applicationStatus,
        keyword: applicationKeyword,
        pageIndex: applicationPage,
        pageSize: applicationPageSize,
      });
      setApplications(response?.items || []);
      setApplicationTotalPages(response?.totalPages || 1);
      setApplicationTotalCount(response?.totalCount || 0);
    } catch (error) {
      console.error('Error fetching artisan applications:', error);
      toast.error('Không thể tải danh sách đơn đăng ký');
    } finally {
      setApplicationLoading(false);
    }
  }, [applicationKeyword, applicationPage, applicationPageSize, applicationStatus]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const normalized = applicationSearchInput.trim();
      setApplicationPage((prev) => (prev === 1 ? prev : 1));
      setApplicationKeyword((prev) => (prev === normalized ? prev : normalized));
    }, 400);

    return () => clearTimeout(handler);
  }, [applicationSearchInput]);

  const handleApplicationSearch = () => {
    const normalized = applicationSearchInput.trim();
    setApplicationPage(1);
    setApplicationSearchInput(normalized);
    setApplicationKeyword(normalized);
  };

  const openApplicationDetail = (application) => {
    setSelectedApplication(application);
    setApplicationDetailOpen(true);
  };

  const closeApplicationDetail = () => {
    setApplicationDetailOpen(false);
    setSelectedApplication(null);
  };

  const openReviewModal = (application, mode) => {
    setSelectedApplication(application);
    setReviewMode(mode);
    setReviewAdminNote('');
    setReviewRejectReason('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedApplication) return;
    if (reviewMode === 'reject' && !reviewRejectReason.trim()) {
      toast.warn('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      setSubmittingReview(true);
      await ArtisanApplicationService.reviewApplication(selectedApplication.id, {
        approve: reviewMode === 'approve',
        adminNote: reviewAdminNote || null,
        rejectReason: reviewMode === 'reject' ? reviewRejectReason : null,
      });

      if (reviewMode === 'approve') {
        const applicantUserId = resolveApplicantUserId(selectedApplication);
        if (!applicantUserId) {
          throw new Error('Không tìm thấy mã người dùng của đơn đăng ký để gán quyền Nghệ nhân.');
        }

        await UserService.adminUpdate(applicantUserId, {
          isActive: true,
          rolesId: 'R02',
        });
      }

      toast.success(reviewMode === 'approve' ? 'Đã chấp nhận đơn đăng ký và gán quyền Nghệ nhân.' : 'Đã từ chối đơn đăng ký');
      setReviewModalOpen(false);
      setSelectedApplication(null);
      await fetchApplications();
      if (reviewMode === 'approve') {
        await fetchSellers();
      }
    } catch (error) {
      console.error('Review artisan application error:', error);
      const message =
        error?.response?.data?.message
        || error?.message
        || 'Không thể xử lý đơn đăng ký';
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
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
                      <p className="text-sm text-gray-600">{seller.phone || '---'}</p>
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

        {!loading && filteredSellers.length > 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-700">Ghi chú thao tác</p>
            <div className="mt-2 flex flex-wrap gap-4">
              <span className="flex items-center gap-2"><FaEye className="text-blue-500" />Xem chi tiết</span>
              <span className="flex items-center gap-2"><FaCheck className="text-green-500" />Phê duyệt nhanh</span>
              <span className="flex items-center gap-2"><FaTimes className="text-red-500" />Từ chối nhanh</span>
              <span className="flex items-center gap-2"><FaBan className="text-red-500" />Khóa tài khoản</span>
              <span className="flex items-center gap-2"><FaUnlock className="text-green-500" />Mở khóa tài khoản</span>
            </div>
          </div>
        )}
      </div>

      {/* Order/Application Management Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý đơn</h2>
            <p className="text-sm text-gray-600 mt-1">Theo dõi và xử lý các đơn đăng ký trở thành nghệ nhân</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2 flex gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên, email, số điện thoại..."
                value={applicationSearchInput}
                onChange={(e) => setApplicationSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleApplicationSearch}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Tìm kiếm
            </button>
          </div>
          <select
            value={applicationStatus}
            onChange={(e) => {
              setApplicationPage(1);
              setApplicationStatus(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          {applicationLoading ? (
            <div className="flex justify-center items-center py-8">
              <FaSpinner className="animate-spin text-primary text-2xl" />
              <span className="ml-3 text-gray-600">Đang tải đơn đăng ký...</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có đơn đăng ký nào
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Mã đơn</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Người đăng ký</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Liên hệ</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Kinh nghiệm</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Ngày tạo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-semibold text-gray-700">{application.id}</td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold">{application.fullName || '---'}</p>
                      <p className="text-xs text-gray-500">{application.shopName || 'Chưa có tên shop'}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <p>{application.email}</p>
                      <p>{application.phoneNumber}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {application.yearsOfExperience || 0} năm
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {application.createdAt ? new Date(application.createdAt).toLocaleDateString('vi-VN') : '--'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getApplicationStatusColor(application.status)}`}>
                        {getApplicationStatusText(application.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap text-sm font-semibold">
                        <button
                          onClick={() => openApplicationDetail(application)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Xem
                        </button>
                        {application.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => openReviewModal(application, 'approve')}
                              className="text-green-600 hover:text-green-800 transition-colors"
                            >
                              Chấp nhận
                            </button>
                            <button
                              onClick={() => openReviewModal(application, 'reject')}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {applications.length > 0 && !applicationLoading && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Hiển thị {applications.length} trên tổng {applicationTotalCount} đơn đăng ký
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setApplicationPage((p) => Math.max(p - 1, 1))}
                disabled={applicationPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              {Array.from({ length: applicationTotalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setApplicationPage(page)}
                  className={`px-4 py-2 rounded-lg ${
                    applicationPage === page
                      ? 'bg-primary text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setApplicationPage((p) => Math.min(p + 1, applicationTotalPages))}
                disabled={applicationPage === applicationTotalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {(filteredSellers.length > 0 || applications.length > 0) && (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-700">Ghi chú thao tác</p>
          <div className="mt-2 flex flex-wrap gap-4">
            <span className="flex items-center gap-2"><FaEye className="text-blue-500" />Xem chi tiết</span>
            <span className="flex items-center gap-2"><FaCheck className="text-green-500" />Phê duyệt nhanh / Chấp nhận</span>
            <span className="flex items-center gap-2"><FaTimes className="text-red-500" />Từ chối nhanh / Đóng</span>
            <span className="flex items-center gap-2"><FaBan className="text-red-500" />Khóa tài khoản</span>
            <span className="flex items-center gap-2"><FaUnlock className="text-green-500" />Mở khóa tài khoản</span>
          </div>
        </div>
      )}

      {applicationDetailOpen && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Chi tiết đơn đăng ký</h3>
                <p className="text-sm text-gray-500">Mã đơn: {selectedApplication.id}</p>
              </div>
              <button
                type="button"
                onClick={closeApplicationDetail}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">Họ và tên</p>
                <p>{selectedApplication.fullName || '---'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Email</p>
                <p>{selectedApplication.email}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Số điện thoại</p>
                <p>{selectedApplication.phoneNumber}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Tên shop</p>
                <p>{selectedApplication.shopName || '---'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Kinh nghiệm</p>
                <p>{selectedApplication.yearsOfExperience || 0} năm</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ngày sinh</p>
                <p>
                  {selectedApplication.dateOfBirth
                    ? new Date(selectedApplication.dateOfBirth).toLocaleDateString('vi-VN')
                    : '---'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Trạng thái</p>
                <p>{getApplicationStatusText(selectedApplication.status)}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Người duyệt</p>
                <p>{selectedApplication.reviewerName || selectedApplication.reviewedBy || '---'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-semibold text-gray-900">Địa chỉ xưởng</p>
                <p>{selectedApplication.workshopAddress || '---'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-semibold text-gray-900">Mô tả kỹ năng</p>
                <p>{selectedApplication.skillDescription || '---'}</p>
              </div>
              {(selectedApplication.adminNote || selectedApplication.rejectReason) && (
                <div className="md:col-span-2">
                  <p className="font-semibold text-gray-900">Ghi chú / Lý do</p>
                  <p>
                    {selectedApplication.adminNote && (
                      <span className="block">Ghi chú: {selectedApplication.adminNote}</span>
                    )}
                    {selectedApplication.rejectReason && (
                      <span className="block">Lý do từ chối: {selectedApplication.rejectReason}</span>
                    )}
                  </p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="font-semibold text-gray-900 mb-2">Hình ảnh CMND/CCCD</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Mặt trước</p>
                    {selectedApplication.identityFrontImageUrl ? (
                      <a
                        href={selectedApplication.identityFrontImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block group"
                      >
                        <img
                          src={selectedApplication.identityFrontImageUrl}
                          alt="Ảnh mặt trước CMND/CCCD"
                          className="w-full h-40 object-cover rounded-md border border-gray-200 group-hover:border-primary transition-colors"
                        />
                        <span className="mt-2 inline-block text-xs text-primary font-semibold group-hover:underline">
                          Mở ảnh trong tab mới
                        </span>
                      </a>
                    ) : (
                      <p className="text-xs text-gray-500">Chưa cung cấp ảnh.</p>
                    )}
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Mặt sau</p>
                    {selectedApplication.identityBackImageUrl ? (
                      <a
                        href={selectedApplication.identityBackImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block group"
                      >
                        <img
                          src={selectedApplication.identityBackImageUrl}
                          alt="Ảnh mặt sau CMND/CCCD"
                          className="w-full h-40 object-cover rounded-md border border-gray-200 group-hover:border-primary transition-colors"
                        />
                        <span className="mt-2 inline-block text-xs text-primary font-semibold group-hover:underline">
                          Mở ảnh trong tab mới
                        </span>
                      </a>
                    ) : (
                      <p className="text-xs text-gray-500">Chưa cung cấp ảnh.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={closeApplicationDetail}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewModalOpen && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className={`px-6 py-4 ${reviewMode === 'approve' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
              <h3 className="text-lg font-bold">
                {reviewMode === 'approve' ? 'Chấp nhận đơn đăng ký' : 'Từ chối đơn đăng ký'}
              </h3>
              <p className="text-sm text-white/90 mt-1">Mã đơn: {selectedApplication.id}</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {reviewMode === 'approve' && selectedApplication && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Bạn chuẩn bị chấp nhận đơn xin mở cửa hàng của
                  {' '}
                  <span className="font-semibold text-green-800">
                    {resolveApplicantDisplayName(selectedApplication)}
                  </span>
                  . Hệ thống sẽ kích hoạt tài khoản và gán quyền Nghệ nhân (Artisan).
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ghi chú nội bộ
                </label>
                <textarea
                  value={reviewAdminNote}
                  onChange={(e) => setReviewAdminNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="3"
                  placeholder="Nhập ghi chú cho quản trị viên..."
                />
              </div>
              {reviewMode === 'reject' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Lý do từ chối <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reviewRejectReason}
                    onChange={(e) => setReviewRejectReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                    placeholder="Nhập lý do từ chối gửi tới nghệ nhân..."
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setReviewModalOpen(false);
                  setSelectedApplication(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={submittingReview}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                className={`px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 ${
                  reviewMode === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                } transition-colors disabled:opacity-50`}
                disabled={submittingReview}
              >
                {submittingReview && <FaSpinner className="animate-spin" />}
                {reviewMode === 'approve' ? 'Chấp nhận' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

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
