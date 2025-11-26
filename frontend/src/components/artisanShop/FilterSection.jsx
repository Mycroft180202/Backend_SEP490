import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';

const FilterSection = ({ artisanId }) => {
  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);
  const isArtisan = userInfo?.roles?.some((role) => (typeof role === 'string' ? role : role.name) === 'Artisan');
  const isOwner = artisanId && (userInfo?.userID === artisanId || userInfo?.userId === artisanId);

  return (
    <section className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-screen-xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between gap-4">
        <h2 className="text-lg md:text-xl font-semibold text-[#8B4513]">
          Tất cả sản phẩm của cửa hàng
        </h2>
        {isArtisan && isOwner && (
          <button
            type="button"
            onClick={() => navigate('/artisan-dashboard')}
            className="px-4 py-2 rounded-md bg-[#8B4513] text-white text-sm font-medium shadow hover:bg-[#703814] transition-colors"
          >
            Quản lý cửa hàng
          </button>
        )}
      </div>
    </section>
  );
};

export default FilterSection;
