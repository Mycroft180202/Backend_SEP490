import React, { useContext, useMemo } from 'react';
import { LanguageContext } from '../../context/LanguageContext';

const WhyUsSection = () => {
  const { t } = useContext(LanguageContext);
  const reasons = useMemo(
    () => [
      t('about.whyUs.reasons.first'),
      t('about.whyUs.reasons.second'),
      t('about.whyUs.reasons.third'),
      t('about.whyUs.reasons.fourth'),
    ],
    [t],
  );

  return (
    <section className="bg-primary-soft/25 px-4 sm:px-8 lg:px-16 py-14 lg:py-20">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
        <div className="flex-1 text-center lg:text-left space-y-3">
          <p className="font-alata text-primary text-2xl sm:text-3xl">{t('about.whyUs.titleLine1')}</p>
          <p className="font-alata text-3xl sm:text-4xl text-brand-900 font-semibold">{t('about.whyUs.titleLine2')}</p>
          <div className="hidden lg:block w-16 h-1 bg-accent mt-4" />
        </div>
        <div className="flex-1 max-w-md w-full">
          <img
            src="/images/WhyUsSection.jpg"
            alt={t('about.whyUs.titleLine2')}
            className="w-full h-[320px] sm:h-[420px] object-cover rounded-[24px] shadow-2xl border border-white/60"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reasons.map((reason) => (
          <article
            key={reason}
            className="rounded-2xl bg-white/80 border border-brand-600/20 px-6 py-5 text-brand-900 text-base sm:text-lg leading-relaxed shadow-md hover:border-accent transition-colors"
          >
            {reason}
          </article>
        ))}
      </div>
    </section>
  );
};

export default WhyUsSection;
