import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { FaEye, FaSearch, FaFileExport, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { OrderService } from '../../services/modules/orders/orderService';
import { UserService } from '../../services/modules/users/userService';
import { AddressService } from '../../services/modules/orders/addressService';
import { ProductService } from '../../services/modules/products/productService';

const statusLabels = {
  Pending: 'Chờ xử lý',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
};

const paymentLabels = {
  COD: 'COD',
  VNPAY: 'VNPAY',
};

const defaultStats = {
  total: 0,
  pending: 0,
  paid: 0,
  cancelled: 0,
  cod: 0,
  vnpay: 0,
};

const STATS_PAGE_SIZE = 50;

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [customerDetails, setCustomerDetails] = useState({});
  const [addressDetails, setAddressDetails] = useState({});
  const [productCache, setProductCache] = useState({});

  const getStatusColor = (status) => {
    switch (status) {
      case 'Hoàn thành':
        return 'bg-green-100 text-green-800';
      case 'Đang giao':
        return 'bg-blue-100 text-blue-800';
      case 'Đang xử lý':
        return 'bg-yellow-100 text-yellow-800';
      case 'Đã hủy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (payment) => {
    switch (payment) {
      case 'Đã thanh toán':
        return 'bg-green-100 text-green-800';
      case 'Chưa thanh toán':
        return 'bg-orange-100 text-orange-800';
      case 'Hoàn tiền':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    if (!Number.isFinite(amount)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await OrderService.getAdminOrders({
        pageIndex,
        pageSize,
        paymentType: paymentFilter !== 'all' ? paymentFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        keyword: searchTerm?.trim() ? searchTerm.trim() : undefined,
      });
      setOrders(response?.items || []);
      setTotalCount(response?.totalCount || 0);
      setTotalPages(response?.totalPages || 1);
    } catch (error) {
      console.error('Fetch orders error:', error);
      const message =
        error?.response?.data?.message
        || error?.message
        || 'Không thể tải danh sách đơn hàng';
      toast.error(message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, paymentFilter, statusFilter, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (value) => {
    if (!value) return '--';
    try {
      return new Date(value).toLocaleString('vi-VN');
    } catch (error) {
      return value;
    }
  };

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
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const normalizedPayment = paymentFilter === 'all' ? null : paymentFilter.trim().toUpperCase();

    return orders.filter((order) => {
      const customerName = getCustomerName(order.customerId).toLowerCase();
      const matchSearch = !normalizedQuery
        || order.orderNumber?.toLowerCase().includes(normalizedQuery)
        || order.customerId?.toLowerCase().includes(normalizedQuery)
        || customerName.includes(normalizedQuery);

      const matchStatus =
        statusFilter === 'all'
        || String(order.status).toLowerCase() === statusFilter.toLowerCase();

      const paymentValue = (order.paymentType || '').trim().toUpperCase();
      const matchPayment = !normalizedPayment || paymentValue === normalizedPayment;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, getCustomerName]);

  const calculateStats = useCallback((orderList, total) => {
    return orderList.reduce(
      (acc, order) => {
        const statusKey = (order.status || 'Unknown').toUpperCase();
        acc.pending += statusKey === 'PENDING' ? 1 : 0;
        acc.paid += statusKey === 'PAID' ? 1 : 0;
        acc.cancelled += statusKey === 'CANCELLED' ? 1 : 0;

        const paymentKey = (order.paymentType || '').toUpperCase();
        if (paymentKey === 'COD') acc.cod += 1;
        if (paymentKey === 'VNPAY') acc.vnpay += 1;

        return acc;
      },
      { total, pending: 0, paid: 0, cancelled: 0, cod: 0, vnpay: 0 },
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
  }, [fetchOverallStats]);

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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Chờ xử lý</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Đã thanh toán</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.paid}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Đã hủy</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.cancelled}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Thanh toán COD</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.cod}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Thanh toán VNPAY</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.vnpay}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý đơn hàng</h2>
            <p className="text-sm text-gray-600 mt-1">Quản lý và theo dõi tất cả đơn hàng</p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
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
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageIndex(1);
              }}
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
            <option value="Pending">Chờ xử lý</option>
            <option value="Paid">Đã thanh toán</option>
            <option value="Cancelled">Đã hủy</option>
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
                        {statusLabels[order.status] || order.status}
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
                    {statusLabels[selectedOrder.status] || selectedOrder.status}
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
              <div className="flex items-center justify-between text-base font-semibold text-gray-900 pt-2">
                <span>Tổng tiền</span>
                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
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
