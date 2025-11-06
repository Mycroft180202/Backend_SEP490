import React, { useEffect, useState } from 'react';
import { CategoryService } from '../../services/modules/products/categoryService';
import { FaSearch, FaFilter } from 'react-icons/fa';

const ShopFilter = ({
  selectedCategory,
  onCategoryChange,
  searchValue,
  onSearchChange,
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

  // Lấy tên danh mục hiện tại
  const selectedCategoryName = selectedCategory
    ? categories.find((cat) => cat.id === selectedCategory)?.name
    : 'Tất cả sản phẩm';

  const sortOptions = [
    { value: '', label: 'Mặc định' },
    { value: 'priceDesc', label: 'Giá cao đến thấp' },
    { value: 'priceAsc', label: 'Giá thấp đến cao' },
    { value: 'nameAsc', label: 'Tên A → Z' },
    { value: 'nameDesc', label: 'Tên Z → A' },
  ];

  return (
    <section className="mb-8">
      <h2 className="font-Alata text-3xl text-[#9e211f]">{selectedCategoryName}</h2>

      <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
        {/* --- Danh mục sản phẩm --- */}
        <div className="flex gap-3 flex-wrap">
          <div
            className={`bg-[#faf998] p-4 rounded-lg cursor-pointer ${
              selectedCategory === null ? 'border-2 border-[#9e211f]' : ''
            }`}
            onClick={() => onCategoryChange(null)}
          >
            Tất cả
          </div>
          {categories.map((category) => (
            <div
              key={category.id}
              className={`bg-[#faf998] p-4 rounded-lg cursor-pointer ${
                selectedCategory === category.id ? 'border-2 border-[#9e211f]' : ''
              }`}
              onClick={() => onCategoryChange(category.id)}
            >
              {category.name || 'Không tên'}
            </div>
          ))}
        </div>

        {/* --- Thanh tìm kiếm và bộ lọc --- */}
        <div className="flex items-center gap-3 relative">
          {/* Ô tìm kiếm */}
          <div className="border p-2 rounded-md flex items-center gap-2 bg-white">
            <FaSearch />
            <input
              type="text"
              className="outline-none bg-transparent ml-2"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ width: 140 }}
            />
          </div>

          {/* Bộ lọc */}
          <div
            className="p-2 cursor-pointer flex items-center gap-2"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <FaFilter />
            <span>Bộ lọc</span>
          </div>

          {filterOpen && (
            <div className="absolute right-0 top-12 bg-white shadow-lg rounded-lg p-4 z-10 min-w-[180px]">
              <div className="font-semibold mb-2">Sắp xếp theo:</div>
              {sortOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`py-1 px-2 rounded cursor-pointer hover:bg-[#faf998] ${
                    sortOption === opt.value ? 'bg-[#faf998]' : ''
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
