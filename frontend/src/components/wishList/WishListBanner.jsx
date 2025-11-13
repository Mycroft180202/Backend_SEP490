import React from 'react';
import CustomBreadcrumbs from '../shared/CustomBreadcrumbs';

const WishListBanner = ({ itemCount = 0 }) => {
  return (
    <div className="wishlist-banner" style={{
      position: 'relative',
      width: '100%',
      backgroundColor: '#fdfdf5',
      padding: '12px 144px',
    }}>
      <div className="absolute left-4 top-4 md:left-8 md:top-8 z-20">
        <div className="text-white">
          <CustomBreadcrumbs
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Danh sách yêu thích', href: '/wishlist' }
            ]}
          />
        </div>
      </div>
      <h2 className="wishlist-title" style={{
        fontFamily: 'Alata, sans-serif',
        fontSize: '36px',
        lineHeight: '56px',
        color: '#9e211f',
        marginTop: '48px',
      }}>
        Sản phẩm yêu thích ({itemCount})
      </h2>
    </div>
  );
};

export default WishListBanner;
