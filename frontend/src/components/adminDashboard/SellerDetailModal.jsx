import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaSpinner, FaLock, FaUnlock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AdminSellerService } from '../../services/modules/admin/adminSellerService';
import { resolvePrimaryRole } from '../../utils/roleUtils';

const SellerDetailModal = ({ isOpen, seller, onClose, onStatusChange }) => {
  const [sellerDetails, setSellerDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchSellerDetails = useCallback(async () => {
    if (!seller || !seller.id) return;
    
    setLoading(true);
    try {
      const details = await AdminSellerService.getUserById(seller.id);
      setSellerDetails(details);
    } catch (error) {
      console.error('Error fetching seller details:', error);
      toast.error('Lỗi khi tải thông tin chi tiết');
    } finally {
      setLoading(false);
    }
  }, [seller]);

  useEffect(() => {
    if (isOpen && seller) {
      fetchSellerDetails();
    }
  }, [isOpen, seller, fetchSellerDetails]);

  const handleToggleStatus = async () => {
    if (!sellerDetails) return;

    setUpdating(true);
    try {
      const newStatus = !sellerDetails.isActive;
      await AdminSellerService.updateUserStatus(sellerDetails.userID, newStatus);
      
      setSellerDetails({
        ...sellerDetails,
        isActive: newStatus,
      });

      toast.success(newStatus ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản');
      
      // Notify parent component to refresh the list
      if (onStatusChange) {
        onStatusChange(seller.id, newStatus);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen || !seller) return null;

  const primaryRole = resolvePrimaryRole(sellerDetails?.roles || sellerDetails?.role);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Thông tin chi tiết</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <FaSpinner className="animate-spin text-primary text-2xl" />
              <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : sellerDetails ? (
            <div className="space-y-4">
              {/* User ID */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  User ID
                </label>
                <p className="text-sm bg-gray-100 p-2 rounded border border-gray-200 break-all">
                  {sellerDetails.userID}
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Tên đăng nhập
                </label>
                <p className="text-sm font-semibold">{sellerDetails.username || 'N/A'}</p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Tên hiển thị
                </label>
                <p className="text-sm font-semibold">{sellerDetails.displayName || 'N/A'}</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Email
                </label>
                <p className="text-sm">{sellerDetails.email || 'N/A'}</p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Số điện thoại
                </label>
                <p className="text-sm">{sellerDetails.phoneNumber || 'N/A'}</p>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Ngày sinh
                </label>
                <p className="text-sm">
                  {sellerDetails.dob
                    ? new Date(sellerDetails.dob).toLocaleDateString('vi-VN')
                    : 'N/A'}
                </p>
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Trạng thái tài khoản
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      sellerDetails.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {sellerDetails.isActive ? 'Đã kích hoạt' : 'Bị khóa'}
                  </span>
                </div>
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Ngày tạo tài khoản
                </label>
                <p className="text-sm">
                  {sellerDetails.createAt
                    ? new Date(sellerDetails.createAt).toLocaleDateString('vi-VN')
                    : 'N/A'}
                </p>
              </div>

              {/* Updated Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Cập nhật lần cuối
                </label>
                <p className="text-sm">
                  {sellerDetails.updateAt
                    ? new Date(sellerDetails.updateAt).toLocaleDateString('vi-VN')
                    : 'N/A'}
                </p>
              </div>

              {/* Roles */}
              {primaryRole && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Vai trò
                  </label>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="text-sm font-semibold">{primaryRole}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Không thể tải thông tin</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-sm"
          >
            Đóng
          </button>
          {sellerDetails && (
            <button
              onClick={handleToggleStatus}
              disabled={updating}
              className={`px-4 py-2 rounded-lg font-semibold text-sm text-white flex items-center gap-2 ${
                sellerDetails.isActive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {updating && <FaSpinner className="animate-spin" />}
              {sellerDetails.isActive ? (
                <>
                  <FaLock /> Khóa tài khoản
                </>
              ) : (
                <>
                  <FaUnlock /> Mở khóa
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDetailModal;
