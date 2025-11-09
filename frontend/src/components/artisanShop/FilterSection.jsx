import React, { useState } from 'react';

const FilterSection = ({ onSortChange, onPriceFilterChange }) => {
  const [activeTab, setActiveTab] = useState('popular');
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');

  const tabs = [
    { id: 'popular', label: 'Bán chạy' },
    { id: 'all', label: 'Tất cả sản phẩm' },
    { id: 'new', label: 'Mới nhất' }
  ];

  const priceRanges = [
    { id: 'all', label: 'Tất cả', min: 0, max: Infinity },
    { id: 'under100k', label: 'Dưới 100.000đ', min: 0, max: 100000 },
    { id: '100k-300k', label: '100.000đ - 300.000đ', min: 100000, max: 300000 },
    { id: '300k-500k', label: '300.000đ - 500.000đ', min: 300000, max: 500000 },
    { id: '500k-1m', label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
    { id: 'above1m', label: 'Trên 1.000.000đ', min: 1000000, max: Infinity }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (onSortChange) {
      onSortChange(tabId);
    }
  };

  const handlePriceSelect = (range) => {
    setSelectedPriceRange(range.id);
    setIsPriceDropdownOpen(false);
    if (onPriceFilterChange) {
      onPriceFilterChange(range);
    }
  };

  const getCurrentPriceLabel = () => {
    const range = priceRanges.find(r => r.id === selectedPriceRange);
    return range ? range.label : 'Giá';
  };

  return (
    <section className="bg-background border-b-2 border-text-light/20 py-4">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-36">
        {/* Tabs and Filter Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Tabs Section */}
          <div className="flex items-center gap-4 md:gap-6 flex-wrap">
            {tabs.map((tab, index) => (
              <React.Fragment key={tab.id}>
                <button
                  onClick={() => handleTabClick(tab.id)}
                  className={`font-alata text-base md:text-xl transition-all ${
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-text-light hover:text-text-gray'
                  }`}
                >
                  {tab.label}
                </button>
                {index < tabs.length - 1 && (
                  <div className="w-2 h-2 bg-text-light/50 rounded-full"></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Price Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-text-light/50 rounded-xl hover:border-primary transition-all bg-white font-nunito text-base text-text-gray"
              >
                <span>{getCurrentPriceLabel()}</span>
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform ${isPriceDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M19.9201 8.94995L13.4001 15.47C12.6301 16.24 11.3701 16.24 10.6001 15.47L4.08008 8.94995" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isPriceDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 md:w-64 bg-white border border-text-light/30 rounded-xl shadow-xl z-20 overflow-hidden">
                  <div className="py-1">
                    {priceRanges.map((range) => (
                      <button
                        key={range.id}
                        onClick={() => handlePriceSelect(range)}
                        className={`w-full text-left px-4 py-2.5 font-nunito text-base transition-colors ${
                          selectedPriceRange === range.id
                            ? 'bg-secondary/30 text-primary font-semibold'
                            : 'text-text hover:bg-background'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Icon Button */}
            <button className="p-2 border border-text-light/50 rounded-xl hover:border-primary transition-all bg-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.40039 2.09998H18.6004C19.7004 2.09998 20.6004 2.99998 20.6004 4.09998V6.29998C20.6004 7.09998 20.1004 8.09998 19.6004 8.59998L15.3004 12.4C14.7004 12.9 14.3004 13.9 14.3004 14.7V19C14.3004 19.6 13.9004 20.4 13.4004 20.7L12.0004 21.6C10.7004 22.4 8.90039 21.5 8.90039 19.9V14.6C8.90039 13.9 8.50039 13 8.10039 12.5L4.30039 8.49998C3.80039 7.99998 3.40039 7.09998 3.40039 6.49998V4.19998C3.40039 2.99998 4.30039 2.09998 5.40039 2.09998Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-4 w-full h-0.5 bg-gradient-to-r from-transparent via-text-light/30 to-transparent"></div>
      </div>
    </section>
  );
};

export default FilterSection;
