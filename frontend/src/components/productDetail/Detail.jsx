import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaList, FaComments, FaTag, FaStar, FaBoxOpen, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { UserContext } from '../../context/UserContext';
import { ProductService } from '../../services/modules/products/productService';

const Detail = ({ product, categoryName, shopInfo }) => {
  const [tab, setTab] = useState('description');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [currentFeedbackPage, setCurrentFeedbackPage] = useState(1);
  const [totalFeedbackPages, setTotalFeedbackPages] = useState(1);
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editingComment, setEditingComment] = useState('');
  const [editingRating, setEditingRating] = useState(0);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  
  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);

  const formatRating = (value) => {
    if (value === null || value === undefined) return '0.0';
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0.0';
    const roundedUp = Math.ceil(numeric * 10) / 10;
    return roundedUp.toFixed(1);
  };

  // Fetch feedbacks
  const fetchFeedbacks = async (pageIndex = 1) => {
    try {
      setFeedbacksLoading(true);
      const response = await ProductService.getFeedbacks(product.id, pageIndex, 5);
      if (response?.items) {
        setFeedbacks(response.items);
        setCurrentFeedbackPage(response.pageIndex || 1);
        setTotalFeedbackPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setFeedbacksLoading(false);
    }
  };

  // Load feedbacks when tab changes or product changes
  useEffect(() => {
    if (tab === 'feedback' && product?.id) {
      fetchFeedbacks(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, product?.id]);

  // Handle edit feedback
  const handleEditFeedback = (feedback) => {
    setEditingFeedbackId(feedback.id);
    setEditingRating(feedback.rating);
    setEditingComment(feedback.comment);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingFeedbackId(null);
    setEditingComment('');
    setEditingRating(0);
  };

  // Handle save edit feedback
  const handleSaveEdit = async () => {
    if (editingRating === 0) {
      toast.error('Vui lòng chọn số sao');
      return;
    }

    if (editingComment.trim() === '') {
      toast.error('Vui lòng nhập bình luận');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await ProductService.updateFeedback(
        product.id,
        userInfo.userID,
        editingFeedbackId,
        {
          rating: editingRating,
          comment: editingComment.trim()
        }
      );

      toast.success('Cập nhật đánh giá thành công!');
      handleCancelEdit();
      fetchFeedbacks(currentFeedbackPage);
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('Cập nhật đánh giá thất bại, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete feedback
  const handleDeleteFeedback = async (feedbackId, customerId) => {
    setDeleteConfirmModal({ feedbackId, customerId });
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal) return;

    try {
      await ProductService.deleteFeedback(deleteConfirmModal.feedbackId, deleteConfirmModal.customerId);
      toast.success('Xóa đánh giá thành công!');
      setDeleteConfirmModal(null);
      fetchFeedbacks(currentFeedbackPage);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Xóa đánh giá thất bại, vui lòng thử lại');
      setDeleteConfirmModal(null);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteConfirmModal(null);
  };

  if (!product) return null;

  const shopDisplayName = shopInfo?.name
    || product.shopName
    || product.displayName
    || product.artisanName
    || 'Cửa hàng';

  const shopAvatar = shopInfo?.image
    || product.userUrlImage
    || '/images/default-avatar.png';

  const targetArtisanId = shopInfo?.artisanId || product.artisanId;

  return (
    <div className="w-full bg-gradient-to-b from-[#FFFDEB] to-white py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Shop Info */}
        <div className="flex items-center gap-4 mb-8 bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border-l-4 border-[#D4A574]">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#D4A574] to-[#8B4513] p-1 shadow-lg">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              <img
                alt={shopDisplayName}
                className="w-full h-full object-cover"
                src={shopAvatar}
              />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs md:text-sm text-gray-500 mb-1">Cửa hàng</p>
            <p className="text-lg md:text-xl font-bold text-[#8B4513]" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {shopDisplayName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!targetArtisanId) return;
              navigate(`/artisan-shop?artisanId=${targetArtisanId}`, {
                state: {
                  artisanId: targetArtisanId,
                  shopName: shopDisplayName,
                  image: shopAvatar,
                  author: shopInfo?.author || product.displayName,
                  phone: shopInfo?.phone || product.phoneNumber,
                  address: shopInfo?.address || product.address,
                  ...(product?.id
                    ? {
                      fromProduct: {
                        label: product.name || 'Chi tiết sản phẩm',
                        href: `/product-detail/${product.id}`,
                      },
                    }
                    : {}),
                },
              });
            }}
            className="px-4 py-2 bg-gradient-to-r from-[#D4A574] to-[#8B4513] text-white rounded-lg hover:from-[#8B4513] hover:to-[#D4A574] transition-all font-medium shadow-md text-sm"
          >
            Xem Cửa hàng →
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mb-6 border-b border-[#D4A574]/60 pb-1">
          <button
            onClick={() => setTab('description')}
            className={`flex items-center gap-2 text-base md:text-lg font-semibold pb-2 border-b-2 transition-all ${
              tab === 'description'
                ? 'text-[#8B4513] border-[#8B4513]'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            <FaList />
            Mô tả sản phẩm
          </button>
          <button
            onClick={() => setTab('feedback')}
            className={`flex items-center gap-2 text-base md:text-lg font-semibold pb-2 border-b-2 transition-all ${
              tab === 'feedback'
                ? 'text-[#8B4513] border-[#8B4513]'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            <FaComments />
            Đánh giá
          </button>
        </div>

        {/* Content */}
        {tab === 'description' ? (
          <div className="space-y-8">
            {/* Long Description */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#D4A574]/30">
              <div className="prose max-w-none">
                <p className="text-gray-700 text-base md:text-lg leading-7 whitespace-pre-line" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {product.longDescription || product.shortDescription}
                </p>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-gradient-to-br from-white to-[#FFF8E7] rounded-2xl p-6 shadow-xl border border-[#D4A574]">
              <h3 className="text-xl md:text-2xl font-bold text-[#8B4513] mb-4 flex items-center gap-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
                <FaTag className="text-[#D4A574]" />
                Thông tin sản phẩm
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Danh mục */}
                <div className="bg-white/80 rounded-xl p-4 shadow-md border-l-4 border-[#D4A574] hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <FaTag className="text-[#D4A574]" size={20} />
                    <span className="text-xs md:text-sm text-gray-500 font-medium">Danh mục</span>
                  </div>
                  <p className="text-base md:text-lg font-semibold text-[#8B4513]">{categoryName || product.category}</p>
                </div>
                
                {/* Đánh giá */}
                <div className="bg-white/80 rounded-xl p-4 shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <FaStar className="text-yellow-500" size={20} />
                    <span className="text-xs md:text-sm text-gray-500 font-medium">Đánh giá</span>
                  </div>
                  <p className="text-base md:text-lg font-semibold text-[#8B4513]">{formatRating(product.rating)} / 5 ⭐</p>
                </div>
                
                {/* Kho */}
                <div className="bg-white/80 rounded-xl p-4 shadow-md border-l-4 border-green-500 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <FaBoxOpen className="text-green-500" size={20} />
                    <span className="text-xs md:text-sm text-gray-500 font-medium">Tồn kho</span>
                  </div>
                  <p className="text-base md:text-lg font-semibold text-[#8B4513]">{product.stock} sản phẩm</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Feedbacks List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-[#D4A574]/30">
              <h3 className="text-2xl font-bold text-[#8B4513] mb-6 flex items-center gap-3">
                <FaComments className="text-[#D4A574]" />
                Đánh giá từ khách hàng ({feedbacks.length})
              </h3>

              {feedbacksLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Đang tải đánh giá...</p>
                </div>
              ) : feedbacks.length > 0 ? (
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <div key={feedback.id} className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:border-[#D4A574] transition-colors">
                      {editingFeedbackId === feedback.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Cập nhật đánh giá:</p>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditingRating(star)}
                                  className="transition-transform hover:scale-110"
                                >
                                  <FaStar
                                    size={24}
                                    className={star <= editingRating ? 'text-yellow-400' : 'text-gray-300'}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            value={editingComment}
                            onChange={(e) => setEditingComment(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            rows="3"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={isSubmitting}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-[#8B4513]">{feedback.customerName}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(feedback.createAt).toLocaleString('vi-VN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar
                                  key={star}
                                  size={16}
                                  className={star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed mb-4">{feedback.comment}</p>
                          
                          {/* Edit/Delete buttons - Only show if this is user's feedback */}
                          {userInfo?.userID === feedback.customerId && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditFeedback(feedback)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              >
                                <FaEdit size={14} />
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteFeedback(feedback.id, feedback.customerId)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              >
                                <FaTrash size={14} />
                                Xóa
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaComments className="mx-auto mb-3 text-[#D4A574]" size={32} />
                  <p>Chưa có đánh giá nào cho sản phẩm này</p>
                </div>
              )}

              {/* Pagination */}
              {totalFeedbackPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => fetchFeedbacks(currentFeedbackPage - 1)}
                    disabled={currentFeedbackPage === 1}
                    className={`px-3 py-2 rounded border ${
                      currentFeedbackPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-[#D4A574] text-[#8B4513] hover:bg-[#FFF8E7]'
                    }`}
                  >
                    Trước
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-600">
                    Trang {currentFeedbackPage} / {totalFeedbackPages}
                  </span>
                  <button
                    onClick={() => fetchFeedbacks(currentFeedbackPage + 1)}
                    disabled={currentFeedbackPage === totalFeedbackPages}
                    className={`px-3 py-2 rounded border ${
                      currentFeedbackPage === totalFeedbackPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-[#D4A574] text-[#8B4513] hover:bg-[#FFF8E7]'
                    }`}
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white">Xác nhận xóa đánh giá</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 text-center mb-6">
                  Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Detail;
