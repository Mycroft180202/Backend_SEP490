import React from 'react';
import PropTypes from 'prop-types';
import { FaTimes } from 'react-icons/fa';

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  confirming = false,
  tone = 'danger',
}) {
  if (!isOpen) return null;

  const headerClass = tone === 'danger'
    ? 'bg-gradient-to-r from-red-500 to-red-600'
    : 'bg-gradient-to-r from-[#9e211f] to-red-700';

  const confirmClass = tone === 'danger'
    ? 'bg-red-500 hover:bg-red-600'
    : 'bg-[#9e211f] hover:bg-red-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className={`flex items-center justify-between px-6 py-4 ${headerClass}`}>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-white/80 transition-colors hover:text-white disabled:opacity-60"
            aria-label="Close"
            disabled={confirming}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-6 text-center text-sm text-gray-700">
            {description}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={confirming}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-300 disabled:opacity-60"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirming}
              className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition-colors disabled:opacity-60 ${confirmClass}`}
            >
              {confirming ? 'Đang xử lý...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirming: PropTypes.bool,
  tone: PropTypes.oneOf(['danger', 'primary']),
};

