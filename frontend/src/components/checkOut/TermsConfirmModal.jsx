import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

export default function TermsConfirmModal({
  isOpen,
  checked,
  onCheckedChange,
  onViewPolicy,
  onCancel,
  onConfirm,
  confirming = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#8B4513]">Xác nhận điều khoản</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
            disabled={confirming}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Trước khi đặt hàng, vui lòng xác nhận bạn đã đọc rõ và hiểu các{' '}
            <Link
              to="/policy"
              state={{ returnTo: '/checkout', returnLabel: 'Quay lại thanh toán' }}
              onClick={onViewPolicy}
              className="text-[#9e211f] font-semibold hover:underline"
            >
              Chính sách &amp; Điều khoản
            </Link>{' '}
            của website.
          </p>

          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1 accent-[#9e211f]"
              checked={checked}
              onChange={(e) => onCheckedChange(e.target.checked)}
              disabled={confirming}
            />
            <span>
              Tôi đã đọc rõ và hiểu các Chính sách &amp; Điều khoản, và đồng ý tiếp tục đặt hàng.
            </span>
          </label>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white transition disabled:opacity-60"
            onClick={onCancel}
            disabled={confirming}
          >
            Hủy
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-[#9e211f] text-white font-semibold hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={onConfirm}
            disabled={!checked || confirming}
          >
            {confirming ? 'Đang xử lý...' : 'Tôi đồng ý'}
          </button>
        </div>
      </div>
    </div>
  );
}

TermsConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  checked: PropTypes.bool.isRequired,
  onCheckedChange: PropTypes.func.isRequired,
  onViewPolicy: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  confirming: PropTypes.bool,
};
