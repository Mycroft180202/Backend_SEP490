import React, { useContext, useMemo } from 'react';
import { LanguageContext } from '../../context/LanguageContext';

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
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-background/40 to-background py-16 sm:py-20 lg:py-24">
      <Wave className="absolute inset-x-0 -top-12 text-background/60" />
      <Wave className="absolute inset-x-0 -bottom-12 rotate-180 text-white/70" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <p className="font-alata text-2xl sm:text-3xl text-brand-900 leading-relaxed">
              {t('about.cloudIntro.description')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {highlightItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-white/80 border border-white/60 shadow-lg px-4 py-5 text-sm sm:text-base text-brand-900 backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="w-full max-w-md h-[280px] sm:h-[320px] rounded-[32px] bg-gradient-to-br from-primary-soft to-white shadow-2xl border border-white/60 overflow-hidden">
              <img
                src="/images/WhyUsSection.jpg"
                alt="Hoa Lac craft village"
                className="w-full h-full object-cover mix-blend-multiply"
              />
            </div>
            <div className="hidden lg:block absolute -left-10 -bottom-6 w-24 h-24 rounded-full border-2 border-dashed border-accent/60 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CloudIntroSection;
