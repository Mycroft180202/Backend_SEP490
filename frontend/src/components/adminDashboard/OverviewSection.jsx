import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaDollarSign,
  FaChartLine,
  FaUsersCog,
  FaEye,
  FaEdit
} from 'react-icons/fa';

const OverviewSection = ({ stats, recentOrders, topProducts, formatCurrency, getStatusColor }) => {
  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Tổng đơn hàng</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalOrders}</h3>
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <FaChartLine /> +{stats.orderGrowth}% so với tháng trước
              </p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <FaShoppingCart className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Doanh thu</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(stats.totalRevenue)}</h3>
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <FaChartLine /> +{stats.revenueGrowth}% so với tháng trước
              </p>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <FaDollarSign className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Total Sellers */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Người bán</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalSellers}</h3>
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <FaChartLine /> +5 người bán mới
              </p>
            </div>
            <div className="bg-orange-100 p-4 rounded-full">
              <FaUsers className="text-orange-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Khách hàng</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalCustomers}</h3>
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <FaChartLine /> +{stats.customerGrowth}% so với tháng trước
              </p>
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <FaUsersCog className="text-purple-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 font-alata">Đơn hàng gần đây</h2>
            <Link to="/admin/orders" className="text-primary hover:text-red-700 font-nunito text-sm">
              Xem tất cả →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Mã đơn</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Khách hàng</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Sản phẩm</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Giá trị</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-sm">{order.id}</td>
                    <td className="py-3 px-4 text-sm">{order.customer}</td>
                    <td className="py-3 px-4 text-sm">{order.product}</td>
                    <td className="py-3 px-4 text-sm font-semibold">{formatCurrency(order.amount)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800" title="Xem chi tiết">
                          <FaEye />
                        </button>
                        <button className="text-green-600 hover:text-green-800" title="Chỉnh sửa">
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 font-alata">Sản phẩm bán chạy</h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Đã bán: {product.sales} | Tồn kho: {product.stock}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-semibold">
            Xem tất cả sản phẩm
          </button>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="mt-6 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 font-alata">Biểu đồ doanh thu</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <FaChartLine className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-nunito">Biểu đồ doanh thu theo tháng</p>
            <p className="text-sm text-gray-500 mt-2">(Tích hợp thư viện chart để hiển thị)</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewSection;
