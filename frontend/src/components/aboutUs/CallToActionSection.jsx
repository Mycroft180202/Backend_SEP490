import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';
import { PRIMARY_BUTTON_CLASS, SECTION_SUBTITLE_CLASS, SECTION_TITLE_CLASS } from '../../utils/homeTheme';

const CallToActionSection = () => {
  const { t } = useContext(LanguageContext);
  const title = t('about.breadcrumbCurrent');

  return (
    <section className="relative px-4 sm:px-8 lg:px-12 pb-16 sm:pb-20">
      <div className="max-w-6xl mx-auto rounded-[36px] bg-gradient-to-br from-white/80 via-white/60 to-white/80 border border-white/60 shadow-[0_30px_70px_rgba(28,53,94,0.10)] overflow-hidden">
        <div className="p-8 sm:p-12 lg:p-14 text-center">
          <h2 className={`${SECTION_TITLE_CLASS} !text-[#1C355E]`}>{title}</h2>
          <p className={`${SECTION_SUBTITLE_CLASS} mt-4 max-w-3xl mx-auto`}>
            {t(
              'about.cloudIntro.description',
            )}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/shop" className={PRIMARY_BUTTON_CLASS}>
              {t('shop.banner.cta')}
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#1C355E]/20 text-[#1C355E] text-sm md:text-base font-semibold bg-white/70 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-[#1C355E]/40 focus:ring-offset-2"
            >
              {t('contact.title', 'Liên hệ')}
            </Link>
          </div>
        </div>
        <div className="h-2 bg-gradient-to-r from-[#AE4644] via-[#FBC04C] to-[#1C355E]" />
      </div>
    </section>
  );
};

export default CallToActionSection;

