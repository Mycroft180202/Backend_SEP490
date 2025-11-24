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
    <section className="relative w-full overflow-hidden bg-[#7F0B0B]">
      <div className="h-[320px] md:h-[420px] lg:h-[560px]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/Shopbanner.jpg"
            alt="Shop Banner"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#860000]/90 via-[#770000]/70 to-[#590000]/20" />
        </div>

        <div className="relative z-10 h-full">
          <div className="max-w-6xl mx-auto h-full px-5 sm:px-8 lg:px-16 flex flex-col md:flex-row items-center justify-center md:justify-start gap-8">
            <div className="text-white text-left max-w-2xl w-full md:max-w-lg">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight drop-shadow-lg md:whitespace-nowrap">
                {t('shop.banner.title')}
              </h1>
              <p className="mt-3 text-base sm:text-lg lg:text-2xl font-light text-white/90 drop-shadow-md">
                {t('shop.banner.subtitle')}
              </p>
              <button
                type="button"
                onClick={handleExploreClick}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#8B4513] font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                {t('shop.banner.cta')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

ShopBanner.propTypes = {
  onSelect: PropTypes.func,
};

export default ShopBanner;
