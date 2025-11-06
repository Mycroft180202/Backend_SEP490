
import React, { useState } from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import SortBar from '../components/orderHistory/SortBar';
import OrderList from '../components/orderHistory/OrderList';
import NullOrderList from '../components/orderHistory/NullOrderList';

// Dữ liệu mẫu, sau này thay bằng API
const ORDERS = [
  {
    shopName: "Shop A",
    productName: "Chuồn chuồn tre Thạch Xá",
    productDesc: "15x15cm, 1 chiếc",
    price: "50.000đ",
    shipFee: "30.000đ",
    total: "80.000đ",
    imageUrl: null,
    status: "unpaid",
  },
  {
    shopName: "Shop B",
    productName: "Sản phẩm khác",
    productDesc: "20x20cm, 2 chiếc",
    price: "100.000đ",
    shipFee: "20.000đ",
    total: "120.000đ",
    imageUrl: null,
    status: "shipping",
  },
];

const OrderHistory = () => {
  const [selectedStatus, setSelectedStatus] = useState('unpaid');

  // Lọc đơn hàng theo trạng thái
  const filteredOrders = ORDERS.filter(order => order.status === selectedStatus);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <SortBar onStatusChange={setSelectedStatus} />
      {filteredOrders.length > 0 ? (
        <OrderList orders={filteredOrders} />
      ) : (
        <NullOrderList />
      )}
      <Footer />
    </div>
  );
};

export default OrderHistory;
