import React from 'react';
import CustomBreadcrumbs from '../shared/CustomBreadcrumbs';
const breadcrumbIcon = "https://www.figma.com/api/mcp/asset/367c48b8-7c15-4d78-8f4e-f9faa2495e38";

const CartBanner = () => {
  return (
    <div className="cart-banner" style={{
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
              { label: 'Giỏ hàng', href: '/about' }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default CartBanner;