import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import {
  FaPlus,
  FaEdit,
  FaEye,
  FaSearch,
  FaToggleOn,
  FaToggleOff,
  FaQuestionCircle,
  FaSpinner,
  FaBullhorn,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import AddProductForm from './AddProductForm';
import ProductStoryManager from './ProductStoryManager';
import { ProductService } from '../../services/modules/products/productService';
import { CategoryService } from '../../services/modules/products/categoryService';
import { UserContext } from '../../context/UserContext';
import ArtisanDashboardService from '../../services/modules/artisan/artisanDashboardService';

const ITEMS_PER_PAGE = 8;
const LOW_STOCK_THRESHOLD = 10;
const BEST_SELLER_COUNT = 5;

const ViewProductModal = ({ product, onClose, formatCurrency, categoryLabel }) => {
  if (!product) return null;

  const primaryImage = product.imageUrl || product.image || (Array.isArray(product.images) ? product.images[0] : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Chi tiết sản phẩm</h3>
            <p className="text-sm text-gray-500">#{product.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 transition-colors hover:text-gray-700"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="grid gap-6 px-6 py-5 md:grid-cols-[220px_1fr]">
          <div className="space-y-4">
            <div className="aspect-square w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {primaryImage ? (
                <img src={primaryImage} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  Chưa có ảnh
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold">Danh mục:</span> {categoryLabel}</p>
              <p><span className="font-semibold">Giá:</span> {formatCurrency(product.price)}</p>
              <p><span className="font-semibold">Tồn kho:</span> {product.stock}</p>
              <p><span className="font-semibold">Đã bán:</span> {product.totalSold ?? product.sold ?? 0}</p>
              <p><span className="font-semibold">Doanh thu:</span> {formatCurrency(product.totalAmmount ?? 0)}</p>
              <p><span className="font-semibold">Đánh giá:</span> {product.rating ?? '--'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-800">{product.name}</h4>
              <p className="text-sm text-gray-500">Mã sản phẩm: {product.id}</p>
            </div>
            {product.shortDescription && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700">Mô tả ngắn</h5>
                <p className="mt-1 text-sm text-gray-600">{product.shortDescription}</p>
              </div>
            )}
            {product.longDescription && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700">Mô tả chi tiết</h5>
                <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{product.longDescription}</p>
              </div>
            )}
            {Array.isArray(product.images) && product.images.length > 1 && (
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-700">Thư viện ảnh</h5>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {product.images.map((img, idx) => (
                    <img
                      key={`${product.id}-img-${idx}`}
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="h-20 w-full rounded-lg border border-gray-200 object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductManagement = () => {
  const { userInfo } = useContext(UserContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [storyManagerProduct, setStoryManagerProduct] = useState(null);
  const [toggleModal, setToggleModal] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [categories, setCategories] = useState([]);

  const formatCurrency = (amount, suffix = ' VND') => {
    const numeric = Number(amount) || 0;
    return `${new Intl.NumberFormat('vi-VN').format(numeric)}${suffix}`;
  };

  const getStatusColor = (isActive) => (isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');

  const refreshProducts = useCallback(async () => {
    if (!userInfo?.userID && !userInfo?.userId) return;
    try {
      setLoading(true);
      const response = await ArtisanDashboardService.getProducts({
        pageIndex: 1,
        pageSize: 200,
      });
      const items = response?.items || response?.Items || [];
      const normalized = items.map((entry) => {
        const product = entry.product || entry.Product || entry;
        return {
          ...product,
          isActive: product.isActive ?? product.IsActive ?? true,
          totalSold: entry.totalSold ?? entry.TotalSold ?? 0,
          totalAmmount: entry.totalAmmount ?? entry.TotalAmmount ?? 0,
          stock: product.stock ?? product.Stock ?? 0,
        };
      });
      setProducts(normalized);
    } catch (err) {
      console.error('Load artisan products error:', err);
      toast.error(err?.response?.data?.message || 'Không thể tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

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

  const categoryNameOf = useCallback((id) => {
    if (!id) return '';
    const found = categories.find((c) => c.id === id || c.categoryId === id);
    return found?.name || id;
  }, [categories]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => (product.stock ?? 0) > 0 && product.stock < LOW_STOCK_THRESHOLD),
    [products],
  );

  const outOfStockProducts = useMemo(
    () => products.filter((product) => (product.stock ?? 0) <= 0),
    [products],
  );

  const focusProduct = useCallback((product) => {
    if (!product) return;
    setEditingProduct(product);
    setIsAddFormOpen(true);
  }, []);

  const topSellingProducts = useMemo(() => {
    if (!products.length) return [];
    const sorted = [...products]
      .sort((a, b) => (b.totalSold ?? b.sold ?? 0) - (a.totalSold ?? a.sold ?? 0))
      .filter((item) => (item.totalSold ?? item.sold ?? 0) > 0);
    return sorted.slice(0, BEST_SELLER_COUNT);
  }, [products]);

  const bestSellerIds = useMemo(
    () => new Set(topSellingProducts.map((item) => item.id)),
    [topSellingProducts],
  );

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryLabel = categoryNameOf(product.category);
    const matchCategory = filterCategory === 'all' || product.category === filterCategory || categoryLabel === filterCategory;
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'Còn hàng' && product.stock > 0)
      || (filterStatus === 'Hết hàng' && product.stock <= 0)
      || product.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  }), [products, searchTerm, filterCategory, filterStatus, categoryNameOf]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const currentProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const ensureArtisanId = (value) => value || userInfo?.userID || userInfo?.userId || '';

  const handleAddProduct = async (formData) => {
    try {
      let payload = formData;

      if (formData instanceof FormData) {
        const artisanIdValue = ensureArtisanId(formData.get('ArtisanId'));
        if (artisanIdValue) {
          formData.set('ArtisanId', artisanIdValue);
        }
        payload = formData;
      } else {
        payload = {
          ...formData,
          ArtisanId: ensureArtisanId(formData?.ArtisanId || formData?.artisanId),
        };
      }

      if (editingProduct?.id) {
        await ProductService.updateProduct(editingProduct.id, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await ProductService.createProduct(payload);
        toast.success('Thêm sản phẩm thành công');
      }
      setIsAddFormOpen(false);
      setEditingProduct(null);
      await refreshProducts();
      return true;
    } catch (err) {
      console.error('Save product error:', err);
      toast.error(err?.response?.data?.message || 'Không thể lưu sản phẩm.');
      return false;
    }
  };

  const handleToggleActiveRequest = (product) => {
    if (!product?.id) return;
    const currentActive = product.isActive ?? true;
    setToggleModal({
      product,
      nextState: !currentActive,
    });
  };

  const handleConfirmToggle = async () => {
    if (!toggleModal?.product?.id) return;
    setIsToggling(true);
    try {
      await ProductService.updateStatus(toggleModal.product.id, toggleModal.nextState);
      toast.success(toggleModal.nextState ? 'Đã bật trạng thái hoạt động' : 'Đã tắt trạng thái hoạt động');
      setToggleModal(null);
      await refreshProducts();
    } catch (err) {
      console.error('Toggle active product error:', err);
      toast.error(err?.response?.data?.message || 'Không thể cập nhật trạng thái sản phẩm.');
    } finally {
      setIsToggling(false);
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

      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-center justify-between">
              <p className="font-semibold uppercase tracking-wide">Sản phẩm sắp hết hàng</p>
              <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold text-amber-700">
                {lowStockProducts.length}
              </span>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="mt-3 text-xs italic text-amber-700">Không có sản phẩm nào sắp hết hàng.</p>
            ) : (
              <>
                <ul className="mt-2 space-y-1 pl-4">
                  {lowStockProducts.slice(0, 5).map((item) => (
                    <li key={`low-stock-${item.id}`} className="flex items-center justify-between gap-2">
                      <span className="list-disc flex-1 text-left">{item.name} — còn {item.stock} sản phẩm</span>
                      <button
                        type="button"
                        onClick={() => focusProduct(item)}
                        className="shrink-0 rounded-full border border-amber-500 px-3 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-500 hover:text-white"
                      >
                        Quản lý
                      </button>
                    </li>
                  ))}
                </ul>
                {lowStockProducts.length > 5 && (
                  <p className="mt-2 text-xs italic">
                    ... và {lowStockProducts.length - 5} sản phẩm khác cũng gần hết hàng.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center justify-between">
              <p className="font-semibold uppercase tracking-wide">Sản phẩm đã hết hàng</p>
              <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold text-red-700">
                {outOfStockProducts.length}
              </span>
            </div>
            {outOfStockProducts.length === 0 ? (
              <p className="mt-3 text-xs italic text-red-700">Không có sản phẩm nào đang hết hàng.</p>
            ) : (
              <>
                <ul className="mt-2 space-y-1 pl-4">
                  {outOfStockProducts.slice(0, 5).map((item) => (
                    <li key={`out-stock-${item.id}`} className="flex items-center justify-between gap-2">
                      <span className="list-disc flex-1 text-left">{item.name}</span>
                      <button
                        type="button"
                        onClick={() => focusProduct(item)}
                        className="shrink-0 rounded-full border border-red-500 px-3 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-500 hover:text-white"
                      >
                        Quản lý
                      </button>
                    </li>
                  ))}
                </ul>
                {outOfStockProducts.length > 5 && (
                  <p className="mt-2 text-xs italic">
                    ... và {outOfStockProducts.length - 5} sản phẩm khác đã hết hàng.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Sản phẩm</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Danh mục</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Giá (VND)</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tồn kho</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Đã bán</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Doanh thu (VND)</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-4 text-center text-gray-500">Đang tải danh sách...</td></tr>
            ) : currentProducts.length === 0 ? (
              <tr><td colSpan={8} className="py-4 text-center text-gray-500">Không có sản phẩm.</td></tr>
            ) : (
              currentProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img src={product.imageUrl || product.image || '/images/default-product.png'} alt={product.name} className="w-12 h-12 rounded object-cover" />
                    <div>
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">#{product.id}</p>
                      {bestSellerIds.has(product.id) && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                          ◉ Best Seller
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{categoryNameOf(product.category)}</td>
                  <td className="py-3 px-4">{formatCurrency(product.price)}</td>
                  <td className="py-3 px-4">{product.stock}</td>
                  <td className="py-3 px-4">{product.totalSold ?? product.sold ?? product.sales ?? 0}</td>
                  <td className="py-3 px-4 text-primary font-semibold">{formatCurrency(product.totalAmmount ?? 0)}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(product.isActive ?? true)}`}>
                        <span className="inline-block h-2 w-2 rounded-full bg-current"></span>
                        {(product.isActive ?? true) ? 'Đang bán' : 'Ngưng bán'}
                      </span>
                      <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                        <span className={`inline-block h-2 w-2 rounded-full ${product.stock > 0 ? 'bg-emerald-600' : 'bg-gray-500'}`}></span>
                        {product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        className="text-amber-600 transition-colors hover:text-amber-700"
                        title="Quản lý quảng bá"
                        type="button"
                        onClick={() => setStoryManagerProduct(product)}
                      >
                        <FaBullhorn />
                      </button>
                      <button
                        className="text-blue-600 transition-colors hover:text-blue-800"
                        title="Xem"
                        type="button"
                        onClick={() => setViewingProduct(product)}
                      >
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
                        className={`transition-colors ${product.isActive
                          ? 'text-green-600 hover:text-green-700'
                          : 'text-red-500 hover:text-red-600'}`}
                        title={product.isActive ? 'Ngưng bán sản phẩm' : 'Mở bán sản phẩm'}
                        type="button"
                        onClick={() => handleToggleActiveRequest(product)}
                      >
                        {product.isActive ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />}
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

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          <FaQuestionCircle className="text-base text-primary" /> Ghi chú thao tác
        </h3>
        <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2">
            <FaBullhorn className="text-amber-600 text-lg" />
            <span>Quản lý nội dung quảng bá</span>
          </div>
          <div className="flex items-center gap-2">
            <FaEye className="text-blue-600 text-lg" />
            <span>Xem chi tiết sản phẩm</span>
          </div>
          <div className="flex items-center gap-2">
            <FaEdit className="text-green-600 text-lg" />
            <span>Chỉnh sửa thông tin sản phẩm</span>
          </div>
          <div className="flex items-center gap-2">
            <FaToggleOn className="text-green-600 text-lg" />
            <span>Bật trạng thái hoạt động</span>
          </div>
          <div className="flex items-center gap-2">
            <FaToggleOff className="text-red-500 text-lg" />
            <span>Tắt trạng thái hoạt động</span>
          </div>
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

      <ViewProductModal
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        formatCurrency={formatCurrency}
        categoryLabel={categoryNameOf(viewingProduct?.category)}
      />

      {storyManagerProduct && (
        <ProductStoryManager
          product={storyManagerProduct}
          onClose={() => setStoryManagerProduct(null)}
        />
      )}

      {toggleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-800">Xác nhận cập nhật trạng thái</h3>
            </div>
            <div className="space-y-3 px-6 py-5 text-sm text-gray-700">
              <p>
                Bạn có chắc muốn
                {' '}
                <span className="font-semibold text-primary">
                  {toggleModal.nextState ? 'bật hoạt động' : 'tắt hoạt động'}
                </span>
                {' '}
                cho sản phẩm
                {' '}
                <span className="font-semibold text-gray-900">{toggleModal.product.name}</span>
                ?
              </p>
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                <p><span className="font-semibold">Mã sản phẩm:</span> {toggleModal.product.id}</p>
                <p><span className="font-semibold">Trạng thái hiện tại:</span> {(toggleModal.product.isActive ?? true) ? 'Đang bán' : 'Ngưng bán'}</p>
              </div>
              <p className="text-xs text-gray-500">
                Hệ thống chỉ ẩn/hiện sản phẩm khỏi cửa hàng, dữ liệu vẫn được giữ nguyên.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => { if (!isToggling) setToggleModal(null); }}
                disabled={isToggling}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                disabled={isToggling}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isToggling && <FaSpinner className="animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
