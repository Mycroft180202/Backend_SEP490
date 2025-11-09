import React, { useState } from 'react';
import { FaList, FaComments, FaTag, FaStar, FaBoxOpen } from 'react-icons/fa';

const Detail = ({ product, categoryName }) => {
  const [tab, setTab] = useState('description');

  if (!product) return null;

  return (
    <div className="w-full bg-gradient-to-b from-[#FFFDEB] to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Shop Info với style truyền thống */}
        <div className="flex items-center gap-4 mb-10 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border-l-4 border-[#D4A574]">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-[#D4A574] to-[#8B4513] p-1 shadow-lg">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              <img 
                alt={product.displayName} 
                className="w-full h-full object-cover" 
                src={product.userUrlImage || '/images/default-avatar.png'} 
              />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Nghệ nhân</p>
            <p className="text-xl font-bold text-[#8B4513]" style={{ fontFamily: 'Telex, sans-serif' }}>
              {product.shopName || product.displayName}
            </p>
          </div>
          <button className="px-6 py-2 bg-gradient-to-r from-[#D4A574] to-[#8B4513] text-white rounded-lg hover:from-[#8B4513] hover:to-[#D4A574] transition-all font-medium shadow-md">
            Xem Shop →
          </button>
        </div>

        {/* Tabs với style đẹp */}
        <div className="flex items-center gap-6 mb-8 border-b-2 border-[#D4A574] pb-1">
          <button
            onClick={() => setTab('description')}
            className={`flex items-center gap-2 text-lg font-semibold pb-3 border-b-4 transition-all ${
              tab === 'description' 
                ? 'text-[#8B4513] border-[#8B4513]' 
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            <FaList />
            Mô tả sản phẩm
          </button>
          <button
            onClick={() => setTab('feedback')}
            className={`flex items-center gap-2 text-lg font-semibold pb-3 border-b-4 transition-all ${
              tab === 'feedback' 
                ? 'text-[#8B4513] border-[#8B4513]' 
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            <FaComments />
            Đánh giá
          </button>
        </div>

        {/* Content */}
        {tab === 'description' ? (
          <div className="space-y-8">
            {/* Long Description với khung trang trí */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-[#D4A574]/30">
              <div className="prose max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line" style={{ fontFamily: 'Telex, sans-serif' }}>
                  {product.longDescription || product.shortDescription}
                </p>
              </div>
            </div>

            {/* Product Info - Gộp thành 1 phần */}
            <div className="bg-gradient-to-br from-white to-[#FFF8E7] rounded-2xl p-8 shadow-xl border-2 border-[#D4A574]">
              <h3 className="text-2xl font-bold text-[#8B4513] mb-6 flex items-center gap-3" style={{ fontFamily: 'Telex, sans-serif' }}>
                <FaTag className="text-[#D4A574]" />
                Thông tin sản phẩm
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Danh mục */}
                <div className="bg-white/80 rounded-xl p-5 shadow-md border-l-4 border-[#D4A574] hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <FaTag className="text-[#D4A574]" size={20} />
                    <span className="text-sm text-gray-500 font-medium">Danh mục</span>
                  </div>
                  <p className="text-lg font-semibold text-[#8B4513]">{categoryName || product.category}</p>
                </div>
                
                {/* Đánh giá */}
                <div className="bg-white/80 rounded-xl p-5 shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <FaStar className="text-yellow-500" size={20} />
                    <span className="text-sm text-gray-500 font-medium">Đánh giá</span>
                  </div>
                  <p className="text-lg font-semibold text-[#8B4513]">{product.rating || 0} / 5 ⭐</p>
                </div>
                
                {/* Kho */}
                <div className="bg-white/80 rounded-xl p-5 shadow-md border-l-4 border-green-500 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <FaBoxOpen className="text-green-500" size={20} />
                    <span className="text-sm text-gray-500 font-medium">Tồn kho</span>
                  </div>
                  <p className="text-lg font-semibold text-[#8B4513]">{product.stock} sản phẩm</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Feedback Section - TODO: Implement when API is ready */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border-2 border-[#D4A574]/30">
              <div className="text-center text-gray-500">
                <FaComments className="mx-auto mb-4 text-[#D4A574]" size={48} />
                <p className="text-lg">Chưa có đánh giá nào cho sản phẩm này</p>
                <p className="text-sm mt-2">Hãy là người đầu tiên đánh giá sản phẩm!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Detail;
