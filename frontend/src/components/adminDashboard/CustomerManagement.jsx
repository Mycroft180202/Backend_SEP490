import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaEye,
  FaBan,
  FaUnlock,
  FaSearch,
  FaUserCheck,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaRegCalendar,
  FaShieldAlt,
  FaIdBadge,
  FaTimes,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Pagination from '../shared/Pagination';
import { UserService } from '../../services/modules/users/userService';

const PAGE_SIZE_OPTIONS = [5, 10, 20];
const DEFAULT_PAGE_SIZE = 10;

const statusBadge = (isActive) => (
  isActive
    ? 'bg-green-100 text-green-700'
    : 'bg-red-100 text-red-700'
);

const normalizeText = (value) => {
  if (!value) return '';
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const normalizeDigits = (value) => {
  if (!value) return '';
  return value.toString().replace(/\D/g, '');
};

const formatRoles = (roles) => {
  if (Array.isArray(roles)) {
    const names = roles
      .map((r) => {
        if (typeof r === 'string') return r;
        if (r?.name) return r.name;
        if (r?.description) return r.description;
        return '';
      })
      .filter(Boolean);
    return names.length ? names.join(', ') : 'N/A';
  }
  if (roles && typeof roles === 'object') {
    return roles.name || roles.description || 'N/A';
  }
  if (typeof roles === 'string') return roles;
  return 'N/A';
};

const CustomerManagement = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const aggregated = [];
      let currentPage = 1;
      let totalCount = 0;
      let totalPages = 1;
      const pageSizeRequest = 100;

      // Fetch first page then continue until all pages are collected
      // so that active stats and search work across the entire dataset.
      // Avoids server-side paging issues when filtering client-side.
      while (true) {
        const response = await UserService.adminList(currentPage, pageSizeRequest);
        const list = response?.items
          || response?.data
          || response?.result
          || [];
        aggregated.push(...list);

        totalCount = response?.totalCount
          ?? response?.raw?.totalCount
          ?? response?.data?.totalCount
          ?? aggregated.length;
        totalPages = response?.totalPages
          ?? response?.raw?.totalPages
          ?? Math.max(1, Math.ceil(totalCount / pageSizeRequest));

        if (currentPage >= totalPages || list.length === 0) {
          break;
        }
        currentPage += 1;
      }

      setAllUsers(aggregated);
      setMeta({
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        pageSize,
      });
    } catch (error) {
      console.error('Load users error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Khong the tai danh sach nguoi dung.',
      );
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const applySearch = useCallback((value) => {
    const normalized = value.trim();
    setSearchTerm((previous) => {
      if (previous !== normalized) {
        setPageIndex(1);
      }
      return normalized;
    });
  }, [setPageIndex, setSearchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const normalized = searchInput.trim();
      if (normalized !== searchInput) {
        setSearchInput(normalized);
        applySearch(normalized);
      } else {
        applySearch(normalized);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput, applySearch]);

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = normalizeText(searchTerm);
    const digitKeyword = normalizeDigits(searchTerm);

    return allUsers.filter((user) => {
      const name = normalizeText(user.displayName || user.fullName || user.username || '');
      const email = normalizeText(user.email || '');
      const phoneDigits = normalizeDigits(user.phoneNumber || '');
      const userId = normalizeText(user.userID || user.id || '');

      const matchSearch = normalizedKeyword
        ? name.includes(normalizedKeyword)
          || email.includes(normalizedKeyword)
          || userId.includes(normalizedKeyword)
        : true;

      const matchPhone = digitKeyword ? phoneDigits.includes(digitKeyword) : false;

      const isSearchMatched = normalizedKeyword || digitKeyword
        ? matchSearch || matchPhone
        : true;

      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'active' && user.isActive)
        || (statusFilter === 'inactive' && !user.isActive);

      return isSearchMatched && matchStatus;
    });
  }, [allUsers, searchTerm, statusFilter]);

  const pagedUsers = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, pageIndex, pageSize]);

  const filteredTotal = filteredUsers.length;
  const filteredTotalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));

  useEffect(() => {
    setPageIndex((previous) => {
      if (previous > filteredTotalPages) {
        return filteredTotalPages;
      }
      if (previous < 1) {
        return 1;
      }
      return previous;
    });
  }, [filteredTotalPages]);

  const stats = useMemo(() => ({
    total: meta.totalCount || allUsers.length,
    active: allUsers.filter((u) => u.isActive).length,
    inactive: allUsers.filter((u) => !u.isActive).length,
  }), [allUsers, meta.totalCount]);

  const toggleActive = async (user) => {
    if (!(user?.userID)) return;
    const nextState = !user.isActive;
    try {
      await UserService.adminUpdate(user.userID, { isActive: nextState });
      toast.success(nextState ? 'Da mo khoa tai khoan' : 'Da khoa tai khoan');
      await loadUsers();
    } catch (error) {
      console.error('Toggle active error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Khong the cap nhat trang thai.',
      );
    }
  };

  const handleView = async (user) => {
    if (!user?.userID && !user?.id) {
      toast.error('Khong xac dinh duoc nguoi dung.');
      return;
    }

    // Show what we already have first
    setSelectedUser(user);

    try {
      const data = await UserService.getById(user.userID || user.id);
      setSelectedUser(data);
    } catch (error) {
      console.error('View user error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Khong the tai thong tin nguoi dung.',
      );
    }
  };

  const handlePageSizeChange = (event) => {
    const nextSize = Number(event.target.value);
    setPageSize(nextSize);
    setPageIndex(1);
  };

  useEffect(() => {
    // reset to first page on search/filter change
    setPageIndex((previous) => (previous === 1 ? previous : 1));
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tổng người dùng</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Đang hoạt động</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Đã khóa</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.inactive}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm tên, email hoặc số điện thoại..."
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>Hiện</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>người dùng</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tên hiển thị</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tên đăng nhập</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Số điện thoại</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Không có người dùng nào.
                  </td>
                </tr>
              ) : (
                pagedUsers.map((user) => {
                  const name = user.displayName || user.fullName || user.username || 'Unknown';
                  return (
                    <tr key={user.userID || user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700 flex items-center gap-2">
                        {name}
                        {user.emailConfirmed && <FaUserCheck className="text-blue-500" title="Email verified" />}
                      </td>
                      <td className="py-3 px-4 text-sm">{user.displayName || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">{user.username || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">{user.email || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">{user.phoneNumber || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(user.isActive)}`}>
                          {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            title="Xem chi tiet"
                            onClick={() => handleView(user)}
                          >
                            <FaEye />
                          </button>
                          {user.isActive ? (
                            <button
                              className="text-red-600 hover:text-red-800"
                              title="Khóa tài khoản"
                              onClick={() => toggleActive(user)}
                            >
                              <FaBan />
                            </button>
                          ) : (
                            <button
                              className="text-green-600 hover:text-green-800"
                              title="Mở khóa"
                              onClick={() => toggleActive(user)}
                            >
                              <FaUnlock />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredTotalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Đang hiện {pagedUsers.length} / {filteredTotal} người dùng phù hợp
            </p>
            <Pagination
              totalPages={filteredTotalPages}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
            />
          </div>
        )}
      </div>

      {selectedUser && (() => {
        const displayName = selectedUser.displayName || selectedUser.fullName || selectedUser.username || 'Khách hàng';
        const email = selectedUser.email || 'Chưa cập nhật';
        const avatarUrl = selectedUser.avatarUrl || selectedUser.profileImage || selectedUser.profilePicture;
        const initials = displayName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join('') || 'U';

        const accountCreatedAt = selectedUser.createAt || selectedUser.createdAt;
        const formatDate = (value) => {
          if (!value) return 'Chưa cập nhật';
          try {
            return new Date(value).toLocaleDateString('vi-VN');
          } catch (error) {
            return value;
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setSelectedUser(null)}
            />
            <div className="relative w-full max-w-3xl">
              <div className="absolute inset-x-6 -top-10 h-24 rounded-3xl bg-gradient-to-r from-primary via-orange-500 to-amber-500 blur-3xl opacity-30" />
              <div className="relative flex max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 px-6 py-6 text-white">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/40 bg-white/20 shadow-inner">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">
                            {initials}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-semibold leading-tight">{displayName}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/80">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                            <FaEnvelope className="text-xs" />
                            {email}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${selectedUser.isActive ? 'bg-white/20 text-white' : 'bg-white text-red-600'}`}>
                            <FaShieldAlt className="text-xs" />
                            {selectedUser.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
                      onClick={() => setSelectedUser(null)}
                      aria-label="Đóng"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 shadow-sm">
                      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                        <FaIdBadge className="text-sm text-primary" /> Thông tin tài khoản
                      </h4>
                      <div className="mt-4 space-y-3 text-sm text-gray-700">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <FaUserCheck />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Mã người dùng</p>
                            <p className="font-semibold text-gray-800">{selectedUser.userID || selectedUser.id || '---'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <FaShieldAlt />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Vai trò</p>
                            <p className="font-semibold text-gray-800">{formatRoles(selectedUser.roles || selectedUser.role)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <FaRegCalendar />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Ngày tạo</p>
                            <p className="font-semibold text-gray-800">{formatDate(accountCreatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                        <FaEnvelope className="text-sm text-primary" /> Liên hệ nhanh
                      </h4>
                      <div className="mt-4 space-y-3 text-sm text-gray-700">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <FaEnvelope />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="font-semibold text-gray-800">{email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                            <FaPhoneAlt />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Số điện thoại</p>
                            <p className="font-semibold text-gray-800">{selectedUser.phoneNumber || 'Chưa cập nhật'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                            <FaRegCalendar />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Ngày sinh</p>
                            <p className="font-semibold text-gray-800">{formatDate(selectedUser.dob)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {Array.isArray(selectedUser.addresses) && selectedUser.addresses.length > 0 ? (
                    <div className="mt-6 space-y-3">
                      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                        <FaMapMarkerAlt className="text-sm text-primary" /> Địa chỉ đã lưu
                      </h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {selectedUser.addresses.map((addr, idx) => (
                          <div key={idx} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-100/20" />
                            <div className="relative p-4 text-sm text-gray-700">
                              <p className="font-semibold text-gray-800">
                                {addr.contactName || displayName}
                                <span className="ml-2 text-xs font-medium text-gray-500">
                                  {addr.contactPhone || selectedUser.phoneNumber || 'N/A'}
                                </span>
                              </p>
                              <p className="mt-2 text-sm text-gray-700">{addr.line1 || '---'}</p>
                              {addr.line2 ? <p className="text-sm text-gray-500">{addr.line2}</p> : null}
                              <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                                {[addr.city, addr.country].filter(Boolean).join(' • ') || 'Chưa cập nhật'}
                              </p>
                              {addr.isDefault ? (
                                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                  <FaShieldAlt /> Mặc định
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-4 text-sm text-gray-500">
                      Người dùng này chưa lưu địa chỉ giao hàng.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CustomerManagement;
