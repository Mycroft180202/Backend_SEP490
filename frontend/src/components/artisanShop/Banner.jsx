import React from 'react';
import PropTypes from 'prop-types';
import Breadcrumb from '../shared/Breadcrumb';

const Banner = ({
  title,
  author,
  subtitle,
  rating,
  address,
  phone,
  image,
  breadcrumbItems = [],
}) => {
  const displayTitle = title || 'Cửa hàng thủ công';
  const displayAuthor = author || '';
  const displaySubtitle = subtitle || 'Ngôi nhà của những sản phẩm thủ công tinh tế.';
  const displayAddress = address || 'Địa chỉ chưa cập nhật';
  const displayPhone = phone || '';
  const displayRating = rating ?? '—';
  const displayImage = image || '/images/default-avatar.png';

  return (
    <section className="relative w-full h-[320px] md:h-[400px] lg:h-[480px] bg-gradient-to-br from-primary to-[#710004] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/Rectangle 38.png"
          alt="Background"
          className="w-full h-full object-cover opacity-15"
        />
      </div>

      {breadcrumbItems.length > 0 && (
        <div className="absolute top-4 left-4 md:left-8 z-20">
          <Breadcrumb items={breadcrumbItems} floating />
        </div>
      )}

      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-12 w-full">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <div className="flex-shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                <img
                  src={displayImage}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 text-center md:text-left text-white">
              <div>
                <h1 className="font-alata text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-lg">
                  {displayTitle}
                </h1>
                {displayAuthor && (
                  <p className="text-sm md:text-base text-white/90 mt-1">Bởi {displayAuthor}</p>
                )}
              </div>

              <p className="font-nunito text-sm md:text-base text-white/90 leading-relaxed max-w-3xl">
                {displaySubtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl h-[42px]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <path d="M10.0001 11.1917C11.4359 11.1917 12.6001 10.0275 12.6001 8.5917C12.6001 7.15587 11.4359 5.9917 10.0001 5.9917C8.56425 5.9917 7.40008 7.15587 7.40008 8.5917C7.40008 10.0275 8.56425 11.1917 10.0001 11.1917Z" stroke="white" strokeWidth="1.5" />
                    <path d="M3.01675 7.07502C4.65842 -0.141644 15.3501 -0.133311 16.9834 7.08336C17.9417 11.3167 15.3084 14.9 13.0001 17.1167C11.3251 18.7334 8.67508 18.7334 6.99175 17.1167C4.69175 14.9 2.05842 11.3084 3.01675 7.07502Z" stroke="white" strokeWidth="1.5" />
                  </svg>
                  <span className="font-nunito text-sm text-white">{displayAddress}</span>
                </div>
                {displayPhone && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl h-[42px]">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                      <path d="M18.3084 15.275C18.3084 15.575 18.2417 15.8833 18.1001 16.1833C17.9584 16.4833 17.7751 16.7667 17.5334 17.0333C17.1251 17.4833 16.6751 17.8083 16.1667 18.0167C15.6667 18.225 15.1251 18.3333 14.5417 18.3333C13.6917 18.3333 12.7834 18.1333 11.8251 17.725C10.8667 17.3167 9.90841 16.7667 8.95841 16.075C7.99175 15.3667 7.09175 14.5833 6.25008 13.7167C5.41675 12.8417 4.64175 11.925 3.92508 10.9667C3.22508 10.0083 2.67508 9.05833 2.27508 8.11667C1.87508 7.16667 1.67508 6.25833 1.67508 5.39167C1.67508 4.825 1.77508 4.28333 1.97508 3.78333C2.17508 3.275 2.49175 2.80833 2.93341 2.39167C3.45841 1.86667 4.03341 1.61667 4.64175 1.61667C4.89175 1.61667 5.14175 1.675 5.36675 1.79167C5.60008 1.90833 5.80841 2.08333 5.97508 2.33333L7.90008 5.18333C8.06675 5.425 8.19175 5.64167 8.27508 5.85C8.35841 6.05 8.40008 6.25 8.40008 6.43333C8.40008 6.66667 8.33341 6.9 8.20008 7.125C8.07508 7.35 7.90008 7.58333 7.68341 7.81667L6.98341 8.55C6.88341 8.65 6.83341 8.76667 6.83341 8.91667C6.83341 8.99167 6.84175 9.05833 6.85841 9.13333C6.88341 9.20833 6.90841 9.26667 6.92508 9.325C7.09175 9.64167 7.36675 10.0333 7.75008 10.4917C8.14175 10.95 8.56675 11.4167 9.03341 11.8833C9.50841 12.35 9.96675 12.7833 10.4334 13.175C10.8917 13.5583 11.2834 13.825 11.6084 13.9917C11.6584 14.0083 11.7167 14.0333 11.7834 14.0583C11.8584 14.0833 11.9334 14.0917 12.0167 14.0917C12.1751 14.0917 12.2917 14.0333 12.3917 13.9333L13.1001 13.2333C13.3417 13 13.5751 12.825 13.8001 12.7083C14.0251 12.575 14.2501 12.5083 14.4917 12.5083C14.6751 12.5083 14.8667 12.5417 15.0751 12.625C15.2834 12.7083 15.5001 12.8333 15.7417 12.9917L18.6251 14.9417C18.8751 15.1083 19.0501 15.3 19.1584 15.525C19.2584 15.75 19.3167 15.975 19.3167 16.2417L18.3084 15.275Z" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" />
                    </svg>
                    <span className="font-nunito text-sm font-medium text-white">{displayPhone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  Đánh giá: {displayRating}
                </span>
                {displayAuthor && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Nghệ nhân: {displayAuthor}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

Banner.propTypes = {
  title: PropTypes.string,
  author: PropTypes.string,
  subtitle: PropTypes.string,
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  address: PropTypes.string,
  phone: PropTypes.string,
  image: PropTypes.string,
  breadcrumbItems: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string,
  })),
};

export default Banner;
