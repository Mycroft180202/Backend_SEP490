import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/modules/auth/authService';
import { FaUserCircle, FaPhoneAlt, FaHeart, FaHistory, FaLock, FaSignOutAlt, FaUserTie, FaEnvelope, FaKey, FaPaperPlane } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
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
      <ToastContainer position="top-right" autoClose={3500} />
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await AuthService.getUserInfo();
        setProfile({
          name: data.displayName || data.fullName || '',
          phone: data.phoneNumber || '',
          email: data.email || '',
          username: data.username || '',
          dob: data.dob || '',
          userUrlImage: data.userUrlImage || null,
          addresses: Array.isArray(data.addresses) ? data.addresses : [],
        });
        setLoading(false);
      } catch (err) {
        setError('Không thể lấy thông tin người dùng');
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return <div className="p-8 text-center">Đang tải thông tin...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!profile) return null;

  return (
    <div className="bg-[#fdfde9] min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-1/4 px-8 py-12 flex flex-col items-center border-r border-[#e5e5e5]">
        <img
          src={profile.userUrlImage ? profile.userUrlImage : '/images/default-avatar.png'}
          alt="User Avatar"
          className="w-28 h-28 rounded-full object-cover mb-4 border"
        />
        <div className="font-bold text-lg mb-2">{profile.name}</div>
        <nav className="w-full mt-6">
          <ul className="space-y-4">
            <li
              className={`flex items-center gap-2 font-semibold cursor-pointer ${activeSection === 'info' ? 'text-[#9e211f]' : 'text-gray-600 hover:text-[#9e211f]'}`}
              onClick={() => setActiveSection('info')}
            >
              <FaUserCircle /> Thông tin tài khoản
            </li>
            <li className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]">
              <FaHistory /> Lịch sử mua hàng
            </li>
            <li className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]">
              <FaHeart /> Sản phẩm đã thích
            </li>
            <li
              className={`flex items-center gap-2 cursor-pointer ${activeSection === 'changePassword' ? 'text-[#9e211f]' : 'text-gray-600 hover:text-[#9e211f]'}`}
              onClick={() => setActiveSection('changePassword')}
            >
              <FaLock /> Đổi mật khẩu
            </li>
            <li className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]">
              <FaUserTie /> Đăng ký người bán hàng
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
              <div className="col-span-2">
                <label className="block mb-2 font-medium">Địa chỉ</label>
                {profile.addresses && profile.addresses.length > 0 ? (
                  <ul className="space-y-2">
                    {profile.addresses.map((addr, idx) => (
                      <li key={idx} className="border rounded px-4 py-2 bg-white flex items-center justify-between">
                        <span>{addr.detail || addr.address || addr}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">Chưa có địa chỉ nào</div>
                )}
              </div>
              <div>
                <label className="block mb-2 font-medium">Tên</label>
                <input type="text" value={profile.name} className="w-full border rounded px-4 py-2" readOnly />
              </div>
              <div>
                <label className="block mb-2 font-medium">Số điện thoại</label>
                <div className="flex items-center border rounded px-4 py-2 bg-white">
                  <FaPhoneAlt className="mr-2 text-gray-400" />
                  <span>{profile.phone}</span>
                </div>
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
                <input
                  type="text"
                  value={profile.dob ? new Date(profile.dob).toLocaleDateString('vi-VN') : ''}
                  className="w-full border rounded px-4 py-2"
                  readOnly
                />
              </div>
            </form>
            <button className="mt-8 px-8 py-2 bg-[#9e211f] text-white rounded font-semibold">Sửa thông tin</button>
          </>
        ) : (
          <ChangePasswordSection email={profile.email} />
        )}
      </main>
    </div>
  );
}

export default ProfileSection;