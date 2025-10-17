import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // TODO: Call register API here
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 1000);
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
          <h1 style={{ fontFamily: 'Alata, sans-serif', fontSize: 36, lineHeight: '56px', color: 'white' }} className="absolute left-12 top-12">Chào mừng đến với<br/>HoaLacHandicraft!</h1>
        </div>
        {/* right card */}
        <div className="flex items-center justify-center relative">
          <div className="w-full max-w-md bg-[#FBFBEE] rounded-2xl p-8 shadow-md" style={{ border: '1px solid rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontFamily: 'Alata, sans-serif', fontSize: 36, lineHeight: '56px', color: '#9e211f', fontWeight: 400 }} className="text-center mb-6">Đăng ký</h2>
            {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px', color: '#000' }} className="block mb-2">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full py-3 pl-10 pr-4 border border-[#e0dfda] rounded-[12px] outline-none bg-transparent"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M2.5 6.25l7.5 5 7.5-5" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="2.5" y="6.25" width="15" height="7.5" rx="2" stroke="#A0A0A0" strokeWidth="1.5"/></svg>
                  </span>
                </div>
              </div>
              <div>
                <label style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px', color: '#000' }} className="block mb-2">Tên đăng nhập</label>
                <input
                  type="text"
                  placeholder="Tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#9E211F] text-white rounded-[12px] font-medium hover:opacity-95 transition mt-2"
                style={{ boxShadow: 'none' }}
              >
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
              <div className="flex flex-col gap-3 mt-3">
                <button type="button" className="w-full py-3 border border-[#e0dfda] rounded-[12px] bg-white flex items-center justify-center gap-3">
                  <img src="/images/google-icon.svg" alt="google" className="w-6 h-6" />
                  <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px' }}>Đăng ký bằng Google</span>
                </button>
              </div>
              <div className="text-center text-sm text-gray-600 mt-4">
                <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, lineHeight: '24px' }}>Đã có tài khoản? </span>
                <Link to="/login" className="text-[#9E211F] font-medium hover:underline" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, lineHeight: '24px' }}>Đăng nhập</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
