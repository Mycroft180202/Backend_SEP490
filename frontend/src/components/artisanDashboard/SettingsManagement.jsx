import React, { useState } from 'react';
import { FaSave, FaStore, FaUser, FaBell, FaLock, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

const SettingsManagement = () => {
  const [shopInfo, setShopInfo] = useState({
    shopName: 'Gốm Bát Tràng Truyền Thống',
    shopDescription: 'Chuyên cung cấp các sản phẩm gốm sứ thủ công chất lượng cao từ làng nghề Bát Tràng.',
    address: 'Làng Bát Tràng, Gia Lâm, Hà Nội',
    phone: '0912345678',
    email: 'contact@gomtrangtrang.vn',
    taxCode: '0123456789',
    bankName: 'Vietcombank',
    bankAccount: '1234567890',
    bankAccountName: 'Nguyễn Văn A',
  });

  const [personalInfo, setPersonalInfo] = useState({
    fullName: 'Nguyễn Văn A',
    email: 'seller@gomtrangtrang.vn',
    phone: '0912345678',
    address: 'Hà Nội, Việt Nam',
  });

  const [notifications, setNotifications] = useState({
    orderNotif: true,
    reviewNotif: true,
    promotionNotif: false,
    emailNotif: true,
    smsNotif: false,
  });

  const [activeTab, setActiveTab] = useState('shop');

  const handleShopInfoChange = (e) => {
    setShopInfo({ ...shopInfo, [e.target.name]: e.target.value });
  };

  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const handleNotificationChange = (e) => {
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  };

  const handleSaveShopInfo = () => {
    alert('Đã lưu thông tin cửa hàng!');
  };

  const handleSavePersonalInfo = () => {
    alert('Đã lưu thông tin cá nhân!');
  };

  const handleSaveNotifications = () => {
    alert('Đã lưu cài đặt thông báo!');
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'shop'
                ? 'bg-primary text-white border-b-2 border-primary'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FaStore /> Thông tin cửa hàng
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'personal'
                ? 'bg-primary text-white border-b-2 border-primary'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FaUser /> Thông tin cá nhân
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'notifications'
                ? 'bg-primary text-white border-b-2 border-primary'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FaBell /> Thông báo
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'security'
                ? 'bg-primary text-white border-b-2 border-primary'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FaLock /> Bảo mật
          </button>
        </div>

        {/* Shop Info Tab */}
        {activeTab === 'shop' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 font-alata">Thông tin cửa hàng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên cửa hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="shopName"
                  value={shopInfo.shopName}
                  onChange={handleShopInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaPhone className="inline mr-2" />Số điện thoại
                </label>
                <input
                  type="text"
                  name="phone"
                  value={shopInfo.phone}
                  onChange={handleShopInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả cửa hàng</label>
                <textarea
                  name="shopDescription"
                  value={shopInfo.shopDescription}
                  onChange={handleShopInfoChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline mr-2" />Địa chỉ
                </label>
                <input
                  type="text"
                  name="address"
                  value={shopInfo.address}
                  onChange={handleShopInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaEnvelope className="inline mr-2" />Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={shopInfo.email}
                  onChange={handleShopInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mã số thuế</label>
                <input
                  type="text"
                  name="taxCode"
                  value={shopInfo.taxCode}
                  onChange={handleShopInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ngân hàng</label>
                <input
                  type="text"
                  name="bankName"
                  value={shopInfo.bankName}
                  onChange={handleShopInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số tài khoản</label>
                <input
                  type="text"
                  name="bankAccount"
                  value={shopInfo.bankAccount}
                  onChange={handleShopInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên chủ tài khoản</label>
                <input
                  type="text"
                  name="bankAccountName"
                  value={shopInfo.bankAccountName}
                  onChange={handleShopInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveShopInfo}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaSave /> Lưu thay đổi
              </button>
            </div>
          </div>
        )}

        {/* Personal Info Tab */}
        {activeTab === 'personal' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 font-alata">Thông tin cá nhân</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
                <input
                  type="text"
                  name="fullName"
                  value={personalInfo.fullName}
                  onChange={handlePersonalInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={personalInfo.email}
                  onChange={handlePersonalInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={personalInfo.phone}
                  onChange={handlePersonalInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={personalInfo.address}
                  onChange={handlePersonalInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSavePersonalInfo}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaSave /> Lưu thay đổi
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 font-alata">Cài đặt thông báo</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">Thông báo đơn hàng mới</p>
                  <p className="text-sm text-gray-600">Nhận thông báo khi có đơn hàng mới</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="orderNotif"
                    checked={notifications.orderNotif}
                    onChange={handleNotificationChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">Thông báo đánh giá</p>
                  <p className="text-sm text-gray-600">Nhận thông báo khi có đánh giá mới</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="reviewNotif"
                    checked={notifications.reviewNotif}
                    onChange={handleNotificationChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">Thông báo khuyến mãi</p>
                  <p className="text-sm text-gray-600">Nhận thông báo về các chương trình khuyến mãi</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="promotionNotif"
                    checked={notifications.promotionNotif}
                    onChange={handleNotificationChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">Thông báo qua Email</p>
                  <p className="text-sm text-gray-600">Nhận thông báo qua email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailNotif"
                    checked={notifications.emailNotif}
                    onChange={handleNotificationChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">Thông báo qua SMS</p>
                  <p className="text-sm text-gray-600">Nhận thông báo qua tin nhắn SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="smsNotif"
                    checked={notifications.smsNotif}
                    onChange={handleNotificationChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveNotifications}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaSave /> Lưu thay đổi
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 font-alata">Bảo mật</h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Đổi mật khẩu</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu mới"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    Đổi mật khẩu
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Xác thực hai yếu tố</h3>
                <p className="text-sm text-gray-600 mb-4">Tăng cường bảo mật tài khoản với xác thực hai yếu tố</p>
                <button className="border-2 border-primary text-primary px-6 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors">
                  Kích hoạt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsManagement;
