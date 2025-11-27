import React, { useState, useEffect, useCallback } from "react";
import { FaTimes, FaSpinner } from "react-icons/fa";
import { OrderService } from "../../services/modules/orders/orderService";
import { ProductService } from "../../services/modules/products/productService";
import { CategoryService } from "../../services/modules/products/categoryService";
import { AddressService } from "../../services/modules/orders/addressService";
import { toast } from "react-toastify";
import { formatCurrency } from "../../utils/formatCurrency";
import CancelOrderDialog from "./CancelOrderDialog";

const statusConfigs = {
  Pending: {
    label: 'Chờ thanh toán',
    className: 'bg-yellow-100 text-yellow-800',
  },
  Paid: {
    label: 'Đã thanh toán',
    className: 'bg-green-100 text-green-800',
  },
  Cancelled: {
    label: 'Đã hủy',
    className: 'bg-red-100 text-red-700',
  },
  Default: {
    label: 'Không xác định',
    className: 'bg-gray-100 text-gray-700',
  },
};

function OrderDetailModal({ orderNumber, isOpen, onClose, onOrderCancelled }) {
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
            name: `Sản phẩm ${item.productID}`,
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
      console.error("Error fetching order detail:", error);
      toast.error("Không thể tải chi tiết đơn hàng");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [orderNumber, onClose]);

  useEffect(() => {
    if (isOpen && orderNumber) {
      fetchOrderDetail();
    }
  }, [isOpen, orderNumber, fetchOrderDetail]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-red-700 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold font-alata">Chi tiết đơn hàng</h2>
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
            <p className="ml-4 text-gray-600 font-nunito">Đang tải...</p>
          </div>
        ) : orderDetail ? (
          <div className="px-6 py-6 space-y-6">
            {/* Order Header Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-nunito">Mã đơn hàng</p>
                  <p className="font-alata text-lg font-bold text-primary">
                    {orderDetail.orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-nunito">Trạng thái</p>
                  {(() => {
                    const config = statusConfigs[orderDetail.status] || statusConfigs.Default;
                    return (
                      <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-semibold ${config.className}`}>
                        {config.label}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-nunito">Ngày đặt hàng</p>
                  <p className="font-nunito text-gray-800">
                    {new Date(orderDetail.createAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-nunito">Thanh toán</p>
                  <p className="font-nunito text-gray-800">
                    {orderDetail.paymentType === "COD"
                      ? "Thanh toán khi nhận hàng"
                      : "VNPAY"}
                  </p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className="font-alata text-lg font-bold text-gray-800 mb-4">
                Sản phẩm ({orderDetail.items.length})
              </h3>
              <div className="space-y-4">
                {orderDetail.items.map((item, index) => {
                  const product = products[item.productID];
                  const categoryName = product
                    ? categories[product.category] || "Khác"
                    : "Đang tải...";

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
                              <span className="text-gray-400 text-xs">Không có ảnh</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-nunito font-semibold text-gray-800">
                                {product ? product.name : `Sản phẩm ${item.productID}`}
                              </p>
                              <p className="text-sm text-gray-600 font-nunito">
                                Danh mục: {categoryName}
                              </p>
                            </div>
                            <p className="font-alata text-lg font-bold text-primary">
                              {formatCurrency(item.unitPrice)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <p className="text-gray-600 font-nunito">
                              Số lượng: <span className="font-semibold">{item.quantity}</span>
                            </p>
                            <p className="font-nunito font-semibold text-gray-800">
                              Thành tiền:{" "}
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
            <div className="bg-gray-50 rounded-lg p-4 border-t-2 border-gray-200">
              <div className="flex justify-between items-center">
                <p className="font-alata text-lg font-bold text-gray-800">Tổng cộng:</p>
                <p className="font-alata text-2xl font-bold text-primary">
                  {formatCurrency(orderDetail.totalAmount)}
                </p>
              </div>
            </div>

            {/* Shipping Address Info */}
            {shippingAddress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-alata font-bold text-gray-800 mb-3">
                  Địa chỉ giao hàng
                </h3>
                <div className="space-y-2 font-nunito text-sm text-gray-800">
                  <div>
                    <p className="text-gray-600 text-xs">Người nhận</p>
                    <p className="font-semibold">
                      {shippingAddress.contactName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Số điện thoại</p>
                    <p className="font-semibold">
                      {shippingAddress.contactPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Địa chỉ chi tiết</p>
                    <p className="font-semibold">
                      {shippingAddress.line1}
                      {shippingAddress.line2 && `, ${shippingAddress.line2}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-gray-600 text-xs">Xã/Phường</p>
                      <p className="font-semibold truncate">
                        {shippingAddress.wardName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Huyện/Quận</p>
                      <p className="font-semibold truncate">
                        {shippingAddress.districtName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Tỉnh/TP</p>
                      <p className="font-semibold truncate">
                        {shippingAddress.provinceName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-gray-600">Quốc gia:</span>
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
                Đóng
              </button>
              {orderDetail.status === "Pending" && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-nunito font-semibold hover:bg-red-600 transition-colors"
                >
                  Hủy đơn hàng
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-600 font-nunito">
              Không thể tải chi tiết đơn hàng
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
