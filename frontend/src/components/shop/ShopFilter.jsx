import React, { useContext, useEffect, useRef, useState } from 'react';
import { CategoryService } from '../../services/modules/products/categoryService';
import { FaSearch, FaFilter, FaChevronDown } from 'react-icons/fa';
import { LanguageContext } from '../../context/LanguageContext';

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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await CategoryService.getAllCategories();
        setCategories(data || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      onSearchSubmit();
    }
  };

  const selectedCategoryName = selectedCategory
    ? categories.find((cat) => cat.id === selectedCategory)?.name
    : t('shop.filter.allProductsHeading');

  const sortOptions = [
    { value: '', label: t('shop.filter.sort.default') },
    { value: 'lowToHigh', label: t('shop.filter.sort.lowToHigh') },
    { value: 'highToLow', label: t('shop.filter.sort.highToLow') },
    { value: 'aToZ', label: t('shop.filter.sort.aToZ') },
    { value: 'zToA', label: t('shop.filter.sort.zToA') },
  ];

  useEffect(() => {
    const handler = (event) => {
      if (
        categoryDropdownRef.current
        && !categoryDropdownRef.current.contains(event.target)
      ) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  const categoryOptions = [
    { id: null, name: t('shop.filter.allLabel') },
    ...categories,
  ];

  return (
    <section className="mb-10">
      <div className="bg-white/90 border border-[#F1D2AA] rounded-[32px] p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1 group">
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#c5b29a] group-focus-within:text-[#9E211F] transition-colors" />
            <input
              type="text"
              className="w-full py-4 pl-12 pr-32 rounded-[20px] border border-[#efe7db] bg-white text-[#3b2c24] placeholder:text-[#c8bdac] font-['Nunito'] focus:border-[#9E211F] focus:shadow-[0_15px_35px_rgba(158,33,31,0.12)] outline-none transition-all duration-200"
              placeholder={t('shop.filter.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              onClick={onSearchSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-[16px] bg-gradient-to-r from-[#BB4B3E] to-[#9E211F] text-white font-['Nunito'] font-semibold shadow-[0_8px_18px_rgba(158,33,31,0.22)] hover:shadow-[0_16px_32px_rgba(158,33,31,0.28)] focus:shadow-[0_0_0_3px_rgba(158,33,31,0.35)] transition-shadow duration-200"
            >
              {t('shop.filter.searchButton') || 'Tìm kiếm'}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <div className="relative w-full sm:w-56" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setCategoryOpen((v) => !v)}
                className="w-full py-4 px-5 rounded-[20px] border border-[#efe7db] bg-white flex items-center justify-between text-[#3b2c24] font-['Nunito'] font-semibold hover:border-[#9E211F] transition-all duration-200"
              >
                <span>{selectedCategoryName}</span>
                <FaChevronDown className={`text-sm transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
              </button>
              {categoryOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-[#efe7db] rounded-[20px] shadow-2xl z-10 max-h-64 overflow-auto">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.id ?? 'all'}
                      type="button"
                      className={`w-full text-left px-5 py-3 font-['Nunito'] transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-[#9E211F]/10 text-[#9E211F]'
                          : 'hover:bg-[#FFF6EF] text-[#3b2c24]'
                      }`}
                      onClick={() => {
                        onCategoryChange(category.id);
                        setCategoryOpen(false);
                      }}
                    >
                      {category.name || t('shop.filter.unknownCategory')}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative w-full sm:w-52">
              <button
                type="button"
                className="w-full py-4 px-5 rounded-[20px] border border-[#efe7db] bg-white flex items-center justify-between text-[#3b2c24] font-['Nunito'] font-semibold hover:border-[#9E211F] transition-all duration-200"
                onClick={() => setFilterOpen((v) => !v)}
              >
                <span className="flex items-center gap-2">
                  <FaFilter />
                  {t('shop.filter.sortButton')}
                </span>
                <FaChevronDown className={`text-sm transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
              {filterOpen && (
                <div className="absolute right-0 left-0 mt-2 bg-white shadow-2xl rounded-[20px] border border-[#efe7db] z-20">
                  <div className="px-5 py-3 font-['Nunito'] font-semibold text-[#8B4513]">
                    {t('shop.filter.sortTitle')}
                  </div>
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`w-full text-left px-5 py-3 font-['Nunito'] transition-colors ${
                        sortOption === opt.value
                          ? 'bg-[#9E211F]/10 text-[#9E211F]'
                          : 'hover:bg-[#FFF6EF] text-[#3b2c24]'
                      }`}
                      onClick={() => {
                        onSortChange(opt.value);
                        setFilterOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <h2 className="font-['Nunito'] text-3xl font-bold text-[#8B4513] mt-10">{selectedCategoryName}</h2>
    </section>
  );
};

export default ShopFilter;
