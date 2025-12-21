import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { FaTimes } from 'react-icons/fa';
import { LanguageContext } from '../../context/LanguageContext';
import { GHNLocationService } from '../../services/modules/shipping/ghnLocationService';
import { UserService } from '../../services/modules/users/userService';

const normalizeVietnamPhone = (value) => {
  const raw = (value || '').trim();
  if (!raw) return { normalized: '', isValid: false, reason: 'empty' };
  const digits = raw.replace(/\D/g, '');
  if (!digits) return { normalized: '', isValid: false, reason: 'invalid' };

  let normalized = digits;
  if (normalized.startsWith('84') && normalized.length === 11) {
    normalized = `0${normalized.slice(2)}`;
  }

  if (!/^0\d{9}$/.test(normalized)) {
    return { normalized, isValid: false, reason: 'format' };
  }
  return { normalized, isValid: true };
};

const DEFAULT_FORM = Object.freeze({
  name: '',
  phone: '',
  province: '',
  provinceId: '',
  district: '',
  districtId: '',
  ward: '',
  wardCode: '',
  detailAddress: '',
  isDefault: false,
});

export default function AddressManageModal({
  isOpen,
  onClose,
  onCreated,
  existingAddresses = [],
}) {
  const { t } = useContext(LanguageContext);
  const translate = useCallback((key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  }, [t]);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const phoneInputRef = useRef(null);

  const shouldForceDefault = useMemo(() => !Array.isArray(existingAddresses) || existingAddresses.length === 0, [existingAddresses]);

  useEffect(() => {
    if (!isOpen) return;
    setForm((prev) => ({
      ...DEFAULT_FORM,
      isDefault: shouldForceDefault ? true : prev?.isDefault || false,
    }));
    setDistricts([]);
    setWards([]);
  }, [isOpen, shouldForceDefault]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const load = async () => {
      try {
        setLoadingProvinces(true);
        const data = await GHNLocationService.getProvinces();
        if (!active) return;
        setProvinces(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Load provinces error:', error);
        toast.error(translate('profile.address.form.provinceLoadError', 'Không thể tải danh sách tỉnh/thành phố.'));
      } finally {
        if (active) setLoadingProvinces(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [isOpen, translate]);

  const handleProvinceSelect = async (provinceId) => {
    const numericProvinceId = provinceId ? Number(provinceId) : '';
    const selectedProvince = provinces.find((p) => p.ProvinceID === numericProvinceId);

    setForm((prev) => ({
      ...prev,
      provinceId: numericProvinceId || '',
      province: selectedProvince?.ProvinceName || '',
      districtId: '',
      district: '',
      wardCode: '',
      ward: '',
    }));
    setDistricts([]);
    setWards([]);

    if (!numericProvinceId) return;
    try {
      setLoadingDistricts(true);
      const data = await GHNLocationService.getDistricts(numericProvinceId);
      setDistricts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load districts error:', error);
      toast.error(translate('profile.address.form.districtLoadError', 'Không thể tải danh sách quận/huyện.'));
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictSelect = async (districtId) => {
    const numericDistrictId = districtId ? Number(districtId) : '';
    const selectedDistrict = districts.find((d) => d.DistrictID === numericDistrictId);

    setForm((prev) => ({
      ...prev,
      districtId: numericDistrictId || '',
      district: selectedDistrict?.DistrictName || '',
      wardCode: '',
      ward: '',
    }));
    setWards([]);

    if (!numericDistrictId) return;
    try {
      setLoadingWards(true);
      const data = await GHNLocationService.getWards(numericDistrictId);
      setWards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load wards error:', error);
      toast.error(translate('profile.address.form.wardLoadError', 'Không thể tải danh sách phường/xã.'));
    } finally {
      setLoadingWards(false);
    }
  };

  const handleWardSelect = (wardCode) => {
    const selectedWard = wards.find((w) => w.WardCode === wardCode);
    setForm((prev) => ({
      ...prev,
      wardCode: wardCode || '',
      ward: selectedWard?.WardName || '',
    }));
  };

  const handleSave = async () => {
    const name = (form.name || '').trim();
    const phone = (form.phone || '').trim();
    const detail = (form.detailAddress || '').trim();
    const provinceIdValue = String(form.provinceId || '').trim();
    const districtIdValue = String(form.districtId || '').trim();
    const wardCodeValue = String(form.wardCode || '').trim();

    if (!name || !phone || !detail || !provinceIdValue || !districtIdValue || !wardCodeValue) {
      toast.error(translate(
        'profile.address.validation.missingFields',
        'Vui lòng chọn đầy đủ tỉnh, quận, phường và nhập địa chỉ chi tiết.',
      ));
      return;
    }

    const phoneResult = normalizeVietnamPhone(phone);
    if (!phoneResult.isValid) {
      toast.error(translate('profile.info.phoneInvalid', 'Số điện thoại không hợp lệ.'));
      phoneInputRef.current?.focus();
      return;
    }

    const provinceId = Number(provinceIdValue);
    const districtId = Number(districtIdValue);
    if (Number.isNaN(provinceId) || Number.isNaN(districtId)) {
      toast.error(translate(
        'profile.address.validation.invalidProvinceDistrict',
        'Mã tỉnh hoặc quận không hợp lệ.',
      ));
      return;
    }

    const existing = Array.isArray(existingAddresses) ? existingAddresses : [];
    const hasOtherDefault = existing.some((addr) => addr?.isDefault);
    let isDefault = Boolean(form.isDefault);
    if (!existing.length) {
      isDefault = true;
    } else if (!isDefault && !hasOtherDefault) {
      isDefault = true;
    }

    const payload = {
      line1: detail,
      line2: null,
      city: (form.province || form.district || 'Vietnam').trim(),
      country: 'Vietnam',
      posttalCode: '',
      isDefault,
      contactName: name,
      contactPhone: phoneResult.normalized,
      ghnProvinceId: provinceId,
      ghnDistrictId: districtId,
      ghnWardCode: wardCodeValue,
    };

    try {
      setSaving(true);
      const response = await UserService.addAddress(payload);
      toast.success(translate('profile.address.createSuccess', 'Thêm địa chỉ thành công!'));
      if (typeof onCreated === 'function') {
        const createdId =
          response?.id
          ?? response?.addressId
          ?? response?.shippingAddressId
          ?? response?.data?.id
          ?? response?.data?.addressId
          ?? null;
        onCreated({ createdAddressId: createdId, isDefault });
      }
      onClose();
    } catch (error) {
      console.error('Add address error:', error);
      const message =
        error?.response?.data?.message
        || error?.response?.data?.title
        || error?.message
        || translate('profile.address.saveError', 'Không thể lưu địa chỉ.');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#8B4513]">
            {translate('checkout.address.manage', 'Quản lý địa chỉ')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
            disabled={saving}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {translate('profile.address.form.recipientLabel', 'Họ tên người nhận')}
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {translate('profile.address.form.phoneLabel', 'Số điện thoại')}
              </label>
              <input
                type="text"
                ref={phoneInputRef}
                inputMode="numeric"
                className="w-full border rounded px-3 py-2"
                value={form.phone}
                onChange={(e) => {
                  const raw = e.target.value || '';
                  const next = raw.replace(/\D/g, '');
                  setForm((prev) => ({ ...prev, phone: next }));
                }}
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {translate('profile.address.form.provinceLabel', 'Tỉnh/Thành phố')}
              </label>
              <select
                className="w-full border rounded px-3 py-2 bg-white"
                value={form.provinceId || ''}
                onChange={(e) => handleProvinceSelect(e.target.value)}
                disabled={saving || loadingProvinces}
              >
                <option value="">
                  {loadingProvinces
                    ? translate('profile.address.form.provinceLoading', 'Đang tải tỉnh/thành phố...')
                    : translate('profile.address.form.provincePlaceholder', 'Chọn tỉnh/thành phố')}
                </option>
                {provinces.map((p) => (
                  <option key={p.ProvinceID} value={p.ProvinceID}>
                    {p.ProvinceName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {translate('profile.address.form.districtLabel', 'Quận/Huyện')}
              </label>
              <select
                className="w-full border rounded px-3 py-2 bg-white"
                value={form.districtId || ''}
                onChange={(e) => handleDistrictSelect(e.target.value)}
                disabled={saving || !form.provinceId || loadingDistricts}
              >
                <option value="">
                  {!form.provinceId
                    ? translate('profile.address.form.districtSelectProvince', 'Vui lòng chọn tỉnh/thành phố trước')
                    : loadingDistricts
                      ? translate('profile.address.form.districtLoading', 'Đang tải quận/huyện...')
                      : translate('profile.address.form.districtPlaceholder', 'Chọn quận/huyện')}
                </option>
                {districts.map((d) => (
                  <option key={d.DistrictID} value={d.DistrictID}>
                    {d.DistrictName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {translate('profile.address.form.wardLabel', 'Phường/Xã')}
              </label>
              <select
                className="w-full border rounded px-3 py-2 bg-white"
                value={form.wardCode || ''}
                onChange={(e) => handleWardSelect(e.target.value)}
                disabled={saving || !form.districtId || loadingWards}
              >
                <option value="">
                  {!form.districtId
                    ? translate('profile.address.form.wardSelectDistrict', 'Vui lòng chọn quận/huyện trước')
                    : loadingWards
                      ? translate('profile.address.form.wardLoading', 'Đang tải phường/xã...')
                      : translate('profile.address.form.wardPlaceholder', 'Chọn phường/xã')}
                </option>
                {wards.map((w) => (
                  <option key={w.WardCode} value={w.WardCode}>
                    {w.WardName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {translate('profile.address.form.detailLabel', 'Địa chỉ chi tiết')}
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={form.detailAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, detailAddress: e.target.value }))}
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="checkout-address-default"
              checked={Boolean(form.isDefault) || shouldForceDefault}
              onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              disabled={saving || shouldForceDefault}
            />
            <label htmlFor="checkout-address-default" className="text-sm">
              {translate('profile.address.form.defaultCheckbox', 'Đặt làm địa chỉ mặc định')}
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white transition disabled:opacity-60"
            onClick={onClose}
            disabled={saving}
          >
            {translate('profile.common.cancel', 'Hủy')}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-[#8B4513] text-white font-semibold hover:bg-[#D4A574] transition disabled:opacity-70"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? translate('profile.address.form.saving', 'Đang lưu...')
              : translate('profile.address.form.saveButton', 'Lưu địa chỉ')}
          </button>
        </div>
      </div>
    </div>
  );
}

AddressManageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func,
  existingAddresses: PropTypes.arrayOf(PropTypes.shape({})),
};
