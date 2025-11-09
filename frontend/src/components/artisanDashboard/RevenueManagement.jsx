import React, { useState } from 'react';
import { FaFileExport, FaChartLine, FaDollarSign, FaWallet, FaCreditCard } from 'react-icons/fa';

const RevenueManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [transactions, setTransactions] = useState([
    { id: 'TXN-001', orderId: 'ORD-001', date: '2025-11-08', amount: 900000, fee: 27000, net: 873000, status: 'Đã thanh toán', method: 'Chuyển khoản' },
    { id: 'TXN-002', orderId: 'ORD-002', date: '2025-11-08', amount: 320000, fee: 9600, net: 310400, status: 'Đã thanh toán', method: 'Ví điện tử' },
    { id: 'TXN-003', orderId: 'ORD-004', date: '2025-11-07', amount: 840000, fee: 25200, net: 814800, status: 'Đã thanh toán', method: 'Chuyển khoản' },
    { id: 'TXN-004', orderId: 'ORD-005', date: '2025-11-06', amount: 760000, fee: 22800, net: 737200, status: 'Đã thanh toán', method: 'Thẻ tín dụng' },
    { id: 'TXN-005', orderId: 'ORD-006', date: '2025-11-06', amount: 1200000, fee: 36000, net: 1164000, status: 'Đang xử lý', method: 'Chuyển khoản' },
    { id: 'TXN-006', orderId: 'ORD-007', date: '2025-11-05', amount: 650000, fee: 19500, net: 630500, status: 'Đã thanh toán', method: 'Ví điện tử' },
    { id: 'TXN-007', orderId: 'ORD-010', date: '2025-11-04', amount: 560000, fee: 16800, net: 543200, status: 'Đã thanh toán', method: 'Chuyển khoản' },
    { id: 'TXN-008', orderId: 'ORD-011', date: '2025-11-03', amount: 1000000, fee: 30000, net: 970000, status: 'Đã thanh toán', method: 'Chuyển khoản' },
    { id: 'TXN-009', orderId: 'ORD-012', date: '2025-11-03', amount: 900000, fee: 27000, net: 873000, status: 'Đã thanh toán', method: 'Ví điện tử' },
    { id: 'TXN-010', orderId: 'ORD-013', date: '2025-11-02', amount: 450000, fee: 13500, net: 436500, status: 'Đã thanh toán', method: 'Thẻ tín dụng' },
    { id: 'TXN-011', orderId: 'ORD-014', date: '2025-11-02', amount: 680000, fee: 20400, net: 659600, status: 'Đã thanh toán', method: 'Chuyển khoản' },
    { id: 'TXN-012', orderId: 'ORD-015', date: '2025-11-01', amount: 1500000, fee: 45000, net: 1455000, status: 'Đã thanh toán', method: 'Chuyển khoản' },
  ]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã thanh toán':
        return 'bg-green-100 text-green-800';
      case 'Đang xử lý':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hoàn tiền':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalFees = transactions.reduce((sum, t) => sum + t.fee, 0);
  const netRevenue = transactions.reduce((sum, t) => sum + t.net, 0);
  const completedTransactions = transactions.filter(t => t.status === 'Đã thanh toán').length;

  // Pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Tổng doanh thu</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(totalRevenue)}</h3>
              <p className="text-xs text-gray-500 mt-1">Tháng này</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <FaDollarSign className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Doanh thu thuần</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(netRevenue)}</h3>
              <p className="text-xs text-gray-500 mt-1">Sau phí</p>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <FaWallet className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Phí giao dịch</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(totalFees)}</h3>
              <p className="text-xs text-gray-500 mt-1">3% mỗi đơn</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-full">
              <FaCreditCard className="text-orange-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Giao dịch</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{completedTransactions}</h3>
              <p className="text-xs text-gray-500 mt-1">Hoàn thành</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <FaChartLine className="text-purple-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 font-alata">Biểu đồ doanh thu theo ngày</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <FaChartLine className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-nunito">Biểu đồ doanh thu theo ngày trong tháng</p>
            <p className="text-sm text-gray-500 mt-2">(Tích hợp thư viện chart để hiển thị)</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Lịch sử giao dịch</h2>
            <p className="text-sm text-gray-600 mt-1">Chi tiết các giao dịch và thanh toán</p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            <FaFileExport /> Xuất báo cáo
          </button>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Mã GD</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Mã đơn</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Ngày</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tổng tiền</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Phí (3%)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thực nhận</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Phương thức</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-sm text-primary">{transaction.id}</td>
                  <td className="py-3 px-4 text-sm">{transaction.orderId}</td>
                  <td className="py-3 px-4 text-sm">{transaction.date}</td>
                  <td className="py-3 px-4 text-sm font-semibold">{formatCurrency(transaction.amount)}</td>
                  <td className="py-3 px-4 text-sm text-red-600">-{formatCurrency(transaction.fee)}</td>
                  <td className="py-3 px-4 text-sm font-bold text-green-600">{formatCurrency(transaction.net)}</td>
                  <td className="py-3 px-4 text-sm">{transaction.method}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, transactions.length)} trên tổng {transactions.length} giao dịch
          </p>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 border border-gray-300 rounded-lg ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              Trước
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === index + 1
                    ? 'bg-primary text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 border border-gray-300 rounded-lg ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueManagement;
