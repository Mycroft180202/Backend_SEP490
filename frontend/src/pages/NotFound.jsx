import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-background px-4 bg-no-repeat bg-center"
      style={{
        backgroundImage: "url('/images/404%20not%20found.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      <div className="text-center "> 
        <h1 className="text-6xl font-extrabold text-primary mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Không tìm thấy trang</h2>
        <p className="text-gray-500 mb-6 max-w-[520px] mx-auto">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển. Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-opacity-90 transition"
        >
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
