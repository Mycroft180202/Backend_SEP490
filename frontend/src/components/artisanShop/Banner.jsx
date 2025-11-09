import React from 'react';
import CustomBreadcrumbs from '../shared/CustomBreadcrumbs';

const Banner = ({ shopData = {} }) => {
  // Default shop data nếu không có props
  const shop = {
    image: shopData.image || "https://www.figma.com/api/mcp/asset/0ec54aba-2293-4b43-8c96-166b2524ff62",
    name: shopData.name || "Cửa Hàng Thủ Công Mỹ Nghệ Hòa Lạc",
    bio: shopData.bio || "Chuyên cung cấp các sản phẩm thủ công truyền thống, được làm thủ công bởi các nghệ nhân địa phương với tâm huyết và kỹ năng cao.",
    rating: shopData.rating || 4.9,
    reviewCount: shopData.reviewCount || 1250,
    address: shopData.address || "Thôn Hòa Lạc, Xã Thạch Hòa, Huyện Thạch Thất, Hà Nội",
    phone: shopData.phone || "0912 345 678",
    facebookUrl: shopData.facebookUrl || "#"
  };

  return (
    <section className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] bg-gradient-to-br from-primary to-[#710004] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/Rectangle 38.png"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Breadcrumb */}
      <div className="absolute top-4 left-4 md:left-8 z-20">
        <div className="bg-white/95 backdrop-blur-sm py-2 px-4 rounded-lg shadow-md">
          <CustomBreadcrumbs
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Cửa hàng', href: '/artisanShop' }
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-36 w-full">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            {/* Shop Image */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                <img 
                  src={shop.image} 
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Shop Info */}
            <div className="flex-1 flex flex-col gap-3 text-center md:text-left">
              {/* Shop Name & Rating */}
              <div>
                <h1 className="font-alata text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                  {shop.name}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.4421 1.92495L11.9087 4.85828C12.1087 5.26662 12.6421 5.65828 13.0921 5.73328L15.7504 6.17495C17.4504 6.45828 17.8504 7.69162 16.6254 8.90828L14.5587 10.975C14.2087 11.325 14.0171 12 14.1254 12.4833L14.7171 15.0416C15.1837 17.0666 14.1087 17.85 12.3171 16.7916L9.8254 15.3166C9.3754 15.05 8.6337 15.05 8.1754 15.3166L5.6837 16.7916C3.9004 17.85 2.8171 17.0583 3.2837 15.0416L3.8754 12.4833C3.9837 12 3.7921 11.325 3.4421 10.975L1.3754 8.90828C0.1587 7.69162 0.5504 6.45828 2.2504 6.17495L4.9087 5.73328C5.3504 5.65828 5.8837 5.26662 6.0837 4.85828L7.5504 1.92495C8.3504 0.333283 9.6504 0.333283 10.4421 1.92495Z" fill="#F0BE1D"/>
                    </svg>
                    <span className="font-nunito text-base md:text-lg font-semibold text-white">{shop.rating}</span>
                  </div>
                  <span className="font-nunito text-sm md:text-base text-white/90">
                    ({shop.reviewCount.toLocaleString()} đánh giá)
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p className="font-nunito text-sm md:text-base text-white/95 leading-relaxed max-w-3xl">
                {shop.bio}
              </p>

              {/* Contact Info & Facebook */}
              <div className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-4 mt-2">
                {/* Contact Info Grid */}
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl h-[42px]">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                      <path d="M10.0001 11.1917C11.4359 11.1917 12.6001 10.0275 12.6001 8.5917C12.6001 7.15587 11.4359 5.9917 10.0001 5.9917C8.56425 5.9917 7.40008 7.15587 7.40008 8.5917C7.40008 10.0275 8.56425 11.1917 10.0001 11.1917Z" stroke="white" strokeWidth="1.5"/>
                      <path d="M3.01675 7.07502C4.65842 -0.141644 15.3501 -0.133311 16.9834 7.08336C17.9417 11.3167 15.3084 14.9 13.0001 17.1167C11.3251 18.7334 8.67508 18.7334 6.99175 17.1167C4.69175 14.9 2.05842 11.3084 3.01675 7.07502Z" stroke="white" strokeWidth="1.5"/>
                    </svg>
                    <span className="font-nunito text-sm text-white">{shop.address}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl h-[42px]">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                      <path d="M18.3084 15.275C18.3084 15.575 18.2417 15.8833 18.1001 16.1833C17.9584 16.4833 17.7751 16.7667 17.5334 17.0333C17.1251 17.4833 16.6751 17.8083 16.1667 18.0167C15.6667 18.225 15.1251 18.3333 14.5417 18.3333C13.6917 18.3333 12.7834 18.1333 11.8251 17.725C10.8667 17.3167 9.90841 16.7667 8.95841 16.075C7.99175 15.3667 7.09175 14.5833 6.25008 13.7167C5.41675 12.8417 4.64175 11.925 3.92508 10.9667C3.22508 10.0083 2.67508 9.05833 2.27508 8.11667C1.87508 7.16667 1.67508 6.25833 1.67508 5.39167C1.67508 4.825 1.77508 4.28333 1.97508 3.78333C2.17508 3.275 2.49175 2.80833 2.93341 2.39167C3.45841 1.86667 4.03341 1.61667 4.64175 1.61667C4.89175 1.61667 5.14175 1.675 5.36675 1.79167C5.60008 1.90833 5.80841 2.08333 5.97508 2.33333L7.90008 5.18333C8.06675 5.425 8.19175 5.64167 8.27508 5.85C8.35841 6.05 8.40008 6.25 8.40008 6.43333C8.40008 6.66667 8.33341 6.9 8.20008 7.125C8.07508 7.35 7.90008 7.58333 7.68341 7.81667L6.98341 8.55C6.88341 8.65 6.83341 8.76667 6.83341 8.91667C6.83341 8.99167 6.84175 9.05833 6.85841 9.13333C6.88341 9.20833 6.90841 9.26667 6.92508 9.325C7.09175 9.64167 7.36675 10.0333 7.75008 10.4917C8.14175 10.95 8.56675 11.4167 9.03341 11.8833C9.50841 12.35 9.96675 12.7833 10.4334 13.175C10.8917 13.5583 11.2834 13.825 11.6084 13.9917C11.6584 14.0083 11.7167 14.0333 11.7834 14.0583C11.8584 14.0833 11.9334 14.0917 12.0167 14.0917C12.1751 14.0917 12.2917 14.0333 12.3917 13.9333L13.1001 13.2333C13.3417 13 13.5751 12.825 13.8001 12.7083C14.0251 12.575 14.2501 12.5083 14.4917 12.5083C14.6751 12.5083 14.8667 12.5417 15.0751 12.625C15.2834 12.7083 15.5001 12.8333 15.7417 12.9917L18.6251 14.9417C18.8751 15.1083 19.0501 15.3 19.1584 15.525C19.2584 15.75 19.3167 15.975 19.3167 16.2417L18.3084 15.275Z" stroke="white" strokeWidth="1.5" strokeMiterlimit="10"/>
                    </svg>
                    <span className="font-nunito text-sm font-medium text-white">{shop.phone}</span>
                  </div>
                </div>

                {/* Facebook Link */}
                <a 
                  href={shop.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#1877f2] hover:bg-[#145dbf] text-white font-nunito font-semibold text-sm px-5 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl h-[42px]"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <path d="M20 10C20 4.47715 15.5229 0 10 0C4.47715 0 0 4.47715 0 10C0 14.9912 3.65684 19.1283 8.4375 19.8785V12.8906H5.89844V10H8.4375V7.79688C8.4375 5.29063 9.93047 3.90625 12.2146 3.90625C13.3084 3.90625 14.4531 4.10156 14.4531 4.10156V6.5625H13.1922C11.95 6.5625 11.5625 7.3334 11.5625 8.125V10H14.3359L13.8926 12.8906H11.5625V19.8785C16.3432 19.1283 20 14.9912 20 10Z" fill="white"/>
                  </svg>
                  <span>Tìm hiểu thêm</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;