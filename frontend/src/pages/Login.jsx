import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/modules/auth/authService';
import { toast } from 'react-toastify';
import { FaUser, FaLock } from 'react-icons/fa';
import { LanguageContext } from '../context/LanguageContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUserInfo } = useContext(UserContext);
  const { language, changeLanguage, t } = useContext(LanguageContext);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const languageOptions = [
    { code: 'vi', label: t('auth.common.viLabel'), flag: '/images/VNFlag.png' },
    { code: 'en', label: t('auth.common.enLabel'), flag: '/images/Engflag.png' },
  ];

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
      console.log('AuthService.login response:', res);
      if (res && res.accessToken) {
        localStorage.setItem('accessToken', res.accessToken);
        if (rememberMe) {
          localStorage.setItem('rememberMeUsername', username);
        } else {
          localStorage.removeItem('rememberMeUsername');
        }
        await updateUserInfo();
        toast.success(t('auth.login.toastSuccess'), {
          position: "top-right",
          autoClose: 1000,
          onClose: () => navigate('/')
        });
      } else {
        toast.error(t('auth.login.toastInvalid'), {
          position: "top-right",
          autoClose: 3000
        });
      }
    } catch (err) {
      const defaultMessage = err?.response?.status === 401
        ? t('auth.login.toastInvalid')
        : t('auth.login.toastError');
      const errorMessage = err.response?.data?.message || defaultMessage;
      toast.error(errorMessage, {
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
            <p className="uppercase tracking-[0.3em] text-sm text-[#F9D9A7]">{t('auth.login.heroBadge')}</p>
            <h1 className="font-bold text-3xl leading-snug drop-shadow-lg">{t('auth.login.heroTitle')}</h1>
            <p className="text-sm text-white/80 max-w-xs">
              {t('auth.login.heroSubtitle')}
            </p>
          </div>
        </div>
        <div className="relative p-6 sm:p-8 bg-[#FFFDF7] flex flex-col justify-center">
          <div className="absolute top-4 right-4 flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 bg-white border border-[#efe7db] rounded-full px-3 py-1 shadow-sm">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => changeLanguage(option.code)}
                  aria-pressed={language === option.code}
                  className={`w-9 h-9 rounded-full border transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#9E211F] ${
                    language === option.code
                      ? 'border-[#9E211F] shadow-md'
                      : 'border-transparent hover:border-[#c29b6c]'
                  }`}
                  title={option.label}
                >
                  <img
                    src={option.flag}
                    alt={`${option.label} flag`}
                    className="w-6 h-6 object-cover rounded-full"
                  />
                </button>
              ))}
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm text-[#746355]">
              <span>{t('auth.common.backLabel')}</span>
              <Link to="/" className="text-[#9E211F] font-semibold hover:underline">{t('auth.common.homeLink')}</Link>
            </div>
          </div>
          <div className="mb-8 text-center lg:text-left">
            <p className="text-xs uppercase tracking-[0.4em] text-[#c29b6c] font-semibold">{t('auth.login.welcomeTag')}</p>
            <h2 className="text-3xl font-bold text-[#331c11] mt-2">{t('auth.login.title')}</h2>
            <p className="text-sm text-[#746355] mt-2">{t('auth.login.subtitle')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#4a3c32] block mb-2">{t('auth.login.usernameLabel')}</label>
              <div className="relative group">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5b29a] group-focus-within:text-[#9E211F] transition-colors" />
                <input
                  type="text"
                  placeholder={t('auth.login.usernamePlaceholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full py-3 pl-11 pr-4 border border-[#efe7db] rounded-[16px] bg-white text-[#3b2c24] placeholder:text-[#c8bdac] focus:border-[#9E211F] focus:shadow-[0_15px_40px_rgba(158,33,31,0.15)] outline-none transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#4a3c32] block mb-2">{t('auth.login.passwordLabel')}</label>
              <div className="relative group">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5b29a] group-focus-within:text-[#9E211F] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.login.passwordPlaceholder')}
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
                    alt={showPassword ? t('auth.common.hidePassword') : t('auth.common.showPassword')}
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
                <span>{t('auth.login.remember')}</span>
              </label>
              <Link to="/forgot-password" className="text-[#9E211F] font-semibold hover:underline">{t('auth.login.forgot')}</Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[16px] font-semibold text-white bg-gradient-to-r from-[#BB4B3E] to-[#9E211F] shadow-[0_20px_40px_rgba(158,33,31,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_25px_45px_rgba(158,33,31,0.45)] disabled:opacity-70 disabled:hover:-translate-y-0"
            >
              {loading ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
            <div className="text-center text-sm text-[#746355]">
              {t('auth.login.registerPrompt')}
              {' '}
              <Link to="/register" className="text-[#9E211F] font-semibold hover:underline">{t('auth.login.registerLink')}</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
