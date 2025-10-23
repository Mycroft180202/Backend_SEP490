
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header
      className="relative flex items-center justify-between px-[40px] py-[12px] w-full min-h-[68px]"
      style={{ background: 'rgba(122, 9, 9, 0.85)', backdropFilter: 'blur(30px)' }}
    >
      <div className="flex items-center gap-2 relative z-10">
        <img src="/images/OnlyLogo.png" alt="logo" className="w-[44px] h-[44px] rounded-full object-cover" />
        <span style={{ fontFamily: 'Alata, sans-serif', fontSize: 20, lineHeight: '32px', color: '#fff', fontWeight: 400 }}>
          Hoa Lac Handicraft
        </span>
      </div>
      {/* Navigation */}
      <nav className="flex items-center gap-[24px] relative z-10">
        <Link to="/" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>Trang chủ</Link>
        <Link to="/about" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>Về chúng tôi</Link>
        <Link to="/shop" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>Cửa hàng</Link>
        <Link to="/blog" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>Blog</Link>
        <Link to="/contact" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>Liên hệ</Link>
      </nav>
      {/* Actions */}
      <div className="flex items-center gap-[16px] relative z-10">
        {/* Search icon */}
        <button className="w-6 h-6 flex items-center justify-center" style={{ background: 'transparent', border: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#fff" width="24" height="24">
            <circle cx="11" cy="11" r="8" stroke="#fff" strokeWidth="1.5" />
            <line x1="20" y1="20" x2="16.65" y2="16.65" stroke="#fff" strokeWidth="1.5" />
          </svg>
        </button>
        {/* Notification icon */}
        <button className="w-6 h-6 flex items-center justify-center" style={{ background: 'transparent', border: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#fff" width="24" height="24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.63 5.36 6 7.92 6 11v5l-1.7 1.7c-.14.14-.3.3-.3.6v.1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-.1c0-.3-.16-.46-.3-.6L18 16z" stroke="#fff" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
        {/* Cart icon */}
        <button className="w-6 h-6 flex items-center justify-center" style={{ background: 'transparent', border: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#fff" width="24" height="24">
            <path d="M6 6h15l-1.5 9h-13L6 6zm0 0L4 2H2" stroke="#fff" strokeWidth="1.5" fill="none" />
            <circle cx="9" cy="21" r="1" stroke="#fff" strokeWidth="1.5" />
            <circle cx="18" cy="21" r="1" stroke="#fff" strokeWidth="1.5" />
          </svg>
        </button>
        {/* Login button */}
        <Link to="/login" className="px-6 py-[6px] border border-white rounded-[12px] flex items-center" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, fontWeight: 500, lineHeight: '32px', color: '#fff' }}>
          Đăng nhập
        </Link>

        {/* Flag */}
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
