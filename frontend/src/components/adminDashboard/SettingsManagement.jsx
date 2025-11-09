import React, { useState } from 'react';
import { FaSave, FaCog, FaBell, FaShieldAlt, FaEnvelope, FaPalette } from 'react-icons/fa';

const SettingsManagement = () => {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Hoa Lạc Handicraft',
    siteDescription: 'Nền tảng thương mại điện tử sản phẩm thủ công mỹ nghệ',
    contactEmail: 'contact@hoalachandicraft.vn',
    contactPhone: '024 1234 5678',
    address: 'Làng nghề Hoa Lạc, Thạch Thất, Hà Nội',
    
    // Email Settings
    emailFrom: 'noreply@hoalachandicraft.vn',
    emailHost: 'smtp.gmail.com',
    emailPort: '587',
    emailNotifications: true,
    
    // Notification Settings
    orderNotifications: true,
    newProductNotifications: true,
    reportNotifications: true,
    weeklyReport: true,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    maxLoginAttempts: '5',
    
    // Payment Settings
    paymentMethods: ['COD', 'Bank Transfer', 'VNPay', 'Momo'],
    defaultCurrency: 'VND',
    taxRate: '10',
    shippingFee: '30000',
    
    // Display Settings
    productsPerPage: '12',
    ordersPerPage: '10',
    theme: 'light',
    language: 'vi',
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    alert('Cài đặt đã được lưu thành công!');
  };

  const tabs = [
    { id: 'general', label: 'Cài đặt chung', icon: <FaCog /> },
    { id: 'email', label: 'Email', icon: <FaEnvelope /> },
    { id: 'notifications', label: 'Thông báo', icon: <FaBell /> },
    { id: 'security', label: 'Bảo mật', icon: <FaShieldAlt /> },
    { id: 'payment', label: 'Thanh toán', icon: <FaPalette /> },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Cài đặt hệ thống</h2>
            <p className="text-sm text-gray-600 mt-1">Quản lý các cài đặt và cấu hình</p>
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaSave /> Lưu thay đổi
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tên website</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleInputChange('siteName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email liên hệ</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngôn ngữ</label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả website</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email gửi đi</label>
                  <input
                    type="email"
                    value={settings.emailFrom}
                    onChange={(e) => handleInputChange('emailFrom', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.emailHost}
                    onChange={(e) => handleInputChange('emailHost', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="text"
                    value={settings.emailPort}
                    onChange={(e) => handleInputChange('emailPort', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={() => handleToggle('emailNotifications')}
                      className="mr-2"
                    />
                    <span className="text-sm font-semibold text-gray-700">Bật thông báo email</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-gray-700">Thông báo đơn hàng mới</span>
                  <input
                    type="checkbox"
                    checked={settings.orderNotifications}
                    onChange={() => handleToggle('orderNotifications')}
                    className="toggle"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-gray-700">Thông báo sản phẩm mới</span>
                  <input
                    type="checkbox"
                    checked={settings.newProductNotifications}
                    onChange={() => handleToggle('newProductNotifications')}
                    className="toggle"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-gray-700">Thông báo báo cáo/khiếu nại</span>
                  <input
                    type="checkbox"
                    checked={settings.reportNotifications}
                    onChange={() => handleToggle('reportNotifications')}
                    className="toggle"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-gray-700">Báo cáo tuần</span>
                  <input
                    type="checkbox"
                    checked={settings.weeklyReport}
                    onChange={() => handleToggle('weeklyReport')}
                    className="toggle"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Thời gian timeout (phút)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hết hạn mật khẩu (ngày)</label>
                  <input
                    type="number"
                    value={settings.passwordExpiry}
                    onChange={(e) => handleInputChange('passwordExpiry', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số lần đăng nhập tối đa</label>
                  <input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleInputChange('maxLoginAttempts', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={() => handleToggle('twoFactorAuth')}
                      className="mr-2"
                    />
                    <span className="text-sm font-semibold text-gray-700">Xác thực 2 yếu tố</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Đơn vị tiền tệ</label>
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="VND">VND - Đồng Việt Nam</option>
                    <option value="USD">USD - Đô la Mỹ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Thuế (%)</label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => handleInputChange('taxRate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phí vận chuyển mặc định (VND)</label>
                <input
                  type="number"
                  value={settings.shippingFee}
                  onChange={(e) => handleInputChange('shippingFee', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phương thức thanh toán</label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {['COD', 'Bank Transfer', 'VNPay', 'Momo'].map(method => (
                    <label key={method} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.paymentMethods.includes(method)}
                        className="mr-2"
                        readOnly
                      />
                      <span className="text-sm text-gray-700">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;
