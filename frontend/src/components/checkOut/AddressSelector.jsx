import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FaCheck, FaMapMarkerAlt, FaPlus } from 'react-icons/fa';

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
          {normalizedAddresses.map((address) => {
            const isSelected = address.__internalId === internalSelectedId;
            const primaryDetail = address.fullAddress
              || address.line1
              || address.detailAddress
              || address.addressLine
              || address.address;
            const detailLine = primaryDetail
              || [
                address.detailAddress || address.address || address.addressLine,
                address.ward,
                address.district,
                address.province,
              ]
                .filter(Boolean)
                .join(', ');
            const detailLine2 = address.detailAddress2
              || address.line2
              || address.addressLine2;
            const displayAddress = detailLine
              || 'Chua co thong tin dia chi chi tiet.';

            const provinceLine = ''; // tránh lặp lại tỉnh/thành đã có trong dòng địa chỉ chính
            return (
              <button
                key={address.__internalId}
                type="button"
                onClick={() => setInternalSelectedId(address.__internalId)}
                className={`w-full p-4 rounded-xl border transition text-left ${
                  isSelected
                    ? 'border-primary bg-[#FFF5F5]'
                    : 'border-gray-200 hover:border-primary/60'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-nunito text-lg font-semibold text-black">
                        {address.name || address.receiverName || 'Nguoi nhan'}
                      </p>
                      <p className="font-nunito text-sm text-gray-500">
                        {address.phone || address.phoneNumber || 'Chua co so dien thoai'}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-white text-sm font-semibold">
                        <FaCheck size={12} />
                        Dang chon
                      </span>
                    )}
                  </div>

                  <p className="font-nunito text-base text-gray-700">
                    {displayAddress}
                  </p>
                  {detailLine2 && (
                    <p className="font-nunito text-sm text-gray-600">
                      {detailLine2}
                    </p>
                  )}
                  {provinceLine && (
                    <p className="font-nunito text-sm text-gray-500">
                      {provinceLine}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {address.isDefault && (
                      <span className="px-3 py-1 rounded-full bg-white border border-gray-200 text-primary font-semibold">
                        Mac dinh
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
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
