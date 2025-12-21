import React, { useEffect, useState, useCallback } from 'react';
import {
  FaPlus,
  FaEdit,
  FaSave,
  FaTimes,
  FaSpinner,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { CategoryService } from '../../services/modules/products/categoryService';

const normalizeCategories = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await CategoryService.getAllCategories();
      setCategories(normalizeCategories(response));
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const closeCreateForm = useCallback(() => {
    setShowCreateForm(false);
    setNewName('');
  }, []);

  const toggleCreateForm = useCallback(() => {
    if (creating) return;
    setShowCreateForm((prev) => {
      if (prev) {
        setNewName('');
      }
      return !prev;
    });
  }, [creating]);

  const handleCreate = async (event) => {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.warning('Vui lòng nhập tên danh mục');
      return;
    }
    setCreating(true);
    try {
      await CategoryService.createCategory({ name: trimmed });
      toast.success('Đã tạo danh mục mới');
      setNewName('');
      await loadCategories();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Không thể tạo danh mục');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingName(item.name || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleUpdate = async () => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.warning('Vui lòng nhập tên danh mục');
      return;
    }
    setUpdatingId(editingId);
    try {
      await CategoryService.updateCategory(editingId, { name: trimmed });
      toast.success('Đã cập nhật danh mục');
      cancelEdit();
      await loadCategories();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Không thể cập nhật danh mục');
    } finally {
      setUpdatingId(null);
    }
  };

  const currentCount = categories?.length || 0;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý danh mục sản phẩm</h2>
          <p className="text-sm text-gray-500">Tổng {currentCount} danh mục</p>
        </div>
        <button
          type="button"
          onClick={toggleCreateForm}
          disabled={creating}
          className="inline-flex items-center gap-2 bg-[#9e211f] text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-[#7a1817] transition disabled:opacity-70"
        >
          {showCreateForm ? (
            <>
              <FaTimes />
              Đóng
            </>
          ) : (
            <>
              <FaPlus />
              Thêm danh mục
            </>
          )}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="bg-[#fff6f5] border border-[#f4d5d2] rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#4a3c32] mb-2">Tên danh mục mới</label>
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nhập tên danh mục"
              className="w-full px-4 py-2.5 border border-[#ecd8d6] rounded-lg focus:border-[#9e211f] focus:ring-2 focus:ring-[#f2b4ae] transition"
              disabled={creating}
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={closeCreateForm}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition disabled:opacity-70"
            >
              <FaTimes />
              Huỷ
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 bg-[#9e211f] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#7a1817] transition disabled:opacity-70"
            >
              {creating ? <FaSpinner className="animate-spin" /> : <FaPlus />} Thêm danh mục
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã danh mục</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên danh mục</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  <div className="inline-flex items-center gap-2 text-[#9e211f]">
                    <FaSpinner className="animate-spin" />
                    <span>Đang tải danh mục...</span>
                  </div>
                </td>
              </tr>
            ) : currentCount === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Chưa có danh mục nào.</td>
              </tr>
            ) : (
              categories.map((item) => {
                const isEditing = editingId === item.id;
                const isUpdating = updatingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {isEditing ? (
                        <input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          className="w-full px-3 py-2 border border-[#ecd8d6] rounded-lg focus:border-[#9e211f] focus:ring-2 focus:ring-[#f2b4ae]"
                          disabled={isUpdating}
                        />
                      ) : (
                        <span>{item.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {isEditing ? (
                        <div className="flex justify-end items-center gap-2">
                          <button
                            type="button"
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-70"
                          >
                            {isUpdating ? <FaSpinner className="animate-spin" /> : <FaSave />} Lưu
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                          >
                            <FaTimes /> Huỷ
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#9e211f] text-[#9e211f] hover:bg-[#9e211f] hover:text-white transition"
                        >
                          <FaEdit /> Sửa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryManagement;
