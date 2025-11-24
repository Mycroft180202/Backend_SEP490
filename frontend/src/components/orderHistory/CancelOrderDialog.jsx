import React, { useState } from "react";
import { FaTimes, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import { OrderService } from "../../services/modules/orders/orderService";

const CANCEL_REASONS = [
  { id: 1, label: "Tôi không muốn mua nữa", value: "I don't want to buy anymore" },
  { id: 2, label: "Tìm được nơi khác rẻ hơn", value: "Found a cheaper alternative" },
  { id: 3, label: "Giao hàng quá lâu", value: "Delivery takes too long" },
  { id: 4, label: "Tôi đặt hàng bị nhầm", value: "Wrong order" },
  { id: 5, label: "Sản phẩm không như mô tả", value: "Product doesn't match description" },
  { id: 6, label: "Lý do khác", value: "Other" },
];

function CancelOrderDialog({ isOpen, orderNumber, onClose, onSuccess }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    // Validate selection
    if (!selectedReason) {
      toast.warning("Vui lòng chọn lý do hủy đơn hàng");
      return;
    }

    // Get the reason text
    let reasonText = selectedReason;
    if (selectedReason === "Other" && customReason.trim()) {
      reasonText = customReason.trim();
    } else if (selectedReason === "Other") {
      toast.warning("Vui lòng nhập lý do hủy đơn hàng");
      return;
    }

    try {
      setLoading(true);
      await OrderService.cancelOrderByNumber(orderNumber, reasonText);
      toast.success("Hủy đơn hàng thành công");
      onSuccess();
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(error?.response?.data?.message || "Không thể hủy đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-red-700 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold font-alata">Hủy đơn hàng</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-600 font-nunito mb-4">
            Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng
          </p>

          {/* Reason Options */}
          <div className="space-y-3 mb-6">
            {CANCEL_REASONS.map((reason) => (
              <label
                key={reason.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name="cancel-reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={() => {
                    setSelectedReason(reason.value);
                    if (reason.value !== "Other") {
                      setCustomReason("");
                    }
                  }}
                  className="w-4 h-4 text-primary cursor-pointer"
                />
                <span className="ml-3 font-nunito text-gray-800">{reason.label}</span>
              </label>
            ))}
          </div>

          {/* Custom Reason Input */}
          {selectedReason === "Other" && (
            <div className="mb-6">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn hàng của bạn..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                rows="3"
              />
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-red-700 text-sm font-nunito">
              ⚠️ Hành động này không thể hoàn tác. Bạn có chắc chắn muốn hủy đơn hàng này không?
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-nunito font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Không hủy
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-nunito font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <FaSpinner className="animate-spin" />}
            {loading ? "Đang hủy..." : "Xác nhận hủy"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelOrderDialog;
