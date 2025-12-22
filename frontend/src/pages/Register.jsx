import React, {
  useState, useRef, useEffect, useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaUser, FaPhoneAlt, FaIdCard, FaBirthdayCake, FaLock } from 'react-icons/fa';
import { AuthService } from '../services/modules/auth/authService';
import { toast } from 'react-toastify';
import { LanguageContext } from '../context/LanguageContext';
import { validateStrongPassword } from '../utils/passwordValidation';

const DatePartSelect = ({
  options,
  value,
  placeholder,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const selectedOption = options.find((option) => option.value === value);

  const updateDropdownPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'absolute',
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
      zIndex: 9999
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    updateDropdownPosition();

    const handleWindowChange = () => updateDropdownPosition();
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (
        triggerRef.current?.contains(event.target)
        || dropdownRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div className="relative flex-1 min-w-[96px]">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full py-3 px-4 border border-[#efe7db] rounded-[16px] outline-none bg-white text-left flex items-center justify-between transition-all duration-200 focus:border-[#9E211F] focus:shadow-[0_12px_30px_rgba(158,33,31,0.15)]"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <svg width="14" height="8" viewBox="0 0 14 8" className={`transition-transform text-gray-500 ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1.5L7 7l6-5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="max-h-48 overflow-auto bg-white border border-[#efe7db] rounded-[16px] shadow-2xl"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#FFF1E5] ${option.value === value ? 'bg-[#FFF6EF]' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

const Register = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const navigate = useNavigate();
  const otpRefs = useRef([]);
  const { language, changeLanguage, t } = useContext(LanguageContext);
  const languageOptions = [
    { code: 'vi', label: t('auth.common.viLabel'), flag: '/images/VNFlag.png' },
    { code: 'en', label: t('auth.common.enLabel'), flag: '/images/Engflag.png' },
  ];
  const days = Array.from({ length: 31 }, (_, idx) => idx + 1);
  const months = Array.from({ length: 12 }, (_, idx) => idx + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, idx) => currentYear - idx);
  const dayOptions = days.map((day) => ({
    value: String(day),
    label: String(day).padStart(2, '0')
  }));
  const monthOptions = months.map((month) => ({
    value: String(month),
    label: String(month).padStart(2, '0')
  }));
  const yearOptions = years.map((year) => ({
    value: String(year),
    label: String(year)
  }));

  const updateDobFromParts = (nextDay, nextMonth, nextYear) => {
    if (!nextDay || !nextMonth || !nextYear) {
      setDob('');
      return;
    }

    const dayNumber = Number(nextDay);
    const monthNumber = Number(nextMonth);
    const yearNumber = Number(nextYear);
    const day = String(dayNumber).padStart(2, '0');
    const month = String(monthNumber).padStart(2, '0');
    const iso = `${yearNumber}-${month}-${day}`;

    const testDate = new Date(`${iso}T00:00:00`);
    const isValidDate = !Number.isNaN(testDate.getTime())
      && testDate.getFullYear() === yearNumber
      && testDate.getMonth() + 1 === monthNumber
      && testDate.getDate() === dayNumber;

    if (!isValidDate) {
      setDob('');
      toast.error(t('auth.register.errors.dobNonexistent'));
      return;
    }

    const now = new Date();
    if (testDate > now ) {
      setDob('');
      toast.error(t('auth.register.errors.dobFuture'));
      return;
    }

    setDob(iso);
  };
  
  // Khởi tạo refs cho các ô input OTP
  useEffect(() => {
    otpRefs.current = otpRefs.current.slice(0, 6);
  }, []);

  useEffect(() => {
    if (showOtpInput) {
      setResendCountdown(60);
    } else {
      setResendCountdown(0);
    }
  }, [showOtpInput]);

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;
    const interval = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = [];
    const usernameTrim = username.trim();
    if (!usernameTrim || usernameTrim.length < 3 || usernameTrim.length > 30) {
      errors.push(t('auth.register.errors.usernameLength'));
    }
    const strongPassword = validateStrongPassword(password, { minLength: 8 });
    if (!strongPassword.isValid) {
      errors.push('Mật khẩu phải có tối thiểu 8 ký tự, ít nhất 1 chữ viết hoa và 1 ký tự đặc biệt.');
    }
    if (password !== confirmPassword) {
      errors.push(t('auth.register.errors.passwordMismatch'));
    }
    const emailTrim = email.trim();
    if (!emailTrim) {
      errors.push(t('auth.register.errors.emailInvalid'));
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrim)) {
        errors.push(t('auth.register.errors.emailInvalid'));
      }
    }

    const phoneTrim = phoneNumber.trim();
    const localPhonePattern = /^(?:0[35789]\d{8}|084\d{8})$/;
    const internationalPhonePattern = /^\+\d{8,14}$/;
    const vnInternationalPattern = /^\+84[35789]\d{8}$/;

    if (!phoneTrim) {
      errors.push(t('auth.register.errors.phoneRequired'));
    } else if (
      !localPhonePattern.test(phoneTrim)
      && !internationalPhonePattern.test(phoneTrim)
    ) {
      errors.push(t('auth.register.errors.phoneInvalid'));
    } else if (
      phoneTrim.startsWith('+84')
      && !vnInternationalPattern.test(phoneTrim)
    ) {
      errors.push(t('auth.register.errors.phoneInvalid84'));
    }

    if (displayName && displayName.length > 50) {
      errors.push(t('auth.register.errors.displayNameLength'));
    }
    if (!dobDay || !dobMonth || !dobYear) {
      errors.push(t('auth.register.errors.dobIncomplete'));
    } else if (!dob) {
      errors.push(t('auth.register.errors.dobInvalid'));
    } else {
      const dobDate = new Date(dob);
      if (Number.isNaN(dobDate.getTime())) {
        errors.push(t('auth.register.errors.dobInvalid'));
      } else {
        const now = new Date();
        const oldest = new Date();
        oldest.setFullYear(oldest.getFullYear() - 120);
        if (dobDate > now) {
          errors.push(t('auth.register.errors.dobFuture'));
        }
        if (dobDate < oldest) {
          errors.push(t('auth.register.errors.dobTooOld'));
        }
      }
    }

    if (errors.length > 0) {
      errors.forEach((msg) => toast.error(msg));
      return;
    }

    setLoading(true);
    try {
      const sanitizedPhone = phoneTrim;
      // Log để kiểm tra giá trị trước khi gửi
      console.log('Form values:', {
        email,
        username,
        password,
        phoneNumber: sanitizedPhone,
        displayName,
        dob,
      });

      const formData = new FormData();
      formData.append('Email', email);
      formData.append('Username', username);
      formData.append('PasswordHash', password);
      formData.append('PhoneNumber', sanitizedPhone);
      formData.append('DisplayName', displayName);
      if (dob) {
        formData.append('Dob', dob);
      }

      const response = await AuthService.register({
        Email: email,
        Username: username,
        PasswordHash: password,
        PhoneNumber: sanitizedPhone,
        DisplayName: displayName,
        Dob: dob
      });
      if (response.status >= 200 && response.status < 300) {
        setShowOtpInput(true);
        toast.success(t('auth.register.toasts.registerSuccess'), {
          position: "top-right",
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('Registration failed:', error);

      // Trên môi trường deploy đôi khi request vẫn tới backend (OTP vẫn gửi) nhưng browser bị chặn đọc response (CORS)
      // => Axios sẽ báo "Network Error" và không có `error.response`.
      const isLikelyCorsBlocked =
        !error?.response
        && (error?.code === 'ERR_NETWORK' || String(error?.message || '').toLowerCase().includes('network'));
      if (isLikelyCorsBlocked) {
        setShowOtpInput(true);
        toast.info(
          'Không thể nhận phản hồi từ server (có thể do CORS). Nếu bạn đã nhận OTP qua email, hãy nhập OTP để hoàn tất đăng ký.',
          { position: 'top-right', autoClose: 5000 }
        );
        return;
      }

      const duplicateMessage = t('auth.register.toasts.duplicate');
      const defaultRegisterError = t('auth.register.toasts.registerError');
      const backendMessage = error.response?.data?.message || '';

      if (backendMessage.includes('Username or email already exists!')) {
        toast.error(duplicateMessage, {
          position: "top-right",
          autoClose: 3000
        });
      } else {
        toast.error(backendMessage || defaultRegisterError, {
          position: "top-right",
          autoClose: 3000
        });
      }

      // Surface validation errors returned from backend validation
      const validationErrors = error.response?.data?.errors;
      if (validationErrors) {
        Object.values(validationErrors).forEach(errors => {
          errors.forEach(error => toast.error(error, {
            position: "top-right",
            autoClose: 3000
          }));
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
      try {
      const sanitizedPhone = phoneNumber.trim();
      // Chuẩn bị dữ liệu theo đúng format backend yêu cầu
      const verifyOtpData = {
        registerDto: {
          username: username,
          passwordHash: password,
          email: email,
          phoneNumber: sanitizedPhone || '',
          displayName: displayName || '',
          dob: dob ? new Date(dob).toISOString() : null
        },
        otp: otp.join('')
      };

      const response = await AuthService.verifyOTP(verifyOtpData);
      
      if (response.status === 200) {
        toast.success(t('auth.register.toasts.otpSuccess'), {
          position: "top-right",
          autoClose: 2500,
          onClose: () => {
            navigate('/login');
          }
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const fallback = t('auth.register.toasts.otpError');
      toast.error(error.response?.data?.message || fallback, {
        position: "top-right",
        autoClose: 3000
      });
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Nếu ô hiện tại trống và nhấn backspace, focus về ô trước đó
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedNumbers = pastedData.replace(/[^0-9]/g, '').slice(0, 6).split('');
    
    if (pastedNumbers.length) {
      const newOtp = [...otp];
      pastedNumbers.forEach((num, idx) => {
        if (idx < 6) newOtp[idx] = num;
      });
      setOtp(newOtp);
      // Focus vào ô cuối cùng được paste
      const lastIndex = Math.min(5, pastedNumbers.length - 1);
      otpRefs.current[lastIndex].focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) {
      toast.info(t('auth.register.toasts.waitBeforeResend', { seconds: resendCountdown }), {
        position: "top-right",
        autoClose: 2000
      });
      return;
    }
    try {
      toast.info(t('auth.register.toasts.resendInfo'), {
        position: "top-right",
        autoClose: 2000
      });
      const sanitizedPhone = phoneNumber.trim();

      const response = await AuthService.register({
        Email: email,
        Username: username,
        PasswordHash: password,
        PhoneNumber: sanitizedPhone,
        DisplayName: displayName,
        Dob: dob
      });

      if (response.status >= 200 && response.status < 300) {
        toast.success(t('auth.register.toasts.resendSuccess'), {
          position: "top-right",
          autoClose: 3000
        });
        setResendCountdown(60);
      }
    } catch (error) {
      console.error('Resend OTP failed:', error);
      toast.error(t('auth.register.toasts.resendError'), {
        position: "top-right",
        autoClose: 3000
      });
    }
  };

  const handleOtpChange = (index, value) => {
    // Chỉ cho phép nhập số
    value = value.replace(/[^0-9]/g, '');
    
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Tự động focus vào ô tiếp theo
      if (value && index < 5) {
        otpRefs.current[index + 1].focus();
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBEE] py-10 px-4">
      {/* OTP Modal */}
      {showOtpInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full mx-4 animate-fadeInUp relative z-10">
            <button 
              onClick={() => setShowOtpInput(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={t('auth.register.otp.closeAria')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center justify-center mb-6">
              <img src="/images/OnlyLogo.png" alt="logo" className="w-12 h-12" />
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('auth.register.otp.title')}</h2>
                <p className="text-gray-600 text-sm mt-1">{t('auth.register.otp.description')}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => {
                      otpRefs.current[index] = el;
                      if (el && index === 0 && !digit) el.focus();
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl 
                             focus:border-[#9E211F] focus:outline-none transition-all
                             bg-gray-50 hover:bg-gray-100"
                    placeholder="•"
                  />
                ))}
              </div>
              
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-2">{t('auth.register.otp.notReceived')}</p>
                <button 
                  className={`text-sm font-medium ${resendCountdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#9E211F] hover:underline'}`}
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0}
                >
                  {resendCountdown > 0
                    ? t('auth.register.otp.resendCountdown', { seconds: resendCountdown })
                    : t('auth.register.otp.resendReady')}
                </button>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.join('').length !== 6}
                className={`w-full py-4 rounded-xl font-medium text-white text-lg transition-all
                           ${otp.join('').length === 6 
                             ? 'bg-[#9E211F] hover:bg-opacity-90' 
                             : 'bg-gray-400 cursor-not-allowed'}`}
              >
                {t('auth.register.otp.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Register Form */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[32px] shadow-2xl overflow-hidden animate-fadeInUp relative min-h-[680px]">
          <div className="relative hidden lg:flex flex-col h-full">
            <img src="/images/login-illustration.svg" alt="illustration" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[rgba(9,8,6,0.25)] via-[rgba(9,6,2,0.45)] to-[rgba(6,4,2,0.75)]" />
            <div className="absolute inset-x-0 top-10 p-10 text-white space-y-4">
              <p className="uppercase tracking-[0.3em] text-sm text-[#F9D9A7]">{t('auth.register.heroBadge')}</p>
              <h1 className="font-bold text-3xl leading-snug drop-shadow-lg">{t('auth.register.heroTitle')}</h1>
              <p className="text-sm text-white/80 max-w-xs">
                {t('auth.register.heroSubtitle')}
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
              <p className="text-xs uppercase tracking-[0.4em] text-[#c29b6c] font-semibold">{t('auth.register.startTag')}</p>
              <h2 className="text-3xl font-bold text-[#331c11] mt-2">{t('auth.register.title')}</h2>
              <p className="text-sm text-[#746355] mt-2">{t('auth.register.subtitle')}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[#4a3c32] block mb-2">{t('auth.register.form.emailLabel')}</label>
                <div className="relative group">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5b29a] group-focus-within:text-[#9E211F] transition-colors" />
                  <input
                    type="email"
                    placeholder={t('auth.register.form.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full py-3 pl-11 pr-4 border border-[#efe7db] rounded-[16px] bg-white text-[#3b2c24] placeholder:text-[#c8bdac] focus:border-[#9E211F] focus:shadow-[0_15px_40px_rgba(158,33,31,0.15)] outline-none transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#4a3c32] block mb-2">{t('auth.register.form.usernameLabel')}</label>
                <div className="relative group">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5b29a] group-focus-within:text-[#9E211F] transition-colors" />
                  <input
                    type="text"
                    placeholder={t('auth.register.form.usernamePlaceholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full py-3 pl-11 pr-4 border border-[#efe7db] rounded-[16px] bg-white text-[#3b2c24] placeholder:text-[#c8bdac] focus:border-[#9E211F] focus:shadow-[0_15px_40px_rgba(158,33,31,0.15)] outline-none transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#4a3c32] block mb-2">{t('auth.register.form.phoneLabel')}</label>
                <div className="relative group">
                  <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5b29a] group-focus-within:text-[#9E211F] transition-colors" />
                  <input
                    type="tel"
                    placeholder={t('auth.register.form.phonePlaceholder')}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full py-3 pl-11 pr-4 border border-[#efe7db] rounded-[16px] bg-white text-[#3b2c24] placeholder:text-[#c8bdac] focus:border-[#9E211F] focus:shadow-[0_15px_40px_rgba(158,33,31,0.15)] outline-none transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#4a3c32] block mb-2">{t('auth.register.form.displayNameLabel')}</label>
                <div className="relative group">
                  <FaIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5b29a] group-focus-within:text-[#9E211F] transition-colors" />
                  <input
                    type="text"
                    placeholder={t('auth.register.form.displayNamePlaceholder')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full py-3 pl-11 pr-4 border border-[#efe7db] rounded-[16px] bg-white text-[#3b2c24] placeholder:text-[#c8bdac] focus:border-[#9E211F] focus:shadow-[0_15px_40px_rgba(158,33,31,0.15)] outline-none transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#4a3c32] flex items-center gap-2 mb-2">
                  <FaBirthdayCake className="text-[#c5b29a]" />
                  {t('auth.register.form.dobLabel')}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <DatePartSelect
                    options={dayOptions}
                    value={dobDay}
                    placeholder={t('auth.register.form.dobDay')}
                    onChange={(value) => {
                      setDobDay(value);
                      updateDobFromParts(value, dobMonth, dobYear);
                    }}
                  />
                  <DatePartSelect
                    options={monthOptions}
                    value={dobMonth}
                    placeholder={t('auth.register.form.dobMonth')}
                    onChange={(value) => {
                      setDobMonth(value);
                      updateDobFromParts(dobDay, value, dobYear);
                    }}
                  />
                  <DatePartSelect
                    options={yearOptions}
                    value={dobYear}
                    placeholder={t('auth.register.form.dobYear')}
                    onChange={(value) => {
                      setDobYear(value);
                      updateDobFromParts(dobDay, dobMonth, value);
                    }}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[#4a3c32] block mb-2">{t('auth.register.form.passwordLabel')}</label>
                  <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5b29a] group-focus-within:text-[#9E211F] transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.register.form.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full py-3 pl-11 pr-12 border border-[#efe7db] rounded-[16px] bg-white text-[#3b2c24] placeholder:text-[#c8bdac] focus:border-[#9E211F] focus:shadow-[0_15px_40px_rgba(158,33,31,0.15)] outline-none transition-all duration-200"
                    />
                  <button
                    type="button"
                    tabIndex={-1}
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
                <div>
                  <label className="text-sm font-semibold text-[#4a3c32] block mb-2">{t('auth.register.form.confirmPasswordLabel')}</label>
                  <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5b29a] group-focus-within:text-[#9E211F] transition-colors" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t('auth.register.form.confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full py-3 pl-11 pr-12 border border-[#efe7db] rounded-[16px] bg-white text-[#3b2c24] placeholder:text-[#c8bdac] focus:border-[#9E211F] focus:shadow-[0_15px_40px_rgba(158,33,31,0.15)] outline-none transition-all duration-200"
                    />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f7eee2] transition-colors"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                      <img
                        src={showConfirmPassword ? '/images/eye-icon.svg' : '/images/eye-icon-2.svg'}
                        alt={showConfirmPassword ? t('auth.common.hidePassword') : t('auth.common.showPassword')}
                        className="w-5 h-5 object-contain"
                      />
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-[16px] font-semibold text-white bg-gradient-to-r from-[#BB4B3E] to-[#9E211F] shadow-[0_20px_40px_rgba(158,33,31,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_25px_45px_rgba(158,33,31,0.45)] disabled:opacity-70 disabled:hover:-translate-y-0"
              >
                {loading ? t('auth.register.buttons.submitting') : t('auth.register.buttons.submit')}
              </button>
              <div className="text-center text-sm text-[#746355]">
                {t('auth.register.cta.haveAccount')}{' '}
                <Link to="/login" className="text-[#9E211F] font-semibold hover:underline">{t('auth.register.cta.loginLink')}</Link>
              </div>
            </form>
          </div>
        </div>
    </div>
  );
};

export default Register;
