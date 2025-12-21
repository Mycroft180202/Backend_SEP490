import React, { useState } from "react";
import { FaSpinner, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { OrderService } from "../../services/modules/orders/orderService";

const RETURN_REASONS = [
  { id: 1, label: "Sản phẩm bị lỗi hư hỏng", value: "Product damaged" },
  { id: 2, label: "Sản phẩm không đúng mô tả", value: "Product mismatch" },
  { id: 3, label: "Thiếu phụ kiện / quà tặng", value: "Missing accessories" },
  { id: 4, label: "Sai kích thước / màu sắc", value: "Wrong size or color" },
  { id: 5, label: "Người bán giao sai sản phẩm", value: "Wrong product delivered" },
  { id: 6, label: "Lý do khác", value: "Other" },
];

function ReturnOrderDialog({ isOpen, orderNumber, onClose, onSuccess }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.warning("Vui lòng chọn lý do hoàn đơn");
      return;
    }

    let reasonText = selectedReason;
    if (selectedReason === "Other" && customReason.trim()) {
      reasonText = customReason.trim();
    } else if (selectedReason === "Other") {
      toast.warning("Vui lòng nhập lý do hoàn đơn");
      return;
    }

    try {
      setLoading(true);
      await OrderService.cancelOrderByNumber(orderNumber, reasonText);
      toast.success("Yêu cầu hoàn đơn đã được gửi");
      onSuccess?.();
      onClose?.();
      window.location.reload();
    } catch (error) {
      console.error("Error requesting return:", error);
      toast.error(error?.response?.data?.message || "Không thể gửi yêu cầu hoàn đơn");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="bg-gradient-to-r from-primary to-red-700 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold font-alata">Hoàn đơn hàng</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="px-6 py-6">
          <p className="text-gray-600 font-nunito mb-4">
            Vui lòng chọn lý do bạn muốn hoàn trả đơn hàng này
          </p>

          <div className="space-y-3 mb-6">
            {RETURN_REASONS.map((reason) => (
              <label
                key={reason.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name="return-reason"
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

          {selectedReason === "Other" && (
            <div className="mb-6">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do hoàn đơn của bạn..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                rows="3"
              />
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-yellow-800 text-sm font-nunito">
              ⓘ Chúng tôi sẽ liên hệ lại để xác nhận yêu cầu và hướng dẫn quy trình hoàn đơn.
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-nunito font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Để sau
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-nunito font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <FaSpinner className="animate-spin" />}
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReturnOrderDialog;
