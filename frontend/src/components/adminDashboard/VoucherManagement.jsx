import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSync,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Pagination from '../shared/Pagination';
import { VoucherService } from '../../services/modules/voucher/voucherService';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20];

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscountAmount: 0,
  startDate: '',
  endDate: '',
  usageLimit: 0,
  usedCount: 0,
  isActive: true,
};

const numberOrZero = (val) => {
  const num = Number(val);
  return Number.isNaN(num) ? 0 : num;
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  minimumFractionDigits: 0,
}).format(numberOrZero(value));

const formatDate = (value) => {
  if (!value) return '--';
  const d = new Date(value);
  // graceful display even if timezone offsets differ
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('vi-VN');
};

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [meta, setMeta] = useState({ totalPages: 1, totalCount: 0 });

  const [formData, setFormData] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const voucherIdOf = (item) => item?.id || item?.voucherId || item?.code;

  const loadVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await VoucherService.list(pageIndex, pageSize);
      const items = response?.items || [];
      const totalCount = response?.totalCount
        ?? response?.raw?.totalCount
        ?? items.length;
      const totalPages = response?.totalPages
        ?? response?.raw?.totalPages
        ?? Math.max(1, Math.ceil(totalCount / pageSize));

      setVouchers(items);
      setMeta({
        totalCount,
        totalPages,
        pageSize,
      });
    } catch (error) {
      console.error('Load vouchers error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Không thể tải danh sách voucher.',
      );
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  useEffect(() => {
    setPageIndex(1);
  }, [pageSize]);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      ...emptyForm,
      startDate: '',
      endDate: '',
    });
    setModalOpen(true);
  };

  const openEdit = (voucher) => {
    if (!voucher) return;
    setEditingId(voucherIdOf(voucher));
    setFormData({
      code: voucher.code || '',
      description: voucher.description || '',
      discountType: voucher.discountType || 'percent',
      discountValue: voucher.discountValue ?? voucher.value ?? 0,
      minOrderAmount: voucher.minOrderAmount ?? 0,
      maxDiscountAmount: voucher.maxDiscountAmount ?? 0,
      startDate: voucher.startDate ? voucher.startDate.substring(0, 10) : '',
      endDate: voucher.endDate ? voucher.endDate.substring(0, 10) : '',
      usageLimit: voucher.usageLimit ?? 0,
      usedCount: voucher.usedCount ?? 0,
      isActive: voucher.isActive !== undefined ? voucher.isActive : true,
      createdById: voucher.createdById,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      discountValue: numberOrZero(formData.discountValue),
      minOrderAmount: numberOrZero(formData.minOrderAmount),
      maxDiscountAmount: numberOrZero(formData.maxDiscountAmount),
      usageLimit: numberOrZero(formData.usageLimit),
      usedCount: numberOrZero(formData.usedCount),
    };

    try {
      if (editingId) {
        await VoucherService.update(editingId, payload);
        toast.success('Đã cập nhật voucher');
      } else {
        await VoucherService.create(payload);
        toast.success('Đã tạo voucher mới');
      }
      closeModal();
      await loadVouchers();
    } catch (error) {
      console.error('Save voucher error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Không thể lưu voucher.',
      );
    }
  };

  const handleDelete = async (voucher) => {
    const id = voucherIdOf(voucher);
    if (!id) return;
    setDeletingId(id);
    try {
      await VoucherService.remove(id);
      toast.success('Đã xóa voucher');
      await loadVouchers();
    } catch (error) {
      console.error('Delete voucher error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Không thể xóa voucher.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (voucher) => {
    const id = voucherIdOf(voucher);
    if (!id) return;
    const payload = {
      ...voucher,
      isActive: !voucher.isActive,
    };
    try {
      await VoucherService.update(id, payload);
      toast.success(payload.isActive ? 'Đã kích hoạt voucher' : 'Đã vô hiệu hóa voucher');
      await loadVouchers();
    } catch (error) {
      console.error('Toggle voucher error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Không thể cập nhật trạng thái voucher.',
      );
    }
  };

  const displayedVouchers = useMemo(() => vouchers, [vouchers]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý Voucher</h2>
          <p className="text-sm text-gray-600 mt-1">Tổng {meta.totalCount || displayedVouchers.length} voucher</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadVouchers}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <FaSync />
            Làm mới
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors"
          >
            <FaPlus />
            Thêm voucher
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-600">Số dòng:</label>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="py-3 px-4">Mã</th>
              <th className="py-3 px-4">Mô tả</th>
              <th className="py-3 px-4">Loại</th>
              <th className="py-3 px-4">Giá trị</th>
              <th className="py-3 px-4">Đơn tối thiểu</th>
              <th className="py-3 px-4">Giảm tối đa</th>
              <th className="py-3 px-4">Hiệu lực</th>
              <th className="py-3 px-4">Giới hạn</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : displayedVouchers.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-gray-500">
                  Chưa có voucher nào.
                </td>
              </tr>
            ) : (
              displayedVouchers.map((voucher) => {
                const id = voucherIdOf(voucher);
                const isPercent = (voucher.discountType || '').toLowerCase() === 'percent';
                return (
                  <tr key={id || voucher.code} className="border-b hover:bg-gray-50 text-sm">
                    <td className="py-3 px-4 font-semibold text-gray-800">{voucher.code || id}</td>
                    <td className="py-3 px-4 text-gray-700 line-clamp-2">{voucher.description || '--'}</td>
                    <td className="py-3 px-4 text-gray-700 capitalize">{voucher.discountType || '--'}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {isPercent ? `${numberOrZero(voucher.discountValue)}%` : formatCurrency(voucher.discountValue)}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{formatCurrency(voucher.minOrderAmount)}</td>
                    <td className="py-3 px-4 text-gray-700">{formatCurrency(voucher.maxDiscountAmount)}</td>
                    <td className="py-3 px-4 text-gray-700">
                      <div>{formatDate(voucher.startDate)}</div>
                      <div className="text-xs text-gray-500">đến {formatDate(voucher.endDate)}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <div>Giới hạn: {voucher.usageLimit ?? '--'}</div>
                      <div className="text-xs text-gray-500">Đã dùng: {voucher.usedCount ?? 0}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          voucher.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {voucher.isActive ? 'Đang hiệu lực' : 'Đã tắt'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(voucher)}
                          className={`px-3 py-2 rounded-lg text-white text-xs ${
                            voucher.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {voucher.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(voucher)}
                          className="px-3 py-2 rounded-lg text-blue-600 border border-blue-200 hover:bg-blue-50 flex items-center gap-1 text-xs"
                        >
                          <FaEdit /> Sửa
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === id}
                          onClick={() => handleDelete(voucher)}
                          className="px-3 py-2 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 flex items-center gap-1 text-xs disabled:opacity-60"
                        >
                          <FaTrash /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && meta.totalPages > 1 && (
        <Pagination
          totalPages={meta.totalPages}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
        />
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{editingId ? 'Cập nhật voucher' : 'Thêm voucher mới'}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher</label>
                <input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="percent">Percent</option>
                  <option value="Fixed">Fixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa</label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn lượt dùng</label>
                <input
                  type="number"
                  min="0"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đã dùng</label>
                <input
                  type="number"
                  min="0"
                  value={formData.usedCount}
                  onChange={(e) => setFormData({ ...formData, usedCount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Kích hoạt</label>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-red-700"
                >
                  {editingId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;
