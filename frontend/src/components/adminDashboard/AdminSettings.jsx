import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FaCamera, FaLock, FaSave, FaTimes } from 'react-icons/fa';
import { UserContext } from '../../context/UserContext';
import { AuthService } from '../../services/modules/auth/authService';
import { normalizeVietnamPhone, sanitizeVietnamPhoneInput } from '../../utils/vietnamPhone';
import { validateStrongPassword } from '../../utils/passwordValidation';

const getDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (v) => v.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const dobInputToIso = (dateInputValue) => {
  if (!dateInputValue) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInputValue);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return '';
  }
  return date.toISOString();
};

const isDobValid = (dateInputValue) => {
  if (!dateInputValue) return true;
  const iso = dobInputToIso(dateInputValue);
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  if (date > now) return false;
  const age = now.getFullYear() - date.getFullYear()
    - (now.getMonth() < date.getMonth()
      || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())
      ? 1
      : 0);
  return age >= 0 && age <= 120;
};

const AdminSettings = () => {
  const { userInfo, updateUserInfo } = useContext(UserContext);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialForm = useMemo(() => ({
    displayName: userInfo?.displayName || userInfo?.fullName || '',
    email: userInfo?.email || '',
    username: userInfo?.username || '',
    phone: userInfo?.phoneNumber || '',
    dob: getDateInputValue(userInfo?.dob),
  }), [userInfo]);

  const [form, setForm] = useState(initialForm);

  const syncFromUser = useCallback(() => {
    setForm({
      displayName: userInfo?.displayName || userInfo?.fullName || '',
      email: userInfo?.email || '',
      username: userInfo?.username || '',
      phone: userInfo?.phoneNumber || '',
      dob: getDateInputValue(userInfo?.dob),
    });
  }, [userInfo]);

  const handleToggleEdit = () => {
    if (isEditing) {
      syncFromUser();
    }
    setIsEditing((prev) => !prev);
  };

  useEffect(() => {
    if (!isEditing) {
      syncFromUser();
    }
  }, [isEditing, syncFromUser]);

  const validateProfile = () => {
    const name = (form.displayName || '').trim();
    if (name.length < 3 || name.length > 50) {
      toast.error('Tên người dùng phải từ 3 đến 50 ký tự.');
      return null;
    }

    const phoneResult = normalizeVietnamPhone(form.phone);
    if (!phoneResult.isValid) {
      toast.error('Vui lòng nhập số điện thoại hợp lệ.');
      return null;
    }

    if (!isDobValid(form.dob)) {
      toast.error('Ngày sinh không hợp lệ (không được ở tương lai).');
      return null;
    }

    return {
      DisplayName: name,
      PhoneNumber: phoneResult.normalized,
      Dob: form.dob ? dobInputToIso(form.dob) : '',
    };
  };

  const handleSave = async () => {
    const payload = validateProfile();
    if (!payload) return;

    setSaving(true);
    try {
      await AuthService.updateProfile(payload);
      await updateUserInfo();
      toast.success('Cập nhật thông tin thành công.');
      setIsEditing(false);
    } catch (error) {
      console.error('Update admin profile error:', error);
      toast.error(error?.response?.data?.message || 'Không thể cập nhật thông tin.');
    } finally {
      setSaving(false);
    }
  };

  const handleChooseAvatar = () => {
    if (!isEditing) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ.');
      return;
    }

    const payload = validateProfile();
    if (!payload) return;

    setSaving(true);
    try {
      await AuthService.updateProfile({ ...payload, UserUrlImage: file });
      try {
        localStorage.setItem('avatarBust', String(Date.now()));
      } catch (err) {
        console.warn('Unable to persist avatar bust:', err);
      }
      await updateUserInfo();
      toast.success('Cập nhật ảnh đại diện thành công.');
    } catch (error) {
      console.error('Update admin avatar error:', error);
      toast.error(error?.response?.data?.message || 'Không thể cập nhật ảnh đại diện.');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Password reset via OTP (same flow as profile)
  const [pwStep, setPwStep] = useState(1);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const emailForOtp = form.email || userInfo?.email || '';

  const handleSendOtp = async () => {
    if (!emailForOtp) {
      toast.error('Không tìm thấy email của tài khoản.');
      return;
    }
    setPwLoading(true);
    try {
      const response = await AuthService.sendOtp(emailForOtp);
      toast.success(response?.message || 'OTP đã được gửi tới email của bạn.');
      setPwStep(2);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể gửi OTP.');
    } finally {
      setPwLoading(false);
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
    const strong = validateStrongPassword(newPassword, { minLength: 8 });
    if (!strong.isValid) {
      toast.error('Mật khẩu phải có tối thiểu 8 ký tự, ít nhất 1 chữ viết hoa và 1 ký tự đặc biệt.');
      return;
    }

    setPwLoading(true);
    try {
      const response = await AuthService.resetPassword({
        email: emailForOtp,
        otpCode,
        newPassword,
      });
      toast.success(response?.message || 'Mật khẩu đã được thay đổi thành công.');
      setPwStep(1);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Cài đặt tài khoản</h2>
            <p className="text-sm text-gray-600 mt-1">Quản lý thông tin cá nhân của Admin.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              onClick={handleToggleEdit}
              disabled={saving}
            >
              {isEditing ? (
                <span className="inline-flex items-center gap-2"><FaTimes /> Hủy</span>
              ) : (
                <span className="inline-flex items-center gap-2">Sửa thông tin</span>
              )}
            </button>
            {isEditing && (
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
                onClick={handleSave}
                disabled={saving}
              >
                <span className="inline-flex items-center gap-2"><FaSave /> {saving ? 'Đang lưu...' : 'Lưu'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={userInfo?.userUrlImage || '/images/default-avatar.png'}
                alt={form.displayName || form.username || 'Admin'}
                className="w-28 h-28 rounded-full object-cover border-4 border-primary/20"
              />
              {isEditing && (
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition"
                  onClick={handleChooseAvatar}
                  title="Đổi ảnh đại diện"
                >
                  <FaCamera />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {isEditing ? 'Nhấn vào icon camera để đổi ảnh.' : 'Bật chế độ sửa để đổi ảnh.'}
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <input
                value={form.email}
                disabled
                className="mt-1 w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-600"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Username</label>
              <input
                value={form.username}
                disabled
                className="mt-1 w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-600"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Tên hiển thị</label>
              <input
                value={form.displayName}
                disabled={!isEditing}
                onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                className={`mt-1 w-full px-4 py-2.5 rounded-lg border transition ${
                  isEditing ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-100 text-gray-600'
                }`}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Số điện thoại</label>
              <input
                value={form.phone}
                disabled={!isEditing}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  phone: sanitizeVietnamPhoneInput(e.target.value, { maxDigits: 11 }),
                }))}
                className={`mt-1 w-full px-4 py-2.5 rounded-lg border transition ${
                  isEditing ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-100 text-gray-600'
                }`}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Ngày sinh</label>
              <input
                type="date"
                value={form.dob}
                disabled={!isEditing}
                onChange={(e) => setForm((prev) => ({ ...prev, dob: e.target.value }))}
                className={`mt-1 w-full px-4 py-2.5 rounded-lg border transition ${
                  isEditing ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-100 text-gray-600'
                }`}
              />
              {isEditing && form.dob && !isDobValid(form.dob) && (
                <p className="mt-1 text-xs text-red-600">Ngày sinh không hợp lệ.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Đổi mật khẩu</h3>
            <p className="text-sm text-gray-600 mt-1">Gửi OTP qua email để đặt lại mật khẩu mới.</p>
          </div>
          <FaLock className="text-gray-400 mt-1" />
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-700">Email nhận OTP</p>
            <p className="text-sm text-gray-600 mt-1 break-all">{emailForOtp || '—'}</p>
            <p className="text-xs text-gray-500 mt-2">OTP chỉ có hiệu lực trong 5 phút. Không chia sẻ mã cho bất kỳ ai.</p>
          </div>

          <div className="space-y-3">
            {pwStep === 1 ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={pwLoading}
                className="w-full px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
              >
                {pwLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </button>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Mã OTP</label>
                    <input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="mt-1 w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
                      placeholder="Nhập mã OTP trong email"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
                      placeholder="Tối thiểu 8 ký tự"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
                      placeholder="Nhập lại mật khẩu"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPwStep(1);
                      setOtpCode('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Gửi lại OTP
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={pwLoading}
                    className="w-full px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
                  >
                    {pwLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </div>
                <ul className="text-xs text-gray-600 list-disc pl-5">
                  <li>Tối thiểu 8 ký tự</li>
                  <li>Có ít nhất một chữ cái viết hoa</li>
                  <li>Chứa ký tự đặc biệt như !, @, #, ...</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
