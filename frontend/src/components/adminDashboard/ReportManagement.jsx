import React from 'react';
import {
  FaFilter,
  FaFileExport,
  FaEye,
  FaEdit,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChartBar
} from 'react-icons/fa';

const ReportManagement = ({ reports, getReportStatusColor }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý báo cáo & Khiếu nại</h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <FaFilter /> Lọc theo loại
          </button>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            <FaFileExport /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Report Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tổng báo cáo</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{reports.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Chờ xử lý</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {reports.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
          <p className="text-sm text-gray-600">Đang điều tra</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {reports.filter(r => r.status === 'investigating').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Đã giải quyết</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {reports.filter(r => r.status === 'resolved').length}
          </p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Loại</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Người báo cáo</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Đối tượng</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Lý do</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Ngày</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    report.type === 'product' ? 'bg-purple-100 text-purple-800' :
                    report.type === 'seller' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {report.type === 'product' ? 'Sản phẩm' :
                     report.type === 'seller' ? 'Người bán' : 'Đơn hàng'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">{report.reportedBy}</td>
                <td className="py-3 px-4 text-sm font-semibold">{report.target}</td>
                <td className="py-3 px-4 text-sm max-w-xs truncate" title={report.reason}>
                  {report.reason}
                </td>
                <td className="py-3 px-4 text-sm">{report.date}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getReportStatusColor(report.status)}`}>
                    {report.status === 'resolved' ? 'Đã giải quyết' : 
                     report.status === 'investigating' ? 'Đang điều tra' : 'Chờ xử lý'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800" title="Xem chi tiết">
                      <FaEye />
                    </button>
                    <button className="text-orange-600 hover:text-orange-800" title="Xử lý">
                      <FaEdit />
                    </button>
                    {report.status === 'resolved' && (
                      <button className="text-green-600 hover:text-green-800" title="Hoàn thành">
                        <FaCheckCircle />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-yellow-600 text-2xl" />
            <div>
              <p className="font-semibold text-gray-800">Cần chú ý</p>
              <p className="text-sm text-gray-600">2 báo cáo cần xử lý ngay</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FaChartBar className="text-blue-600 text-2xl" />
            <div>
              <p className="font-semibold text-gray-800">Thống kê</p>
              <p className="text-sm text-gray-600">Xem báo cáo chi tiết</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-green-600 text-2xl" />
            <div>
              <p className="font-semibold text-gray-800">Đã giải quyết</p>
              <p className="text-sm text-gray-600">{reports.filter(r => r.status === 'resolved').length} trong tuần này</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportManagement;
