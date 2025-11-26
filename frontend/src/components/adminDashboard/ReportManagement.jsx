import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FaFilter,
  FaFileExport,
  FaEye,
  FaUserShield,
  FaSpinner,
  FaCheckCircle,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Pagination from '../shared/Pagination';
import { ReportService } from '../../services/modules/report/reportService';
import { UserContext } from '../../context/UserContext';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Pending', label: 'Chờ xử lý' },
  { value: 'InReview', label: 'Đang xử lý' },
  { value: 'Appealed', label: 'Đang khiếu nại' },
  { value: 'Resolved', label: 'Đã giải quyết' },
];

const STATUS_LABELS = {
  Pending: 'Chờ xử lý',
  InReview: 'Đang xử lý',
  Appealed: 'Đang khiếu nại',
  Resolved: 'Đã giải quyết',
};

const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-800',
  InReview: 'bg-blue-100 text-blue-800',
  Appealed: 'bg-purple-100 text-purple-800',
  Resolved: 'bg-green-100 text-green-800',
};

const TARGET_TYPE_LABELS = {
  Product: 'Sản phẩm',
  Order: 'Đơn hàng',
  Seller: 'Người bán',
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', { hour12: false });
};

const ReportManagement = () => {
  const { userInfo } = useContext(UserContext);
  const currentAdminId = useMemo(
    () => userInfo?.userID || userInfo?.userId || userInfo?.id || null,
    [userInfo],
  );

  const [reports, setReports] = useState([]);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);

  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: '',
  });
  const [searchInput, setSearchInput] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailReport, setDetailReport] = useState(null);
  const [assignNote, setAssignNote] = useState('');
  const [statusForm, setStatusForm] = useState({
    newStatus: '',
    adminNote: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ReportService.list({
        status: filters.status,
        searchTerm: filters.searchTerm,
        pageIndex,
        pageSize,
      });
      setReports(response?.items || []);
      setMeta({
        totalCount: response?.totalCount || 0,
        totalPages: response?.totalPages || 1,
      });
    } catch (error) {
      console.error('Fetch reports error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Không thể tải danh sách báo cáo',
      );
      setReports([]);
      setMeta({ totalCount: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [filters, pageIndex, pageSize]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const stats = useMemo(() => {
    const base = {
      total: meta.totalCount || reports.length,
      pending: 0,
      inReview: 0,
      appealed: 0,
      resolved: 0,
    };
    reports.forEach((report) => {
      const status = (report.status || '').toLowerCase();
      if (status === 'pending') base.pending += 1;
      if (status === 'inreview') base.inReview += 1;
      if (status === 'appealed') base.appealed += 1;
      if (status === 'resolved') base.resolved += 1;
    });
    return base;
  }, [reports, meta.totalCount]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      searchTerm: searchInput.trim(),
    }));
    setPageIndex(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters((prev) => ({
      ...prev,
      searchTerm: '',
    }));
    setPageIndex(1);
  };

  const openDetail = async (reportId) => {
    if (!reportId) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setAssignNote('');
    setStatusForm({ newStatus: '', adminNote: '' });
    try {
      const detail = await ReportService.getDetail(reportId);
      setDetailReport(detail);
      setStatusForm({
        newStatus: detail?.status || '',
        adminNote: detail?.adminNotes || '',
      });
    } catch (error) {
      console.error('Fetch report detail error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Không thể tải chi tiết báo cáo',
      );
      setDetailReport(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailReport(null);
    setAssignNote('');
    setStatusForm({ newStatus: '', adminNote: '' });
  };

  const refreshDetail = async () => {
    if (!detailReport?.reportId) return;
    try {
      const detail = await ReportService.getDetail(detailReport.reportId);
      setDetailReport(detail);
      setStatusForm({
        newStatus: detail?.status || '',
        adminNote: detail?.adminNotes || '',
      });
    } catch (error) {
      console.error('Refresh detail error:', error);
    }
  };

  const handleAssign = async () => {
    if (!detailReport?.reportId) return;
    setActionLoading(true);
    try {
      await ReportService.assign(detailReport.reportId, assignNote.trim() || undefined);
      toast.success('Đã nhận xử lý báo cáo');
      await Promise.all([refreshDetail(), fetchReports()]);
      setAssignNote('');
    } catch (error) {
      console.error('Assign report error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Không thể giao xử lý báo cáo',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!detailReport?.reportId) return;
    if (!statusForm.newStatus) {
      toast.error('Vui lòng chọn trạng thái');
      return;
    }
    setActionLoading(true);
    try {
      await ReportService.updateStatus(detailReport.reportId, statusForm);
      toast.success('Đã cập nhật trạng thái báo cáo');
      await Promise.all([refreshDetail(), fetchReports()]);
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Không thể cập nhật trạng thái',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const normalized = status?.trim();
    const color = STATUS_COLORS[normalized] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
        {STATUS_LABELS[normalized] || normalized || '--'}
      </span>
    );
  };

  const getTargetLabel = (report) => {
    const typeLabel = TARGET_TYPE_LABELS[report.targetType] || report.targetType || 'Khác';
    return `${typeLabel}${report.targetName ? ` • ${report.targetName}` : ''}`;
  };

  const isAssignedToCurrentAdmin = useMemo(() => {
    if (!detailReport?.assignedAdminId || !currentAdminId) return false;
    return detailReport.assignedAdminId.toLowerCase() === currentAdminId.toLowerCase();
  }, [detailReport, currentAdminId]);

  const allowAssignment = useMemo(() => {
    if (!detailReport) return false;
    if (!currentAdminId) return false;
    if (!detailReport.assignedAdminId) return ['Pending', 'Appealed'].includes(detailReport.status);
    return isAssignedToCurrentAdmin;
  }, [detailReport, currentAdminId, isAssignedToCurrentAdmin]);

  const statusUpdateDisabled = useMemo(() => {
    if (!detailReport?.assignedAdminId) return false;
    if (!currentAdminId) return true;
    return detailReport.assignedAdminId.toLowerCase() !== currentAdminId.toLowerCase();
  }, [detailReport, currentAdminId]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý báo cáo & khiếu nại</h2>
          <p className="text-sm text-gray-600 mt-1">Giám sát các báo cáo từ khách hàng và nghệ nhân</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, người báo cáo..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tìm
            </button>
            {filters.searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Xóa
              </button>
            )}
          </form>
          <button
            type="button"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaFileExport /> Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tổng báo cáo</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Chờ xử lý</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
          <p className="text-sm text-gray-600">Đang xử lý</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.inReview + stats.appealed}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Đã giải quyết</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.resolved}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaFilter />
          <span>Lọc kết quả</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, status: e.target.value }));
              setPageIndex(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="py-3 px-4">Mã báo cáo</th>
              <th className="py-3 px-4">Đối tượng</th>
              <th className="py-3 px-4">Người báo cáo</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Ngày tạo</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin" />
                    <span>Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  Không có báo cáo nào phù hợp
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.reportId} className="border-t border-gray-100 text-sm hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-800">{report.reportId}</td>
                  <td className="py-3 px-4">
                    <p className="text-gray-800 font-medium">{getTargetLabel(report)}</p>
                    {report.targetUserName && (
                      <p className="text-xs text-gray-500">Người bán: {report.targetUserName}</p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-800 font-medium">{report.reporterName || report.reporterId}</p>
                    <p className="text-xs text-gray-500">{report.reporterId}</p>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(report.status)}
                    {report.appealStatus && (
                      <div className="mt-1 text-xs text-purple-700">Khiếu nại: {report.appealStatus}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{formatDateTime(report.createdAt)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => openDetail(report.reportId)}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                    >
                      <FaEye /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            totalPages={meta.totalPages}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
          />
        </div>
      )}

      {detailOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#8B4513]">Chi tiết báo cáo</h3>
                <p className="text-sm text-gray-500">{detailReport?.reportId || ''}</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm text-gray-700 max-h-[75vh] overflow-y-auto">
              {detailLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-500 gap-2">
                  <FaSpinner className="animate-spin" />
                  <span>Đang tải chi tiết...</span>
                </div>
              ) : !detailReport ? (
                <p className="text-center text-gray-500">Không tìm thấy dữ liệu</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Đối tượng</p>
                      <p className="font-semibold text-gray-900">{getTargetLabel(detailReport)}</p>
                      {detailReport.targetId && (
                        <p className="text-xs text-gray-500">ID: {detailReport.targetId}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500">Trạng thái</p>
                      <div className="mt-1">{getStatusBadge(detailReport.status)}</div>
                      {detailReport.appealStatus && (
                        <p className="text-xs text-purple-700 mt-1">
                          Khiếu nại: {detailReport.appealStatus}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-500 mb-2">Người báo cáo</p>
                      <p className="font-semibold text-gray-900">{detailReport.reporterName || '--'}</p>
                      <p className="text-xs text-gray-500">ID: {detailReport.reporterId}</p>
                      <p className="text-xs text-gray-500">{detailReport.reporterEmail}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-500 mb-2">Người bị báo cáo</p>
                      <p className="font-semibold text-gray-900">{detailReport.targetUserName || '--'}</p>
                      <p className="text-xs text-gray-500">ID: {detailReport.targetUserId || '--'}</p>
                      <p className="text-xs text-gray-500">{detailReport.targetUserEmail || ''}</p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs uppercase text-gray-500 mb-2">Lý do báo cáo</p>
                    <p className="text-gray-900">{detailReport.reason || '--'}</p>
                  </div>

                  {detailReport.adminNotes && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-500 mb-2">Ghi chú quản trị</p>
                      <p className="text-gray-900">{detailReport.adminNotes}</p>
                    </div>
                  )}

                  {detailReport.appealReason && (
                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                      <p className="text-xs uppercase text-purple-600 mb-2">Lý do khiếu nại</p>
                      <p className="text-gray-900">{detailReport.appealReason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-500 mb-2">Phân công</p>
                      {detailReport.assignedAdminName ? (
                        <>
                          <p className="font-semibold text-gray-900">{detailReport.assignedAdminName}</p>
                          <p className="text-xs text-gray-500">{detailReport.assignedAdminId}</p>
                          <p className="text-xs text-gray-500">Từ: {formatDateTime(detailReport.assignedAt)}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">Chưa được phân công</p>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-500 mb-2">Mốc thời gian</p>
                      <p className="text-xs text-gray-600">Tạo: {formatDateTime(detailReport.createdAt)}</p>
                      <p className="text-xs text-gray-600">Giải quyết: {formatDateTime(detailReport.resolvedAt)}</p>
                      <p className="text-xs text-gray-600">Khiếu nại: {formatDateTime(detailReport.appealedAt)}</p>
                    </div>
                  </div>

                  {allowAssignment && (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                        <FaUserShield /> Nhận xử lý báo cáo
                      </div>
                      <textarea
                        placeholder="Ghi chú (không bắt buộc)"
                        value={assignNote}
                        onChange={(e) => setAssignNote(e.target.value)}
                        className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white mb-3"
                      />
                      <button
                        type="button"
                        onClick={handleAssign}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                      >
                        Nhận xử lý
                      </button>
                    </div>
                  )}

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold mb-3">
                      <FaCheckCircle /> Cập nhật trạng thái
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">Trạng thái mới</label>
                        <select
                          value={statusForm.newStatus}
                          onChange={(e) => setStatusForm((prev) => ({ ...prev, newStatus: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                          disabled={statusUpdateDisabled}
                        >
                          <option value="">-- Chọn --</option>
                          {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {statusUpdateDisabled && (
                          <p className="text-xs text-red-500 mt-1">Báo cáo đang do admin khác xử lý</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">Ghi chú</label>
                        <textarea
                          value={statusForm.adminNote}
                          onChange={(e) => setStatusForm((prev) => ({ ...prev, adminNote: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                          placeholder="Thêm ghi chú cho tình trạng mới"
                          rows={3}
                          disabled={statusUpdateDisabled}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={handleUpdateStatus}
                        disabled={actionLoading || statusUpdateDisabled}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                      >
                        Cập nhật trạng thái
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={closeDetail}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
