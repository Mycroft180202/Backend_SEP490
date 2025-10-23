import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/modules/auth/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await AuthService.login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="fixed inset-0 flex items-center justify-center p-6" style={{ backgroundColor: '#FBFBEE' }}>
      {/* top-right close icon that returns to homepage */}
      <button onClick={() => navigate('/')} aria-label="Close and go home" className="absolute top-6 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:opacity-90" style={{ border: 'none' }}>
        <img src="/images/deco-x.svg" alt="close" className="w-6 h-6" />
      </button>
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-transparent rounded-lg overflow-hidden relative" style={{ minHeight: 560 }}>
        {/* left image with overlay and welcome text */}
        <div className="hidden lg:block relative">
          <img src="/images/login-illustration.svg" alt="illustration" className="w-full h-full object-cover block rounded-l-lg" style={{ height: '100%' }} />
          <div className="absolute inset-0 rounded-l-lg" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.06) 50%)' }} />
          <h1 style={{ fontFamily: 'Alata, sans-serif', fontSize: 40, lineHeight: '56px', color: 'white' }} className="absolute left-12 top-12">Chào mừng quay trở lại!</h1>
        </div>

        {/* right card */}
        <div className="flex items-center justify-center relative">
          <div className="w-full max-w-md bg-[#FBFBEE] rounded-2xl p-8 shadow-md" style={{ border: '1px solid rgba(0,0,0,0.04)' }}>
            {/* close X positioned absolute in parent */}
            <button onClick={() => navigate('/')} aria-label="close" className="absolute -right-6 -top-6 w-10 h-10 flex items-center justify-center text-2xl" style={{ background: 'transparent', border: 'none', color: '#000' }}>×</button>

            <div className="flex justify-center mb-2">
              <img src="/images/OnlyLogo.png" alt="logo" className="w-[100px] h-[100px] rounded-full object-cover" />
            </div>
            <h2 style={{ fontFamily: 'Alata, sans-serif', fontSize: 36, lineHeight: '56px', color: '#9e211f', fontWeight: 400 }} className="text-center mb-1">Đăng nhập</h2>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px', color: '#7a7a7a' }} className="text-center mb-6">Đăng nhập để tiếp tục sử dụng dịch vụ</p>

            {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px', color: '#000' }} className="block mb-2">Email/Tên đăng nhập</label>
                <input
                  type="email"
                  placeholder="Email/Tên đăng nhập"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-3 px-4 border border-[#e0dfda] rounded-[12px] outline-none bg-transparent"
                />
              </div>

              <div>
                <label style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px', color: '#000' }} className="block mb-2">Mật khẩu</label>
                <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full py-3 px-4 border border-[#e0dfda] rounded-[12px] outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center p-1"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <img
                        src={showPassword ? '/images/eye-icon.svg' : '/images/eye-icon-2.svg'}
                        alt={showPassword ? 'Hide password' : 'Show password'}
                        className="w-5 h-5 object-contain"
                      />
                    </button>
                  </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 border-[#a0a0a0]" />
                  <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, lineHeight: '24px' }}>Ghi nhớ đăng nhập</span>
                </label>
                <Link to="/forgot" className="text-[#9E211F] hover:underline" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, lineHeight: '24px' }}>Quên mật khẩu?</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#9E211F] text-white rounded-[12px] font-medium hover:opacity-95 transition mt-2"
                style={{ boxShadow: 'none' }}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>

              <div className="text-center text-sm text-gray-600 mt-4">
                <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, lineHeight: '24px' }}>Chưa có tài khoản? </span>
                <Link to="/register" className="text-[#9E211F] font-medium hover:underline" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, lineHeight: '24px' }}>Đăng ký</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
