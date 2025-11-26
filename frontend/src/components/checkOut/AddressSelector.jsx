import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { FaMapMarkerAlt, FaPlus, FaChevronDown } from 'react-icons/fa';

const getAddressId = (address, fallback) => (
  address?.id
  ?? address?.addressId
  ?? address?.shippingAddressId
  ?? address?.code
  ?? `addr-${fallback}`
);

const AddressSelector = ({
  addresses = [],
  selectedAddressId = null,
  onAddressSelect = () => {},
  onManageClick = () => {},
  isLoading = false,
  allowManage = true,
}) => {
  const normalizedAddresses = useMemo(
    () => addresses.map((address, index) => ({
      ...address,
      __internalId: getAddressId(address, index),
    })),
    [addresses],
  );

  const [internalSelectedId, setInternalSelectedId] = useState(() => {
    if (selectedAddressId) return selectedAddressId;
    const fallbackAddress = normalizedAddresses.find((addr) => addr.isDefault)
      || normalizedAddresses[0];
    return fallbackAddress?.__internalId ?? null;
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (selectedAddressId) {
      setInternalSelectedId(selectedAddressId);
      return;
    }
    if (normalizedAddresses.length === 0) {
      setInternalSelectedId(null);
      return;
    }
    const defaultAddress = normalizedAddresses.find((addr) => addr.isDefault)
      || normalizedAddresses.find((addr) => addr.__internalId === internalSelectedId)
      || normalizedAddresses[0];
    setInternalSelectedId(defaultAddress?.__internalId ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId, normalizedAddresses]);

  useEffect(() => {
    if (!internalSelectedId) return;
    const selected = normalizedAddresses.find(
      (addr) => addr.__internalId === internalSelectedId,
    );
    if (selected) {
      onAddressSelect(selected);
    }
  }, [internalSelectedId, normalizedAddresses, onAddressSelect]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!normalizedAddresses.length) {
      setDropdownOpen(false);
    }
  }, [normalizedAddresses.length]);

  const renderSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, idx) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={`address-skeleton-${idx}`}
          className="border border-dashed border-gray-300 rounded-xl p-4 animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
      <p className="font-nunito text-base text-gray-600 mb-4">
        Chua co dia chi giao hang duoc luu.
      </p>
      {allowManage && (
        <button
          type="button"
          onClick={onManageClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-[#7a1a18] transition-colors"
        >
          <FaPlus />
          Quan ly dia chi
        </button>
      )}
    </div>
  );

  const buildAddressDisplay = (address) => {
    if (!address) return null;
    const receiverName = address.contactName
      || address.name
      || address.receiverName
      || 'Nguoi nhan';
    const phoneDisplay = address.contactPhone
      || address.phone
      || address.phoneNumber
      || 'Chua co so dien thoai';
    const detailAddress = address.detailAddress
      || address.address
      || address.line1
      || '';
    const ward = address.ward || '';
    const district = address.district || '';
    const province = address.province || '';
    const fullAddress = address.fullAddress
      || [detailAddress, ward, district, province]
        .filter(Boolean)
        .join(', ')
      || 'Chua co dia chi chi tiet';

    return { receiverName, phoneDisplay, fullAddress };
  };

  const selectedAddress = normalizedAddresses.find(
    (addr) => addr.__internalId === internalSelectedId,
  );
  const selectedDisplay = buildAddressDisplay(selectedAddress);

  return (
    <div
      className="bg-white rounded-xl p-6 shadow-sm checkout-card relative"
      style={{ zIndex: dropdownOpen ? 50 : undefined }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-alata text-2xl text-black flex items-center gap-2">
          <FaMapMarkerAlt className="text-primary" />
          Địa chỉ giao hàng
        </h2>
        {allowManage && normalizedAddresses.length > 0 && (
          <button
            type="button"
            onClick={onManageClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-colors"
          >
            <FaPlus />
            Quản lý
          </button>
        )}
      </div>

      {isLoading && renderSkeleton()}
      {!isLoading && normalizedAddresses.length === 0 && renderEmptyState()}

      {!isLoading && normalizedAddresses.length > 0 && (
        <div className="space-y-4 relative" ref={dropdownRef}>
          <div className={`relative ${dropdownOpen ? 'z-30' : ''}`}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-full text-left px-4 py-3 pr-10 border border-gray-300 rounded-xl font-nunito text-base text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary/60 transition-colors"
            >
              {selectedDisplay ? (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[#9e211f]">{selectedDisplay.receiverName}</span>
                  <span className="text-sm text-gray-600">{selectedDisplay.phoneDisplay}</span>
                  <span className="text-sm text-gray-700">{selectedDisplay.fullAddress}</span>
                  {selectedAddress?.isDefault && (
                    <span className="text-xs text-green-700 font-semibold">Mặc định</span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-500">Chưa chọn địa chỉ</span>
              )}
              <FaChevronDown
                className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 z-40 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                {normalizedAddresses.map((address) => {
                  const info = buildAddressDisplay(address);
                  const isSelected = address.__internalId === internalSelectedId;
                  return (
                    <button
                      type="button"
                      key={address.__internalId}
                      onClick={() => {
                        setInternalSelectedId(address.__internalId);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 flex flex-col gap-1 border-b last:border-b-0 ${isSelected ? 'bg-primary/5 text-primary' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-semibold text-[#9e211f]">{info.receiverName}</span>
                      <span className="text-sm text-gray-600">{info.phoneDisplay}</span>
                      <span className="text-sm text-gray-700">{info.fullAddress}</span>
                      {address.isDefault && (
                        <span className="text-xs text-green-700 font-semibold">Mặc định</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

AddressSelector.propTypes = {
  addresses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      addressId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      shippingAddressId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      code: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      receiverName: PropTypes.string,
      contactName: PropTypes.string,
      phone: PropTypes.string,
      phoneNumber: PropTypes.string,
      contactPhone: PropTypes.string,
      fullAddress: PropTypes.string,
      detailAddress: PropTypes.string,
      address: PropTypes.string,
      line1: PropTypes.string,
      ward: PropTypes.string,
      district: PropTypes.string,
      province: PropTypes.string,
      districtId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      wardCode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      isDefault: PropTypes.bool,
    }),
  ),
  selectedAddressId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onAddressSelect: PropTypes.func,
  onManageClick: PropTypes.func,
  isLoading: PropTypes.bool,
  allowManage: PropTypes.bool,
};

export default AddressSelector;
