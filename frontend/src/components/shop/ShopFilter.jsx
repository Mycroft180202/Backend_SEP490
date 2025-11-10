import React, { useEffect, useState } from 'react';
import { CategoryService } from '../../services/modules/products/categoryService';
import { FaSearch, FaFilter } from 'react-icons/fa';

const ShopFilter = ({
  selectedCategory,
  onCategoryChange,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  sortOption,
  onSortChange,
}) => {
  const [categories, setCategories] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await CategoryService.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Xử lý khi nhấn Enter trong ô search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  // Lấy tên danh mục hiện tại
  const selectedCategoryName = selectedCategory
    ? categories.find((cat) => cat.id === selectedCategory)?.name
    : 'Tất cả sản phẩm';

  const sortOptions = [
    { value: '', label: 'Mặc định' },
    { value: 'lowToHigh', label: 'Giá thấp đến cao' },
    { value: 'highToLow', label: 'Giá cao đến thấp' },
    { value: 'aToZ', label: 'Tên A → Z' },
    { value: 'zToA', label: 'Tên Z → A' },
  ];

  return (
    <section className="mb-8">
      <h2 className="font-['Nunito'] text-3xl font-bold text-[#8B4513]">{selectedCategoryName}</h2>

      <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
        {/* --- Danh mục sản phẩm --- */}
        <div className="flex gap-3 flex-wrap">
          <button
            className={`px-6 py-3 rounded-lg font-['Nunito'] font-semibold transition-all duration-300 ${
              selectedCategory === null
                ? 'bg-[#8B4513] text-white shadow-lg'
                : 'bg-white text-[#8B4513] border-2 border-[#D4A574] hover:bg-[#FFFBF0]'
            }`}
            onClick={() => onCategoryChange(null)}
          >
            Tất cả
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-6 py-3 rounded-lg font-['Nunito'] font-semibold transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-[#8B4513] text-white shadow-lg'
                  : 'bg-white text-[#8B4513] border-2 border-[#D4A574] hover:bg-[#FFFBF0]'
              }`}
              onClick={() => onCategoryChange(category.id)}
            >
              {category.name || 'Không tên'}
            </button>
          ))}
        </div>

        {/* --- Thanh tìm kiếm và bộ lọc --- */}
        <div className="flex items-center gap-3 relative">
          {/* Ô tìm kiếm - Dài hơn */}
          <div className="border-2 border-[#D4A574] p-3 rounded-lg flex items-center gap-2 bg-white shadow-md hover:shadow-lg transition-shadow">
            <FaSearch className="text-[#8B4513]" />
            <input
              type="text"
              className="outline-none bg-transparent font-['Nunito'] text-gray-700 placeholder-gray-400"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ width: 280 }}
            />
          </div>

          {/* Bộ lọc */}
          <button
            className="px-4 py-3 rounded-lg bg-white border-2 border-[#D4A574] text-[#8B4513] font-['Nunito'] font-semibold hover:bg-[#FFFBF0] transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <FaFilter />
            <span>Sắp xếp</span>
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-14 bg-white shadow-2xl rounded-lg p-4 z-10 min-w-[220px] border-2 border-[#D4A574]">
              <div className="font-['Nunito'] font-bold text-[#8B4513] mb-3 text-lg">Sắp xếp theo:</div>
              {sortOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`py-2 px-3 rounded-lg cursor-pointer font-['Nunito'] transition-colors duration-200 ${
                    sortOption === opt.value
                      ? 'bg-[#8B4513] text-white'
                      : 'hover:bg-[#FFFBF0] text-gray-700'
                  }`}
                  onClick={() => {
                    onSortChange(opt.value);
                    setFilterOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ShopFilter;
