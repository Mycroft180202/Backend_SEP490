import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { FaEye, FaSearch, FaFileExport, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { OrderService } from '../../services/modules/orders/orderService';
import { UserService } from '../../services/modules/users/userService';
import { AddressService } from '../../services/modules/orders/addressService';
import { ProductService } from '../../services/modules/products/productService';

const STATUS_LABELS = {
  WAITINGFORPICKUP: 'Chờ lấy hàng',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  PAID: 'Đã thanh toán',
  PENDING: 'Chờ lấy hàng',
  PAYMENTWAITING: 'Chờ thanh toán',
  WAITINGFORCONFIRM: 'Chờ xác nhận',
};

const STATUS_BADGE_STYLES = {
  WAITINGFORPICKUP: 'bg-amber-100 text-amber-700',
  SHIPPING: 'bg-sky-100 text-sky-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PAYMENTWAITING: 'bg-yellow-100 text-yellow-700',
  WAITINGFORCONFIRM: 'bg-yellow-100 text-yellow-700',
};

const STATUS_FILTER_OPTIONS = [
  { value: 'WaitingForPickup', label: 'Chờ lấy hàng' },
  { value: 'Shipping', label: 'Đang giao' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Paid', label: 'Đã thanh toán' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

const paymentLabels = {
  COD: 'COD',
  VNPAY: 'VNPAY',
};

const defaultStats = {
  total: 0,
  waitingForPickup: 0,
  shipping: 0,
  completed: 0,
  paid: 0,
  cancelled: 0,
};

const STATS_PAGE_SIZE = 50;

const AGGREGATION_PAGE_SIZE = 100;

const normalizeStatusKey = (status) => (status || '')
  .toString()
  .toUpperCase()
  .replace(/\s+/g, '')
  .replace(/_/g, '');

const getStatusLabel = (status) => {
  const directKey = (status || '').toUpperCase();
  const normalizedKey = normalizeStatusKey(status);
  return STATUS_LABELS[directKey] || STATUS_LABELS[normalizedKey] || status || '--';
};

const getStatusBadgeClass = (status) => {
  const directKey = (status || '').toUpperCase();
  const normalizedKey = normalizeStatusKey(status);
  return STATUS_BADGE_STYLES[directKey] || STATUS_BADGE_STYLES[normalizedKey] || 'bg-gray-100 text-gray-600';
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [customerDetails, setCustomerDetails] = useState({});
  const [addressDetails, setAddressDetails] = useState({});
  const [productCache, setProductCache] = useState({});
  const [realtimeNonce, setRealtimeNonce] = useState(0);
  const realtimeRefreshTimeoutRef = useRef(null);

  const formatCurrency = useCallback((amount) => {
    const numericAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
    return `${new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount)} VND`;
  }, []);

  const fetchAllOrders = useCallback(async (params = {}) => {
    let page = 1;
    const collected = [];
    let total = 0;
    let totalPagesCount = 1;

    while (true) {
      const response = await OrderService.getAdminOrders({
        pageIndex: page,
        pageSize: params.pageSize || AGGREGATION_PAGE_SIZE,
        ...params,
      });

      if (!response) break;

      const items = response.items || [];
      if (!items.length) break;

      collected.push(...items);
      total = response.totalCount ?? collected.length;
      totalPagesCount = response.totalPages
        ?? Math.ceil(total / (response.pageSize || AGGREGATION_PAGE_SIZE));
      const hasNextPage = response.hasNextPage ?? (page < totalPagesCount);

      if (!hasNextPage) {
        break;
      }

      page += 1;
    }

    return {
      items: collected,
      totalCount: total || collected.length,
    };
  }, []);

  useEffect(() => {
    if (statusFilter !== 'all') {
      return;
    }

    let isCancelled = false;

    const loadPaginatedOrders = async () => {
      try {
        setLoading(true);
        const keyword = searchTerm?.trim() ? searchTerm.trim() : undefined;
        const paymentType = paymentFilter !== 'all' ? paymentFilter : undefined;
        const response = await OrderService.getAdminOrders({
          pageIndex,
          pageSize,
          paymentType,
          status: undefined,
          keyword,
        });

        if (isCancelled) return;

        setOrders(response?.items || []);
        setTotalCount(response?.totalCount || 0);
        setTotalPages(response?.totalPages || 1);
      } catch (error) {
        if (isCancelled) return;
        console.error('Fetch orders error:', error);
        const message =
          error?.response?.data?.message
          || error?.message
          || 'Không thể tải danh sách đơn hàng';
        toast.error(message);
        setOrders([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadPaginatedOrders();

    return () => {
      isCancelled = true;
    };
  }, [statusFilter, pageIndex, pageSize, paymentFilter, searchTerm, realtimeNonce]);

  useEffect(() => {
    if (statusFilter === 'all') {
      return;
    }

    let isCancelled = false;

    const loadStatusOrders = async () => {
      try {
        setLoading(true);
        const keyword = searchTerm?.trim() ? searchTerm.trim() : undefined;
        const paymentType = paymentFilter !== 'all' ? paymentFilter : undefined;
        const { items, totalCount } = await fetchAllOrders({
          pageSize: AGGREGATION_PAGE_SIZE,
          status: statusFilter,
          paymentType,
          keyword,
        });

        if (isCancelled) return;

        setOrders(items);
        setTotalCount(totalCount);
        setTotalPages(1);
        setPageIndex(1);
      } catch (error) {
        if (isCancelled) return;
        console.error('Fetch orders error:', error);
        const message =
          error?.response?.data?.message
          || error?.message
          || 'Không thể tải danh sách đơn hàng';
        toast.error(message);
        setOrders([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadStatusOrders();

    return () => {
      isCancelled = true;
    };
  }, [statusFilter, paymentFilter, searchTerm, fetchAllOrders, realtimeNonce]);

  useEffect(() => {
    setPageIndex((previous) => (previous === 1 ? previous : 1));
  }, [statusFilter, paymentFilter]);


  const applySearch = useCallback((value) => {
    const normalized = value.trim();
    setSearchTerm((previous) => {
      if (previous !== normalized) {
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

  const fetchProductDetails = useCallback(async (productIds = []) => {
    const uniqueIds = [...new Set(productIds.filter(Boolean))];
    if (!uniqueIds.length) return;

    const idsToFetch = uniqueIds.filter((id) => !productCache[id]);
    if (!idsToFetch.length) return;

    try {
      const results = await Promise.all(
        idsToFetch.map(async (id) => {
          try {
            const data = await ProductService.getProductById(id);
            return { id, data };
          } catch (error) {
            console.error('Fetch product detail error:', id, error);
            return null;
          }
        }),
      );

      setProductCache((prev) => {
        const updated = { ...prev };
        let changed = false;
        (results || []).forEach((item) => {
          if (!item?.id) return;
          const productData = item.data?.data ?? item.data;
          if (productData && !updated[item.id]) {
            updated[item.id] = productData;
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    } catch (error) {
      console.error('Batch product fetch error:', error);
    }
  }, [productCache]);

  useEffect(() => {
    if (!orders.length) return;

    const missingCustomerIds = [...new Set(
      orders
        .map((order) => order.customerId)
        .filter((id) => id && !customerDetails[id]),
    )];

    const missingAddressIds = [...new Set(
      orders
        .map((order) => order.shipingAddressId)
        .filter((id) => id && !addressDetails[id]),
    )];

    if (!missingCustomerIds.length && !missingAddressIds.length) {
      return;
    }

    const fetchDetails = async () => {
      try {
        const [customerData, addressData] = await Promise.all([
          Promise.all(
            missingCustomerIds.map(async (id) => {
              try {
                const data = await UserService.getById(id);
                return { id, data };
              } catch (error) {
                console.error('Fetch customer detail error:', id, error);
                return null;
              }
            }),
          ),
          Promise.all(
            missingAddressIds.map(async (id) => {
              try {
                const data = await AddressService.getAddressDetail(id);
                return { id, data };
              } catch (error) {
                console.error('Fetch address detail error:', id, error);
                return null;
              }
            }),
          ),
        ]);

        if (customerData?.length) {
          setCustomerDetails((prev) => {
            const updated = { ...prev };
            let changed = false;
            customerData.forEach((item) => {
              if (item?.id && item.data && !updated[item.id]) {
                updated[item.id] = item.data;
                changed = true;
              }
            });
            return changed ? updated : prev;
          });
        }

        if (addressData?.length) {
          setAddressDetails((prev) => {
            const updated = { ...prev };
            let changed = false;
            addressData.forEach((item) => {
              if (item?.id && item.data && !updated[item.id]) {
                updated[item.id] = item.data;
                changed = true;
              }
            });
            return changed ? updated : prev;
          });
        }
      } catch (error) {
        console.error('Fetch details error:', error);
      }
    };

    fetchDetails();
  }, [orders, customerDetails, addressDetails]);

  useEffect(() => {
    const productIds = orders.flatMap((order) => (order.items || []).map((item) => item.productID));
    fetchProductDetails(productIds);
  }, [orders, fetchProductDetails]);

  const formatDate = useCallback((value) => {
    if (!value) return '--';
    try {
      return new Date(value).toLocaleString('vi-VN');
    } catch (error) {
      return value;
    }
  }, []);

  const getCustomerName = useCallback(
    (customerId) => {
      if (!customerId) return '--';
      const detail = customerDetails[customerId];
      if (!detail) return 'Đang tải...';
      return detail.displayName
        || detail.fullName
        || detail.name
        || detail.userName
        || customerId;
    },
    [customerDetails],
  );

  const getCustomerAddressDisplay = useCallback(
    (addressId) => {
      if (!addressId) return '--';
      const detail = addressDetails[addressId];
      if (!detail) return 'Đang tải địa chỉ...';
      return AddressService.formatAddressDisplay(detail);
    },
    [addressDetails],
  );

  const filteredOrders = useMemo(() => {
    if (!orders.length) {
      return [];
    }

    const normalizedQuery = searchTerm.trim().toLowerCase();
    const normalizedPayment = paymentFilter === 'all' ? null : paymentFilter.trim().toUpperCase();
    const normalizedStatusFilter = statusFilter === 'all' ? null : normalizeStatusKey(statusFilter);

    return orders.filter((order) => {
      const customerName = getCustomerName(order.customerId).toLowerCase();
      const phoneNumber = String(order.phoneNumber || order.customerPhone || '').toLowerCase();
      const normalizedOrderStatus = normalizeStatusKey(order.status);

      const matchSearch = !normalizedQuery
        || order.orderNumber?.toLowerCase().includes(normalizedQuery)
        || order.customerId?.toLowerCase().includes(normalizedQuery)
        || customerName.includes(normalizedQuery)
        || phoneNumber.includes(normalizedQuery);

      const matchStatus = !normalizedStatusFilter
        || normalizedOrderStatus === normalizedStatusFilter
        || (normalizedStatusFilter === 'WAITINGFORPICKUP'
          && ['PENDING', 'WAITINGFORCONFIRM', 'PAYMENTWAITING'].includes(normalizedOrderStatus));

      const paymentValue = (order.paymentType || '').trim().toUpperCase();
      const matchPayment = !normalizedPayment || paymentValue === normalizedPayment;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, getCustomerName]);

  const canExport = filteredOrders.length > 0;

  const handleExport = useCallback(() => {
    if (!filteredOrders.length) {
      toast.info('Không có đơn hàng phù hợp để xuất.');
      return;
    }

    try {
      if (typeof window === 'undefined') {
        return;
      }

      const headers = ['Mã đơn', 'Khách hàng', 'Trạng thái', 'Thanh toán', 'Tổng tiền', 'Ngày tạo', 'Địa chỉ'];
      const rows = filteredOrders.map((order) => [
        order.orderNumber || '',
        getCustomerName(order.customerId),
        getStatusLabel(order.status),
        paymentLabels[order.paymentType] || order.paymentType || '',
        formatCurrency(order.totalAmount),
        formatDate(order.createAt),
        getCustomerAddressDisplay(order.shipingAddressId),
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row
          .map((value) => {
            const safe = value === undefined || value === null ? '' : String(value);
            const escaped = safe.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(','))
        .join('\n');

      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `orders-report-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Xuất báo cáo thành công');
    } catch (error) {
      console.error('Export orders error:', error);
      toast.error('Không thể xuất báo cáo. Vui lòng thử lại.');
    }
  }, [filteredOrders, getCustomerName, getCustomerAddressDisplay, formatCurrency, formatDate]);

  const calculateStats = useCallback((orderList, total) => {
    const baseTotal = Number.isFinite(Number(total)) && Number(total) > 0
      ? Number(total)
      : orderList.length;

    return orderList.reduce(
      (acc, order) => {
        const normalizedStatusKey = normalizeStatusKey(order.status);

        if (normalizedStatusKey === 'WAITINGFORPICKUP' || normalizedStatusKey === 'PENDING') {
          acc.waitingForPickup += 1;
        } else if (normalizedStatusKey === 'SHIPPING') {
          acc.shipping += 1;
        } else if (normalizedStatusKey === 'COMPLETED') {
          acc.completed += 1;
        } else if (normalizedStatusKey === 'PAID') {
          acc.paid += 1;
        } else if (normalizedStatusKey === 'CANCELLED') {
          acc.cancelled += 1;
        }

        return acc;
      },
      {
        total: baseTotal,
        waitingForPickup: 0,
        shipping: 0,
        completed: 0,
        paid: 0,
        cancelled: 0,
      },
    );
  }, []);

  const fetchOverallStats = useCallback(async () => {
    try {
      let page = 1;
      let collectedOrders = [];
      let total = 0;

      while (true) {
        const response = await OrderService.getAdminOrders({
          pageIndex: page,
          pageSize: STATS_PAGE_SIZE,
        });

        if (!response) break;

        if (page === 1) {
          total = response.totalCount || 0;
        }

        collectedOrders = collectedOrders.concat(response.items || []);

        const nextPage = page + 1;
        const hasMore =
          (response.hasNextPage ?? (nextPage <= (response.totalPages || nextPage - 1)))
          && collectedOrders.length < total;

        if (!hasMore) {
          break;
        }

        page = nextPage;
      }

      setStats(calculateStats(collectedOrders, total || collectedOrders.length));
    } catch (error) {
      console.error('Fetch order stats error:', error);
    }
  }, [calculateStats]);

  useEffect(() => {
    fetchOverallStats();
  }, [fetchOverallStats, realtimeNonce]);

  const scheduleRealtimeReload = useCallback(() => {
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }
    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      setRealtimeNonce((prev) => prev + 1);
    }, 600);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handler = () => scheduleRealtimeReload();
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
  }, [scheduleRealtimeReload]);

  const openDetail = (order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setSelectedOrder(null);
    setDetailOpen(false);
  };

  useEffect(() => {
    if (!selectedOrder?.items?.length) return;
    fetchProductDetails(selectedOrder.items.map((item) => item.productID));
  }, [selectedOrder, fetchProductDetails]);

  const orderSummary = useMemo(() => {
    if (!selectedOrder) {
      return {
        subtotal: 0,
        shippingFee: 0,
        discountAmount: 0,
        total: 0,
      };
    }

    const subtotal = (selectedOrder.items || []).reduce((accumulator, item) => {
      const unitPrice = Number(item.unitPrice) || 0;
      const quantity = Number(item.quantity) || 0;
      return accumulator + unitPrice * quantity;
    }, 0);

    const shippingCandidates = [
      selectedOrder.feeShipping,
      selectedOrder.shippingFee,
      selectedOrder.shipingFee,
      selectedOrder.shippingProviderFee,
      selectedOrder.deliveryFee,
      selectedOrder.shippingCost,
    ];
    const rawShipping = shippingCandidates.find((value) => value !== undefined && value !== null);
    const shippingFee = Number.isFinite(Number(rawShipping)) ? Number(rawShipping) : 0;

    const discountCandidates = [
      selectedOrder.discountAmount,
      selectedOrder.discount,
      selectedOrder.promotionAmount,
    ];
    const rawDiscount = discountCandidates.find((value) => value !== undefined && value !== null);
    const discountAmount = Number.isFinite(Number(rawDiscount)) ? Number(rawDiscount) : 0;

    const total = Number.isFinite(Number(selectedOrder.totalAmount))
      ? Number(selectedOrder.totalAmount)
      : subtotal + shippingFee - discountAmount;

    return {
      subtotal,
      shippingFee,
      discountAmount,
      total,
    };
  }, [selectedOrder]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
          <p className="text-sm text-gray-600">Chờ lấy hàng</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.waitingForPickup}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-sky-500">
          <p className="text-sm text-gray-600">Đang giao</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.shipping}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-slate-500">
          <p className="text-sm text-gray-600">Hoàn thành</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
          <p className="text-sm text-gray-600">Đã thanh toán</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.paid}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Đã hủy</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý đơn hàng</h2>
            <p className="text-sm text-gray-600 mt-1">Quản lý và theo dõi tất cả đơn hàng</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={!canExport}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FaFileExport /> Xuất báo cáo
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative lg:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã đơn, tên khách hàng, số điện thoại..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageIndex(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPageIndex(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả hình thức thanh toán</option>
            <option value="COD">COD</option>
            <option value="VNPAY">VNPAY</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8 text-gray-600 gap-3">
              <FaSpinner className="animate-spin text-2xl text-primary" />
              <span>Đang tải đơn hàng...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Không có đơn hàng phù hợp</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-600">
                  <th className="text-left py-3 px-4 font-semibold">Mã đơn</th>
                  <th className="text-left py-3 px-4 font-semibold">Khách hàng</th>
                  <th className="text-left py-3 px-4 font-semibold">Tổng tiền</th>
                  <th className="text-left py-3 px-4 font-semibold">Thanh toán</th>
                  <th className="text-left py-3 px-4 font-semibold">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-semibold">Ngày tạo</th>
                  <th className="text-left py-3 px-4 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.orderNumber} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-sm text-primary">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="font-semibold text-gray-800">
                        {getCustomerName(order.customerId)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Địa chỉ: {getCustomerAddressDisplay(order.shipingAddressId)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {paymentLabels[order.paymentType] || order.paymentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatDate(order.createAt)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => openDetail(order)}
                        className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-semibold inline-flex items-center gap-1"
                      >
                        <FaEye /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Hiển thị {filteredOrders.length} trên tổng {paymentFilter === 'all' && statusFilter === 'all' && !searchTerm ? totalCount : filteredOrders.length} đơn hàng
            </p>
            {statusFilter === 'all' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setPageIndex((prev) => Math.max(prev - 1, 1))}
                  disabled={pageIndex === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setPageIndex(page)}
                    className={`px-4 py-2 rounded-lg ${
                      pageIndex === page
                        ? 'bg-primary text-white shadow'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setPageIndex((prev) => Math.min(prev + 1, totalPages))}
                  disabled={pageIndex === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Đã hiển thị toàn bộ đơn theo trạng thái đã chọn</span>
            )}
          </div>
        )}
      </div>
      {detailOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#8B4513]">Chi tiết đơn hàng</h3>
                <p className="text-sm text-gray-500">Mã đơn: {selectedOrder.orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm text-gray-700 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-900">Khách hàng</p>
                  <p>{getCustomerName(selectedOrder.customerId)}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ngày tạo</p>
                  <p>{formatDate(selectedOrder.createAt)}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Phương thức thanh toán</p>
                  <p>{paymentLabels[selectedOrder.paymentType] || selectedOrder.paymentType}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Trạng thái</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Địa chỉ giao hàng</p>
                <p>{getCustomerAddressDisplay(selectedOrder.shipingAddressId)}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Sản phẩm</p>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                    {(selectedOrder.items || []).map((item) => {
                      const product = productCache[item.productID] || {};
                      const productImage = Array.isArray(product.images) && product.images.length > 0
                        ? product.images[0]
                        : product.imageUrl || product.thumbnail || '/images/default-product.png';
                      const productName = product.productName || product.name || `Mã sản phẩm: ${item.productID}`;

                      return (
                        <div
                          key={`${item.productID}-${item.unitPrice}`}
                          className="px-4 py-3 flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={productImage}
                              alt={productName}
                              className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                              onError={(event) => {
                                event.currentTarget.src = '/images/default-product.png';
                              }}
                            />
                            <div>
                              <p className="font-semibold text-gray-800">{productName}</p>
                              <p className="text-xs text-gray-500">Mã: {item.productID}</p>
                              <p className="text-xs text-gray-500">Đơn giá: {formatCurrency(item.unitPrice)}</p>
                            </div>
                          </div>
                          <span className="text-gray-700 font-semibold">x{item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(orderSummary.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(orderSummary.shippingFee)}</span>
                </div>
                {orderSummary.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-red-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(orderSummary.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-base font-semibold text-gray-900">
                  <span>Tổng tiền</span>
                  <span>{formatCurrency(orderSummary.total)}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={closeDetail}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
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

export default OrderManagement;
