import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEnvelope, FaLock, FaKey, FaPaperPlane, FaArrowLeft } from 'react-icons/fa';
import { AuthService } from '../services/modules/auth/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showToastSuccessThenRedirect = (message) => {
    toast.success(message, { autoClose: 3500 });
    setTimeout(() => {
      localStorage.removeItem('accessToken');
      navigate('/login');
    }, 3600);
  };

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Vui lòng nhập email.');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.sendOtp(email);
      toast.success(response?.message || 'OTP đã được gửi tới email của bạn.');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Email không tồn tại trong hệ thống.');
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
      showToastSuccessThenRedirect(response?.message || 'Mật khẩu đã được thay đổi thành công.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-gradient-to-r from-yellow-100 to-white-300 animate-fadeIn">

      <div className="w-full max-w-md bg-white rounded-lg p-6 shadow-md animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
          >
            <FaArrowLeft /> Quay lại
          </button>
          <h2 className="text-2xl font-bold text-center">Quên mật khẩu</h2>
        </div>

        {step === 1 && (
          <div>
            <label className="block mb-2 text-sm font-medium">Email</label>
            <div className="flex items-center border rounded overflow-hidden mb-4">
              <div className="px-3 text-gray-400"><FaEnvelope /></div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 outline-none"
                placeholder="Nhập email của bạn"
              />
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
    </div>
  );
};

export default ForgotPassword;
