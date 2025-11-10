import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { LanguageContext } from '../../context/LanguageContext';

const ShopBanner = ({ onSelect = null }) => {
  const { t } = useContext(LanguageContext);

  const handleExploreClick = () => {
    if (onSelect) {
      onSelect(null);
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full h-[300px] md:h-[400px] lg:h-[600px] bg-red-700">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/Shopbanner.jpg"
          alt="Shop Banner"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute inset-0 flex items-center left-0 md:left-[120px] px-6 md:px-0">
        <div className="text-white max-w-xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            {t('shop.banner.title')}
          </h1>
          <p className="text-2xl md:text-3xl mt-4 font-light">
            {t('shop.banner.subtitle')}
          </p>
          <button
            type="button"
            onClick={handleExploreClick}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#8B4513] font-semibold shadow-lg hover:shadow-xl transition-transform hover:-translate-y-0.5"
          >
            {t('shop.banner.cta')}
          </button>
        </div>
      </div>
    </section>
  );
};

ShopBanner.propTypes = {
  onSelect: PropTypes.func,
};

export default ShopBanner;
