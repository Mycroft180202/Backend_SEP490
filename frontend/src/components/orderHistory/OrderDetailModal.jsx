import React, { useCallback, useContext, useEffect, useState } from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { OrderService } from '../../services/modules/orders/orderService';
import { ProductService } from '../../services/modules/products/productService';
import { CategoryService } from '../../services/modules/products/categoryService';
import { AddressService } from '../../services/modules/orders/addressService';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/formatCurrency';
import CancelOrderDialog from './CancelOrderDialog';
import { LanguageContext } from '../../context/LanguageContext';

const STATUS_CLASSES = {
  WaitingForPickup: 'bg-yellow-100 text-yellow-800',
  Shipping: 'bg-blue-100 text-blue-800',
  Paid: 'bg-green-100 text-green-800',
  Completed: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-700',
};

const DEFAULT_STATUS_CLASS = 'bg-gray-100 text-gray-700';

function OrderDetailModal({ orderNumber, isOpen, onClose, onOrderCancelled }) {
  const { t, language } = useContext(LanguageContext);
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const getStatusLabel = useCallback(
    (status) => {
      const raw = t(`orderHistory.statuses.${status}`);
      return raw && !raw.includes('orderHistory.statuses.') ? raw : t('orderHistory.statuses.default');
    },
    [t],
  );
  const getStatusClass = useCallback(
    (status) => STATUS_CLASSES[status] || DEFAULT_STATUS_CLASS,
    [],
  );
  const [orderDetail, setOrderDetail] = useState(null);
  const [products, setProducts] = useState({});
  const [categories, setCategories] = useState({});
  const [shippingAddress, setShippingAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch order detail
      const order = await OrderService.getOrderDetail(orderNumber);
      setOrderDetail(order);

      // Fetch all categories for mapping
      const categoryList = await CategoryService.getAllCategories();
      const categoryMap = {};
      categoryList.forEach((cat) => {
        categoryMap[cat.id] = cat.name;
      });
      setCategories(categoryMap);

      // Fetch product details for each item in order
      const productMap = {};
      for (const item of order.items) {
        try {
          const productData = await ProductService.getProductById(item.productID);
          productMap[item.productID] = productData;
        } catch (error) {
          console.error(`Error fetching product ${item.productID}:`, error);
          // Set a placeholder if product fetch fails
          productMap[item.productID] = {
            id: item.productID,
            name: t('orderHistory.detailModal.productFallback', { id: item.productID }),
            price: item.unitPrice,
            category: "UNKNOWN",
            images: [],
          };
        }
      }
      setProducts(productMap);

      // Fetch shipping address details
      if (order.shipingAddressId) {
        try {
          const addressDetail = await AddressService.getAddressDetail(
            order.shipingAddressId
          );
          setShippingAddress(addressDetail);
        } catch (error) {
          console.error("Error fetching shipping address:", error);
          // Continue without address detail if fetch fails
        }
      }
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast.error(t('orderHistory.detailModal.error'));
      onClose();
    } finally {
      setLoading(false);
    }
  }, [orderNumber, onClose, t]);

  useEffect(() => {
    if (isOpen && orderNumber) {
      fetchOrderDetail();
    }
  }, [isOpen, orderNumber, fetchOrderDetail]);

  if (!isOpen) return null;

  // Derive monetary breakdown for order summary
  const subtotal = (() => {
    if (!orderDetail) return 0;
    const candidateSubtotals = [
      orderDetail.subtotalAmount,
      orderDetail.subtotal,
    ];
    const candidate = candidateSubtotals.find((value) => value !== undefined && value !== null);
    if (candidate !== undefined && candidate !== null && Number.isFinite(Number(candidate))) {
      return Number(candidate);
    }
    return orderDetail?.items?.reduce((sum, item) => (
      sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)
    ), 0) || 0;
  })();

  const discountAmount = (() => {
    if (!orderDetail) return 0;
    const candidateDiscounts = [orderDetail.discountAmount, orderDetail.discount, orderDetail.promotionAmount];
    const discount = candidateDiscounts.find((value) => value !== undefined && value !== null);
    return Number.isFinite(Number(discount)) ? Number(discount) : 0;
  })();

  const rawTotal = (() => {
    if (!orderDetail) return null;
    const candidates = [
      orderDetail.totalAmount,
      orderDetail.total,
      orderDetail.grandTotal,
      orderDetail.finalAmount,
      orderDetail.amount,
    ];
    const total = candidates.find((value) => value !== undefined && value !== null);
    return Number.isFinite(Number(total)) ? Number(total) : null;
  })();

  const fallbackShippingFee = (() => {
    if (!Number.isFinite(rawTotal)) return 0;
    const computed = rawTotal - subtotal + discountAmount;
    return computed > 0 ? computed : 0;
  })();

  const shippingFee = (() => {
    if (!orderDetail) return 0;
    const candidateFees = [
      orderDetail.shippingFee,
      orderDetail.shipingFee,
      orderDetail.shippingProviderFee,
      orderDetail.deliveryFee,
      orderDetail.shippingCost,
      orderDetail.feeShipping,
    ];
    const fee = candidateFees.find((value) => value !== undefined && value !== null);
    if (fee !== undefined && fee !== null && Number.isFinite(Number(fee))) {
      return Number(fee);
    }
    return fallbackShippingFee;
  })();

  const grandTotal = Number.isFinite(rawTotal)
    ? rawTotal
    : subtotal + shippingFee - discountAmount;

  const finalTotal = Number.isFinite(rawTotal) ? rawTotal : grandTotal;

  const voucherDiscount = (() => {
    if (discountAmount > 0) {
      return discountAmount;
    }
    if (!Number.isFinite(finalTotal)) {
      return 0;
    }
    const computed = subtotal + shippingFee - finalTotal;
    return computed > 0 ? computed : 0;
  })();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-red-700 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold font-alata">{t('orderHistory.detailModal.title')}</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-primary text-3xl" />
            <p className="ml-4 text-gray-600 font-nunito">{t('orderHistory.detailModal.loading')}</p>
          </div>
        ) : orderDetail ? (
          <div className="px-6 py-6 space-y-6">
            {/* Order Header Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-nunito">{t('orderHistory.detailModal.orderCode')}</p>
                  <p className="font-alata text-lg font-bold text-primary">
                    {orderDetail.orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-nunito">{t('orderHistory.detailModal.status')}</p>
                  {(() => {
                    const statusClass = getStatusClass(orderDetail.status);
                    const statusLabel = getStatusLabel(orderDetail.status);
                    return (
                      <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-semibold ${statusClass}`}>
                        {statusLabel}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-nunito">{t('orderHistory.detailModal.orderDate')}</p>
                  <p className="font-nunito text-gray-800">
                    {new Date(orderDetail.createAt).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-nunito">{t('orderHistory.detailModal.payment')}</p>
                  <p className="font-nunito text-gray-800">
                    {orderDetail.paymentType === 'COD'
                      ? t('orderHistory.detailModal.paymentCOD')
                      : t('orderHistory.detailModal.paymentVNPAY')}
                  </p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className="font-alata text-lg font-bold text-gray-800 mb-4">
                {t('orderHistory.detailModal.products', { count: orderDetail.items.length })}
              </h3>
              <div className="space-y-4">
                {orderDetail.items.map((item, index) => {
                  const product = products[item.productID];
                  const categoryName = product
                    ? categories[product.category] || t('orderHistory.detailModal.categoryFallback')
                    : t('orderHistory.detailModal.loading');

                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                          {product && product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <span className="text-gray-400 text-xs">{t('orderHistory.detailModal.noImage')}</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-nunito font-semibold text-gray-800">
                                {product ? product.name : t('orderHistory.detailModal.productFallback', { id: item.productID })}
                              </p>
                              <p className="text-sm text-gray-600 font-nunito">
                                {t('orderHistory.detailModal.category')}: {categoryName}
                              </p>
                            </div>
                            <p className="font-alata text-lg font-bold text-primary">
                              {formatCurrency(item.unitPrice)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <p className="text-gray-600 font-nunito">
                              {t('orderHistory.detailModal.quantity')}: <span className="font-semibold">{item.quantity}</span>
                            </p>
                            <p className="font-nunito font-semibold text-gray-800">
                              {t('orderHistory.detailModal.lineTotal')}: 
                              <span className="text-primary">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
              <div className="flex justify-between text-sm font-nunito">
                <span className="text-gray-600">{t('orderHistory.detailModal.summary.subtotal')}</span>
                <span className="text-gray-800 font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-nunito">
                <span className="text-gray-600">{t('orderHistory.detailModal.summary.shippingFee')}</span>
                <span className="text-gray-800 font-semibold">{formatCurrency(shippingFee)}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-sm font-nunito text-red-600">
                  <span>{t('orderHistory.detailModal.summary.voucherDiscount')}</span>
                  <span>-{formatCurrency(voucherDiscount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <p className="font-alata text-lg font-bold text-gray-800">{t('orderHistory.detailModal.summary.total')}</p>
                <p className="font-alata text-2xl font-bold text-primary">
                  {formatCurrency(grandTotal)}
                </p>
              </div>
            </div>

            {/* Shipping Address Info */}
            {shippingAddress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-alata font-bold text-gray-800 mb-3">
                  {t('orderHistory.detailModal.shippingAddress.title')}
                </h3>
                <div className="space-y-2 font-nunito text-sm text-gray-800">
                  <div>
                    <p className="text-gray-600 text-xs">{t('orderHistory.detailModal.shippingAddress.recipient')}</p>
                    <p className="font-semibold">
                      {shippingAddress.contactName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">{t('orderHistory.detailModal.shippingAddress.phone')}</p>
                    <p className="font-semibold">
                      {shippingAddress.contactPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">{t('orderHistory.detailModal.shippingAddress.detail')}</p>
                    <p className="font-semibold">
                      {shippingAddress.line1}
                      {shippingAddress.line2 && `, ${shippingAddress.line2}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-gray-600 text-xs">{t('orderHistory.detailModal.shippingAddress.ward')}</p>
                      <p className="font-semibold truncate">
                        {shippingAddress.wardName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">{t('orderHistory.detailModal.shippingAddress.district')}</p>
                      <p className="font-semibold truncate">
                        {shippingAddress.districtName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">{t('orderHistory.detailModal.shippingAddress.province')}</p>
                      <p className="font-semibold truncate">
                        {shippingAddress.provinceName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-gray-600">{t('orderHistory.detailModal.shippingAddress.country')}:</span>
                    <span className="font-semibold">{shippingAddress.country}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-nunito font-semibold hover:bg-gray-300 transition-colors"
              >
                {t('orderHistory.detailModal.actions.close')}
              </button>
              {["WaitingForPickup", "Paid"].includes(orderDetail.status) && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-nunito font-semibold hover:bg-red-600 transition-colors"
                >
                  {t('orderHistory.detailModal.actions.cancelOrder')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-600 font-nunito">
              {t('orderHistory.detailModal.error')}
            </p>
          </div>
        )}

        {/* Cancel Order Dialog */}
        <CancelOrderDialog
          isOpen={showCancelDialog}
          orderNumber={orderNumber}
          onClose={() => setShowCancelDialog(false)}
          onSuccess={() => {
            // Close dialog and reload page after cancellation
            setShowCancelDialog(false);
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}

export default OrderDetailModal;
