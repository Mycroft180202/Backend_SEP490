import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Breadcrumb from '../shared/Breadcrumb';
import { LanguageContext } from '../../context/LanguageContext';

const CheckoutBanner = ({ breadcrumbItems = [] }) => {
  const { t } = useContext(LanguageContext);

  return (
    <section className="relative w-full overflow-hidden bg-[#fef1ea]">
      <div className="absolute inset-0">
        <img
          src="/images/banner.jpg"
          alt="Checkout banner"
          className="w-full h-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fef1ea]/95 via-white/85 to-[#fde3d3]" />
      </div>
      <div className="relative max-w-[1440px] mx-auto px-4 md:px-10 py-12 flex flex-col gap-4">
        {breadcrumbItems.length > 0 && (
          <Breadcrumb items={breadcrumbItems} floating />
        )}
        <div className="space-y-2 text-[#7a1b18] drop-shadow-sm">
          <p className="uppercase tracking-[0.3em] text-xs text-[#c86555]">
            {t('checkout.banner.badge')}
          </p>
          <h1 className="font-alata text-3xl md:text-4xl text-[#5b0f0d]">
            {t('checkout.banner.title')}
          </h1>
          <p className="text-sm text-[#7f3d35] max-w-2xl">
            {t('checkout.banner.description')}
          </p>
        </div>
      </div>
    </section>
  );
};

CheckoutBanner.propTypes = {
  breadcrumbItems: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string,
  })),
};

export default CheckoutBanner;
