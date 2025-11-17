import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaEye,
  FaBan,
  FaUnlock,
  FaSearch,
  FaUserCheck,
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

const CustomerManagement = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return allUsers.filter((user) => {
      const name = (user.displayName || user.fullName || user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = user.phoneNumber || '';
      const matchSearch = keyword
        ? name.includes(keyword) || email.includes(keyword) || phone.includes(keyword)
        : true;
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'active' && user.isActive)
        || (statusFilter === 'inactive' && !user.isActive);
      return matchSearch && matchStatus;
    });
  }, [allUsers, searchTerm, statusFilter]);

  const pagedUsers = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, pageIndex, pageSize]);

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

  const handleView = async (userId) => {
    try {
      const data = await UserService.getById(userId);
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
    setPageIndex(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tong nguoi dung</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Dang hoat dong</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Da khoa</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.inactive}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tim ten, email hoac so dien thoai..."
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tat ca</option>
              <option value="active">Dang hoat dong</option>
              <option value="inactive">Da khoa</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>Hien</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>nguoi dung</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Display name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Username</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Phone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Dang tai danh sach...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Khong co nguoi dung nao.
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
                          {user.isActive ? 'Dang hoat dong' : 'Da khoa'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            title="Xem chi tiet"
                            onClick={() => handleView(user.userID || user.id)}
                          >
                            <FaEye />
                          </button>
                          {user.isActive ? (
                            <button
                              className="text-red-600 hover:text-red-800"
                              title="Khoa tai khoan"
                              onClick={() => toggleActive(user)}
                            >
                              <FaBan />
                            </button>
                          ) : (
                            <button
                              className="text-green-600 hover:text-green-800"
                              title="Mo khoa"
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

        {meta.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Dang hien {filteredUsers.length} / {meta.totalCount} nguoi dung
            </p>
            <Pagination
              totalPages={meta.totalPages}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
            />
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {selectedUser.displayName || selectedUser.fullName || selectedUser.username || 'User detail'}
                </p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedUser(null)}
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="text-gray-500">So dien thoai</p>
                  <p className="font-semibold">{selectedUser.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Trang thai</p>
                  <p className="font-semibold">{selectedUser.isActive ? 'Dang hoat dong' : 'Da khoa'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ngay sinh</p>
                  <p className="font-semibold">
                    {selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Vai tro</p>
                  <p className="font-semibold">{selectedUser.roles || selectedUser.role || 'N/A'}</p>
                </div>
              </div>
              {Array.isArray(selectedUser.addresses) && selectedUser.addresses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">Dia chi</p>
                  <div className="space-y-2">
                    {selectedUser.addresses.map((addr, idx) => (
                      <div key={idx} className="p-3 rounded-lg border bg-gray-50">
                        <p className="text-sm font-semibold text-gray-800">
                          {addr.contactName || selectedUser.displayName || 'Nguoi nhan'} - {addr.contactPhone || selectedUser.phoneNumber || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-700">{addr.line1}</p>
                        {addr.line2 && <p className="text-sm text-gray-500">{addr.line2}</p>}
                        <p className="text-xs text-gray-500">
                          {addr.city} • {addr.country}
                        </p>
                        {addr.isDefault && (
                          <span className="mt-2 inline-block px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 font-semibold">
                            Mac dinh
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
