
import React, { useState, useEffect, useCallback } from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import SortBar from '../components/orderHistory/SortBar';
import OrderList from '../components/orderHistory/OrderList';
import NullOrderList from '../components/orderHistory/NullOrderList';
import { OrderService } from '../services/modules/orders/orderService';
import { toast } from 'react-toastify';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const fetchOrders = useCallback(async (pageIndex = 1) => {
    const statusMap = {
      'all': null,
      'Pending': 'Pending',
      'Paid': 'Paid',
      'Cancelled': 'Cancelled',
    };
    
    try {
      setLoading(true);
      const response = await OrderService.getMyOrders(pageIndex, pageSize);
      
      // Filter orders by selected status if needed
      let filteredItems = response.items || [];
      if (selectedStatus !== 'all' && statusMap[selectedStatus]) {
        filteredItems = filteredItems.filter(order => order.status === statusMap[selectedStatus]);
      }
      
      setOrders(filteredItems);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(pageIndex);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, pageSize]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <SortBar onStatusChange={handleStatusChange} />
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : orders.length > 0 ? (
        <>
          <OrderList orders={orders} />
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
                Trước
              </button>
              <span className="text-gray-600 font-nunito">
                Trang {currentPage}/{totalPages}
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
                Sau
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
