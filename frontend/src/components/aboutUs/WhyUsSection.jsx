import React, { useContext, useMemo } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { SECTION_SUBTITLE_CLASS, SECTION_TITLE_CLASS } from '../../utils/homeTheme';

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
    <section className="bg-[#FFF6E9] px-4 sm:px-8 lg:px-12 pb-14 lg:pb-20">
      <div className="max-w-6xl mx-auto rounded-[36px] bg-white/70 border border-white/60 shadow-[0_30px_70px_rgba(28,53,94,0.10)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center p-8 sm:p-12 lg:p-14">
          <div className="space-y-4 text-center lg:text-left">
            <p className={`${SECTION_SUBTITLE_CLASS} !text-[#AE4644] font-semibold`}>{t('about.whyUs.titleLine1')}</p>
            <h2 className={`${SECTION_TITLE_CLASS} !text-[#1C355E]`}>{t('about.whyUs.titleLine2')}</h2>
            <div className="hidden lg:block w-20 h-1 rounded-full bg-[#FBC04C] mt-5" />
          </div>
          <div className="relative flex justify-center">
            <div className="w-full max-w-md h-[320px] sm:h-[380px] rounded-[28px] overflow-hidden border border-white/60 shadow-[0_24px_60px_rgba(28,53,94,0.16)]">
              <img
                src="/images/WhyUsSection.jpg"
                alt={t('about.whyUs.titleLine2')}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -right-8 -top-8 hidden lg:block h-24 w-24 rounded-full bg-[#FBC04C]/25 blur-sm" />
          </div>
        </div>

        <div className="px-8 sm:px-12 lg:px-14 pb-10 sm:pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reasons.map((reason) => (
              <article
                key={reason}
                className="rounded-3xl bg-white border border-[#1C355E]/10 px-6 py-6 text-[#3C4A66] text-sm sm:text-base leading-relaxed shadow-[0_18px_40px_rgba(28,53,94,0.08)] hover:border-[#FBC04C]/60 transition-colors"
              >
                {reason}
              </article>
            ))}
          </div>
        </div>

        <div className="h-1.5 bg-gradient-to-r from-[#1C355E] via-[#FBC04C] to-[#AE4644]" />
      </div>
    </section>
  );
};

export default WhyUsSection;
