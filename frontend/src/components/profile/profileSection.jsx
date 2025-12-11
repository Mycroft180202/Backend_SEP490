import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
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
import { LanguageContext } from '../../context/LanguageContext';

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

const HIDDEN_PROVINCE_IDS = new Set([2002, 298, 290, 286]);
const HIDDEN_PROVINCE_NAMES = new Set([
  'hà nội 02',
  'test - alert - tỉnh - 001',
  'ngoc test',
  'test',
]);

const MAX_AGE_YEARS = 120;

const buildValidDate = (year, month, day) => {
  if (
    !Number.isInteger(year)
    || !Number.isInteger(month)
    || !Number.isInteger(day)
    || month < 1
    || month > 12
    || day < 1
    || day > 31
  ) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

const parseDobToFields = (value) => {
  if (!value) {
    return { day: '', month: '', year: '' };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { day: '', month: '', year: '' };
  }
  const pad = (v) => v.toString().padStart(2, '0');
  return {
    day: pad(date.getDate()),
    month: pad(date.getMonth() + 1),
    year: date.getFullYear().toString(),
  };
};

const isAgeWithinLimit = (date) => {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  if (age < 0) {
    return false;
  }
  return age <= MAX_AGE_YEARS;
};

const evaluateDobFields = ({ day, month, year }) => {
  const trimmedDay = (day || '').trim();
  const trimmedMonth = (month || '').trim();
  const trimmedYear = (year || '').trim();

  if (!trimmedDay && !trimmedMonth && !trimmedYear) {
    return { status: 'empty', iso: '' };
  }

  if (trimmedDay.length !== 2 || trimmedMonth.length !== 2 || trimmedYear.length !== 4) {
    return { status: 'invalid' };
  }

  const numericDay = Number(trimmedDay);
  const numericMonth = Number(trimmedMonth);
  const numericYear = Number(trimmedYear);

  if (
    !Number.isInteger(numericDay)
    || !Number.isInteger(numericMonth)
    || !Number.isInteger(numericYear)
  ) {
    return { status: 'invalid' };
  }

  const date = buildValidDate(numericYear, numericMonth, numericDay);
  if (!date) {
    return { status: 'invalid' };
  }

  if (!isAgeWithinLimit(date)) {
    return { status: 'age' };
  }

  return { status: 'valid', iso: date.toISOString(), date };
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

// Component đổi mật khẩu
function ChangePasswordSection({ email }) {
  const { t } = useContext(LanguageContext);
  const translate = useCallback(
    (key, fallback, replacements) => {
      const value = t(key, replacements);
      return value === key ? fallback : value;
    },
    [t],
  );
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const stepItems = [
    {
      id: 1,
      title: translate('profile.changePassword.step.emailTitle', 'Xác nhận email'),
      description: translate('profile.changePassword.step.emailDescription', 'Nhận mã OTP qua email đã đăng ký'),
    },
    {
      id: 2,
      title: translate('profile.changePassword.step.resetTitle', 'Đặt lại mật khẩu'),
      description: translate('profile.changePassword.step.resetDescription', 'Nhập mã OTP và mật khẩu mới an toàn'),
    },
  ];

  const handleBackToStart = () => {
    setStep(1);
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const response = await AuthService.sendOtp(email);
      toast.success(response?.message || translate('profile.changePassword.otpSent', 'OTP đã được gửi tới email của bạn.'));
      setStep(2);
    } catch (error) {
      toast.error(error?.response?.data?.message || translate('profile.changePassword.emailNotFound', 'Email không tồn tại trong hệ thống.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otpCode) {
      toast.error(translate('profile.changePassword.otpRequired', 'Vui lòng nhập mã OTP.'));
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error(translate('profile.changePassword.passwordRequired', 'Vui lòng điền đầy đủ mật khẩu.'));
      return;
    }
        if (newPassword !== confirmPassword) {
      toast.error(translate('profile.changePassword.passwordMismatch', 'Mật khẩu xác nhận không khớp.'));
      return;
    }
    const strongPassword = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
    if (!strongPassword.test(newPassword)) {
      toast.error(translate('profile.changePassword.passwordRule', 'Mật khẩu phải có ≥ 6 ký tự, ít nhất 1 chữ viết hoa và 1 ký tự đặc biệt.'));
      return;
    }
    setLoading(true);
    try {
      const response = await AuthService.resetPassword({ email, otpCode, newPassword });
      toast.success(response?.message || translate('profile.changePassword.resetSuccess', 'Mật khẩu đã được thay đổi thành công.'));
      setStep(1);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error?.response?.data?.message || translate('profile.changePassword.otpInvalid', 'Mã OTP không hợp lệ hoặc đã hết hạn.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-amber-50 blur-3xl opacity-70" />
      <div className="rounded-3xl border border-white/60 bg-white/90 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-10 p-8 md:p-12">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-primary md:text-4xl">
              {translate('profile.changePassword.title', 'Đổi mật khẩu')}
            </h2>
            <p className="text-sm text-gray-600 md:text-base">
              {translate(
                'profile.changePassword.helperText',
                'Bảo vệ tài khoản của bạn bằng cách đặt lại mật khẩu khi cần. Chúng tôi sẽ gửi mã OTP tới email đăng ký để xác thực.',
              )}
            </p>
          </div>

          <ol className="grid gap-4 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-inner sm:grid-cols-2">
            {stepItems.map((item) => {
              const isActive = item.id === step;
              const isCompleted = item.id < step;
              return (
                <li
                  key={item.id}
                  className={`flex flex-col gap-2 rounded-xl border p-4 transition-colors ${
                    isActive
                      ? 'border-primary/80 bg-primary/5 shadow'
                      : isCompleted
                        ? 'border-emerald-200 bg-emerald-50/60'
                        : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-full text-sm font-semibold ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isActive
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? <FaLock className="h-4 w-4" /> : item.id}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 md:text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {step === 1 && (
            <div className="grid gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  {translate('profile.changePassword.emailLabel', 'Email nhận OTP')}
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3">
                  <div className="rounded-xl bg-white/80 p-2 text-primary">
                    <FaEnvelope />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-gray-900">{email}</span>
                    <span className="text-xs text-gray-500">
                      {translate('profile.changePassword.emailHint', 'OTP sẽ được gửi tới địa chỉ email này.')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className={`group inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg transition-all ${
                  loading ? 'cursor-not-allowed opacity-70' : 'hover:-translate-y-0.5 hover:bg-[#7a1a18]'
                }`}
              >
                <FaPaperPlane className="text-lg" />
                {loading
                  ? translate('profile.common.sending', 'Đang gửi...')
                  : translate('profile.changePassword.sendOtp', 'Gửi mã OTP')}
              </button>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
                <p className="font-semibold">
                  {translate('profile.changePassword.noticeTitle', 'Lưu ý bảo mật')}
                </p>
                <p>
                  {translate('profile.changePassword.noticeContent', 'Mã OTP chỉ có hiệu lực trong 5 phút. Không chia sẻ mã cho bất kỳ ai để bảo vệ tài khoản của bạn.')}
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {translate('profile.changePassword.resetHeading', 'Xác thực OTP & tạo mật khẩu mới')}
                </h3>
                <button
                  type="button"
                  onClick={handleBackToStart}
                  className="text-sm font-semibold text-primary hover:text-[#7a1a18]"
                >
                  {translate('profile.changePassword.backToEmail', 'Gửi lại OTP')}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {translate('profile.changePassword.otpLabel', 'Mã OTP')}
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <FaKey className="text-gray-400" />
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none"
                      placeholder={translate('profile.changePassword.otpPlaceholder', 'Nhập mã OTP trong email')}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {translate('profile.changePassword.newPasswordLabel', 'Mật khẩu mới')}
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <FaLock className="text-gray-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none"
                      placeholder={translate('profile.changePassword.newPasswordPlaceholder', 'Tối thiểu 6 ký tự, có chữ in hoa & ký tự đặc biệt')}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {translate('profile.changePassword.confirmPasswordLabel', 'Xác nhận mật khẩu')}
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <FaLock className="text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none"
                      placeholder={translate('profile.changePassword.confirmPasswordPlaceholder', 'Nhập lại mật khẩu mới')}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-700">
                <p className="font-semibold">
                  {translate('profile.changePassword.passwordGuideTitle', 'Gợi ý mật khẩu mạnh')}
                </p>
                <ul className="list-disc pl-5">
                  <li>{translate('profile.changePassword.passwordGuideLength', 'Tối thiểu 6 ký tự')}</li>
                  <li>{translate('profile.changePassword.passwordGuideUpper', 'Có ít nhất một chữ cái viết hoa')}</li>
                  <li>{translate('profile.changePassword.passwordGuideSpecial', 'Chứa ký tự đặc biệt như !, @, #, ...')}</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className={`inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all ${
                  loading ? 'cursor-not-allowed opacity-70' : 'hover:-translate-y-0.5 hover:bg-emerald-700'
                }`}
              >
                <FaLock className="text-lg" />
                {loading
                  ? translate('profile.common.processing', 'Đang xử lý...')
                  : translate('profile.changePassword.submit', 'Đổi mật khẩu')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component ProfileSection
function ProfileSection({ initialFocus, profileNode }) {
  const { t } = useContext(LanguageContext);
  const translate = useCallback(
    (key, fallback, replacements) => {
      const value = t(key, replacements);
      return value === key ? fallback : value;
    },
    [t],
  );
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
  const [dobFields, setDobFields] = useState({ day: '', month: '', year: '' });
  const [dobInvalid, setDobInvalid] = useState(false);
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
  const dayInputRef = useRef(null);
  const monthInputRef = useRef(null);
  const yearInputRef = useRef(null);
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
    setDobFields(parseDobToFields(mergedProfile.dob));
    setDobInvalid(false);
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

  const getApplicationStatusMeta = useCallback((status) => {
    const normalized = (status || '').toUpperCase();
    const statusMap = {
      PENDING: {
        labelKey: 'profile.artisanApplication.status.pending.label',
        descriptionKey: 'profile.artisanApplication.status.pending.description',
        fallbackLabel: 'Chờ duyệt',
        fallbackDescription: 'Đơn đăng ký của bạn đang được đội ngũ quản trị xem xét. Vui lòng đợi thêm.',
        color: 'bg-yellow-100 text-yellow-800',
      },
      APPROVED: {
        labelKey: 'profile.artisanApplication.status.approved.label',
        descriptionKey: 'profile.artisanApplication.status.approved.description',
        fallbackLabel: 'Đã duyệt',
        fallbackDescription: 'Đơn đăng ký đã được chấp nhận. Bạn có thể bắt đầu quản lý cửa hàng của mình.',
        color: 'bg-green-100 text-green-800',
      },
      DONE: {
        labelKey: 'profile.artisanApplication.status.approved.label',
        descriptionKey: 'profile.artisanApplication.status.approved.description',
        fallbackLabel: 'Đã duyệt',
        fallbackDescription: 'Đơn đăng ký đã được chấp nhận. Bạn có thể bắt đầu quản lý cửa hàng của mình.',
        color: 'bg-green-100 text-green-800',
      },
      REJECTED: {
        labelKey: 'profile.artisanApplication.status.rejected.label',
        descriptionKey: 'profile.artisanApplication.status.rejected.description',
        fallbackLabel: 'Đã từ chối',
        fallbackDescription: 'Đơn đăng ký đã bị từ chối. Vui lòng xem lý do và liên hệ hỗ trợ nếu cần.',
        color: 'bg-red-100 text-red-800',
      },
      UNKNOWN: {
        labelKey: 'profile.artisanApplication.status.unknown.label',
        descriptionKey: 'profile.artisanApplication.status.unknown.description',
        fallbackLabel: 'Không xác định',
        fallbackDescription: '',
        color: 'bg-gray-100 text-gray-800',
      },
    };

    const meta = statusMap[normalized] || statusMap.UNKNOWN;

    return {
      label: translate(meta.labelKey, meta.fallbackLabel),
      color: meta.color,
      description: translate(meta.descriptionKey, meta.fallbackDescription),
    };
  }, [translate]);

  const loadProvinces = useCallback(async () => {
    try {
      setLoadingProvinces(true);
      const data = await GHNLocationService.getProvinces();
      const sanitized = (Array.isArray(data) ? data : []).filter((province) => {
        const id = Number(province?.ProvinceID);
        const name = String(province?.ProvinceName || '').toLowerCase().trim();
        return !HIDDEN_PROVINCE_IDS.has(id) && !HIDDEN_PROVINCE_NAMES.has(name);
      });
      setProvinces(sanitized);
      return sanitized;
    } catch (err) {
      console.error('Load provinces error:', err);
      toast.error(translate('profile.address.loadProvincesError', 'Không thể tải danh sách tỉnh/thành.'));
      setProvinces([]);
      return [];
    } finally {
      setLoadingProvinces(false);
    }
  }, [translate]);

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
      toast.error(translate('profile.address.loadDistrictsError', 'Không thể tải danh sách quận/huyện.'));
      setDistricts([]);
      return [];
    } finally {
      setLoadingDistricts(false);
    }
  }, [translate]);

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
      toast.error(translate('profile.address.loadWardsError', 'Không thể tải danh sách phường/xã.'));
      setWards([]);
      return [];
    } finally {
      setLoadingWards(false);
    }
  }, [translate]);

  useEffect(() => {

    const fetchUser = async () => {

      try {

        setLoading(true);

        await refreshUserProfile();

      } catch (err) {

        setError(translate('profile.errors.fetchUser', 'Không thể lấy thông tin người dùng.'));

      } finally {

        setLoading(false);

      }

    };

    fetchUser();

  }, [refreshUserProfile, translate]);

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

  useEffect(() => {
    if (!initialFocus) {
      return;
    }
    if (initialFocus === 'wishlist') {
      setActiveSection('wishlist');
      return;
    }
    if (initialFocus === 'changePassword') {
      setActiveSection('changePassword');
      return;
    }
    if (initialFocus === 'artisanRegistration') {
      setActiveSection('artisanRegistration');
      return;
    }
    if (initialFocus === 'addresses') {
      setActiveSection('info');
      setShowAddressForm(true);
      setEditingAddressId(null);
      setNewAddress(() => ({ ...addressFormDefaults }));
      setDistricts([]);
      setWards([]);
    }
  }, [initialFocus]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(translate('profile.avatar.sizeError', 'Kích thước ảnh không được vượt quá 5MB'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(translate('profile.avatar.typeError', 'Vui lòng chọn file ảnh'));
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
      toast.success(translate('profile.avatar.updateSuccess', 'Cập nhật ảnh đại diện thành công!'));
    } catch (err) {
      console.error('Update avatar error:', err);
      toast.error(err?.response?.data?.message || translate('profile.avatar.updateError', 'Không thể cập nhật ảnh đại diện'));
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
      setDobFields(parseDobToFields(profile?.dob));
      setDobInvalid(false);
    } else {
      setDobFields(parseDobToFields((editedProfile || profile)?.dob));
      setDobInvalid(false);
      setTimeout(() => {
        if (dayInputRef.current) {
          dayInputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const handleDobFieldChange = (field, rawValue) => {
    const numeric = rawValue.replace(/\D/g, '');
    const maxLength = field === 'year' ? 4 : 2;
    const nextValue = numeric.slice(0, maxLength);

    setDobFields((prev) => {
      const updated = { ...prev, [field]: nextValue };
      return updated;
    });
    setDobInvalid(false);

    if (field === 'day' && nextValue.length === maxLength) {
      monthInputRef.current?.focus();
    } else if (field === 'month' && nextValue.length === maxLength) {
      yearInputRef.current?.focus();
    }
  };

  const handleDobFieldKeyDown = (field, event) => {
    if (event.key !== 'Backspace') {
      return;
    }
    if (field === 'month' && !dobFields.month) {
      event.preventDefault();
      dayInputRef.current?.focus();
    } else if (field === 'year' && !dobFields.year) {
      event.preventDefault();
      monthInputRef.current?.focus();
    }
  };

  const handleDobBlur = (field) => {
    if (field !== 'year') {
      return;
    }

    const result = evaluateDobFields(dobFields);
    if (result.status === 'empty') {
      setDobInvalid(false);
      handleInputChange('dob', '');
      return;
    }

    if (result.status === 'valid') {
      setDobInvalid(false);
      handleInputChange('dob', result.iso);
      return;
    }

    setDobInvalid(true);
    handleInputChange('dob', '');
    const messageKey = result.status === 'age'
      ? 'profile.info.dobAgeLimit'
      : 'profile.info.dobInvalid';
    const fallback = result.status === 'age'
      ? 'Ngày sinh vượt quá giới hạn tuổi cho phép.'
      : 'Ngày sinh không hợp lệ.';
    toast.error(translate(messageKey, fallback));
    setTimeout(() => {
      yearInputRef.current?.focus();
    }, 0);
  };

  const handleSaveProfile = async () => {
    const dobEvaluation = evaluateDobFields(dobFields);
    if (dobEvaluation.status === 'invalid') {
      setDobInvalid(true);
      toast.error(translate('profile.info.dobInvalid', 'Ngày sinh không hợp lệ.'));
      dayInputRef.current?.focus();
      return;
    }
    if (dobEvaluation.status === 'age') {
      setDobInvalid(true);
      toast.error(translate('profile.info.dobAgeLimit', 'Ngày sinh vượt quá giới hạn tuổi cho phép.'));
      yearInputRef.current?.focus();
      return;
    }

    const dobValue = dobEvaluation.status === 'valid' ? dobEvaluation.iso : '';
    handleInputChange('dob', dobValue);
    setDobInvalid(false);

    try {
      setLoading(true);
      const updateData = {
        PhoneNumber: editedProfile.phone,
        DisplayName: editedProfile.name,
        Dob: dobValue,
        // Không gửi UserUrlImage khi chỉ update thông tin text
      };

      await AuthService.updateProfile(updateData);
      await refreshUserProfile();
      setIsEditMode(false);
      toast.success(translate('profile.info.updateSuccess', 'Cập nhật thông tin thành công!'));
    } catch (err) {
      console.error('Lỗi khi cập nhật thông tin:', err);
      toast.error(err.message || translate('profile.info.updateError', 'Không thể cập nhật thông tin'));
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
      toast.info(translate('profile.address.singleDefaultNotice', 'Bạn chỉ có một địa chỉ, địa chỉ này sẽ được đặt làm mặc định.'));
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
      toast.error(translate('profile.address.validation.missingFields', 'Vui lòng chọn đầy đủ tỉnh, quận, phường và nhập địa chỉ chi tiết.'));
      return;
    }

    const districtId = Number(districtIdValue);
    const provinceId = Number(provinceIdValue);
    if (Number.isNaN(districtId) || Number.isNaN(provinceId)) {
      toast.error(translate('profile.address.validation.invalidProvinceDistrict', 'Mã tỉnh hoặc quận không hợp lệ.'));
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
        toast.success(translate('profile.address.updateSuccess', 'Cập nhật địa chỉ thành công!'));
      } else {
          await UserService.addAddress(payload);
          toast.success(translate('profile.address.createSuccess', 'Thêm địa chỉ thành công!'));
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
      toast.error(message || translate('profile.address.saveError', 'Không thể lưu địa chỉ.'));
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
        <p className="text-[#9E211F] font-semibold text-lg font-['Nunito']">{translate('profile.loading.title', 'Đang tải thông tin...')}</p>
        <p className="text-sm text-gray-600 mt-1 font-['Nunito']">{translate('profile.loading.subtitle', 'Vui lòng chờ trong giây lát')}</p>
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
                  <span className="text-xs">{translate('profile.avatar.view', 'Xem ảnh')}</span>
                </div>
              </div>
              {/* Bottom half - Change image */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-1/2 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer transition-all hover:bg-opacity-70"
                onClick={handleAvatarClick}
              >
                <div className="text-white text-center">
                  <FaCamera className="mx-auto mb-1" size={20} />
                  <span className="text-xs">{translate('profile.avatar.change', 'Đổi ảnh')}</span>
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
              <FaUserCircle /> {translate('profile.sidebar.accountInfo', 'Thông tin tài khoản')}
            </li>
            <li 
              className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]"
              onClick={() => navigate('/order-history', {
                state: {
                  fromProfile: profileNode || {
                    label: translate('header.profile', 'Hồ sơ của tôi'),
                    href: '/profile',
                  },
                },
              })}
            >
              <FaHistory /> {translate('profile.sidebar.orderHistory', 'Lịch sử mua hàng')}
            </li>
            <li
              className={`flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f] ${activeSection === 'wishlist' ? 'text-[#9e211f]' : ''}`}
              onClick={() => {
                setActiveSection('wishlist');
                loadWishlist();
              }}
            >
              <FaHeart /> {translate('profile.sidebar.wishlist', 'Sản phẩm đã thích')}
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
              {isArtisan
                ? translate('profile.sidebar.artisanShop', 'Cửa hàng của tôi')
                : translate('profile.sidebar.artisanRegister', 'Đăng ký làm người bán hàng')}
            </li>
            <li
              className={`flex items-center gap-2 cursor-pointer ${activeSection === 'changePassword' ? 'text-[#9e211f]' : 'text-gray-600 hover:text-[#9e211f]'}`}
              onClick={() => setActiveSection('changePassword')}
            >
              <FaLock /> {translate('profile.sidebar.changePassword', 'Đổi mật khẩu')}
            </li>
            <li className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]">
              <FaSignOutAlt /> {translate('profile.sidebar.logout', 'Đăng xuất')}
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-16 py-12">
        {activeSection === 'info' ? (
          <React.Fragment>
            <h2 className="text-[#9e211f] text-3xl font-bold mb-8">{translate('profile.info.title', 'Thông tin tài khoản')}</h2>
            <form className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-2xl">
              <div>
                <label className="block mb-2 font-medium">{translate('profile.info.nameLabel', 'Tên')}</label>
                <input 
                  type="text" 
                  value={isEditMode ? editedProfile.name : profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full border rounded px-4 py-2" 
                  readOnly={!isEditMode}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">{translate('profile.info.phoneLabel', 'Số điện thoại')}</label>
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
                <label className="block mb-2 font-medium">{translate('profile.info.emailLabel', 'Email')}</label>
                <div className="flex items-center border rounded px-4 py-2 bg-white">
                  <FaUserCircle className="mr-2 text-gray-400" />
                  <span>{profile.email}</span>
                </div>
              </div>
              <div>
                <label className="block mb-2 font-medium">{translate('profile.info.usernameLabel', 'Tên đăng nhập')}</label>
                <input type="text" value={profile.username} className="w-full border rounded px-4 py-2" readOnly />
              </div>
              <div>
                <label className="block mb-2 font-medium">{translate('profile.info.dobLabel', 'Ngày tháng năm sinh')}</label>
                {isEditMode ? (
                  <div className={`relative flex items-center gap-2 w-full rounded pl-10 pr-4 py-2 bg-white border focus-within:border-[#9e211f] ${dobInvalid ? 'border-red-500' : 'border-gray-300'}`}>
                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={dayInputRef}
                      type="text"
                      inputMode="numeric"
                      placeholder={translate('profile.info.dobDayPlaceholder', 'dd')}
                      value={dobFields.day}
                      onChange={(e) => handleDobFieldChange('day', e.target.value)}
                      onKeyDown={(e) => handleDobFieldKeyDown('day', e)}
                      className="w-12 text-center outline-none bg-transparent"
                      maxLength={2}
                    />
                    <span className="text-gray-400">/</span>
                    <input
                      ref={monthInputRef}
                      type="text"
                      inputMode="numeric"
                      placeholder={translate('profile.info.dobMonthPlaceholder', 'mm')}
                      value={dobFields.month}
                      onChange={(e) => handleDobFieldChange('month', e.target.value)}
                      onKeyDown={(e) => handleDobFieldKeyDown('month', e)}
                      className="w-12 text-center outline-none bg-transparent"
                      maxLength={2}
                    />
                    <span className="text-gray-400">/</span>
                    <input
                      ref={yearInputRef}
                      type="text"
                      inputMode="numeric"
                      placeholder={translate('profile.info.dobYearPlaceholder', 'yyyy')}
                      value={dobFields.year}
                      onChange={(e) => handleDobFieldChange('year', e.target.value)}
                      onKeyDown={(e) => handleDobFieldKeyDown('year', e)}
                      onBlur={() => handleDobBlur('year')}
                      className="w-16 text-center outline-none bg-transparent"
                      maxLength={4}
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
                  <FaEdit /> {translate('profile.info.editButton', 'Sửa thông tin')}
                </button>
              ) : (
                <React.Fragment>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="px-8 py-2 bg-green-600 text-white rounded font-semibold"
                  >
                    {loading
                      ? translate('profile.common.saving', 'Đang lưu...')
                      : translate('profile.info.saveButton', 'Lưu thông tin')}
                  </button>
                  <button 
                    onClick={handleEditToggle}
                    className="px-8 py-2 bg-gray-500 text-white rounded font-semibold"
                  >
                    {translate('profile.common.cancel', 'Hủy')}
                  </button>
                </React.Fragment>
              )}
            </div>
            <div className="mt-12 max-w-3xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-[#9e211f] text-3xl font-bold mb-8">
                  {translate('profile.address.title', 'Địa chỉ giao hàng')}
                </label>
                <button
                  type="button"
                  onClick={handleToggleAddressForm}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#9e211f] text-[#9e211f] font-semibold hover:bg-[#9e211f] hover:text-white transition"
                >
                  <FaPlus size={14} />
                  {showAddressForm
                    ? translate('profile.address.closeButton', 'Đóng')
                    : translate('profile.address.addButton', 'Thêm địa chỉ')}
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
                            {addressLine || translate('profile.address.detailFallback', 'Chưa có địa chỉ chi tiết')}
                          </p>
                          {addressLine2 && (
                            <p className="text-sm text-gray-500">{addressLine2}</p>
                          )}
                          {/* Địa chỉ chi tiết đã chứa tỉnh/thành, bỏ dòng province riêng để tránh lặp */}
                        </div>
                        <div className="flex flex-col gap-2 items-start md:items-end">
                          {addr.isDefault && (
                            <span className="text-xs uppercase bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold self-start md:self-auto">
                              {translate('profile.address.defaultBadge', 'Mặc định')}
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
                              {translate('profile.address.editButton', 'Xem / Sửa')}
                            </button>
                            <button
                              type="button"
                              className="text-sm font-semibold text-red-500 hover:underline disabled:opacity-50"
                              onClick={() => {
                                if (!addr.id) return;
                                setDeleteAddressId(addr.id);
                              }}
                            >
                                {translate('profile.address.deleteButton', 'Xóa')}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-4 text-gray-500">
                  {translate('profile.address.empty', 'Chưa có địa chỉ nào')}
                </div>
              )}

              {showAddressForm && (
                <div className="mt-6 p-4 border rounded-lg bg-white shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {translate('profile.address.form.recipientLabel', 'Họ tên người nhận')}
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={newAddress.name}
                        onChange={(e) => handleAddressFieldChange('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {translate('profile.address.form.phoneLabel', 'Số điện thoại')}
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={newAddress.phone}
                        onChange={(e) => handleAddressFieldChange('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {translate('profile.address.form.provinceLabel', 'Tỉnh/Thành phố')}
                      </label>
                      <select
                        className="w-full border rounded px-3 py-2 bg-white"
                        value={newAddress.provinceId || ''}
                        onChange={(e) => handleProvinceSelect(e.target.value)}
                        disabled={loadingProvinces && provinces.length === 0}
                      >
                        <option value="">
                          {loadingProvinces && provinces.length === 0
                            ? translate('profile.address.form.provinceLoading', 'Đang tải tỉnh/thành phố...')
                            : translate('profile.address.form.provincePlaceholder', 'Chọn tỉnh/thành phố')}
                        </option>
                        {provinces.map((province) => (
                          <option key={province.ProvinceID} value={province.ProvinceID}>
                            {province.ProvinceName}
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
                        value={newAddress.districtId || ''}
                        onChange={(e) => handleDistrictSelect(e.target.value)}
                        disabled={!newAddress.provinceId || loadingDistricts}
                      >
                        <option value="">
                          {!newAddress.provinceId
                            ? translate('profile.address.form.districtSelectProvince', 'Vui lòng chọn tỉnh/thành phố trước')
                            : loadingDistricts
                              ? translate('profile.address.form.districtLoading', 'Đang tải quận/huyện...')
                              : translate('profile.address.form.districtPlaceholder', 'Chọn quận/huyện')}
                        </option>
                        {districts.map((district) => (
                          <option key={district.DistrictID} value={district.DistrictID}>
                            {district.DistrictName}
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
                        value={newAddress.wardCode || ''}
                        onChange={(e) => handleWardSelect(e.target.value)}
                        disabled={!newAddress.districtId || loadingWards}
                      >
                        <option value="">
                          {!newAddress.districtId
                            ? translate('profile.address.form.wardSelectDistrict', 'Vui lòng chọn quận/huyện trước')
                            : loadingWards
                              ? translate('profile.address.form.wardLoading', 'Đang tải phường/xã...')
                              : translate('profile.address.form.wardPlaceholder', 'Chọn phường/xã')}
                        </option>
                        {wards.map((ward) => (
                          <option key={ward.WardCode} value={ward.WardCode}>
                            {ward.WardName}
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
                        value={newAddress.detailAddress}
                        onChange={(e) => handleAddressFieldChange('detailAddress', e.target.value)}
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
                    <label htmlFor="address-default" className="text-sm">
                      {translate('profile.address.form.defaultCheckbox', 'Đặt làm địa chỉ mặc định')}
                    </label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded border"
                      onClick={handleToggleAddressForm}
                      disabled={savingAddress}
                    >
                      {translate('profile.common.cancel', 'Hủy')}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-[#9e211f] text-white font-semibold"
                      onClick={handleAddAddress}
                      disabled={savingAddress}
                    >
                      {savingAddress
                        ? translate('profile.address.form.saving', 'Đang lưu...')
                        : translate('profile.address.form.saveButton', 'Lưu địa chỉ')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
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
          <React.Fragment>
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
                  <React.Fragment>
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
                  </React.Fragment>
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
          </React.Fragment>
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
              <h3 className="text-lg font-semibold text-gray-800">
                {translate('profile.address.deleteModal.title', 'Xóa địa chỉ')}
              </h3>
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
                {translate('profile.address.deleteModal.message', 'Bạn có chắc muốn xóa địa chỉ này? Hành động này không thể hoàn tác.')}
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                onClick={() => setDeleteAddressId(null)}
              >
                {translate('profile.address.deleteModal.cancel', 'Hủy')}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                onClick={async () => {
                  try {
                    await UserService.deleteAddress(deleteAddressId);
                    toast.success(translate('profile.address.deleteSuccess', 'Xóa địa chỉ thành công.'));
                    await refreshUserProfile();
                  } catch (err) {
                    console.error('Delete address error:', err);
                    const message =
                      err?.response?.data?.message
                      || err?.message;
                    toast.error(message || translate('profile.address.deleteError', 'Không thể xóa địa chỉ.'));
                  } finally {
                    setDeleteAddressId(null);
                  }
                }}
                
              >
                {translate('profile.address.deleteModal.confirm', 'Xóa')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSection;

