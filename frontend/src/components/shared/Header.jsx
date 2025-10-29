import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';

const Header = () => {
  const { userInfo } = useContext(UserContext);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();

  const handleAvatarClick = () => {
    navigate('/orders');
  };

  return (
    <header
      className="relative flex items-center justify-between px-[40px] py-[12px] w-full min-h-[68px] z-50"
      style={{ background: 'rgba(122, 9, 9, 0.85)', backdropFilter: 'blur(30px)' }}
    >
      <div className="flex items-center gap-2 relative z-10">
        <img src="/images/OnlyLogo.png" alt="logo" className="w-[44px] h-[44px] rounded-full object-cover" />
        <span style={{ fontFamily: 'Alata, sans-serif', fontSize: 20, lineHeight: '32px', color: '#fff', fontWeight: 400 }}>
          Hoa Lac Handicraft
        </span>
      </div>
      <nav className="flex items-center gap-[24px] relative z-10">
        <Link to="/" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>Trang chủ</Link>
        <Link to="/about" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>Về chúng tôi</Link>
        <Link to="/shop" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>Cửa hàng</Link>
        <Link to="/blog" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>Blog</Link>
        <Link to="/contact" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>Liên hệ</Link>
      </nav>
      <div className="flex items-center gap-[16px] relative z-10">
        {userInfo ? (
          <div className="relative flex items-center gap-[16px]">
            <div
              className="relative"
              onMouseEnter={() => setDropdownVisible(true)}
              onMouseLeave={() => setDropdownVisible(false)}
            >
              <img
                src={userInfo.userUrlImage || '/images/default-avatar.png'}
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover cursor-pointer"
              />
              {isDropdownVisible && (
                <div
                  className="absolute w-56 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden"
                  style={{ 
                    zIndex: 1000, 
                    top: 'calc(100% + 8px)', 
                    left: '-300%',
                    paddingTop: '8px',
                    marginTop: '-8px'
                  }}
                >
                  <Link
                    to="/account"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Tài khoản của tôi
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Đơn mua
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      localStorage.removeItem('accessToken');
                      window.location.reload();
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link to="/login" className="px-6 py-[6px] border border-white rounded-[12px] flex items-center" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, fontWeight: 500, lineHeight: '32px', color: '#fff' }}>
            Đăng nhập
          </Link>
        )}
        <div className="w-[36px] h-[24px] rounded-full bg-white overflow-hidden flex items-center justify-center">
          <img src="/images/VNFlag.png" alt="flag" className="w-full h-full object-cover" />
        </div>
        <div className="w-[36px] h-[24px] rounded-full bg-white overflow-hidden flex items-center justify-center">
          <img src="/images/Engflag.png" alt="Eflag" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};

export default Header;