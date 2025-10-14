import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="flex justify-between items-center gap-[133px] py-5 px-10 w-[1440px] bg-transparent">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-20 h-20 rounded-full bg-[#D9D9D9]"></div>
        <h1 className="font-alata text-xl text-white">Hoa Lac Handicraft</h1>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-6">
        <Link to="/" className="font-nunito text-lg text-white hover:text-gray-200">
          Trang chủ
        </Link>
        <Link to="/about" className="font-nunito text-lg text-white hover:text-gray-200">
          Về chúng tôi
        </Link>
        <Link to="/shop" className="font-nunito text-lg text-white hover:text-gray-200">
          Cửa hàng
        </Link>
        <Link to="/blog" className="font-nunito text-lg text-white hover:text-gray-200">
          Blog
        </Link>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="w-6 h-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button className="w-6 h-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <button className="w-6 h-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </button>
        <button className="px-6 py-[6px] border border-white rounded-xl">
          <span className="font-nunito text-lg font-medium text-white">Đăng nhập</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
