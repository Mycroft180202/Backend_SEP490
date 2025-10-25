import React from 'react';

// Local asset paths (saved in public/images)
const logo = '/images/logo.png';
const searchIcon = '/images/search.png';
const notifIcon = '/images/notif.png';
const cartIcon = '/images/cart.png';
const avatar = '/images/avatar.png';

export default function ShopHeader({ className = '' }) {
  return (
    <header className={`${className} bg-[#fdfeee]`}>
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-10 py-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Hoa Lac Handicraft logo" className="w-11 h-11 object-contain" />
          <p className="font-Alata text-2xl">Hoa Lac Handicraft</p>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-lg">
          <a href="/" className="hover:underline">Trang chủ</a>
          <span>Về chúng tôi</span>
          <span>Cửa hàng</span>
          <span>Chính sách</span>
          <span>Blog</span>
          <span>Liên hệ</span>
        </nav>
        <div className="flex items-center gap-4">
          <img src={searchIcon} alt="Tìm kiếm" className="w-6 h-6" />
          <img src={notifIcon} alt="Thông báo" className="w-6 h-6" />
          <img src={cartIcon} alt="Giỏ hàng" className="w-6 h-6" />
          <button className="border px-4 py-1 rounded-md">Đăng nhập</button>
          <img src={avatar} alt="User avatar" className="w-6 h-6 rounded-full" />
        </div>
      </div>
    </header>
  );
}
