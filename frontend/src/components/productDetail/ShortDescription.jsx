import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaChevronLeft,
  FaChevronRight,
  FaShoppingCart,
  FaStore,
  FaBoxOpen,
  FaBolt,
  FaFlag,
  FaSpinner,
  FaTimes,
} from 'react-icons/fa';
import { LanguageContext } from '../../context/LanguageContext';
import { UserContext } from '../../context/UserContext';
import { CartService } from '../../services/modules/cart/cartService';
import { WishlistService } from '../../services/modules/wishlist/wishlistService';
import { ReportService } from '../../services/modules/report/reportService';
import { isOwnedByCurrentArtisan } from '../../utils/productOwnership';

const ShortDescription = ({ product, selectedImageIndex, onSelectImage, shopInfo }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [thumbnailStart, setThumbnailStart] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const { t } = useContext(LanguageContext);
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const [wishItemId, setWishItemId] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReasonKey, setReportReasonKey] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const reportOptions = [
    { value: 'INAPPROPRIATE', label: 'Nội dung không phù hợp' },
    { value: 'INCORRECT_INFO', label: 'Thông tin không chính xác' },
    { value: 'SCAM', label: 'Có dấu hiệu lừa đảo' },
    { value: 'OTHER', label: 'Lý do khác' },
  ];

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i += 1) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i += 1) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }
    return stars;
  };

  const handleQuantityChange = (type) => {
    if (product?.isActive === false) {
      toast.error('Sản phẩm hiện đã ngừng bán.');
      return;
    }
    if (type === 'increase' && quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleQuantityInputChange = (event) => {
    const { value } = event.target;
    if (!value.trim()) {
      setQuantity(1);
      return;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    let next = Math.floor(parsed);
    if (next < 1) next = 1;
    if (next > product.stock) next = product.stock;
    setQuantity(next);
  };

  const validateQuantity = () => {
    if (product?.isActive === false) {
      toast.error('Sản phẩm hiện đã ngừng bán.');
      return false;
    }
    if (product.stock <= 0) {
      toast.error('Sản phẩm đã hết hàng.');
      return false;
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      toast.error('Vui lòng nhập số lượng hợp lệ.');
      setQuantity(1);
      return false;
    }
    if (quantity > product.stock) {
      toast.error(`Chỉ còn tối đa ${product.stock} sản phẩm.`);
      setQuantity(product.stock);
      return false;
    }
    return true;
  };

  const ensureAuthenticated = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) return true;
    if (!userInfo) {
      toast.info(t('messages.loginRequired'));
      setTimeout(() => {
        navigate('/login', { replace: true, state: { from: `/product-detail/${product.id}` } });
      }, 1200);
    }
    return false;
  };

  useEffect(() => {
    const fetchWishlistState = async () => {
      try {
        if (!product?.id) return;
        const res = await WishlistService.getList(1, 100);
        const items = res?.items || res?.Items || [];
        const found = items.find((i) => (i.productId || i.product?.id) === product.id);
        if (found) {
          setIsFavorite(true);
          setWishItemId(found.wishListItemId || found.id);
        }
      } catch (err) {
        console.error('Load wishlist state error:', err);
      }
    };
    fetchWishlistState();
  }, [product]);

  useEffect(() => {
    if (typeof selectedImageIndex === 'number') {
      setSelectedImage(selectedImageIndex);
    }
  }, [selectedImageIndex]);

  const images = product?.images && product.images.length > 0
    ? product.images
    : ['/images/default-product.png'];

  const mainImage = images[selectedImage] || images[0];
  const thumbnailsPerPage = 4;
  const maxThumbnailStart = Math.max(0, images.length - thumbnailsPerPage);

  useEffect(() => {
    if (images.length <= thumbnailsPerPage) {
      if (thumbnailStart !== 0) setThumbnailStart(0);
      return;
    }

    if (selectedImage < thumbnailStart) {
      setThumbnailStart(Math.max(0, selectedImage - (selectedImage % thumbnailsPerPage)));
    } else if (selectedImage >= thumbnailStart + thumbnailsPerPage) {
      setThumbnailStart(Math.max(0, selectedImage - thumbnailsPerPage + 1));
    }
  }, [images.length, selectedImage, thumbnailStart, thumbnailsPerPage]);

  if (!product) return null;

  const storeDisplayName = shopInfo?.name
    || product?.shopName
    || product?.artisanName
    || product?.displayName
    || 'HoaLac Handicraft';

  const totalSold = Number(product?.quantitySale ?? product?.sold ?? 0);

  const resolveMessage = (key, fallback) => {
    const value = t(key);
    if (value && value !== key) {
      return value;
    }
    return fallback ?? key;
  };

  const handleAddToCart = async (redirect = false) => {
    if (isOwnedByCurrentArtisan(product, userInfo)) {
      toast.info(resolveMessage('messages.cannotBuyOwnProduct', 'Bạn không thể mua sản phẩm của chính mình.'));
      return;
    }
    if (!validateQuantity()) return;
    if (!ensureAuthenticated()) return;
    try {
      const result = await CartService.addItemValidated(product.id, product.price ?? 0, quantity, product.stock);
      if (!result?.success) {
        toast.error(result?.message || t('messages.addToCartError'));
        return;
      }

      if (result.limited) {
        toast.info(`Chỉ thêm được ${result.added} sản phẩm dựa trên số lượng sản phẩm có sẵn và sản phẩm trong giỏ hàng của bạn.`);
      } else {
        toast.success(redirect ? t('messages.addedToCartRedirect') : t('messages.addedToCart'));
      }
      if (redirect) {
        navigate('/cart');
      }
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message
        || err?.response?.data?.title
        || err?.message
        || t('messages.addToCartError');
      toast.error(message);
    }
  };

  const updateSelectedImage = (nextIndex) => {
    const safeIndex = ((nextIndex % images.length) + images.length) % images.length;
    setSelectedImage(safeIndex);
    if (typeof onSelectImage === 'function') {
      onSelectImage(safeIndex);
    }
  };

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    updateSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1);
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;
    updateSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1);
  };

  const handlePrevThumbnail = () => {
    setThumbnailStart((prev) => Math.max(0, prev - thumbnailsPerPage));
  };

  const handleNextThumbnail = () => {
    setThumbnailStart((prev) => Math.min(maxThumbnailStart, prev + thumbnailsPerPage));
  };

  const handleToggleFavorite = async () => {
    if (!ensureAuthenticated()) return;
    try {
      if (isFavorite && wishItemId) {
        await WishlistService.remove(wishItemId);
        setIsFavorite(false);
        setWishItemId(null);
        toast.success(t('Đã xoá khỏi yêu thích') || 'Đã xoá khỏi yêu thích');
      } else {
        await WishlistService.add(product.id);
        setIsFavorite(true);
        toast.success(t('Đã thêm vào yêu thích') || 'Đã thêm vào yêu thích');
        // Reload to capture i
        const res = await WishlistService.getList(1, 50);
        const items = res?.items || res?.Items || [];
        const found = items.find((i) => (i.productId || i.product?.id) === product.id);
        if (found) setWishItemId(found.wishListItemId || found.id);
      }
    } catch (err) {
      console.error('Toggle favorite error:', err);
      toast.error(err?.response?.data?.message || 'Không thể cập nhật yêu thích.');
    }
  };

  const handleSubmitReport = async () => {
    if (!product?.id) return;
    if (!ensureAuthenticated()) return;
    if (!reportReasonKey) {
      toast.warn('Vui lòng chọn lý do báo cáo');
      return;
    }
    if (reportReasonKey === 'OTHER' && !reportNotes.trim()) {
      toast.warn('Vui lòng nhập lý do cụ thể');
      return;
    }
    try {
      setReportSubmitting(true);
      const reasonOption = reportOptions.find((opt) => opt.value === reportReasonKey);
      const baseReason = reasonOption?.label || '';
      let finalReason = baseReason;
      if (reportReasonKey === 'OTHER') {
        finalReason = reportNotes.trim();
      } else if (reportNotes.trim()) {
        finalReason = `${baseReason} - ${reportNotes.trim()}`;
      }
      await ReportService.reportProduct(product.id, finalReason);
      toast.success('Đã gửi báo cáo sản phẩm');
      setReportModalOpen(false);
      setReportReasonKey('');
      setReportNotes('');
    } catch (error) {
      console.error('Report product error:', error);
      const message =
        error?.response?.data?.message
        || error?.message
        || 'Không thể gửi báo cáo';
      toast.error(message);
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <>
    <div className="w-full py-8 bg-gradient-to-b from-[#FFF8E7] to-[#FFFDEB]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-[#D4A574]">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5" />
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-3 hover:bg-[#D4A574] hover:text-white transition-all duration-300 border-2 border-[#D4A574]"
                    aria-label="Previous image"
                  >
                    <span className="text-xl">{'<'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-3 hover:bg-[#D4A574] hover:text-white transition-all duration-300 border-2 border-[#D4A574]"
                    aria-label="Next image"
                  >
                    <span className="text-xl">{'>'}</span>
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="lg:hidden relative">
                {thumbnailStart > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevThumbnail}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full shadow-md p-2 hover:bg-[#D4A574] hover:text-white transition-all"
                  >
                    <FaChevronLeft size={16} />
                  </button>
                )}

                <div className="grid grid-cols-4 gap-2 px-8">
                  {images.slice(thumbnailStart, thumbnailStart + thumbnailsPerPage).map((img, idx) => {
                    const actualIndex = thumbnailStart + idx;
                    return (
                      <button
                        type="button"
                        key={img}
                        onClick={() => updateSelectedImage(actualIndex)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                          selectedImage === actualIndex
                            ? 'border-[#D4A574] shadow-lg ring-2 ring-[#8B4513]/40'
                            : 'border-transparent hover:border-[#D4A574]/50'
                        }`}
                      >
                        <img src={img} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>

                {thumbnailStart < maxThumbnailStart && (
                  <button
                    type="button"
                    onClick={handleNextThumbnail}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full shadow-md p-2 hover:bg-[#D4A574] hover:text-white transition-all"
                  >
                    <FaChevronRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#FFF1E5] text-[#8B4513] px-3 py-1 rounded-full text-xs font-semibold border border-[#D4A574]/40">
                  <FaStore />
                  {storeDisplayName}
                </div>
                <div className="flex items-start gap-3">
                  <h1 className="mt-3 text-2xl md:text-3xl font-bold text-[#8B4513] leading-snug flex-1">
                    {product.name}
                  </h1>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-lg text-yellow-400">
                    {renderStars(product.rating || 0)}
                  </div>
                  <span className="text-sm text-gray-500">
                    {t('productCard.rating', { count: (product.rating || 0).toFixed(1) })}
                  </span>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm text-gray-500">
                    {t('productCard.sold', { count: totalSold })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`p-3 relative bg-white rounded-full transition-all duration-300 border border-[#D4A574]/50 shadow hover:bg-[#D4A574]/20 hover:scale-105 ${isFavorite ? 'ring-2 ring-red-200' : ''}`}
                >
                  {isFavorite && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-red-400/40" aria-hidden />
                  )}
                  {isFavorite ? (
                    <FaHeart className="text-red-500 relative" size={20} />
                  ) : (
                    <FaRegHeart className="text-red-600 relative" size={20} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(true)}
                  className="p-3 bg-white rounded-full border border-[#D4A574]/50 shadow hover:bg-[#D4A574]/20 transition-all duration-300"
                  title="Báo cáo sản phẩm"
                >
                  <FaFlag className="text-[#8B4513]" size={18} />
                </button>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border-l-4 border-[#D4A574]">
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">{product.shortDescription}</p>
            </div>

            <div className="bg-gradient-to-r from-[#8B4513] to-[#A0522D] rounded-xl p-5 shadow-lg text-center border-2 border-[#D4A574]">
              <p className="text-sm text-white/80 mb-1">Giá bán</p>
              <div className="text-3xl font-bold text-white">
                {product.price.toLocaleString('vi-VN')} VND
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-1 bg-[#FFF8E7] px-3 py-2 rounded-full border border-[#E2C8A2]">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange('decrease')}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-[#D4A574] text-[#8B4513] hover:bg-[#D4A574] hover:text-white transition text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={product.stock}
                    value={quantity}
                    onChange={handleQuantityInputChange}
                    className="w-16 text-center text-base font-semibold text-[#8B4513] bg-transparent border-none focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange('increase')}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-[#D4A574] text-[#8B4513] hover:bg-[#D4A574] hover:text-white transition text-sm"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  <FaBoxOpen className="inline-block mr-1 text-[#8B4513]" />
                  {product.stock > 0 ? `${product.stock} sản phẩm có sẵn` : 'Hết hàng'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-[#F1E0C8]">
                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#8B4513] text-white text-lg font-semibold shadow-lg hover:bg-[#DDA15E] transition-all duration-300 disabled:opacity-60"
                  disabled={product.stock <= 0 || product.isActive === false}
                >
                  <FaShoppingCart />
                  {t('productCard.addToCart')}
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[#8B4513] text-[#8B4513] text-lg font-semibold hover:bg-[#FFF8E7] transition-all duration-300 disabled:opacity-60"
                  disabled={product.stock <= 0 || product.isActive === false}
                >
                  <FaBolt />
                  {t('productCard.buyNow')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {reportModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#8B4513]">Báo cáo sản phẩm</h3>
                <p className="text-sm text-gray-500">Hãy cho chúng tôi biết vấn đề gặp phải</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(false);
                  setReportReasonKey('');
                  setReportNotes('');
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Lý do báo cáo <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportReasonKey}
                  onChange={(e) => setReportReasonKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Chọn lý do --</option>
                  {reportOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ghi chú thêm {reportReasonKey === 'OTHER' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  rows="4"
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(false);
                  setReportReasonKey('');
                  setReportNotes('');
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white transition-colors"
                disabled={reportSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white font-semibold shadow hover:opacity-90 transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled={reportSubmitting}
              >
                {reportSubmitting && <FaSpinner className="animate-spin" />}
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShortDescription;
