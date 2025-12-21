import React, { useContext, useMemo } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { SECTION_SUBTITLE_CLASS, SECTION_TITLE_CLASS } from '../../utils/homeTheme';

const Wave = ({ className }) => (
  <svg className={`w-full h-16 ${className}`} viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <path
      d="M0 120 C240 40 480 40 720 120 C960 200 1200 200 1440 120 L1440 0 L0 0 Z"
      fill="currentColor"
    />
  </svg>
);

const CloudIntroSection = () => {
  const { t } = useContext(LanguageContext);
  const highlightItems = useMemo(
    () => [
      t('about.mission.items.first'),
      t('about.mission.items.second'),
      t('about.mission.items.third'),
    ],
    [t],
  );

  return (
    <section className="relative overflow-hidden bg-[#FFF6E9] py-16 sm:py-20 lg:py-24">
      <Wave className="absolute inset-x-0 -top-12 text-[#1C355E]/10" />
      <Wave className="absolute inset-x-0 -bottom-12 rotate-180 text-white/70" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="space-y-10 text-center lg:text-left">
          <div className="space-y-6">
            <h2 className={`${SECTION_TITLE_CLASS} !text-[#1C355E]`}>{t('about.breadcrumbCurrent')}</h2>
            <p className={`${SECTION_SUBTITLE_CLASS} text-[#25344F] leading-relaxed`}>{t('about.cloudIntro.description')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {highlightItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-white/80 border border-white/60 shadow-[0_18px_40px_rgba(28,53,94,0.10)] px-4 py-5 text-sm sm:text-base text-[#1C355E] backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CloudIntroSection;
