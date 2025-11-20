import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/modules/auth/authService';
import { toast } from 'react-toastify';
import { FaUser, FaLock } from 'react-icons/fa';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUserInfo } = useContext(UserContext);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('rememberMeUsername');
    if (storedUsername) {
      setUsername(storedUsername);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (rememberMe) {
      localStorage.setItem('rememberMeUsername', username);
    }
  }, [rememberMe, username]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await AuthService.login({ Username: username, Password: password });
    console.log('Response từ AuthService.login:', res);
    if (res && res.accessToken) {
      localStorage.setItem('accessToken', res.accessToken);
      if (rememberMe) {
        localStorage.setItem('rememberMeUsername', username);
      } else {
        localStorage.removeItem('rememberMeUsername');
      }
      await updateUserInfo();
      toast.success('Đăng nhập thành công!', {
        position: "top-right",
        autoClose: 1000,
        onClose: () => navigate('/')
      });
    } else {
      toast.error('Tên đăng nhập hoặc mật khẩu không đúng', {
        position: "top-right",
        autoClose: 3000
      });
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng', {
      position: "top-right",
      autoClose: 3000
    });
  } finally {
    setLoading(false);
  }
};

const handleRememberMe = (e) => {
  const isChecked = e.target.checked;
  setRememberMe(isChecked);
  if (!isChecked) {
    localStorage.removeItem('rememberMeUsername');
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBEE] py-10 px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[32px] shadow-2xl overflow-hidden animate-fadeInUp relative min-h-[620px]">
        <div className="relative hidden lg:flex flex-col h-full">
          <img src="/images/login-illustration.svg" alt="illustration" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(9,8,6,0.25)] via-[rgba(9,6,2,0.45)] to-[rgba(6,4,2,0.75)]" />
          <div className="absolute inset-x-0 top-10 p-10 text-white space-y-4">
            <p className="uppercase tracking-[0.3em] text-sm text-[#F9D9A7]">HoaLacHandicraft</p>
            <h1 className="font-bold text-3xl leading-snug drop-shadow-lg">Chào mừng bạn quay trở lại</h1>
            <p className="text-sm text-white/80 max-w-xs">
              Đăng nhập để tiếp tục khám phá những sản phẩm thủ công tinh xảo đến từ Hòa Lạc.
            </p>
          </div>
        </div>
        <div className="relative p-6 sm:p-8 bg-[#FFFDF7] flex flex-col justify-center">
          <div className="absolute top-4 right-4 hidden lg:flex items-center gap-2 text-sm text-[#746355]">
            <span>Trở về</span>
            <Link to="/" className="text-[#9E211F] font-semibold hover:underline">Trang chủ</Link>
          </div>
          <div className="mb-8 text-center lg:text-left">
            <p className="text-xs uppercase tracking-[0.4em] text-[#c29b6c] font-semibold">Chào mừng trở lại</p>
            <h2 className="text-3xl font-bold text-[#331c11] mt-2">Đăng nhập</h2>
            <p className="text-sm text-[#746355] mt-2">Nhập thông tin bên dưới để tiếp tục trải nghiệm tại HoaLacHandicraft.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#4a3c32] block mb-2">Tên đăng nhập</label>
              <div className="relative group">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5b29a] group-focus-within:text-[#9E211F] transition-colors" />
                <input
                  type="text"
                  placeholder="Tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full py-3 pl-11 pr-4 border border-[#efe7db] rounded-[16px] bg-white text-[#3b2c24] placeholder:text-[#c8bdac] focus:border-[#9E211F] focus:shadow-[0_15px_40px_rgba(158,33,31,0.15)] outline-none transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#4a3c32] block mb-2">Mật khẩu</label>
              <div className="relative group">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5b29a] group-focus-within:text-[#9E211F] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full py-3 pl-11 pr-12 border border-[#efe7db] rounded-[16px] bg-white text-[#3b2c24] placeholder:text-[#c8bdac] focus:border-[#9E211F] focus:shadow-[0_15px_40px_rgba(158,33,31,0.15)] outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f7eee2] transition-colors"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <img
                    src={showPassword ? '/images/eye-icon.svg' : '/images/eye-icon-2.svg'}
                    alt={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="w-5 h-5 object-contain"
                  />
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-[#746355]">
              <label className="flex items-center gap-2 text-[#4a3c32]">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#9E211F]"
                  checked={rememberMe}
                  onChange={handleRememberMe}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="text-[#9E211F] font-semibold hover:underline">Quên mật khẩu?</Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[16px] font-semibold text-white bg-gradient-to-r from-[#BB4B3E] to-[#9E211F] shadow-[0_20px_40px_rgba(158,33,31,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_25px_45px_rgba(158,33,31,0.45)] disabled:opacity-70 disabled:hover:-translate-y-0"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
            <div className="text-center text-sm text-[#746355]">
              Chưa có tài khoản?
              {' '}
              <Link to="/register" className="text-[#9E211F] font-semibold hover:underline">Đăng ký</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
