import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaBox,
  FaShoppingCart,
  FaDollarSign,
  FaChartLine,
  FaEye,
  FaEdit,
  FaStar,
} from 'react-icons/fa';

const OverviewSection = ({ stats, performanceRows, topProducts, formatCurrency }) => {
  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Tổng sản phẩm</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalProducts}</h3>
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <FaChartLine /> +{stats.productGrowth}% sản phẩm mới
              </p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <FaBox className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Đơn hàng</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalOrders}</h3>
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <FaChartLine /> +{stats.orderGrowth}% so với tháng trước
              </p>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <FaShoppingCart className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Doanh thu</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(stats.totalRevenue)}</h3>
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <FaChartLine /> +{stats.revenueGrowth}% so với tháng trước
              </p>
            </div>
            <div className="bg-orange-100 p-4 rounded-full">
              <FaDollarSign className="text-orange-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Đánh giá shop</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.rating}</h3>
              <p className="text-gray-600 text-sm mt-2">
                {stats.totalReviews} đánh giá
              </p>
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <FaStar className="text-purple-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 font-alata">Hiệu suất sản phẩm</h2>
            <Link to="#" className="text-primary hover:text-red-700 font-nunito text-sm">
              Xem tất cả →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Sản phẩm</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Đã bán</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Doanh thu</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tồn kho</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {performanceRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      Chưa có dữ liệu bán hàng.
                    </td>
                  </tr>
                ) : (
                  performanceRows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-sm text-gray-800">{row.product}</p>
                        <p className="text-xs text-gray-500">#{row.id}</p>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold">{row.sold}</td>
                      <td className="py-3 px-4 text-sm font-semibold">{formatCurrency(row.revenue)}</td>
                      <td className="py-3 px-4 text-sm">{row.stock}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 font-alata">Sản phẩm bán chạy</h2>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có dữ liệu sản phẩm.</p>
            ) : (
              topProducts.map((product, index) => (
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
              ))
            )}
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
