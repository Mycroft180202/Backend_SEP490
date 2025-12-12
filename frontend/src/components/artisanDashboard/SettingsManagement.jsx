import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaStore,
  FaMapMarkerAlt,
  FaPhone,
  FaIdCard,
  FaSpinner,
  FaInfoCircle,
  FaTimes,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { ShopService } from '../../services/modules/shop/shopService';
import { GHNLocationService } from '../../services/modules/shipping/ghnLocationService';

const buildShopAddressString = async (address) => {
  if (!address) return '';
  const line = address.line1 || address.addressLine || address.line2 || '';
  let provinceName = address.city || address.cityName || address.province || '';
  let districtName = address.districtName || address.district || address.county || '';
  let wardName = address.wardName || address.ward || address.subDistrict || address.subDistrictName || '';
  try {
    if (address.ghnProvinceId) {
      const provinces = await GHNLocationService.getProvinces();
      const province = provinces.find((p) => Number(p.ProvinceID) === Number(address.ghnProvinceId));
      if (province?.ProvinceName) {
        provinceName = province.ProvinceName;
      }
    }

    if (address.ghnDistrictId) {
      const districts = await GHNLocationService.getDistricts(address.ghnProvinceId);
      const district = districts.find((d) => Number(d.DistrictID) === Number(address.ghnDistrictId));
      if (district?.DistrictName) {
        districtName = district.DistrictName;
      }
    }

    if (address.ghnWardCode && address.ghnDistrictId) {
      const wards = await GHNLocationService.getWards(address.ghnDistrictId);
      const ward = wards.find((w) => w.WardCode === address.ghnWardCode);
      if (ward?.WardName) {
        wardName = ward.WardName;
      }
    }
  } catch (error) {
    console.warn('Unable to resolve GHN location names for shop address:', error);
  }

  const parts = [
    line,
    wardName,
    districtName,
    provinceName,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
};

const SettingsManagement = () => {
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [formValues, setFormValues] = useState({
    shopName: '',
    phoneNumber: '',
    bio: '',
    shopUrlImage: null,
  });
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const extractAddress = (addresses) => {
    if (!Array.isArray(addresses) || !addresses.length) return '';
    const primary = addresses.find((addr) => addr.isPrimary || addr.isDefault) || addresses[0];
    if (!primary) return '';
    const ward = primary.wardName || primary.ward || primary.subDistrict || primary.subDistrictName || '';
    const district = primary.districtName || primary.district || primary.county || '';
    const city = primary.cityName || primary.city || primary.province || '';
    const parts = [
      primary.line1 || primary.addressLine || '',
      ward,
      district,
      city,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const normalizeShopData = useCallback((data) => ({
    shopName: data?.shopName || data?.displayName || '',
    bio: data?.bio || data?.description || '',
    address: extractAddress(data?.addresses) || data?.address || '',
    phone: data?.phoneNumber || data?.phone || '',
    shopUrlImage: data?.shopUrlImage || '',
    artisanId: data?.userID || data?.userId || null,
    ownerName: data?.displayName || data?.ownerName || '',
  }), []);

  useEffect(() => {
    let cancelled = false;

    const loadShopInfo = async () => {
      try {
        setLoading(true);
        const response = await ShopService.getMyShop();
        if (cancelled) return;
        const normalized = normalizeShopData(response || {});
        const addresses = Array.isArray(response?.addresses) ? response.addresses : [];
        const primaryAddress = addresses.find((addr) => addr.isDefault || addr.isPrimary) || addresses[0];
        const detailedAddress = await buildShopAddressString(primaryAddress);
        if (cancelled) return;
        if (detailedAddress) {
          normalized.address = detailedAddress;
        }
        setShopInfo(normalized);
        setFormValues({
          shopName: normalized.shopName || '',
          phoneNumber: normalized.phone || '',
          bio: normalized.bio || '',
          shopUrlImage: null,
        });
        setImagePreview(normalized.shopUrlImage || '');
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Load artisan shop info error:', err);
        const message = err?.response?.data?.message || err?.message || 'Không thể tải thông tin cửa hàng.';
        toast.error(message);
        setError(message);
        setShopInfo(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadShopInfo();

    return () => {
      cancelled = true;
    };
  }, [normalizeShopData]);

  const infoItems = useMemo(() => {
    if (!shopInfo) return [];
    return [
      {
        key: 'shopName',
        label: 'Tên cửa hàng',
        value: shopInfo.shopName || '—',
        icon: FaStore,
      },
      {
        key: 'ownerName',
        label: 'Chủ cửa hàng',
        value: shopInfo.ownerName || 'Chưa cập nhật chủ cửa hàng.',
        icon: FaIdCard,
      },
      {
        key: 'bio',
        label: 'Giới thiệu cửa hàng',
        value: shopInfo.bio || 'Chưa cập nhật mô tả.',
        icon: FaInfoCircle,
      },
      {
        key: 'address',
        label: 'Địa chỉ',
        value: shopInfo.address || 'Chưa cập nhật địa chỉ.',
        icon: FaMapMarkerAlt,
      },
      {
        key: 'phone',
        label: 'Số điện thoại',
        value: shopInfo.phone || 'Chưa cập nhật số điện thoại.',
        icon: FaPhone,
      },
    ];
  }, [shopInfo]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setFormValues((prev) => ({ ...prev, shopUrlImage: file }));
    } else {
      setImagePreview(shopInfo?.shopUrlImage || '');
      setFormValues((prev) => ({ ...prev, shopUrlImage: null }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = formValues.shopName.trim();
    if (!trimmedName) {
      toast.error('Vui lòng nhập tên cửa hàng.');
      return;
    }

    setUpdating(true);
    try {
      await ShopService.updateMyShop({
        shopName: trimmedName,
        phoneNumber: formValues.phoneNumber.trim(),
        bio: formValues.bio.trim(),
        shopUrlImage: formValues.shopUrlImage || undefined,
      });

      toast.success('Cập nhật thông tin cửa hàng thành công.');
      const refreshed = await ShopService.getMyShop();
      const normalized = normalizeShopData(refreshed || {});
      setShopInfo(normalized);
      setFormValues({
        shopName: normalized.shopName || '',
        phoneNumber: normalized.phone || '',
        bio: normalized.bio || '',
        shopUrlImage: null,
      });
      setImagePreview(normalized.shopUrlImage || '');
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Update artisan shop info error:', err);
      const message = err?.response?.data?.message || err?.message || 'Không thể cập nhật thông tin cửa hàng.';
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800 font-alata">Thông tin cửa hàng</h2>
          <p className="text-sm text-gray-500 mt-1">Thông tin được lấy trực tiếp từ hồ sơ cửa hàng của bạn.</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-600">
              <FaSpinner className="mr-3 animate-spin text-2xl text-primary" />
              Đang tải thông tin cửa hàng...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-600">
              {error}
            </div>
          ) : !shopInfo ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
              Chưa có thông tin cửa hàng để hiển thị.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {infoItems.map(({ key, label, value, icon: Icon }) => (
                <div key={key} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-800 whitespace-pre-line">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-start flex-col gap-1">
            <h2 className="text-xl font-bold text-gray-800 font-alata">Cập nhật thông tin cửa hàng</h2>
            <p className="text-sm text-gray-500 mt-1">Chỉnh sửa tên, số điện thoại, mô tả và ảnh đại diện của cửa hàng.</p>
          </div>
        </div>
        <div className="flex justify-start p-6">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="rounded-lg border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            Cập nhật thông tin cửa hàng
          </button>
        </div>
      </div>
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Cập nhật thông tin cửa hàng</h3>
                <p className="text-xs text-gray-500">Chỉnh sửa tên, số điện thoại, mô tả và ảnh đại diện của cửa hàng.</p>
              </div>
              <button
                type="button"
                className="text-gray-500 transition hover:text-gray-700"
                onClick={() => setIsEditModalOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <form className="space-y-6 p-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="shopName">Tên cửa hàng</label>
                  <input
                    id="shopName"
                    name="shopName"
                    type="text"
                    value={formValues.shopName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập tên cửa hàng"
                    disabled={updating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="phoneNumber">Số điện thoại</label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formValues.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập số điện thoại"
                    disabled={updating}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="bio">Giới thiệu cửa hàng</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formValues.bio}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Chia sẻ câu chuyện hoặc thông tin nổi bật của cửa hàng"
                  disabled={updating}
                />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_200px] items-start">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="shopUrlImage">Ảnh đại diện cửa hàng</label>
                  <input
                    id="shopUrlImage"
                    name="shopUrlImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={updating}
                  />
                  <p className="mt-2 text-xs text-gray-500">Hỗ trợ định dạng JPG, PNG. Dung lượng tối đa 5MB.</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-32 h-32 rounded-lg border border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Xem trước ảnh cửa hàng" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400 text-center px-2">Chưa có ảnh đại diện</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center">Ảnh đang hiển thị sẽ được sử dụng làm ảnh đại diện cửa hàng.</p>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={updating}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={updating}
                >
                  {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsManagement;
