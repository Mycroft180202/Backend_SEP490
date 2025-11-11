import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';

const AddressSelector = ({ onAddressSelect }) => {
  const [showModal, setShowModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      name: 'Nguyễn Văn A',
      phone: '0123456789',
      fullAddress: 'Số 123, Đường ABC, Phường Hòa Lạc, Huyện Thạch Thất, Hà Nội',
      province: 'Hà Nội',
      district: 'Thạch Thất',
      ward: 'Hòa Lạc',
      detailAddress: 'Số 123, Đường ABC',
      isDefault: true
    },
    {
      id: 2,
      name: 'Nguyễn Văn B',
      phone: '0987654321',
      fullAddress: 'Số 456, Đường XYZ, Phường Cầu Giấy, Quận Cầu Giấy, Hà Nội',
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      ward: 'Cầu Giấy',
      detailAddress: 'Số 456, Đường XYZ',
      isDefault: false
    }
  ]);
  const [selectedAddress, setSelectedAddress] = useState(
    addresses.find(addr => addr.isDefault) || addresses[0]
  );
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    detailAddress: '',
    isDefault: false
  });

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    if (onAddressSelect) {
      onAddressSelect(address);
    }
  };

  const handleSetDefault = (addressId) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));
    setAddresses(updatedAddresses);
    const defaultAddr = updatedAddresses.find(addr => addr.id === addressId);
    setSelectedAddress(defaultAddr);
    if (onAddressSelect) {
      onAddressSelect(defaultAddr);
    }
  };

  const handleDeleteAddress = (addressId) => {
    if (addresses.length === 1) {
      alert('Không thể xóa địa chỉ cuối cùng');
      return;
    }
    const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
    setAddresses(updatedAddresses);
    if (selectedAddress.id === addressId) {
      const newDefault = updatedAddresses.find(addr => addr.isDefault) || updatedAddresses[0];
      setSelectedAddress(newDefault);
      if (onAddressSelect) {
        onAddressSelect(newDefault);
      }
    }
  };

  const handleAddAddress = () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.province || 
        !newAddress.district || !newAddress.ward || !newAddress.detailAddress) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const fullAddress = `${newAddress.detailAddress}, Phường ${newAddress.ward}, Huyện ${newAddress.district}, ${newAddress.province}`;
    const addressToAdd = {
      id: Date.now(),
      ...newAddress,
      fullAddress,
      isDefault: addresses.length === 0 ? true : newAddress.isDefault
    };

    const updatedAddresses = newAddress.isDefault
      ? addresses.map(addr => ({ ...addr, isDefault: false })).concat(addressToAdd)
      : [...addresses, addressToAdd];

    setAddresses(updatedAddresses);
    setSelectedAddress(addressToAdd);
    if (onAddressSelect) {
      onAddressSelect(addressToAdd);
    }
    setNewAddress({
      name: '',
      phone: '',
      province: '',
      district: '',
      ward: '',
      detailAddress: '',
      isDefault: false
    });
    setShowAddForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-alata text-2xl text-black">
          Địa chỉ giao hàng
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-primary border border-primary rounded-lg font-nunito text-base hover:bg-primary hover:text-white transition-colors"
        >
          Thay đổi
        </button>
      </div>

      {/* Selected Address Display */}
      <div className="border-2 border-primary rounded-lg p-4 bg-[#FFF5F5]">
        <div className="flex items-start gap-3">
          <FaMapMarkerAlt className="text-primary text-xl mt-1 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-nunito text-lg font-semibold text-black">
                {selectedAddress.name}
              </span>
              <span className="font-nunito text-base text-text-gray">
                | {selectedAddress.phone}
              </span>
              {selectedAddress.isDefault && (
                <span className="px-2 py-1 bg-primary text-white text-xs rounded font-nunito">
                  Mặc định
                </span>
              )}
            </div>
            <p className="font-nunito text-base text-black">
              {selectedAddress.fullAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Address Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-alata text-2xl text-black">
                Chọn địa chỉ giao hàng
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowAddForm(false);
                }}
                className="text-gray-500 hover:text-black text-2xl"
              >
                ×
              </button>
            </div>

            {/* Add New Address Form */}
            {showAddForm ? (
              <div className="border-2 border-primary rounded-lg p-4 mb-4">
                <h4 className="font-nunito text-lg font-semibold text-black mb-4">
                  Thêm địa chỉ mới
                </h4>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="name"
                      value={newAddress.name}
                      onChange={handleInputChange}
                      placeholder="Họ và tên *"
                      className="px-4 py-2 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={newAddress.phone}
                      onChange={handleInputChange}
                      placeholder="Số điện thoại *"
                      className="px-4 py-2 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <select
                      name="province"
                      value={newAddress.province}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Tỉnh/Thành phố *</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                    </select>
                    <select
                      name="district"
                      value={newAddress.district}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Quận/Huyện *</option>
                      <option value="Thạch Thất">Thạch Thất</option>
                      <option value="Cầu Giấy">Cầu Giấy</option>
                    </select>
                    <select
                      name="ward"
                      value={newAddress.ward}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Phường/Xã *</option>
                      <option value="Hòa Lạc">Hòa Lạc</option>
                      <option value="Thạch Xá">Thạch Xá</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    name="detailAddress"
                    value={newAddress.detailAddress}
                    onChange={handleInputChange}
                    placeholder="Địa chỉ cụ thể (Số nhà, tên đường) *"
                    className="px-4 py-2 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={newAddress.isDefault}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <span className="font-nunito text-base text-black">
                      Đặt làm địa chỉ mặc định
                    </span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddAddress}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-nunito text-base hover:bg-[#7a1a18] transition-colors"
                    >
                      Lưu địa chỉ
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-black rounded-lg font-nunito text-base hover:bg-gray-100 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 border-2 border-dashed border-primary rounded-lg font-nunito text-base text-primary hover:bg-[#FFF5F5] transition-colors mb-4 flex items-center justify-center gap-2"
              >
                <FaPlus /> Thêm địa chỉ mới
              </button>
            )}

            {/* Address List */}
            <div className="flex flex-col gap-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedAddress.id === address.id
                      ? 'border-primary bg-[#FFF5F5]'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleSelectAddress(address)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center justify-center w-5 h-5 mt-1">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedAddress.id === address.id
                              ? 'border-primary'
                              : 'border-gray-400'
                          }`}
                        >
                          {selectedAddress.id === address.id && (
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-nunito text-base font-semibold text-black">
                            {address.name}
                          </span>
                          <span className="font-nunito text-sm text-text-gray">
                            | {address.phone}
                          </span>
                          {address.isDefault && (
                            <span className="px-2 py-1 bg-primary text-white text-xs rounded font-nunito">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="font-nunito text-sm text-black">
                          {address.fullAddress}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          {!address.isDefault && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefault(address.id);
                              }}
                              className="text-primary hover:underline font-nunito text-sm flex items-center gap-1"
                            >
                              <FaCheck className="text-xs" /> Đặt làm mặc định
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Edit functionality can be added here
                            }}
                            className="text-text-gray hover:text-black font-nunito text-sm flex items-center gap-1"
                          >
                            <FaEdit className="text-xs" /> Sửa
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(address.id);
                            }}
                            className="text-text-gray hover:text-primary font-nunito text-sm flex items-center gap-1"
                          >
                            <FaTrash className="text-xs" /> Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowAddForm(false);
                }}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-nunito text-base hover:bg-[#7a1a18] transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSelector;
