import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';

const Footer = () => {
  const { t } = useContext(LanguageContext);

  const resolveText = (key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const policyLinks = [
    {
      label: resolveText('policy.privacyTitle', 'Chính sách bảo mật'),
      to: { pathname: '/policy', hash: '#privacy' },
    },
    {
      label: resolveText('policy.shippingTitle', 'Chính sách vận chuyển'),
      to: { pathname: '/policy', hash: '#shipping' },
    },
    {
      label: resolveText('policy.returnTitle', 'Chính sách đổi trả'),
      to: { pathname: '/policy', hash: '#return' },
    },
  ];

  const exploreLinks = [
    {
      label: resolveText('footer.explore.blog', 'Tin tức làng nghề'),
      to: '/blog',
    },
    {
      label: resolveText('footer.explore.collections', 'Bộ sưu tập sản phẩm'),
      to: { pathname: '/', hash: '#collections-section' },
    },
  ];

  return (
    <footer className="w-full py-10 px-6 sm:px-12 lg:px-24 xl:px-36 bg-[#7A0909] text-white">
      <div className="max-w-[1440px] mx-auto flex flex-col justify-center items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/images/OnlyLogo.png" alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover bg-white shadow" />
          <h2 className="font-alata text-xl sm:text-2xl leading-[42px] sm:leading-[48px]">Hoa Lac Handicraft</h2>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          <div className="flex flex-col gap-3">
            <h3 className="font-alata text-xl leading-8">{resolveText('footer.contactTitle', 'Liên hệ')}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 13.43C13.7231 13.43 15.12 12.0331 15.12 10.31C15.12 8.58687 13.7231 7.19 12 7.19C10.2769 7.19 8.88 8.58687 8.88 10.31C8.88 12.0331 10.2769 13.43 12 13.43Z" stroke="white" strokeWidth="1.5" />
                  <path d="M3.62001 8.49C5.59001 -0.169998 18.42 -0.159998 20.38 8.5C21.53 13.58 18.37 17.88 15.6 20.54C13.59 22.48 10.41 22.48 8.39001 20.54C5.63001 17.88 2.47001 13.57 3.62001 8.49Z" stroke="white" strokeWidth="1.5" />
                </svg>
                <span className="font-nunito text-base sm:text-lg leading-7">
                  {resolveText('footer.address', 'Hòa Lạc, Thạch Thất, Hà Nội')}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <a
                  href="mailto:Hoalachandicraft@gmail.com"
                  className="font-nunito text-base sm:text-lg leading-7 hover:text-yellow-200 transition-colors"
                >
                  {resolveText('footer.email', 'Hoalachandicraft@gmail.com')}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.97 18.33C21.97 18.69 21.89 19.06 21.72 19.42C21.55 19.78 21.33 20.12 21.04 20.44C20.55 20.98 20.01 21.37 19.4 21.62C18.8 21.87 18.15 22 17.45 22C16.43 22 15.34 21.76 14.19 21.27C13.04 20.78 11.89 20.12 10.75 19.29C9.6 18.45 8.51 17.52 7.47 16.49C6.44 15.45 5.51 14.36 4.68 13.22C3.86 12.08 3.2 10.94 2.72 9.81C2.24 8.67 2 7.58 2 6.54C2 5.86 2.12 5.21 2.36 4.61C2.6 4 2.98 3.44 3.51 2.94C4.15 2.31 4.85 2 5.59 2C5.87 2 6.15 2.06 6.4 2.18C6.66 2.3 6.89 2.48 7.07 2.74L9.39 6.01C9.57 6.26 9.7 6.49 9.79 6.71C9.88 6.92 9.93 7.13 9.93 7.32C9.93 7.56 9.86 7.8 9.72 8.03C9.59 8.26 9.4 8.5 9.16 8.74L8.4 9.53C8.29 9.64 8.24 9.77 8.24 9.93C8.24 10.01 8.25 10.08 8.27 10.16C8.3 10.24 8.33 10.3 8.35 10.36C8.53 10.69 8.84 11.12 9.28 11.64C9.73 12.16 10.21 12.69 10.73 13.22C11.27 13.75 11.79 14.24 12.32 14.69C12.84 15.13 13.27 15.43 13.61 15.61C13.66 15.63 13.72 15.66 13.79 15.69C13.87 15.72 13.95 15.73 14.04 15.73C14.21 15.73 14.34 15.67 14.45 15.56L15.21 14.81C15.46 14.56 15.7 14.37 15.93 14.25C16.16 14.11 16.39 14.04 16.64 14.04C16.83 14.04 17.03 14.08 17.25 14.17C17.47 14.26 17.7 14.39 17.95 14.56L21.26 16.91C21.52 17.09 21.7 17.3 21.81 17.55C21.91 17.8 21.97 18.05 21.97 18.33Z" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" />
                </svg>
                <a
                  href="tel:0921643475"
                  className="font-nunito text-base sm:text-lg leading-7 hover:text-yellow-200 transition-colors"
                >
                  {resolveText('footer.phone', '0921643475')}
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-alata text-xl leading-8">{resolveText('footer.policy.title', 'Chính sách')}</h3>
            <div className="flex flex-col gap-3">
              {policyLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="font-nunito text-base sm:text-lg leading-7 hover:text-yellow-200 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-alata text-xl leading-8">{resolveText('footer.explore.title', 'Khám phá')}</h3>
            <div className="flex flex-col gap-3">
              {exploreLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="font-nunito text-base sm:text-lg leading-7 hover:text-yellow-200 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-white/30" />

        <div className="w-full flex flex-col items-center gap-3 text-center">
          <p className="font-nunito text-sm sm:text-base leading-6">
            {resolveText('footer.copyright', 'Copyright © 2025 Hoalachandicraft · All Rights Reserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
