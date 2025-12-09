
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import SortBar from '../components/orderHistory/SortBar';
import OrderList from '../components/orderHistory/OrderList';
import NullOrderList from '../components/orderHistory/NullOrderList';
import { OrderService } from '../services/modules/orders/orderService';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';
import Breadcrumb from '../components/shared/Breadcrumb';
import { NavigationKeys } from '../context/NavigationContext';
import useResolvedNavigationNode from '../hooks/useResolvedNavigationNode';
import useNavigationNode from '../hooks/useNavigationNode';
import { LanguageContext } from '../context/LanguageContext';

const OrderHistory = () => {
  const { t } = useContext(LanguageContext);
  const orderHistoryNode = useMemo(() => ({
    label: t('orderHistory.page.title'),
    href: '/order-history',
  }), [t]);

  const profileNode = useResolvedNavigationNode({
    locationKey: 'fromProfile',
    contextKey: NavigationKeys.LAST_PROFILE_NODE,
  });

  useNavigationNode(NavigationKeys.LAST_PROFILE_ENTRY, orderHistoryNode);

  const breadcrumbs = useMemo(() => {
    const items = [{ label: t('orderHistory.page.breadcrumbHome'), href: '/' }];
    if (profileNode?.label && profileNode?.href) {
      items.push({
        label: profileNode.label,
        href: profileNode.href,
        state: { fromProfileOrigin: orderHistoryNode },
      });
    }
    items.push({ label: orderHistoryNode.label });
    return items;
  }, [t, orderHistoryNode, profileNode]);

  const [rawOrders, setRawOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: 'all',
  });
  const [dateParts, setDateParts] = useState({
    start: { day: '', month: '', year: '' },
    end: { day: '', month: '', year: '' },
  });

  const fetchOrders = useCallback(async (pageIndex = 1) => {
    const statusMap = {
      all: null,
      WaitingForPickup: 'WaitingForPickup',
      Shipping: 'Shipping',
      Completed: 'Completed',
      Cancelled: 'Cancelled',
      Paid: 'Paid',
    };
    
    try {
      setLoading(true);
      const response = await OrderService.getMyOrders(pageIndex, pageSize);
      
      // Filter orders by selected status if needed
      let filteredItems = response.items || [];
      if (selectedStatus !== 'all' && statusMap[selectedStatus]) {
        filteredItems = filteredItems.filter(order => order.status === statusMap[selectedStatus]);
      }

      setRawOrders(filteredItems);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(pageIndex);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(t('orderHistory.list.toast.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, pageSize, t]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const applyFilters = useCallback((items) => {
    if (!Array.isArray(items)) return [];

    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);
    const paymentMethod = filters.paymentMethod || 'all';

    return items.filter((order) => {
      const createdAt = order?.createAt ? new Date(order.createAt) : null;
      if (startDate && createdAt && createdAt < startDate) return false;
      if (endDate && createdAt && createdAt > endDate) return false;

      if (paymentMethod !== 'all' && order.paymentType !== paymentMethod) {
        return false;
      }

      return true;
    });
  }, [filters]);

  useEffect(() => {
    setOrders(applyFilters(rawOrders));
  }, [rawOrders, applyFilters]);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchOrders(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchOrders(currentPage - 1);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const buildDateString = (parts) => {
    const { day, month, year } = parts;
    if (!day || !month || !year) return '';
    const paddedDay = String(day).padStart(2, '0');
    const paddedMonth = String(month).padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  };

  const handleDatePartChange = (target, part, value) => {
    setDateParts((prev) => {
      const updated = {
        ...prev,
        [target]: {
          ...prev[target],
          [part]: value,
        },
      };
      const dateValue = buildDateString(updated[target]);
      setFilters((prevFilters) => ({
        ...prevFilters,
        [`${target}Date`]: dateValue,
      }));
      return updated;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paymentMethod: 'all',
    });
    setDateParts({
      start: { day: '', month: '', year: '' },
      end: { day: '', month: '', year: '' },
    });
  };

  const totalSpent = useMemo(() => (
    orders.reduce((sum, order) => {
      if (order.status !== 'Paid' && order.status !== 'Completed') return sum;
      return sum + (Number(order.totalAmount) || 0);
    }, 0)
  ), [orders]);

  const handleRefreshOrders = useCallback(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <Breadcrumb items={breadcrumbs} />
      <SortBar onStatusChange={handleStatusChange} />
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedStatus === 'all' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-1">
              <p className="text-sm text-gray-500 font-nunito">{t('orderHistory.page.stats.totalSpentTitle')}</p>
              <p className="text-3xl font-alata text-primary">{formatCurrency(totalSpent)}</p>
              <p className="text-xs text-gray-400">{t('orderHistory.page.stats.totalSpentCaption')}</p>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-1">
            <p className="text-sm text-gray-500 font-nunito">{t('orderHistory.page.stats.ordersShownTitle')}</p>
            <p className="text-3xl font-alata text-gray-900">{orders.length}</p>
            <p className="text-xs text-gray-400">{t('orderHistory.page.stats.ordersShownCaption')}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{t('orderHistory.page.filters.title')}</h3>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-sm text-primary hover:underline"
            >
              {t('orderHistory.page.filters.reset')}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">{t('orderHistory.page.filters.startDateLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  value={dateParts.start.day}
                  onChange={(e) => handleDatePartChange('start', 'day', e.target.value)}
                >
                  <option value="">{t('orderHistory.page.filters.selectDay')}</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={`start-day-${day}`} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <select
                  className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  value={dateParts.start.month}
                  onChange={(e) => handleDatePartChange('start', 'month', e.target.value)}
                >
                  <option value="">{t('orderHistory.page.filters.selectMonth')}</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={`start-month-${month}`} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  value={dateParts.start.year}
                  onChange={(e) => handleDatePartChange('start', 'year', e.target.value)}
                >
                  <option value="">{t('orderHistory.page.filters.selectYear')}</option>
                  {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={`start-year-${year}`} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">{t('orderHistory.page.filters.endDateLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  value={dateParts.end.day}
                  onChange={(e) => handleDatePartChange('end', 'day', e.target.value)}
                >
                  <option value="">{t('orderHistory.page.filters.selectDay')}</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={`end-day-${day}`} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <select
                  className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  value={dateParts.end.month}
                  onChange={(e) => handleDatePartChange('end', 'month', e.target.value)}
                >
                  <option value="">{t('orderHistory.page.filters.selectMonth')}</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={`end-month-${month}`} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  value={dateParts.end.year}
                  onChange={(e) => handleDatePartChange('end', 'year', e.target.value)}
                >
                  <option value="">{t('orderHistory.page.filters.selectYear')}</option>
                  {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={`end-year-${year}`} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">{t('orderHistory.page.filters.paymentMethodLabel')}</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.paymentMethod}
                onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              >
                <option value="all">{t('orderHistory.page.filters.paymentMethod.all')}</option>
                <option value="COD">{t('orderHistory.page.filters.paymentMethod.COD')}</option>
                <option value="VNPAY">{t('orderHistory.page.filters.paymentMethod.VNPAY')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">{t('orderHistory.loading')}</p>
        </div>
      ) : orders.length > 0 ? (
        <>
          <OrderList orders={orders} onRefresh={handleRefreshOrders} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-8 px-[144px]">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 border border-gray-300 rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                {t('orderHistory.pagination.prev')}
              </button>
              <span className="text-gray-600 font-nunito">
                {t('orderHistory.pagination.label', { current: currentPage, total: totalPages })}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 border border-gray-300 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                {t('orderHistory.pagination.next')}
              </button>
            </div>
          )}
        </>
      ) : (
        <NullOrderList />
      )}
      <Footer />
    </div>
  );
};

export default OrderHistory;
