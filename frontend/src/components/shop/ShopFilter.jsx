import React, { useContext, useEffect, useRef, useState } from 'react';
import { CategoryService } from '../../services/modules/products/categoryService';
import { FaSearch, FaFilter, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const categoryScrollRef = useRef(null);
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

  const updateScrollState = () => {
    const container = categoryScrollRef.current;
    if (!container) return;
    const maxScrollLeft = container.scrollWidth - container.clientWidth - 4;
    setCanScrollLeft(container.scrollLeft > 8);
    setCanScrollRight(container.scrollLeft < maxScrollLeft);
  };

  const handleCategoryScroll = (direction) => {
    if (!categoryScrollRef.current) return;
    categoryScrollRef.current.scrollBy({
      left: direction * 240,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const container = categoryScrollRef.current;
    if (!container) return;

    const handleResize = () => {
      updateScrollState();
    };

    updateScrollState();
    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', handleResize);
    };
  }, [categories.length]);

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

  return (
    <section className="mb-8">
      <h2 className="font-['Nunito'] text-3xl font-bold text-[#8B4513]">{selectedCategoryName}</h2>

      <div className="mt-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="relative w-full xl:max-w-[70%]">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleCategoryScroll(-1)}
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 bg-white border border-[#D4A574] text-[#8B4513] w-10 h-10 rounded-full shadow-lg hover:bg-[#FFFBF0] transition z-20 items-center justify-center"
              aria-label={t('shop.filter.scrollLeft')}
            >
              <FaChevronLeft />
            </button>
          )}

          <div
            ref={categoryScrollRef}
            className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              type="button"
              className={`px-5 py-3 rounded-full font-['Nunito'] font-semibold flex-shrink-0 transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-[#8B4513] text-white shadow-lg'
                  : 'bg-white text-[#8B4513] border-2 border-[#D4A574] hover:bg-[#FFFBF0]'
              }`}
              onClick={() => onCategoryChange(null)}
            >
              {t('shop.filter.allLabel')}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`px-5 py-3 rounded-full font-['Nunito'] font-semibold flex-shrink-0 transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-[#8B4513] text-white shadow-lg'
                    : 'bg-white text-[#8B4513] border-2 border-[#D4A574] hover:bg-[#FFFBF0]'
                }`}
                onClick={() => onCategoryChange(category.id)}
              >
                {category.name || t('shop.filter.unknownCategory')}
              </button>
            ))}
          </div>

          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleCategoryScroll(1)}
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 bg-white border border-[#D4A574] text-[#8B4513] w-10 h-10 rounded-full shadow-lg hover:bg-[#FFFBF0] transition z-20 items-center justify-center"
              aria-label={t('shop.filter.scrollRight')}
            >
              <FaChevronRight />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 relative">
          <div className="border-2 border-[#D4A574] p-3 rounded-lg flex items-center gap-2 bg-white shadow-md hover:shadow-lg transition-shadow">
            <FaSearch className="text-[#8B4513]" />
            <input
              type="text"
              className="outline-none bg-transparent font-['Nunito'] text-gray-700 placeholder-gray-400"
              placeholder={t('shop.filter.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ width: 280 }}
            />
          </div>

          <button
            type="button"
            className="px-4 py-3 rounded-lg bg-white border-2 border-[#D4A574] text-[#8B4513] font-['Nunito'] font-semibold hover:bg-[#FFFBF0] transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <FaFilter />
            <span>{t('shop.filter.sortButton')}</span>
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-14 bg-white shadow-2xl rounded-lg p-4 z-10 min-w-[220px] border-2 border-[#D4A574]">
              <div className="font-['Nunito'] font-bold text-[#8B4513] mb-3 text-lg">
                {t('shop.filter.sortTitle')}
              </div>
              {sortOptions.map((opt) => (
                <div
                  key={opt.value}
                  role="button"
                  tabIndex={0}
                  className={`py-2 px-3 rounded-lg cursor-pointer font-['Nunito'] transition-colors duration-200 ${
                    sortOption === opt.value
                      ? 'bg-[#8B4513] text-white'
                      : 'hover:bg-[#FFFBF0] text-gray-700'
                  }`}
                  onClick={() => {
                    onSortChange(opt.value);
                    setFilterOpen(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      onSortChange(opt.value);
                      setFilterOpen(false);
                    }
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
