import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  FaEye,
  FaSearch,
  FaFileExport,
  FaSpinner,
  FaTimes,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import ArtisanDashboardService from '../../services/modules/artisan/artisanDashboardService';
import { UserService } from '../../services/modules/users/userService';
import { ProductService } from '../../services/modules/products/productService';
import { AddressService } from '../../services/modules/orders/addressService';

const PAGE_SIZE = 10;

const STATUS_META = {
  PENDING: { label: 'Đang xử lý', badge: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: 'Đang xử lý', badge: 'bg-yellow-100 text-yellow-700' },
  SHIPPING: { label: 'Đang giao', badge: 'bg-blue-100 text-blue-700' },
  SHIPPED: { label: 'Đang giao', badge: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'Đã thanh toán', badge: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Hoàn thành', badge: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', badge: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Hoàn tiền', badge: 'bg-purple-100 text-purple-700' },
  UNKNOWN: { label: 'Không rõ', badge: 'bg-gray-100 text-gray-600' },
};

const PAYMENT_META = {
  COD: { label: 'COD', badge: 'bg-amber-100 text-amber-700' },
  VNPAY: { label: 'VNPAY', badge: 'bg-purple-100 text-purple-700' },
  TRANSFER: { label: 'Chuyển khoản', badge: 'bg-blue-100 text-blue-700' },
  UNKNOWN: { label: 'Không rõ', badge: 'bg-gray-100 text-gray-600' },
};

const normalizeStatusKey = (value) => {
  if (!value) return 'UNKNOWN';
  const upper = String(value).trim().toUpperCase();
  if (upper === 'CANCELED') return 'CANCELLED';
  if (upper === 'PROCESSING') return 'PENDING';
  if (upper === 'DELIVERING' || upper === 'DELIVERED') return 'SHIPPING';
  if (upper === 'DONE') return 'COMPLETED';
  return STATUS_META[upper] ? upper : 'UNKNOWN';
};

const normalizePaymentKey = (value) => {
  if (!value) return 'UNKNOWN';
  const upper = String(value).trim().toUpperCase();
  if (upper.includes('COD')) return 'COD';
  if (upper.includes('VNPAY')) return 'VNPAY';
  if (upper.includes('TRANSFER')) return 'TRANSFER';
  return PAYMENT_META[upper] ? upper : 'UNKNOWN';
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const OrderManagement = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const handleCloseDetail = useCallback(() => setSelectedOrder(null), []);
  const addressCacheRef = useRef(new Map());
  const productCacheRef = useRef(new Map());

  const formatCurrency = useCallback((amount) => {
    const numeric = Number(amount) || 0;
    return `${new Intl.NumberFormat('vi-VN').format(numeric)} VND`;
  }, []);

  const resolveAddressDisplay = useCallback(async (addressId) => {
    if (!addressId) {
      return '—';
    }

    const cached = addressCacheRef.current.get(addressId);
    if (cached) {
      return AddressService.formatAddressDisplay(cached);
    }

    try {
      const detail = await AddressService.getAddressDetail(addressId);
      addressCacheRef.current.set(addressId, detail);
      return AddressService.formatAddressDisplay(detail);
    } catch (error) {
      console.warn('Không thể lấy địa chỉ:', addressId, error);
      return addressId;
    }
  }, []);

  const enrichItemsWithProductInfo = useCallback(async (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    return Promise.all(
      items.map(async (item) => {
        const productId = item?.productID ?? item?.productId ?? item?.id;
        if (!productId) {
          return {
            ...item,
            productId: productId || '—',
            productName: item?.productName || item?.name || 'Sản phẩm',
            productImage: item?.productImage ?? null,
          };
        }

        const cached = productCacheRef.current.get(productId);
        if (cached) {
          return {
            ...item,
            productId,
            productName: cached.name,
            productImage: cached.imageUrl,
          };
        }

        try {
          const product = await ProductService.getProductById(productId);
          const normalized = {
            name:
              product?.name
              ?? product?.productName
              ?? product?.title
              ?? productId,
            imageUrl:
              (Array.isArray(product?.images) && product.images.length
                ? (typeof product.images[0] === 'string'
                  ? product.images[0]
                  : product.images[0]?.url
                    ?? product.images[0]?.imageUrl
                    ?? product.images[0]?.imageURL
                    ?? product.images[0]?.image
                    ?? null)
                : null)
              ?? product?.imageUrl
              ?? product?.imageURL
              ?? product?.thumbnail
              ?? product?.image
              ?? null,
          };
          productCacheRef.current.set(productId, normalized);
          return {
            ...item,
            productId,
            productName: normalized.name,
            productImage: normalized.imageUrl,
          };
        } catch (error) {
          console.warn('Không thể lấy sản phẩm:', productId, error);
          return {
            ...item,
            productId,
            productName: item?.productName || productId,
            productImage: null,
          };
        }
      }),
    );
  }, []);

  const enrichOrdersWithProfiles = useCallback(async (orderList) => {
    if (!Array.isArray(orderList) || orderList.length === 0) {
      return orderList || [];
    }

    const uniqueIds = Array.from(
      new Set(
        orderList
          .map((order) => order.customerId)
          .filter((id) => typeof id === 'string' && id.trim()),
      ),
    );

    if (uniqueIds.length === 0) {
      return orderList;
    }

    const profileEntries = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const profile = await UserService.getById(id);
          return [id, profile];
        } catch (error) {
          console.warn('Không thể lấy thông tin khách hàng:', id, error);
          return [id, null];
        }
      }),
    );

    const profileMap = new Map(profileEntries);

    return orderList.map((order) => {
      const profile = order.customerId ? profileMap.get(order.customerId) : null;
      if (!profile) {
        return order.customerName ? order : { ...order, customerName: order.customerName || 'Khách hàng' };
      }

      const resolvedName =
        profile.displayName
        || profile.fullName
        || profile.name
        || profile.userName
        || profile.username
        || null;

      if (!resolvedName) {
        return order.customerName ? order : { ...order, customerName: 'Khách hàng' };
      }

      if (order.customerName === resolvedName) {
        return order;
      }

      return {
        ...order,
        customerName: resolvedName,
      };
    });
  }, []);

  const fetchOrders = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const response = await ArtisanDashboardService.getOrders({
        pageIndex: targetPage,
        pageSize: PAGE_SIZE,
      });

      const source = Array.isArray(response?.items) ? response.items : [];
      const normalized = source.map((order, index) => {
        const items = Array.isArray(order?.items) ? order.items : [];
        const statusKey = normalizeStatusKey(order?.status ?? order?.orderStatus);
        const paymentKey = normalizePaymentKey(order?.paymentType ?? order?.paymentMethod);
        const totalQuantity = items.reduce(
          (sum, item) => sum + Number(item?.quantity ?? item?.qty ?? 0),
          0,
        );

        return {
          id: order?.orderNumber ?? order?.id ?? `order-${targetPage}-${index}`,
          orderNumber: order?.orderNumber ?? order?.id ?? `order-${targetPage}-${index}`,
          customerId:
            order?.customerId
            ?? order?.userId
            ?? order?.userID
            ?? null,
          customerName: order?.customerName || order?.customerDisplayName || '',
          status: statusKey,
          paymentType: paymentKey,
          totalAmount: Number(order?.totalAmount ?? order?.amount ?? order?.total ?? 0),
          createdAt:
            order?.createAt
            ?? order?.createdAt
            ?? order?.orderDate
            ?? order?.createdDate
            ?? null,
          items,
          totalQuantity,
          shippingAddressId:
            order?.shipingAddressId
            ?? order?.shippingAddressId
            ?? null,
          shipments: Array.isArray(order?.shipments) ? order.shipments : [],
        };
      });

      const enriched = await enrichOrdersWithProfiles(normalized).catch(() => normalized);

      const enrichedWithDetails = await Promise.all(
        enriched.map(async (order) => {
          const [addressDisplay, itemsWithInfo] = await Promise.all([
            resolveAddressDisplay(order.shippingAddressId),
            enrichItemsWithProductInfo(order.items),
          ]);

          return {
            ...order,
            shippingAddress: addressDisplay,
            items: itemsWithInfo,
            customerName: order.customerName || 'Khách hàng',
          };
        }),
      );

      setOrders(enrichedWithDetails);
      setTotalCount(Number(response?.totalCount ?? source.length));
      setTotalPages(Math.max(Number(response?.totalPages ?? 1), 1));
      setHasNextPage(Boolean(response?.hasNextPage) || targetPage < Number(response?.totalPages ?? 1));
      setHasPreviousPage(Boolean(response?.hasPreviousPage) || targetPage > 1);
    } catch (error) {
      console.error('Không thể tải danh sách đơn hàng artisan:', error);
      toast.error(error?.response?.data?.message || 'Không thể tải danh sách đơn hàng');
      setOrders([]);
      setTotalCount(0);
      setTotalPages(1);
      setHasNextPage(false);
      setHasPreviousPage(false);
    } finally {
      setLoading(false);
    }
  }, [enrichOrdersWithProfiles, resolveAddressDisplay, enrichItemsWithProductInfo]);

  useEffect(() => {
    fetchOrders(pageIndex);
  }, [pageIndex, fetchOrders]);

  const filteredOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const statusFilter = filterStatus;
    return orders.filter((order) => {
      const matchesKeyword = !keyword
        || order.orderNumber.toLowerCase().includes(keyword)
        || (order.customerName || '').toLowerCase().includes(keyword)
        || (order.customerId || '').toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const base = {
      total: totalCount,
      processing: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      switch (order.status) {
        case 'PENDING':
        case 'PROCESSING':
          base.processing += 1;
          break;
        case 'SHIPPING':
        case 'SHIPPED':
          base.shipping += 1;
          break;
        case 'COMPLETED':
          base.completed += 1;
          break;
        case 'CANCELLED':
          base.cancelled += 1;
          break;
        default:
          break;
      }
    });

    return base;
  }, [orders, totalCount]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber === pageIndex) {
      return;
    }
    setPageIndex(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const handlePrevPage = () => {
    if (loading || (!hasPreviousPage && pageIndex <= 1)) {
      return;
    }
    setPageIndex((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (loading || (!hasNextPage && pageIndex >= totalPages)) {
      return;
    }
    setPageIndex((prev) => Math.min(prev + 1, totalPages));
  };

  const formatStatusLabel = (statusKey) => STATUS_META[statusKey]?.label ?? STATUS_META.UNKNOWN.label;
  const getStatusBadgeClass = (statusKey) => STATUS_META[statusKey]?.badge ?? STATUS_META.UNKNOWN.badge;
  const formatPaymentLabel = (paymentKey) => PAYMENT_META[paymentKey]?.label ?? PAYMENT_META.UNKNOWN.label;
  const getPaymentBadgeClass = (paymentKey) => PAYMENT_META[paymentKey]?.badge ?? PAYMENT_META.UNKNOWN.badge;

  const displayStart = filteredOrders.length ? (pageIndex - 1) * PAGE_SIZE + 1 : 0;
  const displayEnd = (pageIndex - 1) * PAGE_SIZE + filteredOrders.length;
  const totalDisplay = searchTerm ? filteredOrders.length : totalCount;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Tổng đơn hàng</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="rounded-lg border-l-4 border-yellow-500 bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Đang xử lý</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{stats.processing}</p>
        </div>
        <div className="rounded-lg border-l-4 border-blue-600 bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Đang giao</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{stats.shipping}</p>
        </div>
        <div className="rounded-lg border-l-4 border-green-500 bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Hoàn thành</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{stats.completed}</p>
        </div>
        <div className="rounded-lg border-l-4 border-red-500 bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Đã hủy</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{stats.cancelled}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-alata text-xl font-bold text-gray-800">Quản lý đơn hàng</h2>
            <p className="mt-1 text-sm text-gray-600">Quản lý và theo dõi đơn hàng của shop</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            <FaFileExport /> Xuất báo cáo
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã đơn, khách hàng..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPageIndex(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(event) => {
              setFilterStatus(event.target.value);
              setPageIndex(1);
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">{STATUS_META.PENDING.label}</option>
            <option value="SHIPPING">{STATUS_META.SHIPPING.label}</option>
            <option value="PAID">{STATUS_META.PAID.label}</option>
            <option value="COMPLETED">{STATUS_META.COMPLETED.label}</option>
            <option value="CANCELLED">{STATUS_META.CANCELLED.label}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm font-semibold text-gray-600">
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">SL</th>
                <th className="px-4 py-3">Giá trị</th>
                <th className="px-4 py-3">Thanh toán</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin text-primary" />
                      <span>Đang tải dữ liệu đơn hàng...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">
                    Không có đơn hàng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 text-sm hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-primary">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-800">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.customerId || '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-800">{order.totalQuantity}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(order.paymentType)}`}>
                        {formatPaymentLabel(order.paymentType)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                        {formatStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-blue-600 transition hover:text-blue-800"
                          title="Xem chi tiết"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <FaEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>
            Hiển thị {filteredOrders.length ? displayStart : 0} - {displayEnd} trên tổng {totalDisplay} đơn hàng
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={loading || pageIndex === 1}
              className={`rounded-lg border border-gray-300 px-4 py-2 ${
                loading || pageIndex === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'
              }`}
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={`rounded-lg px-4 py-2 ${
                  pageIndex === page
                    ? 'bg-primary text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={handleNextPage}
              disabled={loading || pageIndex === totalPages}
              className={`rounded-lg border border-gray-300 px-4 py-2 ${
                loading || pageIndex === totalPages
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              Sau
            </button>
          </div>
        </div>
      </div>
      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Chi tiết đơn hàng {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-gray-500">
                  Tạo lúc: {formatDateTime(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                title="Đóng"
              >
                <FaTimes />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-gray-500">Khách hàng</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedOrder.customerName}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.customerId || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Tổng giá trị</p>
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Thanh toán</p>
                  <span className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(selectedOrder.paymentType)}`}>
                    {formatPaymentLabel(selectedOrder.paymentType)}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Trạng thái</p>
                  <span className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {formatStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Địa chỉ giao</p>
                  <p className="text-sm text-gray-700">{selectedOrder.shippingAddress || selectedOrder.shippingAddressId || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Số lượng sản phẩm</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedOrder.totalQuantity}</p>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-800">Danh sách sản phẩm</h4>
                <div className="mt-2 overflow-x-auto rounded-lg border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">Sản phẩm</th>
                        <th className="px-4 py-3 text-right">Số lượng</th>
                        <th className="px-4 py-3 text-right">Đơn giá</th>
                        <th className="px-4 py-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, index) => {
                          const quantity = Number(item?.quantity ?? item?.qty ?? 0);
                          const unitPrice = Number(item?.unitPrice ?? item?.price ?? 0);
                          const lineTotal = quantity * unitPrice;
                          const productId = item?.productID ?? item?.productId ?? item?.id ?? `item-${index}`;
                          const productName = item?.productName || productId;
                          const productImage = item?.productImage;
                          return (
                            <tr key={productId} className="border-t text-gray-700">
                              <td className="px-4 py-3">{index + 1}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {productImage ? (
                                    <img
                                      src={productImage}
                                      alt={productName}
                                      className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-500">
                                      Không có ảnh
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-gray-800">{productName}</p>
                                    <p className="text-xs text-gray-500">{productId}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">{quantity}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(unitPrice)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(lineTotal)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-center text-xs text-gray-500">
                            Không có sản phẩm nào trong đơn.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t bg-gray-50 px-6 py-3">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OrderManagement;
