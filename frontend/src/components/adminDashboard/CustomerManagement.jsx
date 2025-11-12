import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FaEye,
  FaBan,
  FaUnlock,
  FaSearch,
  FaUserCheck,
  FaUserTimes,
  FaSync,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Pagination from '../shared/Pagination';
import { UserService } from '../../services/modules/users/userService';

const pageSizeOptions = [5, 10, 20, 50];
const STATS_PAGE_SIZE = 100;
const statusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Đã khóa' },
];

const formatDate = (value, includeTime = true) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return includeTime
    ? date.toLocaleString('vi-VN', { hour12: false })
    : date.toLocaleDateString('vi-VN');
};

const maskUserId = (value) => {
  if (!value) return '--';
  return value.length > 10 ? `${value.slice(0, 10)}...` : value;
};

const formatAddressLocation = (address) => {
  if (!address) return '';
  const location = [
    address.province,
    address.district,
    address.ward,
  ].filter(Boolean).join(' - ');
  return location;
};

const getStatusStyles = (isActive) => (
  isActive
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-red-100 text-red-700 border-red-200'
);

const getRoleLabels = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return ['Khách hàng'];
  }

  const labels = roles
    .map((role) => {
      if (typeof role === 'string') return role;
      if (role && typeof role === 'object') {
        return role.name || role.description || null;
      }
      return null;
    })
    .filter(Boolean);

  return labels.length > 0 ? labels : ['Khách hàng'];
};

const CustomerManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await UserService.getUsers({ pageIndex, pageSize });
      const items = response?.items || [];
      setUsers(items);
      setTotalPages(response?.totalPages || 1);
      setTotalCount(response?.totalCount || items.length);
      setStats((prev) => ({
        ...prev,
        total: response?.totalCount ?? prev.total,
      }));
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error(
        error?.response?.data?.message
        || 'Không thể tải danh sách người dùng.',
      );
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  // Thực hiện 2 request nhẹ để lấy tổng số tài khoản đang mở/khoá
  const fetchStatusCounters = useCallback(async () => {
    try {
      let currentPage = 1;
      let totalPagesSnapshot = 1;
      let aggregatedTotal = 0;
      let aggregatedCount = 0;
      let activeCount = 0;
      let inactiveCount = 0;

      while (currentPage <= totalPagesSnapshot) {
        const response = await UserService.getUsers({
          pageIndex: currentPage,
          pageSize: STATS_PAGE_SIZE,
        });
        const items = response?.items || [];

        items.forEach((user) => {
          if (user?.isActive) activeCount += 1;
          else inactiveCount += 1;
        });

        aggregatedCount += items.length;
        aggregatedTotal = response?.totalCount ?? aggregatedCount;
        totalPagesSnapshot = response?.totalPages || totalPagesSnapshot;

        if (!response?.hasNextPage || aggregatedCount >= aggregatedTotal) {
          break;
        }

        currentPage += 1;
      }

      setStats((prev) => ({
        ...prev,
        total: aggregatedTotal || prev.total,
        active: activeCount,
        inactive: inactiveCount,
      }));
    } catch (error) {
      console.error('Failed to aggregate user status counters:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStatusCounters();
  }, [fetchStatusCounters]);

  const derivedStats = useMemo(() => ({
    withPhone: users.filter((user) => Boolean(user.phoneNumber)).length,
    missingProfile: users.filter((user) => !user.displayName).length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const name = (user.displayName || user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = (user.phoneNumber || '').toLowerCase();
      const matchesSearch = !keyword
        || name.includes(keyword)
        || email.includes(keyword)
        || phone.includes(keyword);
      const matchesStatus =
        statusFilter === 'all'
        || (statusFilter === 'active' && user.isActive)
        || (statusFilter === 'inactive' && !user.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const handleChangePageSize = (event) => {
    setPageSize(Number(event.target.value));
    setPageIndex(1);
  };

  const handleRefresh = () => {
    fetchUsers();
    fetchStatusCounters();
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    try {
      setDetailLoading(true);
      const detail = await UserService.getUserById(user.userID);
      setSelectedUser(detail);
    } catch (error) {
      console.error('Failed to load user detail:', error);
      toast.error(
        error?.response?.data?.message
        || 'Không thể tải chi tiết người dùng.',
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (!user?.userID) {
      toast.error('Không xác định được tài khoản.');
      return;
    }

    const nextState = !user.isActive;
    try {
      setUpdatingUserId(user.userID);
      await UserService.updateUser(user.userID, { isActive: nextState });
      toast.success(nextState ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      fetchUsers();
      fetchStatusCounters();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error(
        error?.response?.data?.message
        || 'Không thể cập nhật trạng thái người dùng.',
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const closeDetailModal = () => {
    setSelectedUser(null);
    setDetailLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Tổng người dùng</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-400 mt-2">
            Trang {pageIndex}/{Math.max(totalPages, 1)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Đang hoạt động</p>
          <p className="text-2xl font-bold mt-1 text-green-700">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Đã khóa / vô hiệu hóa</p>
          <p className="text-2xl font-bold mt-1 text-red-700">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">Đủ thông tin liên hệ</p>
          <p className="text-2xl font-bold mt-1 text-purple-700">{derivedStats.withPhone}</p>
          <p className="text-xs text-gray-400 mt-2">
            Thiếu hồ sơ: {derivedStats.missingProfile}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={pageSize}
              onChange={handleChangePageSize}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / trang
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wide">
                <th className="py-3 pr-4">ID</th>
                <th className="py-3 pr-4">Người dùng</th>
                <th className="py-3 pr-4">Liên hệ</th>
                <th className="py-3 pr-4">Vai trò</th>
                <th className="py-3 pr-4">Ngày tạo</th>
                <th className="py-3 pr-4">Cập nhật</th>
                <th className="py-3 pr-4">Trạng thái</th>
                <th className="py-3 pr-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    Đang tải dữ liệu người dùng...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    Không tìm thấy người dùng phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.userID}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-4 pr-4 font-mono text-xs text-gray-500">
                      #{maskUserId(user.userID)}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                          {user.displayName || user.username || 'Chưa cập nhật'}
                          {user.isActive ? (
                            <FaUserCheck className="text-green-500" title="Đang hoạt động" />
                          ) : (
                            <FaUserTimes className="text-red-500" title="Đã khóa" />
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{user.email || '--'}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-gray-800">{user.phoneNumber || '—'}</p>
                      <p className="text-xs text-gray-400">
                        {Array.isArray(user.addresses) ? `${user.addresses.length} địa chỉ` : '0 địa chỉ'}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {getRoleLabels(user.roles).map((roleLabel, index) => (
                          <span
                            key={`${user.userID}-role-${index}`}
                            className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold"
                          >
                            {roleLabel}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-gray-700">{formatDate(user.createAt, false)}</td>
                    <td className="py-4 pr-4 text-gray-700">{formatDate(user.updateAt)}</td>
                    <td className="py-4 pr-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(user.isActive)}`}
                      >
                        {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center justify-center gap-3 text-base">
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Xem chi tiết"
                          onClick={() => handleViewUser(user)}
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          className={`transition ${user.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                          title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          onClick={() => handleToggleStatus(user)}
                          disabled={updatingUserId === user.userID}
                        >
                          {user.isActive ? <FaBan /> : <FaUnlock />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm text-gray-600">
          <p>
            Hiển thị {filteredUsers.length} / {users.length} người dùng trong trang hiện tại
            — Tổng hệ thống: {totalCount}
          </p>
          {totalPages > 1 && (
            <Pagination
              totalPages={totalPages}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
            />
          )}
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Chi tiết người dùng</p>
                <p className="text-xl font-bold text-gray-800">{selectedUser.displayName || selectedUser.username}</p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                onClick={closeDetailModal}
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {detailLoading && (
                <p className="text-sm text-primary">Đang tải dữ liệu mới nhất...</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase">Email</p>
                  <p className="font-semibold text-gray-800">{selectedUser.email || '--'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase">Số điện thoại</p>
                  <p className="font-semibold text-gray-800">{selectedUser.phoneNumber || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase">Ngày sinh</p>
                  <p className="font-semibold text-gray-800">{formatDate(selectedUser.dob, false)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase">Trạng thái</p>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(selectedUser.isActive)}`}
                  >
                    {selectedUser.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 text-xs uppercase">Vai trò</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {getRoleLabels(selectedUser.roles).map((roleLabel, index) => (
                      <span
                        key={`detail-role-${index}`}
                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold"
                      >
                        {roleLabel}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase">Ngày tạo</p>
                  <p className="font-semibold text-gray-800">{formatDate(selectedUser.createAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase">Lần cập nhật cuối</p>
                  <p className="font-semibold text-gray-800">{formatDate(selectedUser.updateAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs uppercase mb-2">Địa chỉ giao hàng</p>
                {Array.isArray(selectedUser.addresses) && selectedUser.addresses.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedUser.addresses.map((address, index) => {
                      const location = formatAddressLocation(address);
                      return (
                        <li
                          key={address?.id || index}
                          className="p-3 rounded-xl border border-gray-100 bg-gray-50"
                        >
                          <p className="font-semibold text-gray-800">
                            {address?.fullName || selectedUser.displayName || selectedUser.username || '—'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address?.phoneNumber || selectedUser.phoneNumber || '—'}
                          </p>
                          <p className="text-sm text-gray-600">{address?.detail || '—'}</p>
                          {location && (
                            <p className="text-xs text-gray-400">{location}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Người dùng chưa lưu địa chỉ nào.</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                onClick={closeDetailModal}
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

export default CustomerManagement;
