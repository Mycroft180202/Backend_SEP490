import React, { useState } from 'react';

const ShippingInfo = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    province: '',
    district: '',
    ward: '',
    address: '',
    note: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-alata text-2xl text-black mb-6">
        Thông tin giao hàng
      </h2>

      <div className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-2">
          <label className="font-nunito text-lg text-black">
            Họ và tên <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Nhập họ và tên"
            className="px-4 py-3 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-nunito text-lg text-black">
              Số điện thoại <span className="text-primary">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Nhập số điện thoại"
              className="px-4 py-3 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-nunito text-lg text-black">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email"
              className="px-4 py-3 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Province, District, Ward */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-nunito text-lg text-black">
              Tỉnh/Thành phố <span className="text-primary">*</span>
            </label>
            <select
              name="province"
              value={formData.province}
              onChange={handleChange}
              className="px-4 py-3 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Chọn Tỉnh/Thành phố</option>
              <option value="hanoi">Hà Nội</option>
              <option value="hcm">Hồ Chí Minh</option>
              <option value="danang">Đà Nẵng</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-nunito text-lg text-black">
              Quận/Huyện <span className="text-primary">*</span>
            </label>
            <select
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="px-4 py-3 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Chọn Quận/Huyện</option>
              <option value="thachthat">Thạch Thất</option>
              <option value="caugiay">Cầu Giấy</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-nunito text-lg text-black">
              Phường/Xã <span className="text-primary">*</span>
            </label>
            <select
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              className="px-4 py-3 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Chọn Phường/Xã</option>
              <option value="hoalac">Hòa Lạc</option>
              <option value="thachxa">Thạch Xá</option>
            </select>
          </div>
        </div>

        {/* Address */}
        <div className="flex flex-col gap-2">
          <label className="font-nunito text-lg text-black">
            Địa chỉ cụ thể <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Số nhà, tên đường..."
            className="px-4 py-3 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Note */}
        <div className="flex flex-col gap-2">
          <label className="font-nunito text-lg text-black">
            Ghi chú (tùy chọn)
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn"
            rows="3"
            className="px-4 py-3 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ShippingInfo;
