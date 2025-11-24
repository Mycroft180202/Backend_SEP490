import React, { useState } from "react";
import { formatCurrency } from "../../utils/formatCurrency";
import OrderDetailModal from "./OrderDetailModal";
import CancelOrderDialog from "./CancelOrderDialog";
import { OrderService } from "../../services/modules/orders/orderService";
import { toast } from "react-toastify";

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    'Pending': { bg: '#FFF3CD', text: '#856404', label: 'Chờ thanh toán' },
    'Paid': { bg: '#D4EDDA', text: '#155724', label: 'Đã thanh toán' },
    'Cancelled': { bg: '#F8D7DA', text: '#721C24', label: 'Đã hủy' },
  };

  const config = statusConfig[status] || { bg: '#E2E3E5', text: '#383D41', label: status };

  return (
    <span
      className="px-3 py-1 rounded-lg font-nunito text-sm font-semibold"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}

// Order card component
function OrderCard({ order }) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const createDate = new Date(order.createAt);
  const formattedDate = createDate.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleContinuePayment = async () => {
    try {
      toast.info('Đang xử lý thanh toán...');
      const response = await OrderService.continuePayment(order.orderNumber);
      
      if (response && response.paymentUrl) {
        // Redirect to VNPAY payment page
        window.location.href = response.paymentUrl;
      } else {
        toast.error('Không thể lấy link thanh toán. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error continuing payment:', error);
      toast.error('Có lỗi xảy ra khi tiếp tục thanh toán. Vui lòng thử lại.');
    }
  };

  // Check if order is VNPAY and Pending
  const showPaymentButton = order.paymentType === 'VNPAY' && order.status === 'Pending';

  return (
    <>
      <div className="w-full max-w-[1152px] bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Order Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-alata text-lg font-bold text-gray-800">Đơn hàng: {order.orderNumber}</p>
              <p className="font-nunito text-sm text-gray-600">{formattedDate}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-8 text-sm font-nunito">
            <div>
              <span className="text-gray-600">Phương thức thanh toán: </span>
              <span className="font-semibold text-gray-800">
                {order.paymentType === 'COD' ? 'Thanh toán khi nhận hàng' : 'VNPAY'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Tổng tiền: </span>
              <span className="font-alata text-lg text-primary font-bold">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Actions */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => setShowDetailModal(true)}
            className="px-4 py-2 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-nunito text-sm font-medium"
          >
            Xem chi tiết
          </button>
          {showPaymentButton && (
            <button
              onClick={handleContinuePayment}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors font-nunito text-sm font-medium"
            >
              Tiếp tục thanh toán
            </button>
          )}
          {order.status === 'Pending' && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="px-4 py-2 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-nunito text-sm font-medium"
            >
              Hủy đơn
            </button>
            
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderNumber={order.orderNumber}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onOrderCancelled={() => {
          // Notify parent component to refresh orders
          setShowDetailModal(false);
        }}
      />

      {/* Cancel Order Dialog - from Order Card */}
      <CancelOrderDialog
        isOpen={showCancelDialog}
        orderNumber={order.orderNumber}
        onClose={() => setShowCancelDialog(false)}
        onSuccess={() => {
          // Close dialog after successful cancellation
          setShowCancelDialog(false);
          // Reload page to refresh order list
          window.location.reload();
        }}
      />
    </>
  );
}

export default function OrderList({ orders }) {
  return (
    <div className="flex flex-col gap-6 items-center pb-[120px] pt-6 px-[144px] w-full">
      {orders.map((order, idx) => (
        <OrderCard key={idx} order={order} />
      ))}
    </div>
  );
}
