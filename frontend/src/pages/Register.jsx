import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/modules/auth/authService';
import { toast } from 'react-toastify';

const Register = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [showOtpInput, setShowOtpInput] = useState(false);
  const navigate = useNavigate();
  const otpRefs = useRef([]);
  
  // Khởi tạo refs cho các ô input OTP
  useEffect(() => {
    otpRefs.current = otpRefs.current.slice(0, 6);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = [];
    const usernameTrim = username.trim();
    if (!usernameTrim || usernameTrim.length < 3 || usernameTrim.length > 30) {
      errors.push('Tên đăng nhập phải từ 3–30 ký tự');
    }
    if (!password || password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }
    if (password !== confirmPassword) {
      errors.push('Mật khẩu xác nhận không khớp');
    }
    const emailTrim = email.trim();
    if (!emailTrim) {
      errors.push('Email không hợp lệ');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrim)) {
        errors.push('Email không hợp lệ');
      }
    }

    if (phoneNumber) {
      // loại bỏ khoảng trắng và dấu gạch ngang trước khi kiểm tra
      const phoneTrim = phoneNumber.trim().replace(/[\s-]/g, '');
      const phoneRegex = /^\+?\d{1,15}$/;
      if (phoneTrim.length > 15 || !phoneRegex.test(phoneTrim)) {
        errors.push('Số điện thoại không hợp lệ');
      }
    }
    if (displayName && displayName.length > 50) {
      errors.push('Tên hiển thị không được dài quá 50 ký tự');
    }
    if (dob) {
      const dobDate = new Date(dob);
      if (Number.isNaN(dobDate.getTime())) {
        errors.push('Ngày sinh không hợp lệ');
      } else {
        const now = new Date();
        const oldest = new Date();
        oldest.setFullYear(oldest.getFullYear() - 120);
        if (dobDate > now) {
          errors.push('Ngày sinh không thể ở tương lai');
        }
        if (dobDate < oldest) {
          errors.push('Ngày sinh không hợp lệ');
        }
      }
    }

    if (errors.length > 0) {
      errors.forEach((msg) => toast.error(msg));
      return;
    }

    setLoading(true);
    try {
      // Log để kiểm tra giá trị trước khi gửi
      console.log('Form values:', {
        email, username, password, phoneNumber, displayName, dob
      });

      const formData = new FormData();
      formData.append('Email', email);
      formData.append('Username', username);
      formData.append('PasswordHash', password);
      formData.append('PhoneNumber', phoneNumber);
      formData.append('DisplayName', displayName);
      if (dob) {
        formData.append('Dob', dob);
      }

      const response = await AuthService.register({
        Email: email,
        Username: username,
        PasswordHash: password,
        PhoneNumber: phoneNumber,
        DisplayName: displayName,
        Dob: dob
      });
      if (response.status === 200) {
        setShowOtpInput(true);
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.', {
          position: "top-right",
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.message || 'Email hoặc tên đăng nhập đã tồn tại!';
      
      // Hiển thị thông báo lỗi cụ thể
      if (errorMessage.includes('Username or email already exists!')) {
        toast.error('Email hoặc tên đăng nhập đã tồn tại!', {
          position: "top-right",
          autoClose: 3000
        });
      } else {
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000
        });
      }

      // Kiểm tra lỗi validation
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
      // Chuẩn bị dữ liệu theo đúng format backend yêu cầu
      const verifyOtpData = {
        registerDto: {
          username: username,
          passwordHash: password,
          email: email,
          phoneNumber: phoneNumber || '',
          displayName: displayName || '',
          dob: dob ? new Date(dob).toISOString() : null
        },
        otp: otp.join('')
      };

      const response = await AuthService.verifyOTP(verifyOtpData);
      
      if (response.status === 200) {
        toast.success('Mã OTP đúng, đăng ký thành công!', {
          position: "top-right",
          autoClose: 2000,
          onClose: () => {
            navigate('/');
          }
        });
      }
    } catch (error) {
      console.error('Lỗi xác thực OTP:', error);
      toast.error(error.response?.data?.message || 'Xác thực OTP thất bại', {
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
    try {
      toast.info('Đang gửi lại mã OTP...', {
        position: "top-right",
        autoClose: 2000
      });

      const response = await AuthService.register({
        Email: email,
        Username: username,
        PasswordHash: password,
        PhoneNumber: phoneNumber,
        DisplayName: displayName,
        Dob: dob
      });

      if (response.status === 200) {
        toast.success('Đã gửi lại mã OTP thành công!', {
          position: "top-right",
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('Resend OTP failed:', error);
      toast.error('Không thể gửi lại mã OTP. Vui lòng thử lại sau.', {
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
    <div className="fixed inset-0 flex items-center justify-center p-6" style={{ backgroundColor: '#FBFBEE' }}>
      
      {/* OTP Modal */}
      {showOtpInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full mx-4 animate-slideIn relative">
            {/* Nút đóng */}
            <button 
              onClick={() => setShowOtpInput(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Đóng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center justify-center mb-6">
              <img src="/images/OnlyLogo.png" alt="logo" className="w-12 h-12" />
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">Xác thực OTP</h2>
                <p className="text-gray-600 text-sm mt-1">Vui lòng nhập mã xác thực được gửi đến email của bạn</p>
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
                <p className="text-gray-500 text-sm mb-2">Không nhận được mã?</p>
                <button 
                  className="text-[#9E211F] text-sm font-medium hover:underline"
                  onClick={handleResendOtp}
                >
                  Gửi lại mã
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
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Register Form */}
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-transparent rounded-lg overflow-hidden relative" style={{ minHeight: 560 }}>
          {/* left image with overlay and welcome text */}
          <div className="hidden lg:block relative">
            <img src="/images/login-illustration.svg" alt="illustration" className="w-full h-full object-cover block rounded-l-lg" style={{ height: '100%' }} />
            <div className="absolute inset-0 rounded-l-lg" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.06) 50%)' }} />
            <h1 style={{ fontFamily: 'Alata, sans-serif', fontSize: 36, lineHeight: '56px', color: 'white' }} className="absolute left-12 top-12">Chào mừng đến với<br/>HoaLacHandicraft!</h1>
          </div>
          <div className="p-6 lg:p-8 flex flex-col justify-center">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px', color: '#000' }} className="block mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-3 px-4 border border-[#e0dfda] rounded-[12px] outline-none bg-transparent"
                />
              </div>
              <div className="mb-4">
                <label style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px', color: '#000' }} className="block mb-2">Tên đăng nhập</label>
                <input
                  type="text"
                  placeholder="Tên đăng nhập của bạn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full py-3 px-4 border border-[#e0dfda] rounded-[12px] outline-none bg-transparent"
                />
              </div>
              <div className="mb-4">
                <label style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px', color: '#000' }} className="block mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="Số điện thoại của bạn"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full py-3 px-4 border border-[#e0dfda] rounded-[12px] outline-none bg-transparent"
                />
              </div>
              <div className="mb-4">
                <label style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px', color: '#000' }} className="block mb-2">Họ và tên</label>
                <input
                  type="text"
                  placeholder="Họ và tên của bạn"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full py-3 px-4 border border-[#e0dfda] rounded-[12px] outline-none bg-transparent"
                />
              </div>
              <div className="mb-4">
                <label style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px', color: '#000' }} className="block mb-2">Ngày sinh</label>
                <input
                  type="date"
                  placeholder="Ngày sinh"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full py-3 px-4 border border-[#e0dfda] rounded-[12px] outline-none bg-transparent"
                />
              </div>
              <div className="mb-4">
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
                <label style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '28px', color: '#000' }} className="block mb-2">Xác nhận mật khẩu</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full py-3 px-4 border border-[#e0dfda] rounded-[12px] outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center p-1"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <img
                      src={showConfirmPassword ? '/images/eye-icon.svg' : '/images/eye-icon-2.svg'}
                      alt={showConfirmPassword ? 'Hide password' : 'Show password'}
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
              <div className="text-center text-sm text-gray-600 mt-4">
                <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, lineHeight: '24px' }}>Đã có tài khoản? </span>
                <Link to="/login" className="text-[#9E211F] font-medium hover:underline" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, lineHeight: '24px' }}>Đăng nhập</Link>
              </div>
            </form>
          </div>
        </div>
    </div>
  );
};

export default Register;
