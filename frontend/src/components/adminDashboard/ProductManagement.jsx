import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FaBan,
  FaCheck,
  FaSearch,
  FaStore,
  FaBoxOpen,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Pagination from '../shared/Pagination';
import { ProductService } from '../../services/modules/products/productService';
import { CategoryService } from '../../services/modules/products/categoryService';

const PAGE_SIZE_OPTIONS = [5, 10, 20];
const DEFAULT_PAGE_SIZE = 10;

const formatCurrency = (value) => {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)} VND`;
};

const statusBadge = (isActive) => (
  isActive
    ? 'bg-green-100 text-green-700'
    : 'bg-red-100 text-red-700'
);

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [expandedProductIds, setExpandedProductIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [categoryMap, setCategoryMap] = useState({});

  const loadStats = useCallback(async () => {
    try {
      const [allRes, activeRes, inactiveRes] = await Promise.all([
        ProductService.getAllProducts({ pageIndex: 1, pageSize: 1 }),
        ProductService.getAllProducts({ pageIndex: 1, pageSize: 1, isactive: true }),
        ProductService.getAllProducts({ pageIndex: 1, pageSize: 1, isactive: false }),
      ]);

      setStats({
        total: allRes?.totalCount ?? allRes?.raw?.totalCount ?? 0,
        active: activeRes?.totalCount ?? activeRes?.raw?.totalCount ?? 0,
        inactive: inactiveRes?.totalCount ?? inactiveRes?.raw?.totalCount ?? 0,
      });
    } catch (error) {
      console.error('Load product stats error:', error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        pageIndex,
        pageSize,
      };

      const keyword = searchTerm.trim();
      if (keyword) {
        params.productName = keyword;
      }
      if (statusFilter !== 'all') {
        params.isactive = statusFilter === 'active';
      }

      const response = await ProductService.getAllProducts(params);
      const rawItems = response?.items || [];
      const items = rawItems.map((item) => {
        const baseDescription = item?.description || item?.shortDescription || 'Chưa có mô tả';
        const trimmed = baseDescription.length > 50 ? `${baseDescription.slice(0, 47)}...` : baseDescription;
        return {
          ...item,
          description: baseDescription,
          shortDescription: trimmed,
        };
      });
      const totalCount = response?.totalCount
        ?? response?.raw?.totalCount
        ?? items.length;
      const totalPages = response?.totalPages
        ?? response?.raw?.totalPages
        ?? Math.max(1, Math.ceil(totalCount / pageSize));

      setProducts(items);
      setMeta({
        totalCount,
        totalPages,
        pageSize,
      });
    } catch (error) {
      console.error('Load products error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Không thể tải danh sách sản phẩm.',
      );
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, searchTerm, statusFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const applySearch = useCallback((value) => {
    const normalized = value.trim();
    setSearchTerm((prev) => {
      if (prev !== normalized) {
        setPageIndex(1);
      }
      return normalized;
    });
  }, [setPageIndex]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const normalized = searchInput.trim();
      if (normalized !== searchInput) {
        setSearchInput(normalized);
        applySearch(normalized);
      } else {
        applySearch(normalized);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, applySearch]);

  useEffect(() => {
    (async () => {
      try {
        const res = await CategoryService.getAllCategories();
        const list = res?.items || res || [];
        const map = {};
        list.forEach((cat) => {
          if (cat?.id) {
            map[cat.id] = cat.name || cat.categoryName || cat.title || cat.id;
          }
        });
        setCategoryMap(map);
      } catch (error) {
        console.error('Load categories error:', error);
      }
    })();
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    setPageIndex((prev) => (prev === 1 ? prev : 1));
  }, [statusFilter]);

  useEffect(() => {
    setPageIndex(1);
  }, [pageSize]);

  useEffect(() => {
    setExpandedProductIds((prev) => {
      if (!prev.size) {
        return prev;
      }
      const allowedIds = new Set(products.map((item) => item.id));
      const next = new Set();
      prev.forEach((id) => {
        if (allowedIds.has(id)) {
          next.add(id);
        }
      });
      if (next.size === prev.size) {
        let identical = true;
        prev.forEach((id) => {
          if (!next.has(id)) {
            identical = false;
          }
        });
        if (identical) {
          return prev;
        }
      }
      return next;
    });
  }, [products]);

  const handleToggleStatus = async (product) => {
    if (!product?.id) return;
    const nextState = !product.isActive;
    try {
      await ProductService.updateStatus(product.id, nextState);
      toast.success(nextState ? 'Đã kích hoạt sản phẩm' : 'Đã vô hiệu hóa sản phẩm');
      await Promise.all([loadProducts(), loadStats()]);
    } catch (error) {
      console.error('Toggle product status error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Không thể cập nhật trạng thái sản phẩm.',
      );
    }
  };

  const filteredProducts = useMemo(() => products.filter((product) => {
    if (statusFilter === 'inactive') {
      return !product?.isActive;
    }
    if (statusFilter === 'active') {
      return product?.isActive;
    }
    return true;
  }), [products, statusFilter]);

  const toggleDescription = (productId) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const normalized = searchInput.trim();
      if (normalized !== searchInput) {
        setSearchInput(normalized);
      }
      applySearch(normalized);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý sản phẩm</h2>
          <p className="text-sm text-gray-600 mt-1">
            Tổng {meta.totalCount || filteredProducts.length} sản phẩm
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-green-200 bg-green-50 shadow-sm">
            <FaBoxOpen className="text-green-500" />
            <div className="text-sm">
              <div className="text-green-700 font-semibold">Hoạt động</div>
              <div className="text-green-600 font-bold">{stats.active}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 shadow-sm">
            <FaBan className="text-red-500" />
            <div className="text-sm">
              <div className="text-red-700 font-semibold">Vô hiệu hóa</div>
              <div className="text-red-600 font-bold">{stats.inactive}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
            <FaStore className="text-blue-500" />
            <div className="text-sm">
              <div className="text-blue-700 font-semibold">Tổng</div>
              <div className="text-blue-600 font-bold">{stats.total}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative lg:col-span-2">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, cửa hàng..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang bán</option>
          <option value="inactive">Vô hiệu hóa</option>
        </select>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              Hiển thị {size} sản phẩm/trang
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="py-3 px-4">Sản phẩm</th>
              <th className="py-3 px-4">Danh mục</th>
              <th className="py-3 px-4">Giá</th>
              <th className="py-3 px-4">Tồn kho</th>
              <th className="py-3 px-4">Cửa hàng</th>
              <th className="py-3 px-4">Người bán</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-500">
                  Không có sản phẩm nào.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const descriptionText = product.description || 'Chưa có mô tả';
                const sanitizedDescription = descriptionText.trim();
                const words = sanitizedDescription ? sanitizedDescription.split(/\s+/) : [];
                const previewText = words.slice(0, 3).join(' ');
                const isDefaultDescription = descriptionText === 'Chưa có mô tả';
                const canExpand = !isDefaultDescription && words.length > 3;
                const isExpanded = expandedProductIds.has(product.id);

                return (
                  <tr key={product.id} className="border-b hover:bg-gray-50 text-sm">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg border overflow-hidden bg-gray-100 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaBoxOpen className="text-gray-400 text-lg" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          {isExpanded ? (
                            <>
                              <span>{descriptionText}</span>
                              {canExpand ? (
                                <button
                                  type="button"
                                  onClick={() => toggleDescription(product.id)}
                                  className="ml-2 text-primary font-semibold hover:underline"
                                >
                                  Thu gọn
                                </button>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <span>
                                {previewText || descriptionText}
                                {canExpand ? '...' : ''}
                              </span>
                              {canExpand ? (
                                <button
                                  type="button"
                                  onClick={() => toggleDescription(product.id)}
                                  className="ml-2 text-primary font-semibold hover:underline"
                                >
                                  Xem thêm
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {categoryMap[product.category] || product.category || '--'}
                  </td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{formatCurrency(product.price)}</td>
                  <td className="py-3 px-4 text-gray-700">{product.stock ?? 0}</td>
                  <td className="py-3 px-4 text-gray-700">{product.shopName || '--'}</td>
                  <td className="py-3 px-4 text-gray-700">{product.displayName || product.artisanId || '--'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge(product.isActive)}`}>
                      {product.isActive ? 'Đang bán' : 'Vô hiệu hóa'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(product)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm
                        ${product.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {product.isActive ? <FaBan /> : <FaCheck />}
                      {product.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </button>
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
    </div>
  );
};

export default ProductManagement;
