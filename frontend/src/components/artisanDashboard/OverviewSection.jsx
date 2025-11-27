import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  FaBox,
  FaShoppingCart,
  FaDollarSign,
  FaChartLine,
  FaEye,
  FaStar,
} from 'react-icons/fa';

const OverviewSection = ({
  stats,
  performanceRows,
  topProducts,
  allProducts = [],
  monthlyRevenue = [],
  formatCurrency,
}) => {
  const [showAllModal, setShowAllModal] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const sortedAllProducts = [...allProducts].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));

  const handleShowDetail = (productId) => {
    const found = allProducts.find((item) => item.id === productId);
    setDetailProduct(found || null);
  };

  const monthlyChartData = Array.isArray(monthlyRevenue)
    ? monthlyRevenue.map((item) => ({
      name: `T${item.month}`,
      revenue: Number(item.revenue || item.totalRevenue || 0),
      orders: Number(item.totalOrderAmount || 0),
    }))
    : [];

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
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <FaStar className="text-purple-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Biểu đồ doanh thu theo tháng</h2>
            <p className="text-sm text-gray-600 mt-1">Theo dõi hiệu suất 12 tháng</p>
          </div>
        </div>
        <div className="h-72">
          {monthlyChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Chưa có dữ liệu doanh thu.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis
                  stroke="#6b7280"
                  tickFormatter={(value) => (value >= 1000000 ? `${value / 1000000}tr` : value)}
                />
                <Tooltip
                  formatter={(value, name) => [formatCurrency(value), name === 'revenue' ? 'Doanh thu' : 'Giá trị đơn']}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} name="Doanh thu" />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Tổng đơn" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Performance tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 font-alata">Hiệu suất sản phẩm</h2>
            <span className="text-sm text-gray-500">{allProducts.length} sản phẩm</span>
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
                        <button
                          type="button"
                          onClick={() => handleShowDetail(row.id)}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm font-semibold"
                          title="Xem chi tiết"
                        >
                          <FaEye /> Chi tiết
                        </button>
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
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            disabled={!sortedAllProducts.length}
            className="w-full mt-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
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

      {showAllModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#8B4513]">Tất cả sản phẩm bán chạy</h3>
                <p className="text-sm text-gray-500">Tổng {sortedAllProducts.length} sản phẩm</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto text-sm text-gray-700">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide">
                    <th className="text-left py-2 px-3">Sản phẩm</th>
                    <th className="text-left py-2 px-3">Giá</th>
                    <th className="text-left py-2 px-3">Tồn kho</th>
                    <th className="text-left py-2 px-3">Đã bán</th>
                    <th className="text-left py-2 px-3">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAllProducts.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">#{item.id}</p>
                      </td>
                      <td className="py-2 px-3">{formatCurrency(item.price)}</td>
                      <td className="py-2 px-3">{item.stock}</td>
                      <td className="py-2 px-3 font-semibold">{item.sold}</td>
                      <td className="py-2 px-3 text-primary font-semibold">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {detailProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#8B4513]">Chi tiết sản phẩm</h3>
                <p className="text-sm text-gray-500">{detailProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
              <div>
                <p className="text-xs uppercase text-gray-500">Mã sản phẩm</p>
                <p className="font-semibold">{detailProduct.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Mô tả</p>
                <p>{detailProduct.shortDescription || 'Chưa cập nhật mô tả'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-500">Giá</p>
                  <p className="font-semibold">{formatCurrency(detailProduct.price)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Tồn kho</p>
                  <p className="font-semibold">{detailProduct.stock}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Đã bán</p>
                  <p className="font-semibold">{detailProduct.sold}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Doanh thu</p>
                  <p className="font-semibold text-primary">{formatCurrency(detailProduct.revenue)}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OverviewSection;
