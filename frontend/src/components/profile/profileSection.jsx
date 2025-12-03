import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useNavigate } from "react-router-dom";
import { AuthService } from '../../services/modules/auth/authService';
import { UserService } from '../../services/modules/users/userService';
import { GHNLocationService } from '../../services/modules/shipping/ghnLocationService';
import {
  FaUserCircle,
  FaPhoneAlt,
  FaHeart,
  FaHistory,
  FaLock,
  FaSignOutAlt,
  FaUserTie,
  FaEnvelope,
  FaKey,
  FaPaperPlane,
  FaCamera,
  FaEdit,
  FaEye,
  FaPlus,
  FaTimes,
  FaCalendarAlt,
  FaSpinner,
} from 'react-icons/fa';
import { WishlistService } from '../../services/modules/wishlist/wishlistService';
import { ArtisanApplicationService } from '../../services/modules/artisan/artisanApplicationService';
import ProductCard from '../shared/ProductCard';
import ArtisanRegistrationForm from './ArtisanRegistrationForm';
import { toast } from 'react-toastify';

const mapUserProfile = (data) => ({
  name: data.displayName || data.fullName || '',
  phone: data.phoneNumber || '',
  email: data.email || '',
  username: data.username || '',
  dob: data.dob || '',
  userUrlImage: data.userUrlImage || null,
  addresses: Array.isArray(data.addresses) ? data.addresses : [],
});

const addressFormDefaults = {
  name: '',
  phone: '',
  province: '',
  provinceId: '',
  district: '',
  ward: '',
  detailAddress: '',
  detailAddress2: '',
  districtId: '',
  wardCode: '',
  isDefault: false,
};

const formatDob = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const normalizeDobInput = (value) => {
  if (!value) return '';
  const parts = value.split(/[-/]/).map((p) => p.trim());
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // yyyy-mm-dd
      const [y, m, d] = parts.map(Number);
      const date = new Date(y, m - 1, d);
      return Number.isNaN(date.getTime()) ? '' : date.toISOString();
    }
    // dd-mm-yyyy
    const [d, m, y] = parts.map(Number);
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
};

