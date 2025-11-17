import React, {
  useEffect, useState, useMemo,
} from 'react';
import { FaPlus, FaTrash, FaEdit, FaImages } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { ProductCollectionService } from '../../services/modules/collections/productCollectionService';
import { ProductService } from '../../services/modules/products/productService';

const emptyForm = {
  title: '',
  headline: '',
  content: '',
  productIds: [],
  imageFile: null,
  isActive: true,
};

const ProductCollectionManagement = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const res = await ProductCollectionService.list();
      setCollections(res || []);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Không thể tải bộ sưu tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await ProductService.getAllProducts({ pageIndex: 1, pageSize: 200 });
        const items = res?.items || [];
        setProductOptions(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  const clearForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setPreview('');
  };

  const openCreate = () => {
    clearForm();
    setModalOpen(true);
  };

  const openEdit = async (item) => {
    const id = item.productCollectionId || item.id;
    if (!id) return;
    setEditingId(id);
    setModalOpen(true);
    try {
      const detail = await ProductCollectionService.getById(id);
      const productIds = detail?.productIds
        || detail?.productIDs
        || detail?.products?.map((p) => p.id)
        || item.productIds
        || item.products?.map((p) => p.id)
        || [];
      setFormData({
        title: detail?.title || item.title || '',
        headline: detail?.headline || item.headline || '',
        content: detail?.content || item.content || '',
        productIds: productIds.map((pid) => pid?.toString()).filter(Boolean),
        isActive: typeof detail?.isActive === 'boolean' ? detail.isActive : item.isActive ?? true,
        imageFile: null,
      });
      setPreview(detail?.image || item.image || '');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Không thể tải chi tiết bộ sưu tập');
      setModalOpen(false);
      setEditingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await ProductCollectionService.updateInfo({
          productCollectionId: editingId,
          title: formData.title,
          headline: formData.headline,
          content: formData.content,
          productIds: formData.productIds,
          imageFile: formData.imageFile,
          isActive: formData.isActive,
        });
        toast.success('Đã cập nhật bộ sưu tập');
      } else {
        await ProductCollectionService.create({
          title: formData.title,
          headline: formData.headline,
          content: formData.content,
          productIds: formData.productIds,
          imageFile: formData.imageFile,
        });
        toast.success('Đã tạo bộ sưu tập');
      }
      clearForm();
      setModalOpen(false);
      await loadCollections();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Không thể lưu bộ sưu tập');
    }
  };

  const handleToggleActive = async (item) => {
    // no-op: trạng thái chỉnh trong form
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá bộ sưu tập này?')) return;
    try {
      await ProductCollectionService.remove(id);
      toast.success('Đã xoá bộ sưu tập');
      loadCollections();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Không thể xoá bộ sưu tập');
    }
  };

  const list = useMemo(() => collections || [], [collections]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý bộ sưu tập</h2>
          <p className="text-sm text-gray-500">Tổng {list.length} bộ sưu tập</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#9e211f] text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          <FaPlus /> Thêm bộ sưu tập
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => <div key={idx} className="h-64 bg-gray-100 animate-pulse rounded-xl" />)
        ) : list.length === 0 ? (
          <div className="col-span-3 text-center text-gray-500 py-10">Chưa có bộ sưu tập</div>
        ) : (
          list.map((item) => (
            <div
              key={item.productCollectionId || item.id}
              className="border rounded-xl overflow-hidden shadow hover:shadow-lg transition bg-white"
            >
              <div className="h-40 overflow-hidden relative">
                <img
                  src={item.image || '/images/default-product.png'}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <span className={`absolute top-2 left-2 text-xs px-3 py-1 rounded-full font-semibold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{item.headline || item.content}</p>
                  <div className="flex justify-between items-center pt-2 border-t text-sm text-gray-600">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit /> Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.productCollectionId || item.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                    >
                      <FaTrash /> Xoá
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            ))
          )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">{editingId ? 'Cập nhật bộ sưu tập' : 'Thêm bộ sưu tập'}</h3>
              <button type="button" onClick={() => { setModalOpen(false); clearForm(); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề phụ</label>
                  <input
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <FaImages /> Chọn ảnh
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ ...formData, imageFile: file });
                          setPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {preview && (
                    <img src={preview} alt="preview" className="mt-3 w-full h-32 object-cover rounded-lg border" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chọn sản phẩm</label>
                  <div className="border rounded-lg px-3 py-2 max-h-64 overflow-y-auto space-y-2">
                    {loadingProducts ? (
                      <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
                    ) : productOptions.length === 0 ? (
                      <p className="text-sm text-gray-500">Chưa có sản phẩm.</p>
                    ) : (
                      productOptions.map((p) => {
                        const checked = formData.productIds?.includes(p.id?.toString());
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-3 p-2 rounded-lg border ${checked ? 'border-[#9e211f] bg-[#fff5f5]' : 'border-transparent hover:border-gray-200'}`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={checked}
                              onChange={(e) => {
                                const current = new Set(formData.productIds || []);
                                if (e.target.checked) current.add(p.id?.toString());
                                else current.delete(p.id?.toString());
                                setFormData({ ...formData, productIds: Array.from(current) });
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                              <p className="text-xs text-gray-500">
                                {p.price?.toLocaleString('vi-VN')} ₫
                              </p>
                            </div>
                            {checked && (
                              <span className="text-xs text-white bg-[#9e211f] px-2 py-1 rounded-full">Đã chọn</span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Tích để thêm/bỏ sản phẩm khỏi bộ sưu tập</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="true">Hiển thị</option>
                    <option value="false">Ẩn</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); clearForm(); }}
                  className="px-4 py-2 rounded-lg border border-gray-300"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#9e211f] text-white"
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

export default ProductCollectionManagement;
