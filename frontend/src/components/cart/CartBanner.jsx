import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Breadcrumb from '../shared/Breadcrumb';
import { LanguageContext } from '../../context/LanguageContext';

const CartBanner = ({ breadcrumbItems = [] }) => {
  const { t } = useContext(LanguageContext);

  return (
    <section className="relative w-full bg-[#FFF8E7] overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/banner.jpg"
          alt="Cart banner"
          className="w-full h-full object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff8e7] via-[#fff7e1]/80 to-[#fef4d7]" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-16 flex flex-col gap-6">
        {breadcrumbItems.length > 0 && (
          <Breadcrumb items={breadcrumbItems} floating className="w-fit" />
        )}
        <div>
          <h1 className="text-3xl sm:text-4xl font-alata text-[#8B4513]">
            {t('cart.banner.title')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            {t('cart.banner.description')}
          </p>
        </div>
      </div>
    </section>
  );
};

CartBanner.propTypes = {
  breadcrumbItems: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string,
  })),
};

export default CartBanner;