// Component đổi mật khẩu
function ChangePasswordSection({ email }) {
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const response = await AuthService.sendOtp(email);
      toast.success(response?.message || 'OTP đã được gửi tới email của bạn.');
      setStep(2);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Email không tồn tại trong hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otpCode) {
      toast.error('Vui lòng nhập mã OTP.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ mật khẩu.');
      return;
    }
        if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }
    const strongPassword = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
    if (!strongPassword.test(newPassword)) {
      toast.error('Mật khẩu phải có ≥ 6 ký tự, ít nhất 1 chữ viết hoa và 1 ký tự đặc biệt.');
      return;
    }
    setLoading(true);
    try {
      const response = await AuthService.resetPassword({ email, otpCode, newPassword });
      toast.success(response?.message || 'Mật khẩu đã được thay đổi thành công.');
      setStep(1);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-[#9e211f] text-3xl font-bold mb-8">Đổi mật khẩu</h2>
      {step === 1 && (
        <div>
          <label className="block mb-2 text-sm font-medium">Email</label>
          <div className="flex items-center border rounded overflow-hidden mb-4">
            <div className="px-3 text-gray-400"><FaEnvelope /></div>
            <input type="email" value={email} readOnly className="w-full p-2 outline-none bg-gray-100" />
          </div>
          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-transform transform hover:scale-105"
          >
            <FaPaperPlane /> {loading ? 'Đang gửi...' : 'Gửi OTP'}
          </button>
        </div>
      )}
      {step === 2 && (
        <div>
          <label className="block mb-2 text-sm font-medium">OTP</label>
          <div className="flex items-center border rounded overflow-hidden mb-4">
            <div className="px-3 text-gray-400"><FaKey /></div>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full p-2 outline-none"
              placeholder="Nhập mã OTP"
            />
          </div>
          <label className="block mb-2 text-sm font-medium">Mật khẩu mới</label>
          <div className="flex items-center border rounded overflow-hidden mb-4">
            <div className="px-3 text-gray-400"><FaLock /></div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 outline-none"
              placeholder="Nhập mật khẩu mới"
            />
          </div>
          <label className="block mb-2 text-sm font-medium">Xác nhận mật khẩu</label>
          <div className="flex items-center border rounded overflow-hidden mb-4">
            <div className="px-3 text-gray-400"><FaLock /></div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 outline-none"
              placeholder="Nhập lại mật khẩu"
            />
          </div>
          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-transform transform hover:scale-105"
          >
            <FaLock /> {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </div>
      )}
    </div>
  );
}

// Component ProfileSection
function ProfileSection() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('info');
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isArtisan, setIsArtisan] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [dobInput, setDobInput] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState(addressFormDefaults);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [applicationInfo, setApplicationInfo] = useState(null);
  const [loadingApplication, setLoadingApplication] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const resolveAddressNames = useCallback(async (addresses) => {
    if (!Array.isArray(addresses) || addresses.length === 0) return [];

    const provinces = await GHNLocationService.getProvinces();
    const getProvinceName = (provinceId) => {
      if (!provinceId) return '';
      const matched = provinces.find((p) => Number(p.ProvinceID) === Number(provinceId));
      return matched?.ProvinceName || '';
    };

    const districtCache = new Map();
    const wardCache = new Map();

    const resolved = await Promise.all(
      addresses.map(async (addr) => {
        const provinceId = addr.ghnProvinceId ?? addr.provinceId ?? addr.ProvinceID;
        let province = addr.province || getProvinceName(provinceId);

        const districtId = addr.ghnDistrictId ?? addr.districtId ?? addr.DistrictID;
        let district = addr.district;
        if (districtId) {
          const provinceKey = provinceId || 0;
          if (!districtCache.has(provinceKey)) {
            const districtsData = await GHNLocationService.getDistricts(provinceKey);
            districtCache.set(provinceKey, districtsData || []);
          }
          const districtsData = districtCache.get(provinceKey) || [];
          const matchedDistrict = districtsData.find(
            (d) => Number(d.DistrictID) === Number(districtId),
          );
          if (matchedDistrict) {
            district = matchedDistrict.DistrictName;
          }
        }

        const wardCode = addr.ghnWardCode ?? addr.wardCode ?? addr.WardCode;
        let ward = addr.ward;
        if (wardCode && districtId) {
          if (!wardCache.has(districtId)) {
            const wardsData = await GHNLocationService.getWards(districtId);
            wardCache.set(districtId, wardsData || []);
          }
          const wardsData = wardCache.get(districtId) || [];
          const matchedWard = wardsData.find(
            (w) => String(w.WardCode) === String(wardCode),
          );
          if (matchedWard) {
            ward = matchedWard.WardName;
          }
        }

        const combinedFull = [
          addr.detailAddress || addr.addressLine || addr.line1,
          ward,
          district,
          province,
        ]
          .filter(Boolean)
          .join(', ');

        return {
          ...addr,
          province,
          district,
          ward,
          line1: addr.line1 || combinedFull || addr.detailAddress || '',
          fullAddress: addr.fullAddress || combinedFull || addr.detailAddress || '',
        };
      }),
    );

    return resolved;
  }, []);

  const refreshUserProfile = useCallback(async () => {
    const data = await AuthService.getUserInfo();
    const profileData = mapUserProfile(data);
    const resolvedAddresses = await resolveAddressNames(profileData.addresses);
    const mergedProfile = { ...profileData, addresses: resolvedAddresses };
    setProfile(mergedProfile);
    setEditedProfile(mergedProfile);
    setDobInput(formatDob(mergedProfile.dob));
    const roleList = data?.roles || [];
    const artisan = roleList.some((r) => (r.name || '').toLowerCase() === 'artisan');
    setIsArtisan(artisan);
    return mergedProfile;
  }, [resolveAddressNames]);

  const loadWishlist = useCallback(async () => {
    try {
      setWishlistLoading(true);
      const res = await WishlistService.getList(1, 50);
      const items = res?.items || res?.Items || [];
      const filtered = items.filter((entry) => {
        const product = entry?.product ?? entry;
        if (!product) return false;
        if (product.isActive === false) {
          return false;
        }
        return true;
      });
      setWishlist(filtered);
    } catch (err) {
      console.error('Load wishlist error:', err);
      toast.error(err?.response?.data?.message || 'Không thể tải sản phẩm yêu thích.');
    } finally {
      setWishlistLoading(false);
    }
  }, []);

  const loadApplicationInfo = useCallback(async () => {
    if (!profile) {
      setApplicationInfo(null);
      return;
    }
    try {
      setLoadingApplication(true);
      const result = await ArtisanApplicationService.getMyApplication();
      setApplicationInfo(result);
    } catch (error) {
      console.error('Load artisan application error:', error);
      setApplicationInfo(null);
    } finally {
      setLoadingApplication(false);
    }
  }, [profile]);

  const getApplicationStatusMeta = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'PENDING':
        return {
          label: 'Chờ duyệt',
          color: 'bg-yellow-100 text-yellow-800',
          description: 'Đơn đăng ký của bạn đang được đội ngũ quản trị xem xét. Vui lòng đợi thêm.',
        };
      case 'APPROVED':
      case 'DONE':
        return {
          label: 'Đã duyệt',
          color: 'bg-green-100 text-green-800',
          description: 'Đơn đăng ký đã được chấp nhận. Bạn có thể bắt đầu quản lý cửa hàng của mình.',
        };
      case 'REJECTED':
        return {
          label: 'Đã từ chối',
          color: 'bg-red-100 text-red-800',
          description: 'Đơn đăng ký đã bị từ chối. Vui lòng xem lý do và liên hệ hỗ trợ nếu cần.',
        };
      default:
        return {
          label: 'Không xác định',
          color: 'bg-gray-100 text-gray-800',
          description: '',
        };
    }
  };

  const loadProvinces = useCallback(async () => {
    try {
      setLoadingProvinces(true);
      const data = await GHNLocationService.getProvinces();
      setProvinces(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error('Load provinces error:', err);
      toast.error('Khong the tai danh sach tinh/ thanh.');
      setProvinces([]);
      return [];
    } finally {
      setLoadingProvinces(false);
    }
  }, []);

  const loadDistricts = useCallback(async (provinceId) => {
    if (!provinceId) {
      setDistricts([]);
      return [];
    }
    try {
      setLoadingDistricts(true);
      const data = await GHNLocationService.getDistricts(provinceId);
      setDistricts(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error('Load districts error:', err);
      toast.error('Khong the tai danh sach quan/huyen.');
      setDistricts([]);
      return [];
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const loadWards = useCallback(async (districtId) => {
    if (!districtId) {
      setWards([]);
      return [];
    }
    try {
      setLoadingWards(true);
      const data = await GHNLocationService.getWards(districtId);
      setWards(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error('Load wards error:', err);
      toast.error('Khong the tai danh sach phuong/xa.');
      setWards([]);
      return [];
    } finally {
      setLoadingWards(false);
    }
  }, []);

  useEffect(() => {

    const fetchUser = async () => {

      try {

        setLoading(true);

        await refreshUserProfile();

      } catch (err) {

        setError('Khong the lay thong tin nguoi dung');

      } finally {

        setLoading(false);

      }

    };

    fetchUser();

  }, [refreshUserProfile]);

  useEffect(() => {
    if (profile) {
      loadApplicationInfo();
    }
  }, [profile, loadApplicationInfo]);

  useEffect(() => {
    if (activeSection === 'wishlist') {
      loadWishlist();
    }
  }, [activeSection, loadWishlist]);

  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    try {
      setLoading(true);
      // Gửi tất cả thông tin hiện tại + file ảnh mới
      const updateData = {
        PhoneNumber: profile.phone || '',
        DisplayName: profile.name || '',
        Dob: profile.dob || '',
        UserUrlImage: file,
      };

      await AuthService.updateProfile(updateData);
      await refreshUserProfile();
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (err) {
      console.error('Update avatar error:', err);
      toast.error(err?.response?.data?.message || 'Không thể cập nhật ảnh đại diện');
    } finally {
      setLoading(false);
    }
  };

  const handleViewImage = () => {
    setShowImageModal(true);
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      setEditedProfile(profile);
      setDobInput(formatDob(profile?.dob));
    }
  };

  const handleInputChange = (field, value) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const updateData = {
        PhoneNumber: editedProfile.phone,
        DisplayName: editedProfile.name,
        Dob: editedProfile.dob,
        // Không gửi UserUrlImage khi chỉ update thông tin text
      };

      await AuthService.updateProfile(updateData);
      await refreshUserProfile();
      setIsEditMode(false);
      toast.success('Cập nhật thông tin thành công!');
    } catch (err) {
      console.error('Lỗi khi cập nhật thông tin:', err);
      toast.error(err.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAddressForm = () => {
    setShowAddressForm((prev) => {
      if (prev) {
        setNewAddress(addressFormDefaults);
        setDistricts([]);
        setWards([]);
        setEditingAddressId(null);
      } else {
        loadProvinces();
      }
      return !prev;
    });
  };

  const handleAddressFieldChange = (field, value) => {
    setNewAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDefaultToggle = (checked) => {
    const totalAddresses = Array.isArray(profile?.addresses) ? profile.addresses.length : 0;
    // If user only has one address, enforce default and show a gentle notice.
    if (totalAddresses <= 1) {
      toast.info('Bạn chỉ có một địa chỉ, địa chỉ này sẽ được đặt làm mặc định.');
      setNewAddress((prev) => ({ ...prev, isDefault: true }));
      return;
    }
    setNewAddress((prev) => ({ ...prev, isDefault: checked }));
  };

  const handleProvinceSelect = async (provinceId) => {
    const numericProvinceId = provinceId ? Number(provinceId) : '';
    const selectedProvince = provinces.find(
      (province) => province.ProvinceID === numericProvinceId,
    );
    setNewAddress((prev) => ({
      ...prev,
      provinceId: numericProvinceId || '',
      province: selectedProvince?.ProvinceName || '',
      district: '',
      districtId: '',
      ward: '',
      wardCode: '',
    }));
    setDistricts([]);
    setWards([]);
    if (numericProvinceId) {
      await loadDistricts(numericProvinceId);
    }
  };

  const handleDistrictSelect = async (districtId) => {
    const numericDistrictId = districtId ? Number(districtId) : '';
    const selectedDistrict = districts.find(
      (district) => district.DistrictID === numericDistrictId,
    );
    setNewAddress((prev) => ({
      ...prev,
      districtId: numericDistrictId || '',
      district: selectedDistrict?.DistrictName || '',
      ward: '',
      wardCode: '',
    }));
    setWards([]);
    if (numericDistrictId) {
      await loadWards(numericDistrictId);
    }
  };

  const handleWardSelect = (wardCode) => {
    const selectedWard = wards.find((ward) => ward.WardCode === wardCode);
    setNewAddress((prev) => ({
      ...prev,
      wardCode: wardCode || '',
      ward: selectedWard?.WardName || '',
    }));
  };

  const handleAddAddress = async () => {
    const name = (newAddress.name || '').trim();
    const phone = (newAddress.phone || '').trim();
    const detail = (newAddress.detailAddress || '').trim();
    const provinceIdValue = (newAddress.provinceId || '').toString().trim();
    const districtIdValue = (newAddress.districtId || '').toString().trim();
    const wardCodeValue = (newAddress.wardCode || '').trim();

    if (!name || !phone || !detail || !provinceIdValue || !districtIdValue || !wardCodeValue) {
      toast.error('Vui long chon day du tinh, quan, phuong va nhap dia chi chi tiet.');
      return;
    }

    const districtId = Number(districtIdValue);
    const provinceId = Number(provinceIdValue);
    if (Number.isNaN(districtId) || Number.isNaN(provinceId)) {
      toast.error('Ma tinh hoac quan khong hop le.');
      return;
    }

    const detailLine2 = (newAddress.detailAddress2 || '').trim();

    const payload = {
      line1: detail,
      line2: detailLine2 || null,
      city: (newAddress.province || newAddress.district || 'Vietnam').trim(),
      country: 'Vietnam',
      posttalCode: '',
      isDefault: Boolean(newAddress.isDefault),
      contactName: name,
      contactPhone: phone,
      ghnProvinceId: provinceId,
      ghnDistrictId: districtId,
      ghnWardCode: wardCodeValue,
    };
    const existingAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];
    const hasOtherDefault = existingAddresses.some(
      (addr) => addr.isDefault && addr.id !== editingAddressId,
    );
    if (!existingAddresses.length) {
      payload.isDefault = true;
    } else if (!payload.isDefault && !hasOtherDefault) {
      payload.isDefault = true;
    }

    try {
      setSavingAddress(true);
      if (editingAddressId) {
        await UserService.updateAddress(editingAddressId, payload);
        toast.success('Cập nhật địa chỉ thành công!');
      } else {
        await UserService.addAddress(payload);
        toast.success('Thêm địa chỉ thành công!');
      }
      await refreshUserProfile();
      setNewAddress(addressFormDefaults);
      setEditingAddressId(null);
      setShowAddressForm(false);
    } catch (err) {
      console.error('Add/update address error:', err);
      const message =
        err?.response?.data?.message
        || err?.response?.data?.title
        || err?.message
        || 'Không thể lưu địa chỉ.';
      toast.error(message);
    } finally {
      setSavingAddress(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfde9]">
        <div className="relative w-20 h-20 mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#BB4B3E] via-[#9E211F] to-[#BB4B3E] animate-[spin_1.8s_linear_infinite] opacity-80" />
          <div className="absolute inset-3 rounded-full bg-white shadow-inner" />
          <div className="absolute inset-5 rounded-full border-2 border-dashed border-[#9E211F]/40 animate-pulse" />
        </div>
        <p className="text-[#9E211F] font-semibold text-lg font-['Nunito']">Đang tải thông tin...</p>
        <p className="text-sm text-gray-600 mt-1 font-['Nunito']">Vui lòng chờ trong giây lát</p>
      </div>
    );
  }
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!profile) return null;

  return (
    <div className="bg-[#fdfde9] min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-1/4 px-8 py-12 flex flex-col items-center border-r border-[#e5e5e5]">
        <div 
          className="relative mb-4"
          onMouseEnter={() => setIsHoveringAvatar(true)}
          onMouseLeave={() => setIsHoveringAvatar(false)}
        >
          <img
            src={profile.userUrlImage ? profile.userUrlImage : '/images/default-avatar.png'}
            alt="User Avatar"
            className="w-28 h-28 rounded-full object-cover border"
          />
          {isHoveringAvatar && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {/* Top half - View image */}
              <div 
                className="absolute top-0 left-0 right-0 h-1/2 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer transition-all hover:bg-opacity-70"
                onClick={handleViewImage}
              >
                <div className="text-white text-center">
                  <FaEye className="mx-auto mb-1" size={20} />
                  <span className="text-xs">Xem ảnh</span>
                </div>
              </div>
              {/* Bottom half - Change image */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-1/2 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer transition-all hover:bg-opacity-70"
                onClick={handleAvatarClick}
              >
                <div className="text-white text-center">
                  <FaCamera className="mx-auto mb-1" size={20} />
                  <span className="text-xs">Đổi ảnh</span>
                </div>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div className="font-bold text-lg mb-2">{profile.name}</div>
        <nav className="w-full mt-6">
          <ul className="space-y-4">
            <li
              className={`flex items-center gap-2 font-semibold cursor-pointer ${activeSection === 'info' ? 'text-[#9e211f]' : 'text-gray-600 hover:text-[#9e211f]'}`}
              onClick={() => setActiveSection('info')}
            >
              <FaUserCircle /> Thông tin tài khoản
            </li>
            <li 
              className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]"
              onClick={() => navigate('/order-history')}
            >
              <FaHistory /> Lịch sử mua hàng
            </li>
            <li
              className={`flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f] ${activeSection === 'wishlist' ? 'text-[#9e211f]' : ''}`}
              onClick={() => {
                setActiveSection('wishlist');
                loadWishlist();
              }}
            >
              <FaHeart /> Sản phẩm đã thích
            </li>
            <li
              className={`flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f] ${activeSection === 'artisanRegistration' ? 'text-[#9e211f]' : ''}`}
              onClick={() => {
                if (isArtisan) {
                  navigate('/artisan-shop');
                } else {
                  setActiveSection('artisanRegistration');
                }
              }}
            >
              <FaUserTie />
              {isArtisan ? 'Cửa hàng của tôi' : 'Đăng ký làm người bán hàng'}
            </li>
            <li
              className={`flex items-center gap-2 cursor-pointer ${activeSection === 'changePassword' ? 'text-[#9e211f]' : 'text-gray-600 hover:text-[#9e211f]'}`}
              onClick={() => setActiveSection('changePassword')}
            >
              <FaLock /> Đổi mật khẩu
            </li>
            <li className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]">
              <FaSignOutAlt /> Đăng xuất
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-16 py-12">
        {activeSection === 'info' ? (
          <>
            <h2 className="text-[#9e211f] text-3xl font-bold mb-8">Thông tin tài khoản</h2>
            <form className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-2xl">
              <div>
                <label className="block mb-2 font-medium">Tên</label>
                <input 
                  type="text" 
                  value={isEditMode ? editedProfile.name : profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full border rounded px-4 py-2" 
                  readOnly={!isEditMode}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Số điện thoại</label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedProfile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full border rounded px-4 py-2"
                  />
                ) : (
                  <div className="flex items-center border rounded px-4 py-2 bg-white">
                    <FaPhoneAlt className="mr-2 text-gray-400" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block mb-2 font-medium">Email</label>
                <div className="flex items-center border rounded px-4 py-2 bg-white">
                  <FaUserCircle className="mr-2 text-gray-400" />
                  <span>{profile.email}</span>
                </div>
              </div>
              <div>
                <label className="block mb-2 font-medium">Tên đăng nhập</label>
                <input type="text" value={profile.username} className="w-full border rounded px-4 py-2" readOnly />
              </div>
              <div>
                <label className="block mb-2 font-medium">Ngày tháng năm sinh</label>
                {isEditMode ? (
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/yyyy"
                      value={dobInput}
                      onChange={(e) => setDobInput(e.target.value)}
                      onBlur={() => {
                        const normalized = normalizeDobInput(dobInput);
                        handleInputChange('dob', normalized);
                        setDobInput(normalized ? formatDob(normalized) : '');
                      }}
                      className="w-full border rounded pl-10 pr-4 py-2"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formatDob(profile.dob)}
                    className="w-full border rounded px-4 py-2"
                    readOnly
                  />
                )}
              </div>
            </form>
            <div className="mt-8 flex gap-4">
              {!isEditMode ? (
                <button 
                  onClick={handleEditToggle}
                  className="px-8 py-2 bg-[#9e211f] text-white rounded font-semibold flex items-center gap-2"
                >
                  <FaEdit /> Sửa thông tin
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="px-8 py-2 bg-green-600 text-white rounded font-semibold"
                  >
                    {loading ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                  <button 
                    onClick={handleEditToggle}
                    className="px-8 py-2 bg-gray-500 text-white rounded font-semibold"
                  >
                    Hủy
                  </button>
                </>
              )}
            </div>
            <div className="mt-12 max-w-3xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-[#9e211f] text-3xl font-bold mb-8">Địa chỉ giao hàng</label>
                <button
                  type="button"
                  onClick={handleToggleAddressForm}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#9e211f] text-[#9e211f] font-semibold hover:bg-[#9e211f] hover:text-white transition"
                >
                  <FaPlus size={14} /> {showAddressForm ? 'Đóng' : 'Thêm địa chỉ'}
                </button>
              </div>

              {profile.addresses && profile.addresses.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {profile.addresses.map((addr, idx) => {
                    const key = addr.id || addr.addressId || addr.shippingAddressId || idx;
                    const receiverName = addr.contactName || addr.name || profile.name;
                    const phoneDisplay = addr.contactPhone || addr.phone || profile.phone;
                    const addressLine = addr.fullAddress
                      || addr.line1
                      || [addr.detailAddress || addr.address, addr.ward, addr.district, addr.province]
                        .filter(Boolean)
                        .join(', ');
                    const addressLine2 = addr.line2;
                    return (
                      <li
                        key={key}
                        className="border rounded px-4 py-3 bg-white flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-[#9e211f]">{receiverName}</p>
                          <p className="text-sm text-gray-500">{phoneDisplay}</p>
                          <p className="text-sm text-gray-700 mt-1">
                            {addressLine || 'Chưa có địa chỉ chi tiết'}
                          </p>
                          {addressLine2 && (
                            <p className="text-sm text-gray-500">{addressLine2}</p>
                          )}
                          {/* Địa chỉ chi tiết đã chứa tỉnh/thành, bỏ dòng province riêng để tránh lặp */}
                        </div>
                        <div className="flex flex-col gap-2 items-start md:items-end">
                          {addr.isDefault && (
                            <span className="text-xs uppercase bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold self-start md:self-auto">
                              Mặc định
                            </span>
                          )}
                          <div className="flex gap-3">
                            <button
                              type="button"
                              className="text-sm font-semibold text-[#9e211f] hover:underline"
                              onClick={() => {
                                setEditingAddressId(addr.id);
                                setShowAddressForm(true);
                                setNewAddress({
                                  ...addressFormDefaults,
                                  name: addr.contactName || addr.name || '',
                                  phone: addr.contactPhone || addr.phone || '',
                                  provinceId: addr.ghnProvinceId || '',
                                  districtId: addr.ghnDistrictId || '',
                                  wardCode: addr.ghnWardCode || '',
                                  province: '',
                                  district: '',
                                  ward: '',
                                  detailAddress: addr.line1 || '',
                                  detailAddress2: addr.line2 || '',
                                  isDefault: Boolean(addr.isDefault),
                                });
                                loadProvinces().then((data) => {
                                  const provinceName = (data || []).find((p) => p.ProvinceID === addr.ghnProvinceId)?.ProvinceName || '';
                                  setNewAddress((prev) => ({ ...prev, province: provinceName }));
                                  if (addr.ghnProvinceId) {
                                    loadDistricts(addr.ghnProvinceId).then((districtData) => {
                                      const districtName = (districtData || []).find((d) => d.DistrictID === addr.ghnDistrictId)?.DistrictName || '';
                                      setNewAddress((prev) => ({ ...prev, district: districtName }));
                                      if (addr.ghnDistrictId) {
                                        loadWards(addr.ghnDistrictId).then((wardData) => {
                                          const wardName = (wardData || []).find((w) => w.WardCode === addr.ghnWardCode)?.WardName || '';
                                          setNewAddress((prev) => ({ ...prev, ward: wardName }));
                                        });
                                      }
                                    });
                                  }
                                });
                              }}
                            >
                              Xem / Sửa
                            </button>
                            <button
                              type="button"
                              className="text-sm font-semibold text-red-500 hover:underline disabled:opacity-50"
                              onClick={() => {
                                if (!addr.id) return;
                                setDeleteAddressId(addr.id);
                              }}
                            >
                                Xóa
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-4 text-gray-500">Chưa có địa chỉ nào</div>
              )}

              {showAddressForm && (
                <div className="mt-6 p-4 border rounded-lg bg-white shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Họ tên người nhận</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={newAddress.name}
                        onChange={(e) => handleAddressFieldChange('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={newAddress.phone}
                        onChange={(e) => handleAddressFieldChange('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố</label>
                      <select
                        className="w-full border rounded px-3 py-2 bg-white"
                        value={newAddress.provinceId || ''}
                        onChange={(e) => handleProvinceSelect(e.target.value)}
                        disabled={loadingProvinces && provinces.length === 0}
                      >
                        <option value="">
                          {loadingProvinces && provinces.length === 0
                            ? 'Đang tải tỉnh/thành phố...'
                            : 'Chọn tỉnh/thành phố'}
                        </option>
                        {provinces.map((province) => (
                          <option key={province.ProvinceID} value={province.ProvinceID}>
                            {province.ProvinceName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Quận/Huyện</label>
                      <select
                        className="w-full border rounded px-3 py-2 bg-white"
                        value={newAddress.districtId || ''}
                        onChange={(e) => handleDistrictSelect(e.target.value)}
                        disabled={!newAddress.provinceId || loadingDistricts}
                      >
                        <option value="">
                          {!newAddress.provinceId
                            ? 'Vui lòng chọn tỉnh/thành phố trước'
                            : loadingDistricts
                              ? 'Đang tải quận/huyện...'
                              : 'Chọn quận/huyện'}
                        </option>
                        {districts.map((district) => (
                          <option key={district.DistrictID} value={district.DistrictID}>
                            {district.DistrictName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phường/Xã</label>
                      <select
                        className="w-full border rounded px-3 py-2 bg-white"
                        value={newAddress.wardCode || ''}
                        onChange={(e) => handleWardSelect(e.target.value)}
                        disabled={!newAddress.districtId || loadingWards}
                      >
                        <option value="">
                          {!newAddress.districtId
                            ? 'Vui lòng chọn quận/huyện trước'
                            : loadingWards
                              ? 'Đang tải phường/xã...'
                              : 'Chọn phường/xã'}
                        </option>
                        {wards.map((ward) => (
                          <option key={ward.WardCode} value={ward.WardCode}>
                            {ward.WardName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Địa chỉ chi tiết</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={newAddress.detailAddress}
                        onChange={(e) => handleAddressFieldChange('detailAddress', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Địa chỉ chi tiết 2 (nếu có)</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={newAddress.detailAddress2}
                        onChange={(e) => handleAddressFieldChange('detailAddress2', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="address-default"
                      checked={
                        Boolean(newAddress.isDefault)
                        || (!profile?.addresses?.length && !editingAddressId)
                      }
                      onChange={(e) => handleDefaultToggle(e.target.checked)}
                    />
                    <label htmlFor="address-default" className="text-sm">Đặt làm địa chỉ mặc định</label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded border"
                      onClick={handleToggleAddressForm}
                      disabled={savingAddress}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-[#9e211f] text-white font-semibold"
                      onClick={handleAddAddress}
                      disabled={savingAddress}
                    >
                      {savingAddress ? 'Đang lưu...' : 'Lưu địa chỉ'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : activeSection === 'wishlist' ? (
          <div>
            <h2 className="text-[#9e211f] text-3xl font-bold mb-8">Sản phẩm đã thích</h2>
            {wishlistLoading ? (
              <p>Đang tải danh sách...</p>
            ) : wishlist.length === 0 ? (
              <p className="text-gray-600">Chưa có sản phẩm yêu thích.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlist.map((item, idx) => {
                  const product = item.product || item;
                  const id = product.id || product.productId || item.productId || idx;
                  return (
                    <ProductCard
                      key={id}
                      image={product.imageUrl || product.thumbnail || '/images/default-product.png'}
                      title={product.name || product.title || 'Sản phẩm'}
                      shortDescription={product.shortDescription || product.description || ''}
                      price={Number(product.price) || 0}
                      rating={product.rating || 0}
                      stock={product.stock}
                      shopName={product.shopName || product.displayName || ''}
                      onClick={() => window.location.assign(`/product-detail/${product.id || product.productId}`)}
                      onToggleWishlist={async () => {
                        try {
                          const wishItemId = item.wishListItemId || item.id;
                          if (wishItemId) {
                            await WishlistService.remove(wishItemId);
                          }
                          toast.success('Đã xoá khỏi yêu thích');
                          loadWishlist();
                        } catch (err) {
                          toast.error(err?.response?.data?.message || 'Không thể xoá sản phẩm yêu thích.');
                        }
                      }}
                      isWished
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : activeSection === 'changePassword' ? (
          <ChangePasswordSection email={profile.email} />
        ) : activeSection === 'artisanRegistration' ? (
          <>
            {applicationInfo && (
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl space-y-6 mb-8">
                <div className="p-4 bg-[#FFF8E7] border border-[#EFD8B1] rounded-xl">
                  <h3 className="text-lg font-semibold text-[#8B4513] mb-3">Đơn đã gửi trước đó</h3>
                  <p className="text-sm text-gray-600">
                    Bạn chỉ có thể gửi một đơn tại một thời điểm. Nếu đơn bị từ chối, bạn có thể nộp lại đơn mới.
                  </p>
                  <div className="mt-4 border border-dashed border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex flex-wrap justify-between text-sm text-gray-700 gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">Mã đơn gần nhất</p>
                        <p>{applicationInfo.id}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Trạng thái</p>
                        {(() => {
                          const meta = getApplicationStatusMeta(applicationInfo.status);
                          return (
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                              {meta.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Ngày gửi</p>
                        <p>
                          {applicationInfo.createdAt
                            ? new Date(applicationInfo.createdAt).toLocaleDateString('vi-VN')
                            : '--'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {applicationInfo.status === 'REJECTED' && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                      <p className="font-semibold">Lý do từ chối:</p>
                      <p>{applicationInfo.rejectReason || 'Hãy liên hệ quản trị viên để biết thêm chi tiết.'}</p>
                    </div>
                  )}
                </div>

                {applicationInfo.status !== 'REJECTED' && (
                  <>
                    <h2 className="text-[#9e211f] text-3xl font-bold mb-6">Trạng thái đơn đăng ký</h2>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {(() => {
                        const meta = getApplicationStatusMeta(applicationInfo.status);
                        return (
                          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${meta.color}`}>
                            {meta.label}
                          </span>
                        );
                      })()}
                      <span className="text-sm text-gray-500">
                        Mã đơn: <strong>{applicationInfo.id}</strong>
                      </span>
                    </div>
                    <p className="text-gray-600 mb-5">
                      {getApplicationStatusMeta(applicationInfo.status).description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <p className="font-semibold text-gray-900">Họ và tên</p>
                        <p>{applicationInfo.fullName || '--'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Số điện thoại</p>
                        <p>{applicationInfo.phoneNumber || '--'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Email</p>
                        <p>{applicationInfo.email || '--'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Kinh nghiệm</p>
                        <p>{applicationInfo.yearsOfExperience || 0} năm</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Tên shop</p>
                        <p>{applicationInfo.shopName || 'Chưa cập nhật'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Ngày gửi</p>
                        <p>
                          {applicationInfo.createdAt
                            ? new Date(applicationInfo.createdAt).toLocaleDateString('vi-VN')
                            : '--'}
                        </p>
                      </div>
                    </div>
                    {applicationInfo.adminNote && (
                      <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                        <p className="font-semibold">Ghi chú từ quản trị viên:</p>
                        <p>{applicationInfo.adminNote}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {loadingApplication ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-3">
                <FaSpinner className="animate-spin text-2xl text-[#9e211f]" />
                <p>Đang kiểm tra trạng thái đơn đăng ký...</p>
              </div>
            ) : applicationInfo && applicationInfo.status !== 'REJECTED' ? null : (
              <ArtisanRegistrationForm
                isOpen
                onClose={() => setActiveSection('info')}
                onSuccess={() => {
                  toast.success('Đơn đăng ký được gửi thành công!');
                  loadApplicationInfo();
                  setActiveSection('info');
                }}
              />
            )}
          </>
        ) : null}
      </main>

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] p-4">
            <button 
              className="absolute top-2 right-2 text-white hover:text-gray-300 text-3xl"
              onClick={() => setShowImageModal(false)}
            >
              ×
            </button>
            <img
              src={profile.userUrlImage || '/images/default-avatar.png'}
              alt="User Avatar Full Size"
              className="max-w-full max-h-[85vh] object-contain rounded"
            />
          </div>
        </div>
      )}
      {deleteAddressId && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Xoa dia chi</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setDeleteAddressId(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-gray-700">
                Ban co chac muon xoa dia chi nay? Hanh dong nay khong the hoan tac.
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                onClick={() => setDeleteAddressId(null)}
              >
                Huy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                onClick={async () => {
                  try {
                    await UserService.deleteAddress(deleteAddressId);
                    toast.success('Xoa dia chi thanh cong');
                    await refreshUserProfile();
                  } catch (err) {
                    console.error('Delete address error:', err);
                    const message =
                      err?.response?.data?.message
                      || err?.message
                      || 'Khong the xoa dia chi.';
                    toast.error(message);
                  } finally {
                    setDeleteAddressId(null);
                  }
                }}
                
              >
                Xoa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSection;

