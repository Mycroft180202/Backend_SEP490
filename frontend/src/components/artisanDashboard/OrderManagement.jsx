import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  FaCheck,
  FaEye,
  FaFileExport,
  FaQuestionCircle,
  FaSearch,
  FaSpinner,
  FaTruck,
  FaTimes,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import ArtisanDashboardService from '../../services/modules/artisan/artisanDashboardService';
import { UserService } from '../../services/modules/users/userService';
import { ProductService } from '../../services/modules/products/productService';
import { AddressService } from '../../services/modules/orders/addressService';

const DEFAULT_PAGE_SIZE = 10;
const API_FETCH_PAGE_SIZE = 200;
const PAGE_SIZE_OPTIONS = [10, 20, 40, 80];

const STATUS_META = {
  WAITING_FOR_PICKUP: {
    label: 'Chờ xác nhận',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  ARTISAN_CONFIRMED: {
    label: 'Đơn hàng đã được xác nhận',
    badge: 'bg-green-100 text-green-700',
  },
  PAID_WAITING_CONFIRMATION: {
    label: 'Đơn hàng đã được thanh toán, chờ xác nhận',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  SHIPPING: {
    label: 'Shipping',
    badge: 'bg-blue-100 text-blue-700',
  },
  PAID: {
    label: 'Đã thanh toán',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  COMPLETED: {
    label: 'Đã nhận hàng',
    badge: 'bg-green-100 text-green-700',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badge: 'bg-red-100 text-red-700',
  },
  UNKNOWN: {
    label: 'Không rõ',
    badge: 'bg-gray-100 text-gray-600',
  },
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
  if (
    upper === 'WAITINGFORPICKUP'
    || upper === 'WAITING_FOR_PICKUP'
    || upper === 'PENDING'
    || upper === 'PROCESSING'
  ) {
    return 'WAITING_FOR_PICKUP';
  }
  if (
    upper === 'SHIPPING'
    || upper === 'SHIPPED'
    || upper === 'DELIVERING'
    || upper === 'DELIVERED'
  ) {
    return 'SHIPPING';
  }
  if (upper === 'PAID') {
    return 'PAID';
  }
  if (upper === 'CANCELLED' || upper === 'CANCELED') {
    return 'CANCELLED';
  }
  if (upper === 'COMPLETED' || upper === 'DONE') {
    return 'COMPLETED';
  }
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

const resolveArtisanConfirmedAt = (order) =>
  order?.artisanConfirmedAt
  ?? order?.ArtisanConfirmedAt
  ?? order?.artisanConfirmedAtUtc
  ?? order?.artisanConfirmedAtUTC
  ?? null;

const isArtisanConfirmed = (order) => Boolean(resolveArtisanConfirmedAt(order));

const getDisplayStatusKeyForOrder = (order) => {
  const normalized = normalizeStatusKey(order?.status ?? order?.orderStatus);
  const paymentKey = normalizePaymentKey(order?.paymentType ?? order?.paymentMethod);
  if (normalized === 'PAID' && paymentKey === 'VNPAY' && !isArtisanConfirmed(order)) {
    return 'PAID_WAITING_CONFIRMATION';
  }
  if (normalized === 'WAITING_FOR_PICKUP' && isArtisanConfirmed(order)) {
    return 'ARTISAN_CONFIRMED';
  }
  return normalized;
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

const canMarkAsShipping = (statusKey, paymentKey) => {
  if (statusKey === 'WAITING_FOR_PICKUP') {
    return paymentKey !== 'VNPAY';
  }
  return statusKey === 'PAID';
};

const canConfirmByArtisan = (order) => {
  const statusKey = normalizeStatusKey(order?.status ?? order?.orderStatus);
  if (statusKey === 'CANCELLED' || statusKey === 'COMPLETED' || statusKey === 'SHIPPING') {
    return false;
  }
  const paymentKey = normalizePaymentKey(order?.paymentType ?? order?.paymentMethod);
  if (statusKey === 'WAITING_FOR_PICKUP') {
    return !isArtisanConfirmed(order);
  }
  if (paymentKey === 'VNPAY' && statusKey === 'PAID') {
    return !isArtisanConfirmed(order);
  }
  return false;
};

const canTransferToShipping = (order) => {
  const statusKey = normalizeStatusKey(order?.status ?? order?.orderStatus);
  const paymentKey = normalizePaymentKey(order?.paymentType ?? order?.paymentMethod);
  return canMarkAsShipping(statusKey, paymentKey) && isArtisanConfirmed(order);
};

const OrderManagement = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [orders, setOrders] = useState([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderNumber, setUpdatingOrderNumber] = useState(null);
  const [confirmOrderNumber, setConfirmOrderNumber] = useState(null);
  const [shippingOrderNumber, setShippingOrderNumber] = useState(null);
  const handleCloseDetail = useCallback(() => setSelectedOrder(null), []);
  const addressCacheRef = useRef(new Map());
  const productCacheRef = useRef(new Map());
  const realtimeRefreshTimeoutRef = useRef(null);

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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const aggregated = [];
      let page = 1;
      let expectedTotal = null;
      let attempts = 0;

      while (attempts < 20) {
        attempts += 1;
        const response = await ArtisanDashboardService.getOrders({
          pageIndex: page,
          pageSize: API_FETCH_PAGE_SIZE,
        });

        const source = Array.isArray(response?.items) ? response.items : [];
        if (source.length) {
          aggregated.push(...source);
        }

        if (Number.isFinite(Number(response?.totalCount))) {
          expectedTotal = Number(response.totalCount);
        }

        const hasNextPage = Boolean(response?.hasNextPage);
        const totalPagesFromApi = Number(response?.totalPages);
        const reachedExpectedTotal = expectedTotal !== null && aggregated.length >= expectedTotal;
        const fetchedFullPage = source.length >= API_FETCH_PAGE_SIZE;

        if (hasNextPage && !reachedExpectedTotal) {
          page += 1;
          continue;
        }

        if (Number.isFinite(totalPagesFromApi) && totalPagesFromApi > 0 && page < totalPagesFromApi && !reachedExpectedTotal) {
          page += 1;
          continue;
        }

        if (fetchedFullPage && !reachedExpectedTotal) {
          page += 1;
          continue;
        }

        break;
      }

      const normalized = aggregated.map((order, index) => {
        const items = Array.isArray(order?.items) ? order.items : [];
        const statusKey = normalizeStatusKey(order?.status ?? order?.orderStatus);
        const paymentKey = normalizePaymentKey(order?.paymentType ?? order?.paymentMethod);
        const totalQuantity = items.reduce(
          (sum, item) => sum + Number(item?.quantity ?? item?.qty ?? 0),
          0,
        );

        return {
          id: order?.orderNumber ?? order?.id ?? `order-${index}`,
          orderNumber: order?.orderNumber ?? order?.id ?? `order-${index}`,
          customerId:
            order?.customerId
            ?? order?.userId
            ?? order?.userID
            ?? null,
          customerName: order?.customerName || order?.customerDisplayName || '',
          status: statusKey,
          paymentType: paymentKey,
          totalAmount: Number(order?.totalAmount ?? order?.amount ?? order?.total ?? 0),
          artisanConfirmedAt: resolveArtisanConfirmedAt(order),
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
    } catch (error) {
      console.error('Không thể tải danh sách đơn hàng artisan:', error);
      toast.error(error?.response?.data?.message || 'Không thể tải danh sách đơn hàng');
      setOrders([]);
      setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [enrichOrdersWithProfiles, resolveAddressDisplay, enrichItemsWithProductInfo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }
    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      fetchOrders();
    }, 600);
  }, [fetchOrders]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handler = () => scheduleRealtimeRefresh();
    window.addEventListener('realtime:notificationReceived', handler);
    window.addEventListener('realtime:orderUpdated', handler);
    window.addEventListener('realtime:paymentUpdated', handler);
    window.addEventListener('realtime:shipmentStatusUpdated', handler);

    return () => {
      window.removeEventListener('realtime:notificationReceived', handler);
      window.removeEventListener('realtime:orderUpdated', handler);
      window.removeEventListener('realtime:paymentUpdated', handler);
      window.removeEventListener('realtime:shipmentStatusUpdated', handler);
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }
    };
  }, [scheduleRealtimeRefresh]);

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

  const totalPages = useMemo(() => {
    if (!filteredOrders.length) {
      return 1;
    }
    return Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  }, [filteredOrders.length, pageSize]);

  const paginatedOrders = useMemo(() => {
    if (!filteredOrders.length) {
      return [];
    }
    const start = (pageIndex - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, pageIndex, pageSize]);

  useEffect(() => {
    if (pageIndex > totalPages) {
      setPageIndex(Math.max(1, totalPages));
    }
  }, [pageIndex, totalPages]);

  const stats = useMemo(() => {
    const base = {
      total: orders.length,
      waitingForPickup: 0,
      shipping: 0,
      paid: 0,
      completed: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      switch (order.status) {
        case 'WAITING_FOR_PICKUP':
          base.waitingForPickup += 1;
          break;
        case 'SHIPPING':
          base.shipping += 1;
          break;
        case 'PAID':
          base.paid += 1;
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
  }, [orders]);

  const handleMarkAsShipping = useCallback(
    async (orderNumber) => {
      if (!orderNumber) return;
      setUpdatingOrderNumber(orderNumber);
      try {
        await ArtisanDashboardService.markOrderAsShipping(orderNumber);
        toast.success('Đơn hàng đã chuyển sang bên giao hàng');
        await fetchOrders();
        setSelectedOrder((current) => (current?.orderNumber === orderNumber
          ? { ...current, status: 'SHIPPING' }
          : current));
      } catch (error) {
        console.error('Không thể cập nhật đơn hàng:', error);
        toast.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng');
      } finally {
        setUpdatingOrderNumber(null);
      }
    },
    [fetchOrders],
  );

  const handleConfirmShipping = useCallback(async () => {
    if (!shippingOrderNumber) return;
    await handleMarkAsShipping(shippingOrderNumber);
    setShippingOrderNumber(null);
  }, [shippingOrderNumber, handleMarkAsShipping]);

  const handleConfirmOrder = useCallback(async () => {
    if (!confirmOrderNumber) return;
    setUpdatingOrderNumber(confirmOrderNumber);
    try {
      await ArtisanDashboardService.confirmOrderByArtisan(confirmOrderNumber);
      toast.success('Đơn hàng đã được xác nhận');
      await fetchOrders();
      setSelectedOrder((current) => (current?.orderNumber === confirmOrderNumber
        ? { ...current, artisanConfirmedAt: new Date().toISOString() }
        : current));
    } catch (error) {
      console.error('Không thể xác nhận đơn hàng:', error);
      toast.error(error?.response?.data?.message || 'Không thể xác nhận đơn hàng');
    } finally {
      setUpdatingOrderNumber(null);
    }
    setConfirmOrderNumber(null);
  }, [confirmOrderNumber, fetchOrders]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber === pageIndex) {
      return;
    }
    setPageIndex(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const handlePrevPage = () => {
    if (loading || pageIndex <= 1) {
      return;
    }
    setPageIndex((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (loading || pageIndex >= totalPages) {
      return;
    }
    setPageIndex((prev) => Math.min(prev + 1, totalPages));
  };

  const formatStatusLabel = (statusKey) => STATUS_META[statusKey]?.label ?? STATUS_META.UNKNOWN.label;
  const getStatusBadgeClass = (statusKey) => STATUS_META[statusKey]?.badge ?? STATUS_META.UNKNOWN.badge;
  const formatPaymentLabel = (paymentKey) => PAYMENT_META[paymentKey]?.label ?? PAYMENT_META.UNKNOWN.label;
  const getPaymentBadgeClass = (paymentKey) => PAYMENT_META[paymentKey]?.badge ?? PAYMENT_META.UNKNOWN.badge;

  const displayStart = paginatedOrders.length ? (pageIndex - 1) * pageSize + 1 : 0;
  const displayEnd = (pageIndex - 1) * pageSize + paginatedOrders.length;
  const totalDisplay = filteredOrders.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <div className="rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Tổng đơn hàng</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="rounded-lg border-l-4 border-yellow-500 bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Chờ xác nhận</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{stats.waitingForPickup}</p>
        </div>
        <div className="rounded-lg border-l-4 border-blue-600 bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Đang giao</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{stats.shipping}</p>
        </div>
        <div className="rounded-lg border-l-4 border-indigo-500 bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Đã thanh toán</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{stats.paid}</p>
        </div>
        <div className="rounded-lg border-l-4 border-green-500 bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Đã nhận hàng</p>
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
            <h2 className="font-alata text-xl font-bold text-gray-800">Tất cả đơn hàng</h2>
            <p className="mt-1 text-sm text-gray-600">Theo dõi đơn hàng </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            <FaFileExport /> Xuất báo cáo
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
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
            <option value="WAITING_FOR_PICKUP">{STATUS_META.WAITING_FOR_PICKUP.label}</option>
            <option value="SHIPPING">{STATUS_META.SHIPPING.label}</option>
            <option value="PAID">{STATUS_META.PAID.label}</option>
            <option value="COMPLETED">{STATUS_META.COMPLETED.label}</option>
            <option value="CANCELLED">{STATUS_META.CANCELLED.label}</option>
          </select>
          <select
            value={pageSize}
            onChange={(event) => {
              const next = Number(event.target.value) || DEFAULT_PAGE_SIZE;
              setPageSize(next);
              setPageIndex(1);
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {`Hiển thị ${size}/trang`}
              </option>
            ))}
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
                paginatedOrders.map((order) => (
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
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(getDisplayStatusKeyForOrder(order))}`}>
                        {formatStatusLabel(getDisplayStatusKeyForOrder(order))}
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
                        {canConfirmByArtisan(order) ? (
                          <button
                            type="button"
                            className="text-green-600 transition hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Xác nhận đơn hàng"
                            onClick={() => setConfirmOrderNumber(order.orderNumber)}
                            disabled={updatingOrderNumber === order.orderNumber}
                          >
                            {updatingOrderNumber === order.orderNumber ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaCheck />
                            )}
                          </button>
                        ) : null}
                        {canMarkAsShipping(order.status, order.paymentType) ? (
                          <button
                            type="button"
                            className="text-blue-600 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                            title={
                              canTransferToShipping(order)
                                ? 'Chuyển sang bên giao hàng'
                                : 'Cần xác nhận đơn hàng trước khi chuyển giao'
                            }
                            onClick={() => setShippingOrderNumber(order.orderNumber)}
                            disabled={!canTransferToShipping(order) || updatingOrderNumber === order.orderNumber}
                          >
                            {updatingOrderNumber === order.orderNumber ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaTruck />
                            )}
                          </button>
                        ) : null}
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
            Hiển thị {paginatedOrders.length ? displayStart : 0} - {paginatedOrders.length ? displayEnd : 0} trên tổng {totalDisplay} đơn hàng
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
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            <FaQuestionCircle className="text-base text-primary" /> Ghi chú thao tác
          </h3>
          <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <FaEye className="text-blue-600 text-lg" />
              <span>Xem chi tiết đơn hàng</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheck className="text-green-600 text-lg" />
              <span>Xác nhận đơn hàng</span>
            </div>
            <div className="flex items-center gap-2">
              <FaTruck className="text-blue-600 text-lg" />
              <span>Chuyển sang bên giao hàng</span>
            </div>
          </div>
        </div>
        {confirmOrderNumber && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-800">Xác nhận đơn hàng</h3>
              <p className="mt-2 text-sm text-gray-600">
                Bạn có chắc chắn muốn xác nhận đơn hàng <strong>{confirmOrderNumber}</strong> không?
              </p>
              <div className="mt-6 flex justify-end gap-3 text-sm">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setConfirmOrderNumber(null)}
                  disabled={updatingOrderNumber === confirmOrderNumber}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleConfirmOrder}
                  disabled={updatingOrderNumber === confirmOrderNumber}
                >
                  {updatingOrderNumber === confirmOrderNumber ? (
                    <FaSpinner className="h-4 w-4 animate-spin" />
                  ) : (
                    <FaCheck className="h-4 w-4" />
                  )}
                  <span>Xác nhận</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {shippingOrderNumber && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-800">Chuyển sang bên giao hàng</h3>
              <p className="mt-2 text-sm text-gray-600">
                Bạn có chắc chắn muốn chuyển đơn hàng <strong>{shippingOrderNumber}</strong> sang bên giao hàng không?
              </p>
              <div className="mt-6 flex justify-end gap-3 text-sm">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setShippingOrderNumber(null)}
                  disabled={updatingOrderNumber === shippingOrderNumber}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleConfirmShipping}
                  disabled={updatingOrderNumber === shippingOrderNumber}
                >
                  {updatingOrderNumber === shippingOrderNumber ? (
                    <FaSpinner className="h-4 w-4 animate-spin" />
                  ) : (
                    <FaTruck className="h-4 w-4" />
                  )}
                  <span>Chuyển giao</span>
                </button>
              </div>
            </div>
          </div>
        )}
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
                  <span className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(getDisplayStatusKeyForOrder(selectedOrder))}`}>
                    {formatStatusLabel(getDisplayStatusKeyForOrder(selectedOrder))}
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
            <div className="flex justify-between border-t bg-gray-50 px-6 py-3">
              <div className="flex flex-wrap gap-2">
                {canConfirmByArtisan(selectedOrder) ? (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    onClick={() => setConfirmOrderNumber(selectedOrder.orderNumber)}
                    disabled={updatingOrderNumber === selectedOrder.orderNumber}
                  >
                    {updatingOrderNumber === selectedOrder.orderNumber ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaCheck />
                    )}
                    <span>Xác nhận đơn hàng</span>
                  </button>
                ) : null}
                {canMarkAsShipping(selectedOrder.status, selectedOrder.paymentType) ? (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    onClick={() => setShippingOrderNumber(selectedOrder.orderNumber)}
                    disabled={!canTransferToShipping(selectedOrder) || updatingOrderNumber === selectedOrder.orderNumber}
                    title={
                      canTransferToShipping(selectedOrder)
                        ? 'Chuyển sang bên giao hàng'
                        : 'Cần xác nhận đơn hàng trước khi chuyển giao'
                    }
                  >
                    {updatingOrderNumber === selectedOrder.orderNumber ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaTruck />
                    )}
                    <span>Chuyển giao</span>
                  </button>
                ) : null}
              </div>
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
