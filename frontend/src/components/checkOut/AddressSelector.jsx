import React, { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    if (selectedAddressId) {
      setInternalSelectedId(selectedAddressId);
    } else if (normalizedAddresses.length > 0) {
      const defaultAddr = normalizedAddresses.find((addr) => addr.isDefault)
        || normalizedAddresses.find((addr) => addr.__internalId === internalSelectedId)
        || normalizedAddresses[0];
      setInternalSelectedId(defaultAddr?.__internalId ?? null);
    } else {
      setInternalSelectedId(null);
    }
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

  const renderSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, idx) => (
        <div
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

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm checkout-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-alata text-2xl text-black flex items-center gap-2">
          <FaMapMarkerAlt className="text-primary" />
          Dia chi giao hang
        </h2>
        {allowManage && normalizedAddresses.length > 0 && (
          <button
            type="button"
            onClick={onManageClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-colors"
          >
            <FaPlus />
            Quan ly
          </button>
        )}
      </div>

      {isLoading && renderSkeleton()}
      {!isLoading && normalizedAddresses.length === 0 && renderEmptyState()}

      {!isLoading && normalizedAddresses.length > 0 && (
        <div className="space-y-4">
          {/* Dropdown */}
          <div className="relative">
            <select
              value={internalSelectedId || ''}
              onChange={(e) => setInternalSelectedId(e.target.value)}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl font-nunito text-base text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer hover:border-primary/60 transition-colors"
            >
              {normalizedAddresses.map((address) => {
                const displayName = address.name || address.receiverName || 'Nguoi nhan';
                const displayPhone = address.phone || address.phoneNumber || '';
                const isDefault = address.isDefault ? ' [Mac dinh]' : '';
                
                return (
                  <option 
                    key={address.__internalId} 
                    value={address.__internalId}
                  >
                    {displayName} - {displayPhone}{isDefault}
                  </option>
                );
              })}
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Selected Address Details - Style like profile page */}
          {internalSelectedId && (() => {
            const selectedAddress = normalizedAddresses.find(
              (addr) => addr.__internalId === internalSelectedId
            );
            if (!selectedAddress) return null;

            const displayName = selectedAddress.name || selectedAddress.receiverName || 'Nguoi nhan';
            const displayPhone = selectedAddress.phone || selectedAddress.phoneNumber || 'Chua co so dien thoai';
            
            const detailAddress = selectedAddress.detailAddress || '';
            const ward = selectedAddress.ward || '';
            const district = selectedAddress.district || '';
            const province = selectedAddress.province || '';
            
            const fullAddressLine = [detailAddress, ward, district, province]
              .filter(Boolean)
              .join(', ');

            return (
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="mb-2">
                  <span className="font-bold text-lg">{displayName}</span>
                </div>
                <div className="text-gray-700 mb-1">{displayPhone}</div>
                <div className="text-gray-600">{fullAddressLine || 'Chua co thong tin dia chi chi tiet.'}</div>
                {selectedAddress.isDefault && (
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 font-semibold">
                      MAC DINH
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
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
      name: PropTypes.string,
      receiverName: PropTypes.string,
      phone: PropTypes.string,
      phoneNumber: PropTypes.string,
      fullAddress: PropTypes.string,
      detailAddress: PropTypes.string,
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
