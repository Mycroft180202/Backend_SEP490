import React, { useContext, useEffect, useState, useMemo } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import AddProductForm from './AddProductForm';
import { ProductService } from '../../services/modules/products/productService';
import { CategoryService } from '../../services/modules/products/categoryService';
import { UserContext } from '../../context/UserContext';

const ITEMS_PER_PAGE = 8;

const ProductManagement = () => {
  const { userInfo } = useContext(UserContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [categories, setCategories] = useState([]);

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);

  const getStatusColor = (status) => (status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');

  const refreshProducts = async () => {
    if (!userInfo?.userID) return;
    try {
      setLoading(true);
      const res = await ProductService.getAllProducts({
        artisanId: userInfo.userID,
        pageIndex: 1,
        pageSize: 200,
      });
      const items = res?.items || res?.Items || [];
      const mine = items.filter((item) => (item.artisanId || item.artisanID) === userInfo.userID);
      setProducts(mine);
    } catch (err) {
      console.error('Load artisan products error:', err);
      toast.error(err?.response?.data?.message || 'Không thể tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, [userInfo]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await CategoryService.getAllCategories();
        setCategories(res || []);
      } catch (err) {
        console.error('Load categories error:', err);
      }
    };
    loadCategories();
  }, []);

  const categoryNameOf = (id) => {
    if (!id) return '';
    const found = categories.find((c) => c.id === id || c.categoryId === id);
    return found?.name || id;
  };

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryLabel = categoryNameOf(product.category);
    const matchCategory = filterCategory === 'all' || product.category === filterCategory || categoryLabel === filterCategory;
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'Còn hàng' && product.stock > 0)
      || (filterStatus === 'Hết hàng' && product.stock <= 0)
      || product.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  }), [products, searchTerm, filterCategory, filterStatus, categories]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const currentProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAddProduct = async (formData) => {
    try {
      const payload = { ...formData, artisanId: userInfo?.userID || formData.artisanId };
      if (editingProduct?.id) {
        await ProductService.updateProduct(editingProduct.id, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await ProductService.createProduct(payload);
        toast.success('Thêm sản phẩm thành công');
      }
      setIsAddFormOpen(false);
      setEditingProduct(null);
      refreshProducts();
    } catch (err) {
      console.error('Save product error:', err);
      toast.error(err?.response?.data?.message || 'Không thể lưu sản phẩm.');
    }
  };

  const handleDelete = async (product) => {
    if (!product?.id) return;
    if (!window.confirm('Xác nhận xoá sản phẩm này?')) return;
    try {
      await ProductService.deleteProduct(product.id);
      toast.success('Đã xoá sản phẩm');
      refreshProducts();
    } catch (err) {
      console.error('Delete product error:', err);
      toast.error(err?.response?.data?.message || 'Không thể xoá sản phẩm.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý sản phẩm</h2>
          <p className="text-sm text-gray-600 mt-1">Tổng {products.length} sản phẩm</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setIsAddFormOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <FaPlus /> Thêm sản phẩm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat.id || cat.categoryId} value={cat.id || cat.categoryId}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Còn hàng">Còn hàng</option>
          <option value="Hết hàng">Hết hàng</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Sản phẩm</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Danh mục</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Giá</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tồn kho</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Đã bán</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-4 text-center text-gray-500">Đang tải danh sách...</td></tr>
            ) : currentProducts.length === 0 ? (
              <tr><td colSpan={7} className="py-4 text-center text-gray-500">Không có sản phẩm.</td></tr>
            ) : (
              currentProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img src={product.imageUrl || product.image || '/images/default-product.png'} alt={product.name} className="w-12 h-12 rounded object-cover" />
                    <div>
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">#{product.id}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">{categoryNameOf(product.category)}</td>
                  <td className="py-3 px-4">{formatCurrency(product.price)}</td>
                  <td className="py-3 px-4">{product.stock}</td>
                  <td className="py-3 px-4">{product.sold || product.sales || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(product.stock > 0)}`}>
                      {product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800" title="Xem">
                        <FaEye />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-800"
                        title="Sửa"
                        onClick={() => {
                          setEditingProduct(product);
                          setIsAddFormOpen(true);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        title="Xóa"
                        onClick={() => handleDelete(product)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Hiển thị {filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} trên tổng {filteredProducts.length} sản phẩm
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 border border-gray-300 rounded-lg ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            Trước
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 rounded-lg ${currentPage === index + 1 ? 'bg-primary text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 border border-gray-300 rounded-lg ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            Sau
          </button>
        </div>
      </div>

      <AddProductForm
        isOpen={isAddFormOpen}
        onClose={() => {
          setIsAddFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleAddProduct}
        initialData={editingProduct}
        artisanId={userInfo?.userID || userInfo?.userId}
        categories={categories}
      />
    </div>
  );
};

export default ProductManagement;
